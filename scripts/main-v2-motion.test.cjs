const test=require('node:test');
const assert=require('node:assert/strict');
const {canonicalHash,start,overlayHeader,navigationOverlap}=require('../jll-remix-main-v2.js');
const {href}=require('../jll-remix-main-switcher.js');
test('A/B/C switches between original, V2 and V4 while the old D alias remains usable',()=>{
  for(const [original,reference] of [['#main','#hw-intro'],['#about','#hw-vision'],['#services','#hw-business'],['#insights','#hw-news'],['#spaces','#hw-future'],['#contact','#hw-footer']]){
    assert.equal(href('b','',original),'jll-remix-main-v2.html'+reference);
    assert.equal(href('c','',original),'jll-remix-main-v4.html'+reference);
    assert.equal(href('c','',reference),'jll-remix-main-v4.html'+reference);
    assert.equal(href('d','',original),'jll-remix-main-v4.html'+reference);
    assert.equal(href('d','',reference),'jll-remix-main-v4.html'+reference);
    assert.equal(href('a','',reference),'jll-remix.html'+original);
    assert.equal(canonicalHash(original),reference);
  }
});
test('comparison preserves layout but not unrelated article or service state',()=>{
  assert.equal(href('b','?layout=desktop&article=old&service=leasing','#services'),'jll-remix-main-v2.html?layout=desktop#hw-business');
  assert.equal(href('a','?layout=responsive','#hw-footer'),'jll-remix.html?layout=responsive#contact');
  assert.equal(href('b','?embed=1','#unknown'),'jll-remix-main-v2.html#hw-intro');
  assert.equal(href('c','?layout=desktop&article=old','#hw-vision'),'jll-remix-main-v4.html?layout=desktop#hw-vision');
  assert.equal(href('d','?layout=desktop&article=old','#hw-vision'),'jll-remix-main-v4.html?layout=desktop#hw-vision');
  assert.equal(href('c','?layout=desktop&vision=v2','#hw-vision'),'jll-remix-main-v4.html?layout=desktop#hw-vision');
  assert.equal(href('c','?vision=v4','#hw-vision'),'jll-remix-main-v4.html#hw-vision');
  assert.equal(href('b','?vision=v2','#hw-vision'),'jll-remix-main-v2.html#hw-vision');
});
test('old main URLs keep query state when normalizing the initial scroll target',()=>{
  const changes=[];
  const state={returnUrl:'kept'};
  const win={location:{pathname:'/jll-remix-main-v2.html',search:'?service=management&layout=desktop',hash:'#services'},history:{state,replaceState(...args){changes.push(args);}}};
  start(win);
  assert.deepEqual(changes,[[state,'','/jll-remix-main-v2.html?service=management&layout=desktop#hw-business']]);
  win.location.hash='#hw-future';start(win);
  assert.equal(changes.length,1);
});

function headerFixture(scale=1,navigationOnly=false){
  const events={},queue=[],values={};
  let menu=false,film=false,heroBottom=764*scale,headerBottom=137*scale,mutation,resize;
  let navHeight=49;
  const nav={getBoundingClientRect:()=>({top:headerBottom-(navHeight+1)*scale,height:navHeight*scale})};
  const header={offsetWidth:1230,querySelector:selector=>selector==='.nav'?nav:menu?{}:null,getBoundingClientRect:()=>({bottom:headerBottom,width:1230*scale}),classList:{toggle(name,value){film=value;}}};
  const hero={getBoundingClientRect:()=>({bottom:heroBottom})};
  const win={
    document:{body:{hasAttribute:name=>name==='data-overlay-header',dataset:{overlayHeader:navigationOnly?'navigation':''},style:{setProperty(name,value){values[name]=value;}}},querySelector:selector=>selector==='[data-sps-header]'?header:hero},
    requestAnimationFrame:callback=>{queue.push(callback);return queue.length;},
    addEventListener:(name,callback)=>events[name]=callback,
    ResizeObserver:class{constructor(callback){resize=callback;}observe(){}},
    MutationObserver:class{constructor(callback){mutation=callback;}observe(){}}
  };
  overlayHeader(win);
  const flush=()=>{while(queue.length)queue.shift()();};
  return {values,get film(){return film;},
    scroll(bottom){heroBottom=bottom*scale;events.scroll();flush();},
    open(value){menu=value;mutation();flush();},
    headerHeight(value){headerBottom=value*scale;resize();flush();},
    navHeight(value){navHeight=value;resize();flush();},
    restore(bottom){heroBottom=bottom*scale;events.pageshow();flush();}
  };
}

test('transparent film header restores its solid surface for menus and later sections',()=>{
  const h=headerFixture();
  assert.equal(h.film,true);
  h.open(true);assert.equal(h.film,false);
  h.open(false);assert.equal(h.film,true);
  h.scroll(137);assert.equal(h.film,false);
  h.scroll(-200);assert.equal(h.film,false);
  h.scroll(500);assert.equal(h.film,true);
});

test('header contrast follows resized and scaled boundaries plus history restoration',()=>{
  for(const scale of [1,.4]){
    const h=headerFixture(scale);
    h.scroll(150);assert.equal(h.film,true);
    h.headerHeight(170);assert.equal(h.film,false);
    h.headerHeight(137);assert.equal(h.film,true);
    h.restore(-200);assert.equal(h.film,false);
    h.restore(764);assert.equal(h.film,true);
  }
});

test('V3 overlaps only the navigation row, preserves top padding, and stays white when mobile navigation is hidden',()=>{
  for(const scale of [1,.4]){
    const h=headerFixture(scale,true);
    assert.equal(h.values['--main-nav-overlap'],'50px');
    assert.equal(h.film,true);
    h.headerHeight(153);
    assert.equal(h.values['--main-nav-overlap'],'50px');
    h.open(true);assert.equal(h.film,false);
    h.open(false);assert.equal(h.film,true);
    h.navHeight(0);
    assert.equal(h.values['--main-nav-overlap'],'0px');
    assert.equal(h.film,false);
    h.navHeight(49);
    assert.equal(h.values['--main-nav-overlap'],'50px');
    assert.equal(h.film,true);
  }
  assert.equal(navigationOverlap({bottom:137},null),0);
});

test('V4 keeps shared section routing without installing transparent-header behavior',()=>{
  const changes=[];
  const win={
    document:{body:{hasAttribute:()=>false},querySelector(){assert.fail('Solid header must not be managed by the overlay controller');}},
    addEventListener(){assert.fail('Solid header must not install overlay scroll handlers');},
    location:{pathname:'/jll-remix-main-v4.html',search:'?layout=responsive',hash:'#services'},
    history:{state:{},replaceState(...args){changes.push(args);}}
  };
  start(win);
  assert.equal(changes[0][2],'/jll-remix-main-v4.html?layout=responsive#hw-business');
});

// 폰 헤더와 같은 조건: 850 이하, 또는 눕힌 폰(851~1000 × 500 이하 터치 화면)
const PHONE_QUERY='(max-width: 850px), (max-width: 1000px) and (max-height: 500px) and (pointer: coarse)';
test('on phones the film header paints its surface once the hero headline reaches it, not at the hero bottom',()=>{
  const events={},queue=[];let film=null,copyTop=520,heroBottom=812,desktop=false,phone=true;
  const header={querySelector:()=>null,getBoundingClientRect:()=>({bottom:76}),classList:{toggle(name,value){film=value;}}};
  const copy={getBoundingClientRect:()=>({top:copyTop})};
  const hero={querySelector:selector=>selector==='.hw-hero-copy'?copy:null,getBoundingClientRect:()=>({bottom:heroBottom})};
  const win={matchMedia:query=>({get matches(){return query===PHONE_QUERY&&phone;}}),   // 살아 있는 MediaQueryList 처럼
    document:{documentElement:{hasAttribute:name=>name==='data-sps-desktop'&&desktop},body:{hasAttribute:name=>name==='data-overlay-header',dataset:{overlayHeader:''}},querySelector:selector=>selector==='[data-sps-header]'?header:hero},
    requestAnimationFrame:callback=>{queue.push(callback);return queue.length;},addEventListener:(name,callback)=>events[name]=callback};
  overlayHeader(win);
  const scroll=(top,bottom)=>{copyTop=top;heroBottom=bottom;events.scroll();while(queue.length)queue.shift()();};
  assert.equal(film,true,'transparent at the top of the page');
  scroll(80,372);assert.equal(film,true,'the headline is still below the header');
  scroll(70,362);assert.equal(film,false,'solid as soon as the headline reaches the header, while the hero is still under it');
  phone=false;scroll(70,362);assert.equal(film,true,'wider screens keep the hero-bottom rule');
  phone=true;desktop=true;scroll(70,362);assert.equal(film,true,'and so do phones showing the desktop site');
});
