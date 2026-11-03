const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {positionInSection, mappedPosition} = require('../compare-main-v4-refinement.js');
const {start} = require('../jll-remix-main-v4.js');
const root = path.join(__dirname,'..');

test('paired scrolling preserves section progress when refined spacing changes page height', () => {
  const before = [{key:'hero',top:0,height:900},{key:'vision',top:900,height:4000},{key:'services',top:4900,height:1800}];
  const after = [{key:'hero',top:0,height:900},{key:'vision',top:900,height:4000},{key:'services',top:4900,height:1600}];
  assert.deepEqual(positionInSection(5800,before),{key:'services',progress:.5});
  assert.equal(mappedPosition(positionInSection(5800,before),after),5700);
  assert.equal(mappedPosition(positionInSection(900,before),after),900);
  assert.equal(mappedPosition(positionInSection(2900,before),after),2900);
});

test('paired scrolling tolerates removed sections, empty pages and overscroll', () => {
  assert.equal(positionInSection(100,[]),null);
  assert.equal(mappedPosition(null,[]),null);
  assert.equal(mappedPosition({key:'missing',progress:.5},[{key:'hero',top:0,height:900}]),null);
  assert.deepEqual(positionInSection(-15,[{key:'hero',top:0,height:900}]),{key:'hero',progress:0});
  assert.deepEqual(positionInSection(1200,[{key:'hero',top:0,height:900}]),{key:'hero',progress:1});
});

test('the before page resolves local dependencies and its runtime/theme match their frozen hashes', () => {
  const dir=path.join(root,'design/archive/main-v4-20261026');
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
  for(const item of manifest.files) assert.equal(hash(fs.readFileSync(path.join(dir,item.file))),item.archiveSHA256,item.file);
  const html=fs.readFileSync(path.join(dir,manifest.entry),'utf8');
  assert.equal(hash(html),manifest.archiveHTMLSHA256);
  assert.equal(hash(fs.readFileSync(path.join(dir,'theme.json'))),manifest.themeSHA256);
  for(const match of html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)){
    if(/^(?:[a-z]+:|\/\/)/i.test(match[1]))continue;
    assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);
  }
  for(const item of manifest.files.filter(f=>f.file.endsWith('.css'))){
    const css=fs.readFileSync(path.join(dir,item.file),'utf8');
    for(const match of css.matchAll(/url\(['"]?([^'"?#)]+)(?:\?[^'"\s)]*)?['"]?\)/g)){
      if(/^(?:[a-z]+:|\/\/)/i.test(match[1]))continue;
      assert.ok(match[1].startsWith('/'),'CSS asset URL is rooted: '+match[1]);
      assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);
    }
  }
  const theme=fs.readFileSync(path.join(dir,'jll-remix-theme.js'),'utf8');
  assert.match(theme,/const local = false/);
  assert.match(theme,/const channel = null/);
  assert.match(theme,/fetch\('\/design\/archive\/main-v4-20261026\/theme.json'/);
});

function heroFixture({reduce=false,refined=true}={}){
  const animations=[],events={},selected=[],videos=[],values={};
  function element(tag='div'){
    return {tagName:tag.toUpperCase(),dataset:{},style:{setProperty(k,v){values[k]=v;}},attrs:{},events:{},children:[],
      hidden:false,complete:true,naturalWidth:1600,offsetHeight:160,
      setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},
      addEventListener(k,fn){this.events[k]=fn;},removeEventListener(k){delete this.events[k];},append(el){this.children.push(el);},remove(){this.removed=true;},
      animate(frames,options){const a={frames,options,target:this,playState:'running',cancel(){this.cancelled=true;},pause(){this.playState='paused';},play(){this.playState='running';},finish(){this.playState='finished';this.onfinish?.();}};animations.push(a);return a;}
    };
  }
  for(let i=0;i<4;i++)videos.push({...element('video'),dataset:{story:String(i)},hidden:true,readyState:3,duration:8+i,currentTime:0,
    plays:0,pauses:0,play(){this.plays++;return Promise.resolve();},pause(){this.pauses++;}});
  const title=element('h1'),cta=element('a'),copy=element(),photo=element('img'),shade={before(){}};
  const buttons=videos.map((v,i)=>({...element('button'),dataset:{slide:String(i)},classList:{toggle(k,value){selected[i]=value;}}}));
  const hero={...element(),querySelectorAll:()=>videos,querySelector:s=>({'.hw-hero-copy':copy,'#hw-title':title,'#hw-story-cta':cta,'.hw-hero-shade':shade,'.hw-hero-image':photo})[s]||null};
  const bar={...element(),offsetHeight:60,closest:()=>hero,querySelectorAll:()=>buttons};
  const reduced={matches:reduce,addEventListener(k,fn){this[k]=fn;}};
  const doc={hidden:false,modal:false,documentElement:{hasAttribute:name=>name==='data-v4-refinement'&&refined},
    querySelector:s=>s==='.main-v4-stories'?bar:doc.modal?{}:null,getElementById:()=>({}),
    addEventListener(k,fn){events[k]=fn;},createElement:element};
  const win={document:doc,navigator:{},matchMedia:q=>q.includes('prefers-reduced-motion')?reduced:{matches:false},
    getComputedStyle:()=>({bottom:'24px',transform:'none'}),dispatchEvent(){},CustomEvent:class{},addEventListener(){}};
  const stories=videos.map((_,i)=>({title:'제목 '+i+'<br>두 번째 줄',cta:'자세히 보기',image:'unused.jpg',alt:'예시'}));
  start(win,stories);
  return {videos,title,cta,buttons,selected,animations,doc,events,reduced,values,
    choose:i=>buttons[i].events.click(),latest:()=>animations.filter(a=>a.options.easing==='linear').at(-1)};
}
const settled=()=>new Promise(resolve=>setImmediate(resolve));

test('four film stories still auto-advance, wrap and expose one selected button after the motion refinement',async()=>{
  const h=heroFixture();await settled();
  assert.equal(h.selected[0],true);
  assert.equal(h.values['--main-stories-height'],'84px');
  for(const next of [1,2,3,0]){
    h.latest().finish();await settled();
    assert.equal(h.selected.filter(Boolean).length,1);
    assert.equal(h.selected[next],true);
    assert.equal(h.latest().options.duration,(8+next)*1000);
    const fade=h.animations.filter(a=>a.options.duration===800).at(-1);fade.finish();
    assert.equal(h.videos.filter(v=>!v.hidden).length,1);
    assert.equal(h.videos[next].hidden,false);
    assert.ok(h.title.innerHTML.includes('제목 '+next));
  }
  const entrance=h.animations.filter(a=>a.target===h.cta).at(-1);
  assert.equal(entrance.options.delay,460);
  assert.equal(entrance.options.duration,620);
});

test('refined hero still pauses automatic progress for overlays and hidden tabs, with manual reduced-motion selection',async()=>{
  const h=heroFixture();await settled();
  h.doc.modal=true;h.events.visibilitychange();assert.equal(h.latest().playState,'paused');
  h.doc.modal=false;h.doc.hidden=true;h.events.visibilitychange();assert.equal(h.latest().playState,'paused');
  h.doc.hidden=false;h.events.visibilitychange();assert.equal(h.latest().playState,'running');
  const r=heroFixture({reduce:true});await settled();
  r.choose(2);await settled();
  assert.equal(r.selected[2],true);assert.equal(r.animations.length,0);
  assert.equal(r.videos[2].plays,0);
});

test('manual film selection cancels an unfinished crossfade without leaving a visible old layer',async()=>{
  const h=heroFixture();await settled();h.choose(1);await settled();
  const firstFade=h.animations.filter(a=>a.options.duration===800).at(-1);
  h.choose(3);await settled();
  assert.equal(firstFade.cancelled,true);
  h.animations.filter(a=>a.options.duration===800).at(-1).finish();
  assert.equal(h.videos.filter(v=>!v.hidden).length,1);assert.equal(h.videos[3].hidden,false);
  assert.match(h.cta.attrs.href,/jll-remix-journal-v2/);
});
