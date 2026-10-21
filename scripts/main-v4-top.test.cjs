const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=require('../jll-remix-main-v4-top.js');

function fixture({visionTop=1400,header=137,withVision=true,footerTop=Infinity}={}){
  const classes=new Set();
  const button={hidden:true,attrs:{},tabIndex:-1,classList:{toggle(c,on){on?classes.add(c):classes.delete(c);}},setAttribute(k,v){this.attrs[k]=v;}};
  let scrollY=0;const vision={getBoundingClientRect(){return {top:visionTop-scrollY};}},footer={getBoundingClientRect(){return {top:footerTop-scrollY};}};
  const events={},raf=[];
  const win={get scrollY(){return scrollY;},innerHeight:800,
    document:{documentElement:{style:{getPropertyValue:n=>n==='--sps-header-height'?header+'px':''}},querySelector:sel=>sel==='.main-v4-top'?button:sel==='[data-sps-footer]'&&Number.isFinite(footerTop)?footer:(sel==='#hw-vision'&&withVision?vision:null)},
    addEventListener(n,fn){events[n]=fn;},requestAnimationFrame(fn){raf.push(fn);return raf.length;}};
  const handle=api.start(win);
  return {handle,button,classes,scrollTo(y){scrollY=y;events.scroll();while(raf.length)raf.shift()();}};
}

test('the button appears once the vision section reaches the header and hides again above it',()=>{
  const h=fixture();
  assert.equal(h.button.hidden,false,'unhidden on start so the fade can play');
  assert.equal(h.handle.shown,false);assert.equal(h.button.attrs['aria-hidden'],'true');assert.equal(h.button.tabIndex,-1);
  h.scrollTo(1262);assert.equal(h.handle.shown,false,'one pixel short of the vision section');
  h.scrollTo(1263);assert.equal(h.handle.shown,true);assert.ok(h.classes.has('is-shown'));assert.equal(h.button.tabIndex,0);assert.equal(h.button.attrs['aria-hidden'],'false');
  h.scrollTo(3000);assert.equal(h.handle.shown,true);
  h.scrollTo(200);assert.equal(h.handle.shown,false);assert.ok(!h.classes.has('is-shown'));
});

test('without a vision section it falls back to 600px; pages without the button are untouched',()=>{
  const h=fixture({withVision:false});
  h.scrollTo(599);assert.equal(h.handle.shown,false);
  h.scrollTo(600);assert.equal(h.handle.shown,true);
  assert.equal(api.start({document:{querySelector:()=>null}}),null);
});

test('markup and style: an anchor to #hw-intro (the Hanwha script smooth-scrolls hw- anchors) at the bottom right, hidden until shown',()=>{
  const html=fs.readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/<a class="main-v4-top" href="#hw-intro" aria-label="맨 위로" aria-hidden="true" tabindex="-1" hidden>/);
  assert.match(html,/jll-remix-main-v4-top\.js\?v=/);
  assert.ok(html.indexOf('class="main-v4-top"')>html.indexOf('main-v4-page-nav'),'placed after the page nav');
  const css=fs.readFileSync(require.resolve('../jll-remix-main-v4.css'),'utf8');
  assert.match(css,/\.main-v4-top \{ position:fixed; right:clamp\(24px,2vw,40px\); bottom:clamp\(24px,3vh,40px\);/);
  assert.match(css,/\.main-v4-top\.is-shown \{ opacity:1; transform:none; pointer-events:auto; \}/);
  assert.match(css,/\.main-v4-top \{ right:16px; bottom:72px;/,'on phones it sits above the bottom page menu');
  assert.match(fs.readFileSync(require.resolve('../jll-remix-hanwha.js'),'utf8'),/closest\('a\[href\^="#hw-"\]'\)/,'the shared anchor handler covers the button');
});

test("the button hides again once the footer enters the viewport (the footer's own 맨 위로 takes over) and the V4 footer carries that link",()=>{
  const h=fixture({footerTop:5000});
  h.scrollTo(3000);assert.equal(h.handle.shown,true);
  h.scrollTo(4200);assert.equal(h.handle.shown,true,'footer top at 800 = viewport bottom: still shown');
  h.scrollTo(4201);assert.equal(h.handle.shown,false,'footer in view: hidden');assert.equal(h.button.tabIndex,-1);
  h.scrollTo(3000);assert.equal(h.handle.shown,true);
  const html=fs.readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/<footer class="sps-footer" data-sps-footer data-sps-layout id="hw-footer">/,'no data-footer-no-top: the footer renders 맨 위로 like every other page');
});
