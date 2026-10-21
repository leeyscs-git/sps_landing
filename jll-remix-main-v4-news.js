/* V4 '사업실적' · '인사이트': 두 섹션이 각각 한 줄(3개)이다. 데이터에서 다시 그리고, 글이 없는 섹션은 페이지 메뉴 항목과 함께 뺀다.
   한화 스크립트가 [data-reveal] 을 관찰하기 전에 실행되도록, 페이지에서 한화 스크립트보다 앞에 둔다. 데이터가 없으면 마크업(같은 내용)을 그대로 둔다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root) root.SPSMainNews = api.start(root);
})(typeof window === 'undefined' ? null : window, function () {
  const CATEGORIES = { management: '부동산 자산관리', interior: '실내건축', other: '기타' };   // 사업실적 탭과 같다(임대 마케팅은 2026-10-21 뺐다)
  const escape = value => String(value ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const card = ({ href, image, label, title, action }) =>
    '<a href="' + escape(href) + '" data-reveal>' + (image ? '<div><img src="' + escape(image) + '" alt="" loading="lazy"></div>' : '<div class="hw-news-nophoto"><span>사진 준비 중</span></div>') + '<small>' + escape(label) + '</small><h3>' + escape(title) + '</h3><span>' + escape(action) + ' ↗</span></a>';
  // 사업실적 '전체' 탭과 같은 순서: 관리 중인 건물(부동산 자산관리) 먼저, 그다음 탭이 있는 분류의 사례. 앞의 세 개만
  function caseCards(cases, buildings) {
    const fromBuildings = (buildings || []).map(b => card({ href: 'jll-remix-cases.html?category=management', image: b.image, label: CATEGORIES.management + (b.sample ? ' · 샘플' : ''), title: b.name, action: '사업실적 보기' }));
    const fromCases = (cases || []).filter(c => Object.hasOwn(CATEGORIES, c.category)).map(c => card({ href: 'jll-remix-cases.html', image: c.image, label: CATEGORIES[c.category] + (c.sample ? ' · 샘플' : ''), title: c.title, action: '사례 보기' }));
    return fromBuildings.concat(fromCases).slice(0, 3);
  }
  function insightCards(articles) {
    const list = (articles || []).slice();
    const featured = list.filter(a => a.featured).sort((a, b) => a.featured - b.featured);
    const picked = (featured.length ? featured.concat(list.filter(a => !a.featured)) : list).slice(0, 3);
    return picked.map(a => card({ href: 'jll-remix-journal-v2.html?article=' + a.id, image: a.image, label: a.collection === 'journal' ? 'CEO 저널' : '리서치', title: a.title, action: '읽기' }));
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
    });
    return counts;
  }
  return { start, caseCards, insightCards };
});
