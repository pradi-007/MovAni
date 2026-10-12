import re
import os

def check():
    ui = open('frontend/js/ui.js', encoding='utf-8').read()
    app = open('frontend/js/app.js', encoding='utf-8').read()
    player = open('frontend/js/player.js', encoding='utf-8').read()
    html = open('frontend/index.html', encoding='utf-8').read()

    pattern = re.compile(r"getElementById\(['\"]([^'\"]+)['\"]\)")
    ids = set(pattern.findall(ui + app + player))

    missing = []
    for el_id in sorted(ids):
        if f'id="{el_id}"' not in html and f"id='{el_id}'" not in html:
            missing.append(el_id)

    print(f"Total element IDs checked: {len(ids)}")
    print(f"Missing from index.html ({len(missing)}):")
    for m in missing:
        print(f"  - {m}")

if __name__ == '__main__':
    check()
