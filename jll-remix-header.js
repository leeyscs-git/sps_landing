/* H main and introduction share this header, its navigation and menu behavior. */
(() => {
  'use strict';
  const header = document.querySelector('[data-sps-header]');
  if (!header) return;
  const isAbout = header.dataset.page === 'about';
  const isJournal = header.dataset.page === 'journal';
  const isSupport = header.dataset.page === 'support';
  const isCases = header.dataset.page === 'cases';
  const isHanwha = header.dataset.page === 'hanwha';
  const isSamsung = header.dataset.page === 'samsung';
  const isSubpage = isAbout || isJournal || isSupport || isCases || isHanwha || isSamsung;
  const variant = document.documentElement.dataset.serviceMenu;
  const prefix = ['v2', 'v3', 'v4'].includes(variant) ? `jll-remix-${variant}` : 'jll-remix';
  const home = header.dataset.homeHref || `${prefix}.html`;
  const about = header.dataset.aboutHref || `${prefix}-about.html`;
  const sectionHref = id => `${isSubpage ? home : ''}#${id}`;
  const links = [
    { label: 'SPS 소개', href: about, current: isAbout },
    { label: '사업영역', href: sectionHref('services'), section: 'services' },   // 2026-10-21: '서비스' → '사업영역'
    { label: '사업실적', href: 'jll-remix-cases.html', current: isCases },       // 2026-10-21: '서비스 사례' → '사업실적'
    { label: '인사이트', href: header.dataset.journalHref || 'jll-remix-journal-v2.html', current: isJournal, section: null },
    { label: '고객지원', href: 'jll-remix-support.html', current: isSupport },
  ];
  function renderLink(link, expanded = false) {
    if (link.section === 'services') return `<sps-service-menu${expanded ? ' data-mobile' : ''}></sps-service-menu>`;
    const current = link.current ? ' class="current" aria-current="page"' : '';
    const section = link.section ? ` data-header-section="${link.section}"` : '';
    return `<a href="${link.href}" target="_top"${current}${section}>${link.label}</a>`;
  }
  function renderLocale(mobile = false) {
    // Only offer locales backed by an actual SPS page.
    return `<div class="header-locale${mobile ? ' header-locale-mobile' : ''}" role="group" aria-label="국가 및 언어">
      <svg class="locale-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>
      <label class="locale-field sps-select sps-select--compact"><select aria-label="국가 선택"><option value="kr" selected>대한민국</option></select><sps-chevron></sps-chevron></label>
      <span class="locale-divider" aria-hidden="true"></span>
      <label class="locale-field locale-language sps-select sps-select--compact"><select aria-label="언어 선택"><option value="ko" label="KO" selected>한국어</option></select><sps-chevron></sps-chevron></label>
    </div>`;
  }
  header.innerHTML = `
    <div class="header-main wrap">
      <a class="brand" href="${isSubpage ? home : '#main'}" target="_top" aria-label="SPS 홈">
        <img class="brand-logo" src="assets/logo.svg" alt="SPS" width="120" height="40">
      </a>
      <div class="nav-tools">
        <a class="header-contact" href="jll-remix-support.html#inquiry" data-inquiry aria-haspopup="dialog"><span class="header-contact-label">문의하기</span> <sps-arrow-up-right></sps-arrow-up-right></a>
        <button class="icon-button menu-toggle" type="button" aria-label="전체 메뉴 열기" aria-expanded="false" aria-controls="sps-header-menu"><span></span><span></span></button>
      </div>
    </div>
    <nav class="nav wrap" aria-label="주 메뉴">
      <a class="nav-brand" href="${isSubpage ? home : '#main'}" target="_top" aria-label="SPS 홈" aria-hidden="true" tabindex="-1"><svg class="nav-brand-logo" width="96" height="32" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70.87 23.73"><g><g><g><path class="cls-1" d="M46.29,11.47v-6.86c0-.97,2.78-.92,3.37.88.8,2.44.22,6.95-3.37,5.98Z"/><g><path class="cls-4" d="M46.29,12.26v5.89c0,1.56,2.21.59,1.96,1.49-.02.05-.2.15-.23.15h-6.83c-.13,0-.29-.35-.11-.51.34-.3,1.45.14,1.66-.78-.08-4.19,0-14.18-.2-14.36-.4-.38-1.5.04-1.64-.53-.09-.37.43-.37.64-.39,1.87-.19,7.79-.17,9.44.4,3.6,1.26,3.51,6.57.27,8.15-1.59.77-3.25.6-4.97.48ZM46.29,11.47c3.6.96,4.17-3.55,3.37-5.98-.59-1.81-3.37-1.85-3.37-.88v6.86Z"/><path class="cls-4" d="M63.99,18.61c-1.37,1.31-3.48,1.71-5.31,1.42-.74-.12-2.75-1.12-3.22-.78-.23.16-.19,1.24-.88.54.23-1.42-.21-3.51.04-4.83.07-.4.43-.58.71-.25.12.14.41,1.6.61,2.05,1.46,3.14,6.41,3.6,6.57-.12.17-4.02-7.71-3.31-7.71-8.93,0-3.32,3.01-5.08,6.05-4.71.63.08,1.85.67,2.26.66s.78-1.08,1.12-.39c.1.19.12,4.22-.08,4.3-.59.23-.73-1.03-.93-1.44-2.11-4.18-6.96-2.16-5.53,1.18.83,1.94,5.6,2.73,7.06,5.08,1.19,1.9.87,4.67-.76,6.23Z"/><path class="cls-4" d="M38.69,3.16c.21-.17.51-.19.6.11.05.19.13,3.7.09,3.9-.3,1.59-1.14-1.17-1.23-1.35-1.54-3.03-6.03-2.63-5.6.81.36,2.91,6.61,3.02,7.71,6.82,1.23,4.22-2.28,7.11-6.33,6.59-.81-.11-2.7-.98-3.12-.95-.33.02-1.13,1.91-1.2.3-.03-.81-.03-3.75.09-4.43.08-.45.44-.56.7-.16.22.34.41,1.59.73,2.19,2.05,3.87,7.65,2.39,6.21-1.6-.82-2.26-6.2-2.68-7.24-6.14-1.14-3.8,1.86-6.59,5.58-6.28.67.06,2.4.79,2.8.57.12-.06.12-.31.2-.38Z"/></g></g><g><circle class="cls-2" cx="20.28" cy="11.86" r="3.19"/><circle class="cls-2" cx="11.73" cy="11.86" r="3.19"/><circle class="cls-2" cx="11.73" cy="3.19" r="3.19"/><circle class="cls-2" cx="11.73" cy="20.54" r="3.19"/><circle class="cls-2" cx="3.19" cy="11.86" r="3.19"/></g></g><text class="cls-3" transform="translate(66.59 6.38) scale(.96 1)"><tspan x="0" y="0">™</tspan></text></g></svg></a>
      <div class="nav-links" id="nav-links">${links.map(link => renderLink(link)).join('')}</div>
      ${renderLocale()}
      <a class="nav-contact header-contact" href="jll-remix-support.html#inquiry" data-inquiry aria-haspopup="dialog" aria-hidden="true" tabindex="-1"><span class="header-contact-label">문의하기</span> <sps-arrow-up-right></sps-arrow-up-right></a>
    </nav>
    <nav class="sps-header-menu" id="sps-header-menu" aria-label="전체 메뉴" hidden>
      ${links.map(link => renderLink(link, true)).join('')}
      <a href="jll-remix-support.html#inquiry" data-inquiry aria-haspopup="dialog">문의하기 <span aria-hidden="true">↗</span></a>
      ${renderLocale(true)}
    </nav>`;

  const button = header.querySelector('.menu-toggle');
  const menu = header.querySelector('.sps-header-menu');
  const background = [...document.querySelectorAll('main, body > footer')];
  let previousInert = [];
  function setMenu(open, returnFocus = false) {
    if (open === !menu.hidden) return;
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? '전체 메뉴 닫기' : '전체 메뉴 열기');
    document.body.classList.toggle('sps-menu-open', open);
    if (open) {
      previousInert = background.map(element => element.inert);
      background.forEach(element => { element.inert = true; });
      menu.scrollTop = 0;
      menu.querySelector('a')?.focus({preventScroll:true});
    } else {
      header.querySelectorAll('sps-service-menu').forEach(item => item.close?.());
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      if (returnFocus || menu.contains(document.activeElement)) button.focus({preventScroll:true});
    }
  }
  button.addEventListener('click', () => setMenu(menu.hidden));
  header.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('click', event => {
    if (!menu.hidden && !header.contains(event.target)) setMenu(false, true);
  });
  document.addEventListener('keydown', event => {
    if (menu.hidden) return;
    if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); setMenu(false, true); }
    if (event.key === 'Tab') {
      const focusable = [...header.querySelectorAll('a,button,select')].filter(element => element.getClientRects().length && !element.closest('[inert]'));
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({preventScroll:true}); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({preventScroll:true}); }
    }
  });
  const mobileLayout = matchMedia('(max-width: 850px)');
  mobileLayout.addEventListener('change', event => {
    header.querySelectorAll('sps-service-menu').forEach(item => item.close?.());
    if (event.matches || menu.hidden) return;
    setMenu(false);
    header.querySelector('.brand').focus({preventScroll:true});
  });
  const updateHeight = () => document.documentElement.style.setProperty('--sps-header-height', `${header.offsetHeight}px`);
  // Saved top padding changes the border box without resizing its content box.
  new ResizeObserver(updateHeight).observe(header, { box: 'border-box' });
  window.addEventListener('sps-theme-change', updateHeight);
  window.addEventListener('pageshow', updateHeight);
  updateHeight();
  // 아래로 스크롤(데스크톱)하면 헤더를 접는다. 두 방식:
  //  row(기본): 윗여백과 메뉴 줄을 접고 로고 줄(로고 · 메뉴 · 문의하기 버튼)만 남긴다. 메뉴 항목은 메뉴 줄 가운데에서 로고 줄 가운데로 곧게 올라온다.
  //  bar(이전 방식, V4 화면 조정에서 선택 · html[data-sps-condense="bar"]): 로고 줄을 접고 메뉴 줄만 띠로 남긴다. 작은 로고와 문의하기 글자 링크가 띠 양끝에 들어온다.
  // 위로 스크롤하거나 맨 위 근처면 전체 헤더로 돌아온다.
  const mainRow = header.querySelector('.header-main');
  const navRow = header.querySelector('.nav');
  const navLinks = header.querySelector('.nav-links');
  const condenseQuery = window.matchMedia?.('(min-width: 851px)');
  const px = value => (Number.isFinite(value) ? value : 0);
  const setVar = (name, value) => header.style?.setProperty?.(name, value);
  const condenseMode = () => (document.documentElement?.dataset?.spsCondense === 'bar' ? 'bar' : 'row');
  let lastY = scrollY, travel = 0, condensed = false;   // travel: 같은 방향으로 누적된 이동량
  // 접힌 상태의 치수. 창 크기나 방식이 바뀌면 다시 잰다. 돌려주는 값은 화면에 남는 높이.
  function condensedGeometry() {
    if (condenseMode() === 'bar') {
      // 띠 높이(--sps-bar-height, 기본 58px)만큼 남긴다. 메뉴 줄(49px)보다 높으면 로고 줄 아래쪽 빈 흰 면까지 보이게 하고, 메뉴 줄의 글자·로고·버튼을 그만큼의 절반 올려 띠 가운데에 둔다.
      const row = px(navRow?.offsetHeight), inline = parseFloat(document.documentElement?.style?.getPropertyValue?.('--sps-bar-height') || '');
      const bar = Math.max(row, Number.isFinite(inline) ? inline : 58), lift = (bar - row) / 2;   // 기본 58px: 49px 메뉴 줄 위아래로 4.5px
      const visible = bar + 1;                                               // 띠 + 아래 선
      setVar('--sps-header-shift', `${px(header.offsetHeight) - visible}px`);   // 띠만 남기고 위로
      setVar('--sps-header-paint', '100%'); setVar('--sps-nav-dx', '0px'); setVar('--sps-nav-dy', `${-lift}px`); setVar('--sps-nav-bridge', `${lift}px`);
      return visible;
    }
    const mainTop = px(mainRow.offsetTop), mainHeight = px(mainRow.offsetHeight);
    const linksTop = px(navLinks?.offsetTop), linksHeight = px(navLinks?.offsetHeight);
    setVar('--sps-header-shift', `${mainTop}px`);                        // 윗여백만큼 위로
    setVar('--sps-header-paint', `${mainTop + mainHeight + 1}px`);        // 흰 바탕과 선은 로고 줄까지만
    const dy = (mainTop + mainHeight / 2) - (linksTop + linksHeight / 2);
    const dx = (px(navRow?.offsetLeft) + px(navRow?.offsetWidth) / 2) - (px(navLinks?.offsetLeft) + px(navLinks?.offsetWidth) / 2);
    setVar('--sps-nav-dx', `${dx}px`);                                      // 메뉴 줄 왼쪽 → 로고 줄 가운데
    setVar('--sps-nav-dy', `${dy}px`);                                      // 메뉴 줄 → 로고 줄 세로 가운데
    setVar('--sps-nav-bridge', `${Math.max(0, (mainTop + mainHeight + 1) - (linksTop + linksHeight + dy))}px`);   // 올라간 '서비스'와 패널 사이 틈
    setVar('--sps-nav-row', `${px(navRow?.offsetHeight)}px`);              // 서비스 패널이 띠 바로 아래 붙도록
    return mainHeight + 1;                                                  // 로고 줄 + 아래 선
  }
  const setCondensed = on => {
    if (condensed === on) return;
    condensed = on;
    header.classList.toggle('is-condensed', on);
    const bar = on && condenseMode() === 'bar';
    header.querySelectorAll('.nav-brand, .nav-contact').forEach(el => { el.setAttribute('aria-hidden', String(!bar)); el.tabIndex = bar ? 0 : -1; });
    const visible = on && mainRow ? condensedGeometry() : null;
    if (!visible) { setVar('--sps-header-shift', '0px'); setVar('--sps-header-paint', '100%'); setVar('--sps-nav-dx', '0px'); setVar('--sps-nav-dy', '0px'); setVar('--sps-nav-bridge', '0px'); }
    document.documentElement.style.setProperty('--sps-header-visible', visible ? `${visible}px` : 'var(--sps-header-height)');
    if (typeof CustomEvent === 'function') window.dispatchEvent(new CustomEvent('sps-header-condense', { detail: { condensed: on, mode: condenseMode() } }));
  };
  // 접힘 방식 바꾸기(V4 화면 조정): html[data-sps-condense] 를 쓰고, 접혀 있으면 새 방식으로 다시 잰다.
  function setCondenseMode(mode) {
    const root = document.documentElement;
    if (mode === 'bar') root.dataset.spsCondense = 'bar'; else delete root.dataset.spsCondense;
    if (condensed) { condensed = false; setCondensed(true); }
  }
  // 창 크기나 테마(여백·높이)가 바뀌면 접힌 치수를 다시 잰다.
  const remeasure = () => { if (condensed && mainRow) document.documentElement.style.setProperty('--sps-header-visible', `${condensedGeometry()}px`); };
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('sps-theme-change', remeasure);
  if (typeof ResizeObserver === 'function') new ResizeObserver(remeasure).observe(header, { box: 'border-box' });
  const updateScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    const allowed = Boolean(condenseQuery?.matches) && !document.body?.classList?.contains?.('sps-menu-open');
    const delta = y - lastY;
    travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
    lastY = y;
    if (!allowed || y < 80) setCondensed(false);
    else if (travel <= -32) setCondensed(false);
    else if (travel >= 32 && y > 160) setCondensed(true);
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  condenseQuery?.addEventListener?.('change', updateScroll);
  updateScroll();

  if (!isSubpage) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        header.querySelectorAll('[data-header-section]').forEach(link => {
          const active = link.dataset.headerSection === entry.target.id;
          link.classList.toggle('current', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-20% 0px -60% 0px' });
    links.filter(link => link.section).forEach(link => {
      const section = document.getElementById(link.section);
      if (section) observer.observe(section);
    });
  }
  window.SPSHeader = { home, about, condenseMode, setCondenseMode, refresh: remeasure, close: () => {
    header.querySelectorAll('sps-service-menu').forEach(item => item.close?.(true));
    setMenu(false);
  } };

  // Decode the destination hero while the current page is still visible.
  // Keep ordinary links/history; modified clicks and other variants stay native.
  const destinationImages = new Map([
    [new URL(home, location.href).pathname, 'assets/jll/seoul.webp'],
    [new URL(about, location.href).pathname, 'assets/hyosung/city.jpg'],
  ]);
  const preparedImages = new Map();
  function destination(link) {
    if (!link || link.hasAttribute('download') || !['_self', '_top', ''].includes(link.target)) return null;
    const url = new URL(link.href, location.href);
    return url.origin === location.origin && url.pathname !== location.pathname && destinationImages.has(url.pathname) ? url : null;
  }
  function prepare(url) {
    if (!preparedImages.has(url.pathname)) {
      const image = new Image();
      image.src = destinationImages.get(url.pathname);
      const prepared = { image, decoded: false };
      prepared.ready = image.decode().then(() => { prepared.decoded = true; }).catch(() => {});
      preparedImages.set(url.pathname, prepared);
    }
    return preparedImages.get(url.pathname);
  }
  for (const eventName of ['pointerover', 'focusin']) {
    document.addEventListener(eventName, event => {
      const url = destination(event.target.closest?.('a[href]'));
      if (url) prepare(url);
    });
  }
  let navigating = false;
  document.addEventListener('click', async event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    const url = destination(link);
    if (!url) return;
    const { decoded, ready } = prepare(url);
    if (decoded) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    let timeout;
    await Promise.race([ready, new Promise(resolve => { timeout = setTimeout(resolve, 800); })]);
    clearTimeout(timeout);
    // A missing image must not prevent navigation indefinitely.
    (link.target === '_top' ? window.top : window).location.assign(url.href);
  });
  window.addEventListener('pagehide', () => setMenu(false));
  window.addEventListener('pageshow', () => { navigating = false; setMenu(false); });
})();
