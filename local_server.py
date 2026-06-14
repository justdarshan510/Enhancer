import os
import sys
import json
import base64
import tempfile
import cv2
import numpy as np
from http.server import HTTPServer, BaseHTTPRequestHandler

class LocalEnhanceHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/enhance-local':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                image_base64 = data.get('image')
                if not image_base64:
                    self.send_error_response("Missing 'image' key in request JSON.")
                    return
                
                # Strip base64 header if present
                if ',' in image_base64:
                    image_base64 = image_base64.split(',')[1]
                
                image_data = base64.b64decode(image_base64)
                
                # Decode bytes to OpenCV image
                nparr = np.frombuffer(image_data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is None:
                    self.send_error_response("Could not decode input image.")
                    return
                
                h, w = img.shape[:2]
                max_dim = max(h, w)
                
                # Check if the image is already high-resolution (>= 1200px)
                if max_dim >= 1200:
                    print(f"Input image is already high-resolution ({w}x{h}). Enhancing directly without downscaling.")
                    # Direct edge-preserving detail enhancement
                    refined = cv2.bilateralFilter(img, d=5, sigmaColor=25, sigmaSpace=25)
                    # Mild unsharp masking to pop details
                    blur = cv2.GaussianBlur(refined, (3, 3), 1.0)
                    refined = cv2.addWeighted(refined, 1.4, blur, -0.4, 0)
                else:
                    # Input is low/medium resolution. Let's neural-upscale it.
                    # Load pre-trained FSRCNN model
                    root_dir = os.path.dirname(os.path.abspath(__file__))
                    model_path = os.path.join(root_dir, 'models', 'FSRCNN_x4.pb')
                    
                    if not os.path.exists(model_path):
                        self.send_error_response(f"Model file not found at {model_path}. Make sure download succeeded.")
                        return
                    
                    # Initialize DnnSuperRes
                    sr = cv2.dnn_superres.DnnSuperResImpl_create()
                    sr.readModel(model_path)
                    sr.setModel("fsrcnn", 4)
                    
                    print(f"Processing low-res image ({w}x{h}): running OpenCV FSRCNN 4x upscaling...")
                    upscaled = sr.upsample(img)
                    
                    # Smooth pixelation and compression noise in the upscaled image
                    refined = cv2.bilateralFilter(upscaled, d=5, sigmaColor=30, sigmaSpace=30)
                
                # Encode back to PNG
                success, encoded_img = cv2.imencode('.png', refined)
                if not success:
                    self.send_error_response("Failed to encode processed image.")
                    return
                
                out_base64 = base64.b64encode(encoded_img).decode('utf-8')
                data_url = f"data:image/png;base64,{out_base64}"
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(json.dumps({'output': data_url}).encode('utf-8'))
                print("Image upscaled successfully using OpenCV DNN!")
                
            except Exception as e:
                print("Error processing image:", e)
                self.send_error_response(str(e))
        else:
            self.send_error(404, "Not Found")

    def send_error_response(self, message):
        self.send_response(500)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode('utf-8'))

def run(port=8002):
    server_address = ('', port)
    httpd = HTTPServer(server_address, LocalEnhanceHandler)
    print(f"Local OpenCV DNN Super-Resolution server running at http://localhost:{port}/")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping local backend server.")
        httpd.server_close()

if __name__ == '__main__':
    run()
