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

test('사업실적 and 인사이트 each render one row of three: 사업실적 follows the 전체 tab (managed buildings first), insights in featured order',()=>{
  const h=fixture({cases,articles,buildings:managed});
  assert.deepEqual(h.counts,{cases:3,insights:3});
  assert.equal((h.rows[0].innerHTML.match(/<a /g)||[]).length,3);
  assert.deepEqual([...h.rows[0].innerHTML.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m=>m[1]),['승리빌딩','호성빌딩','유니트125'],'the first three managed buildings');
  assert.match(h.rows[0].innerHTML,/<a href="jll-remix-cases\.html\?category=management" data-reveal><div class="hw-news-nophoto"><span>사진 준비 중<\/span><\/div><small>부동산 자산관리<\/small><h3>승리빌딩<\/h3><span>사업실적 보기 ↗<\/span><\/a>/,'a building without a photo gets the 사진 준비 중 slot, not a stock image');
  const storiesOnly=fixture({cases,articles});
  assert.equal(storiesOnly.counts.cases,2,'without the building data: only cases whose category still has a tab');
  assert.doesNotMatch(storiesOnly.rows[0].innerHTML,/임대 마케팅/,'임대 마케팅 is gone from 사업실적');
  assert.match(storiesOnly.rows[0].innerHTML,/href="jll-remix-cases\.html"[\s\S]*부동산 자산관리 · 샘플[\s\S]*사례 보기 ↗/);
  assert.deepEqual([...h.rows[1].innerHTML.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m=>m[1]),['하나','둘','셋']);
  assert.ok((h.rows[1].innerHTML.match(/data-reveal/g)||[]).length===3,'rendered cards still reveal on scroll');
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
