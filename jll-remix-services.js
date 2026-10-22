/* 사업영역 페이지(jll-remix-services.html): 등장(data-reveal) · 스티키 목차의 현재 표시 · 앵커 이동(헤더 접힘 감안) · 관리 건물 카드 · 문의 칩.
   메인의 한화 스크립트는 싣지 않는다(비전 장면 전용). 세 줄 문장과 행 사진 시차는 jll-remix-services3.js 가 그대로 맡는다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root) root.SPSServicesPage = api.start(root);
})(typeof window === 'undefined' ? null : window, function () {
  const SITUATION = { management: 'operation', marketing: 'vacancy', interior: 'interior' };   // 섹션 → 문의 대화상자의 상황(jll-remix-contact.js)
  const escape = value => String(value ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // 관리 중인 건물: 메인 사업실적 줄과 같은 카드. 비공개 요청 자산은 개수만 세어 자물쇠 칸 하나로
  function buildingCards(buildings) {
    const list = Array.isArray(buildings) ? buildings : [];
    const cards = list.filter(b => !b.undisclosed).map(b => {
      const photo = b.image
        ? '<div><img src="' + escape(b.image) + '" alt="' + escape(b.alt || b.name) + '" loading="lazy" decoding="async">' + (b.imageSample ? '<span class="hw-news-photo-note">예시 이미지</span>' : '') + '</div>'
        : '<div class="hw-news-nophoto"><span>사진 준비 중</span></div>';
      const meta = [b.use, b.floors].filter(Boolean).join(' · ') || '부동산 자산관리';
      return '<a href="jll-remix-cases.html?category=management" data-reveal>' + photo + '<small>' + escape(meta) + '</small><h3>' + escape(b.name) + '</h3></a>';
    });
    const hidden = list.filter(b => b.undisclosed).length;
    if (hidden) cards.push('<div class="svc-private" data-reveal><sps-service-pictogram data-service="private" data-style="reference" aria-hidden="true"></sps-service-pictogram><p>비공개 요청 자산 ' + hidden + '건<span>소유주 요청에 따라 비공개로 관리합니다</span></p></div>');
    return cards.join('');
  }
  function start(win) {
    const doc = win.document;
    const main = doc.querySelector?.('.hw-services-page #main');
    if (!main) return null;
    const reduced = Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    const grid = doc.querySelector('[data-svc-buildings]');
    if (grid && win.SPSManagedBuildings?.buildings) grid.innerHTML = buildingCards(win.SPSManagedBuildings.buildings);
    // 등장: 메인과 같은 .hw-motion + .is-revealed. 겹쳐 있는 [data-reveal](행 안의 글 줄들)도 각각 관찰한다
    const reveals = [...doc.querySelectorAll('[data-reveal]')];
    if (reduced || typeof win.IntersectionObserver !== 'function') reveals.forEach(el => el.classList.add('is-revealed'));
    else {
      doc.documentElement.classList.add('hw-motion');
      const io = new win.IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); io.unobserve(entry.target); } }), { threshold: .1 });
      reveals.forEach(el => io.observe(el));
    }
    // 목차 · 칩 · 문의 버튼: 화면 위쪽 기준선을 마지막으로 지난 섹션이 현재
    const sections = [...doc.querySelectorAll('.svc-section')];
    const nav = doc.querySelector('.svc-nav');
    const navLinks = [...doc.querySelectorAll('.svc-nav a')];
    const chips = [...doc.querySelectorAll('.svc-chip')];
    const inquiry = doc.querySelector('[data-svc-inquiry]');
    const header = doc.querySelector('[data-sps-header]');
    const headerVisible = () => {   // 헤더가 띠로 접히면 header.js 가 html 에 --sps-header-visible 을 px 로 적는다
      const v = parseFloat(doc.documentElement.style?.getPropertyValue?.('--sps-header-visible') || '');
      return Number.isFinite(v) ? v : (header?.getBoundingClientRect().height || 137);
    };
    const navHeight = () => nav?.offsetHeight || 48;
    let current = null, pending = 0;
    function setCurrent(id) {
      if (id === current) return;
      current = id;
      navLinks.forEach(a => {
        const on = Boolean(id) && a.getAttribute('href') === '#' + id;
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
      chips.forEach(chip => chip.classList.toggle('is-current', chip.dataset.svcChip === id));
      if (inquiry) { if (id && SITUATION[id]) inquiry.dataset.inquirySituation = SITUATION[id]; else delete inquiry.dataset.inquirySituation; }
      const list = nav?.querySelector('ul'), link = navLinks.find(a => a.getAttribute('href') === '#' + id);
      if (list && link && list.scrollWidth > list.clientWidth + 1) list.scrollTo?.({ left: Math.max(0, link.offsetLeft - 16), behavior: reduced ? 'auto' : 'smooth' });   // 폰: 현재 항목이 보이게 가로만
    }
    function spy() {
      pending = 0;
      const line = headerVisible() + navHeight() + 40;
      let found = null;
      sections.forEach(section => { if (section.getBoundingClientRect().top <= line) found = section.id; });
      setCurrent(found);
    }
    const schedule = () => { if (!pending) pending = win.requestAnimationFrame(spy); };
    win.addEventListener('scroll', schedule, { passive: true });
    win.addEventListener('resize', schedule, { passive: true });
    win.addEventListener('sps-header-condense', () => win.setTimeout(schedule, 400));
    // 페이지 안 앵커: 헤더가 스크롤 중 띠로 접히는 것을 감안해 직접 내려가고, 멈춘 뒤 ±4px 넘게 어긋나면 한 번 보정한다
    function offsetFor(target) {
      const top = target.getBoundingClientRect().top;
      const phone = Boolean(win.matchMedia?.('(max-width: 850px)')?.matches) && !doc.documentElement.hasAttribute('data-sps-desktop');
      const bar = (parseFloat(win.getComputedStyle?.(doc.documentElement).getPropertyValue('--sps-bar-height')) || 58) + 1;
      const head = !phone && top > 160 ? bar : headerVisible();   // 멀리 아래로 가면 도착할 때 헤더는 띠(59px)
      return head + navHeight() + 16;
    }
    function scrollToId(id) {
      const target = doc.getElementById(id);
      if (!target) return false;
      const top = target.getBoundingClientRect().top + win.scrollY - offsetFor(target);
      win.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
      const settle = () => {
        const delta = target.getBoundingClientRect().top - (headerVisible() + navHeight() + 16);
        if (Math.abs(delta) > 4 && Math.abs(delta) < 200) win.scrollBy({ top: delta, behavior: 'auto' });
        (target.matches?.('.svc-section') ? target.querySelector('h2') : target)?.focus?.({ preventScroll: true });
      };
      if ('onscrollend' in win) win.addEventListener('scrollend', settle, { once: true }); else win.setTimeout(settle, reduced ? 50 : 700);
      win.history?.replaceState?.(win.history.state, '', '#' + id);
      return true;
    }
    doc.addEventListener('click', event => {
      const a = event.target.closest?.('a[href^="#"]');
      if (!a || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!a.closest('#main')) return;   // 헤더 · 푸터의 링크는 그대로
      const id = a.getAttribute('href').slice(1);
      if (doc.getElementById(id) && scrollToId(id)) event.preventDefault();
    });
    // 다른 페이지에서 해시로 들어온 경우: 글꼴 · 사진이 자리 잡고 헤더가 띠로 접히는 동안 도착 위치가 밀리므로, 처음 2초 안에 몇 번 다시 맞춘다. 사용자가 손을 대면 그만둔다
    const hash = (win.location?.hash || '').slice(1);
    const arrival = { touched: false, fixes: 0, runs: 0 };
    if (hash && doc.getElementById(hash)) {
      ['wheel', 'touchstart', 'keydown'].forEach(type => win.addEventListener(type, () => { arrival.touched = true; }, { passive: true, once: true }));
      const fix = () => {
        arrival.runs++;
        const target = doc.getElementById(hash);
        if (!target || arrival.touched) return;
        const delta = target.getBoundingClientRect().top - (headerVisible() + navHeight() + 16);
        if (Math.abs(delta) > 4 && Math.abs(delta) < 400) { arrival.fixes++; win.scrollBy({ top: delta, behavior: 'auto' }); }
      };
      [120, 450, 1000, 1700].forEach(ms => win.setTimeout(fix, ms));
      win.addEventListener('load', () => win.setTimeout(fix, 100), { once: true });
      doc.fonts?.ready?.then?.(() => win.setTimeout(fix, 50));
      win.addEventListener('sps-header-condense', () => win.setTimeout(fix, 420));
    }
    spy();
    return { setCurrent, scrollToId, spy, current: () => current, arrival: () => ({ ...arrival }) };
  }
  return { start, buildingCards, SITUATION };
});
