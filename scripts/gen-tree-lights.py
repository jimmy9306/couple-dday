#!/usr/bin/env python3
"""트리(tree.png) 위에 그릴 LED 전선/전구 좌표 생성 → src/lib/treeLights.js

- 전선: 트리를 대각선으로 감는 3~4줄(1칸 폭). "트리 외곽선 안쪽(초록 면)"에만 그리고,
  장식볼(빨강/노랑/분홍 하이라이트)과 그 검은 테두리 주변 1칸은 피함 (기존 장식볼을 가리지 않게).
- 전구: 전선 위에 12~16개(1칸 또는 가로 2칸), 3개 그룹으로 나눠 시간차 점등(그룹 번호만 저장).
tree.png 를 다시 만들면 이 스크립트도 다시 실행해서 좌표를 갱신해야 함.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TREE = ROOT / 'public' / 'characters' / 'winter' / 'tree.png'
OUT = ROOT / 'src' / 'lib' / 'treeLights.js'

SLOPE = 0.5                       # 왼쪽 위 → 오른쪽 아래 대각선
INTERCEPTS = [7, 16, 25, 34]       # 각 줄이 x=15(트리 중앙)를 지나는 y
MIN_RUN = 3                       # 이보다 짧게 끊긴 조각은 버림
N_BULBS = 14
COLORS = ['yellow', 'yellow', 'red', 'yellow', 'yellow', 'green', 'yellow', 'yellow', 'blue',
          'yellow', 'yellow', 'red', 'yellow', 'green', 'yellow', 'blue']


def load_masks():
    a = np.array(Image.open(TREE))
    r, g, b, al = (a[..., i].astype(int) for i in range(4))
    opaque = al > 0
    white = (r > 190) & (g > 190) & (b > 190)
    brown = (r > g) & (g > b)                     # 줄기
    # 트리 외곽선(검정)·눈(흰색)·줄기(갈색)가 아닌 "초록 면"
    green = opaque & (g > r + 6) & (g >= b - 8) & ~white & ~brown
    ornament = opaque & (((r > 200) & (g > 180) & (b < 130)) | ((r > 180) & (g < 110) & (b < 110)) |
                         ((r > 200) & (g > 120) & (b > 120) & (g < 200)))
    black = opaque & (r < 45) & (g < 45) & (b < 45)
    # 장식볼 + 바로 옆 검은 테두리를 1칸 더 키워서 피함
    near = np.zeros_like(ornament)
    h, w = ornament.shape
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            near |= np.roll(np.roll(ornament, dy, axis=0), dx, axis=1)
    return green & ~near, (h, w)


def main():
    allowed, (h, w) = load_masks()
    wires = []          # 줄별 [(x, y)...] (왼→오른쪽)
    for c in INTERCEPTS:
        run, runs = [], []
        for x in range(w):
            y = int(round(c + SLOPE * (x - 15)))
            # 기울기가 있어서 같은 x에서 세로로 1칸 이어붙여 끊김 없는 대각선으로 만듦
            prev_y = int(round(c + SLOPE * (x - 1 - 15))) if x else y
            cells = [(x, yy) for yy in range(min(prev_y, y), max(prev_y, y) + 1)] if x else [(x, y)]
            for (cx, cy) in cells:
                if 0 <= cy < h and allowed[cy, cx]:
                    run.append((cx, cy))
                else:
                    if len(run) >= MIN_RUN:
                        runs.append(run)
                    run = []
        if len(run) >= MIN_RUN:
            runs.append(run)
        wires.extend(runs)
    pixels = [p for run in wires for p in run]
    # 전구: 전선 픽셀 전체 길이를 N등분한 지점
    pts = []
    total = len(pixels)
    for i in range(N_BULBS):
        pts.append(pixels[int((i + 0.5) * total / N_BULBS)])
    bulbs = []
    wire_set = set(pixels)
    for i, (x, y) in enumerate(pts):
        wide = i % 4 == 1 and (x + 1, y) in wire_set    # 일부는 가로 2칸 전구
        bulbs.append(dict(x=x, y=y, w=2 if wide else 1, color=COLORS[i % len(COLORS)], group=i % 3))
    js = ['// scripts/gen-tree-lights.py 가 tree.png 를 보고 자동 생성한 파일 (직접 수정하지 말고 스크립트를 다시 실행)',
          '// 좌표는 tree.png 의 칸(픽셀) 좌표 (x: 0~30, y: 0~41)',
          f'export const WIRES = {[list(p) for p in pixels]!r}'.replace('], [', '],['),
          'export const BULBS = [']
    for b in bulbs:
        js.append(f"  {{ x: {b['x']}, y: {b['y']}, w: {b['w']}, color: '{b['color']}', group: {b['group']} }},")
    js.append(']')
    OUT.write_text('\n'.join(js) + '\n', encoding='utf8')
    print(f'전선 {len(pixels)}칸 ({len(wires)}조각), 전구 {len(bulbs)}개 → {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
