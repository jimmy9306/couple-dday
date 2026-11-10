"""은지 얼굴 = 지민 얼굴 + 속눈썹 (가을 24x32 / 겨울 36x48 공용).

- 은지의 "얼굴 칸"(피부색 칸 + 눈 칸) 중 지민 얼굴 창(눈 윗줄 ~ 턱) 안에 있는 칸을, 눈 위치를 맞춘 지민의 같은 자리 픽셀로 그대로 교체.
- 은지의 머리카락 칸(피부/눈이 아닌 칸)은 절대 안 바꿈. 지민의 피부가 은지 머리카락 자리에 놓이게 돼도 그 칸은 안 덮음.
- 양쪽 눈 위에 눈썹 추가(가로 3칸, 바깥 끝이 1칸 내려감, 짙은 검정). 앞머리에 덮이는 자리는 피함.
- 눈 바깥쪽 위에 검은 속눈썹 1칸씩 추가(눈 뜬 프레임은 눈 윗줄의 바깥 옆 칸, 감은 프레임은 감은 눈 선 위의 바깥 끝 칸).
  속눈썹 자리는 반드시 은지의 원래 얼굴 칸(피부/눈 칸)이어야 함(머리카락 칸을 바꾸지 않기 위해).
"""
import numpy as np

BLACK = (10, 10, 11)


def skin_mask(a):
    r, g, b, al = (a[..., i].astype(int) for i in range(4))
    return (al > 0) & (r > 200) & (g > 140) & (b > 110) & (r - b > 12)


def dark_mask(a):
    r, g, b, al = (a[..., i].astype(int) for i in range(4))
    return (al > 0) & (r + g + b < 120)


def transplant(E, J, ecols, erows, jcols, jrows, dx, lash=True, blink=False, strict=True, brows=True):
    """E: 은지 프레임(RGBA), J: 같은 종류의 지민 프레임. ecols/erows = 은지의 "원래" 눈 칸, jcols/jrows = 지민 눈 칸.
    dx = 지민 → 은지 가로 이동(칸). 세로 이동은 눈 첫 줄을 맞춰서 자동 계산."""
    E = E.copy()
    dy = erows[0] - jrows[0]
    face = skin_mask(E)
    for r in erows:
        for c in ecols:
            face[r, c] = True
    sk_j = skin_mask(J)
    r0 = jrows[0]                                              # 지민 얼굴 창: 눈 첫 줄 ~ 턱(피부가 3칸 이상 있는 마지막 줄)
    r1 = max(r for r in range(r0, J.shape[0]) if sk_j[r].sum() >= 3 and r <= jrows[-1] + 5)
    cols = np.where(sk_j[r0:r1 + 1].any(axis=0))[0]
    c0, c1 = int(cols.min()) - 2, int(cols.max()) + 2
    out = E.copy()
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
            tr, tc = r + dy, c + dx
            if not (0 <= tr < E.shape[0] and 0 <= tc < E.shape[1]):
                continue
            if face[tr, tc] and J[r, c, 3] > 0:
                out[tr, tc] = J[r, c]
    skin_after = skin_mask(out)                     # 눈썹 자리 판정용: 얼굴 교체 직후(속눈썹 그리기 전)의 피부 칸
    if brows:
        top = jrows[0] + dy
        for eye_col, outward in ((jcols[0] + dx, -1), (jcols[1] + dx, 1)):
            # 눈 바로 위 가로 3칸, 바깥쪽 끝 1칸이 한 줄 아래로 살짝 내려가는 눈썹. 눈 윗줄에서 2칸 위가 기본이고,
            # 그 자리가 앞머리(피부가 아닌 칸)에 덮이면 눈과 앞머리 사이(눈 바로 위 1칸)로 내려서 배치.
            for row in (top - 2, top - 1):
                cells = [(row, eye_col - outward), (row, eye_col), (row + 1, eye_col + outward)]
                if all(skin_after[r, c] for r, c in cells):
                    for r, c in cells:
                        out[r, c] = (*BLACK, 255)
                    break
            else:
                raise SystemExit(f'눈썹 자리를 못 찾았어요(눈 칸 {eye_col}): 앞머리에 다 덮임')
    if lash:
        L, R = jcols[0] + dx, jcols[1] + dx
        if blink:                                   # 감은 눈: 감은 눈 선(눈 아랫줄) 바로 위, 선의 바깥 끝 칸
            row = jrows[-1] + dy - 1
        else:                                       # 뜬 눈: 눈 윗줄의 바깥쪽 옆 칸 (바깥으로 살짝 뻗음)
            row = jrows[0] + dy
        for tc in (L - 1, R + 1):
            # 속눈썹은 "은지의 원래 얼굴 칸"(피부/눈 칸) 위에만 놓음 → 은지 머리카락 칸은 절대 안 바뀜
            if strict and not face[row, tc]:
                raise SystemExit(f'속눈썹 자리({row},{tc})가 은지 얼굴 칸이 아니에요(머리카락 칸일 수 있음)')
            out[row, tc] = (*BLACK, 255)
    return out
