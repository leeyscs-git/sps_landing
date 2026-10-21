const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {routes,markup,mount,companyDetails}=require('../jll-remix-footer.js');
const root=path.resolve(__dirname,'..');
const pages=fs.readdirSync(root).filter(file=>/^jll-remix.*\.html$/.test(file)&&fs.readFileSync(path.join(root,file),'utf8').includes('data-sps-header'));

test('every current SPS page has one shared footer outside main, with its required scripts and style',()=>{
  assert.equal(pages.length,17);
  for(const file of pages){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    const footer=html.indexOf('<footer class="sps-footer"');
    assert.ok(footer>html.indexOf('</main>'),file+' footer is a document landmark');
    assert.equal([...html.matchAll(/<footer\b/g)].length,1,file+' footer count');
    assert.equal([...html.matchAll(/src="jll-remix-footer\.js/g)].length,1,file+' shared script');
    assert.equal([...html.matchAll(/href="jll-remix-footer\.css/g)].length,1,file+' shared styles');
    assert.ok(html.includes('jll-remix-contact.js'),file+' supports the shared inquiry action');
    if(html.includes('jll-remix-hanwha.js'))assert.ok(html.indexOf('jll-remix-footer.js')<html.indexOf('jll-remix-hanwha.js'),file+' footer mounts before scroll measurements');
    if(file==='jll-remix-main-v2.html'||file==='jll-remix-main-v4.html')assert.match(html,/<footer[^>]*id="hw-footer"/);
  }
  const guide=fs.readFileSync(path.join(root,'jll-remix-design-system.html'),'utf8');
  assert.match(guide,/id="footer-component"/);
  assert.match(guide,/data-sps-footer data-footer-preview/);
});

test('footer navigation uses existing pages, supported services and the existing phone number',()=>{
  const html=markup({home:'jll-remix-main-v4.html',about:'jll-remix-about.html',insights:'jll-remix-journal-v2.html',top:'#main'},2026);
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
    if(href.startsWith('#')||href.startsWith('tel:')||href.startsWith('https://'))continue;   // 패밀리사이트는 바깥 사이트
    const url=new URL(href,'http://localhost/');
    const target=path.join(root,url.pathname.slice(1));
    assert.ok(fs.existsSync(target),href+' resolves');
    // Inquiry is a dialog route; other fragments must identify authored elements.
    if(url.hash&&url.hash!=='#inquiry')assert.ok(fs.readFileSync(target,'utf8').includes('id="'+url.hash.slice(1)+'"'),href+' fragment resolves');
    if(url.searchParams.has('service'))assert.ok(['management','marketing','interior'].includes(url.searchParams.get('service')));
  }
  const support=fs.readFileSync(path.join(root,'jll-remix-support.html'),'utf8');
  assert.ok(support.includes('tel:0222475799'));
  assert.match(html,/data-inquiry aria-haspopup="dialog"/);
  assert.match(html,/© 2026 SPS/);
  assert.doesNotMatch(html,/href="#"|javascript:|개인정보처리방침/);
  // 아래 줄: 로고·사업자 정보·저작권 / 패밀리사이트(새 창, opener 없이)·맨 위로
  assert.match(html,/<div class="sps-footer-bottom">\s*<div class="sps-footer-identity">[\s\S]*sps-footer-logo[\s\S]*사업자등록번호 219-87-04014[\s\S]*© 2026 SPS[\s\S]*<div class="sps-footer-side">\s*<details class="sps-footer-family" data-footer-family>/);
  assert.deepEqual([...html.matchAll(/<li><a href="([^"]+)" target="_blank" rel="noopener">([^<]+) </g)].map(m=>[m[2],m[1]]),[['신의알앤씨','https://shineui.kr'],['UNIT125','https://unit125.shineui.kr']]);
  assert.ok(html.indexOf('data-footer-family')<html.indexOf('data-footer-top'),'back to top sits under the family sites');
  // 가운데 줄: 큰 대표전화와 상담 운영시간이 메뉴 묶음 앞(왼쪽)에
  assert.match(html,/<div class="sps-footer-directory">\s*<div class="sps-footer-call-block">\s*<a class="sps-footer-call" href="tel:0222475799"><span class="sps-footer-call-label">대표전화<\/span><span class="sps-footer-call-number">02-2247-5799<\/span><\/a>/);
  assert.match(html,/<dl class="sps-footer-hours"><dt>상담 운영시간<\/dt><dd>평일 09:00 – 18:00<\/dd><dd>점심 12:00 – 13:00<\/dd><dd>주말·공휴일 휴무<\/dd><\/dl>\s*<\/div>\s*<nav class="sps-footer-nav"/);
  const noTop=markup({home:'jll-remix-main-v4.html',about:'jll-remix-about.html',insights:'jll-remix-journal-v2.html',top:'#main'},2026,{top:false});
  assert.doesNotMatch(noTop,/data-footer-top|맨 위로/,'pages with their own floating back-to-top leave it out of the footer');
  const v4=fs.readFileSync(path.join(root,'jll-remix-main-v4.html'),'utf8');
  assert.match(v4,/<footer class="sps-footer" data-sps-footer data-sps-layout id="hw-footer">/,'V4 keeps the footer 맨 위로 (the floating button hides when the footer is in view)');
  const css=fs.readFileSync(path.join(root,'jll-remix-footer.css'),'utf8');
  // 위 두 줄은 같은 두 칸 격자를 나눠 쓴다: 문의 버튼 왼쪽 끝 = 메뉴 묶음 왼쪽 끝
  assert.match(css,/\.sps-footer :is\(\.sps-footer-lead,\.sps-footer-directory\) \{ display:grid; grid-template-columns:subgrid; \}/);
  assert.match(css,/\.sps-footer \.sps-footer-call-block \{[^}]*flex-direction:column;/,'the consultation hours sit under the phone number');
  assert.match(html,/<p class="sps-footer-business"><span>주택임대관리업등록번호 동대문구-위탁관리형-주택임대관리업자-2<\/span><\/p>\s*<p class="sps-footer-copy">/,'the rental-management licence sits on its own line above the copyright');
  assert.match(companyDetails(true),/<dt>사업자등록번호<\/dt><dd>219-87-04014<\/dd><\/div><div><dt>주택임대관리업등록번호<\/dt><dd>동대문구-위탁관리형-주택임대관리업자-2<\/dd>/,'and in the shared company details');
  assert.match(css,/\.sps-footer \.sps-footer-consult \{ grid-column:2; justify-self:end;/,'the inquiry button hugs the right edge');
  assert.match(css,/\.sps-footer \.sps-footer-nav \{[^}]*justify-content:end;[^}]*margin-left:auto;/,'the menu groups hug the right edge');
  assert.match(css,/\.sps-footer \.sps-footer-phone \{ color:inherit;/,'the bottom-row phone is the same grey as the other details');
  // 아래 줄 번호는 링크가 아닌 글자: 눌러도·올려도 반응 없음 (전화는 위의 큰 번호로)
  assert.match(html,/<span class="sps-footer-phone">대표전화 02-2247-5799<\/span>/);
  assert.equal((html.match(/href="tel:/g)||[]).length,1,'only the large number dials');
  assert.doesNotMatch(css,/sps-footer-phone\)?:hover/,'no hover underline on the bottom-row number');
  assert.match(css,/\.sps-footer \.sps-footer-group h3 \{[^}]*color:var\(--ink\);/,'group titles are ink');
  assert.match(css,/\.sps-footer \.sps-footer-group a \{[^}]*min-height:36px;[^}]*font-size:14px;[^}]*color:var\(--muted\);/,'menu links are 14px grey on tighter rows');
  assert.match(css,/\.sps-footer \.sps-footer-call-number \{ color:var\(--red\);/,'the large number uses the existing brand red');
  assert.doesNotMatch(css,/\.sps-footer \.sps-footer-side \{[^}]*margin-top/,'the family-site box is not pushed up');
  assert.match(css,/\.sps-footer \.sps-footer-bottom \{ display:flex; align-items:flex-end;/,'it sits on the bottom line with the copyright');
});

function fixture({variant='',header={},scoped=false,reduced=false}={}){
  const events={},styles={},scrolled=[],focused=[];
  const note={original:true},inner={children:[],append(node){this.children.push(node);}};
  const top={addEventListener(type,fn){this[type]=fn;}};
  const host={attrs:{},renders:0,style:{setProperty:(key,value)=>styles[key]=value,removeProperty:key=>delete styles[key]},
    hasAttribute(key){return key in this.attrs;},setAttribute(key,value){this.attrs[key]=value;},
    querySelectorAll:()=>[note],querySelector:selector=>selector==='[data-footer-top]'?top:inner,
    set innerHTML(value){this.html=value;this.renders++;}};
  const values={'--surface-cool':'#f1f1f1','--body-size':'18px','--content-max':'1200px'};
  const doc={body:{dataset:{themeScope:scoped?'header':''}},documentElement:{dataset:{serviceMenu:variant}},
    getElementById:()=>({}),querySelectorAll:selector=>selector==='[data-sps-footer]'?[host]:[],
    querySelector:selector=>selector==='[data-sps-header]'?{dataset:header}:{focus:options=>focused.push(options)}};
  const win={document:doc,scrollTo:options=>scrolled.push(options),matchMedia:()=>({matches:reduced}),
    SPSThemeSchema:Object.keys(values).map(token=>({token})),
    getComputedStyle:()=>({getPropertyValue:key=>values[key]||''}),addEventListener:(name,fn)=>events[name]=fn};
  return {win,doc,host,inner,note,top,styles,values,events,scrolled,focused};
}

test('footer follows header destinations and renders only once while preserving reference note nodes',()=>{
  const h=fixture({variant:'v3'});
  assert.equal(routes(h.win).home,'jll-remix-v3.html');
  assert.equal(routes(h.win).about,'jll-remix-v3-about.html');
  mount(h.win);mount(h.win);
  assert.equal(h.host.renders,1);
  assert.deepEqual(h.inner.children,[h.note]);
  const custom=fixture({header:{homeHref:'jll-remix-main-v4.html',aboutHref:'jll-remix-about-v2.html'}});
  assert.deepEqual(routes(custom.win),{home:'jll-remix-main-v4.html',about:'jll-remix-about-v2.html',insights:'jll-remix-journal-v2.html',top:'#main'});
  assert.ok(markup({...routes(custom.win),home:'x" onfocus="bad'},2026).includes('x&quot; onfocus=&quot;bad'));
});

test('header-scoped About foundations stay synchronized without overriding other page themes',()=>{
  const h=fixture({scoped:true});mount(h.win);
  assert.equal(h.styles['--surface-cool'],'#f1f1f1');
  assert.equal(h.styles['--body-size'],'18px');
  h.values['--body-size']='20px';delete h.values['--surface-cool'];h.events['sps-theme-change']();
  assert.equal(h.styles['--body-size'],'20px');
  assert.equal(h.styles['--surface-cool'],undefined);
  const normal=fixture();mount(normal.win);assert.deepEqual(normal.styles,{});
});

test('back to top respects reduced motion, returns focus to the header and leaves modified links native',()=>{
  for(const reduced of [false,true]){
    const h=fixture({reduced});mount(h.win);
    let prevented=false;
    const event={button:0,preventDefault(){prevented=true;}};
    h.top.click({...event,ctrlKey:true});assert.equal(h.scrolled.length,0);
    h.top.click({...event,defaultPrevented:true});assert.equal(h.scrolled.length,0);
    h.top.click(event);
    assert.equal(prevented,true);
    assert.deepEqual(h.scrolled,[{top:0,behavior:reduced?'instant':'smooth'}]);
    assert.deepEqual(h.focused,[{preventScroll:true}]);
  }
});

test('the family-site menu closes on an outside click and on Escape, returning focus to its toggle',()=>{
  const docEvents={};const summary={focused:0,focus(){this.focused++;}};
  const family={open:true,events:{},addEventListener(n,fn){this.events[n]=fn;},contains:node=>node===summary,querySelector:()=>summary};
  const top={addEventListener(){}};
  const host={attrs:{},style:{},hasAttribute(k){return k in this.attrs;},setAttribute(k,v){this.attrs[k]=v;},querySelectorAll:()=>[],
    querySelector:sel=>sel==='[data-footer-family]'?family:sel==='[data-footer-top]'?top:{append(){}},set innerHTML(v){}};
  const doc={body:{dataset:{}},documentElement:{dataset:{}},getElementById:()=>({}),querySelectorAll:sel=>sel==='[data-sps-footer]'?[host]:[],querySelector:()=>null,addEventListener(n,fn){docEvents[n]=fn;}};
  mount({document:doc,matchMedia:()=>({matches:false}),scrollTo(){}});
  docEvents.click({target:summary});assert.equal(family.open,true,'clicks inside keep it open');
  docEvents.click({target:{}});assert.equal(family.open,false,'an outside click closes it');
  family.open=true;family.events.keydown({key:'Escape'});
  assert.equal(family.open,false);assert.equal(summary.focused,1,'Escape returns focus to the toggle');
});

test('footer V2 (먹색 띠 · 자료 카드): same destinations and company facts, one tel link, cards to real pages until PDFs exist, family sites inline in new tabs, no footer 맨 위로 when the page has its own',()=>{
  const {markupV2,resources}=require('../jll-remix-footer.js');
  const paths={home:'jll-remix-main-v4.html',about:'jll-remix-about.html',insights:'jll-remix-journal-v2.html',top:'#main'};
  const html=markupV2(paths,2026);
  assert.equal(markup(paths,2026,{variant:'2'}),html,'markup() hands variant 2 to markupV2');
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
    if(href.startsWith('#')||href.startsWith('tel:')||href.startsWith('https://'))continue;
    const url=new URL(href,'http://localhost/');const target=path.join(root,url.pathname.slice(1));
    assert.ok(fs.existsSync(target),href+' resolves');
    if(url.hash&&url.hash!=='#inquiry')assert.ok(fs.readFileSync(target,'utf8').includes('id="'+url.hash.slice(1)+'"'),href+' fragment resolves');
  }
  assert.equal((html.match(/href="tel:/g)||[]).length,1,'only the large number dials');
  assert.match(html,/<a class="sps-footer-v2-row sps-footer-v2-call" href="tel:0222475799"><span class="sps-footer-v2-label">대표전화<\/span><span class="sps-footer-v2-call-number">02-2247-5799<\/span><\/a>/);
  assert.match(html,/<dl class="sps-footer-v2-row sps-footer-v2-hours"><dt class="sps-footer-v2-label">상담 운영시간<\/dt><dd>평일 09:00 – 18:00<\/dd><dd>점심 12:00 – 13:00<\/dd><dd>주말·공휴일 휴무<\/dd><\/dl>/);
  assert.match(html,/class="sps-footer-v2-consult" href="jll-remix-support.html#inquiry" data-inquiry aria-haspopup="dialog"/);
  assert.match(html,/<img src="assets\/logo-on-film.svg" alt="SPS"/);assert.ok(fs.existsSync(path.join(root,'assets/logo-on-film.svg')));
  assert.deepEqual([...html.matchAll(/<a class="sps-footer-v2-card" data-resource="([^"]+)" href="([^"]+)" target="_top" data-soon aria-haspopup="dialog">/g)].map(m=>[m[1],m[2]]),[['profile','jll-remix-about.html'],['brochure','jll-remix.html#services']],'cards keep real pages as their link (new tab, no dialog) and open the 준비 중 window until the PDFs arrive');
  assert.deepEqual(resources.map(r=>r.action),['보기','보기']);
  assert.equal((html.match(/<svg class="sps-footer-v2-card-icon"/g)||[]).length,2,'line icons, not illustrations');
  assert.doesNotMatch(html,/data-footer-family|<details/,'no dropdown in V2');
  assert.deepEqual([...html.matchAll(/<a href="(https:[^"]+)" target="_blank" rel="noopener">([^<]+) /g)].map(m=>[m[2],m[1]]),[['신의알앤씨','https://shineui.kr'],['UNIT125','https://unit125.shineui.kr']]);
  assert.match(html,/주택임대관리업등록번호 동대문구-위탁관리형-주택임대관리업자-2/);assert.match(html,/© 2026 SPS/);
  assert.match(html,/<span class="sps-footer-v2-phone">대표전화 02-2247-5799<\/span>/,'bottom-row number is plain text');
  assert.match(html,/<a class="sps-footer-v2-top" href="#main" data-footer-top aria-label="맨 위로">/);
  assert.doesNotMatch(markupV2(paths,2026,{top:false}),/data-footer-top|맨 위로/);
  assert.doesNotMatch(html,/href="#"|javascript:|개인정보처리방침/);
  const css=fs.readFileSync(path.join(root,'jll-remix-footer.css'),'utf8');
  assert.match(css,/\.sps-footer:is\(\[data-variant="2"\], \[data-variant="3"\]\) \{[\s\S]*?background: ?var\(--ink\)/,'the dark band is --ink (V3 overrides it with the V1 ground)');
  assert.doesNotMatch(css.slice(css.indexOf('푸터 V2')),/#[0-9a-fA-F]{3,6}\b/,'no new colours in the V2 block');
  const ds=fs.readFileSync(path.join(root,'jll-remix-design-system.html'),'utf8');
  assert.match(ds,/<div class="sps-footer" data-sps-footer data-footer-preview data-footer-variant="2" data-footer-consult="contact">/,'the design system previews V2 too, with its consult button');
  assert.match(ds,/<div class="sps-footer" data-sps-footer data-footer-preview data-footer-variant="1" data-footer-consult="contact">/,'V1 stays V1 in the preview although the shared default is now V3');
  const src=fs.readFileSync(path.join(root,'jll-remix-footer.js'),'utf8');
  assert.match(src,/variant=asked==='1'\|\|asked==='2'\?asked:'3';/,'every page defaults to footer V3 (the V4 default)');
  assert.match(src,/consult=place==='contact'\|\|place==='statement'\?place:'none';/,'and to no consult button');
  const scale=fs.readFileSync(path.join(root,'jll-remix-main-v4-typescale.css'),'utf8');
  assert.match(scale,/\.sps-footer:is\(\[data-variant="2"\], \[data-variant="3"\]\) \.sps-footer-v2-statement \{ font-size: var\(--ts-h2\);/);
});

test('footer V3 = V1 ground + V2 parts + the V1 bottom row: statement | resource cards, contact | V1 vertical menu, then logo · business · family dropdown · 맨 위로',()=>{
  const F=require('../jll-remix-footer.js');
  const paths={home:'jll-remix-main-v4.html',about:'jll-remix-about.html',insights:'jll-remix-journal-v2.html',top:'#main'};
  const v3=F.markupV3(paths,2026);
  assert.equal(F.markup(paths,2026,{variant:'3'}),v3,'markup() hands variant 3 to markupV3');
  assert.match(v3,/<div class="sps-footer-inner">\s*<div class="sps-footer-v2-head">\s*<div class="sps-footer-v2-brand">[\s\S]*?<\/h2>\s*<\/div>\s*<nav class="sps-footer-v2-resources"[\s\S]*?<\/nav>\s*<\/div>\s*<div class="sps-footer-v2-body">\s*<div class="sps-footer-v2-reach">[\s\S]*?<\/div>\s*<nav class="sps-footer-nav" aria-label="하단 메뉴">[\s\S]*?<\/nav>\s*<\/div>\s*<div class="sps-footer-bottom">/,'head = statement | cards, body = contact | menu, then the V1 bottom row');
  assert.doesNotMatch(v3,/logo-on-film|sps-footer-v2-foot|>패밀리사이트<\/h3>/,'no white logo, no V2 foot, no family row (the V1 dropdown is in the bottom row)');
  assert.match(v3,/<h2 class="sps-footer-v2-statement">공간을 이해합니다\.<br>가능성을 연결합니다\.<\/h2>/);
  assert.equal((v3.match(/href="tel:/g)||[]).length,1,'only the large number dials');
  assert.equal((v3.match(/class="sps-footer-v2-card"/g)||[]).length,2,'회사소개서 · 브로슈어 cards');
  assert.match(v3,/<a class="sps-footer-v2-card" data-resource="profile"[^>]*>\s*<span class="sps-footer-v2-card-head"><strong class="sps-footer-v2-card-title">회사소개서<\/strong><svg[^]*?<\/svg><\/span>\s*<span class="sps-footer-v2-card-desc">회사 개요 및 등록·면허 자료<\/span>\s*<span class="sps-footer-v2-card-action">보기 <sps-arrow-up-right><\/sps-arrow-up-right><\/span>\s*<\/a>/,'three tiers: title · icon / description / 보기');
  assert.doesNotMatch(v3,/sps-footer-v2-eyebrow|sps-footer-v2-card-text/,'no English eyebrow tier in V3');
  // 파일 전에는 '준비 중' 창: 인사이트 빈 상태처럼 가운데 정렬한 제목 · 한 줄 설명 · 글 링크(iv2-empty-cta 와 같은 꼴), 테두리 없는 X
  const soon=F.soonMarkup(F.resources[0]);
  assert.match(soon,/^<button class="sps-footer-soon-close" type="button" data-soon-close aria-label="닫기"><svg [^>]*><path [^>]*\/><\/svg><\/button>\s*<p class="sps-footer-soon-kicker">준비 중<\/p>\s*<h3 id="sps-footer-soon-title" tabindex="-1" autofocus>회사소개서를 준비하고 있습니다\.<\/h3>\s*<p class="sps-footer-soon-text">지금은 SPS 소개에서 회사 개요와 등록·면허 자료를 확인해보세요\.<\/p>\s*<a class="sps-footer-soon-cta" href="jll-remix-about\.html" target="_top">SPS 소개 살펴보기<sps-arrow-up-right><\/sps-arrow-up-right><\/a>$/);
  assert.doesNotMatch(soon,/완성되면/,'no download promise line');
  assert.match(F.soonMarkup(F.resources[1]),/브로슈어를 준비하고 있습니다\.[^]*지금은 서비스 소개에서 세 가지 서비스를 살펴보세요\.[^]*href="jll-remix\.html#services"/);
  const src=fs.readFileSync(path.join(root,'jll-remix-footer.js'),'utf8');
  assert.match(src,/closest\?\.\('\[data-soon\]'\);\s*if\(!card\|\|event\.defaultPrevented\|\|event\.button!==0\|\|event\.metaKey\|\|event\.ctrlKey\|\|event\.shiftKey\|\|event\.altKey\)return;/,'modified clicks keep the native link');
  assert.match(src,/dialog\.className='dialog sps-footer-soon';/,'reuses the shared dialog frame');
  assert.match(F.markupV2(paths,2026),/<span class="sps-footer-v2-eyebrow" lang="en">Company Profile<\/span>/,'V2 keeps its four-tier cards');
  assert.deepEqual([...v3.matchAll(/<div class="sps-footer-group"><h3>([^<]+)<\/h3>/g)].map(m=>m[1]),['사업영역','SPS 알아보기','고객지원'],'V1 groups: a title with its links stacked under it');
  assert.doesNotMatch(v3,/sps-footer-v2-nav|sps-footer-v2-cells/,'no horizontal V2 menu rows');
  const v1=F.markup(paths,2026),nav=v1.slice(v1.indexOf('<nav class="sps-footer-nav"'),v1.indexOf('</nav>',v1.indexOf('<nav class="sps-footer-nav"'))+6);
  assert.ok(v3.includes(nav),'the menu is exactly V1');
  assert.ok(v3.includes(F.markup(paths,2026).slice(F.markup(paths,2026).indexOf('<div class="sps-footer-bottom">'))),'the bottom row is exactly V1');
  assert.match(v3,/<details class="sps-footer-family" data-footer-family>/);assert.match(v3,/<img src="assets\/logo\.svg" alt="SPS"/);assert.match(v3,/data-footer-top/);
  assert.doesNotMatch(F.markupV3(paths,2026,{top:false}),/data-footer-top/);
  // 상담 버튼 자리(모든 푸터): 기본 · 문장 아래 · 없음
  for(const variant of ['1','2','3']){
    const below=F.markup(paths,2026,{variant,consult:'statement'}),none=F.markup(paths,2026,{variant,consult:'none'});
    assert.equal((below.match(/data-inquiry/g)||[]).length,1,'one button when moved ('+variant+')');
    assert.match(below,variant==='1'?/<div class="sps-footer-lead" data-consult="statement">\s*<h2[^]*?<\/h2>\s*<a class="sps-footer-consult"/:/<h2 class="sps-footer-v2-statement">[^]*?<\/h2>\s*<a class="sps-footer-v2-consult"/,'right under the statement ('+variant+')');
    assert.doesNotMatch(none,/data-inquiry|footer-v2-consult|sps-footer-consult/,'no button ('+variant+')');
  }
  // V1 · V2 는 조각으로 나눴어도 그대로
  assert.match(F.markupV2(paths,2026),/logo-on-film[\s\S]*>패밀리사이트<\/h3>[\s\S]*sps-footer-v2-foot/,'V2 keeps its logo, family row and foot');
  assert.match(F.markup(paths,2026),/<div class="sps-footer-lead">[\s\S]*<div class="sps-footer-bottom">/,'V1 unchanged');
  const css=fs.readFileSync(path.join(root,'jll-remix-footer.css'),'utf8');
  assert.match(css,/\.sps-footer:is\(\[data-variant="2"\], \[data-variant="3"\]\) \.sps-footer-v2-head/,'V3 reuses the V2 layout rules');
  assert.doesNotMatch(css,/\.sps-footer\[data-variant="2"\] /,'no V2-only layout rule left behind');
  assert.match(css,/\.sps-footer\[data-variant="3"\] \{[^}]*--fv2-text: var\(--ink\);[^}]*--fv2-rule: var\(--line\);[^}]*--fv2-paper: var\(--surface\);[^}]*background: var\(--surface-cool\); color: var\(--ink\);/,'V1 colours on the V2 layout');
  assert.match(css,/\.sps-footer\[data-variant="3"\] \.sps-footer-v2-call-number \{ color: var\(--red\); font-weight: 700; \}/,'the phone is the brand red, set bold');
  const tokens=fs.readFileSync(path.join(root,'jll-remix-tokens.css'),'utf8'),logo=fs.readFileSync(path.join(root,'assets/logo.svg'),'utf8');
  assert.doesNotMatch(tokens+css,/--logo-red/,'the vermilion logo red is not used for the phone');void logo;
  assert.match(fs.readFileSync(path.join(root,'jll-remix-main-v4-typescale.css'),'utf8'),/html:not\(\[data-typescale="0"\]\) \.sps-footer\[data-variant="3"\] \.sps-footer-v2-call-number \{ font-weight: 700; \}/,'the type scale keeps the V3 phone bold');
  assert.match(css,/\.sps-footer\[data-variant="3"\] :is\(\.sps-footer-v2-head, \.sps-footer-v2-body\) \{ grid-template-columns: minmax\(0, 1fr\) var\(--fv3-side\); \}/,'cards and menu share one right column, so their edges line up');
  assert.match(css,/\.sps-footer\[data-variant="3"\] \.sps-footer-nav \{ width: 100%; margin-left: 0; justify-content: space-between; \}/,'the menu groups spread across that column');
  assert.match(css,/\.sps-footer\[data-variant="3"\] \.sps-footer-v2-card \{ min-height: 88px; grid-template-areas: "icon title action" "icon desc action"; \}/,'the narrow row card has no eyebrow slot');
  assert.match(css,/\.sps-footer\[data-variant="3"\] \.sps-footer-v2-card \{ min-height: 0; border-radius: var\(--radius-control\); \}/,'card corners match the 문의하기 button');
  assert.match(css,/\.sps-footer\[data-variant="3"\] \.sps-footer-v2-call:is\(:hover, :focus-visible\) \.sps-footer-v2-call-number \{ text-decoration: none; \}/,'no underline on the phone number');
  assert.doesNotMatch(css,/line-height: 36px/,'hours keep their own V2 rhythm (aligning them to the menu rows looked off, reverted 2026-10-21)');
  assert.match(css,/\.sps-footer-soon \{ width: min\(520px, calc\(100% - 32px\)\); text-align: center; \}/,'centred 준비 중 window');
  assert.match(css,/\.sps-footer-soon \.sps-footer-soon-close \{ position: absolute; top: 12px; right: 12px;[^}]*border: 0;/,'borderless X, 12px from the corner');
  assert.match(css,/\.sps-footer-soon \.sps-footer-soon-cta \{ position: relative; display: flex; align-items: center; justify-content: center; width: max-content;[^}]*padding: 0 calc\(1em \+ 12px\);/,'the link matches the empty-state CTA');
  assert.doesNotMatch(css.slice(css.indexOf('푸터 V3')),/#[0-9a-f]{3,6}\b/i,'no new colours');
  const ds=fs.readFileSync(path.join(root,'jll-remix-design-system.html'),'utf8');assert.match(ds,/data-footer-preview data-footer-variant="3"/);
});

test('footer parts reveal on scroll: bands draw their top rule, items rise in order, the statement unveils; off for reduced motion and previews',()=>{
  const src=fs.readFileSync(path.join(root,'jll-remix-footer.js'),'utf8'),css=fs.readFileSync(path.join(root,'jll-remix-footer.css'),'utf8');
  assert.match(src,/if\(host\.hasAttribute\('data-footer-preview'\)\|\|typeof win\.IntersectionObserver!=='function'\|\|win\.matchMedia\?\.\('\(prefers-reduced-motion: reduce\)'\)\.matches\)return;/,'no motion without the observer, under reduced motion, or in previews');
  assert.match(src,/host\.setAttribute\('data-footer-motion',''\);/,'content stays visible unless motion is set up');
  assert.match(src,/host\.addEventListener\('focusin',\(\)=>bands\.forEach\(show\),\{once:true\}\);/,'keyboard users never land on hidden links');
  assert.match(src,/revealOnScroll\(win,host\);/);
  assert.match(css,/\.sps-footer\[data-footer-motion\] \[data-footer-item\] \{ opacity: 0; transform: translateY\(28px\);[^}]*transition-delay: calc\(\.12s \+ var\(--fi, 0\) \* \.07s\); \}/,'staggered rise');
  assert.match(css,/\.sps-footer\[data-footer-motion\] \[data-footer-rule\]::before \{[^}]*transform: scaleX\(0\); transform-origin: left center;/,'rules draw from the left');
  assert.match(css,/@media \(prefers-reduced-motion: reduce\) \{\s*\.sps-footer\[data-footer-motion\] \[data-footer-item\] \{ opacity: 1; transform: none; clip-path: none; transition: none; \}/);
});
