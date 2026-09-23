from PIL import Image
import os

os.makedirs('client/public/assets/cards', exist_ok=True)
os.makedirs('client/public/assets/avatars', exist_ok=True)

# 1. Slice 36 cards from 1.png (transparent background sheet with dual corner ranks)
card_sheet = Image.open('1.png')

rows = [
    (49, 266),   # HEARTS
    (279, 496),  # DIAMONDS
    (511, 729),  # CLUBS
    (743, 973)   # SPADES
]

cols = [
    (19, 173),   # 6
    (183, 337),  # 7
    (348, 503),  # 8
    (514, 672),  # 9
    (683, 836),  # 10
    (846, 1000), # J
    (1011, 1176),# Q
    (1187, 1356),# K
    (1367, 1518) # A
]

suits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES']
ranks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

for r_idx, suit in enumerate(suits):
    y1, y2 = rows[r_idx]
    for c_idx, rank in enumerate(ranks):
        x1, x2 = cols[c_idx]
        card = card_sheet.crop((x1, y1, x2, y2))
        filename = f"{suit}_{rank}.png"
        card.save(os.path.join('client/public/assets/cards', filename), 'PNG')

print("Saved all 36 updated cards from 1.png successfully.")

# 2. Save new single card back from 2.png
back_img = Image.open('2.png')
back_bbox = back_img.getbbox() # (49, 33, 945, 1500)
card_back = back_img.crop(back_bbox)
card_back.save('client/public/assets/cards/BACK.png', 'PNG')
print(f"Saved updated card back BACK.png (size: {card_back.size})")

# 3. Save new 3D deck stack image from 3.png
deck_img = Image.open('3.png')
deck_bbox = deck_img.getbbox() # (111, 53, 1042, 1409)
deck_crop = deck_img.crop(deck_bbox)
deck_crop.save('client/public/assets/cards/DECK.png', 'PNG')
print(f"Saved updated 3D deck DECK.png (size: {deck_crop.size})")
