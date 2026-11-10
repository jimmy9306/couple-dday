#!/usr/bin/env python3
"""마구간 이미지 정리 (Pillow + numpy). process-tree.py 와 같은 방식.

입력: scripts/stable-source.png (배경이 #00FF00 계열 형광 초록인 AI 생성 "픽셀풍" 마구간)
출력: public/characters/winter/stable.png (투명 배경, 16색 이하, 높이 STABLE_ROWS칸) + src/lib/stableLight.js(입구 빛 영역 좌표)

배경 제거: 형광 초록만 가장자리에서 flood fill 로 지움. 입구 밖 바닥으로 번진 노란 빛(R 높음)은 초록 조건에 안 걸려서 보존됨.
  - 노란 빛과 초록 배경의 경계에 생기는 "연두색 번짐" 1~2px(R<170, G가 R보다 확실히 큼)도 가장자리와 이어진 것만 같이 지움.
입구 빛 영역: 입구 안쪽의 밝은 노랑/주황 칸(마구간 위에 은은한 빛을 덧씌울 자리)을 좌표 목록으로 저장 → src/lib/stableLight.js
"""
from importlib.machinery import SourceFileLoader
from pathlib import Path
import json

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts' / 'stable-source.png'
OUT = ROOT / 'public' / 'characters' / 'winter' / 'stable.png'
LIGHT_JS = ROOT / 'src' / 'lib' / 'stableLight.js'
STABLE_ROWS = 36          # 캐릭터(32칸)의 약 1.1~1.2배. 화면에서는 3배 확대(=108px)

winter = SourceFileLoader('process_winter', str(ROOT / 'scripts' / 'process-winter-characters.py')).load_module()
base = winter.base


def green_screen(rgb: np.ndarray) -> np.ndarray:
    px = rgb.astype(int)
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    neon = (g >= 190) & (r <= 130) & (b <= 130) & (g - np.maximum(r, b) >= 100)
    fringe = (g >= 150) & (r <= 175) & (g - r >= 45) & (g - b >= 90)      # 노랑/갈색과 초록 사이의 연두색 번짐
    return neon | fringe


def is_glow(px: np.ndarray) -> np.ndarray:
    """입구 안쪽의 밝은 빛 칸: 노랑~주황(R 높음, G 중상, B 낮음)."""
    px = px.astype(int)
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    return (r > 215) & (g > 150) & (b < 130) & (r - b > 110)


# 구유 위치: 마구간 입구 안쪽 가운데의 여물통(위는 연노랑 지푸라기, 아래는 갈색 몸통+다리).
# stable.png(44x36)를 확대해 칸 좌표로 직접 확인한 범위: 지푸라기 열 21~29 / 행 22~24, 구유 전체 열 20~30 / 행 22~29.
CRADLE_STRAW_BOX = (21, 22, 29, 24)     # x0, y0, x1, y1 (끝 포함)
CRADLE_BOX = (20, 22, 30, 29)


def find_cradle(img: np.ndarray):
    r, g, b, al = (img[..., i].astype(int) for i in range(4))
    opaque = al > 0
    black = opaque & (r + g + b < 120)
    brown = opaque & (r < 205) & (g < 125) & ~black
    yellow = opaque & (r > 230) & (g > 185) & (b < 170)
    h, w = al.shape
    body = np.zeros((h, w), bool)
    straw = np.zeros((h, w), bool)
    sx0, sy0, sx1, sy1 = CRADLE_STRAW_BOX
    cx0, cy0, cx1, cy1 = CRADLE_BOX
    for y in range(cy0, cy1 + 1):
        for x in range(cx0, cx1 + 1):
            if sy0 <= y <= sy1 and sx0 <= x <= sx1 and yellow[y, x]:
                straw[y, x] = body[y, x] = True          # 지푸라기
            elif black[y, x] or brown[y, x]:
                body[y, x] = True                         # 구유 몸통/테두리/다리
    ys, xs = np.where(body)
    halo1, halo2 = [], []
    for y in range(max(0, ys.min() - 2), min(h, ys.max() + 3)):
        for x in range(max(0, xs.min() - 2), min(w, xs.max() + 3)):
            if body[y, x] or not opaque[y, x] or black[y, x]:
                continue                                  # 구유 밖의 검은 테두리 칸은 밝히지 않음
            d = int(np.min(np.maximum(np.abs(ys - y), np.abs(xs - x))))
            if d == 1:
                halo1.append([int(x), int(y)])
            elif d == 2:
                halo2.append([int(x), int(y)])
    return [[int(x), int(y)] for y, x in zip(*np.where(straw))], halo1, halo2


def main():
    rgb = np.array(Image.open(SRC).convert('RGB')).astype(np.uint8)
    like = green_screen(rgb)
    h, w = like.shape
    border = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)]
    border += [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    bg = winter.flood(like, border)
    yellow_src = is_glow(rgb) & ~bg
    print(f'가장자리와 이어진 초록 배경 {int(bg.sum())}px 제거, 보존된 노란 빛 픽셀 {int(yellow_src.sum())}px')

    palette = winter.weighted_palette(rgb[~bg])
    labels = base.label_image(rgb, palette)
    box = base.bbox(~bg, (0, w))
    small, grid = winter.downscale_boost(labels, bg, palette, box, rows=STABLE_ROWS)
    small, ncolors = base.merge_palette(small)
    ys, xs = np.where(small[..., 3] > 0)
    y0, x0 = ys.min(), xs.min()
    small = small[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(small, 'RGBA').save(OUT)
    glow = is_glow(small[..., :3]) & (small[..., 3] > 0)
    print(f'stable.png {small.shape[1]}x{small.shape[0]}, 색 {ncolors}개, 칸 {grid[2]:.1f}px, 빛 칸 {int(glow.sum())}개')
    cells = [[int(x), int(y)] for y, x in zip(*np.where(glow))]
    straw, halo1, halo2 = find_cradle(small)
    print(f'구유: 지푸라기 {len(straw)}칸, 둘레 빛 1칸 {len(halo1)}칸 / 2칸 {len(halo2)}칸')
    LIGHT_JS.write_text(
        '// scripts/process-stable.py 가 stable.png 를 보고 자동 생성한 파일 (직접 수정하지 말고 스크립트를 다시 실행)\n'
        '// 마구간 입구 안쪽의 밝은 빛 칸 좌표 (stable.png 의 칸 좌표) — 이 위에 은은한 빛을 덧씌움\n'
        f'export const STABLE_COLS = {small.shape[1]}\n'
        f'export const STABLE_ROWS = {small.shape[0]}\n'
        f'export const STABLE_GLOW = {json.dumps(cells, separators=(",", ":"))}\n'
        '// 구유(여물통): 지푸라기 칸 / 구유 둘레 1칸·2칸 빛 번짐 칸 (구유 발광에 사용)\n'
        f'export const STABLE_CRADLE_STRAW = {json.dumps(straw, separators=(",", ":"))}\n'
        f'export const STABLE_CRADLE_HALO1 = {json.dumps(halo1, separators=(",", ":"))}\n'
        f'export const STABLE_CRADLE_HALO2 = {json.dumps(halo2, separators=(",", ":"))}\n',
        encoding='utf8',
    )


if __name__ == '__main__':
    main()
