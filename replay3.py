import json
import os

paths = [
    r'C:\Users\hoang\.gemini\antigravity-ide\brain\54cc1c62-3717-4f21-bca2-33d0d1300fb4\.system_generated\logs\transcript_full.jsonl',
    r'C:\Users\hoang\.gemini\antigravity-ide\brain\5f9feb95-2a5c-4dfa-af04-380c75b3e722\.system_generated\logs\transcript_full.jsonl',
    r'C:\Users\hoang\.gemini\antigravity-ide\brain\98f21cd7-26aa-4469-83f6-36e5b86353c0\.system_generated\logs\transcript_full.jsonl'
]

# We start with the git HEAD state of the file
with open(r'src\app\components\ClientApp.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_lines(content, start_line, end_line, replacement, target):
    lines = content.split('\n')
    start_idx = start_line - 1
    end_idx = end_line
    slice_content = '\n'.join(lines[start_idx:end_idx])
    if target in slice_content:
        slice_content = slice_content.replace(target, replacement, 1)
    
    new_lines = slice_content.split('\n')
    lines[start_idx:end_idx] = new_lines
    return '\n'.join(lines)

for path in paths:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if 'tool_calls' in data:
                        for call in data['tool_calls']:
                            args = call.get('args', {})
                            target_file = args.get('TargetFile', '')
                            if not target_file.endswith('ClientApp.tsx'):
                                continue
                            
                            name = call.get('name')
                            if name == 'write_to_file':
                                content = args['CodeContent']
                            elif name == 'replace_file_content':
                                content = replace_lines(content, args['StartLine'], args['EndLine'], args['ReplacementContent'], args['TargetContent'])
                            elif name == 'multi_replace_file_content':
                                chunks = sorted(args['ReplacementChunks'], key=lambda x: x['StartLine'], reverse=True)
                                for chunk in chunks:
                                    content = replace_lines(content, chunk['StartLine'], chunk['EndLine'], chunk['ReplacementContent'], chunk['TargetContent'])
                except Exception as e:
                    pass

with open('recovered_ClientApp.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replayed all changes to recovered_ClientApp.tsx')
