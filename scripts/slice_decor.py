from PIL import Image
import os

table = Image.open('photo_2026-09-23_21-19-58.jpg')
os.makedirs('client/public/assets/decor', exist_ok=True)

# 1. Armudu tea glass bottom left
tea_bottom = table.crop((0, 1130, 160, 1290))
tea_bottom.save('client/public/assets/decor/tea_bottom.png')

# 2. Hookah bottom right
hookah = table.crop((730, 1000, 941, 1550))
hookah.save('client/public/assets/decor/hookah.png')

# 3. Nuts top right
nuts_top = table.crop((740, 65, 890, 165))
nuts_top.save('client/public/assets/decor/nuts_top.png')

# 4. Tea top right
tea_top = table.crop((840, 110, 941, 220))
tea_top.save('client/public/assets/decor/tea_top.png')

# 5. Plant top left
plant_top = table.crop((0, 0, 200, 200))
plant_top.save('client/public/assets/decor/plant_top.png')

print("Decor assets extracted successfully.")
