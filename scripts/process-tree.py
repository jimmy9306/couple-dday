#!/usr/bin/env python3
"""크리스마스 트리 이미지 정리 (Pillow + numpy).

입력: scripts/tree-source.png (배경이 #00FF00 계열 형광 초록인 AI 생성 "픽셀풍" 트리)
출력: public/characters/winter/tree.png (투명 배경, 16색 이하, 높이 TREE_ROWS칸)

배경 제거: 형광 초록(G 높고 R/B 낮음, 트리 짙은 초록과는 G 값이 크게 다름)만 가장자리에서 flood fill 로 지움.
  → 트리의 짙은 초록/눈/장식볼은 조건에 안 걸리고, 가장자리와 이어지지 않은 곳은 어떤 경우에도 안 지움.
축소: 캐릭터 파이프라인과 같은 방식(bbox 를 세로 TREE_ROWS칸으로 나눠 칸별 다수결, 드문 색 가중치 보강).
"""
from importlib.machinery import SourceFileLoader
from pathlib import Path
import sys

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts' / 'tree-source.png'
OUT = ROOT / 'public' / 'characters' / 'winter' / 'tree.png'
TREE_ROWS = 42            # 캐릭터(32칸)의 약 1.3배. 화면에서는 3배 확대(=126px)로 캐릭터와 같은 격자 크기

winter = SourceFileLoader('process_winter', str(ROOT / 'scripts' / 'process-winter-characters.py')).load_module()
base = winter.base


def green_screen(rgb: np.ndarray) -> np.ndarray:
    px = rgb.astype(int)
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    return (g >= 190) & (r <= 130) & (b <= 130) & (g - np.maximum(r, b) >= 100)


def main():
    rgb = np.array(Image.open(SRC).convert('RGB')).astype(np.uint8)
    like = green_screen(rgb)
    h, w = like.shape
    border = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)]
    border += [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    bg = winter.flood(like, border)
    removed_inside = int((like & ~bg).sum())
    print(f'형광 초록 {int(like.sum())}px 중 가장자리와 이어진 배경 {int(bg.sum())}px 제거 (이어지지 않은 형광 초록 {removed_inside}px는 남김)')

    palette = winter.weighted_palette(rgb[~bg])
    labels = base.label_image(rgb, palette)
    box = base.bbox(~bg, (0, w))
    small, grid = winter.downscale_boost(labels, bg, palette, box, rows=TREE_ROWS)
    small, ncolors = base.merge_palette(small)
    # 가장자리 빈 줄/열 정리
    ys, xs = np.where(small[..., 3] > 0)
    small = small[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(small, 'RGBA').save(OUT)
    print(f'tree.png {small.shape[1]}x{small.shape[0]}, 색 {ncolors}개, 칸 크기 {grid[2]:.1f}px')


if __name__ == '__main__':
    main()
