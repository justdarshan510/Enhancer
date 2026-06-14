import os
import shutil
import glob

brain_dir = r"C:\Users\justd\.gemini\antigravity-ide\brain\2083a1b4-5fc8-4e19-8766-7a727a92c638"
assets_dir = r"e:\photo enhancer\assets"
os.makedirs(assets_dir, exist_ok=True)

mappings = {
    "girl_high_res": "girl_high_res.png",
    "dog_high_res": "dog_high_res.png"
}

for name_key, dest_name in mappings.items():
    pattern = os.path.join(brain_dir, f"{name_key}_*.png")
    matches = glob.glob(pattern)
    if matches:
        matches.sort(key=os.path.getmtime)
        src = matches[-1]
        dest = os.path.join(assets_dir, dest_name)
        shutil.copy2(src, dest)
        print(f"Copied {os.path.basename(src)} -> {dest}")
    else:
        print(f"No match found for: {name_key}")

print("High-res assets copy complete!")
