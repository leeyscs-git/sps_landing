/* Review-only controller. Both previews use the same variants and viewport.
   Scroll mapping follows each section's progress rather than its pixel offset. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else api.start(root);
})(typeof window === 'undefined' ? null : window, function() {
  const sections = {
    hero: '#hw-intro', vision: '#hw-vision', services: '#hw-services3, #hw-services2, #hw-business',
    cases: '#hw-cases', insights: '#hw-news', support: '#hw-future', more: '#hw-with', footer: '#hw-footer'
  };
  function positionInSection(y, bounds) {
    const index = Math.max(0, bounds.findLastIndex(b => y >= b.top - 1));
    const b = bounds[index];
    return b ? { key: b.key, progress: Math.max(0, Math.min(1, (y - b.top) / Math.max(1, b.height))) } : null;
  }
  function mappedPosition(position, bounds) {
    const b = bounds.find(b => b.key === position?.key);
    return b ? b.top + position.progress * b.height : null;
  }
  function start(win) {
    const doc = win.document;
    const comparison = doc.querySelector('.comparison');
    const frames = [...doc.querySelectorAll('[data-frame]')];
    const select = doc.querySelector('#section-select');
    const sync = doc.querySelector('#sync-scroll');
    const note = doc.querySelector('#view-note');
    const dimensions = { desktop: [1440,900], mobile: [390,844] };
    const paths = { before: 'design/archive/main-v4-20261026/jll-remix-main-v4.html', after: 'jll-remix-main-v4.html' };
    let device = win.innerWidth <= 700 ? 'mobile' : 'desktop', driver = null, pending = 0, forwarding = false;
    const params = 'embed=1&layout=responsive&vision=symbol-rise&light=1&ground=video-namsan&services=3&footer=3&consult=none&cards=white&condense=bar&headerbg=hero&caption=h1';
    function size() {
      const [width,height] = dimensions[device];
      for (const frame of frames) {
        const box = frame.parentElement;
        if (!box.clientWidth) continue;
        const available = box.clientWidth, scale = Math.min(1, available / width);
        frame.style.width = width + 'px'; frame.style.height = height + 'px';
        frame.style.transform = `scale(${scale})`;
        frame.style.left = Math.max(0, (available - width * scale) / 2) + 'px';
        box.style.height = Math.ceil(height * scale) + 1 + 'px';
      }
      note.textContent = (device === 'mobile' ? '390 × 844 모바일' : '1440 × 900 데스크톱') + ' 기준 · 미리보기 안에서 스크롤하거나 위에서 섹션을 선택하세요.';
    }
    function bounds(frame) {
      const w = frame.contentWindow, d = frame.contentDocument;
      if (!d?.body?.classList.contains('hw-main-v4')) return [];
      const found = Object.entries(sections).flatMap(([key,selector]) => {
        const el = d.querySelector(selector);
        return el && el.getClientRects().length ? [{key, top: Math.max(0, el.getBoundingClientRect().top + w.scrollY)}] : [];
      });
      return found.map((b,i) => ({...b, height: Math.max(1, (found[i+1]?.top ?? d.documentElement.scrollHeight) - b.top)}));
    }
    function move(frame, top) {
      const w = frame.contentWindow;
      if (typeof w.SPSScrollTo === 'function') w.SPSScrollTo(top, 0);
      else w.scrollTo({top, behavior:'instant'});
    }
    function jump(key) {
      driver = null;
      frames.forEach(frame => { const b = bounds(frame).find(b => b.key === key); if (b) move(frame, b.top); });
    }
    function loaded(frame) {
      const w = frame.contentWindow, d = frame.contentDocument;
      if (!d?.body?.classList.contains('hw-main-v4')) return;
      // Tweaks stay available in a standalone page; the paired preview stays clean.
      d.querySelector('.main-v4-tweaks')?.setAttribute('hidden', '');
      const takeControl = () => { driver = frame; };
      ['wheel','pointerdown','touchstart','keydown'].forEach(event => d.addEventListener(event, takeControl, {passive:true}));
      w.addEventListener('scroll', () => {
        if (!sync.checked || driver !== frame || pending) return;
        pending = win.requestAnimationFrame(() => {
          pending = 0;
          if (!sync.checked || driver !== frame) return;
          const p = positionInSection(w.scrollY, bounds(frame));
          if (p) select.value = p.key;
          frames.filter(other => other !== frame).forEach(other => {
            const y = mappedPosition(p, bounds(other)); if (y !== null) move(other, y);
          });
        });
      }, {passive:true});
      d.addEventListener('click', event => {
        const tab = event.target.closest?.('.main-v4-stories [data-slide]');
        if (!tab || forwarding) return;
        forwarding = true;
        frames.filter(other => other !== frame).forEach(other => other.contentDocument?.querySelector(`.main-v4-stories [data-slide="${tab.dataset.slide}"]`)?.click());
        forwarding = false;
      });
      d.fonts?.ready.then(() => { if (select.value !== 'hero') jump(select.value); });
    }
    frames.forEach(frame => frame.addEventListener('load', () => loaded(frame)));
    function replay() {
      driver = null; select.value = 'hero';
      frames.forEach(frame => {
        const url = paths[frame.dataset.frame] + '?' + params;
        frame.src = url + '&replay=' + Date.now();
        doc.querySelector(`[data-open="${frame.dataset.frame}"]`).href = paths[frame.dataset.frame] + '?' + params.replace('embed=1&','');
      });
    }
    doc.querySelectorAll('[data-view]').forEach(button => {
      if (button.tagName !== 'BUTTON') return;
      button.addEventListener('click', () => {
        comparison.dataset.view = button.dataset.view;
        doc.querySelectorAll('button[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        doc.querySelectorAll('[data-version]').forEach(panel => { panel.hidden = button.dataset.view !== 'both' && panel.dataset.version !== button.dataset.view; });
        size();
      });
    });
    function setDevice(value) {
      device = value; comparison.dataset.device = value;
      doc.querySelectorAll('button[data-device]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.device === value)));
      size();
    }
    doc.querySelectorAll('button[data-device]').forEach(button => button.addEventListener('click', () => setDevice(button.dataset.device)));
    select.addEventListener('change', () => jump(select.value));
    doc.querySelector('#replay').addEventListener('click', replay);
    new win.ResizeObserver(size).observe(comparison);
    setDevice(device); replay();
  }
  return { start, positionInSection, mappedPosition };
});
