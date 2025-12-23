import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

# 1. AUTHENTICATION & ENVIRONMENT SETUP
load_dotenv()
project_root = Path(__file__).parent
input_dir = project_root / "rules_json"
output_file = project_root / "FINAL_RULES.md"

# Initialize Client
client = genai.Client(
    vertexai=True,
    project=os.environ.get("GOOGLE_PROJECT_ID"),
    location="global"
)

def get_combined_text():
    """Loads all JSON files in order and returns the concatenated text."""
    json_files = sorted(list(input_dir.glob("rules_*.json")), 
                       key=lambda p: int(re.search(r'\d+', p.name).group()))
    
    combined_content = []
    for json_path in json_files:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            text = data.get('text', '')
            if text:
                combined_content.append(f"--- Page {json_path.stem.split('_')[-1]} ---\n{text}")
    
    return "\n\n".join(combined_content)

def process_with_gemini(text):
    """Uses Gemini 3 Flash to format the rulebook."""
    print("🚀 Sending rules to Gemini 3 Flash for formatting...")
    
    prompt = (
        "You are an expert rulebook editor. I am providing you with the raw text extracted from "
        "a board game rulebook (Skull King). The text is separated by page markers.\n\n"
        "Please perform the following tasks:\n"
        "1. Combine the text into a single, cohesive, and well-structured Markdown document.\n"
        "2. Fix any obvious OCR errors or typos.\n"
        "3. Use appropriate Markdown headers (#, ##, ###) for sections and subsections.\n"
        "4. Format lists, bold text, and highlights for better readability.\n"
        "5. Ensure the flow is logical and consistent.\n"
        "6. Keep the language in French (as in the source).\n\n"
        "Here is the raw text:\n\n"
    )
    
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt + text
        )
        return response.text
    except Exception as e:
        print(f"❌ Error during Gemini processing: {e}")
        return None

def main():
    if not input_dir.exists():
        print(f"⚠️ Input directory {input_dir} not found.")
        return

    raw_text = get_combined_text()
    if not raw_text:
        print("⚠️ No text found in JSON files.")
        return

    final_rules = process_with_gemini(raw_text)
    
    if final_rules:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(final_rules)
        print(f"✅ Successfully generated {output_file}")
    else:
        print("❌ Failed to generate final rules.")

if __name__ == "__main__":
    main()
