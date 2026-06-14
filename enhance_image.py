import cv2
import numpy as np

def enhance_image(input_path, output_path):
    # 1. Load the low quality image
    img = cv2.imread(input_path)
    if img is None:
        print(f"Error: Could not load image from {input_path}")
        return
    
    h, w, c = img.shape
    print(f"Original image size: {w}x{h}")
    
    # We want to upscale it significantly (e.g., 4x upscale to represent 4K enhancement)
    scale_factor = 4
    new_w = w * scale_factor
    new_h = h * scale_factor
    
    # 2. Upscale using Lanczos interpolation (excellent for preserving details compared to simple bilinear)
    upscaled = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
    
    # 3. Apply Bilateral Filter to remove compression blocks/pixel noise while keeping edges sharp
    # d=9 (pixel neighborhood), sigmaColor=75, sigmaSpace=75
    denoised = cv2.bilateralFilter(upscaled, d=9, sigmaColor=50, sigmaSpace=50)
    
    # 4. Apply Unsharp Masking to remove blurriness
    # Blur the denoised image
    gaussian_blur = cv2.GaussianBlur(denoised, (5, 5), 10.0)
    # Weighted combination: enhanced = 1.6 * denoised - 0.6 * blurred
    sharpened = cv2.addWeighted(denoised, 1.8, gaussian_blur, -0.8, 0)
    
    # 5. Fine detail enhancement - boost detail edges
    # We can convert to YCrCb, apply CLAHE (Contrast Limited Adaptive Histogram Equalization) on Luma, then convert back
    ycrcb = cv2.cvtColor(sharpened, cv2.COLOR_BGR2YCrCb)
    channels = list(cv2.split(ycrcb))
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    channels[0] = clahe.apply(channels[0])
    ycrcb = cv2.merge(channels)
    detailed = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
    
    # 6. Inject a tiny bit of fine grain (gives that premium 4K UHD camera sensor feel)
    noise = np.random.normal(0, 3, detailed.shape).astype(np.int8)
    enhanced = cv2.add(detailed, noise, dtype=cv2.CV_8U)
    
    # 7. Save result
    cv2.imwrite(output_path, enhanced)
    print(f"Enhanced image saved successfully to {output_path} ({new_w}x{new_h})")

if __name__ == "__main__":
    enhance_image("low quality image.jpg", "assets/enhanced_uploaded.png")
