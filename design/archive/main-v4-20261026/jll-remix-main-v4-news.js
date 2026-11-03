/* V4 '사업실적' · '인사이트': 두 섹션이 각각 한 줄(3개)이다. 데이터에서 다시 그리고, 글이 없는 섹션은 페이지 메뉴 항목과 함께 뺀다.
   한화 스크립트가 [data-reveal] 을 관찰하기 전에 실행되도록, 페이지에서 한화 스크립트보다 앞에 둔다. 데이터가 없으면 마크업(같은 내용)을 그대로 둔다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root) root.SPSMainNews = api.start(root);
})(typeof window === 'undefined' ? null : window, function () {
  const CATEGORIES = { management: '부동산 자산관리', interior: '인테리어', other: '기타' };   // 사업실적 탭과 같다(임대 마케팅은 2026-10-21 뺐다)
  const escape = value => String(value ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // 카드: 사진 · 분류 · 제목. 카드 전체가 링크라 '○○ 보기 ↗' 글자는 두지 않는다(2026-10-22: 요소가 많아 보여 뺐다)
  // 예시 사진(imageSample)에는 사진 모서리에 '예시 이미지'를 단다
  const card = ({ href, image, label, title, note }) =>
    '<a href="' + escape(href) + '" data-reveal>' + (image ? '<div><img src="' + escape(image) + '" alt="" loading="lazy">' + (note ? '<span class="hw-news-photo-note">' + escape(note) + '</span>' : '') + '</div>' : '<div class="hw-news-nophoto"><span>사진 준비 중</span></div>') + '<small>' + escape(label) + '</small><h3>' + escape(title) + '</h3></a>';
  // 한 줄에 셋이 보이고, 더 있으면 가로 줄이 된다: 데스크톱은 사진 양옆에 떠 있는 화살표(줄에 마우스를 올리면 보인다)로, 폰은 손가락으로 넘긴다(폰은 다음 카드가 조금 보인다).
  // 처음 화면에 들어올 때 한 번 줄이 옆으로 천천히 밀렸다 돌아와 카드가 더 있음을 알린다. 최대 MAX 개, 나머지는 '전체보기'
  const VISIBLE = 3, MAX = 8;
  // 사업실적 '전체' 탭과 같은 순서: 관리 중인 건물(부동산 자산관리) 먼저, 그다음 탭이 있는 분류의 사례. 앞의 세 개만.
  // 소유주 요청으로 비공개인 건물은 메인 줄에 세우지 않는다(사업실적 페이지에서만 Private Asset 카드로 보인다)
  function caseCards(cases, buildings) {
    const fromBuildings = (buildings || []).filter(b => !b.undisclosed).map(b => card({ href: 'jll-remix-cases.html?category=management', image: b.image, note: b.image && b.imageSample ? '예시 이미지' : '', label: CATEGORIES.management + (b.sample ? ' · 샘플' : ''), title: b.name }));
    const fromCases = (cases || []).filter(c => Object.hasOwn(CATEGORIES, c.category)).map(c => card({ href: 'jll-remix-cases.html', image: c.image, label: CATEGORIES[c.category] + (c.sample ? ' · 샘플' : ''), title: c.title }));
    return fromBuildings.concat(fromCases).slice(0, MAX);
  }
  function insightCards(articles) {
    const list = (articles || []).slice();
    const featured = list.filter(a => a.featured).sort((a, b) => a.featured - b.featured);
    const picked = (featured.length ? featured.concat(list.filter(a => !a.featured)) : list).slice(0, MAX);
    return picked.map(a => card({ href: 'jll-remix-journal-v2.html?article=' + a.id, image: a.image, label: a.collection === 'journal' ? 'CEO 저널' : '리서치', title: a.title }));
  }
  function start(win) {
    const doc = win.document, rows = [...(doc.querySelectorAll?.('[data-news-row]') || [])];
    if (!rows.length) return null;
    const sources = {
      cases: Array.isArray(win.SPSCaseSamples) ? caseCards(win.SPSCaseSamples, win.SPSManagedBuildings?.buildings) : null,
      insights: Array.isArray(win.SPSJournalArticles) ? insightCards(win.SPSJournalArticles) : null,
    };
    const counts = {};
    rows.forEach(row => {
      const name = row.dataset.newsRow, cards = sources[name];
      if (!cards) { counts[name] = row.children.length; return; }          // 데이터가 없으면 마크업 그대로
      if (!cards.length) {                                                 // 글이 없는 섹션은 페이지 메뉴 항목과 함께 뺀다
        const section = row.closest?.('[data-news-section]') || row;
        doc.querySelector?.('.main-v4-page-nav a[href="#' + section.id + '"]')?.remove();
        section.remove();
        counts[name] = 0;
        return;
      }
      row.innerHTML = cards.join('');
      counts[name] = cards.length;
      if (cards.length > VISIBLE) { row.dataset.more = ''; dragScroll(win, row); arrows(win, row); nudge(win, row); }
    });
    return counts;
  }
  // 데스크톱 마우스: 줄을 끌어서 넘긴다(터치 · 트랙패드는 원래대로). 끌었으면 그 클릭은 링크로 가지 않는다
  function dragScroll(win, row) {
    if (typeof row.addEventListener !== 'function') return;
    let start = null, moved = false;
    row.addEventListener('dragstart', event => event.preventDefault());
    row.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      start = { x: event.clientX, left: row.scrollLeft }; moved = false;
    });
    win.addEventListener('pointermove', event => {
      if (!start) return;
      const dx = event.clientX - start.x;
      if (!moved && Math.abs(dx) < 5) return;
      moved = true; row.classList.add('is-dragging'); row.scrollLeft = start.left - dx;
    });
    win.addEventListener('pointerup', () => { start = null; row.classList.remove('is-dragging'); });
    row.addEventListener('click', event => { if (moved) { event.preventDefault(); event.stopPropagation(); moved = false; } }, true);
  }
  const reduced = win => Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  // 화살표: 줄을 감싼 .hw-news-rail 의 양옆, 사진 높이 가운데에 떠 있다. 줄에 마우스를 올리면 나타나고, 끝에 닿은 쪽은 감춘다(폰에서는 CSS 가 감춘다)
  function arrows(win, row) {
    if (typeof row.before !== 'function' || row.parentElement?.classList?.contains('hw-news-rail')) return;
    const label = row.closest?.('[data-news-section]')?.querySelector?.('.hw-news-heading h2')?.textContent?.trim() || '';
    const rail = win.document.createElement('div');
    rail.className = 'hw-news-rail';
    row.before(rail);
    rail.append(row);
    rail.insertAdjacentHTML('beforeend', '<button type="button" class="hw-news-arrow" data-dir="-1" aria-label="' + escape('이전 ' + label) + '"><sps-chevron class="hw-news-arrow-prev"></sps-chevron></button>'
      + '<button type="button" class="hw-news-arrow" data-dir="1" aria-label="' + escape('다음 ' + label) + '"><sps-chevron class="hw-news-arrow-next"></sps-chevron></button>');
    const [prev, next] = rail.querySelectorAll('.hw-news-arrow');
    const box = rail;
    const step = () => {
      const [a, b] = row.children;
      return a && b ? b.getBoundingClientRect().left - a.getBoundingClientRect().left : row.clientWidth / VISIBLE;
    };
    const sync = () => {
      prev.disabled = row.scrollLeft <= 1; next.disabled = row.scrollLeft >= row.scrollWidth - row.clientWidth - 1;
      const photo = row.firstElementChild?.firstElementChild;   // 사진 높이 가운데
      if (photo) rail.style.setProperty('--hw-news-arrow-top', Math.round(photo.offsetHeight / 2) + 'px');
    };
    box.addEventListener('click', event => {
      const button = event.target.closest('.hw-news-arrow');
      if (!button || button.disabled) return;
      row.scrollBy({ left: Number(button.dataset.dir) * step(), behavior: reduced(win) ? 'auto' : 'smooth' });
    });
    row.addEventListener('scroll', sync, { passive: true });
    win.addEventListener('resize', sync);
    sync();
  }
  // 처음 화면에 들어올 때 한 번: 카드가 나타난 뒤 왼쪽으로 천천히 밀려(1초) 옆 카드의 끝을 잠깐 보여 주고, 잠시 머물렀다 천천히(1.3초) 돌아온다(움직임 줄이기면 하지 않는다)
  function nudge(win, row) {
    if (typeof win.IntersectionObserver !== 'function' || reduced(win)) return;
    const observer = new win.IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const cards = [...row.children];
      cards.forEach(card => card.classList.add('is-revealed'));   // 옆에 있던 카드도 이때 보이게
      const glide = 'cubic-bezier(.45,0,.25,1)';
      win.setTimeout(() => cards.forEach(card => card.animate?.(
        [{ transform: 'translateX(0)', easing: glide }, { transform: 'translateX(-96px)', offset: .38 }, { transform: 'translateX(-96px)', offset: .5, easing: glide }, { transform: 'translateX(0)' }],
        { duration: 2600 })), 900);
    }, { threshold: .6 });
    observer.observe(row);
  }
  return { start, caseCards, insightCards, VISIBLE, MAX };
});
