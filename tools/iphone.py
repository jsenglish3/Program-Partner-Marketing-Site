"""Kept in the repo so phone screenshots can be redone the same way. Needs Pillow, numpy and the Inter font."""
"""Turn raw 390x845 phone captures into iPhone 15-proportioned screens (393x852 pt at 2x = 786x1704 px)
with a real status bar (9:41, signal, Wi-Fi, battery), Dynamic Island and home indicator.

The app's own header stays at the top under the status bar. To make room, 59 pt of scrolling content is
removed just above the bottom tab bar (or above a pinned footer), which is what you'd see on a real phone.

usage: iphone.py SRC_DIR OUT_DIR name [name ...]
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 786, 1704          # 393 x 852 pt at 2x
SB = 118                  # status bar / safe area, 59 pt
BOT = 68                  # home indicator safe area, 34 pt
S4 = 4                    # supersample factor for vector bits (drawn at 4x of pt)
FONT = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'

# Per-shot overrides: where to remove rows (normalized px). Default: just above a detected bottom bar.
CUT_AT = {
    'feature-forms-phone': 1250,
    'home-hero-theatre-phone': 1250,
    'home-hero-theatre-phone-dark': 1250,
    'forms-how-1': 1280,
    'woodshed-hero-phone': 1500,
    'home-woodshed': 1500,
    'woodshed-share': 1420,
    'home-fam-student': 1464,
}

def luminance(rgb):
    r, g, b = [c / 255 for c in rgb]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def find_bottom_bar(a):
    """Top y of a bottom tab bar: a full-width hairline in the bottom 240 px with a uniform band under it."""
    h = a.shape[0]
    rows = a.astype(np.int16)
    for y in range(h - 70, h - 240, -1):
        line = rows[y]
        below = rows[y + 3:y + 12]
        above = rows[y - 6:y - 2]
        if line.std(axis=0).mean() < 4 and abs(line.mean() - below.mean()) > 4 and below.std(axis=0).mean() < 30:
            # hairline must differ from both sides and the band below must be the bar background
            if abs(line.mean() - above.mean()) > 3:
                return y
    return None

def glyph_layer(dark_text, width_pt=393, height_pt=59):
    """Status bar glyphs + island drawn at 4x, returned at 2x RGBA (W x SB)."""
    k = S4
    img = Image.new('RGBA', (width_pt * k, height_pt * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ink = (0, 0, 0, 255) if dark_text else (255, 255, 255, 255)
    faint = (0, 0, 0, 90) if dark_text else (255, 255, 255, 100)
    cy = (11 + 37 / 2) * k  # island centre line

    # Dynamic Island: 126 x 37 pt, 11 pt from the top
    iw, ih = 126 * k, 37 * k
    ix = (width_pt * k - iw) / 2
    d.rounded_rectangle([ix, 11 * k, ix + iw, 11 * k + ih], radius=ih / 2, fill=(0, 0, 0, 255))

    # Time
    f = ImageFont.truetype(FONT, int(17 * k))
    t = '9:41'
    bb = d.textbbox((0, 0), t, font=f)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    d.text((58 * k - tw / 2 - bb[0], cy - th / 2 - bb[1]), t, font=f, fill=ink)

    # Battery (right edge at 365 pt)
    bx1 = 362 * k; bw, bh = 25 * k, 12 * k
    bx0 = bx1 - bw; by0 = cy - bh / 2
    d.rounded_rectangle([bx0, by0, bx1, by0 + bh], radius=4 * k, outline=faint, width=int(1 * k))
    pad = 2 * k
    d.rounded_rectangle([bx0 + pad, by0 + pad, bx1 - pad, by0 + bh - pad], radius=2.5 * k, fill=ink)
    d.rounded_rectangle([bx1 + 1 * k, cy - 2 * k, bx1 + 2.5 * k, cy + 2 * k], radius=1 * k, fill=faint)

    # Wi-Fi: three wedges plus the tip, built on a mask
    wx = bx0 - 7 * k - 8.5 * k  # centre x
    base = cy + 5.5 * k         # point of the fan
    m = Image.new('L', img.size, 0)
    md = ImageDraw.Draw(m)
    radii = [12 * k, 8 * k, 4.2 * k]
    for i, r in enumerate(radii):
        md.pieslice([wx - r, base - r, wx + r, base + r], 225, 315, fill=255)
        if i < 2:
            r2 = r - 2.4 * k
            md.pieslice([wx - r2, base - r2, wx + r2, base + r2], 225, 315, fill=0)
    img.paste(Image.new('RGBA', img.size, ink), (0, 0), m)

    # Cellular: four bars, bottom aligned
    sx1 = wx - 12 * k - 6 * k
    bars = [4, 6.3, 8.7, 11]
    bwid, gap = 3 * k, 1.6 * k
    x = sx1 - (4 * bwid + 3 * gap)
    bottom = cy + 5.5 * k
    for hgt in bars:
        d.rounded_rectangle([x, bottom - hgt * k, x + bwid, bottom], radius=0.9 * k, fill=ink)
        x += bwid + gap

    return img.resize((W, SB), Image.LANCZOS)

def home_indicator(dark):
    k = S4
    img = Image.new('RGBA', (393 * k, 21 * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    col = (0, 0, 0, 225) if dark else (255, 255, 255, 235)
    x0 = (393 - 134) / 2 * k
    d.rounded_rectangle([x0, 8 * k, x0 + 134 * k, 13 * k], radius=2.5 * k, fill=col)
    return img.resize((W, 42), Image.LANCZOS)

def compose(src, name):
    im = Image.open(src).convert('RGB')
    im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
    a = np.asarray(im)
    need = im.height - (H - SB - BOT)  # rows to remove
    if name in CUT_AT:
        cut = CUT_AT[name]
    else:
        bar = find_bottom_bar(a)
        cut = (bar if bar else im.height) - need
    top = im.crop((0, 0, W, cut))
    bottom = im.crop((0, cut + need, W, im.height))
    content = Image.new('RGB', (W, H - SB - BOT))
    content.paste(top, (0, 0)); content.paste(bottom, (0, top.height))
    ca = np.asarray(content)
    foot_rgb = tuple(int(c) for c in ca[-6:-2, :, :].reshape(-1, 3).mean(axis=0))

    head = a[2:8, :, :].reshape(-1, 3).mean(axis=0)
    head_rgb = tuple(int(c) for c in head)
    out = Image.new('RGB', (W, H), head_rgb)
    out.paste(content, (0, SB))
    out.paste(Image.new('RGB', (W, BOT), foot_rgb), (0, H - BOT))
    out = out.convert('RGBA')
    out.alpha_composite(glyph_layer(luminance(head_rgb) > 0.5), (0, 0))
    out.alpha_composite(home_indicator(luminance(foot_rgb) > 0.5), (0, H - 42))
    return out.convert('RGB'), cut

if __name__ == '__main__':
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    for n in sys.argv[3:]:
        img, cut = compose(os.path.join(src_dir, n + '.webp'), n)
        img.save(os.path.join(out_dir, n + '.webp'), 'WEBP', quality=88, method=6)
        print(n, 'cut at', cut)
