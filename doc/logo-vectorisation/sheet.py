"""Planche de contrôle de l'icône : grand format + 16/32/48 px, sur fond clair et sombre."""
import sys

from PIL import Image

src, out = sys.argv[1], sys.argv[2]
big = Image.open(src).convert('RGBA')
W = 420 + 3 * 212
sheet = Image.new('RGBA', (W, 640), (255, 255, 255, 255))
sheet.paste(Image.new('RGBA', (W, 200), (32, 32, 40, 255)), (0, 420))
sheet.alpha_composite(big.resize((400, 400), Image.LANCZOS), (0, 0))
x = 420
for z in (16, 32, 48):
    im = big.resize((z, z), Image.LANCZOS)
    sheet.alpha_composite(im.resize((192, 192), Image.NEAREST), (x, 0))
    sheet.alpha_composite(im, (x, 220))
    sheet.alpha_composite(im, (x, 480))
    x += 212
sheet.convert('RGB').save(out)
