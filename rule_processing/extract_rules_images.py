import os
import json
import asyncio
from pathlib import Path
from tqdm.asyncio import tqdm
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image

# 1. AUTHENTICATION & ENVIRONMENT SETUP
load_dotenv()
project_root = Path(__file__).parent
output_dir = project_root / "rules_json"
output_dir.mkdir(exist_ok=True)

# Initialize Client
client = genai.Client(
    vertexai=True,
    project=os.environ.get("GOOGLE_PROJECT_ID"),
    location="global"
)

# ---------------------------------------------------------
# 2. ASYNC PROCESSING LOGIC
# ---------------------------------------------------------

async def process_image(sem, image_path, client):
    """Processes a single image: extracts text and descriptions, and saves to JSON."""
    async with sem:
        try:
            if not image_path.exists():
                return {"error": f"File {image_path} not found"}

            image = Image.open(image_path)
            
            prompt = (
                "Extract the text and rules of the game from this image. "
                "Output the text in Markdown format. "
                "Also provide a detailed description of any images, diagrams, or illustrations "
                "if they are relevant to understanding the rules. "
                "Return the result as a JSON object with keys 'text' and 'description'."
            )

            # Generate content using the async client
            response = await client.aio.models.generate_content(
                model="gemini-3-flash-preview",
                contents=[image, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema={
                        "type": "OBJECT",
                        "properties": {
                            "text": {"type": "STRING"},
                            "description": {"type": "STRING"}
                        },
                        "required": ["text", "description"]
                    }
                )
            )

            # Parse the response text
            result = json.loads(response.text)
            
            # Save to JSON file
            output_path = output_dir / f"{image_path.stem}.json"
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            
            return {"status": "success", "file": image_path.name}

        except Exception as e:
            return {"status": "error", "file": image_path.name, "message": str(e)}

async def main():
    # Find all relevant images
    images_dir = project_root / "images"
    image_files = sorted(list(images_dir.glob("rules_*.jpeg")))
    
    if not image_files:
        print(f"⚠️ No images found in {images_dir}")
        return

    print(f"🚀 Starting extraction for {len(image_files)} images...")
    
    # Semaphore to limit concurrency to 10
    sem = asyncio.Semaphore(10)
    
    # Create tasks
    tasks = [process_image(sem, img, client) for img in image_files]
    
    # Run tasks with progress bar
    results = await tqdm.gather(*tasks, desc="Extracting rules")
    
    # Summary
    success_count = sum(1 for r in results if r.get("status") == "success")
    error_count = len(results) - success_count
    
    print(f"\n✅ Finished! Successfully processed: {success_count}")
    if error_count > 0:
        print(f"❌ Errors encountered: {error_count}")
        for r in results:
            if r.get("status") == "error":
                print(f"   - {r['file']}: {r['message']}")

if __name__ == "__main__":
    asyncio.run(main())
