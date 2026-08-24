import json
import os

paths = [
    r'C:\Users\hoang\.gemini\antigravity-ide\brain\5f9feb95-2a5c-4dfa-af04-380c75b3e722\.system_generated\logs\transcript_full.jsonl',
    r'C:\Users\hoang\.gemini\antigravity-ide\brain\54cc1c62-3717-4f21-bca2-33d0d1300fb4\.system_generated\logs\transcript_full.jsonl'
]

for path in paths:
    events = []
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if 'tool_calls' in data:
                        for call in data['tool_calls']:
                            if 'ClientApp.tsx' in str(call) and call.get('name') in ('write_to_file', 'replace_file_content', 'multi_replace_file_content'):
                                events.append(call)
                except:
                    pass

        print(f'Found {len(events)} modify calls in {os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(path))))}')
        if events:
            last = events[-1]
            print(f'Last call: {last.get("name")}')
            with open('recovered_ClientApp.tsx', 'w', encoding='utf-8') as f:
                if last.get("name") == 'write_to_file':
                    f.write(last['args']['CodeContent'])
                elif last.get("name") == 'replace_file_content':
                    f.write(last['args']['ReplacementContent'])
            print('Wrote recovered content to recovered_ClientApp.tsx')
    else:
        print(f'Path not found: {path}')
