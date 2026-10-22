const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=require('../jll-remix-main-v4-news.js');
const cases=require('../jll-remix-cases-data.js');
const managed=require('../jll-remix-buildings.js');

function fixture({cases:c,articles:a,buildings:b}={}){
  const removed=[];
  const section=id=>({id,removed:false,remove(){this.removed=true;removed.push(id);}});
  const sections={cases:section('hw-cases'),insights:section('hw-news')};
  const row=name=>({dataset:{newsRow:name},innerHTML:'static',children:[1,2,3],closest:()=>sections[name]});
  const rows=[row('cases'),row('insights')];
  const navLinks={};['hw-cases','hw-news'].forEach(id=>{navLinks[id]={removed:false,remove(){this.removed=true;}};});
  const win={document:{querySelectorAll:sel=>sel==='[data-news-row]'?rows:[],querySelector:sel=>{const m=sel.match(/href="#([a-z-]+)"/);return m?navLinks[m[1]]:null;}},SPSCaseSamples:c,SPSJournalArticles:a,SPSManagedBuildings:b};
  return {counts:api.start(win),rows,sections,navLinks,removed};
}
const articles=[{id:'x',featured:3,collection:'journal',title:'셋',image:'c.jpg'},{id:'y',featured:1,collection:'journal',title:'하나',image:'a.jpg'},{id:'z',collection:'research',title:'넷',image:'d.jpg'},{id:'w',featured:2,collection:'journal',title:'둘',image:'b.jpg'}];

test('사업실적 and 인사이트 rows show three cards and, when there are more, become a sideways row (data-more) like on phones; cards carry no extra 보기/읽기 line',()=>{
  const h=fixture({cases,articles,buildings:managed});
  assert.equal(api.VISIBLE,3);assert.equal(api.MAX,8);
  assert.deepEqual(h.counts,{cases:7,insights:4},'five named buildings + two cases; four articles (up to MAX)');
  assert.equal(h.rows[0].dataset.more,'','more than three → the row scrolls sideways with the next card peeking');
  assert.deepEqual([...h.rows[0].innerHTML.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m=>m[1]).slice(0,3),['승리빌딩','호성빌딩','유니트125'],'the managed buildings come first');
  assert.deepEqual(api.caseCards([],[{name:'Private Asset 01',undisclosed:true},{name:'승리빌딩'}]).map(c=>(c.match(/<h3>([^<]+)<\/h3>/)||[])[1]),['승리빌딩'],'undisclosed buildings stay off the main page row');
  assert.match(h.rows[0].innerHTML,/<a href="jll-remix-cases\.html\?category=management" data-reveal><div><img src="https:\/\/images\.unsplash\.com\/[^"]+" alt="" loading="lazy"><span class="hw-news-photo-note">예시 이미지<\/span><\/div><small>부동산 자산관리<\/small><h3>승리빌딩<\/h3><\/a>/,'an example building photo is tagged 예시 이미지 on the photo');
  assert.match(api.caseCards([],[{name:'승리빌딩'}])[0],/<div class="hw-news-nophoto"><span>사진 준비 중<\/span><\/div>/,'a building without a photo gets the 사진 준비 중 slot, not a stock image');
  assert.doesNotMatch(api.caseCards([],[{name:'A',image:'assets/a.jpg'}])[0],/예시 이미지/,'a real photo has no tag');
  assert.doesNotMatch(h.rows[0].innerHTML+h.rows[1].innerHTML,/보기 ↗|읽기 ↗|<span>[^<]*↗<\/span>/,'no 사업실적 보기 / 사례 보기 / 읽기 line under the titles');
  const storiesOnly=fixture({cases,articles});
  assert.equal(storiesOnly.counts.cases,2,'without the building data: only cases whose category still has a tab');
  assert.equal(storiesOnly.rows[0].dataset.more,undefined,'three or fewer cards stay a plain row');
  assert.doesNotMatch(storiesOnly.rows[0].innerHTML,/임대 마케팅/,'임대 마케팅 is gone from 사업실적');
  assert.match(storiesOnly.rows[0].innerHTML,/href="jll-remix-cases\.html"[\s\S]*부동산 자산관리 · 샘플/);
  assert.deepEqual([...h.rows[1].innerHTML.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m=>m[1]),['하나','둘','셋','넷'],'featured order, then the rest');
  assert.ok((h.rows[1].innerHTML.match(/data-reveal/g)||[]).length===4,'rendered cards still reveal on scroll');
  const css=fs.readFileSync(require.resolve('../jll-remix-main-v4.css'),'utf8');
  assert.match(css,/\.hw-main-v4 \.hw-news-grid\[data-more\] \{ grid-template-columns:none; grid-auto-flow:column; grid-auto-columns:calc\(\(100% - 72px\) \/ 3\);[^}]*scroll-snap-type:x mandatory;/,'exactly three cards on desktop; the arrows and the one-time nudge show there is more');
  assert.match(css,/\.hw-main-v4 \.hw-news-rail:is\(:hover,:focus-within\) \.hw-news-arrow:not\(:disabled\) \{ opacity:1;/,'the arrows float over the photo edges and appear on hover or keyboard focus, not beside 전체보기');
  assert.doesNotMatch(css,/has-arrows|\.hw-news-arrows \{/,'no arrow box left in the heading row');
  const js=fs.readFileSync(require.resolve('../jll-remix-main-v4-news.js'),'utf8');
  assert.match(js,/\{ duration: 2600 \}\)\), 900\);/,'the one-time nudge is slow: out ~1s, a short hold, back ~1.3s, starting after the cards fade in');
  const header=fs.readFileSync(require.resolve('../jll-remix-header.css'),'utf8');
  assert.match(header,/html\[data-sps-condense="bar"\] \[data-sps-header\]\.is-condensed :is\(\.nav-links > a, \.nav-links > sps-service-menu > \.sps-service-trigger\)::after \{ bottom: var\(--sps-nav-dy, 0px\); \}/,'in the folded bar the red current-page line stays on the bottom rule while the labels sit centred');
  assert.deepEqual(h.removed,[]);
});

test('a section with no posts is removed together with its page-menu link; missing data keeps the markup',()=>{
  const noCases=fixture({cases:[],articles});
  assert.equal(noCases.counts.cases,0);assert.deepEqual(noCases.removed,['hw-cases']);assert.ok(noCases.navLinks['hw-cases'].removed);assert.ok(!noCases.navLinks['hw-news'].removed);
  const noInsights=fixture({cases,articles:[]});
  assert.deepEqual(noInsights.removed,['hw-news']);
  const noData=fixture({});
  assert.deepEqual(noData.counts,{cases:3,insights:3},'without data scripts the static rows stay');assert.equal(noData.rows[0].innerHTML,'static');
  assert.equal(api.start({document:{querySelectorAll:()=>[]}}),null);
  assert.ok(fixture({cases,articles:[{id:'q',title:'<b>',image:'"x'}]}).rows[1].innerHTML.includes('&lt;b&gt;'),'text is escaped');
});

test('the page has two one-row sections with their own headings, links and page-menu entries, loaded before the Hanwha reveal observer',()=>{
  const html=fs.readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/<section class="hw-news hw-cases wrap" id="hw-cases"[^>]*data-news-section>/);
  assert.match(html,/<h2 id="hw-cases-title">사업실적<\/h2><a href="jll-remix-cases\.html">전체보기 <sps-arrow-up-right>/);
  assert.match(html,/<h2 id="hw-news-title">인사이트<\/h2><a href="jll-remix-journal-v2\.html">전체보기 <sps-arrow-up-right>/);
  assert.equal((html.match(/data-news-row="(cases|insights)"/g)||[]).length,2);
  assert.ok(html.indexOf('id="hw-cases"')<html.indexOf('id="hw-news"'),'cases come first');
  const order=['jll-remix-cases-data.js','jll-remix-journal-data.js','jll-remix-main-v4-news.js','jll-remix-hanwha.js'].map(f=>html.indexOf('<script src="'+f));
  assert.ok(order.every(i=>i>0)&&order.every((v,i)=>i===0||v>order[i-1]),'data → news → hanwha (which observes [data-reveal])');
  assert.match(html,/<a href="#hw-cases"><span class="main-v4-nav-label">사업실적<\/span><\/a>\n  <a href="#hw-news"><span class="main-v4-nav-label">인사이트<\/span><\/a>/);
  const css=fs.readFileSync(require.resolve('../jll-remix-hanwha.css'),'utf8');
  assert.match(css,/\.hw-news\.hw-cases \{ padding-bottom: 0; \}/,'no bottom gap under 서비스 사례');assert.match(css,/\.hw-cases \+ \.hw-news \{ padding-top: clamp\(64px, 6vw, 96px\); \}/,'one short gap so the two read as one block');
});
