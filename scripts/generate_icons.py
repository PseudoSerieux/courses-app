"""Generates PWA icons: a violet-to-pink gradient square with a simple
white basket glyph, matching the app's branding. Run once; outputs land
in public/icons/.
"""
from PIL import Image, ImageDraw
import math
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

VIOLET = (124, 92, 252)
PINK = (244, 91, 160)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_icon(size: int, corner_radius_ratio: float = 0.22, maskable: bool = False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Diagonal gradient background
    for y in range(size):
        for_row = Image.new("RGBA", (size, 1), (0, 0, 0, 0))
        row_draw = ImageDraw.Draw(for_row)
        for x in range(size):
            t = ((x + y) / (2 * size))
            row_draw.point((x, 0), fill=lerp(VIOLET, PINK, t) + (255,))
        img.paste(for_row, (0, y))

    # Rounded-corner mask (skip rounding for maskable icons; the OS masks it)
    if not maskable:
        mask = Image.new("L", (size, size), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.rounded_rectangle(
            [(0, 0), (size - 1, size - 1)],
            radius=int(size * corner_radius_ratio),
            fill=255,
        )
        img.putalpha(mask)

    draw = ImageDraw.Draw(img)

    # Simple basket glyph: trapezoid body + handle arc, in white
    cx, cy = size / 2, size / 2 + size * 0.03
    body_w = size * 0.46
    body_h = size * 0.32
    top_w = body_w
    bottom_w = body_w * 0.72

    top_y = cy - body_h / 2
    bottom_y = cy + body_h / 2

    basket_points = [
        (cx - top_w / 2, top_y),
        (cx + top_w / 2, top_y),
        (cx + bottom_w / 2, bottom_y),
        (cx - bottom_w / 2, bottom_y),
    ]
    draw.polygon(basket_points, fill=(255, 255, 255, 235))

    # A couple of "item" bumps peeking over the basket rim
    bump_r = size * 0.045
    for dx in (-0.16, 0.0, 0.16):
        bx = cx + size * dx
        by = top_y - bump_r * 0.5
        draw.ellipse(
            [(bx - bump_r, by - bump_r), (bx + bump_r, by + bump_r)],
            fill=(255, 255, 255, 235),
        )

    # Handle: an arc above the basket
    handle_w = body_w * 0.55
    handle_h = body_h * 0.5
    handle_box = [
        (cx - handle_w / 2, top_y - handle_h * 1.15),
        (cx + handle_w / 2, top_y - handle_h * 1.15 + handle_h * 1.6),
    ]
    draw.arc(handle_box, start=180, end=360, fill=(255, 255, 255, 235), width=max(2, int(size * 0.035)))

    return img


sizes = [192, 512]
for s in sizes:
    make_icon(s).save(os.path.join(OUT_DIR, f"icon-{s}.png"))
    make_icon(s, maskable=True).save(os.path.join(OUT_DIR, f"icon-{s}-maskable.png"))

make_icon(180, corner_radius_ratio=0.22).save(os.path.join(OUT_DIR, "apple-touch-icon.png"))

print("Icons generated in", OUT_DIR)
