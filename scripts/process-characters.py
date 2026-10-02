#!/usr/bin/env python3
"""홈 화면 커플 캐릭터 이미지 정리 파이프라인 (Pillow + numpy).

입력: scripts/characters-source.webp (은지=왼쪽, 지민=오른쪽 두 명이 한 장에 들어있는 AI 생성 "픽셀풍" 이미지)
출력: public/characters/{jimin,eunji}.png + {jimin,eunji}-blink.png  (24x32, 투명 배경, 16색 이하)

원본은 칸 크기가 균일하지 않은(약 19~24px) 가짜 픽셀 아트라서 "격자 감지"로는 정확한 칸을 못 찾음.
그래서 캐릭터 외곽 bbox를 정수 칸 수에 정확히 맞춰 나누고(세로 32칸 고정), 칸마다 다수결 색을 뽑는 방식으로 축소함.
"""
from pathlib import Path
import sys

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'scripts' / 'characters-source.webp'
OUT = ROOT / 'public' / 'characters'

CANVAS_W, CANVAS_H = 24, 32
MAX_COLORS = 16
BG_MIN_CHANNEL = 226          # 이 값 이상(거의 흰색)이고 가장자리와 이어지면 배경
INK_LUMA = 70                 # 눈/외곽선으로 취급할 어두운 픽셀 기준


# ---------------------------------------------------------------------------
# 1) 배경 제거 — 가장자리에서 flood fill (캐릭터 안쪽의 흰색 디테일은 보존)
# ---------------------------------------------------------------------------
def remove_background(rgb: np.ndarray) -> np.ndarray:
    h, w, _ = rgb.shape
    near_white = rgb.min(axis=2) >= BG_MIN_CHANNEL
    bg = np.zeros((h, w), dtype=bool)
    stack = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)]
    stack += [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or bg[y, x] or not near_white[y, x]:
            continue
        bg[y, x] = True
        stack.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
    return bg


def split_characters(bg: np.ndarray):
    """배경이 아닌 열이 비어있는 가장 넓은 세로 틈을 기준으로 왼쪽/오른쪽 캐릭터 분리."""
    occupied = (~bg).sum(axis=0) > 0
    best, start = (0, 0, 0), None
    for x, occ in enumerate(list(occupied) + [True]):
        if not occ and start is None:
            start = x
        if occ and start is not None:
            if x - start > best[0] and start > 0 and x < len(occupied):
                best = (x - start, start, x)
            start = None
    _, gap_start, gap_end = best
    return (0, gap_start), (gap_end, bg.shape[1])


def bbox(mask: np.ndarray, x_range):
    x0, x1 = x_range
    sub = mask[:, x0:x1]
    ys, xs = np.where(sub)
    return xs.min() + x0, ys.min(), xs.max() + x0 + 1, ys.max() + 1  # half-open


# ---------------------------------------------------------------------------
# 2) 축소 — 먼저 두 캐릭터 공용 팔레트(k-means)로 색을 단순화한 뒤,
#    bbox를 세로 32칸 / 가로 정수 칸으로 나눠 칸별로 "팔레트 번호" 다수결
#    (근사 색 그대로 다수결하면 검정 계열 노이즈가 여러 구간으로 쪼개져 눈 같은 작은 디테일이 사라짐)
# ---------------------------------------------------------------------------
def kmeans_palette(pixels: np.ndarray, k=MAX_COLORS, iters=14, seed=7):
    rng = np.random.default_rng(seed)
    px = pixels.astype(float)
    if len(px) > 80000:
        px = px[rng.choice(len(px), 80000, replace=False)]
    centers = [px[rng.integers(len(px))]]
    for _ in range(k - 1):                       # k-means++ 초기화
        d2 = np.min([((px - c) ** 2).sum(axis=1) for c in centers], axis=0)
        centers.append(px[rng.choice(len(px), p=d2 / d2.sum())])
    centers = np.array(centers)
    for _ in range(iters):
        idx = ((px[:, None, :] - centers[None]) ** 2).sum(axis=2).argmin(axis=1)
        for j in range(k):
            if (idx == j).any():
                centers[j] = px[idx == j].mean(axis=0)
    return np.round(centers).astype(np.uint8)


def label_image(rgb: np.ndarray, palette: np.ndarray) -> np.ndarray:
    h, w, _ = rgb.shape
    flat = rgb.reshape(-1, 3).astype(float)
    labels = np.empty(len(flat), dtype=np.int32)
    for i in range(0, len(flat), 200000):
        chunk = flat[i:i + 200000]
        labels[i:i + 200000] = ((chunk[:, None, :] - palette[None].astype(float)) ** 2).sum(axis=2).argmin(axis=1)
    return labels.reshape(h, w)


def downscale(labels: np.ndarray, bg: np.ndarray, palette: np.ndarray, box, rows=CANVAS_H):
    x0, y0, x1, y1 = box
    cell_h = (y1 - y0) / rows
    cols = max(1, round((x1 - x0) / cell_h))
    xs = np.round(np.linspace(x0, x1, cols + 1)).astype(int)
    ys = np.round(np.linspace(y0, y1, rows + 1)).astype(int)
    out = np.zeros((rows, cols, 4), dtype=np.uint8)
    for r in range(rows):
        for c in range(cols):
            tile_bg = bg[ys[r]:ys[r + 1], xs[c]:xs[c + 1]]
            if tile_bg.mean() >= 0.5:
                continue                      # 반 이상이 배경이면 투명
            tile = labels[ys[r]:ys[r + 1], xs[c]:xs[c + 1]][~tile_bg]
            out[r, c, :3] = palette[np.bincount(tile, minlength=len(palette)).argmax()]
            out[r, c, 3] = 255
    return out, (xs, ys, cell_h)


# ---------------------------------------------------------------------------
# 3) 팔레트 정리 — 비슷한 색 병합(≤16색), 알파는 0/255만
# ---------------------------------------------------------------------------
def merge_palette(img: np.ndarray, max_colors=MAX_COLORS, min_dist=14.0):
    opaque = img[..., 3] == 255
    px = img[..., :3][opaque].astype(float)
    colors, inv, counts = np.unique(px, axis=0, return_inverse=True, return_counts=True)
    clusters = [[c.astype(float), int(n), [i]] for i, (c, n) in enumerate(zip(colors, counts))]

    def dist(a, b):
        return float(np.sqrt(((a[0] - b[0]) ** 2).sum()))

    while len(clusters) > 1:
        best = None
        for i in range(len(clusters)):
            for j in range(i + 1, len(clusters)):
                d = dist(clusters[i], clusters[j])
                if best is None or d < best[0]:
                    best = (d, i, j)
        d, i, j = best
        if d > min_dist and len(clusters) <= max_colors:
            break
        a, b = clusters[i], clusters[j]
        n = a[1] + b[1]
        clusters[i] = [(a[0] * a[1] + b[0] * b[1]) / n, n, a[2] + b[2]]
        clusters.pop(j)

    mapping = {}
    for center, _, members in clusters:
        rgb = tuple(int(round(v)) for v in center)
        for m in members:
            mapping[m] = rgb
    new_px = np.array([mapping[i] for i in inv.reshape(-1)], dtype=np.uint8)
    out = img.copy()
    out[..., :3][opaque] = new_px
    return out, len(clusters)


# ---------------------------------------------------------------------------
# 4) 두 캐릭터 크기·발 위치 정규화 — 24x32 캔버스, 발(바닥)은 맨 아래 행, 가로는 중앙
# ---------------------------------------------------------------------------
def to_canvas(img: np.ndarray):
    rows, cols, _ = img.shape
    canvas = np.zeros((CANVAS_H, CANVAS_W, 4), dtype=np.uint8)
    x_off = (CANVAS_W - cols) // 2
    y_off = CANVAS_H - rows
    canvas[y_off:y_off + rows, x_off:x_off + cols] = img
    return canvas


# ---------------------------------------------------------------------------
# 5) 눈 — 원본 해상도에서 "양옆이 피부색인 어두운 덩어리"로 눈을 찾아 칸 좌표로 변환
#    (칸 경계에 걸쳐 다수결에서 사라지는 걸 막기 위해 눈은 직접 찍어줌)
# ---------------------------------------------------------------------------
def detect_eyes(rgb: np.ndarray, box):
    """원본에서 눈 2개의 (x범위, y범위) 반환. 귀 옆 머리카락 줄기까지 4개가 잡히므로 가운데 2개를 눈으로 사용."""
    x0, y0, x1, y1 = box
    sub = rgb[y0:y1, x0:x1].astype(int)
    luma = sub @ np.array([0.299, 0.587, 0.114])
    dark = luma < 80
    skin = (sub[..., 0] > 215) & (sub[..., 1] > 170) & (sub[..., 2] > 130) & (sub[..., 0] - sub[..., 2] > 20)
    h, w = dark.shape
    flank = np.zeros_like(dark)
    for y in range(h):
        x = 0
        while x < w:
            if dark[y, x]:
                xa = x
                while x < w and dark[y, x]:
                    x += 1
                xb = x
                if 6 <= xb - xa <= 70 and xa > 14 and xb < w - 14:
                    if skin[y, xa - 14:xa - 2].mean() > 0.7 and skin[y, xb + 2:xb + 14].mean() > 0.7:
                        flank[y, xa:xb] = True
            else:
                x += 1
    ys, xs = np.where(flank)
    order = np.argsort(xs)
    blobs, cur = [], None
    for i in order:                                    # x 기준으로 이어붙여 덩어리 만들기
        x, y = xs[i], ys[i]
        if cur and x - cur['x1'] <= 6:
            cur['x1'] = max(cur['x1'], x); cur['y0'] = min(cur['y0'], y); cur['y1'] = max(cur['y1'], y); cur['n'] += 1
        else:
            if cur: blobs.append(cur)
            cur = dict(x0=x, x1=x, y0=y, y1=y, n=1)
    if cur: blobs.append(cur)
    blobs = [b for b in blobs if b['n'] > 300]
    blobs.sort(key=lambda b: b['x0'])
    if len(blobs) < 4:
        raise RuntimeError(f'눈 후보를 찾지 못함: {blobs}')
    mid = blobs[1:3] if len(blobs) == 4 else sorted(blobs, key=lambda b: abs((b['x0'] + b['x1']) / 2 - w / 2))[:2]
    mid.sort(key=lambda b: b['x0'])
    return [(b['x0'] + x0, b['x1'] + 1 + x0, b['y0'] + y0, b['y1'] + 1 + y0) for b in mid]


EYE_ROWS = 2   # 눈 높이(칸). 원본 눈이 가로 1칸 x 세로 약 2.4칸이라 1x2가 가장 비슷함


def paint_eyes(img: np.ndarray, grid, eyes_src, dark_rgb, skin_rgb):
    """감지된 눈 위치를 칸 좌표로 바꿔 눈 칸을 찍고, (열, 행) 목록 반환 (눈 떴을 때 / 감았을 때 공용)."""
    xs, ys, cell_h = grid
    y_top = np.mean([e[2] for e in eyes_src]); y_bot = np.mean([e[3] for e in eyes_src])
    center = ((y_top + y_bot) / 2 - ys[0]) / cell_h                 # 눈 세로 중심(칸 단위)
    r0 = int(np.floor(center - EYE_ROWS / 2 + 0.5))
    cols = []
    for (ex0, ex1, _, _) in eyes_src:
        cx = (ex0 + ex1) / 2
        cols.append(int(np.searchsorted(xs, cx, side='right') - 1))
    for c in cols:
        for r in range(r0, r0 + EYE_ROWS):
            img[r, c, :3] = dark_rgb
            img[r, c, 3] = 255
    return cols, list(range(r0, r0 + EYE_ROWS))


def to_canvas_shift(img: np.ndarray):
    rows, cols, _ = img.shape
    return (CANVAS_W - cols) // 2, CANVAS_H - rows


def make_blink(canvas: np.ndarray, eye_cells, skin_rgb, dark_rgb, width=2):
    """눈 칸만 감은 눈(가로 1줄)로 교체: 눈 칸을 피부색으로 되돌리고 아래쪽 한 줄만 어둡게(바깥쪽으로 가로 width칸)."""
    out = canvas.copy()
    cols, rows = eye_cells
    for c in cols:
        for r in rows:
            out[r, c, :3] = skin_rgb
    line_row = rows[-1]
    centre = sum(cols) / len(cols)
    for c in cols:
        outward = -1 if c < centre else 1
        for k in range(width):
            cc = c + outward * k
            out[line_row, cc, :3] = dark_rgb
            out[line_row, cc, 3] = 255
    return out


# ---------------------------------------------------------------------------
def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rgb = np.array(Image.open(SRC).convert('RGB')).astype(np.uint8)
    bg = remove_background(rgb)
    left, right = split_characters(bg)
    # 왼쪽=은지(여), 오른쪽=지민(남)
    chars = {'eunji': left, 'jimin': right}

    palette = kmeans_palette(rgb[~bg])
    labels = label_image(rgb, palette)
    dark_rgb = palette[np.argmin(palette.astype(int) @ np.array([0.299, 0.587, 0.114]))]   # 가장 어두운 색(외곽선/눈)

    report = {}
    for name, xr in chars.items():
        box = bbox(~bg, xr)
        small, grid = downscale(labels, bg, palette, box)
        eyes_src = detect_eyes(rgb, box)
        eye_cols, eye_rows = paint_eyes(small, grid, eyes_src, dark_rgb, None)
        small, ncolors = merge_palette(small)
        # 병합 뒤에도 눈 색은 가장 어두운 색으로 유지
        dark_rgb_now = small[eye_rows[0], eye_cols[0], :3].copy()
        skin_rgb = small[eye_rows[0], (eye_cols[0] + eye_cols[1]) // 2, :3].copy()
        canvas = to_canvas(small)
        x_off, y_off = to_canvas_shift(small)
        canvas_eye = ([c + x_off for c in eye_cols], [r + y_off for r in eye_rows])
        blink = make_blink(canvas, canvas_eye, skin_rgb, dark_rgb_now)
        Image.fromarray(canvas, 'RGBA').save(OUT / f'{name}.png')
        Image.fromarray(blink, 'RGBA').save(OUT / f'{name}-blink.png')
        report[name] = dict(grid=f'{small.shape[1]}x{small.shape[0]}', cell=round(grid[2], 2), colors=ncolors,
                            eye_cols=canvas_eye[0], eye_rows=canvas_eye[1])
    for k, v in report.items():
        print(k, v)


if __name__ == '__main__':
    main()
