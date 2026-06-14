import os
import shutil
import glob

brain_dir = r"C:\Users\justd\.gemini\antigravity-ide\brain\2083a1b4-5fc8-4e19-8766-7a727a92c638"
assets_dir = r"e:\photo enhancer\assets"
os.makedirs(assets_dir, exist_ok=True)

mappings = {
    "model_portrait_bw": "card1.png",
    "modern_architecture": "card2.png",
    "glasses_model_golden": "card3.png",
    "liquid_metal_waves": "card4.png",
    "male_model_thoughtful": "card5.png",
    "demo_enhancer": "demo.png"
}

for name_key, dest_name in mappings.items():
    pattern = os.path.join(brain_dir, f"{name_key}_*.png")
    matches = glob.glob(pattern)
    if matches:
        # Get the latest match
        matches.sort(key=os.path.getmtime)
        src = matches[-1]
        dest = os.path.join(assets_dir, dest_name)
        shutil.copy2(src, dest)
        print(f"Copied {os.path.basename(src)} -> {dest}")
    else:
        print(f"No match found for: {name_key}")

print("Assets copy complete!")
