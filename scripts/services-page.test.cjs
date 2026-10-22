const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=f=>fs.readFileSync(require.resolve('../'+f),'utf8').replace(/\r\n?/g,'\n');

test('사업영역 page: three sections in dropdown order, a sticky index to the same ids, the main-page statement and rows, and the shared header/footer',()=>{
  const html=read('jll-remix-services.html');
  assert.match(html,/<title>사업영역 — SPS<\/title>/);
  assert.match(html,/<header class="nav-shell" data-sps-header data-page="services"><\/header>/,'the header marks the 사업영역 trigger as current');
  assert.match(html,/<main id="main" class="hw-services3">/,'main carries .hw-services3 so the main-page row rules and reveal completion apply, and the sticky index spans the whole page');
  const ids=[...html.matchAll(/<section class="svc-section" id="([a-z]+)"/g)].map(m=>m[1]);
  assert.deepEqual(ids,['management','marketing','interior'],'same keys as the header dropdown');
  assert.deepEqual((html.match(/<nav class="svc-nav"[\s\S]*?<\/nav>/)||[''])[0].match(/href="#([a-z]+)"/g),['href="#management"','href="#marketing"','href="#interior"']);
  assert.deepEqual([...html.matchAll(/<li style="--i:\d"><a href="#([a-z]+)">/g)].map(m=>m[1]),['management','marketing','interior'],'the hero index (same as the main page) points into the page');
  assert.match(html,/<h1 id="services-title"><span class="hw-services3-line"><span>건물의 매일을 살피고,<\/span><\/span>/,'the main-page statement, as the page h1');
  assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/<h4\b/g)||[]).length,0,'h1 → h2 → h3 only');
  assert.deepEqual([...html.matchAll(/<p class="hw-services3-eyebrow"[^>]*>([^<]+)<\/p>/g)].map(m=>m[1]),['01 / 부동산 자산관리','02 / 임대 마케팅','03 / 인테리어'],'numbered Korean labels, no English');
  assert.deepEqual([...html.matchAll(/<h2 id="[a-z]+-title" tabindex="-1"[^>]*>([\s\S]*?)<\/h2>/g)].map(m=>m[1]),['당신의 자산에,<br>더 단단한 내일을.','비어 있는 공간에,<br>맞는 사람을.','쓰임에 맞게,<br>공간을 다시 그립니다.'],'the main-page row headlines');
  assert.match(html,/<section class="svc-section" id="marketing"[^>]*data-flip/,'02 flips the photo to the right like the main page');
  assert.deepEqual([...html.matchAll(/<article class="svc-item"[\s\S]*?<h3>([^<]+)<\/h3>/g)].map(m=>m[1]),['임대관리','시설관리','회계정산대행','임대조건 분석','임차인 유치','실내건축','리모델링','공간개선'],'sub-services match the dropdown descriptions');
  for(const m of html.matchAll(/<img [^>]*>/g))assert.match(m[0],/ alt="[^"]+"/,'every image has alt: '+m[0].slice(0,60));
  assert.match(html,/<footer class="sps-footer" id="sps-footer" data-sps-footer data-sps-layout>/);
  const scripts=['jll-remix-header.js','jll-remix-components.js','jll-remix-footer.js','jll-remix-contact.js','jll-remix-buildings.js','jll-remix-services3.js','jll-remix-services.js'].map(f=>html.indexOf('<script src="'+f));
  assert.ok(scripts.every(i=>i>0)&&scripts.every((v,i)=>i===0||v>scripts[i-1]),'buildings data loads before the page script; the main-page ink/drift script is reused');
  assert.match(html,/jll-remix-services3\.css\?v=/);assert.match(html,/jll-remix-support\.css\?v=/);assert.match(html,/jll-remix-cases\.css\?v=/);
});

test('사업영역 copy stays inside the registered scope: no brokerage, guarantee, promise or licence wording; the full registration name; contact hooks carry the inquiry situation',()=>{
  const html=read('jll-remix-services.html');
  for(const word of ['중개','매물','알선','보장','확정 임대료','24시간','무상','평당','면허','전대'])assert.ok(!html.includes(word),'forbidden word: '+word);
  assert.match(html,/<dd>주택임대관리업 동대문구-위탁관리형-주택임대관리업자-2<\/dd>/,'the registration is spelled out as on the about page');
  assert.doesNotMatch(html,/월 1회|월간 보고서|야간 작업/,'no reporting cadence or work-hour promise before it is confirmed');
  assert.deepEqual([...html.matchAll(/class="hw-services3-link"[^>]*data-inquiry data-inquiry-situation="([a-z]+)"/g)].map(m=>m[1]),['operation','vacancy','interior'],'each row CTA opens the inquiry dialog with its situation (keys from jll-remix-contact.js)');
  const contact=read('jll-remix-contact.js');
  for(const key of ['operation','vacancy','interior'])assert.match(contact,new RegExp('^    '+key+':\\{','m'),key+' is a situation the dialog knows');
  assert.match(html,/href="jll-remix-support\.html#consultation" data-inquiry/,'the no-JS fallback lands on the support page consultation section');
  assert.ok(read('jll-remix-support.html').includes('id="consultation"'));
  assert.match(html,/<button type="button" class="svc-chip" data-svc-chip="management" data-inquiry data-inquiry-situation="operation">부동산 자산관리<\/button>/);
  assert.match(html,/<h2 id="contact-title">가지고 계신 고민을 들려주세요\.<br>필요한 서비스를 함께 고민하겠습니다\.<\/h2>/,'the main-page 고객지원 sentence closes the page');
});

test('the page script renders the managed buildings like the main-page row (example-photo tag, one lock cell for undisclosed assets) and maps sections to inquiry situations',()=>{
  const api=require('../jll-remix-services.js');
  const B=require('../jll-remix-buildings.js');
  const html=api.buildingCards(B.buildings);
  assert.equal((html.match(/<a href="jll-remix-cases\.html\?category=management" data-reveal>/g)||[]).length,B.buildings.filter(b=>!b.undisclosed).length,'one card per public building');
  assert.match(html,/<small>근린생활시설 · 지하 1층 · 지상 4층<\/small><h3>승리빌딩<\/h3>/,'use and floors from the building data, not a repeated category label');
  assert.equal((html.match(/hw-news-photo-note">예시 이미지/g)||[]).length,B.buildings.filter(b=>b.image&&b.imageSample).length,'example photos are tagged');
  assert.match(html,/<div class="svc-private" data-reveal><sps-service-pictogram data-service="private" data-style="reference" aria-hidden="true"><\/sps-service-pictogram><p>비공개 요청 자산 3건<span>소유주 요청에 따라 비공개로 관리합니다<\/span><\/p><\/div>$/,'undisclosed assets become one counted lock cell with the 사업실적 wording');
  assert.doesNotMatch(html,/Private Asset|비공개 요청 자산<\/h3>/,'undisclosed buildings never get a card of their own');
  assert.equal(api.buildingCards([{name:'A'}]),'<a href="jll-remix-cases.html?category=management" data-reveal><div class="hw-news-nophoto"><span>사진 준비 중</span></div><small>부동산 자산관리</small><h3>A</h3></a>','a building without a photo gets the 사진 준비 중 slot');
  assert.match(api.buildingCards([{name:'<b>',use:'"x'}]),/&lt;b&gt;|&quot;x/,'escaped');
  assert.deepEqual(api.SITUATION,{management:'operation',marketing:'vacancy',interior:'interior'});
  assert.equal(api.start({document:{querySelector:()=>null}}),null,'inert off the page');
});

test('the page stylesheet keeps the main-page grammar: tokens only, phone rules guarded, anchor offset adds only the index height, no underline on text links',()=>{
  const css=read('jll-remix-services.css');
  assert.doesNotMatch(css,/#[0-9a-fA-F]{3,6}\b|rgb\(/,'no new colours');
  assert.match(css,/\.hw-services-page :is\(\.svc-section, \.svc-process, \.svc-faq, \.svc-closing\) \{ scroll-margin-top: calc\(var\(--svc-nav-height\) \+ 4px\); \}/,'the global scroll-padding already covers the header');
  assert.match(css,/\.svc-nav \{ position: sticky; top: var\(--sps-header-visible, var\(--sps-header-height, 137px\)\);/,'the index sits under the header, following it when it folds into the bar');
  assert.match(css,/\.svc-section\[data-flip\] \.hw-services3-image \{ order: 2; \}/);
  assert.match(css,/\.hw-services-page \.hw-services3-link \{ border-bottom-color: transparent; \}/,'no link underline, as everywhere else');
  assert.match(css,/\.svc-chip \{ min-height: 44px;/,'touch-size chips');
  assert.match(css,/\.hw-services-page \.hw-news-photo-note \{/,'the example-photo tag rule is copied from the main page');
  for(const block of css.split('@media (max-width:').slice(1)){
    const body=block.slice(block.indexOf('{')+1);
    for(const line of body.split('\n').map(l=>l.trim()).filter(l=>l&&l!=='}'))assert.match(line,/^:where\(html:not\(\[data-sps-desktop\]\)\)/,'phone rule guarded: '+line.slice(0,80));
  }
  assert.match(css,/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.hw-motion \.hw-services-page \[data-reveal\] \{ opacity: 1; transform: none; transition: none; \}/);
});

test('clicking the header 사업영역 trigger itself (mouse, desktop) goes to the 사업영역 page; keyboard and the phone menu still open the list',()=>{
  const src=read('jll-remix-components.js');
  assert.match(src,/if \(event\.detail > 0 && !this\.hasAttribute\('data-mobile'\) && variant === 'v1'\) \{[\s\S]*?window\.top\.location\.assign\(servicesPage\)/,'a real click navigates');
  assert.match(src,/if \(onServicesPage\) \{ window\.scrollTo\(\{ top: 0,/,'on the page itself it just returns to the top');
  assert.match(src,/const keepHoverOpen = event\.detail > 0 && this\.openedByHover;/,'the toggle path stays for keyboard (detail 0) and the phone menu');
});
