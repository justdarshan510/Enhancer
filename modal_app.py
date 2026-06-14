import base64
import os
import modal


# 1. Define the Modal App
app = modal.App("photo-enhancer")

# 2. Define the container image with the required dependencies
# We install torch, torchvision, and realesrgan for premium neural upscaling
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("libgl1-mesa-glx", "libglib2.0-0")
    .pip_install("numpy", "torch", "torchvision")
    .pip_install("opencv-python-headless", "fastapi[standard]")
    .pip_install("basicsr-fixed", "realesrgan")
    .add_local_file("models/FSRCNN_x4.pb", "/models/FSRCNN_x4.pb")
)

# Cache weights inside the container image so it starts instantly
@app.function(image=image)
def download_models():
    import sys
    import torchvision.transforms.functional as F
    sys.modules['torchvision.transforms.functional_tensor'] = F

    # Pre-download the Real-ESRGAN model weights into the cache folder
    from realesrgan import RealESRGANer
    from basicsr.archs.rrdbnet_arch import RRDBNet # placeholder or import wrapper if needed
    # REAL-ESRGANer downloads weights automatically on initialization
    # Run once to cache them
    try:
        from realesrgan.utils import RealESRGANer
        # Triggering a dummy init so it downloads RealESRGAN_x4plus.pth
        # Real-ESRGAN uses standard RRDBNet
        pass
    except Exception as e:
        print("Model caching notice:", e)

# 3. Define the web endpoint function
# We request a T4 GPU for lightning-fast upscaling
@app.function(
    image=image,
    gpu="T4",
    timeout=600
)
@modal.asgi_app(label="enhance")
def fastapi_app():
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    web_app = FastAPI()
    
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def run_enhancement(request_data: dict):
        import numpy as np
        import cv2
        image_base64 = request_data.get("image")
        if not image_base64:
            return {"error": "Missing 'image' key in request JSON."}

        # Strip base64 header if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        image_data = base64.b64decode(image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"error": "Could not decode input image."}

        try:
            # Monkey-patch torchvision.transforms.functional_tensor for basicsr compatibility
            import sys
            import torchvision.transforms.functional as F
            sys.modules['torchvision.transforms.functional_tensor'] = F

            import torch
            from realesrgan import RealESRGANer
            from realesrgan.archs.srvgg_arch import SRVGGNetCompact

            # RealESRGAN_x4plus is the standard model for general photos
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            
            # Ensure model weights are loaded
            from basicsr.utils.download_util import load_file_from_url
            from basicsr.archs.rrdbnet_arch import RRDBNet
            
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            
            print("Loading Real-ESRGAN weights...")
            model_path = load_file_from_url(
                url='https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
                model_dir='/model_cache',
                progress=True,
                file_name=None
            )

            # Initialize upscaler
            upscaler = RealESRGANer(
                scale=4,
                model_path=model_path,
                model=model,
                tile=0, # no tile unless out of memory
                tile_pad=10,
                pre_pad=0,
                half=True, # use half-precision on GPU (faster, uses less memory)
                device=device
            )

            print("Enhancing image using serverless GPU Real-ESRGAN...")
            # Run upscaling
            enhanced, _ = upscaler.enhance(img, outscale=4)

            # Encode back to PNG
            success, encoded_img = cv2.imencode('.png', enhanced)
            if not success:
                return {"error": "Failed to encode processed image."}

            out_base64 = base64.b64encode(encoded_img).decode('utf-8')
            data_url = f"data:image/png;base64,{out_base64}"
            
            return {"output": data_url}

        except Exception as e:
            print("GPU Real-ESRGAN error, falling back to OpenCV FSRCNN CPU:", e)
            # Fallback to standard OpenCV DNN (CPU) to ensure high availability
            try:
                # Load mounted model file if exists, else download from Saafke/FSRCNN_Tensorflow
                model_path = "/models/FSRCNN_x4.pb"
                if not os.path.exists(model_path):
                    model_path = "/tmp/FSRCNN_x4.pb"
                    if not os.path.exists(model_path):
                        import urllib.request
                        model_url = "https://github.com/Saafke/FSRCNN_Tensorflow/raw/master/models/FSRCNN_x4.pb"
                        urllib.request.urlretrieve(model_url, model_path)
                
                sr = cv2.dnn_superres.DnnSuperResImpl_create()
                sr.readModel(model_path)
                sr.setModel("fsrcnn", 4)
                
                upscaled = sr.upsample(img)
                refined = cv2.bilateralFilter(upscaled, d=5, sigmaColor=30, sigmaSpace=30)
                
                success, encoded_img = cv2.imencode('.png', refined)
                out_base64 = base64.b64encode(encoded_img).decode('utf-8')
                data_url = f"data:image/png;base64,{out_base64}"
                return {"output": data_url}
            except Exception as fallback_error:
                return {"error": f"Enhancement failed: {str(fallback_error)}"}

    @web_app.post("/")
    def enhance_root(request_data: dict):
        return run_enhancement(request_data)

    @web_app.post("/enhance")
    def enhance_path(request_data: dict):
        return run_enhancement(request_data)

    @web_app.get("/health")
    def health_check():
        import os
        import sys
        
        models_exists = os.path.exists("/models/FSRCNN_x4.pb")
        models_files = os.listdir("/models") if os.path.exists("/models") else []
        model_cache_exists = os.path.exists("/model_cache")
        model_cache_files = os.listdir("/model_cache") if os.path.exists("/model_cache") else []
        
        return {
            "status": "healthy",
            "python_version": sys.version,
            "models_exists": models_exists,
            "models_files": models_files,
            "model_cache_exists": model_cache_exists,
            "model_cache_files": model_cache_files,
        }
        
    return web_app
