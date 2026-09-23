from PIL import Image
import os
import shutil

os.makedirs('client/public/assets/avatars', exist_ok=True)

# 1. Save table background 4.png
table_img = Image.open('4.png')
# Save as table_bg.png in client/public/assets
table_img.save('client/public/assets/table_bg.png', 'PNG')
print(f"Saved client/public/assets/table_bg.png (size: {table_img.size})")

# 2. Slice 6 avatars from 5.png
avatars_img = Image.open('5.png')

avatar_boxes = {
    'murad': (63, 66, 519, 517),
    'adam': (543, 66, 1001, 517),
    'player': (543, 66, 1001, 517),
    'ramil': (1019, 66, 1474, 517),
    'zara': (57, 520, 510, 967),
    'kamil': (538, 520, 996, 967),
    'avatar6': (1025, 520, 1478, 967)
}

for name, box in avatar_boxes.items():
    av = avatars_img.crop(box)
    out_path = os.path.join('client/public/assets/avatars', f"{name}.png")
    av.save(out_path, 'PNG')
    print(f"Saved {name}.png, size: {av.size}")

print("All avatars sliced and saved successfully.")
