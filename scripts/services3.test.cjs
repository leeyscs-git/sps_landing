const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=f=>fs.readFileSync(require.resolve('../'+f),'utf8').replace(/\r\n?/g,'\n');

test('서비스 V3 carries the original page\'s alternating image/copy rows for the three services, wired to the detail dialog',()=>{
  const html=read('jll-remix-main-v4.html');
  const section=(html.match(/<section class="hw-services3"[\s\S]*?<\/section>/)||[''])[0];
  assert.ok(section,'section present');
  assert.match(html,/href="#hw-services3"><span class="main-v4-nav-label">사업영역 V3<\/span>/);
  assert.match(html,/jll-remix-services3\.css\?v=/);
  assert.ok(html.indexOf('id="hw-services2"')<html.indexOf('id="hw-services3"'),'V3 sits after V2');
  assert.doesNotMatch(section,/hw-services3-label/,'no "01 / PROPERTY MANAGEMENT" chips on the photos');
  assert.doesNotMatch(section,/일상의 운영부터 자산의 미래까지/,'the side description is left out');
  const names=[...section.matchAll(/<p class="hw-services3-eyebrow"[^>]*>([^<]+)<\/p>/g)].map(m=>m[1]);
  assert.deepEqual(names,['부동산 자산관리','임대 마케팅','실내건축'],'시설관리 row removed');
  const keys=[...section.matchAll(/data-detail="([a-z]+)"/g)].map(m=>m[1]);
  assert.deepEqual(keys,['management','marketing','interior']);
  const details=read('jll-remix.js');
  keys.forEach(key=>assert.match(details,new RegExp('^  '+key+': \\{','m'),key+' has detail-dialog content'));
  assert.equal((section.match(/<article class="hw-services3-row"[^>]*>/g)||[]).length,3);
  assert.equal((section.match(/data-reveal/g)||[]).length,1+1+3*4,'intro, the shortcut list, three rows and three copy lines (eyebrow, title, link) per row reveal on scroll');
  assert.doesNotMatch(section,/hw-services3-tags|<p data-reveal style="--order:2">/,'descriptions and tags are left out: only the emphasis stays');
  assert.equal((section.match(/<article class="hw-services3-row" id="hw-services3-[a-z]+" data-reveal>/g)||[]).length,3,'rows are observed');
  assert.doesNotMatch(section,/hw-services3-image" data-reveal/,'the clipped photo itself is never the observed target: clip-path hides it from IntersectionObserver');
  assert.doesNotMatch(section,/alt=""/,'photos carry descriptions like the original rows');
  assert.equal((section.match(/<span class="hw-services3-line"><span>/g)||[]).length,3,'the intro statement is three ink lines');
  assert.match(html,/jll-remix-services3\.js\?v=/);
  assert.doesNotMatch(section,/class="hw-kicker"/,'no arrowed kicker chip above the title');
  assert.match(section,/<p class="hw-services3-kicker">사업영역<\/p>\n\s*<h2 id="hw-services3-title">/,'a Korean label without an arrow sits above the statement');
  assert.match(html,/<section class="hw-with wrap" id="hw-with" aria-label="더 알아보기">\n  <div class="hw-with-grid">/,'the 더 알아보기 section has no label chip either, but keeps its accessible name');
});

test('the stylesheet alternates rows, slides copy in from the left, wipes photos upward, and uses only tokens',()=>{
  const css=read('jll-remix-services3.css');
  assert.match(css,/\.hw-services3-row:nth-of-type\(even\) \.hw-services3-image \{ order: 2; \}/);
  assert.match(css,/\.hw-services3-copy \[data-reveal\] \{[^}]*transform: translateX\(-28px\)/,'copy slides in from the left');
  assert.match(css,/\.hw-services3-row\[data-reveal\] \.hw-services3-image \{[^}]*clip-path: inset\(100% 0 0 0\)/,'photo is wiped from the bottom');
  assert.match(css,/\.hw-services3-row\[data-reveal\] \.hw-services3-image > img \{ translate: 0 6%; \}/,'and rises while it is revealed');
  assert.match(css,/\.hw-services3-row\[data-reveal\]\.is-revealed \.hw-services3-image \{ clip-path: inset\(0\); \}/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css,/@media \(max-width: 850px\) \{[\s\S]*grid-template-columns: 1fr;/);
  assert.doesNotMatch(css,/#[0-9a-fA-F]{3,8}\b/,'no new hex colours');
  for(const token of ['--surface-cool','--muted','--red','--ts-h2','--line'])assert.ok(css.includes('var('+token),token+' used');
  assert.doesNotMatch(css,/--peach|--surface-sage/,'rows share one calm ground');
  assert.match(css,/\.hw-services3 \.hw-services3-kicker \{[^}]*font-size: var\(--ts-meta, 14px\); font-weight: var\(--ts-w-label, 500\);[^}]*color: var\(--red\);/,'the label matches the red row eyebrows below');
  assert.match(css,/\.hw-services3-intro \{[^}]*min-height: max\(480px, calc\(var\(--hw-stage-live, calc\(100svh - var\(--sps-header-height, 137px\)\)\) \* \.84\)\)/,'the intro takes most of the visible screen, a little short so the first row shows sooner');
  assert.match(css,/\.hw-services3-intro h2 \{[^}]*font-size: clamp\(36px, 3\.4vw, var\(--ts-display, 56px\)\)/,'statement on the display step');
  assert.match(css,/\.hw-services3-line > span \{[^}]*background-clip: text/,'ink fills each title line');
});

test('the original page reveals its editorial rows the same way: copy from the left, photo wiped upward',()=>{
  const css=read('jll-remix-motion.css');
  assert.match(css,/\.editorial-copy>\[data-reveal\]:not\(\.is-revealed\)\{transform:translate3d\(-28px,0,0\)\}/);
  assert.match(css,/\.editorial-image\[data-reveal\]:not\(\.is-revealed\)\{clip-path:inset\(100% 0 0 0\)/);
  assert.doesNotMatch(css,/inset\(0 100% 0 0\)|inset\(0 0 0 100%\)/,'the old left/right wipes are gone');
  assert.match(css,/:not\(\.is-revealed\)>img\{translate:0 6%\}/);
  const page=read('jll-remix.html');
  assert.match(page,/jll-remix-motion\.css\?v=reveal-up1/);
});

test('the intro title lines fill with ink as they rise into view, at the About page rhythm, and are solid under reduced motion',()=>{
  const api=require('../jll-remix-services3.js');
  assert.equal(api.inkFor(0,800,2000),0);
  assert.equal(api.inkFor(2000-800*.9,800,2000),0,'starts when the line top reaches 90% of the viewport');
  assert.ok(Math.abs(api.inkFor(2000-800*.9+800*.15,800,2000)-.5)<1e-9,'half way after 15% of the viewport');
  assert.equal(api.inkFor(2000-800*.6,800,2000),1,'full by the 60% mark, so a statement resting mid-screen is fully inked');
  const fixture=reduced=>{
    const line=top=>{const el={vars:{},getBoundingClientRect(){return {top:top-win.scrollY};}};el.style={setProperty(k,v){el.vars[k]=v;}};return el;};
    const lines=[line(1500),line(1560)];
    const raf=[];const win={scrollY:0,innerHeight:800,document:{querySelectorAll:sel=>sel==='.hw-services3-line'?lines:[]},matchMedia:()=>({matches:reduced,addEventListener(){}}),addEventListener(){},requestAnimationFrame(fn){raf.push(fn);return raf.length;}};
    const handle=api.start(win);return {handle,lines,win,flush(){while(raf.length)raf.shift()();}};
  };
  const h=fixture(false);
  assert.equal(h.lines[0].vars['--ink-progress'],'0.00%');assert.equal(h.lines[0].vars['--ink-shift'],'22.00px');
  h.win.scrollY=1500-800*.9+800*.15;h.handle.paint();
  assert.equal(h.lines[0].vars['--ink-progress'],'50.00%');assert.equal(h.lines[0].vars['--ink-shift'],'11.00px');
  assert.ok(parseFloat(h.lines[1].vars['--ink-progress'])<50,'the second line lags the first');
  const r=fixture(true);
  assert.equal(r.lines[0].vars['--ink-progress'],'100.00%');assert.equal(r.lines[0].vars['--ink-shift'],'0.00px');
  assert.equal(api.start({document:{querySelectorAll:()=>[]}}),null);
});

test('rows keep one gray ground, the eyebrow has room above the title, and the link arrow is ink, not red',()=>{
  const css=read('jll-remix-services3.css');
  assert.doesNotMatch(css,/data-services3-bg/,'no white-ground option');
  assert.match(css,/\.hw-services3 \.hw-services3-eyebrow \{ margin: 0 0 var\(--space-stack-label, 16px\);/,'eyebrow → title uses the fixed stack token');
  assert.match(css,/\.hw-services3-link \{[^}]*margin-top: var\(--space-stack-action, 28px\);/,'title → link uses the fixed stack token');
  assert.match(css,/\.hw-services3-link sps-arrow-up-right \{ font-size: 20px; color: inherit;/,'the link arrow follows the text colour');
});

test('the intro is no longer a lone statement: a three-line service index sits at the right on the last line, each jumping to its row',()=>{
  const html=fs.readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8').replace(/\r\n?/g,'\n');
  const section=html.slice(html.indexOf('<section class="hw-services3"'),html.indexOf('</section>',html.indexOf('<section class="hw-services3"')));
  assert.match(section,/<div class="hw-services3-intro wrap" data-reveal>\s*<div class="hw-services3-statement">[\s\S]*?<\/h2>\s*<\/div>\s*<div class="hw-services3-aside">\s*<ul class="hw-services3-index" aria-label="서비스 바로가기" data-reveal>/,'statement left, the index alone on the right');
  assert.doesNotMatch(section,/hw-services3-lead/,'no lead sentence');
  const items=[...section.matchAll(/<li style="--i:(\d)"><a href="#(hw-services3-[a-z]+)">([^<]+) <sps-arrow-up-right><\/sps-arrow-up-right><\/a><\/li>/g)];
  assert.deepEqual(items.map(m=>Number(m[1])),[0,1,2],'each entry carries its stagger index');
  const links=items.map(m=>[m[2],m[3]]);
  assert.deepEqual(links,[['hw-services3-management','부동산 자산관리'],['hw-services3-marketing','임대 마케팅'],['hw-services3-interior','실내건축']]);
  for(const [id] of links)assert.match(section,new RegExp('<article class="hw-services3-row" id="'+id+'" data-reveal>'),id+' exists');
  assert.match(section,/<ul class="hw-services3-index" aria-label="서비스 바로가기" data-reveal>/,'the list reveals on scroll');
  const css=fs.readFileSync(require.resolve('../jll-remix-services3.css'),'utf8');
  assert.match(css,/\.hw-services3-intro \{[^}]*display: grid; grid-template-columns: minmax\(0, 1fr\) minmax\(260px, 360px\);[^}]*align-items: end;/,'two columns, aside on the last line');
  assert.match(css,/\.hw-services3-index::before, \.hw-services3-index li::after \{[^}]*height: 1px; background: var\(--line\); transform-origin: left center; \}/,'thin rules between the three entries, drawn from the left');
  assert.match(css,/\.hw-motion \.hw-services3-index\[data-reveal\]::before, \.hw-motion \.hw-services3-index\[data-reveal\] li::after \{ transform: scaleX\(0\); transition: transform 1s var\(--hw-ease\) calc\(var\(--i, 0\) \* 110ms \+ 150ms\); \}/,'rules draw in, staggered');
  assert.match(css,/\.hw-motion \.hw-services3-index\[data-reveal\] li > a \{ opacity: 0; transform: translateY\(16px\);[^}]*calc\(var\(--i, 0\) \* 110ms \+ 250ms\)/,'names rise in after their rule');
  assert.match(css,/\.hw-motion \.hw-services3-index\[data-reveal\]\.is-revealed li > a \{ opacity: 1; transform: none; \}/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.hw-motion \.hw-services3-index\[data-reveal\] li > a \{ opacity: 1; transform: none; transition: none; \}/,'shown at once under reduced motion');
  assert.match(css,/\.hw-services3-index a \{[^}]*min-height: 56px;/,'comfortable tap rows');
  assert.match(css,/\.hw-services3-index sps-arrow-up-right \{[^}]*color: var\(--muted\); transform: rotate\(90deg\);/,'a quiet down-right arrow, not red');
  assert.doesNotMatch(css.slice(css.indexOf('.hw-services3-statement'),css.indexOf('/* 행:')).replace(/\.hw-services3 \.hw-services3-kicker \{[^}]*\}/,''),/var\(--red\)|#[0-9a-f]{3,6}\b/i,'no new colour in the intro, and red only on the label');
  assert.match(css,/@media \(max-width: 850px\) \{[\s\S]*\.hw-services3-intro \{[^}]*grid-template-columns: 1fr; row-gap: 48px; \}/,'stacks on small screens');
  assert.match(fs.readFileSync(require.resolve('../jll-remix-hanwha.js'),'utf8'),/closest\('a\[href\^="#hw-"\]'\)/,'the shared smooth scroll handles the #hw- jump links');
});

test('rows line their copy up with the page rail (logo and intro edge) and drift their photos gently with the scroll',()=>{
  const css=fs.readFileSync(require.resolve('../jll-remix-services3.css'),'utf8');
  assert.match(css,/\.hw-services3-row \{ container-type: inline-size; --rail: max\(var\(--layout-gutter, 72px\), calc\(\(100cqw - var\(--content-max, 1320px\)\) \/ 2\)\); \}/,'the rail is the same expression the page uses for its content edge, measured on the full-width row');
  assert.match(css,/\.hw-services3-copy \{[^}]*padding: clamp\(40px, 5vh, 64px\) var\(--rail\) clamp\(40px, 5vh, 64px\) clamp\(48px, 6vw, 112px\);/,'copy on the right ends at the rail');
  assert.match(css,/\.hw-services3-row \{ display: grid; grid-template-columns: 1fr 1fr; min-height: clamp\(320px, 42vh, 420px\);/,'rows are only as tall as their copy needs');
  assert.match(css,/\.hw-services3-row:nth-of-type\(even\) \.hw-services3-copy \{ padding-inline: var\(--rail\) clamp\(48px, 6vw, 112px\); \}/,'copy on the left starts at the rail');
  assert.match(css,/@media \(max-width: 850px\) \{[\s\S]*\.hw-services3-copy, :where\(html:not\(\[data-sps-desktop\]\)\) \.hw-services3-row:nth-of-type\(even\) \.hw-services3-copy \{ padding: 32px var\(--rail\) 40px; \}/,'stacked rows keep the rail too');
  const api=require('../jll-remix-services3.js');
  assert.equal(api.driftFor(0,800,400-50,100),50,'centred row: photo centred');
  assert.equal(api.driftFor(0,800,5000,100),50-api.DRIFT,'row below the screen: photo shown from higher up');
  assert.equal(api.driftFor(5000,800,0,100),50+api.DRIFT,'row above the screen: photo shown from lower down');
  let prev=-Infinity;for(let y=0;y<=2000;y+=50){const v=api.driftFor(y,800,1000,400);assert.ok(v>=prev-1e-9,'drifts one way as you scroll');prev=v;}
  // 런타임: 사진마다 object-position 을 쓰고, 움직임 줄임에서는 비운다
  const fixture=reduced=>{
    const mk=top=>{const el={style:{},getBoundingClientRect(){return {top:top-win.scrollY,height:100};}};return el;};
    const line={style:{setProperty(){}},getBoundingClientRect(){return {top:0};}};
    const imgs=[1000,2000].map(t=>({style:{},parentElement:mk(t)}));
    const win={scrollY:0,innerHeight:800,document:{querySelectorAll:sel=>sel==='.hw-services3-line'?[line]:sel==='.hw-services3-image > img'?imgs:[]},matchMedia:()=>({matches:reduced,addEventListener(){}}),addEventListener(){},requestAnimationFrame(fn){return 1;}};
    api.start(win);return imgs;
  };
  const imgs=fixture(false);assert.equal(imgs[0].style.objectPosition,'50% '+api.driftFor(0,800,1000,100).toFixed(2)+'%');
  assert.equal(fixture(true)[0].style.objectPosition,'','no drift under reduced motion');
});
