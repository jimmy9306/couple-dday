#!/usr/bin/env python3
"""가을 은지(24x32) 얼굴 = 지민 얼굴 + 속눈썹. 원본(수정 전) 은지 프레임은 scripts/source/autumn/ 에 보관해서 몇 번을 실행해도 같은 결과.
겨울 은지는 process-winter-characters.py 안에서 같은 함수(scripts/eunji_face.py)로 처리."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import eunji_face  # noqa: E402
from importlib.machinery import SourceFileLoader  # noqa: E402

base = SourceFileLoader('process_characters', str(ROOT / 'scripts' / 'process-characters.py')).load_module()
SRC = ROOT / 'scripts' / 'source' / 'autumn'
OUT = ROOT / 'public' / 'characters'
E_COLS, E_ROWS = (9, 13), (8, 9)       # 수정 전 은지 눈
J_COLS, J_ROWS = (9, 13), (9, 10)      # 지민 눈


def load(p):
    return np.array(Image.open(p).convert('RGBA'))


j_open, j_blink = load(OUT / 'jimin.png'), load(OUT / 'jimin-blink.png')
new_open = eunji_face.transplant(load(SRC / 'eunji.png'), j_open, E_COLS, E_ROWS, J_COLS, J_ROWS, 0)
new_blink = eunji_face.transplant(load(SRC / 'eunji-blink.png'), j_blink, E_COLS, E_ROWS, J_COLS, J_ROWS, 0, blink=True)
Image.fromarray(new_open, 'RGBA').save(OUT / 'eunji.png')
Image.fromarray(new_blink, 'RGBA').save(OUT / 'eunji-blink.png')
Image.fromarray(base.make_wind(new_open), 'RGBA').save(OUT / 'eunji-wind.png')
print('가을 은지 얼굴 교체 완료 (일반/깜빡임/바람)')
