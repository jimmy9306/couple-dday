#!/usr/bin/env python3
"""겨울(크리스마스) 커플 캐릭터 이미지 정리 파이프라인 (Pillow + numpy).

입력: scripts/winter-source.png (은지=왼쪽, 지민=오른쪽 / 배경이 투명이 아니라 회색·흰색 체크무늬가 이미지에 박혀 있음)
출력: public/characters/winter/{jimin,eunji}.png + -blink.png(눈 감음) + -wind.png(바람 포즈)
      (가을 캐릭터와 똑같이 24x32, 투명 배경, 16색 이하, 발은 맨 아래 행)

배경 제거 주의 (니트가 흰색이라 "흰색 지우기"는 금지):
  - 가장자리에서 flood fill 을 하되, 번지는 조건을 "무채색(체크무늬)"으로 제한하고 캐릭터의
    검은 외곽선은 절대 넘지 않음 → 외곽선 안쪽(니트·머플러)은 지워질 수 없는 구조.
  - 니트는 아이보리(R-B≈13)라서 체크무늬(R-B≤3)와 색으로도 구분됨 (이중 안전장치).
  - 외곽선으로 완전히 둘러싸인 체크무늬 조각(팔 사이 등)은 크기가 충분히 크면 배경으로 간주.
  - 마지막에 니트 픽셀 수가 처리 전/후 같은지 검증하고, 다르면 실패 처리.
기존 가을 캐릭터 파이프라인(process-characters.py)의 축소/눈/블링크/바람 함수를 그대로 재사용.
"""
from collections import deque
from importlib.machinery import SourceFileLoader
from pathlib import Path
import sys

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else ROOT / 'scripts' / 'winter-source.png'
OUT = ROOT / 'public' / 'characters' / 'winter'

base = SourceFileLoader('process_characters', str(ROOT / 'scripts' / 'process-characters.py')).load_module()

CHECKER_MAX_CHROMA = 6     # 체크무늬는 완전 무채색(최대-최소 ≤3). 아이보리 니트는 ≥10
CHECKER_MIN_LUMA = 190     # 체크무늬 회색(≈221)/흰색(≈253)
POCKET_MIN_AREA = 400      # 외곽선으로 둘러싸인 체크무늬 조각이 이 크기 이상이면 배경으로 간주


def checker_like(rgb: np.ndarray) -> np.ndarray:
    px = rgb.astype(int)
    chroma = px.max(axis=2) - px.min(axis=2)
    luma = px @ np.array([0.299, 0.587, 0.114])
    return (chroma <= CHECKER_MAX_CHROMA) & (luma >= CHECKER_MIN_LUMA)


def flood(mask: np.ndarray, seeds) -> np.ndarray:
    h, w = mask.shape
    seen = np.zeros_like(mask)
    q = deque(s for s in seeds if mask[s])
    for s in q:
        seen[s] = True
    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    return seen


def remove_background(rgb: np.ndarray):
    h, w, _ = rgb.shape
    like = checker_like(rgb)
    border = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)]
    border += [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    bg = flood(like, border)
    # 외곽선 안에 갇힌 체크무늬 조각
    rest = like & ~bg
    seen = np.zeros_like(rest)
    pockets = 0
    for sy, sx in zip(*np.where(rest)):
        if seen[sy, sx]:
            continue
        comp = flood(rest & ~seen, [(sy, sx)])
        seen |= comp
        if comp.sum() >= POCKET_MIN_AREA:
            bg |= comp
            pockets += 1
    return bg, pockets


# ---------------------------------------------------------------------------
# 축소 — 가을 파이프라인(process-characters.py)과 같은 방식(bbox를 세로 32칸으로 나눠 칸별 다수결)이지만,
# 이 이미지는 파란 청바지/빨강·초록 줄무늬/갈색 사슴 무늬처럼 "작고 드문 색"이 중요해서 두 가지를 보강:
#   1) 팔레트: 색 빈도를 제곱근으로 눌러서(검정·흰색이 팔레트를 독차지하지 않게) 드문 색에도 팔레트 자리를 줌
#   2) 칸 다수결: 드문 색일수록 가중치를 줘서 1칸 두께 줄무늬/사슴 무늬가 흰 니트에 먹히지 않게 함
# ---------------------------------------------------------------------------
def weighted_palette(pixels: np.ndarray, k=24, iters=16, seed=7):
    q = (pixels >> 3).astype(np.int32)
    key = (q[:, 0] << 10) | (q[:, 1] << 5) | q[:, 2]
    uniq, inv, counts = np.unique(key, return_inverse=True, return_counts=True)
    sums = np.zeros((len(uniq), 3))
    np.add.at(sums, inv, pixels.astype(float))
    pts = sums / counts[:, None]
    wts = np.sqrt(counts)
    rng = np.random.default_rng(seed)
    centers = [pts[np.argmax(wts)]]
    for _ in range(k - 1):                       # 가중 k-means++ 초기화
        d2 = np.min([((pts - c) ** 2).sum(axis=1) for c in centers], axis=0) * wts
        centers.append(pts[rng.choice(len(pts), p=d2 / d2.sum())])
    centers = np.array(centers)
    for _ in range(iters):
        idx = ((pts[:, None, :] - centers[None]) ** 2).sum(axis=2).argmin(axis=1)
        for j in range(k):
            m = idx == j
            if m.any():
                centers[j] = (pts[m] * wts[m, None]).sum(axis=0) / wts[m].sum()
    return np.round(centers).astype(np.uint8)


RARE_BOOST = 0.3      # 드문 색 가중치 지수 (0이면 일반 다수결)


def downscale_boost(labels, bg, palette, box, rows=base.CANVAS_H):
    x0, y0, x1, y1 = box
    freq = np.bincount(labels[~bg], minlength=len(palette)).astype(float)
    freq /= freq.sum()
    weight = (freq.max() / np.maximum(freq, 1e-4)) ** RARE_BOOST
    cell_h = (y1 - y0) / rows
    cols = max(1, round((x1 - x0) / cell_h))
    xs = np.round(np.linspace(x0, x1, cols + 1)).astype(int)
    ys = np.round(np.linspace(y0, y1, rows + 1)).astype(int)
    out = np.zeros((rows, cols, 4), dtype=np.uint8)
    for r in range(rows):
        for c in range(cols):
            tile_bg = bg[ys[r]:ys[r + 1], xs[c]:xs[c + 1]]
            if tile_bg.mean() >= 0.5:
                continue
            tile = labels[ys[r]:ys[r + 1], xs[c]:xs[c + 1]][~tile_bg]
            score = np.bincount(tile, minlength=len(palette)) * weight
            out[r, c, :3] = palette[score.argmax()]
            out[r, c, 3] = 255
    return out, (xs, ys, cell_h)


def knit_pixels(rgb: np.ndarray) -> np.ndarray:
    """검증용: 아이보리 니트색(밝고 살짝 따뜻한 색) 픽셀."""
    px = rgb.astype(int)
    chroma = px.max(axis=2) - px.min(axis=2)
    luma = px @ np.array([0.299, 0.587, 0.114])
    return (chroma >= 9) & (chroma <= 25) & (luma >= 235) & (px[..., 0] - px[..., 2] >= 9)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rgb = np.array(Image.open(SRC).convert('RGB')).astype(np.uint8)
    bg, pockets = remove_background(rgb)

    knit = knit_pixels(rgb)
    lost = int((knit & bg).sum())
    print(f'니트색 픽셀 {int(knit.sum())}개 중 배경으로 지워진 것: {lost}개, 갇힌 체크무늬 조각 {pockets}개 제거')
    if lost:
        raise SystemExit('니트가 지워졌어요 — 중단')

    if '--preview' in sys.argv:      # 배경 제거 결과 확인용(배경=마젠타)
        Image.fromarray(np.where(bg[..., None], (255, 0, 255), rgb).astype(np.uint8)).save(ROOT / 'scripts' / '.winter-nobg-preview.png')

    left, right = base.split_characters(bg)
    chars = {'eunji': left, 'jimin': right}           # 왼쪽=은지(여), 오른쪽=지민(남)

    palette = weighted_palette(rgb[~bg])
    labels = base.label_image(rgb, palette)
    dark_rgb = palette[np.argmin(palette.astype(int) @ np.array([0.299, 0.587, 0.114]))]

    report = {}
    for name, xr in chars.items():
        box = base.bbox(~bg, xr)
        small, grid = downscale_boost(labels, bg, palette, box)
        eyes_src = base.detect_eyes(rgb, box)
        eye_cols, eye_rows = base.paint_eyes(small, grid, eyes_src, dark_rgb, None)
        small, ncolors = base.merge_palette(small)
        # 가장자리의 가느다란 머리카락 칸이 사라져 한쪽에 빈 열이 남으면 몸이 치우쳐 보이므로, 보이는 열만 남기고 가운데 정렬
        used = np.where((small[..., 3] > 0).any(axis=0))[0]
        c0, c1 = int(used.min()), int(used.max())
        small = small[:, c0:c1 + 1]
        eye_cols = [c - c0 for c in eye_cols]
        dark_now = small[eye_rows[0], eye_cols[0], :3].copy()
        skin_rgb = small[eye_rows[0], (eye_cols[0] + eye_cols[1]) // 2, :3].copy()
        canvas = base.to_canvas(small)
        x_off, y_off = base.to_canvas_shift(small)
        canvas_eye = ([c + x_off for c in eye_cols], [r + y_off for r in eye_rows])
        blink = base.make_blink(canvas, canvas_eye, skin_rgb, dark_now)
        Image.fromarray(canvas, 'RGBA').save(OUT / f'{name}.png')
        Image.fromarray(blink, 'RGBA').save(OUT / f'{name}-blink.png')
        Image.fromarray(base.make_wind(canvas), 'RGBA').save(OUT / f'{name}-wind.png')
        report[name] = dict(grid=f'{small.shape[1]}x{small.shape[0]}', cell=round(grid[2], 2), colors=ncolors,
                            eye_cols=canvas_eye[0], eye_rows=canvas_eye[1])
    for k, v in report.items():
        print(k, v)


if __name__ == '__main__':
    main()
