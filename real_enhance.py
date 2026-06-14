import cv2
import numpy as np

def restore_face(input_path, output_path):
    # Load the original blurry image of the girl
    img = cv2.imread(input_path)
    if img is None:
        print(f"Error: Could not load image {input_path}")
        return
        
    h, w, c = img.shape
    print(f"Loaded image size: {w}x{h}")
    
    # 1. Upscale using Lanczos interpolation to 4x resolution (removes blockiness/jagged edges)
    upscaled = cv2.resize(img, (w * 4, h * 4), interpolation=cv2.INTER_LANCZOS4)
    
    # 2. De-noise & Smooth flat areas (removes the blocky pixelation noise)
    # We use a Bilateral Filter which smooths flat areas (like skin) but leaves edges alone.
    smoothed = cv2.bilateralFilter(upscaled, d=7, sigmaColor=35, sigmaSpace=35)
    
    # 3. Advanced Multi-Scale Unsharp Masking
    # We blur at different scales to sharpen both fine details (eyes) and large boundaries (hair/jawline)
    blur_fine = cv2.GaussianBlur(smoothed, (5, 5), 1.5)
    blur_coarse = cv2.GaussianBlur(smoothed, (9, 9), 4.0)
    
    # Extract details
    detail_fine = cv2.subtract(smoothed, blur_fine)
    detail_coarse = cv2.subtract(smoothed, blur_coarse)
    
    # Add details back with custom weights
    # We boost the fine details (eyes, lashes) by 2.0x, and coarse details by 0.8x
    enhanced = cv2.addWeighted(smoothed, 1.0, detail_fine, 2.2, 0)
    enhanced = cv2.addWeighted(enhanced, 1.0, detail_coarse, 1.0, 0)
    
    # 4. Color Contrast Adjustment (boost highlights and shadows slightly to make it look UHD)
    # We use a Sigmoid-like contrast curve or CLAHE on the Luma channel
    ycrcb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2YCrCb)
    channels = list(cv2.split(ycrcb))
    
    # Apply CLAHE on Luma
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    channels[0] = clahe.apply(channels[0])
    
    ycrcb = cv2.merge(channels)
    contrast_enhanced = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
    
    # 5. Add a tiny bit of micro-noise (gives the pixel-texture depth of 4K cameras)
    noise = np.random.normal(0, 2.5, contrast_enhanced.shape).astype(np.int8)
    final_img = cv2.add(contrast_enhanced, noise, dtype=cv2.CV_8U)
    
    # Save the output
    cv2.imwrite(output_path, final_img)
    print(f"Restored image saved to {output_path}")

if __name__ == "__main__":
    restore_face("low quality image.jpg", "assets/girl_high_res.png")
