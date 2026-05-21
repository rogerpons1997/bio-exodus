from PIL import Image, ImageDraw

img = Image.open('public/bottom-nav-base.png').convert('RGBA')
draw = ImageDraw.Draw(img)

# Dark color that matches the carbon fiber background
dark_bg = (15, 18, 20, 255)

# Estimated bounding boxes for the 5 inner screens
boxes = [
    (65, 50, 210, 220),
    (240, 50, 385, 220),
    (410, 50, 555, 220),
    (585, 50, 730, 220),
    (755, 50, 900, 220)
]

for box in boxes:
    draw.rectangle(box, fill=dark_bg)

img.save('public/bottom-nav-clean.png')
print("Image cleaned and saved as public/bottom-nav-clean.png")

