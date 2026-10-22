const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('부동산 자산관리 lists the five real managed buildings (위치 · 용도 · 연면적 · 층수) and three 비공개 요청 자산; empty fields stay off the card and a missing photo shows a 사진 준비 중 slot',()=>{
  const B=require('../jll-remix-buildings.js');
  const named=B.buildings.filter(b=>!b.undisclosed);
  assert.deepEqual(named.map(b=>[b.name,b.use,b.floors]),[['승리빌딩','근린생활시설','지하 1층 · 지상 4층'],['호성빌딩','근린생활시설','지하 1층 · 지상 4층'],['유니트125','청년안심주택 · 아파트','지하 2층 · 지상 13층'],['신의S컬렉션','업무시설 · 오피스텔','지하 3층 · 지상 11층'],['학삼빌딩','업무시설','지하 2층 · 지상 8층']]);
  assert.ok(named.every(b=>/^\d{1,3}(,\d{3})*㎡$/.test(b.gfa)),'연면적 filled (placeholder values for now)');
  assert.equal(B.buildings.filter(b=>b.undisclosed).length,3,'three buildings undisclosed at the owners\' request');
  assert.ok(B.buildings.every(b=>!b.sample),'real buildings, not samples');
  for(const b of B.buildings)if(b.image){
    if(b.imageSample)assert.match(b.image,/^https:\/\/images\.unsplash\.com\/photo-[0-9a-f-]+\?w=1080&h=800&fit=crop/,'example photos (2026-10-22, just for the feel) are free Unsplash photos linked at card size: '+b.name);
    else assert.ok(fs.existsSync(path.join(root,b.image)),'photo exists: '+b.image);
    assert.doesNotMatch(b.image,/assets\/(jll|hanwha-reference)\//);
  }
  assert.deepEqual(named.filter(b=>b.imageSample).length,5,'all five named buildings show an example photo for now');
  const bare=B.cards([{name:'승리빌딩',area:'서울특별시',use:'근린생활시설',gfa:'1,320㎡',floors:'지하 1층 · 지상 4층'}]);
  assert.match(bare,/<article class="iv2-post cases-building" data-iv2-reveal>\s*<div class="cases-building-card">\s*<span class="iv2-photo cases-building-nophoto"><span>사진 준비 중<\/span><\/span>\s*<div class="iv2-copy">\s*<p class="iv2-meta">부동산 자산관리<\/p>\s*<h2>승리빌딩<\/h2>/,'same frame as the case cards; the small line is the category only; no stock photo when none is given');
  assert.deepEqual([...bare.matchAll(/<dt>([^<]+)<\/dt><dd>([^<]+)<\/dd>/g)].map(m=>[m[1],m[2]]),[['위치','서울특별시'],['용도','근린생활시설'],['연면적','1,320㎡'],['층수','지하 1층 · 지상 4층']],'위치 (city level) moved from the small line into the table, then 용도 · 연면적 · 층수');
  const html=B.cards(B.buildings.slice(0,1));
  assert.match(html,/<span class="iv2-photo cases-building-photo"><img src="https:\/\/images\.unsplash\.com\/photo-[^"]+" alt="[^"]*\(예시\)"[^>]*><span class="cases-building-photo-note">예시 이미지<\/span><\/span>/,'an example photo says so on the photo and in its alt text');
  assert.deepEqual(B.buildings.filter(b=>b.undisclosed).map(b=>b.name),['비공개 요청 자산','비공개 요청 자산','비공개 요청 자산'],'Korean wording, no numbering (2026-10-22: not Private Asset 01–03)');
  const hidden=B.cards(B.buildings.filter(b=>b.undisclosed).slice(0,1));
  assert.match(hidden,/<span class="iv2-photo cases-building-nophoto cases-building-private"><span class="cases-building-seal" aria-hidden="true"><sps-service-pictogram data-service="private" data-style="reference"><\/sps-service-pictogram><\/span><\/span>\s*<div class="iv2-copy">\s*<p class="iv2-meta">부동산 자산관리<\/p>\s*<h2>비공개 요청 자산<\/h2>/,'an undisclosed building: the lock pictogram on the grey slot (hidden from assistive tech, the title says it), the service label only');
  assert.deepEqual([...hidden.matchAll(/<dt>([^<]+)<\/dt><dd>([^<]+)<\/dd>/g)].map(m=>[m[1],m[2]]),[['자산 정보','소유주 요청에 따라 비공개로 관리합니다']],'one fact row');
  assert.doesNotMatch(hidden,/비공개 자산|건물 정보|사진 준비 중|<img|PRIVATE|seal-label/,'no old wording, no photo placeholder, no PRIVATE label under the pictogram');
  assert.doesNotMatch(B.cards([{name:'X',undisclosed:true,image:'assets/landing/city.jpg',alt:'X 외관',area:'서울',use:'업무시설',gfa:'1,000㎡',floors:'지하 1층 · 지상 5층'}]),/<img|city\.jpg|외관|서울|업무시설|1,000㎡|지하 1층/,'nothing leaks from an undisclosed building');
  assert.doesNotMatch(html,/<a\b|샘플|undefined/);
  const full=B.cards([{name:'A',use:'업무시설',area:'서울 동대문구',floors:'지하 1층 · 지상 5층',gfa:'1,000㎡',image:'assets/landing/city.jpg',alt:'A 외관'}]);
  assert.match(full,/<img src="assets\/landing\/city\.jpg" alt="A 외관"[^>]*><\/span>/,'a real photo carries no 예시 이미지 tag');assert.match(full,/<p class="iv2-meta">부동산 자산관리<\/p>/);
  assert.deepEqual([...full.matchAll(/<dt>([^<]+)<\/dt>/g)].map(m=>m[1]),['위치','용도','연면적','층수'],'filled fields appear when they are added');
  assert.deepEqual([...B.cards([{name:'B',use:'업무시설'}]).matchAll(/<dt>([^<]+)<\/dt>/g)].map(m=>m[1]),['용도'],'empty fields stay off');
  assert.match(B.cards([{name:'<b>',use:'x'}]),/<h2>&lt;b&gt;<\/h2>/,'text is escaped');
});

test('the cases page is 사업실적 with one tab row: 전체 · 부동산 자산관리 · 인테리어 · 기타 (no 임대 마케팅, no 관리 실적 tab, no stacked sections)',()=>{
  const page=read('jll-remix-cases.html');
  assert.match(page,/<title>사업실적 — SPS<\/title>/);
  assert.match(page,/<span aria-current="page">사업실적<\/span>/);
  assert.match(page,/<h1 id="cases-title"><span class="iv2-title-label">사업실적<\/span><\/h1>\s*<\/section>\s*<div class="wrap">\s*<div class="iv2-filters" role="group" aria-label="사업실적 분류" data-iv2-reveal>\s*<button type="button" class="active" data-case-category="all" aria-pressed="true">전체<\/button>\s*<button type="button" data-case-category="management" aria-pressed="false">부동산 자산관리<\/button>\s*<button type="button" data-case-category="interior" aria-pressed="false">인테리어<\/button>\s*<button type="button" data-case-category="other" aria-pressed="false">기타<\/button>/);
  assert.doesNotMatch(page,/data-case-category="(marketing|buildings)"/,'no 임대 마케팅 / 관리 실적 tab');
  assert.doesNotMatch(page,/cases-buildings|cases-section-head|cases-stories-title/,'no stacked buildings / stories sections');
  assert.ok(page.indexOf('jll-remix-buildings.js')<page.indexOf('jll-remix-cases.js'),'building data loads before the tab controller');
  const css=read('jll-remix-cases.css');
  assert.match(css,/\.cases-building-card \{ display:flex; flex-direction:column; height:100%; \}/);
  assert.doesNotMatch(css.slice(css.indexOf('사업실적')),/#[0-9a-f]{3,6}\b|rgb\(/i,'existing tokens only');
});

test('menus say 사업영역 and 사업실적 in the shared header and footer',()=>{
  const header=read('jll-remix-header.js'),footer=read('jll-remix-footer.js');
  assert.match(header,/\{ label: '사업영역', href: sectionHref\('services'\), section: 'services' \}/);
  assert.match(header,/\{ label: '사업실적', href: 'jll-remix-cases\.html', current: isCases \}/);
  assert.doesNotMatch(header,/label: '서비스( 사례)?'/);
  assert.doesNotMatch(footer,/'서비스 사례'|<h3>서비스<\/h3>|row\('서비스'/);
});

test('the 비공개 요청 자산 slot draws the private reference pictogram: a simple outline lock only, in existing tokens only',()=>{
  const vm=require('node:vm');
  const registry=new Map();
  const sandbox={HTMLElement:class{constructor(){this.dataset={};this.attributes={};this.innerHTML='';this.firstElementChild=null;}setAttribute(name,value){this.attributes[name]=value;}},customElements:{get:name=>registry.get(name),define:(name,ctor)=>registry.set(name,ctor)}};
  vm.runInNewContext(read('jll-remix-components.js'),sandbox);
  const draw=(service,style)=>{const el=new (registry.get('sps-service-pictogram'))();Object.assign(el.dataset,{service,style});el.connectedCallback();return el;};
  const el=draw('private','reference');
  assert.equal(el.attributes['aria-hidden'],'true');
  assert.match(el.innerHTML,/^<svg viewBox="0 0 160 128" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="square" stroke-linejoin="miter" focusable="false" aria-hidden="true">/,'same reference grammar as the 사업영역 pictograms');
  assert.match(el.innerHTML,/aria-hidden="true"><path d="M62 57V43a18 18 0 0 1 36 0v14"\/><path d="M52 57h56v44H52Z"\/><path d="M80 72v14"\/><\/svg>$/,'just a lock: shackle, body and keyhole, centred in the 160×128 box (2026-10-22: the document is gone)');
  assert.doesNotMatch(el.innerHTML,/M44 14h56/,'no document outline');
  assert.doesNotMatch(el.innerHTML,/fill="var/,'outline only: no red or white areas');
  assert.doesNotMatch(el.innerHTML,/#[0-9a-f]{3,6}|rgb\(|stroke="var/i,'existing tokens only');
  assert.notEqual(draw('private','classic').innerHTML,el.innerHTML,'only the reference style knows the private pictogram');
  assert.match(draw('management','reference').innerHTML,/M47 15h53l19 19v65H47Z/,'the 사업영역 pictograms are unchanged');
  const css=read('jll-remix-cases.css');
  assert.match(css,/\.cases-building-private sps-service-pictogram \{ width:72px; max-width:none; \}/,'a small lock (2026-10-22: 100 → 72px)');
  assert.match(css,/@media\(max-width:850px\) \{[\s\S]*:where\(html:not\(\[data-sps-desktop\]\)\) \.cases-building-private sps-service-pictogram \{ width:60px; \}/,'smaller on phones, not in forced desktop view');
  const page=read('jll-remix-cases.html');
  assert.ok(page.includes('jll-remix-components.js'),'the cases page defines the pictogram element');
});
