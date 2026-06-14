import cv2
import os

video_path = "original-1684157f61f4d6e83706e9c01c118ca4.mp4"
output_dir = "extracted_frames"
os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("Error: Could not open video.")
    exit(1)

fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
duration = total_frames / fps if fps > 0 else 0

print(f"Video Info:")
print(f"Resolution: {width}x{height}")
print(f"FPS: {fps}")
print(f"Total Frames: {total_frames}")
print(f"Duration: {duration:.2f} seconds")

# Extract 10 evenly spaced frames
for i in range(10):
    frame_idx = int((i / 9.0) * (total_frames - 1))
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    if ret:
        out_path = os.path.join(output_dir, f"frame_{i}.jpg")
        cv2.imwrite(out_path, frame)
        print(f"Saved {out_path} at frame {frame_idx}")
    else:
        print(f"Failed to read frame {frame_idx}")

cap.release()
print("Done extracting frames!")
