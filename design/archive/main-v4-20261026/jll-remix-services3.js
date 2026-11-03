/* 서비스 V3 소개 블록: 소개 페이지의 OUR PERSPECTIVE 처럼, 제목 줄마다 화면에 올라오는 동안 먹이 왼쪽에서 차오르고 살짝 떠오른다.
   행 사진은 스크롤을 따라 틀 안에서 천천히 흐른다(시차). 둘 다 스크롤 위치만 따른다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root) root.SPSServices3 = api.start(root);
})(typeof window === 'undefined' ? null : window, function () {
  const clamp01 = v => Math.max(0, Math.min(1, v));
  // 줄의 윗변이 화면 90% 지점에 오면 시작해 화면 높이의 30% 를 더 올라오는 동안(60% 지점까지) 다 찬다: 문장이 화면 가운데에 오면 세 줄이 모두 차 있다
  function inkFor(scrollY, viewportHeight, lineTop) { return clamp01((scrollY + viewportHeight * .9 - lineTop) / (viewportHeight * .3)); }
  // 사진 시차: 행 가운데가 화면 아래(+1)에서 위(-1)로 지나가는 동안 사진의 세로 위치를 30% → 70% 로 옮긴다(object-position: 틀보다 남는 만큼만 움직인다)
  const DRIFT = 20;
  function driftFor(scrollY, viewportHeight, rowTop, rowHeight) {
    const t = (rowTop + rowHeight / 2 - (scrollY + viewportHeight / 2)) / ((viewportHeight + rowHeight) / 2);
    return 50 - Math.max(-1, Math.min(1, t)) * DRIFT;
  }
  function start(win) {
    const doc = win.document, lines = [...doc.querySelectorAll('.hw-services3-line')];
    if (!lines.length) return null;
    const photos = [...(doc.querySelectorAll('.hw-services3-image > img') || [])];
    const reduce = win.matchMedia?.('(prefers-reduced-motion: reduce)') || { matches: false, addEventListener() {} };
    let tops = [], boxes = [], pending = 0;
    function measure() {
      tops = lines.map(line => line.getBoundingClientRect().top + win.scrollY);
      boxes = photos.map(img => { const r = img.parentElement.getBoundingClientRect(); return { top: r.top + win.scrollY, height: r.height }; });
    }
    function paint() {
      pending = 0;
      photos.forEach((img, i) => {
        const b = boxes[i];
        img.style.objectPosition = reduce.matches || !b ? '' : '50% ' + driftFor(win.scrollY, win.innerHeight, b.top, b.height).toFixed(2) + '%';
      });
      lines.forEach((line, i) => {
        const ink = reduce.matches ? 1 : inkFor(win.scrollY, win.innerHeight, tops[i] ?? 0);
        line.style.setProperty('--ink-progress', (ink * 100).toFixed(2) + '%');
        line.style.setProperty('--ink-shift', (reduce.matches ? 0 : (1 - ink) * 22).toFixed(2) + 'px');
      });
    }
    const schedule = again => { if (again) measure(); if (!pending) pending = win.requestAnimationFrame(paint); };
    win.addEventListener('scroll', () => schedule(false), { passive: true });
    win.addEventListener('resize', () => schedule(true), { passive: true });
    win.addEventListener('sps-header-condense', () => setTimeout(() => schedule(true), 400));
    win.addEventListener('pageshow', () => schedule(true));
    reduce.addEventListener?.('change', () => schedule(true));
    doc.fonts?.ready?.then?.(() => schedule(true));
    measure(); paint();
    return { paint: () => { measure(); paint(); }, inkFor, driftFor };
  }
  return { start, inkFor, driftFor, DRIFT };
});
