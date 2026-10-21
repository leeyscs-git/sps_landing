/* V4 '맨 위로' 버튼: 비전 섹션의 윗변이 헤더 아래에 닿는 지점부터 보이고, 그 위에서는 숨는다. 푸터가 화면에 들어오면 다시 숨는다(푸터의 '맨 위로'가 맡는다). 클릭은 #hw-intro 앵커라 한화 스크립트가 부드럽게 올린다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root) root.SPSMainTop = api.start(root);
})(typeof window === 'undefined' ? null : window, function () {
  function start(win) {
    const doc = win.document, button = doc.querySelector('.main-v4-top');
    if (!button) return null;
    let shown = false, pending = 0;
    const headerHeight = () => parseFloat(doc.documentElement?.style?.getPropertyValue?.('--sps-header-height') || '') || 0;
    function threshold() {
      const vision = doc.querySelector('#hw-vision');
      if (!vision) return 600;
      return vision.getBoundingClientRect().top + win.scrollY - headerHeight();   // 비전 섹션 윗변이 헤더 아래에 닿는 스크롤 위치
    }
    function update() {
      pending = 0;
      const footer = doc.querySelector('[data-sps-footer]');
      const nearFooter = Boolean(footer && footer.getBoundingClientRect && footer.getBoundingClientRect().top < (win.innerHeight || 0));   // 푸터가 보이면 푸터의 '맨 위로'가 맡는다
      const on = win.scrollY >= threshold() && !nearFooter;
      if (on === shown) return;
      shown = on;
      button.classList.toggle('is-shown', on);
      button.setAttribute('aria-hidden', String(!on));
      button.tabIndex = on ? 0 : -1;
    }
    const schedule = () => { if (!pending) pending = win.requestAnimationFrame(update); };
    win.addEventListener('scroll', schedule, { passive: true });
    win.addEventListener('resize', schedule, { passive: true });
    win.addEventListener('sps-header-condense', schedule);
    button.hidden = false;   // 숨김 속성을 풀고 투명 상태로 두어, 나타날 때 전환이 보이게 한다
    button.setAttribute('aria-hidden', 'true'); button.tabIndex = -1;   // 보이기 전까지는 보조기기·탭 순서에서도 빠진다
    update();
    return { update, get shown() { return shown; } };
  }
  return { start };
});
