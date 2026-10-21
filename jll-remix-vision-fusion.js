/* 비전 + SPS의 방식 결합 장면.
   슬로건의 네 가지 다짐(새로운 도전 · 끊임없는 혁신 · 더 나은 내일 · 가능성)이 네 개의 점이 되어 한 번 휘는 궤도로 심볼 자리에 안착하고,
   가운데 점(SPS)이 이를 잇는다. 심볼은 창이 되어 각 다짐의 영상을 보여주고, 그 뒤로는 카드가 넘어가듯 한 장씩:
   왼쪽 창(새로운 도전 · 발사)이 제 자리에서 원으로 퍼져 화면을 채우고(바람 창은 다른 창들과 함께 제 자리에서 녹아든다),
   에너지 → 미래 도시 → 서울이 각자 제 창 자리에서 같은 방식으로 원으로 퍼져 앞 장을 덮는다. 앞 장은 살짝 물러난다.
   각 장에 다짐과 설명이 따라오고, 마지막에 'SPS의 방식' 문장이 같은 자리에 앉는다.
   스크롤 진행도 p(0~1) 하나로만 움직인다. frame(p, geo)는 순수 함수다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root) root.SPSVisionFusion = api.start(root);
})(typeof window === 'undefined' ? null : window, function () {
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
  const range = (p, a, b) => smooth((p - a) / (b - a));
  const easeOut = t => 1 - Math.pow(1 - clamp01(t), 3);
  const EASE = t => { t = clamp01(t); return t * t * t * (t * (6 * t - 15) + 10); };   // smootherstep: 양끝에서 속도·가속도 0
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  // 심볼 좌표(assets/logo.svg 의 다섯 원): 가운데, 왼쪽, 위, 오른쪽, 아래. 단어 i(1~4)는 UNIT[i] 자리로 간다.
  const UNIT = [[0, 0], [-1, 0], [0, -1], [1, 0], [0, 1]];
  // 단어별 비행: start = 출발 진행도, length = 비행 길이. 시차와 길이를 다르게 두어 네 점이 같은 박자로 움직이지 않는다.
  // turn(±1)은 심볼 접선 방향을 강제, bend(라디안)는 출발 방향을 더 휘게 할 때만 쓴다.
  const FLIGHT = [null,
    { start: .18, length: .130 },   // 새로운 도전 → 왼쪽
    { start: .20, length: .120 },   // 끊임없는 혁신 → 위
    { start: .22, length: .135 },   // 더 나은 내일 → 오른쪽 (가운데 아래를 크게 돌아 들어온다)
    { start: .24, length: .125 },   // 가능성 → 아래
  ];
  const TRAIL_SAMPLES = 18;
  // 카드 순서: 각 창이 제 자리에서 원으로 퍼져 앞 장을 덮는다. win = 창 번호, grow = 퍼지는 구간, caption = 함께 올라오는 글(1~3).
  // 바람(아래 창)은 카드가 되지 않는다: 첫 카드의 원이 닿으면 다른 창들과 함께 제 자리에서 녹아든다.
  const CARDS = [
    { win: 1, grow: [.50, .60], caption: 1 },      // 새로운 도전 · 발사 (왼쪽 창에서 바로 퍼진다)
    { win: 2, grow: [.64, .73], caption: 2 },      // 끊임없는 혁신 · 에너지
    { win: 3, grow: [.77, .86], caption: 3 },      // 더 나은 내일 · 미래 도시
    { win: 0, grow: [.90, .97], caption: null },   // 서울 (가운데에서 퍼져 마무리)
  ];
  const T = {
    reveal: { start: .01, step: .022, length: .06 },   // 슬로건 줄이 차례로 올라온다
    rest: [.13, .19],        // 다짐 외의 글자가 사라진다
    center: [.36, .41],      // 가운데 점(SPS) 등장
    pulse: [.39, .48],       // 심볼 완성 파동
    open: [.41, .47],        // 점이 창이 되어 각 다짐의 영상이 보인다 (0.47~0.50 머무름)
    copy: [.945, .98],       // 'SPS의 방식' 문장 등장 (서울 원이 글 자리를 덮은 뒤)
  };
  // 흰 바탕으로 시작(data-light="white"): 무대는 흰 바탕으로 올라오고, 점들이 날기 시작할 때(첫 비행) 검정으로 바뀌기 시작해 점들이 심볼 자리로 다가갈 무렵 다 바뀐다
  const LIGHT = [.18, .3];
  // 바탕 영상 판(data-ground="video-…"): 소스. 장면에 들어오면 받고, 바탕이 보이는 동안만 돈다(원 · 영상이 덮으면 멈춘다)
  const GROUND_VIDEOS = { 'video-namsan': 'assets/vid/Namsan.mp4', 'video-seoul': 'assets/vid/video1.mp4', 'video-water': 'assets/vid/%EB%AC%BC.mp4' };   // video-namsan = 히어로 첫 영상(이미 받아 둔 파일)
  function lightState(q) { return range(q, LIGHT[0], LIGHT[1]); }
  const FADE_PART = .12;     // 카드가 퍼지기 전, 제 창 자리에 원으로 다시 나타나는 구간(퍼짐 구간의 앞 12%)
  const RECEDE = .04;        // 다음 카드가 퍼지는 동안 앞 장이 물러나는 비율
  // 단어 자리에서 심볼 자리까지 한 번만 휘는 에르미트 곡선. 도착 방향은 심볼 원의 접선(진행 방향을 이어가는 쪽),
  // 출발 방향은 그 접선을 현(弦)에 대해 거울상으로 둔 것이라 원호에 가깝고 변곡이 없다.
  function flightCurve(i, geo) {
    const cx = geo.w / 2, cy = geo.h / 2, S = Math.max(1, Math.min(geo.w, geo.h)), u = UNIT[i], f = FLIGHT[i], s = geo.words[i];
    const P0 = [s.x, s.y], P1 = [cx + geo.spacing * u[0], cy + geo.spacing * u[1]];
    const dx = P1[0] - P0[0], dy = P1[1] - P0[1], D = Math.hypot(dx, dy);
    if (D < .02 * S) return { P0, P1, T0: [dx, dy], T1: [dx, dy] };     // 단어가 거의 제자리: 직선으로
    const dir = [dx / D, dy / D];
    let tan = [-u[1], u[0]];                                             // 심볼 원의 접선
    const sense = f.turn || ((tan[0] * dir[0] + tan[1] * dir[1]) >= 0 ? 1 : -1);   // 진행 방향을 이어가는 쪽
    tan = [tan[0] * sense, tan[1] * sense];
    const phi = Math.atan2(dir[0] * tan[1] - dir[1] * tan[0], dir[0] * tan[0] + dir[1] * tan[1]);   // 현 → 도착 접선 각
    const dep = rot(dir, -phi + (f.bend || 0));                          // 출발 = 도착의 거울상 → 한 번 휘는 원호
    const L = Math.min(1.6 * D, D / Math.pow(Math.cos(phi / 2), 2));     // 원호가 되는 접선 길이(고리가 생기지 않게 상한)
    return { P0, P1, T0: [dep[0] * L, dep[1] * L], T1: [tan[0] * L, tan[1] * L] };
  }
  function hermite(c, u) {
    const u2 = u * u, u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    return [h00 * c.P0[0] + h10 * c.T0[0] + h01 * c.P1[0] + h11 * c.T1[0],
            h00 * c.P0[1] + h10 * c.T0[1] + h01 * c.P1[1] + h11 * c.T1[1]];
  }
  // raw(0~1)를 받아 안에서 완만하게 가감속한다.
  function flightPoint(i, raw, geo) { return hermite(flightCurve(i, geo), EASE(clamp01(raw))); }
  function wordState(i, p) {
    const f = FLIGHT[i];
    const shrink = range(p, f.start, f.start + f.length * .3);   // 단어가 점으로 줄어든다
    return { scale: 1 - .7 * shrink, opacity: 1 - shrink };
  }
  function lineReveal(i, p) {
    const s = T.reveal.start + i * T.reveal.step;
    return easeOut((p - s) / T.reveal.length);
  }
  // 어느 점에서 화면 네 모서리까지 가장 먼 거리: 그 반지름이면 원이 화면을 다 덮는다.
  function coverRadius(cx, cy, geo) {
    return Math.max(Math.hypot(cx, cy), Math.hypot(geo.w - cx, cy), Math.hypot(cx, geo.h - cy), Math.hypot(geo.w - cx, geo.h - cy));
  }
  // 카드 j 의 진행: fade = 제 창 자리에 원으로 다시 나타남, grow = 원이 퍼져 화면을 덮음. 첫 카드(발사)는 창으로 이미 보이므로 바로 퍼진다.
  function cardState(j, p) {
    const c = CARDS[j], len = c.grow[1] - c.grow[0];
    if (j === 0) return { fade: 1, grow: range(p, ...c.grow) };
    return { fade: range(p, c.grow[0], c.grow[0] + FADE_PART * len), grow: range(p, c.grow[0] + FADE_PART * len, c.grow[1]) };
  }
  // 글 k(1~3): 그 카드가 퍼지는 동안 올라오고, 다음 카드가 퍼지기 시작하면 위로 빠진다 (다음 원이 글 자리에 닿기 전에 사라진다).
  function captionRange(k) {
    const j = CARDS.findIndex(c => c.caption === k);
    if (j < 0) return null;
    const c = CARDS[j], len = c.grow[1] - c.grow[0], next = CARDS[j + 1];
    return { in: [c.grow[0] + .35 * len, c.grow[1]], out: [next.grow[0], next.grow[0] + .45 * (next.grow[1] - next.grow[0])] };
  }
  function captionState(k, p, variant = 'circle', film = 'rise') {
    if (variant === 'rise') {
      // 세로 열 판: 열 순서대로 한 편씩, 오른쪽에서 아래에서 위로 올라왔다가 위로 빠진다 (film 에 따라 박자가 다르다)
      const idx = COLUMN.order.indexOf(k);
      if (idx < 0) return { opacity: 0, y: 40 };
      const r = seqRange(idx, film), i = range(p, ...r.in), o = idx === 3 ? 0 : range(p, ...r.out);   // 마지막 글(더 나은 내일)은 끝까지 남는다
      return { opacity: i * (1 - o), y: (1 - i) * 40 - o * 24 };
    }
    const c = captionRange(k);
    if (!c) return { opacity: 0, y: 24 };
    const i = range(p, ...c.in), o = range(p, ...c.out);
    return { opacity: i * (1 - o), y: (1 - i) * 24 - o * 16 };   // 카드와 같은 호흡으로: 올라오며 나타나고, 넘어갈 때 위로
  }
  // 글이 앉는 바닥의 음영: 첫 영상 카드가 퍼지며 생기고(shade), 서울이 퍼지며 깊어진다(deep). 끊김 없이 p 를 따른다. 세로 열 판은 바닥이 어두워 음영이 없다.
  function shadeState(p, variant = 'circle') {
    if (variant === 'rise') return { shade: 0, deep: 0 };
    return { shade: range(p, ...CARDS[0].grow), deep: range(p, ...CARDS[CARDS.length - 1].grow) };
  }
  // '올라오는' 판(rise): 창이 열린 뒤 네 창이 왼쪽 세로 열로 모인다(위→아래: 끊임없는 혁신 · 새로운 도전 · 가능성 · 더 나은 내일).
  // 서울 창은 열이 생기며 사라진다. 그 뒤 열 순서대로 글이 오른쪽에서 한 편씩 올라오고, 그 차례의 창이 살짝 커진다.
  const COLUMN = { order: [2, 1, 4, 3], move: [.50, .62], first: .595, handoff: [.61, .65], radius: .042, gap: .046, label: 22, backdrop: .5 };   // radius·gap 은 짧은 변(S) 비율, label 은 이름표 높이(px), backdrop 은 바탕 영상의 밝기
  // filmScreens: 열 장면(기본 박자)에서 영상 한 편이 차지하는 스크롤(무대 높이 배수). 이전에는 .55화면이라 전환이 너무 빨랐다.
  const SEQ = { start: .65, end: .95, filmScreens: 1, cross: .45 };   // cross: 다음 편이 올라오는 구간(한 편 길이 비율)
  const ACTIVE_GROW = .45;   // 글 차례인 원의 확대 비율
  const TAG_HALF = 10.5;   // 이름표 높이의 절반(15px · 줄높이 1.4): 원 아래에 둘 때 윗변을 원에서 14px 띄운다
  function columnSlots(geo) {
    const S = Math.max(1, Math.min(geo.w, geo.h)), R = S * COLUMN.radius, gap = S * COLUMN.gap;
    const left = Math.min(40, Math.max(24, geo.w * .02)) + 16 + R;         // 오른쪽 페이지 메뉴(right: clamp(24px, 2vw, 40px) + 안쪽 16px)와 거울처럼 왼쪽 가장자리에 붙인다
    const block = 4 * 2 * R + 3 * gap + 4 * COLUMN.label;
    const top = (geo.h - block) / 2;
    return COLUMN.order.map((win, k) => ({ win, x: left, y: top + R + k * (2 * R + COLUMN.label + gap), r: R }));
  }
  // film 'scale'(원래 영상 장면의 박자): 단위 u = 차례의 절반(=전환 길이). 글은 s-.05u 에서 s+.3u 로 올라오고 s+.9u 에서 s+1.25u 로 빠진다(한화 sceneState.text).
  // 기본 박자: 첫 글(k 0)은 맨 위 원이 열에 닿는 순간(COLUMN.first)부터 올라와 원들이 다 자리 잡을 무렵 다 올라와 있다(빈 바탕 영상만 보이는 기다림이 없다).
  function seqRange(k, film = 'rise') {
    const len = (SEQ.end - SEQ.start) / 4, s = SEQ.start + k * len;
    if (film === 'scale') { const u = len / 2; return { in: [s - .05 * u, s + .3 * u], out: [s + .9 * u, s + 1.25 * u], mid: s + .6 * u }; }
    // 다음 편이 올라오기 시작하면(1 - cross) 글이 빠지고, 새 편이 거의 다 올라왔을 때 그 글이 올라온다
    const out = [s + (1 - SEQ.cross) * len, s + (1 - SEQ.cross + .15) * len], mid = s + .35 * len;
    if (k === 0) return { in: [COLUMN.first, COLUMN.move[1]], out, mid };
    return { in: [s - .1 * len, s + .2 * len], out, mid };
  }
  // 차례인 원의 크기 진행(0~1, 커질 때 살짝 넘쳤다 돌아온다). 넘겨받듯: 앞 원이 줄어드는 바로 그 구간(차례 경계의 앞뒤 12%)에 다음 원이 커진다.
  const backOut = t => { const c1 = 1.9, c3 = c1 + 1; t = clamp01(t); return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const HANDOFF = .12;   // 경계 앞뒤로 차례 길이의 12%
  // 첫 차례가 시작되는 때: 기본 박자는 맨 위 원이 열에 닿는 순간(COLUMN.first), 원래 영상 장면 박자(scale)는 첫 편이 다 올라온 뒤(SEQ.start)
  const firstTurn = film => film === 'scale' ? SEQ.start : COLUMN.first;
  function circleActive(k, p, film = 'rise') {
    if (p < firstTurn(film)) return 0;
    const len = (SEQ.end - SEQ.start) / 4, s = SEQ.start + k * len, h = HANDOFF * len;
    const growFrom = k === 0 ? firstTurn(film) : s - h;                         // 첫 원은 열에 닿자마자 커진다
    const grow = backOut((p - growFrom) / (k === 0 ? 2 * h : 2 * h));
    const shrink = k === 3 ? 0 : EASE((p - (s + len - h)) / (2 * h));           // 다음 원이 커지는 구간과 같은 구간에 줄어든다
    return Math.max(0, grow * (1 - shrink));
  }
  // 열의 원을 누르면 그 영상의 글이 다 올라온 지점으로 스크롤한다
  function seqTarget(k, film = 'rise') { return seqRange(k, film).mid; }
  // 바탕 영상(별도 video 두 장이 번갈아 맡는다): 원이 열로 움직이기 시작할 때부터 첫 편이 깔리고, 글 차례마다 다음 편이 앞 편이 사라지는 동안 겹쳐 들어온다. 마지막 편은 끝까지 남는다.
  // 한화처럼: 다음 편은 화면 아래에서 올라와 앞 편을 덮고(y 100% → 0), 앞 편은 그동안 살짝 위로 밀려난다(0 → -14%). 덮이면 앞 편은 쉰다.
  // 첫 편은 원이 열로 움직이기 시작할 때 아래에서 올라온다. 마지막 편은 끝까지 남는다. 어둡기는 바탕 위의 고정 막(50%)이 맡는다.
  // film: 'rise'(기본, 그대로 올라온다) · 'scale'(한화 영상 장면의 모션: 창이 열리며 올라오고, 앞 편은 창이 닫히며 위로 빠진다)
  // size 는 창 크기(%), radius 는 모서리(vw), innerY 는 안의 영상 이동(%). rise 판에서는 size 100 · radius 0 · innerY 0 이다.
  function backdropFrame(k, p, film = 'rise') {
    const len = (SEQ.end - SEQ.start) / 4, s = SEQ.start + k * len, cross = (film === 'scale' ? FILM.cross : SEQ.cross) * len;
    const rawEnter = k === 0 && film !== 'scale' ? range(p, COLUMN.move[0], COLUMN.move[0] + .07) : range(p, s - cross, s);
    const rawLeave = k < 3 ? range(p, s + len - cross, s + len) : 0;
    if (film !== 'scale') {
      const e = EASE(rawEnter), n = EASE(rawLeave);
      return { visible: rawEnter > 0 && !(k < 3 && p >= s + len), y: (1 - e) * 100 - n * 14, z: k + 1, enter: rawEnter, size: 100, radius: 0, innerY: 0 };
    }
    const enter = rawEnter, leave = rawLeave;   // 한화처럼 스크롤에 선형
    return { visible: enter > 0 && !(k < 3 && leave >= 1), y: (1 - enter - leave) * 100, z: k + 1, enter,
      size: 100 - (100 - FILM.size) * (1 - enter + leave), radius: FILM.radius * (1 - enter + leave), innerY: FILM.inner[0] * (1 - enter) + FILM.inner[1] * leave };
  }
  function backdropState(k, p) { const f = backdropFrame(k, p); return f.visible ? COLUMN.backdrop : 0; }   // 이전 이름(보이는 동안의 어둡기)
  // 바탕 video a(0) 는 1·3번째 편, b(1) 는 2·4번째 편. 앞 편이 완전히 사라진 뒤 다음 편의 소스를 미리 받아 둔다.
  function backdropSlot(element, p) {
    const len = (SEQ.end - SEQ.start) / 4;
    return p >= SEQ.start + (element + 1) * len ? element + 2 : element;
  }
  // 세로 열 판의 한 프레임. 1) 네 창이 심볼 자리에서 왼쪽 열의 제 칸으로 미끄러져 오며 원 안의 영상이 축소된다. 서울은 사라진다.
  // 2) 자리를 잡으면 정지 섬네일(포스터)이 원을 이어받고, 창은 글 차례인 영상을 화면 전체에 깐다. 3) 글 차례인 원만 살짝 커지고 또렷하다.
  function columnFrame(p, geo, circ, open, film = 'rise') {
    const slots = columnSlots(geo), move = range(p, ...COLUMN.move), hand = range(p, ...COLUMN.handoff);
    return UNIT.map((u, i) => {
      const c = circ[i], base = { trail: c.trail, trailOpacity: c.trailOpacity, mediaScale: 1 };
      // tagY 는 이름표의 세로 가운데
      const mk = (ex, ey, r, opacity, tagOpacity, tagY, extra) => ({ ...base, mode: 'circle', ex, ey, er: r, opacity, visible: opacity > .002,
        tagX: ex, tagY, tagOpacity, x: ex - r, y: ey - r, w: 2 * r, h: 2 * r, rx: r, ...(extra || {}) });
      if (i === 0) { const g = range(p, COLUMN.move[0], COLUMN.move[0] + .2 * (COLUMN.move[1] - COLUMN.move[0])), o = open * (1 - g); return mk(c.cx, c.cy, c.r * (1 - .6 * g), o, 0, c.cy); }   // 서울은 열이 움직이기 시작하자마자(첫 20%) 작아지며 사라진다
      const k = COLUMN.order.indexOf(i), slot = slots[k];
      const t = EASE(clamp01(move * 1.25 - k * .08));                            // 위 칸부터 차례로 자리를 잡는다
      const act = circleActive(k, p, film);                                      // 앞 원이 줄어드는 동안 다음 원이 커진다. 마지막 원은 끝까지 차례
      const dim = p < firstTurn(film) ? 1 : .55 + .45 * Math.min(1, act);        // 차례인 원만 또렷하게
      const ex = c.cx + (slot.x - c.cx) * t, ey = c.cy + (slot.y - c.cy) * t;
      const r = (c.r + (slot.r - c.r) * t) * (1 + ACTIVE_GROW * act);     // 차례인 원은 1.45배로 커진다(스크롤을 따라 부드럽게)
      const below = ey + r + 14 + TAG_HALF;                                      // 심볼에서는 원 가운데, 열에서는 원 아래
      const thumb = { x: slot.x, y: slot.y, r, opacity: open * dim * hand };     // 자리를 잡으면 정지 섬네일이 원을 이어받는다
      if (hand >= 1) return mk(slot.x, slot.y, r, 0, open * dim, below, { thumb });   // 열이 완성된 뒤: 창은 쉬고 섬네일과 바탕 video 가 맡는다
      // 이름표: 열이 생기기 시작하면 심볼 자리에서 사라졌다가, 원이 제 칸에 닿는 동안 아래에서 떠오르며 다시 나타난다
      const fo = range(move, 0, .25), tagOpacity = open * dim * ((1 - fo) + EASE(t) * fo), lift = (1 - t) * 14 * fo;
      const thumbScale = (2 * r) / Math.max(1, geo.h);
      const media = t > 0 ? { x: (ex - geo.w / 2) * t, y: (ey - geo.h / 2) * t, scale: 1 + (thumbScale - 1) * t } : null;   // 원 안에서 영상이 축소된다
      return mk(ex, ey, r, open * dim * (1 - hand), tagOpacity, ey + (below - ey) * t + lift, { media, thumb });
    });
  }
  // '로고' 도입부(data-intro="logo", 열 판 위에 얹는다): 심볼이 완성된 자리(T.open 직전)에서 한 화면 높이(screens)만큼 멈추고,
  // 그동안 심볼이 왼쪽으로 비키며 그 뒤에서 SPS 글자가 끌려 나와 로고가 완성된다. 창이 열리면 글자는 사라지고 심볼은 가운데로 돌아와 열 판이 그대로 이어진다.
  // 좌표는 assets/logo.svg 단위(심볼 가운데 11.73,11.86 · 원 간격 unit 8.55): k = geo.spacing / unit 로 무대 픽셀이 된다.
  // travel 은 도입부가 없는 판의 스크롤 길이(무대 높이 배수: 섹션 8.4 - 무대 1). 도입부 판은 섹션이 한 화면 더 길다(CSS 9.4).
  const LOGO = { at: T.open[0], screens: 1, travel: 7.4, unit: 8.55, symbol: [11.73, 11.86], letters: [29.59, 65.47], start: -44, slide: [.03, .5], reveal: [.03, .3] };
  // '바로 심볼' 시작(data-entry="symbol"): 슬로건 없이 무대가 열리자마자 네 점이 원래처럼 한 번 휘는 궤도로 심볼 자리에 날아든다.
  // 진행은 검은 무대가 화면 아래로 들어오는 순간(섹션 윗변 = 화면 아랫변)부터 시작한다(lead: 그 사이 스크롤 ≈ 화면 높이 1.1 무대). 그 순간 q = skip/travel(.115)이라
  // 아직 점이 없고(첫 비행 .18), 무대가 반쯤 올라왔을 때 첫 점이 태어나 날기 시작해, 무대가 다 차면 네 점이 모두 날고 있다. 슬로건 구간은 건너뛴다.
  // CSS 섹션 높이 = 설계 스크롤(travelScreens) - lead + 무대 1 (V4 6.45, 로고 도입부와 함께면 7.45).
  // trail 은 궤도 꼬리가 덮는 비행 비율(기본 판은 .30): 슬로건이 없으니 꼬리를 더 길게 끌어 궤도가 잘 보이게 한다.
  // from 은 보이지 않는 슬로건 네 줄의 단어 자리를 흉내 낸 출발점(무대 너비·높이 비율).
  // filmScreens: 영상 한 편이 차지하는 스크롤(무대 높이 배수). 원래 영상 장면(한화)과 같이 2 = 전환 1화면 + 머무름 1화면.
  // from: 슬로건 자리보다 두 배쯤 바깥(왼쪽 위·아래)에서 출발해 궤도와 꼬리가 길게 보인다
  const ENTRY = { skip: .85, lead: 1.1, trail: .55, trailSamples: 28, filmScreens: 2, from: [[-.15, -.29], [-.13, -.09], [-.11, .11], [-.18, .31]] };
  // 영상 전환 'scale'(data-film="scale") = 원래 영상 장면(한화, jll-remix-hanwha.js sceneState)의 모션 그대로:
  // 다음 편은 창(clip-path inset)이 size% 에서 열리며 아래에서 올라오고, 안의 영상은 반대로 밀려(inner[0]% → 0) 시차가 난다.
  // 앞 편은 같은 구간(cross)에 창이 size% 로 닫히며 위로 빠져나가고(안의 영상 0 → inner[1]%), 모서리는 radius vw. 스크롤에 선형이다.
  const FILM = { size: 66, radius: 4.25, cross: .5, inner: [-90, 40] };
  // 시간표 조각: 열 판의 진행도 q 구간마다 스크롤 길이(무대 높이 배수)를 둔다. 기본 판은 한 조각(0~1 = travel 화면).
  // entry 'symbol' 은 앞 슬로건 구간(skip 화면)을 건너뛰고, 영상 네 편 구간(SEQ)을 한 편당 filmScreens 화면으로 늘린다(원래 영상 장면과 같은 박자).
  // intro 'logo' 는 LOGO.at 에서 screens 화면 멈춘다(q 가 같은 조각, hold).
  // film 'scale'(원래 영상 장면의 박자)일 때만 영상 네 편 구간을 한 편당 filmScreens 화면으로 늘린다. 'rise'(V2처럼 그대로 올라옴)는 기본 박자.
  function segments(intro = null, entry = null, film = 'rise') {
    const base = LOGO.travel, segs = [], q0 = entry === 'symbol' ? ENTRY.skip / base : 0;
    const perFilm = film === 'scale' ? ENTRY.filmScreens : SEQ.filmScreens;   // 열 장면의 영상 한 편 = perFilm 화면
    segs.push({ q0, q1: SEQ.start, screens: (SEQ.start - q0) * base }, { q0: SEQ.start, q1: SEQ.end, screens: 4 * perFilm }, { q0: SEQ.end, q1: 1, screens: (1 - SEQ.end) * base });
    if (intro === 'logo') {
      const i = segs.findIndex(g => LOGO.at > g.q0 && LOGO.at <= g.q1), g = segs[i];
      const before = { q0: g.q0, q1: LOGO.at, screens: g.screens * (LOGO.at - g.q0) / (g.q1 - g.q0) };
      segs.splice(i, 1, before, { q0: LOGO.at, q1: LOGO.at, screens: LOGO.screens, hold: true }, { q0: LOGO.at, q1: g.q1, screens: g.screens - before.screens });
    }
    return segs;
  }
  // 설계한 스크롤 길이(무대 높이 배수). CSS 의 섹션 높이는 이 값 + 1(무대)이다.
  function travelScreens(intro = null, entry = null, film = 'rise') { return segments(intro, entry, film).reduce((n, g) => n + g.screens, 0); }
  // 시간표: 진행도 p 를 (q, l) 로 나눈다. q 는 열 판의 진행도, l 은 로고 도입부의 진행도(0~1). 잰 길이가 설계와 달라도 비율로 따라간다.
  function timeline(p, geo, intro = null, entry = null, film = 'rise') {
    const segs = segments(intro, entry, film), designed = travelScreens(intro, entry, film), hold = intro === 'logo' ? LOGO.screens : 0;
    const total = (geo && geo.travelScreens) || designed;
    if (total <= hold) return { q: clamp01(p), l: clamp01(p) >= LOGO.at ? 1 : 0 };   // 멈출 길이가 없다(움직임 줄임 등): 도입부를 건너뛴다
    let s = clamp01(p) * designed, l = 0;
    for (let i = 0; i < segs.length; i++) {
      const g = segs[i];
      if (s <= g.screens + 1e-12 || i === segs.length - 1) {
        if (g.hold) return { q: g.q0, l: clamp01(s / g.screens) };
        return { q: Math.min(1, g.q0 + (g.q1 - g.q0) * clamp01(s / g.screens)), l };
      }
      s -= g.screens;
      if (g.hold) l = 1;
    }
    return { q: 1, l };
  }
  // 시간표의 역: 열 판의 진행도 q 에 닿는 스크롤 진행도 p
  function scrollFor(q, geo, intro = null, entry = null, film = 'rise') {
    const segs = segments(intro, entry, film), designed = travelScreens(intro, entry, film), hold = intro === 'logo' ? LOGO.screens : 0;
    if (designed <= hold) return clamp01(q);
    let acc = 0;
    for (const g of segs) {
      if (!g.hold && q <= g.q1 + 1e-12) return clamp01((q < g.q0 ? acc : acc + g.screens * (q - g.q0) / (g.q1 - g.q0)) / designed);
      acc += g.screens;
    }
    return 1;
  }
  const logoTimeline = (p, geo) => timeline(p, geo, 'logo');
  const logoScroll = (q, geo) => scrollFor(q, geo, 'logo');
  // 도입부 한 프레임: 심볼의 가로 이동(shift)과 글자 묶음의 위치(x, y, k)·투명도. 글자는 심볼 오른쪽 가장자리에서 흐릿하게 잘려(mask) 뒤에서 끌려 나오듯 드러난다.
  // 창이 열리는 동안 심볼만 가운데로 돌아오고 글자는 머문 자리에서 사라진다(따라 움직이면 좁은 화면에서 오른쪽으로 잘린다).
  function logoFrame(p, geo, entry = null, film = 'rise') {
    const { q, l } = timeline(p, geo, 'logo', entry, film);
    const open = range(q, ...T.open), k = geo.spacing / LOGO.unit;
    const emerge = EASE(range(l, ...LOGO.slide));                        // 심볼이 비키고 글자가 나오는 정도(같은 호흡)
    const center = LOGO.letters[1] / 2;                                  // 로고 전체(심볼 왼끝 0 ~ 글자 오른끝)의 가운데
    const travel = -(center - LOGO.symbol[0]) * k * emerge;              // 완성된 로고가 무대 가운데에 오도록 심볼이 비켜난 거리
    const shift = travel * (1 - open);                                   // 창이 열리면 심볼은 돌아온다
    const dx = LOGO.start * k * (1 - emerge);                            // 글자는 심볼 뒤(왼쪽)에서 제 자리로
    const opacity = range(l, ...LOGO.reveal) * (1 - range(open, 0, .6)); // 창이 열리는 동안 글자는 사라진다
    const sy = geo.h / 2, lx = geo.w / 2 + travel;                       // 글자는 머문 자리 기준
    return { q, l, shift, opacity, k, x: lx + dx - LOGO.symbol[0] * k, y: sy - LOGO.symbol[1] * k };
  }
  // variant: 'circle'(기본, 창이 제 자리에서 원으로 퍼진다) · 'rise'(창이 왼쪽 세로 열로 모이고 글이 오른쪽에서 올라온다)
  // intro 'logo' · entry 'symbol' 이면 p 를 시간표로 q 로 바꿔 판을 그리고, 로고 도입부는 심볼(원·이름표·궤적)을 shift 만큼 옆으로 옮긴다.
  function frame(p, geo, variant = 'circle', intro = null, entry = null, film = 'rise') {
    if (!intro && !entry) return frameAt(p, geo, variant, null, film);
    const tl = timeline(p, geo, intro, entry, film), states = frameAt(tl.q, geo, variant, entry, film);
    if (intro !== 'logo') return states;
    const shift = logoFrame(p, geo, entry, film).shift;
    return states.map(s => ({ ...s, x: s.x + shift, ex: s.ex + shift, tagX: s.tagX + shift, trail: s.trail.map(pt => [pt[0] + shift, pt[1]]) }));
  }
  function frameAt(p, geo, variant, entry, film = 'rise') {
    const rise = variant === 'rise';
    if (entry === 'symbol') geo = { ...geo, words: [null, ...ENTRY.from.map(([ox, oy]) => ({ x: geo.w / 2 + ox * geo.w, y: geo.h / 2 + oy * geo.h }))] };   // 슬로건 없이도 같은 궤도
    const S = Math.max(1, Math.min(geo.w, geo.h)), dot = S * .041;
    const open = range(p, ...T.open);
    const spread = 1 + open * .9;   // 창이 열리면 심볼 전체가 커진다: 간격 1.9배, 점 2.25배
    // 1) 다섯 원의 위치·크기
    const circ = UNIT.map((u, i) => {
      let cx, cy, arrive, t = 1, trail = [], trailOpacity = 0;
      if (i === 0) {
        const g = range(p, ...T.center);
        cx = geo.w / 2; cy = geo.h / 2;
        arrive = g * (g < 1 ? 1 + .18 * Math.sin(Math.PI * g) : 1);   // 살짝 튀어오르며 등장
      } else {
        const f = FLIGHT[i], raw = clamp01((p - f.start) / f.length);
        t = EASE(raw);
        [cx, cy] = flightPoint(i, raw, geo);
        arrive = EASE(Math.min(1, raw * 3)) * (.6 + .4 * t);          // 줄어드는 단어 안에서 작게 태어나 도착하며 제 크기
        if (raw > .01 && raw < .995) {
          const reach = entry === 'symbol' ? ENTRY.trail : .30, samples = entry === 'symbol' ? ENTRY.trailSamples : TRAIL_SAMPLES;   // 바로 심볼 판은 꼬리가 길다
          const back = Math.max(0, raw - reach);
          for (let s = 0; s <= samples; s++) trail.push(flightPoint(i, back + (raw - back) * s / samples, geo));
          trailOpacity = .45 * (1 - t * t);
        }
      }
      cx = geo.w / 2 + (cx - geo.w / 2) * spread; cy = geo.h / 2 + (cy - geo.h / 2) * spread;
      return { cx, cy, r: dot * arrive * (1 + open * 1.25), trail, trailOpacity };
    });
    if (rise) return columnFrame(p, geo, circ, open, film);
    // 2) 첫 카드(발사)의 원: 왼쪽 창 자리에서 퍼진다. 그 앞선이 지나가면 다른 창들(바람 포함)은 제 자리에서 1.3배 커지며 녹아든다.
    const lead = circ[CARDS[0].win], leadGrow = cardState(0, p).grow;
    const leadR = lead.r + (coverRadius(lead.cx, lead.cy, geo) - lead.r) * leadGrow;
    const cardOf = i => CARDS.findIndex(c => c.win === i);
    return UNIT.map((u, i) => {
      const c = circ[i], j = cardOf(i), card = CARDS[j];
      const base = { trail: c.trail, trailOpacity: c.trailOpacity, mediaScale: 1 };
      const result = (ex, ey, r, opacity, visible, tagOpacity) => ({ ...base, mode: 'circle', ex, ey, er: r, opacity, visible,
        tagX: c.cx, tagY: c.cy, tagOpacity,   // 이름표는 원 가운데(가운데 기준 배치)
        x: ex - r, y: ey - r, w: 2 * r, h: 2 * r, rx: r });
      if (card && (j === 0 || p >= card.grow[0])) {
        // 카드 모드: 제 창 자리에 원으로 나타나(앞 12%) 화면을 덮을 때까지 퍼진다. 뒤 카드가 다 덮으면 보이지 않는 것으로 친다(영상 정지).
        const st = cardState(j, p);
        const r = c.r + (coverRadius(c.cx, c.cy, geo) - c.r) * st.grow;
        const opacity = open * st.fade;
        const next = CARDS[j + 1];
        const coveredLater = CARDS.slice(j + 1).some(k => cardState(CARDS.indexOf(k), p).grow >= 1);
        const state = result(c.cx, c.cy, r, opacity, opacity > .002 && !coveredLater,
          j === 0 ? open * (1 - range(leadGrow, .30, .65)) : 0);          // 첫 카드의 이름표는 제 자리에 남았다 사라진다
        if (next) state.mediaScale = 1 - RECEDE * cardState(j + 1, p).grow;   // 다음 장이 퍼지는 동안 살짝 물러난다
        return state;
      }
      // 카드가 아닌 창(바람)과 아직 차례가 오지 않은 창: 첫 카드의 원이 닿으면 제 자리에서 커지며 녹아든다 ('각 영역에서 퍼지게')
      const d = Math.hypot(c.cx - lead.cx, c.cy - lead.cy);
      const touch = c.r > 0 && leadGrow > 0 ? clamp01((leadR - (d - c.r)) / (2.4 * c.r)) : 0;
      const ab = smooth(touch);
      const r = c.r * (1 + .3 * ab);
      const opacity = open * (1 - ab);
      return result(c.cx, c.cy, r, opacity, opacity > .002, opacity);
    });
  }
  function phaseOf(p) { return p < T.open[0] ? 'gather' : p < CARDS[0].grow[0] ? 'open' : p < CARDS[CARDS.length - 1].grow[0] ? 'rise' : 'full'; }
  function start(win) {
    const doc = win.document;
    const section = doc.querySelector('.hw-fusion');
    if (!section) return null;
    const variant = section.dataset?.variant === 'rise' ? 'rise' : 'circle';   // V4 선택 스크립트가 data-variant 를 적는다
    const intro = section.dataset?.intro === 'logo' ? 'logo' : null;           // 'logo': 심볼이 비키며 SPS 글자가 드러나는 도입부
    const entry = section.dataset?.entry === 'symbol' ? 'symbol' : null;       // 'symbol': 슬로건 없이 바로 심볼
    const film = section.dataset?.film === 'scale' ? 'scale' : 'rise';          // 바탕 영상 전환: 그대로 올라옴 · 작게 올라와 커짐
    const column = variant === 'rise';                                         // 열 장면(V2·V3·V4 포함)은 시간표를 쓴다(영상 구간을 늘린다)

    const stage = section.querySelector('.hw-fusion-stage');
    const svg = section.querySelector('.hw-fusion-svg');
    const shapes = [...svg.querySelectorAll('mask rect')];
    const trails = [...svg.querySelectorAll('.hw-fusion-trail')];
    const red = svg.querySelector('.hw-fusion-red');
    const windows = [...section.querySelectorAll('.hw-fusion-window')].sort((a, b) => Number(a.dataset.window) - Number(b.dataset.window));
    const media = windows.map(el => el.querySelector('video, img'));
    const playing = windows.map(() => false), warmed = windows.map(() => false);
    const tags = [...section.querySelectorAll('.hw-fusion-tag')];
    const thumbs = [];   // 세로 열 판의 정지 섬네일(창 번호별)
    const groundVideo = section.querySelector('.hw-fusion-ground-video');   // 바탕 영상(판에 따라)
    let groundPlaying = false;
    section.querySelectorAll('.hw-fusion-thumb').forEach(el => { thumbs[Number(el.dataset.window)] = el; });
    // 열의 원을 누르면 그 영상 차례로 부드럽게 이동한다(한화 스크립트의 Lenis 스크롤을 쓴다)
    thumbs.forEach((el, i) => {
      if (!el) return;
      el.addEventListener?.('click', () => {
        const k = COLUMN.order.indexOf(i);
        if (k < 0) return;
        if (!geo) measure();
        const target = column ? scrollFor(seqTarget(k, film), geo, intro, entry, film) : seqTarget(k, film);   // 열 장면은 시간표를 역산한다
        const top = geo.start + target * (geo.end - geo.start);
        if (typeof win.SPSScrollTo === 'function') win.SPSScrollTo(top);
        else win.scrollTo?.({ top, behavior: reduce.matches ? 'auto' : 'smooth' });
      });
    });
    const backdrops = [...section.querySelectorAll('.hw-fusion-backdrop')];   // 세로 열 판의 바탕 영상 두 장
    const films = backdrops.map(el => el.parentElement && el.parentElement.classList?.contains?.('hw-fusion-film') ? el.parentElement : el);   // 영상을 감싼 창(clip·이동). 없으면 영상 자체
    const backdropPlaying = backdrops.map(() => false);
    const captions = [...section.querySelectorAll('.hw-fusion-caption')].sort((a, b) => Number(a.dataset.caption) - Number(b.dataset.caption));
    const pulse = svg.querySelector('.hw-fusion-pulse');
    const logo = svg.querySelector('.hw-fusion-logo'), wordmark = svg.querySelector('.hw-fusion-wordmark'), wordClip = svg.querySelector('.hw-fusion-wordmark-clip'), wordFade = svg.querySelector('.hw-fusion-wordmark-fade');   // 도입부의 SPS 글자와 그 가림막
    const slogan = section.querySelector('.hw-fusion-slogan');
    const lines = [...slogan.querySelectorAll('.hw-fusion-line > span')];
    const words = [...slogan.querySelectorAll('.hw-fusion-word')];
    const rests = [...slogan.querySelectorAll('.hw-fusion-rest')];
    const copy = section.querySelector('.hw-fusion-copy');
    const reduce = win.matchMedia('(prefers-reduced-motion: reduce)');
    // 전체 메뉴나 대화상자가 열려 있으면 페이지의 다른 영상처럼 멈춘다.
    const overlay = () => Boolean(doc.body?.classList?.contains('sps-menu-open')) || Boolean(doc.querySelector('dialog[open]'));
    let pending = 0, geo = null, lastKey = null;
    function setPlaying(i, want) {
      const item = media[i];
      if (!item || item.tagName !== 'VIDEO' || want === playing[i]) return;
      playing[i] = want;
      if (want) item.play().catch(() => {}); else item.pause();
    }
    function measure() {
      // 글자 위치는 변형을 걷어낸 상태에서 잰다.
      lines.forEach(el => { el.style.transform = ''; });
      words.forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
      const rect = stage.getBoundingClientRect();
      const w = stage.clientWidth || rect.width, h = stage.clientHeight || rect.height;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      red.setAttribute('width', w); red.setAttribute('height', h);
      const wordCenters = [null, ...words.map(el => {
        const r = el.getBoundingClientRect();
        return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 };
      })];
      const top = section.getBoundingClientRect().top + win.scrollY;
      // 바로 심볼 판은 무대가 화면 아래로 들어오는 순간부터 진행한다: 시작을 화면 높이만큼 앞당긴다
      const lead = entry === 'symbol' ? (win.innerHeight || h) : 0;
      const travel = Math.max(1, section.offsetHeight - stage.offsetHeight + lead);
      // travelScreens: 잰 스크롤 길이(무대 높이 배수). 움직임을 줄인 환경은 섹션이 접혀(height:auto) 뜻이 없으니 설계값을 쓰게 둔다.
      geo = { w, h, spacing: Math.min(w, h) * .11, words: wordCenters, start: top - lead, end: top - lead + travel, travelScreens: reduce.matches ? 0 : travel / Math.max(1, h) };
      lastKey = null;
    }
    function paint() {
      pending = 0;
      if (!geo) measure();
      const p = reduce.matches ? 1 : clamp01((win.scrollY - geo.start) / (geo.end - geo.start));
      const tl = column ? timeline(p, geo, intro, entry, film) : { q: p, l: 0 }, q = tl.q;   // 열 장면은 시간표로 q 를 구한다
      const base = !reduce.matches && !doc.hidden && !overlay() && q > T.open[0] - .06 && q < 1;
      const groundKind = section.dataset?.ground || '';                          // 바탕 판: image(우주) · video-seoul · video-water. 트윅이 바로 바꾼다
      const ground = Boolean(groundKind);                                       // 바탕은 검정에서 떠오른다
      const lit = section.dataset?.light === 'white' && !ground;                // 흰 바탕 시작은 바탕 판이 없을 때만
      const key = p.toFixed(5) + '|' + base + '|' + lit + '|' + groundKind;
      if (key === lastKey) return;   // 장면 밖에서의 스크롤은 같은 그림이라 다시 그리지 않는다
      lastKey = key;
      const openNow = range(q, ...T.open);
      const states = intro || entry ? frame(p, geo, variant, intro, entry, film) : frame(q, geo, variant, null, null, film);
      states.forEach((s, i) => {
        const el = shapes[i];
        el.setAttribute('x', s.x.toFixed(1)); el.setAttribute('y', s.y.toFixed(1));
        el.setAttribute('width', s.w.toFixed(1)); el.setAttribute('height', s.h.toFixed(1));
        el.setAttribute('rx', s.rx.toFixed(1));
        const trail = trails[i];
        if (trail) {
          trail.setAttribute('points', s.trail.map(pt => pt[0].toFixed(1) + ',' + pt[1].toFixed(1)).join(' '));
          trail.style.opacity = s.trailOpacity.toFixed(3);
        }
        const window_ = windows[i], item = media[i];
        if (window_) {
          window_.style.clipPath = s.mode === 'full' ? 'none' : 'circle(' + s.er.toFixed(1) + 'px at ' + s.ex.toFixed(1) + 'px ' + s.ey.toFixed(1) + 'px)';   // full: 화면 전체 바탕 영상
          window_.style.opacity = s.opacity.toFixed(3);
          window_.style.visibility = s.visible ? 'visible' : 'hidden';   // CSS 기본값이 hidden 이라 빈 값이 아니라 visible 로 켠다
          if (item) item.style.transform = s.media ? 'translate(' + s.media.x.toFixed(1) + 'px, ' + s.media.y.toFixed(1) + 'px) scale(' + s.media.scale.toFixed(4) + ')'   // 열의 원 안에 축소된 영상
            : (s.mediaScale < .9999 ? 'scale(' + s.mediaScale.toFixed(4) + ')' : '');
          if (item && item.tagName === 'VIDEO') {
            // 창이 열리기 한참 전에 미리 받아 두고(마크업은 preload=none: 떼어낸 장면의 영상은 받지 않는다), 창이 보이는 동안만 돌린다.
            if (!reduce.matches && q > T.rest[0] && !warmed[i]) { warmed[i] = true; item.preload = 'auto'; if (item.readyState < 3) item.load(); }
            setPlaying(i, base && (q < CARDS[0].grow[0] ? true : s.visible));
          }
        }
        const thumb = thumbs[i];
        if (thumb) {
          if (s.thumb) { thumb.style.left = s.thumb.x.toFixed(1) + 'px'; thumb.style.top = s.thumb.y.toFixed(1) + 'px'; thumb.style.width = thumb.style.height = (2 * s.thumb.r).toFixed(1) + 'px'; thumb.style.opacity = s.thumb.opacity.toFixed(3); }
          else thumb.style.opacity = '0';
          const usable = Boolean(s.thumb) && s.thumb.opacity > .3;                // 보일 때만 누를 수 있고 탭 순서에 들어간다
          thumb.style.pointerEvents = usable ? 'auto' : 'none';
          thumb.tabIndex = usable ? 0 : -1;
        }
        const tag = tags[i - 1];
        if (tag) {
          tag.style.left = s.tagX.toFixed(1) + 'px';
          tag.style.top = s.tagY.toFixed(1) + 'px';
          tag.style.opacity = s.tagOpacity.toFixed(3);
        }
      });
      if (variant === 'rise') backdrops.forEach((el, idx) => {
        const k = backdropSlot(idx, q), source = media[COLUMN.order[k]];
        const src = source ? (source.currentSrc || source.src || source.getAttribute?.('src') || '') : '';
        if (src && el.dataset.src !== src) { el.dataset.src = src; el.src = src; el.load?.(); }   // 앞 편이 끝난 뒤 미리 받아 둔다
        const f = backdropFrame(k, q, film), shown = q >= COLUMN.move[0] && f.visible, box = films[idx];
        box.style.opacity = shown ? '1' : '0';
        box.style.transform = 'translateY(' + f.y.toFixed(2) + '%)';   // 아래에서 올라온다(앞 편은 위로 빠진다)
        box.style.zIndex = String(f.z);                                  // 나중 편이 위
        if (film === 'scale') {
          // 한화 영상 장면처럼: 창은 clip-path 로 열리고 닫히며, 안의 영상은 반대로 밀려 시차가 난다
          box.style.clipPath = 'inset(' + ((100 - f.size) / 2).toFixed(2) + '% round ' + f.radius.toFixed(2) + 'vw)';
          if (box !== el) el.style.transform = 'translateY(' + f.innerY.toFixed(2) + '%)';
        }
        const want = base && shown && Boolean(src);
        if (want !== backdropPlaying[idx]) { backdropPlaying[idx] = want; if (want) el.play?.()?.catch?.(() => {}); else el.pause?.(); }
      });
      captions.forEach((el, k) => {
        const c = captionState(k + 1, q, variant, film);
        el.style.opacity = c.opacity.toFixed(3);
        el.style.transform = 'translateY(' + c.y.toFixed(1) + 'px)';
      });
      lines.forEach((el, i) => { el.style.transform = 'translateY(' + ((1 - lineReveal(i, q)) * 110).toFixed(2) + '%)'; });
      words.forEach((el, i) => {
        const w = wordState(i + 1, q);
        el.style.transform = 'scale(' + w.scale.toFixed(3) + ')';
        el.style.opacity = w.opacity.toFixed(3);
      });
      const restOpacity = 1 - range(q, ...T.rest);
      rests.forEach(el => { el.style.opacity = restOpacity.toFixed(3); });
      red.style.opacity = (1 - openNow).toFixed(3);
      // 심볼 완성 파동: 도입부에서는 q 가 멈추므로 도입부 앞 40% 동안 마저 퍼지고, 가운데는 비켜나는 심볼을 따라간다
      const lg = intro === 'logo' ? logoFrame(p, geo, entry, film) : null;
      const ringP = lg && tl.l > 0 ? LOGO.at + Math.min(1, tl.l / .4) * (T.pulse[1] - LOGO.at) : q;
      const ring = range(ringP, ...T.pulse);
      pulse.setAttribute('cx', geo.w / 2 + (lg ? lg.shift : 0)); pulse.setAttribute('cy', geo.h / 2);
      if (lg && logo && wordmark && wordClip) {
        // SPS 글자: 로고 단위를 k 배 키워 심볼 옆에 두고, 심볼 오른쪽 가장자리(원들의 오른끝)부터 오른쪽만 보이게 가린다.
        // 가림막은 가장자리에서 원 반지름쯤 흐려져(feather) 딱딱한 세로 선이 생기지 않는다.
        const clipX = Math.max(...states.map(s => s.ex + s.er)), feather = Math.max(12, geo.spacing * .5);
        wordmark.setAttribute('transform', 'translate(' + lg.x.toFixed(1) + ' ' + lg.y.toFixed(1) + ') scale(' + lg.k.toFixed(4) + ')');
        wordClip.setAttribute('x', '0'); wordClip.setAttribute('y', '0'); wordClip.setAttribute('width', String(geo.w)); wordClip.setAttribute('height', String(geo.h));
        if (wordFade) { wordFade.setAttribute('x1', clipX.toFixed(1)); wordFade.setAttribute('x2', (clipX + feather).toFixed(1)); }
        logo.style.opacity = lg.opacity.toFixed(3);
      }
      pulse.setAttribute('r', (ring * Math.min(geo.w, geo.h) * .46).toFixed(1));
      pulse.style.opacity = (ring > 0 && ring < 1 ? .55 * (1 - ring) : 0).toFixed(3);
      const text = variant === 'rise' ? 0 : range(q, ...T.copy);   // 세로 열 판은 마무리 문장 없이 마지막 글에서 끝난다
      copy.style.opacity = text.toFixed(3);
      copy.style.transform = 'translateY(' + ((1 - text) * 24).toFixed(1) + 'px)';
      const shade = shadeState(q, variant);
      section.style.setProperty('--fusion-shade', shade.shade.toFixed(3));
      section.style.setProperty('--fusion-dark', (lit ? lightState(q) : 0).toFixed(3));   // 흰 바탕으로 시작: 점들이 날기 시작하면 흰색 → 검정
      section.style.setProperty('--fusion-ground', (ground ? lightState(q) : 0).toFixed(3)); // 바탕: 점들이 날기 시작하면 검정 위로 떠오른다
      if (groundVideo) {
        const src = GROUND_VIDEOS[groundKind] || '';
        if (src && p > 0 && groundVideo.dataset.src !== src) { groundVideo.dataset.src = src; groundVideo.src = src; groundVideo.load?.(); groundPlaying = false; }   // 새 소스는 멈춘 채로 시작한다   // 장면에 들어오면 받는다
        if (!src && groundVideo.dataset.src) { groundVideo.pause?.(); groundPlaying = false; groundVideo.dataset.src = ''; groundVideo.removeAttribute?.('src'); groundVideo.load?.(); }
        const coveredAt = variant === 'rise' ? COLUMN.handoff[1] + .02 : CARDS[0].grow[1];   // 원 · 영상이 바탕을 다 덮는 때
        const want = Boolean(src) && groundVideo.dataset.src === src && !reduce.matches && !doc.hidden && !overlay() && q > LIGHT[0] - .02 && q < coveredAt;
        if (want !== groundPlaying) { groundPlaying = want; if (want) groundVideo.play?.()?.catch?.(() => {}); else groundVideo.pause?.(); }
      }
      section.style.setProperty('--fusion-shade-deep', shade.deep.toFixed(3));
      section.dataset.phase = phaseOf(q);
    }
    function schedule(again) { if (again) geo = null; if (!pending) pending = win.requestAnimationFrame(paint); }
    win.addEventListener('scroll', () => schedule(false), { passive: true });
    win.addEventListener('resize', () => schedule(true), { passive: true });
    win.addEventListener('sps-theme-change', () => schedule(true));
    win.addEventListener('sps-header-condense', () => setTimeout(() => schedule(true), 400));
    reduce.addEventListener('change', () => schedule(true));
    if ('ResizeObserver' in win) new win.ResizeObserver(() => schedule(true)).observe(stage);
    if ('MutationObserver' in win) {
      // 전체 메뉴·대화상자는 body 클래스나 dialog[open] 으로 드러난다: 열리고 닫힐 때 영상 재생을 다시 판단한다.
      const observer = new win.MutationObserver(() => schedule(false));
      if (doc.body) observer.observe(doc.body, { attributes: true, attributeFilter: ['class'] });
      doc.querySelectorAll('dialog').forEach(dialog => observer.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
    }
    doc.fonts?.ready.then(() => schedule(true));
    doc.addEventListener('visibilitychange', () => {
      // 숨겨진 문서에서는 rAF가 돌지 않으므로 영상은 바로 멈추고, 다시 보일 때 paint()로 재개한다.
      if (doc.hidden) { media.forEach((_, i) => setPlaying(i, false)); if (groundPlaying) { groundPlaying = false; groundVideo?.pause?.(); } backdrops.forEach((el, i) => { if (backdropPlaying[i]) { backdropPlaying[i] = false; el.pause?.(); } }); lastKey = null; }   // 다음 paint 가 같은 p 라도 다시 판단하도록
      else schedule(false);
    });
    measure(); paint();
    return { paint: () => { geo = null; paint(); }, frame, T, CARDS, variant, intro, entry, film };
  }
  return { start, frame, flightCurve, hermite, flightPoint, wordState, lineReveal, coverRadius, cardState, captionRange, captionState, shadeState, phaseOf, columnSlots, seqRange, seqTarget, circleActive, backdropFrame, backdropState, backdropSlot, segments, travelScreens, lightState, LIGHT, GROUND_VIDEOS, timeline, scrollFor, logoTimeline, logoScroll, logoFrame, T, CARDS, FLIGHT, UNIT, COLUMN, SEQ, LOGO, ENTRY, FILM };
});
