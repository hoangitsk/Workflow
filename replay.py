import json
import os

paths = [
    r'C:\Users\hoang\.gemini\antigravity-ide\brain\54cc1c62-3717-4f21-bca2-33d0d1300fb4\.system_generated\logs\transcript_full.jsonl',
    r'C:\Users\hoang\.gemini\antigravity-ide\brain\5f9feb95-2a5c-4dfa-af04-380c75b3e722\.system_generated\logs\transcript_full.jsonl'
]

# Get initial state
with open(r'src\app\components\ClientApp.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

for path in paths:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if 'tool_calls' in data:
                        for call in data['tool_calls']:
                            if 'ClientApp.tsx' in str(call):
                                name = call.get('name')
                                args = call.get('args', {})
                                if name == 'write_to_file':
                                    content = args['CodeContent']
                                elif name == 'replace_file_content':
                                    if args['TargetContent'] in content:
                                        content = content.replace(args['TargetContent'], args['ReplacementContent'], 1)
                                elif name == 'multi_replace_file_content':
                                    for chunk in args['ReplacementChunks']:
                                        if chunk['TargetContent'] in content:
                                            content = content.replace(chunk['TargetContent'], chunk['ReplacementContent'], 1)
                except:
                    pass

with open('recovered_ClientApp.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replayed all changes to recovered_ClientApp.tsx')
