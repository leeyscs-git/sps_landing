const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('사업실적 · 관리 실적 lists five sample managed buildings with photo, area, use and scale in the shared card frame',()=>{
  const B=require('../jll-remix-buildings.js');
  assert.equal(B.buildings.length,5,'five dummy buildings for now');
  for(const b of B.buildings){
    for(const key of ['name','area','use','floors','gfa','image','alt'])assert.ok(b[key],b.name+' has '+key);
    assert.equal(b.since,undefined,'no 관리 시작');assert.equal(b.scope,undefined,'no 맡은 일');
    assert.equal(b.sample,true,'marked as a sample until real buildings replace it');
    assert.ok(fs.existsSync(path.join(root,b.image)),'photo exists: '+b.image);
    assert.doesNotMatch(b.image,/assets\/(jll|hanwha-reference)\//,'no reference-site photos');
  }
  const html=B.cards(B.buildings.slice(0,1));
  assert.match(html,/<article class="iv2-post cases-building" data-iv2-reveal>\s*<div class="cases-building-card">\s*<span class="iv2-photo"><img src="assets\/landing\/architecture\.jpg" alt="[^"]+" width="800" height="600" loading="eager" decoding="async"><\/span>\s*<div class="iv2-copy">\s*<p class="iv2-meta">부동산 자산관리 · 서울 동대문구 · 샘플<\/p>\s*<h2>오피스 A<\/h2>/,'same frame as the case cards: photo, small label, title');
  assert.deepEqual([...html.matchAll(/<dt>([^<]+)<\/dt><dd>([^<]+)<\/dd>/g)].map(m=>[m[1],m[2]]),[['용도','업무시설'],['규모','지하 3층 · 지상 15층'],['연면적','18,400㎡']],'facts: 용도 · 규모 · 연면적');
  assert.doesNotMatch(html,/<a\b|관리 시작|맡은 일/,'no link, no 관리 시작 / 맡은 일');
  assert.match(B.cards([{...B.buildings[0],name:'<b>'}]),/<h2>&lt;b&gt;<\/h2>/,'text is escaped');
});

test('the cases page is 사업실적 with one tab row: 전체 · 부동산 자산관리 · 실내건축 · 기타 (no 임대 마케팅, no 관리 실적 tab, no stacked sections)',()=>{
  const page=read('jll-remix-cases.html');
  assert.match(page,/<title>사업실적 — SPS<\/title>/);
  assert.match(page,/<span aria-current="page">사업실적<\/span>/);
  assert.match(page,/<h1 id="cases-title"><span class="iv2-title-label">사업실적<\/span><\/h1>\s*<\/section>\s*<div class="wrap">\s*<div class="iv2-filters" role="group" aria-label="사업실적 분류" data-iv2-reveal>\s*<button type="button" class="active" data-case-category="all" aria-pressed="true">전체<\/button>\s*<button type="button" data-case-category="management" aria-pressed="false">부동산 자산관리<\/button>\s*<button type="button" data-case-category="interior" aria-pressed="false">실내건축<\/button>\s*<button type="button" data-case-category="other" aria-pressed="false">기타<\/button>/);
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
