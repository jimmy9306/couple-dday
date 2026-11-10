#!/usr/bin/env python3
"""가을 은지(24x32) 눈 사이를 좌우로 1픽셀씩 더 벌리는 일회성 보정 (겨울 은지는 process-winter-characters.py 에 포함).

- 머리카락/외곽선 칸은 절대 안 바꿈: 새 눈 자리가 원래 "살색"일 때만 진행, 아니면 중단.
- 일반 프레임(eunji.png)과 바람 프레임(eunji-wind.png, 윗몸이 오른쪽으로 1칸 밀린 프레임)을 바꿈.
- 눈 깜빡임 프레임(eunji-blink.png)은 감은 눈 선이 이미 (8~9, 13~14)칸이라 새 눈 위치(8, 14)에 그대로 맞음 → 선이 새 눈 자리를 덮는지만 검증.
이미 적용된 상태에서 다시 실행하면 "이미 적용됨"으로 건너뜀.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DIR = ROOT / 'public' / 'characters'
EYE_ROWS = (8, 9)


def shift_eyes(name, old_cols, new_cols):
    path = DIR / name
    a = np.array(Image.open(path))
    if (a[EYE_ROWS[0], new_cols[0], :3].astype(int).sum() < 180):      # 새 눈 자리가 이미 어두움 = 적용됨
        print(name, '이미 적용됨')
        return
    dark = a[EYE_ROWS[0], old_cols[0], :3].copy()
    skin = a[EYE_ROWS[0], (old_cols[0] + old_cols[1]) // 2, :3].copy()
    for r in EYE_ROWS:
        for c in new_cols:
            if not (a[r, c, 3] == 255 and (a[r, c, :3] == skin).all()):
                raise SystemExit(f'{name}: 새 눈 자리({r},{c})가 살색이 아니에요 — 머리카락을 건드리게 돼서 중단')
    for r in EYE_ROWS:
        for c in old_cols:
            a[r, c, :3] = skin
        for c in new_cols:
            a[r, c, :3] = dark
    Image.fromarray(a, 'RGBA').save(path)
    print(name, f'눈 {old_cols} → {new_cols}')


shift_eyes('eunji.png', (9, 13), (8, 14))
shift_eyes('eunji-wind.png', (10, 14), (9, 15))

blink = np.array(Image.open(DIR / 'eunji-blink.png'))
row = EYE_ROWS[1]
assert all((blink[row, c, :3] < 60).all() for c in (8, 9, 13, 14)), '감은 눈 선이 새 눈 자리와 안 맞음'
print('eunji-blink.png 감은 눈 선(8~9, 13~14)이 새 눈 위치와 일치')
