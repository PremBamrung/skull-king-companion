import json
import os
import re

def compile_rules():
    input_dir = 'rules_json'
    output_file = 'RULES.md'
    
    # Get all json files in the directory
    json_files = [f for f in os.listdir(input_dir) if f.endswith('.json')]
    
    # Sort files numerically (rules_001.json, rules_002.json, etc.)
    # We use a regex to extract the number part for sorting
    json_files.sort(key=lambda f: int(re.search(r'\d+', f).group()))
    
    compiled_text = []
    
    for filename in json_files:
        file_path = os.path.join(input_dir, filename)
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            text = data.get('text', '')
            if text:
                compiled_text.append(text)
    
    # Join the texts with three newlines (one separator + empty lines)
    # This helps separate pages clearly in Markdown
    final_content = '\n\n---\n\n'.join(compiled_text)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(final_content)
    
    print(f"Successfully compiled {len(compiled_text)} pages into {output_file}")

if __name__ == "__main__":
    compile_rules()
