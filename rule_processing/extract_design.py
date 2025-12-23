import os
import re
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
import PIL.Image
from tqdm.asyncio import tqdm

# 1. AUTHENTICATION & ENVIRONMENT SETUP
load_dotenv()
project_root = Path(__file__).parent
image_dir = project_root / "images"
output_file = project_root / "colormap_palette.md"

# Initialize Client
client = genai.Client(
    vertexai=True,
    project=os.environ.get("GOOGLE_PROJECT_ID"),
    location="global"
)

MODEL_NAME = "gemini-3-flash-preview"

def get_image_batches(batch_size=5):
    """Lists images and splits them into batches."""
    image_files = sorted(list(image_dir.glob("*.jpeg")), 
                        key=lambda p: int(re.search(r'\d+', p.name).group()) if re.search(r'\d+', p.name) else p.name)
    
    for i in range(0, len(image_files), batch_size):
        yield image_files[i:i + batch_size]

async def extract_design_from_batch(batch):
    """Sends a batch of images to Gemini to extract design elements."""
    contents = [
        "You are a professional UI/UX designer and brand specialist. I am providing you with images from a board game rulebook (Skull King).",
        "Please analyze these images and extract the following information:",
        "1. Dominant colors and their hex codes (if possible, or descriptive names).",
        "2. Description of the card designs, icons, and illustrations.",
        "3. Typography styles (serif/sans-serif, bold, decorative).",
        "4. General aesthetic (e.g., pirate-themed, nautical, vintage, vibrant, dark).",
        "5. Specific UI elements found in the rules (buttons, tables, borders, callouts)."
    ]
    
    for img_path in batch:
        img = PIL.Image.open(img_path)
        contents.append(img)

    try:
        # Use asyncio.to_thread if the SDK is not natively async, 
        # but usually genai client has async methods if using Vertex AI or similar.
        # Looking at the code, it uses client.models.generate_content.
        # If it doesn't have an async version, we use to_thread.
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=contents
        )
        return response.text
    except Exception as e:
        print(f"❌ Error during batch processing: {e}")
        return ""

async def synthesize_design_guide(extracted_info):
    """Reduces all batch information into a final design guide."""
    print("✨ Synthesizing final design guide (Modern Version)...")
    
    prompt = (
        "You are a lead frontend developer and UI/UX designer. Based on the following extracted design information "
        "from the Skull King board game rulebook, create a comprehensive Markdown design guide for a MODERN companion app.\n\n"
        "IMPORTANT: The user wants a MODERN, CLEAN look, not a clunky or skeuomorphic treasure map. "
        "Extract the essence of the colors and themes but apply them to a modern, professional interface.\n\n"
        "The guide should include:\n"
        "1. A Modern Color Palette section with hex codes and usage instructions (Primary, Secondary, Surface, Background, Text).\n"
        "2. Modern Typography recommendations (high-quality Sans-serif or crisp Serif).\n"
        "3. UI Component instructions: Clean cards, modern buttons (rounded-lg), Glassmorphism hints, and clear spacing.\n"
        "4. Visual Assets: Minimalist icons and subtle decorative elements that hint at the nautical theme without being literal.\n"
        "5. CSS/Tailwind configuration suggestions to implement this modern theme.\n\n"
        "Extracted Information:\n\n"
    )
    
    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=prompt + extracted_info
        )
        return response.text
    except Exception as e:
        print(f"❌ Error during synthesis: {e}")
        return None

async def main():
    if not image_dir.exists():
        print(f"⚠️ Image directory {image_dir} not found.")
        return

    batches = list(get_image_batches(batch_size=5))
    
    tasks = [extract_design_from_batch(batch) for batch in batches]
    
    results = await tqdm.gather(*tasks, desc="Processing image batches")
    
    all_extracted_info = []
    for i, info in enumerate(results):
        if info:
            all_extracted_info.append(f"--- Batch {i+1} Analysis ---\n{info}")

    if not all_extracted_info:
        print("⚠️ No information extracted from images.")
        return

    combined_info = "\n\n".join(all_extracted_info)
    final_guide = await synthesize_design_guide(combined_info)
    
    if final_guide:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(final_guide)
        print(f"✅ Successfully generated {output_file}")
    else:
        print("❌ Failed to generate final design guide.")

if __name__ == "__main__":
    asyncio.run(main())
