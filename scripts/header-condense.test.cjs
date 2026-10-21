const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 접힘 헤더: 로고 줄(.header-main)만 남기고 메뉴 항목이 그 줄로 올라오는 치수와 스크롤 규칙을 확인한다.
function fixture({ topSpace = 0, desktop = true, mode = null, landscapePhone = false, forced = false } = {}) {
  const headerVars = {}, rootVars = {}, events = new Map(), headerEvents = new Map(), dispatched = [];
  const stub = () => ({ addEventListener() {}, setAttribute() {}, focus() {}, classList: { toggle() {}, contains: () => false } });
  const mainRow = { offsetTop: topSpace, offsetHeight: 87 };
  const navRow = { offsetHeight: 49, offsetLeft: 129, offsetWidth: 1200 };          // 메뉴 줄(.wrap) 가운데 = 729
  const navLinks = { offsetTop: topSpace + 87, offsetHeight: 49, offsetLeft: 129, offsetWidth: 422 };   // 메뉴 가운데 = 340
  const brand = { offsetWidth: 120, focus() {} };
  const barOnly = [stub(), stub()];   // .nav-brand, .nav-contact
  barOnly.forEach(el => { el.attrs = {}; el.setAttribute = (name, value) => { el.attrs[name] = value; }; });
  const classes = new Set();
  const header = {
    dataset: { page: 'journal' }, offsetHeight: topSpace + 87 + 50,
    style: { setProperty(name, value) { headerVars[name] = value; } },
    classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); }, contains: name => classes.has(name) },
    querySelector(selector) {
      return ({ '.menu-toggle': stub(), '.sps-header-menu': { hidden: true, querySelector: () => null, contains: () => false },
        '.header-main': mainRow, '.nav': navRow, '.nav-links': navLinks, '.brand': brand })[selector] || null;
    },
    querySelectorAll: selector => (selector === '.nav-brand, .nav-contact' ? barOnly : []), contains: () => false,
    addEventListener(name, callback) { if (!headerEvents.has(name)) headerEvents.set(name, []); headerEvents.get(name).push(callback); },
  };
  const doc = {
    documentElement: { dataset: mode ? { spsCondense: mode } : {}, hasAttribute: name => name === 'data-sps-desktop' && forced, style: { setProperty(name, value) { rootVars[name] = value; } } },
    body: { classList: { contains: () => false, toggle() {} } },
    querySelector: selector => (selector === '[data-sps-header]' ? header : null), querySelectorAll: () => [], addEventListener() {},
    getElementById: () => null,
  };
  // 폰 헤더 질의: 눕힌 폰(851~1000 × 500 이하 터치)은 접힘 질의(min-width: 851px)와 함께 맞는다
  const matchMedia = query => ({ matches: query.includes('min-width') ? desktop : landscapePhone && query.includes('(pointer: coarse)'), addEventListener() {} });
  const win = {
    matchMedia,   // 접힘 질의는 window.matchMedia 로, 모바일 질의는 전역 matchMedia 로 묻는다
    addEventListener(name, callback) { if (!events.has(name)) events.set(name, []); events.get(name).push(callback); },
    dispatchEvent(event) { dispatched.push(event); },
  };
  class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } }
  class ResizeObserver { observe() {} }
  const context = {
    document: doc, window: win, ResizeObserver, CustomEvent, URL, scrollY: 0, matchMedia,
    getComputedStyle: () => ({ getPropertyValue: name => (name === '--sps-brand-nav-gap' ? '48px' : '') }),
    location: new URL('http://localhost:3000/jll-remix-journal-v2.html'),
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../jll-remix-header.js'), 'utf8'), context);
  const emit = name => events.get(name)?.forEach(callback => callback());
  return {
    headerVars, rootVars, brand, dispatched, barOnly, root: doc.documentElement, api: () => win.SPSHeader, navLinks, mainRow, emit,
    condensed: () => classes.has('is-condensed'),
    scrollTo(y) { context.scrollY = y; emit('scroll'); },
    resize() { emit('resize'); },
    hover(on, pointerType = 'mouse') { headerEvents.get(on ? 'pointerenter' : 'pointerleave')?.forEach(fn => fn({ pointerType })); },
    focus(on) { headerEvents.get(on ? 'focusin' : 'focusout')?.forEach(fn => fn({ relatedTarget: null })); },
  };
}

test('scrolling down past the threshold keeps the logo row: visible height, paint edge and link offsets are measured from the rows', () => {
  const h = fixture();
  h.scrollTo(100);
  assert.equal(h.condensed(), false, 'a short move near the top does not condense');
  h.scrollTo(400);
  assert.equal(h.condensed(), true);
  assert.equal(h.rootVars['--sps-header-visible'], '88px', 'logo row + 1px line');
  assert.equal(h.headerVars['--sps-header-shift'], '0px', 'no top space: nothing to push up');
  assert.equal(h.headerVars['--sps-header-paint'], '88px', 'white ground and line stop under the logo row');
  assert.equal(h.headerVars['--sps-nav-dx'], '389px', 'links move from the left of the menu row (centre 340) to the centre of the logo row (729)');
  assert.equal(h.headerVars['--sps-nav-bridge'], '20px', 'hover bridge from the lifted 서비스 trigger (bottom 68) down to the panel edge (88)');
  assert.equal(h.headerVars['--sps-nav-dy'], '-68px', 'nav-links centre (87+24.5) rises to the logo row centre (43.5)');
  assert.deepEqual(h.barOnly.map(el => [el.attrs['aria-hidden'], el.tabIndex]), [['true', -1], ['true', -1]], 'the bar-style logo and contact link stay hidden');
  assert.equal(h.headerVars['--sps-nav-row'], '49px', 'the service panel hangs right under the bar');
  assert.deepEqual(h.dispatched.map(e => [e.type, e.detail.condensed, e.detail.mode]), [['sps-header-condense', true, 'row']]);
});

test('a page with top space above the logo is pushed up by that space only, and the same 88px stays visible', () => {
  const h = fixture({ topSpace: 16 });
  h.scrollTo(400);
  assert.equal(h.headerVars['--sps-header-shift'], '16px');
  assert.equal(h.headerVars['--sps-header-paint'], '104px');
  assert.equal(h.headerVars['--sps-nav-dy'], '-68px');
  assert.equal(h.rootVars['--sps-header-visible'], '88px');
});

test('scrolling back up, or returning near the top, restores the full header and clears every offset', () => {
  const h = fixture();
  h.scrollTo(400);
  h.scrollTo(360);
  assert.equal(h.condensed(), false, '40px upward travel reopens the header');
  assert.equal(h.rootVars['--sps-header-visible'], 'var(--sps-header-height)');
  assert.equal(h.headerVars['--sps-header-shift'], '0px');
  assert.equal(h.headerVars['--sps-header-paint'], '100%');
  assert.equal(h.headerVars['--sps-nav-dx'], '0px');
  assert.equal(h.headerVars['--sps-nav-dy'], '0px');
  assert.equal(h.headerVars['--sps-nav-bridge'], '0px');
  h.scrollTo(900);
  assert.equal(h.condensed(), true);
  h.scrollTo(60);
  assert.equal(h.condensed(), false, 'near the top the header is always open');
  assert.deepEqual(h.dispatched.map(e => e.detail.condensed), [true, false, true, false]);
});

test('resizing or a theme edit while condensed re-measures the offsets without re-dispatching the condense event', () => {
  const h = fixture();
  h.scrollTo(400);
  h.navLinks.offsetWidth = 300;   // 좁은 화면: 메뉴가 짧아진다
  h.resize();
  assert.equal(h.headerVars['--sps-nav-dx'], '450px', '729 − (129 + 150)');
  assert.equal(h.rootVars['--sps-header-visible'], '88px');
  h.mainRow.offsetTop = 32; h.navLinks.offsetTop = 119;   // 테마 편집기에서 로고 위 여백을 32px 로
  h.emit('sps-theme-change');
  assert.equal(h.headerVars['--sps-header-shift'], '32px');
  assert.equal(h.headerVars['--sps-header-paint'], '120px');
  assert.equal(h.dispatched.length, 1);
});

test('below the desktop breakpoint the header never condenses', () => {
  const h = fixture({ desktop: false });
  h.scrollTo(400); h.scrollTo(900);
  assert.equal(h.condensed(), false);
  assert.equal(h.rootVars['--sps-header-visible'], undefined, 'nothing written: stages keep using --sps-header-height');
});

test('a landscape phone wider than 850px keeps the phone header and never condenses; a phone showing the desktop site still does', () => {
  const phone = fixture({ landscapePhone: true });
  phone.scrollTo(400); phone.scrollTo(900);
  assert.equal(phone.condensed(), false, 'the phone header has no menu row to condense into');
  const forced = fixture({ landscapePhone: true, forced: true });
  forced.scrollTo(400); forced.scrollTo(900);
  assert.equal(forced.condensed(), true, 'data-sps-desktop keeps the desktop header behaviour');
});

test('the bar style (이전 방식) keeps a 58px bar with the menu row centred in it, slides the small logo and contact button in, and can be switched live', () => {
  const h = fixture({ mode: 'bar' });
  h.scrollTo(400);
  assert.equal(h.condensed(), true);
  assert.equal(h.rootVars['--sps-header-visible'], '59px', '58px bar + 1px line');
  assert.equal(h.headerVars['--sps-header-shift'], '78px', 'everything above the bar is pushed out of view (137 − 59)');
  assert.equal(h.headerVars['--sps-nav-dy'], '-4.5px', 'the 49px menu row is lifted to the middle of the 58px bar');
  assert.equal(h.headerVars['--sps-nav-bridge'], '4.5px', 'and the service trigger bridges the gap down to its panel');
  assert.equal(h.headerVars['--sps-header-paint'], '100%');
  assert.deepEqual(h.barOnly.map(el => [el.attrs['aria-hidden'], el.tabIndex]), [['false', 0], ['false', 0]]);
  assert.equal(h.dispatched[0].detail.mode, 'bar');
  h.api().setCondenseMode('row');
  assert.equal(h.root.dataset.spsCondense, undefined);
  assert.equal(h.rootVars['--sps-header-visible'], '88px', 'switching while condensed re-measures for the logo row');
  assert.deepEqual(h.barOnly.map(el => el.tabIndex), [-1, -1]);
  h.api().setCondenseMode('bar');
  assert.equal(h.root.dataset.spsCondense, 'bar');
  assert.equal(h.rootVars['--sps-header-visible'], '59px');
  assert.equal(typeof h.api().refresh, 'function', 'the tweaks panel can ask for a re-measure after changing the bar height');
  h.scrollTo(360);
  assert.equal(h.condensed(), false);
  assert.deepEqual(h.barOnly.map(el => el.tabIndex), [-1, -1], 'hidden again when the header opens');
});

test('the generated header carries the bar-style logo and text contact link (hidden unless that style is on) beside the original contact button', () => {
  const source = fs.readFileSync(path.join(__dirname, '../jll-remix-header.js'), 'utf8');
  assert.match(source, /class="nav-brand"[^>]*aria-hidden="true" tabindex="-1"/);
  assert.match(source, /class="nav-contact header-contact"[^>]*aria-hidden="true" tabindex="-1"[^>]*><span class="header-contact-label">문의하기<\/span>/, 'the bar-style contact is the same button as the logo row');
  assert.match(source, /class="header-contact"/);
  const css = fs.readFileSync(path.join(__dirname, '../jll-remix-header.css'), 'utf8');
  assert.match(css, /html\[data-sps-condense="bar"\] \[data-sps-header\]\.is-condensed \.nav-brand \{ max-width: 120px;/);
  assert.doesNotMatch(css, /data-sps-condense="bar"\][^{]*\{[^}]*font-size/, 'the bar keeps the full menu and button sizes: it grows taller instead');
  assert.match(css, /html\[data-sps-condense="bar"\] \[data-sps-header\]\.is-condensed \.nav-contact \{ display: flex; transform: translateY\(var\(--sps-nav-dy, 0px\)\); \}/, 'the contact button sits in the middle of the taller bar');
  assert.match(css, /\[data-sps-header\] \.nav-contact\.header-contact \{ display: none;/, 'outside the bar style the duplicate button stays hidden despite .header-contact');
  assert.match(css, /\[data-sps-header\] \.nav \{[^}]*display: flex; flex-wrap: wrap;[^}]*justify-content: space-between;/, 'the open header keeps the menu at the left of the menu row');
  assert.doesNotMatch(css, /grid-column/);
  assert.doesNotMatch(css, /\.is-condensed \.nav \{ visibility: hidden/, 'the 주 메뉴 landmark stays in the accessibility tree while condensed');
  assert.match(css, /background-origin: border-box;/, 'the hairline is drawn on the border row, not one pixel above it');
  assert.match(css, /\.is-condensed \.nav-links > a, \[data-sps-header\]\.is-condensed \.nav-links > sps-service-menu > \.sps-service-trigger \{ transform: translate\(var\(--sps-nav-dx, 0px\), var\(--sps-nav-dy/, 'links and the service trigger move together, not the panel container');
  assert.match(css, /\.is-condensed \.nav-links > sps-service-menu > \.sps-service-trigger\[aria-expanded="true"\]::before \{ content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: var\(--sps-nav-bridge, 20px\); \}/, 'an open 서비스 trigger bridges the gap down to its panel');
  assert.match(css, /\.is-condensed \.sps-service-panel \{ top: calc\(100% - var\(--sps-nav-row/, 'the mega-menu panel hangs under the bar');
  assert.match(css, /\.is-condensed :is\(\.header-main, \.nav-links > a, \.sps-service-trigger, \.sps-service-panel\) \{ pointer-events: auto; \}/, 'only the lifted controls and the panel stay clickable; the empty menu-row boxes let clicks through');
});

