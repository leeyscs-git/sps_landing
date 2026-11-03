/* 서비스 V2: 카드 줄이 화면에 들어오면 등장 클래스를 붙인다. 손을 올렸을 때 넓어지는 동작은 CSS(:hover, :focus-visible)가 맡는다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root) root.SPSServices2 = api.start(root);
})(typeof window === 'undefined' ? null : window, function () {
  function start(win) {
    const doc = win.document;
    const section = doc.querySelector('.hw-services2');
    if (!section) return null;
    const cards = section.querySelector('.hw-services2-cards');
    let revealed = false;
    const reveal = () => { if (revealed) return; revealed = true; cards?.classList.add('is-revealed'); };
    if ('IntersectionObserver' in win) {
      const observer = new win.IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        reveal(); observer.disconnect();
      }, { threshold: .2 });
      observer.observe(section);
    } else reveal();
    return { reveal, get revealed() { return revealed; } };
  }
  return { start };
});
