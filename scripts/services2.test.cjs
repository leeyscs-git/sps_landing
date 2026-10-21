const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=require('../jll-remix-services2.js');
const read=f=>fs.readFileSync(require.resolve('../'+f),'utf8').replace(/\r\n?/g,'\n');

test('the main page carries three photo cards in service-menu order, each opening the service detail in place (with a deep-link fallback)',()=>{
  const html=read('jll-remix-main-v4.html');
  const section=(html.match(/<section class="hw-services2"[\s\S]*?<\/section>/)||[''])[0];
  assert.ok(section,'section present');
  assert.match(html,/href="#hw-services2"><span class="main-v4-nav-label">사업영역 V2<\/span>/);
  assert.match(html,/jll-remix-services2\.css\?v=/);assert.match(html,/jll-remix-services2\.js\?v=/);
  const names=[...section.matchAll(/<span class="hw-services2-name">([^<]+)<\/span>/g)].map(m=>m[1]);
  assert.deepEqual(names,['부동산 자산관리','임대 마케팅','실내건축'],'시설관리 is folded into 자산관리 and left out');
  const cards=[...section.matchAll(/<a class="hw-services2-card"[^>]*href="jll-remix-main-v4\.html\?service=([a-z]+)#hw-business" data-detail="\1"/g)].map(m=>m[1]);
  assert.equal(cards.length,3);
  const accepted=read('jll-remix.js').match(/\[('[a-z]+'(?:, '[a-z]+')*)\]\.includes\(requestedService\)/)[1].replace(/'/g,'').split(', ');
  cards.forEach(key=>assert.ok(accepted.includes(key),key+' opens a service detail'));
  assert.equal((section.match(/<img class="hw-services2-photo"[^>]*loading="lazy"/g)||[]).length,3,'every card has a lazy photo');
  assert.equal((section.match(/hw-services2-more/g)||[]).length,3,'every card carries the 자세히 보기 line');
  assert.match(section,/<div class="hw-services2-cards">/,'the card row sits outside .wrap');
  const css2=read('jll-remix-services2.css');
  assert.match(css2,/\.hw-services2 \{ --services2-gutter: clamp\(24px, 2\.5vw, 48px\);/,'a narrow side gutter for the card row');
  assert.doesNotMatch(css2,/\.hw-services2-heading \{[^}]*padding-inline/,'the heading stays inside .wrap');
  assert.match(css2,/\.hw-services2-cards \{[^}]*padding-inline: var\(--services2-gutter\)/);
  assert.match(section,/<div class="hw-services2-heading wrap">/);
  assert.doesNotMatch(section,/hw-services2-(stage|strip|item|media)/,'the old stage + strip markup is gone');
});

test('the stylesheet widens the hovered or focused card to 1.8 shares, stacks cards on small screens and uses no new colours',()=>{
  const css=read('jll-remix-services2.css');
  assert.match(css,/\.hw-services2-card \{[^}]*flex: 1 1 0;/);
  assert.match(css,/\.hw-services2-card:is\(:hover, :focus-visible\) \{[^}]*flex-grow: 1\.8;/);
  assert.match(css,/\.hw-services2-card \{[^}]*transition:[^}]*flex-grow/);
  assert.match(css,/@media \(max-width: 850px\) \{[\s\S]*\.hw-services2-cards \{ flex-direction: column;/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*opacity: 1; transform: none;/);
  assert.match(css,/\.hw-services2-card \{[^}]*background: var\(--ink\)/,'a dark ground sits behind the lazy photo');
  assert.doesNotMatch(css,/@keyframes|animation:/,'the entrance is a transition from the hidden state, so it cannot replay');
  assert.match(css,/@media \(hover: none\)/,'touch devices do not expand on tap');
  assert.doesNotMatch(css,/#[0-9a-fA-F]{3,8}\b/,'no new hex colours: only tokens');
  assert.match(css,/border-radius: var\(--radius-media/,'cards use the photo radius token');
});

test('cards reveal once when the section scrolls into view, and immediately without IntersectionObserver',()=>{
  const fixture=(withObserver=true)=>{
    const cards={classes:new Set(),classList:{add(c){cards.classes.add(c);}}};
    const section={querySelector:sel=>sel==='.hw-services2-cards'?cards:null};
    let cb=null,disconnected=0;
    const win={document:{querySelector:sel=>sel==='.hw-services2'?section:null}};
    if(withObserver)win.IntersectionObserver=class{constructor(fn){cb=fn;}observe(){}disconnect(){disconnected++;}};
    const handle=api.start(win);
    return {handle,cards,fire:on=>cb&&cb([{isIntersecting:on}]),disconnected:()=>disconnected};
  };
  const h=fixture();
  assert.ok(!h.cards.classes.has('is-revealed'));
  h.fire(false);assert.ok(!h.cards.classes.has('is-revealed'),'off-screen does not reveal');
  h.fire(true);assert.ok(h.cards.classes.has('is-revealed'));assert.equal(h.disconnected(),1,'observer stops after the reveal');
  assert.ok(h.handle.revealed);
  const plain=fixture(false);
  assert.ok(plain.cards.classes.has('is-revealed'),'no observer: revealed right away');
  assert.equal(api.start({document:{querySelector:()=>null}}),null,'pages without the section are untouched');
});
