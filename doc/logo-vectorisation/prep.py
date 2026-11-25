"""Prépare la vectorisation du logo : ellipses de l'anneau vert + image agrandie des lettres."""
import json
import math
import sys

import numpy as np
from PIL import Image

src, out_dir = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGBA')).astype(float)
r, g, b, a = (im[..., i] for i in range(4))
alpha = a / 255.0
# Les pixels de bord mélangent noir (26,26,26) et vert (89,179,89) : on sépare les
# deux couvertures d'après le canal vert plutôt que de classer en tout ou rien.
t_dark = np.clip((179.0 - g) / (179.0 - 26.0), 0, 1)
dark = alpha * t_dark
green = alpha * (1 - t_dark)
is_green = green > dark
H, W = alpha.shape


def sample(arr, x, y):
    xi, yi = int(round(x)), int(round(y))
    if 0 <= xi < W and 0 <= yi < H:
        return arr[yi, xi]
    return 0.0


# Rayons depuis le centre de l'anneau : bords intérieur et extérieur, seulement
# là où le vert touche le transparent (pas les lettres).
ys, xs = np.nonzero(green > 0.5)
cx, cy = xs.mean(), ys.mean()
outer, inner = [], []
step = 0.05
for k in range(720):
    t = 2 * math.pi * k / 720
    dx, dy = math.cos(t), math.sin(t)
    prof = []
    s = 0.0
    while s < 140:
        x, y = cx + dx * s, cy + dy * s
        prof.append((s, sample(green, x, y), sample(dark, x, y)))
        s += step
    gvals = [p[1] for p in prof]
    idx = [i for i, v in enumerate(gvals) if v > 0.5]
    if not idx:
        continue
    i0, i1 = idx[0], idx[-1]
    # bord intérieur : juste avant i0 il doit y avoir du transparent (pas du noir)
    def clean(i, direction):
        for j in range(1, int(3 / step)):
            p = prof[min(max(i + direction * j, 0), len(prof) - 1)]
            if p[2] > 0.2:
                return False
        return True
    if clean(i0, -1):
        inner.append((cx + dx * prof[i0][0], cy + dy * prof[i0][0]))
    if clean(i1, +1):
        outer.append((cx + dx * prof[i1][0], cy + dy * prof[i1][0]))


def fit_ellipse(pts):
    # Ajustement direct d'une conique (Fitzgibbon) puis conversion en paramètres.
    P = np.array(pts)
    x, y = P[:, 0], P[:, 1]
    D = np.vstack([x * x, x * y, y * y, x, y, np.ones_like(x)]).T
    S = D.T @ D
    C = np.zeros((6, 6))
    C[0, 2] = C[2, 0] = 2
    C[1, 1] = -1
    eigval, eigvec = np.linalg.eig(np.linalg.inv(S) @ C)
    k = np.argmax(eigval.real)
    A, B, Cc, Dd, E, F = eigvec[:, k].real
    den = B * B - 4 * A * Cc
    x0 = (2 * Cc * Dd - B * E) / den
    y0 = (2 * A * E - B * Dd) / den
    num = 2 * (A * E * E + Cc * Dd * Dd - B * Dd * E + den * F)
    root = math.sqrt((A - Cc) ** 2 + B * B)
    a1 = -math.sqrt(num * (A + Cc + root)) / den
    a2 = -math.sqrt(num * (A + Cc - root)) / den
    theta = 0.5 * math.atan2(-B, Cc - A)
    rx, ry = a1, a2
    if rx < ry:
        rx, ry = ry, rx
        theta += math.pi / 2
    ang = math.degrees(theta)
    while ang > 90:
        ang -= 180
    while ang < -90:
        ang += 180
    return {'cx': x0, 'cy': y0, 'rx': rx, 'ry': ry, 'angle': ang}


res = {'center_guess': [cx, cy], 'n_outer': len(outer), 'n_inner': len(inner),
       'outer': fit_ellipse(outer), 'inner': fit_ellipse(inner)}

# Lettres : noir sur blanc, agrandi ×8 pour potrace.
SCALE = 8
letters = Image.fromarray((255 - dark * 255).clip(0, 255).astype(np.uint8), 'L')
letters = letters.resize((W * SCALE, H * SCALE), Image.BICUBIC)
letters.save(f'{out_dir}/letters_x8.png')
res['scale'] = SCALE
res['dark_color'] = [float(v) for v in np.median(im[dark > 0.9][:, :3], axis=0)]
res['green_color'] = [float(v) for v in np.median(im[green > 0.9][:, :3], axis=0)]
json.dump(res, open(f'{out_dir}/prep.json', 'w'), indent=2)
print(json.dumps(res, indent=2))
