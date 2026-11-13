#!/usr/bin/env python3
"""
Anonymous Collectives - colour variant generator.

Re-colours the GARMENT in an original product photo while keeping the model, pose, fabric
texture, ribbing, shadows, lighting, shape and logo placement exactly as photographed. It works in
Lab colour space: the garment's lightness map (its shading) is kept and re-centred on the new colour.
Skin, hair, background and everything else that is not garment is left untouched. No CSS filters
are involved: every colour is its own JPG file.

Logo rule: dark garments keep a WHITE logo; the pure-white garment gets a BLACK logo.

These outputs are DIGITALLY RENDERED PREVIEWS, not photographs of real stock. Replace them with real
photos whenever you have them (see README, "Adding colour variations").

Usage:  python3 tools/make_colour_variants.py            (re-make every variant)
        python3 tools/make_colour_variants.py male-tank  (one product)
Needs:  pip install -r tools/requirements.txt   (pillow numpy scipy scikit-image)
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import color

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Target colours (sRGB hex)
COLOURS = {
    "black":  "#161616",
    "brown":  "#65402D",
    "red":    "#C3141B",
    "white":  "#F6F6F4",   # pure white garment (shading is kept, so shadows stay realistic)
    "ash":    "#929292",   # ash grey
    "purple": "#542477",
}

# Logo colour rule: dark garments keep a WHITE logo, the pure-white garment gets a BLACK logo.
DARK_LOGO_ON = ["white"]
OUT_MAX_HEIGHT = 1500     # exported image height in px (keeps pages fast, still sharp)

# One entry per product photo.
#  mask       : how to find the garment ("red_garment", "dark_garment", "beanie")
#  src_colour : the colour already in the photo (it is copied, not re-made)
#  targets    : colours to create
#  g          : how strongly the original shading is carried across (higher = more contrast)
JOBS = {
    "male-tank": dict(src="assets/products/_source/male-tank-red.jpg", out="assets/products/male-tank",
                      mask="red_garment", src_colour="red", targets=["black", "white", "brown"],
                      g={"black": 0.55, "white": 0.85, "brown": 0.9}),
    "female-tank": dict(src="assets/products/_source/female-tank-black.jpg", out="assets/products/female-tank",
                        mask="dark_garment", src_colour="black", targets=["red", "white", "brown"],
                        g={"red": 0.4, "white": 0.4, "brown": 0.45}, smooth=0.8),
    "beanie": dict(src="assets/products/_source/beanie-black.jpg", out="assets/products/beanie",
                   mask="beanie", src_colour="black", targets=["ash", "purple", "brown"],
                   g={"ash": 0.5, "purple": 0.5, "brown": 0.5}),
}

PAD = 14   # image is padded while masks are computed so garment pieces touching the border are handled

def hex2rgb(h):
    h = h.lstrip("#"); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)]) / 255.0

def largest(mask):
    lab, n = ndi.label(mask)
    if n == 0: return mask
    sizes = ndi.sum(mask, lab, range(1, n + 1))
    return lab == (1 + int(np.argmax(sizes)))

def soft(mask, grow=1, blur=1.2):
    m = ndi.binary_dilation(mask, iterations=grow) if grow else mask
    return np.clip(ndi.gaussian_filter(m.astype(float), blur), 0, 1)

def _masks(kind, rgb):
    hsv = color.rgb2hsv(rgb); h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    Lab = color.rgb2lab(rgb); L = Lab[..., 0]
    H, W = L.shape
    if kind == "red_garment":
        red = ((h < 0.013) | (h > 0.97)) & (s > 0.6) & (v > 0.25)
        red = ndi.binary_opening(red, iterations=1)
        # Keep every sizeable red piece of the garment (the hand splits it in two), but not the small
        # red belt buckle at the very bottom centre, and not specks.
        lab, n = ndi.label(red)
        core = np.zeros_like(red)
        ys, xs = np.mgrid[0:H, 0:W]
        for i in range(1, n + 1):
            comp = lab == i
            area = comp.sum()
            if area < 0.0004 * H * W: continue
            cy, cx = ys[comp].mean() / H, xs[comp].mean() / W
            if cy > 0.955 and 0.40 < cx < 0.66 and area < 0.01 * H * W: continue
            core |= comp
        # the white chest logo: bright, unsaturated pixels that sit inside the closed garment
        closed = ndi.binary_fill_holes(ndi.binary_closing(core, iterations=7))
        logo = ndi.binary_dilation((closed & ~core) & (v > 0.55) & (s < 0.6), iterations=2) & closed
        yy = np.arange(H)[:, None] / H
        logo &= (yy > 0.4) & (yy < 0.7)
        # also let thin garment slivers inside the lettering be recoloured
        sliver = closed & ~core & ndi.binary_dilation(logo, iterations=3) & (s > 0.3)
        a_region = ndi.binary_dilation(core | sliver | logo, iterations=3)   # includes the 3px rim where garment edge blends with the background
        return ndi.gaussian_filter(a_region.astype(float), 0.7), dict(
            mode="bright_logo", core=core | sliver, logo=logo, s_ref=float(np.median(s[core])))
    if kind == "dark_garment":
        skin_shadow = (v > 0.07) & (s > 0.33) & (h > 0.02) & (h < 0.14)     # dark skin must not count as garment
        dark = ((v < 0.15) & ~skin_shadow) | ((v < 0.27) & (s < 0.55) & ~skin_shadow)
        dark[:int(H * 0.06)] = False
        core = largest(ndi.binary_opening(dark, iterations=1))
        core = ndi.binary_fill_holes(ndi.binary_closing(core, iterations=4))
        # The embroidery (logo) keeps its colour. Around it, edge pixels are garment/logo mixtures, so
        # they are un-mixed in recolour() rather than left as a dark halo.
        logo = (v > 0.5) & ndi.binary_erosion(core, iterations=6)
        zone = ndi.gaussian_filter(ndi.binary_dilation(logo, iterations=4).astype(float), 1.0)
        a = soft(core, grow=0, blur=0.9)
        return a, dict(mode="dark_logo", zone=zone, dark_ref=np.array([0.035, 0.035, 0.035]))
    if kind == "beanie":
        body = L < 30
        body = largest(ndi.binary_opening(body, iterations=2))
        sil = ndi.binary_fill_holes(body)
        badge = ndi.binary_fill_holes(ndi.binary_closing((L > 19) & sil, iterations=6))
        badge = largest(badge & (ndi.distance_transform_edt(sil) > 6))
        badge = ndi.binary_dilation(badge, iterations=4)
        return soft(sil & ~badge, grow=0, blur=1.0), None
    raise ValueError(kind)

def garment_mask(kind, rgb):
    """Pads the photo so garment pieces touching the border are handled, then crops the masks back."""
    pr = np.pad(rgb, ((PAD, PAD), (PAD, PAD), (0, 0)), mode="edge")
    a, extra = _masks(kind, pr)
    crop = lambda m: m[PAD:-PAD, PAD:-PAD]
    a = crop(a)
    if extra:
        extra = {k: (crop(v) if isinstance(v, np.ndarray) and v.ndim == 2 else v) for k, v in extra.items()}
    return a, extra

def recolour(rgb, a, target_hex, g, extra=None, dark_logo=False, smooth=0):
    Lab = color.rgb2lab(rgb)
    m = a > 0.6
    Lmed = np.median(Lab[..., 0][m]) if m.any() else 50
    t = color.rgb2lab(hex2rgb(target_hex).reshape(1, 1, 3))[0, 0]
    # shading ratio relative to the garment's own median lightness
    Lsm = ndi.gaussian_filter(Lab[..., 0], smooth) if smooth else Lab[..., 0]   # tames JPEG blockiness in low-light areas
    ratio = np.clip((Lsm + 2.0) / (Lmed + 2.0), 0.25, 3.0)
    Lnew = np.clip(t[0] * np.power(ratio, g), 0, 100)
    c = np.clip(Lnew / max(t[0], 1.0), 0.75, 1.15)          # keep the colour saturated as lightness moves
    new = np.dstack([Lnew, t[1] * c, t[2] * c])
    new_rgb = np.clip(color.lab2rgb(new), 0, 1)
    A = a[..., None]

    if extra and extra.get("mode") == "bright_logo":
        core, logo = extra["core"], extra["logo"]
        # Silhouette edge pixels are garment/background mixtures: swap only the garment share, using the
        # nearest outside colour as "background". This leaves no red outline around the new colour.
        dist = ndi.distance_transform_edt(core)
        _, idx = ndi.distance_transform_edt(ndi.binary_dilation(core, iterations=3), return_indices=True)
        bg = rgb[idx[0], idx[1]]            # clean colour just outside the garment rim
        sat = color.rgb2hsv(rgb)[..., 1]
        w = np.clip(sat / extra["s_ref"], 0, 1)
        w = np.clip((w - 0.15) / 0.55, 0, 1); w = w * w * (3 - 2 * w)
        w = w[..., None]
        edge_w = np.clip(dist / 6.0, 0, 1)[..., None]
        garment = (1 - edge_w) * ((1 - w) * bg + w * new_rgb) + edge_w * new_rgb
        # Logo pixels: white (or black on the white garment) mixed with the garment colour at the letter edges.
        logo_col = np.full_like(rgb, 0.05 if dark_logo else 0.97)
        logo_px = (1 - w) * logo_col + w * new_rgb
        L_ = ndi.gaussian_filter(logo.astype(float), 0.8)[..., None]
        out = garment * (1 - L_) + logo_px * L_
        return rgb * (1 - A) + out * A

    if extra and extra.get("mode") == "dark_logo":
        v = rgb.max(axis=2)
        w = np.clip(1 - (v - 0.12) / (0.55 - 0.12), 0, 1)[..., None]            # share of garment in each pixel
        logo_est = np.clip((rgb - w * extra["dark_ref"]) / np.maximum(1 - w, 0.25), 0, 1)
        if dark_logo:   # pure-white garment: the embroidery becomes black, keeping a little of its relief
            lum = np.clip(logo_est.mean(axis=2, keepdims=True), 0, 1)
            logo_est = np.repeat(0.05 + 0.20 * (1 - lum), 3, axis=2)
        else:           # coloured garments: the cream embroidery is lifted to a clean white
            logo_est = np.clip(logo_est * 0.55 + 0.45, 0, 1)
        mixed = (1 - w) * logo_est + w * new_rgb
        base = rgb * (1 - A) + new_rgb * A
        z = extra["zone"][..., None]
        return base * (1 - z) + mixed * z

    return rgb * (1 - A) + new_rgb * A

def save_jpg(arr, path):
    im = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8))
    if im.height > OUT_MAX_HEIGHT:
        im = im.resize((round(im.width * OUT_MAX_HEIGHT / im.height), OUT_MAX_HEIGHT), Image.LANCZOS)
    im.save(path, quality=88, optimize=True, progressive=True)

def run(name):
    job = JOBS[name]
    rgb = np.asarray(Image.open(os.path.join(ROOT, job["src"])).convert("RGB")).astype(float) / 255
    a, extra = garment_mask(job["mask"], rgb)
    out = os.path.join(ROOT, job["out"]); os.makedirs(out, exist_ok=True)
    save_jpg(rgb, os.path.join(out, f"{job['src_colour']}.jpg"))
    for c in job["targets"]:
        res = recolour(rgb, a, COLOURS[c], job["g"][c], extra, c in DARK_LOGO_ON, job.get("smooth", 0))
        save_jpg(res, os.path.join(out, f"{c}.jpg"))
        print("wrote", os.path.join(job["out"], f"{c}.jpg"))

if __name__ == "__main__":
    for n in (sys.argv[1:] or JOBS): run(n)
