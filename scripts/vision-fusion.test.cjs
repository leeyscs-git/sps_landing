const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../jll-remix-vision-fusion.js');
const {frame,flightPoint,flightCurve,coverRadius,cardState,captionRange,captionState,shadeState,phaseOf,T,CARDS,UNIT}=api;
const fs=require('node:fs');
const page=f=>fs.readFileSync(require.resolve('../'+f),'utf8').replace(/\r\n?/g,'\n');

// 무대 크기별 합성 geometry: 단어 중심은 가운데 정렬된 슬로건 네 줄을 흉내 낸다.
function geoFor(w,h,offsets=[[-0.07,-0.13],[-0.06,-0.04],[-0.05,0.05],[-0.08,0.14]]){
  const S=Math.min(w,h);
  return {w,h,spacing:S*.11,words:[null,...offsets.map(([ox,oy])=>({x:w/2+ox*w,y:h/2+oy*h}))]};
}
const GEOS={desktop:geoFor(1440,800),laptop:geoFor(1024,700),phone:geoFor(390,640),wide:geoFor(1920,600)};
const slot=(i,geo)=>[geo.w/2+geo.spacing*UNIT[i][0],geo.h/2+geo.spacing*UNIT[i][1]];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

test('each flight starts at its word, lands on its symbol slot, bends once and never loops',()=>{
  for(const [name,geo] of Object.entries(GEOS)){
    for(let i=1;i<=4;i++){
      const p0=flightPoint(i,0,geo),p1=flightPoint(i,1,geo);
      assert.ok(dist(p0,[geo.words[i].x,geo.words[i].y])<.5,name+' dot '+i+' starts at its word');
      assert.ok(dist(p1,slot(i,geo))<.5,name+' dot '+i+' lands on its slot');
      const pts=[];for(let s=0;s<=64;s++)pts.push(flightPoint(i,s/64,geo));
      let length=0,maxTurn=0,prev=null;
      for(let s=1;s<pts.length;s++){
        const v=[pts[s][0]-pts[s-1][0],pts[s][1]-pts[s-1][1]];const l=Math.hypot(v[0],v[1]);length+=l;
        if(l<1e-6)continue;
        if(prev){const cos=(v[0]*prev[0]+v[1]*prev[1])/(l*Math.hypot(prev[0],prev[1]));maxTurn=Math.max(maxTurn,Math.acos(Math.max(-1,Math.min(1,cos)))*180/Math.PI);}
        prev=v;
      }
      const chord=dist(p0,p1);
      assert.ok(pts.every(pt=>Number.isFinite(pt[0])&&Number.isFinite(pt[1])),name+' dot '+i+' finite');
      assert.ok(maxTurn<25,name+' dot '+i+' turns at most 25° per step (got '+maxTurn.toFixed(1)+')');
      assert.ok(length<2.2*chord+1,name+' dot '+i+' path '+length.toFixed(0)+' vs chord '+chord.toFixed(0));
      // 도착 방향은 심볼 원의 접선: 마지막 구간의 방향과 반지름 방향이 직교에 가깝다
      const c=flightCurve(i,geo);const radial=[c.P1[0]-geo.w/2,c.P1[1]-geo.h/2];
      const cosA=(c.T1[0]*radial[0]+c.T1[1]*radial[1])/(Math.hypot(...c.T1)*Math.hypot(...radial));
      assert.ok(Math.abs(cosA)<.05,name+' dot '+i+' arrives tangentially');
    }
  }
});

test('a word sitting on its slot takes a straight hop instead of a degenerate curve',()=>{
  const geo=geoFor(1440,800);const s=slot(2,geo);geo.words[2]={x:s[0]+2,y:s[1]};
  const pts=[0,.25,.5,.75,1].map(u=>flightPoint(2,u,geo));
  assert.ok(pts.every(pt=>Number.isFinite(pt[0])&&Number.isFinite(pt[1])));
  assert.ok(dist(pts[4],s)<.5);
});

test('frame() is finite everywhere and the five states carry the fields paint() relies on',()=>{
  for(const geo of Object.values(GEOS)){
    for(let k=0;k<=200;k++){
      const p=k/200;const states=frame(p,geo);
      assert.equal(states.length,5);
      for(const s of states){
        for(const key of ['x','y','w','h','rx','opacity','tagX','tagY','tagOpacity','trailOpacity'])assert.ok(Number.isFinite(s[key]),key+' at p='+p);
        assert.equal(s.mode,'circle');
        for(const key of ['ex','ey','er','mediaScale'])assert.ok(Number.isFinite(s[key]),key+' at p='+p);
        assert.ok(s.mediaScale<=1&&s.mediaScale>=.9);
        assert.ok(s.opacity>=0&&s.opacity<=1.0001);
      }
    }
  }
});

test('windows are invisible until they open, then the rocket (left window) spreads first as a circle that covers the stage and absorbs the other four, wind included',()=>{
  const lead=CARDS[0].win;
  assert.equal(lead,1,'the first card is 새로운 도전 (rocket), not the wind field');
  for(const [name,geo] of Object.entries(GEOS)){
    assert.ok(frame(T.open[0]-.01,geo).every(s=>s.opacity===0),name+': nothing visible before open');
    const hold=frame(CARDS[0].grow[0]-.001,geo);
    assert.ok(hold.every(s=>s.opacity>.99),name+': all five windows fully open before the spread');
    // 퍼지는 동안 원의 중심은 제 창 자리에 머문다 (타원이 아니라 원)
    const mid=frame((CARDS[0].grow[0]+CARDS[0].grow[1])/2,geo)[lead];
    assert.ok(Math.abs(mid.ex-hold[lead].ex)<.5&&Math.abs(mid.ey-hold[lead].ey)<.5,name+': the circle grows in place');
    assert.ok(mid.er>hold[lead].er*2,name+': and is clearly growing');
    const end=frame(CARDS[0].grow[1],geo)[lead];
    assert.ok(end.er>=coverRadius(end.ex,end.ey,geo)-.5,name+': the circle covers the farthest corner');
    const before=frame(CARDS[1].grow[0]-.001,geo);
    for(const i of [0,2,3,4])assert.ok(before[i].opacity<.002,name+': window '+i+' absorbed before card 1 (opacity '+before[i].opacity.toFixed(3)+')');
    assert.ok(before[lead].opacity>.99&&before[lead].visible,name+': the rocket is the ground when card 1 starts');
    for(let k=0;k<=100;k++)assert.ok(frame(CARDS[0].grow[1]+(1-CARDS[0].grow[1])*k/100,geo)[4].visible===false,name+': the wind window never comes back as a card');
  }
});

test('each film card reappears in its own window spot, spreads as a circle over the previous card, which recedes; Seoul closes',()=>{
  const geo=GEOS.desktop;
  const at=(p,i)=>frame(p,geo)[i];
  for(let j=1;j<CARDS.length;j++){
    const card=CARDS[j],i=card.win,prev=CARDS[j-1].win,len=card.grow[1]-card.grow[0];
    const justBefore=at(card.grow[0]-.001,i);
    assert.ok(justBefore.opacity<.002,'card '+j+' is dark before it starts');
    const appear=at(card.grow[0]+.12*len,i);
    const spot=at(T.open[1],i);   // 창이 열렸을 때의 자리
    assert.ok(appear.opacity>.99,'card '+j+' fades back in');
    assert.ok(Math.abs(appear.ex-spot.ex)<.5&&Math.abs(appear.ey-spot.ey)<.5,'card '+j+' reappears where its window was');
    assert.ok(Math.abs(appear.er-spot.er)<.5,'card '+j+' starts at its window size');
    const full=at(card.grow[1],i);
    assert.ok(full.er>=coverRadius(full.ex,full.ey,geo)-.5,'card '+j+' covers the stage');
    assert.ok(Math.abs(full.ex-spot.ex)<.5,'card '+j+' grows in place');
    const prevMid=at(card.grow[0]+.6*len,prev),prevFull=at(card.grow[1],prev);
    assert.ok(prevMid.mediaScale<1&&prevMid.mediaScale>prevFull.mediaScale,'the previous card recedes while this one spreads');
    assert.equal(prevFull.visible,false,'the previous card counts as covered once this one is full');
    assert.ok(at(card.grow[1]-.001,prev).visible,'…but not before');
  }
  const last=at(1,0);
  assert.ok(last.visible&&last.er>=coverRadius(last.ex,last.ey,geo)-.5&&last.mediaScale===1,'Seoul rests full-bleed and undisturbed at the end');
  for(const i of [1,2,3,4])assert.equal(at(1,i).visible,false,'window '+i+' is covered at the end');
  // 글은 카드와 같은 호흡: 카드가 퍼지는 동안 올라오고, 다음 카드가 퍼지기 시작하면 위로 빠진다
  for(const k of [1,2,3]){
    const c=captionRange(k),j=CARDS.findIndex(x=>x.caption===k);
    assert.ok(c.in[0]>=CARDS[j].grow[0]&&c.in[1]<=CARDS[j].grow[1]);
    assert.equal(c.out[0],CARDS[j+1].grow[0]);
    assert.equal(captionState(k,c.in[0]).opacity,0);assert.equal(captionState(k,c.in[1]).opacity,1);
    assert.ok(captionState(k,c.in[0]).y>captionState(k,c.in[1]).y);
    assert.equal(captionState(k,c.out[1]).opacity,0);assert.ok(captionState(k,c.out[1]).y<0);
  }
  assert.deepEqual([phaseOf(0),phaseOf(.45),phaseOf(.7),phaseOf(.95)],['gather','open','rise','full']);
});

test('the timeline is ordered and the closing copy lands last',()=>{
  const order=[T.reveal.start,T.rest[0],.18,T.center[0],T.open[0],...CARDS.map(c=>c.grow[0]),T.copy[0]];
  for(let i=1;i<order.length;i++)assert.ok(order[i]>=order[i-1],'timeline step '+i);
  for(let j=1;j<CARDS.length;j++)assert.ok(CARDS[j].grow[0]>=CARDS[j-1].grow[1],'card '+j+' starts after the previous one has covered the stage');
  assert.deepEqual(CARDS.map(c=>c.win),[1,2,3,0],'cards follow the stacking order in the CSS: rocket, energy, future, Seoul (the wind window stays a window)');
  assert.ok(T.copy[1]<=1&&T.copy[1]>=CARDS[CARDS.length-1].grow[1]);
  const lastLanding=Math.max(...[1,2,3,4].map(i=>api.FLIGHT[i].start+api.FLIGHT[i].length));
  assert.ok(lastLanding<=T.center[1],'the centre dot completes after the last flight lands');
  assert.ok(T.center[1]<=T.open[1]);
});

test('the main page and the standalone preview carry the same fusion section, assets and accessible static copy',()=>{
  const main=page('jll-remix-main-v4.html'),preview=page('jll-remix-vision-fusion.html');
  const section=html=>{const m=html.match(/<section class="hw-fusion"[^>]*>[\s\S]*?<\/section>/);assert.ok(m,'fusion section present');return m[0].replace(/^<section([^>]*) id="[^"]*"/,'<section$1');};
  assert.equal(section(main),section(preview),'section bodies identical apart from the id');
  assert.match(main,/<section class="hw-fusion" id="hw-vision-fusion"/);
  assert.match(preview,/<section class="hw-fusion" id="hw-fusion"/);
  assert.equal((main.match(/<section class="hw-fusion"/g)||[]).length,1);
  const assets=html=>(html.match(/jll-remix-vision-fusion\.(?:js|css)\?v=[^"]+/g)||[]).sort();
  assert.deepEqual(assets(main),assets(preview),'both pages load the same scene versions');
  assert.doesNotMatch(section(main),/class="hw-fusion-static(?:-films)?" aria-hidden/,'reduced-motion copies stay in the accessibility tree');
  assert.equal((section(main).match(/<video[^>]*preload="none"/g)||[]).length,5,'scene videos (four windows + the ground film slot) do not fetch until the scene warms them');
});

test('tags stack above every window and the bottom shade is driven continuously',()=>{
  const css=page('jll-remix-vision-fusion.css');
  const z=sel=>Number((css.match(new RegExp(sel.replace(/[[\]"]/g,'\\$&')+'\\s*\\{[^}]*z-index:\\s*(\\d+)'))||[])[1]);
  const top=Math.max(...['[data-window="4"]','[data-window="1"]','[data-window="2"]','[data-window="3"]','[data-window="0"]'].map(s=>z('.hw-fusion-window'+s)));
  assert.ok(z('.hw-fusion-tag')>top,'tag z-index above all windows');
  assert.match(css,/\.hw-fusion-stage::after \{[^}]*opacity: var\(--fusion-shade, 0\)/);
  assert.doesNotMatch(css,/data-phase="(rise|full)"\] \.hw-fusion-stage::after/,'no phase-gated overlay that would pop');
  let prev=-1;for(let k=0;k<=100;k++){const s=shadeState(k/100);assert.ok(s.shade>=prev-1e-9);prev=s.shade;}
  assert.equal(shadeState(CARDS[0].grow[0]).shade,0);assert.equal(shadeState(CARDS[0].grow[1]).shade,1);
  assert.equal(shadeState(CARDS[CARDS.length-1].grow[0]).deep,0);assert.equal(shadeState(1).deep,1);
});

test('caption 3 is gone before the Seoul circle reaches the text slot',()=>{
  const geo=GEOS.desktop;const slot={x:112+260,y:geo.h-96-60};   // 글 슬롯의 대략적인 중심
  for(let p=CARDS[CARDS.length-1].grow[0];p<=1;p+=.0005){
    const s=frame(p,geo)[0];const reach=s.er-Math.hypot(slot.x-s.ex,slot.y-s.ey);   // >0 이면 원이 슬롯에 닿았다
    if(reach>-40)assert.ok(captionState(3,p).opacity<.01,'caption 3 opacity '+captionState(3,p).opacity.toFixed(3)+' at p='+p.toFixed(4));
  }
});

// start()/paint() 런타임: 가짜 창에서 영상 재생 게이트, 숨김 탭, 오버레이, 움직임 줄임을 확인한다.
function fakeWindow({reduced=false,extraSection={},extraOne={},dataset={},smoothScroll=null,screens=8.4}={}){
  const log=[];const el=(extra={})=>({style:{setProperty(k,v){this[k]=v;}},dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},getBoundingClientRect(){return {left:0,top:0,width:0,height:0};},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){},...extra});
  const video=i=>({tagName:'VIDEO',readyState:0,preload:'none',style:{},play(){log.push('play'+i);return Promise.resolve();},pause(){log.push('pause'+i);},load(){log.push('load'+i);}});
  const img={tagName:'IMG',style:{}};
  const windows=['1','3','2','4','0'].map(n=>el({dataset:{window:n},querySelector(){return n==='0'?img:video(n);}}));
  windows.forEach(w=>{const m=w.querySelector();w.querySelector=()=>m;});
  const words=[[-100,-100],[-80,-30],[-60,40],[-110,110]].map(([x,y])=>el({getBoundingClientRect(){return {left:720+x-40,top:400+y-20,width:80,height:40};}}));
  const slogan=el({querySelectorAll(sel){return sel==='.hw-fusion-word'?words:sel==='.hw-fusion-line > span'?[el(),el(),el(),el()]:[el(),el(),el(),el()];}});
  const redEl=el(),pulseEl=el(),logoEl=el(),wordEl=el(),clipEl=el(),fadeEl=el();
  const svgParts={'.hw-fusion-red':redEl,'.hw-fusion-pulse':pulseEl,'.hw-fusion-logo':logoEl,'.hw-fusion-wordmark':wordEl,'.hw-fusion-wordmark-clip':clipEl,'.hw-fusion-wordmark-fade':fadeEl};
  const svg=el({querySelectorAll(sel){return sel==='mask rect'?[el(),el(),el(),el(),el()]:[el(),el(),el(),el(),el()];},querySelector(sel){return svgParts[sel]||null;}});
  let scrollY=0;
  const stage=el({clientWidth:1440,clientHeight:800,offsetHeight:800,getBoundingClientRect(){return {left:0,top:1000-scrollY,width:1440,height:800};}});
  const section=el({offsetHeight:800*screens,getBoundingClientRect(){return {left:0,top:1000-scrollY,width:1440,height:800*screens};},
    querySelector(sel){return extraOne[sel]||({'.hw-fusion-stage':stage,'.hw-fusion-svg':svg,'.hw-fusion-slogan':slogan,'.hw-fusion-copy':el()})[sel]||null;},
    querySelectorAll(sel){if(extraSection[sel])return extraSection[sel];return sel==='.hw-fusion-window'?windows:sel==='.hw-fusion-tag'?[el(),el(),el(),el()]:sel==='.hw-fusion-caption'?[el({dataset:{caption:'1'}}),el({dataset:{caption:'2'}}),el({dataset:{caption:'3'}})]:[];}});
  Object.assign(section.dataset,dataset);
  const raf=[];const docEvents={};let bodyClass=[],dialogOpen=false;
  const win={get scrollY(){return scrollY;},set scrollY(v){scrollY=v;},requestAnimationFrame(fn){raf.push(fn);return raf.length;},addEventListener(){},SPSScrollTo:smoothScroll||undefined,
    matchMedia(){return {matches:reduced,addEventListener(){}};},
    document:{hidden:false,body:{classList:{contains:c=>bodyClass.includes(c)}},querySelector(sel){return sel==='.hw-fusion'?section:sel==='dialog[open]'?(dialogOpen?{}:null):null;},querySelectorAll(){return [];},addEventListener(name,fn){docEvents[name]=fn;}}};
  const api2=require('../jll-remix-vision-fusion.js');
  const handle=api2.start(win);
  const flush=()=>{while(raf.length){const fn=raf.shift();if(!win.document.hidden)fn();else{raf.unshift(fn);break;}}};
  const lead=dataset.entry==='symbol'?800:0;   // 바로 심볼 판은 무대가 화면에 들어오는 순간부터 진행한다
  const scrollTo=p=>{scrollY=1000-lead+(800*screens-800+lead)*p;handle.paint();};
  return {log,section,scrollTo,flush,docEvents,setHidden(v){win.document.hidden=v;},setMenu(v){bodyClass=v?['sps-menu-open']:[];},setDialog(v){dialogOpen=v;},handle,windows,redEl,pulseEl,logoEl,wordEl,clipEl,fadeEl};
}

test('runtime: videos play while their window is visible, pause when covered, resume on the way back, and stop at the end',()=>{
  const h=fakeWindow();
  h.scrollTo(.45);assert.deepEqual(h.log.splice(0),['load1','play1','load2','play2','load3','play3','load4','play4'],'windows are handled in symbol order regardless of DOM order');
  assert.equal(h.section.dataset.phase,'open');
  h.scrollTo(.75);assert.deepEqual(h.log.splice(0),['pause1','pause3','pause4']);   // 에너지만 보인다: 발사는 덮였고 바람·미래는 녹아들었다
  h.scrollTo(.45);assert.deepEqual(h.log.splice(0),['play1','play3','play4']);
  h.scrollTo(1);assert.deepEqual(h.log.splice(0).sort(),['pause1','pause2','pause3','pause4']);
  assert.equal(h.section.dataset.phase,'full');
  assert.equal(h.section.style['--fusion-shade-deep'],'1.000','the bottom shade is fully deepened at the end');
});

test('runtime: a hidden tab pauses immediately, an open menu or dialog pauses, and both resume afterwards',()=>{
  const h=fakeWindow();
  h.scrollTo(.45);h.log.length=0;
  h.setHidden(true);h.docEvents.visibilitychange();
  assert.deepEqual(h.log.splice(0).sort(),['pause1','pause2','pause3','pause4'],'paused without waiting for a frame');
  h.setHidden(false);h.docEvents.visibilitychange();h.flush();
  assert.deepEqual(h.log.splice(0).sort(),['play1','play2','play3','play4']);
  h.setMenu(true);h.handle.paint();assert.deepEqual(h.log.splice(0).sort(),['pause1','pause2','pause3','pause4']);
  h.setMenu(false);h.handle.paint();assert.deepEqual(h.log.splice(0).sort(),['play1','play2','play3','play4']);
  h.setDialog(true);h.handle.paint();assert.deepEqual(h.log.splice(0).sort(),['pause1','pause2','pause3','pause4']);
});

test('runtime: reduced motion shows the final frame and never plays a video',()=>{
  const h=fakeWindow({reduced:true});
  assert.equal(h.section.dataset.phase,'full');
  h.scrollTo(.45);h.scrollTo(.75);
  assert.deepEqual(h.log,[]);
});

test("the 'rise' variant glides the four films into a left column (top→bottom: 혁신·도전·가능성·내일), hands the circles to still thumbnails, and plays the current film full-screen behind one caption at a time",()=>{
  const geo=GEOS.desktop,order=api.COLUMN.order;
  const before=frame(T.open[1],geo,'rise'),same=frame(T.open[1],geo);
  assert.deepEqual(before.map(s=>[Math.round(s.ex),Math.round(s.ey)]),same.map(s=>[Math.round(s.ex),Math.round(s.ey)]),'identical until the column forms');
  const mid=frame((api.COLUMN.move[0]+api.COLUMN.move[1])/2,geo,'rise');
  const first=mid[order[0]],start=before[order[0]];
  assert.ok(first.ex<start.ex&&first.media&&first.media.scale<1,'the first circle glides left from its symbol spot while its film scales down inside');
  const early=frame(api.COLUMN.move[0]+.035,geo,'rise');
  assert.ok(early[order[3]].tagOpacity<.4&&early[order[3]].tagOpacity>=0,'labels fade out at the symbol as the column starts forming');
  const col=frame(api.COLUMN.handoff[1]+.003,geo,'rise');
  const xs=order.map(i=>Math.round(col[i].thumb.x));assert.ok(xs.every(x=>x===xs[0])&&xs[0]<geo.w/4,'thumbnails share one x at the left: '+xs.join(','));
  for(let k=1;k<4;k++)assert.ok(col[order[k]].thumb.y-col[order[k]].thumb.r>col[order[k-1]].thumb.y+col[order[k-1]].thumb.r,'thumbnails stack top to bottom without overlap');
  for(const i of order){assert.ok(!col[i].visible,'after the handoff the window rests (thumbnail + backdrop videos take over)');assert.ok(col[i].thumb.opacity>.5&&col[i].tagOpacity>.5,'thumbnail and label are up for film '+i);}
  { const f=api.backdropFrame(0,api.COLUMN.move[0]+.03);assert.ok(f.visible&&f.y>0&&f.y<100,'the first film rises from the bottom while the circles are still gliding (y '+f.y.toFixed(1)+'%)'); }
  assert.ok(col[0].opacity<.002&&!col[0].visible,'Seoul fades out as the column forms');
  const m=api.COLUMN.move;assert.ok(frame(m[0]+.2*(m[1]-m[0])+.001,geo,'rise')[0].opacity<.002,'and is already gone a fifth of the way into the glide');
  for(let k=0;k<4;k++){
    const m=api.seqRange(k).mid,f=frame(m,geo,'rise');
    const ops=[1,2,3,4].map(c=>captionState(c,m,'rise').opacity);
    assert.equal(ops[order[k]-1],1,'caption '+order[k]+' is up at slot '+k);assert.equal(ops.filter(o=>o>.01).length,1,'only one caption at a time');
    { const f=api.backdropFrame(k,m);assert.ok(f.visible&&Math.abs(f.y)<.01,'the current film fills the backdrop'); }
    for(const j of [0,1,2,3].filter(j=>j!==k))assert.ok(!api.backdropFrame(j,m).visible,'the other films are off');
    assert.equal(api.backdropSlot(k%2,m),k,'the alternating backdrop video for this slot carries it');
    assert.ok(f[order[k]].thumb.r>f[order[(k+1)%4]].thumb.r&&f[order[k]].thumb.opacity>f[order[(k+1)%4]].thumb.opacity,'the active thumbnail is larger and brighter');
  }
  const cp=api.seqRange(0).out[1]-.002;
  { const prev=api.backdropFrame(0,cp),next=api.backdropFrame(1,cp);
    assert.ok(prev.visible&&next.visible&&next.z>prev.z,'the next film rises over the previous one');
    assert.ok(next.y>0&&next.y<100&&prev.y<0,'it comes up from below while the previous is pushed up (next '+next.y.toFixed(1)+'%, prev '+prev.y.toFixed(1)+'%)'); }
  const end=frame(1,geo,'rise');
  { const f=api.backdropFrame(3,1);assert.ok(f.visible&&Math.abs(f.y)<.01,'the last film stays to the end'); }
  assert.equal(captionState(order[3],1,'rise').opacity,1,'the last caption (더 나은 내일) never leaves');
  assert.ok(end[order[3]].thumb.r>end[order[2]].thumb.r,'and its thumbnail stays active');
  assert.match(fs.readFileSync(require.resolve('../jll-remix-vision-fusion.css'),'utf8'),/\.hw-fusion\[data-variant="rise"\] \.hw-fusion-copy \{ display: none; \}/,'no closing copy in the column variant');
  assert.equal(captionState(4,.7).opacity,0,'caption 4 (가능성) stays hidden in the circle variant');
  assert.deepEqual(shadeState(.8,'rise'),{shade:0,deep:0});
  for(let k=0;k<=200;k++)for(const s of frame(k/200,geo,'rise')){for(const key of ['ex','ey','er','opacity','tagX','tagY','tagOpacity'])assert.ok(Number.isFinite(s[key]),key+' finite in rise variant');if(s.thumb)for(const key of ['x','y','r','opacity'])assert.ok(Number.isFinite(s.thumb[key]),'thumb.'+key+' finite');}
  const page=fs.readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(page,/if\(v==="rise"\|\|v==="logo"\|\|v==="symbol"\|\|v==="symbol-rise"\)fusion\.dataset\.variant="rise"/,'the V4 chooser marks the section for the rise variant');
  assert.match(page,/name="main-v4-vision" value="rise"/,'and the tweaks panel offers it');
  assert.equal((page.match(/hw-fusion-caption" data-caption="4"/g)||[]).length,1,'a fourth caption (가능성) exists for the column sequence');
  assert.equal((page.match(/<video class="hw-fusion-backdrop"/g)||[]).length,2,'two alternating backdrop videos, loaded only when the column variant runs');
  assert.match(fs.readFileSync(require.resolve('../jll-remix-vision-fusion.css'),'utf8'),/\.hw-fusion-film::after \{[^}]*background: color-mix\(in srgb, var\(--fusion-black\) 38%, transparent\)/,'each film carries its own, lighter (38%) dim layer, so the empty stage keeps its own colour');
  assert.match(fs.readFileSync(require.resolve('../jll-remix-vision-fusion.css'),'utf8'),/\.hw-fusion\[data-variant="rise"\] \.hw-fusion-caption \{ text-shadow: 0 1px 18px color-mix\(in srgb, var\(--ink\) 45%, transparent\); \}/,'captions keep a soft shadow for bright films');
  assert.doesNotMatch(fs.readFileSync(require.resolve('../jll-remix-vision-fusion.css'),'utf8'),/\.hw-fusion-backdrops::after/,'no stage-wide dimmer');
  assert.deepEqual([...page.matchAll(/<button class="hw-fusion-thumb" type="button" data-window="(\d)" tabindex="-1" aria-label="[^"]+ 영상으로 이동"><img src="([^"]+)"/g)].map(m=>m[1]+':'+m[2].split('/').pop()),['1:rocket-poster.jpg','2:energy.jpg','3:future.jpg','4:wind-poster.jpg'],'each thumbnail uses its film poster');
  const css=fs.readFileSync(require.resolve('../jll-remix-vision-fusion.css'),'utf8');
  assert.match(css,/\.hw-fusion\[data-variant="rise"\] \.hw-fusion-caption, \.hw-fusion\[data-variant="rise"\] \.hw-fusion-copy \{ left: auto; right: var\(--fusion-left\)/,'copy sits on the right in the rise variant');
  assert.match(css,/\.hw-fusion\[data-variant="rise"\] \.hw-fusion-thumbs \{ display: block; \}/,'thumbnails exist only in the rise variant');
  // 차례 전환(넘겨받듯): 앞 원이 줄어드는 바로 그 구간에 다음 원이 커지고, 커질 때 살짝 넘쳤다 돌아온다
  for(let k=0;k<3;k++){
    const len=(api.SEQ.end-api.SEQ.start)/4,b=api.SEQ.start+(k+1)*len,h=.12*len;
    assert.ok(api.circleActive(k,b-h)>.99&&api.circleActive(k+1,b-h)<.01,'before the handoff only slot '+k+' is big');
    const midPrev=api.circleActive(k,b),midNext=api.circleActive(k+1,b);
    assert.ok(midPrev>.2&&midPrev<.8&&midNext>.2,'at the boundary slot '+k+' is shrinking ('+midPrev.toFixed(2)+') while slot '+(k+1)+' is growing ('+midNext.toFixed(2)+')');
    assert.ok(api.circleActive(k,b+h)<.001&&Math.abs(api.circleActive(k+1,b+h)-1)<.001,'after the handoff only slot '+(k+1)+' is big');
    let peak=0;for(let i=0;i<=60;i++)peak=Math.max(peak,api.circleActive(k+1,b-h+2*h*i/60));
    assert.ok(peak>1.05,'slot '+(k+1)+' overshoots as it takes over (peak '+peak.toFixed(3)+')');
  }
  assert.equal(api.seqTarget(2),api.seqRange(2).mid,'a circle click targets the moment its caption is fully up');
  const open=frame(T.open[1],geo);
  for(const i of [1,2,3,4])assert.ok(Math.abs(open[i].tagY-open[i].ey)<.5&&Math.abs(open[i].tagX-open[i].ex)<.5,'label '+i+' sits in the middle of its open window');
  assert.match(css,/\.hw-fusion-tag \{ position: absolute; transform: translate\(-50%, -50%\);[^}]*text-shadow:/,'labels are centred and carry a shadow for bright films');
  assert.ok(api.columnSlots(geo).every(s=>s.r<geo.h*.05),'column circles are compact');
  { const m=api.seqRange(1).mid,f=frame(m,geo,'rise'),active=f[order[1]].thumb.r,rest=f[order[0]].thumb.r;
    assert.ok(active/rest>1.4,'the active circle grows clearly (×'+(active/rest).toFixed(2)+')');
    const slots=api.columnSlots(geo),below=slots[2],me=slots[1];
    assert.ok(f[order[1]].tagY+10.5<below.y-below.r,'its label still clears the next circle');
    assert.ok(me.y-active>slots[0].y+slots[0].r+14+21,'and it does not reach the label above'); }
  assert.ok(api.columnSlots(geo).every(s=>Math.abs(s.x-s.r-(Math.min(40,Math.max(24,geo.w*.02))+16))<.01),'the column hugs the left edge, mirroring the right page menu');
  assert.match(css,/\.hw-fusion\[data-variant="rise"\] \.hw-fusion-caption p:last-child \{ font-size: var\(--ts-h2, 36px\); font-weight: var\(--ts-w-title, 560\);/,'the column caption uses the section-title step');
  assert.match(css,/@media \(max-width: 600px\) \{[\s\S]*\.hw-fusion\[data-variant="rise"\] \.hw-fusion-caption p:last-child \{ font-size: 28px; \}/,'phones use the 28px section-title step');
  assert.match(css,/\.hw-fusion\[data-variant="rise"\] \.hw-fusion-caption \.hw-kicker \{[^}]*font-size: var\(--ts-body, 16px\);/,'with a body-size kicker');
  assert.match(css,/\.hw-fusion\[data-variant="rise"\] \.hw-fusion-caption, \.hw-fusion\[data-variant="rise"\] \.hw-fusion-copy \{[^}]*width: min\(640px,/,'in a box that leans to the right');
  const scale=fs.readFileSync(require.resolve('../jll-remix-main-v4-typescale.css'),'utf8');
  assert.match(scale,/\.hw-main-v4 \.hw-fusion\[data-variant="rise"\] \.hw-fusion-caption p:last-child \{ font-size: var\(--ts-h2\); font-weight: var\(--ts-w-title\);/,'and the V4 type scale (which pins the circle caption at 22px) carries the same step for the column variant');
  assert.match(scale,/@media\(max-width:600px\) \{[\s\S]*\.hw-main-v4 \.hw-fusion\[data-variant="rise"\] \.hw-fusion-caption p:last-child \{ font-size: var\(--ts-h2\); \}/,'V4 phones follow the same 28px step');
});

test("runtime: in the rise variant a visible column circle is clickable and scrolls to its film's turn through the shared smooth scroll",()=>{
  const thumbsEls={};const scrolls=[];
  const mkThumb=w=>{const el={dataset:{window:String(w)},style:{},events:{},tabIndex:-1,addEventListener(n,fn){this.events[n]=fn;}};thumbsEls[w]=el;return el;};
  const h=fakeWindow({extraSection:{'.hw-fusion-thumb':[1,2,3,4].map(mkThumb)},dataset:{variant:'rise'},smoothScroll:v=>scrolls.push(v)});
  h.scrollTo(.40);
  assert.equal(thumbsEls[1].tabIndex,-1,'not focusable before the column forms');assert.equal(thumbsEls[1].style.pointerEvents,'none');
  h.scrollTo(.70);
  assert.equal(thumbsEls[1].tabIndex,0);assert.equal(thumbsEls[1].style.pointerEvents,'auto');
  thumbsEls[4].events.click();
  const k=api.COLUMN.order.indexOf(4),expected=1000+(800*8.4-800)*api.scrollFor(api.seqTarget(k),null);   // 열 장면은 시간표로 역산한다
  assert.equal(scrolls.length,1);assert.ok(Math.abs(scrolls[0]-expected)<1,'scrolls to the 가능성 turn ('+scrolls[0]+' vs '+expected+')');
});

test("the 'logo' intro (V2 of the column scene) pauses the column timeline at the finished symbol for one screen, slides the symbol left while the SPS letters emerge from behind it, holds the full logo, then hands back to the identical column scene",()=>{
  const geo=GEOS.desktop,{LOGO,logoTimeline,logoFrame}=api;
  const total=api.travelScreens('logo'),A=LOGO.at*LOGO.travel/total,B=(LOGO.at*LOGO.travel+LOGO.screens)/total;
  // 시간표: 앞은 같은 속도, 도입부 동안 q 는 멈추고, 뒤는 한 화면 늦게 같은 속도로 간다
  assert.deepEqual(logoTimeline(0,geo),{q:0,l:0});
  assert.ok(Math.abs(logoTimeline(A,geo).q-T.open[0])<1e-9&&logoTimeline(A,geo).l===0);
  { const m=logoTimeline((A+B)/2,geo);assert.equal(m.q,T.open[0]);assert.ok(Math.abs(m.l-.5)<1e-9); }
  assert.deepEqual(logoTimeline(1,geo),{q:1,l:1});
  let prev=-1;for(let k=0;k<=400;k++){const t=logoTimeline(k/400,geo);assert.ok(t.q>=prev-1e-12,'q never runs backwards');prev=t.q;}
  { const g={...geo,travelScreens:total};assert.deepEqual(logoTimeline(.5,g),logoTimeline(.5,geo),'the measured travel matches the designed one'); }
  // 도입부 앞뒤로는 열 판과 같은 그림(q 로 그린다)
  for(const p of [.1,.3,A-.01,B+.06,.7,.9,1]){
    const q=logoTimeline(p,geo).q,a=frame(p,geo,'rise','logo'),b=frame(q,geo,'rise');
    assert.deepEqual(a.map(s=>[Math.round(s.ex),Math.round(s.ey),Math.round(s.er),s.visible]),b.map(s=>[Math.round(s.ex),Math.round(s.ey),Math.round(s.er),s.visible]),'same picture as the column scene at p='+p);
  }
  // 멈춘 동안: 심볼이 왼쪽으로 비키고(완성된 로고가 무대 가운데), 글자는 로고 파일의 자리에 또렷이
  const k=geo.spacing/LOGO.unit,hold=A+(B-A)*.7,f=frame(hold,geo,'rise','logo'),lg=logoFrame(hold,geo);
  const sx=f[0].ex;
  assert.ok(sx<geo.w/2-100,'the symbol has moved left ('+sx.toFixed(0)+')');
  assert.ok(f.every(s=>s.opacity===0),'the windows are still closed while the logo shows');
  const logoLeft=sx-LOGO.symbol[0]*k,logoRight=lg.x+LOGO.letters[1]*k;
  assert.ok(Math.abs((logoLeft+logoRight)/2-geo.w/2)<1,'the finished logo is centred on the stage');
  assert.equal(lg.opacity,1,'letters fully up during the hold');
  const symbolRight=Math.max(...f.map(s=>s.ex+s.er)),lettersLeft=lg.x+LOGO.letters[0]*k;
  assert.ok(lettersLeft>symbolRight+2*k,'letters sit clear of the symbol, as in the logo file');
  assert.ok(Math.abs(lg.y+LOGO.symbol[1]*k-geo.h/2)<.01,"letters keep the logo file's vertical relation to the symbol");
  assert.ok(Math.abs(lg.k*LOGO.unit-geo.spacing)<1e-9,'letters are scaled to the symbol spacing');
  // 시작: 글자는 보이지 않고 심볼 오른쪽 가장자리 왼쪽에 숨어 있다
  { const l0=logoFrame(A+.001,geo),f0=frame(A+.001,geo,'rise','logo');assert.ok(l0.opacity<.05);assert.ok(l0.x+LOGO.letters[1]*k<Math.max(...f0.map(s=>s.ex+s.er)),'letters start hidden behind the symbol'); }
  // 드러나는 동안 심볼은 왼쪽으로, 글자는 오른쪽으로 서로 벌어진다
  { const a1=logoFrame(A+(B-A)*.15,geo),a2=logoFrame(A+(B-A)*.35,geo);assert.ok(a2.shift<a1.shift&&a2.x>a1.x,'symbol and letters pull apart'); }
  // 창이 열리면 글자는 사라지고 심볼은 가운데로 돌아온다
  { const pOpen=B+(T.open[1]-T.open[0])*LOGO.travel/total+.001,l1=logoFrame(pOpen,geo);assert.ok(l1.opacity===0&&Math.abs(l1.shift)<1e-9,'letters gone and symbol centred once the windows are open');
    const mid=logoFrame(B+(T.open[1]-T.open[0])*LOGO.travel/total*.3,geo);assert.ok(mid.shift<0&&mid.shift>lg.shift&&mid.opacity<1,'…and both move during the opening, not before'); }
  for(let i=0;i<=200;i++){const p=i/200;for(const s of frame(p,geo,'rise','logo'))for(const key of ['ex','ey','er','opacity','tagX','tagY','x'])assert.ok(Number.isFinite(s[key]));const l=logoFrame(p,geo);for(const key of ['shift','opacity','x','y','k'])assert.ok(Number.isFinite(l[key]));}
  // 마크업·스타일·트윅
  const main=page('jll-remix-main-v4.html'),preview=page('jll-remix-vision-fusion.html'),css=page('jll-remix-vision-fusion.css'),logo=page('assets/logo.svg');
  for(const html of [main,preview]){
    const ds=[...html.match(/<g class="hw-fusion-wordmark"[^>]*>[\s\S]*?<\/g>/)[0].matchAll(/<path d="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(ds.length,3,'the three SPS letter paths');
    for(const d of ds)assert.ok(logo.includes('class="cls-4" d="'+d+'"'),'letter path copied from assets/logo.svg unchanged');
    assert.match(html,/<linearGradient class="hw-fusion-wordmark-fade" id="hw-fusion-wordmark-fade" gradientUnits="userSpaceOnUse"[^>]*><stop offset="0" stop-color="#000"><\/stop><stop offset="1" stop-color="#fff"><\/stop><\/linearGradient>\s*<mask id="hw-fusion-wordmark-mask" maskUnits="userSpaceOnUse"><rect class="hw-fusion-wordmark-clip" x="0" y="0" width="0" height="0" fill="url\(#hw-fusion-wordmark-fade\)"><\/rect><\/mask>/,'a feathered mask, not a hard clip');
    assert.match(html,/<g class="hw-fusion-logo" mask="url\(#hw-fusion-wordmark-mask\)" style="opacity:0">/);
  }
  assert.ok(Math.abs(api.travelScreens('logo')-api.travelScreens()-LOGO.screens)<1e-9,'one extra screen of scroll for the intro');
  assert.match(css,/\.hw-fusion, \.hw-fusion\[data-intro="logo"\], \.hw-fusion\[data-entry="symbol"\], \.hw-fusion\[data-entry="symbol"\]\[data-intro="logo"\], \.hw-fusion\[data-entry="symbol"\]\[data-film="scale"\], \.hw-fusion\[data-entry="symbol"\]\[data-film="scale"\]\[data-intro="logo"\] \{ height: auto; \}/,'reduced motion flattens every entry/film/intro combination');
  assert.match(css,/\.hw-fusion-wordmark \{ fill: var\(--surface\); \}/);
  assert.match(main,/if\(v==="rise"\|\|v==="logo"\|\|v==="symbol"\|\|v==="symbol-rise"\)fusion\.dataset\.variant="rise";if\(v==="logo"\)fusion\.dataset\.intro="logo"/,'the V4 chooser stacks the intro on the column scene');
  assert.match(main,/name="main-v4-vision" value="logo"/,'and the tweaks panel offers it');
  assert.match(preview,/if\(v==="rise"\|\|v==="logo"\|\|v==="symbol"\|\|v==="symbol-rise"\)[^<]*if\(v==="logo"\)s\.dataset\.intro="logo"/,'the standalone preview takes ?variant=logo');
  assert.ok(preview.indexOf('</section>')<preview.indexOf('get("variant")'),'…and its chooser runs after the section exists (end of body)');
  // 글자는 머문 자리에서 사라진다(심볼을 따라 오른쪽으로 돌아오지 않는다): 좁은 화면에서 무대 밖으로 잘리지 않는다
  { const holdEnd=logoFrame(B-.001,geo),opening=logoFrame(B+(T.open[1]-T.open[0])*LOGO.travel/total*.5,geo);assert.ok(Math.abs(opening.x-holdEnd.x)<.01&&opening.shift>holdEnd.shift,'letters stay put while the symbol returns'); }
  // 원 클릭 이동의 역산: 열 판의 q 에 닿는 p
  for(const q of [0,.2,T.open[0],.7,.9,1]){assert.ok(Math.abs(logoTimeline(api.logoScroll(q,geo),geo).q-q)<1e-9,'logoScroll inverts logoTimeline at q='+q);}
  // 멈출 길이가 없으면(움직임 줄임: 섹션이 무대보다 조금 클 뿐) 도입부 없이 그대로: p=1 은 끝 장면
  for(const ts of [.5,1]){const g={...geo,travelScreens:ts};assert.deepEqual(logoTimeline(1,g),{q:1,l:1});assert.deepEqual(logoTimeline(0,g),{q:0,l:0});assert.equal(logoFrame(1,g).opacity,0);assert.ok(Math.abs(logoFrame(1,g).shift)<1e-12);}
  assert.deepEqual(require('../jll-remix-main-v4-tweaks.js').VISIONS,['fusion','rise','logo','symbol','symbol-rise','film']);
});

test('the symbol is painted in the logo red, above the column backdrop dimmer that used to darken it',()=>{
  const css=page('jll-remix-vision-fusion.css');
  assert.match(css,/--fusion-red: #e72a0f/,"the logo file's red (assets/logo.svg)");
  assert.match(css,/\.hw-fusion-red \{ fill: var\(--fusion-red\); \}/);
  assert.match(css,/\.hw-fusion-trails \{ stroke: var\(--fusion-red\); \}/);
  const z=sel=>Number((css.match(new RegExp(sel.replace(/[.[\]"]/g,'\\$&')+'\\s*\\{[^}]*z-index:\\s*(\\d+)'))||[])[1]);
  assert.ok(z('.hw-fusion-svg')>z('.hw-fusion-backdrops'),'the symbol layer sits above the backdrop layer and its 50% dimmer');
  assert.ok(z('.hw-fusion-svg')<=z('.hw-fusion-windows'),'but not above the film windows');
});

test('runtime: the logo intro reads data-intro, paints the letters during the hold and moves the pulse with the symbol',()=>{
  const {LOGO}=api,total=api.travelScreens('logo'),A=LOGO.at*LOGO.travel/total,B=(LOGO.at*LOGO.travel+LOGO.screens)/total;
  const h=fakeWindow({dataset:{variant:'rise',intro:'logo'},screens:total+1});
  assert.equal(h.handle.intro,'logo');
  h.scrollTo(A+(B-A)*.7);
  assert.equal(Number(h.logoEl.style.opacity),1,'letters are up');
  assert.match(h.wordEl.attrs.transform,/^translate\(-?[\d.]+ -?[\d.]+\) scale\([\d.]+\)$/);
  { const geo=GEOS.desktop,lg=api.logoFrame(A+(B-A)*.7,geo),states=frame(A+(B-A)*.7,geo,'rise','logo'),clipX=Math.max(...states.map(s=>s.ex+s.er));
    assert.equal(h.wordEl.attrs.transform,'translate('+lg.x.toFixed(1)+' '+lg.y.toFixed(1)+') scale('+lg.k.toFixed(4)+')','letters placed exactly as logoFrame says');
    assert.equal(h.fadeEl.attrs.x1,clipX.toFixed(1),'the mask edge sits at the symbol\'s right edge');assert.ok(Number(h.fadeEl.attrs.x2)>Number(h.fadeEl.attrs.x1),'and feathers to the right');
    assert.deepEqual([h.clipEl.attrs.x,h.clipEl.attrs.y,h.clipEl.attrs.width,h.clipEl.attrs.height],['0','0','1440','800'],'the mask rect covers the stage');
    assert.equal(h.redEl.style.opacity,'1.000','the symbol stays fully red through the hold (a p-driven opening would dim it)'); }
  assert.ok(Number(h.pulseEl.attrs.cx)<720,'the pulse follows the symbol to the left');
  assert.equal(h.section.dataset.phase,'open','the column timeline waits at the opening');
  h.scrollTo(.9);
  assert.equal(Number(h.logoEl.style.opacity),0,'letters are gone in the column scene');
  assert.equal(Number(h.pulseEl.attrs.cx),720);
});

test('runtime: without the intro the letters, mask and pulse are never touched, and frame() ignores a null intro',()=>{
  for(const dataset of [{},{variant:'rise'}]){   // (바탕 영상 창은 rise 판에서 clip-path 를 받지 않는다: 아래 별도 확인)
    const h=fakeWindow({dataset});
    for(const p of [.2,.44,.7,1])h.scrollTo(p);
    assert.equal(h.handle.intro,null);
    assert.equal(h.logoEl.style.opacity,undefined,'the markup opacity:0 is left alone');
    assert.equal(h.wordEl.attrs.transform,undefined);assert.deepEqual(h.clipEl.attrs,{});assert.deepEqual(h.fadeEl.attrs,{});
    assert.equal(Number(h.pulseEl.attrs.cx),720);
  }
  const geo=GEOS.desktop;for(let k=0;k<=100;k++)assert.deepEqual(frame(k/100,geo,'rise',null),frame(k/100,geo,'rise'));
});

test('runtime: reduced motion with the logo intro rests on the final column frame (letters hidden, symbol centred, phase full)',()=>{
  // 움직임 줄임에서는 height:auto 라 섹션이 무대보다 조금 클 뿐이다: 잰 스크롤 길이가 한 화면이 안 된다
  for(const screens of [1,1.75,2]){
    const h=fakeWindow({reduced:true,dataset:{variant:'rise',intro:'logo'},screens});
    assert.equal(h.section.dataset.phase,'full','screens '+screens);
    assert.equal(h.logoEl.style.opacity,'0.000','letters hidden, screens '+screens);
    assert.equal(Number(h.pulseEl.attrs.cx),720,'symbol centred, screens '+screens);
    for(const el of [h.wordEl,h.clipEl,h.fadeEl])for(const v of Object.values(el.attrs))assert.doesNotMatch(String(v),/NaN|Infinity/);
    h.scrollTo(.45);h.scrollTo(.75);assert.deepEqual(h.log,[]);
  }
});

test("runtime: in the logo intro a column-circle click lands on its film's turn, one held screen later than the plain column scene",()=>{
  const thumbsEls={};const scrolls=[];
  const mkThumb=w=>{const el={dataset:{window:String(w)},style:{},events:{},tabIndex:-1,addEventListener(n,fn){this.events[n]=fn;}};thumbsEls[w]=el;return el;};
  const h=fakeWindow({extraSection:{'.hw-fusion-thumb':[1,2,3,4].map(mkThumb)},dataset:{variant:'rise',intro:'logo'},smoothScroll:v=>scrolls.push(v),screens:9.4});
  h.scrollTo(.75);
  for(const w of [2,1,4,3]){
    scrolls.length=0;thumbsEls[w].events.click();
    const k=api.COLUMN.order.indexOf(w),travel=800*9.4-800,p=(scrolls[0]-1000)/travel;
    assert.ok(Math.abs(api.logoTimeline(p,{travelScreens:8.4}).q-api.seqRange(k).mid)<1e-9,'film '+w+' lands at its caption moment (q '+api.logoTimeline(p,{travelScreens:8.4}).q.toFixed(4)+')');
    assert.ok(p>api.scrollFor(api.seqRange(k).mid,null),'…which is further down the page than in the plain column scene');
  }
});

test("the 'symbol' entry (V3) skips the slogan: the scene starts two screens into the column timeline, the four dots pop into their slots in turn, and 'scale' film transitions rise small and rounded, then grow",()=>{
  const geo={...GEOS.desktop,words:[null,null,null,null,null]},{timeline,scrollFor,ENTRY,FILM,LOGO}=api;
  // 시간표: 앞 두 화면을 건너뛴다. 기본 판은 그대로. 로고 도입부와 함께면 건너뛴 뒤 멈춘다.
  assert.deepEqual(timeline(0,geo,null,'symbol'),{q:ENTRY.skip/LOGO.travel,l:0});assert.deepEqual(timeline(1,geo,null,'symbol'),{q:1,l:0});
  // 열 장면 기본 시간표: 영상 한 편에 SEQ.filmScreens, 그 밖은 기본 속도. 역산이 맞는다.
  { const D=api.travelScreens();assert.ok(Math.abs(D-(api.SEQ.start*LOGO.travel+4*api.SEQ.filmScreens+(1-api.SEQ.end)*LOGO.travel))<1e-9,'each film gets SEQ.filmScreens');
    assert.deepEqual(timeline(0,geo),{q:0,l:0});assert.deepEqual(timeline(1,geo),{q:1,l:0});
    for(const p of [.1,.3,.5,.7,.9]){const q=timeline(p,geo).q;assert.ok(Math.abs(scrollFor(q,geo)-p)<1e-9,'round trip at p='+p);} }
  { const pHold=scrollFor(LOGO.at,geo,'logo','symbol'),tot=api.travelScreens('logo','symbol');
    assert.ok(Math.abs(timeline(0,geo,'logo','symbol').q-ENTRY.skip/LOGO.travel)<1e-9);assert.equal(timeline(pHold+.5/tot,geo,'logo','symbol').q,LOGO.at,'held half a screen in');assert.deepEqual(timeline(1,geo,'logo','symbol'),{q:1,l:1}); }
  // 원래 영상 장면과 같은 박자: 영상 한 편 = 2화면(전환 1 · 머무름 1). 앞 구간은 기본 속도.
  { const S=(q)=>scrollFor(q,geo,null,'symbol','scale'),tot=api.travelScreens(null,'symbol','scale'),len=(api.SEQ.end-api.SEQ.start)/4,s1=api.SEQ.start+len;
    assert.ok(Math.abs((S(s1)-S(s1-len))*tot-ENTRY.filmScreens)<1e-9,'one film spans two screens');
    assert.ok(Math.abs((S(s1)-S(s1-FILM.cross*len))*tot-1)<1e-9,'the window transition takes one screen, like the original film scene');
    assert.ok(Math.abs((S(.5)-S(.4))*tot-.1*LOGO.travel)<1e-9,'the gather and glide keep their pace');
    assert.ok(Math.abs(tot-12.33)<1e-9&&Math.abs(api.travelScreens('logo','symbol','scale')-13.33)<1e-9,'V3 designed travel');
    assert.ok(Math.abs(api.travelScreens(null,'symbol')-(api.travelScreens()-ENTRY.skip))<1e-9&&Math.abs(api.travelScreens('logo','symbol')-(api.travelScreens('logo')-ENTRY.skip))<1e-9,'V4 = the column timeline minus the skipped slogan screens');
    for(const p of [0,.1,.3,.5,.7,.9,1]){const q=timeline(p,geo,null,'symbol','scale').q;assert.ok(Math.abs(S(q)-p)<1e-9,'round trip at p='+p);}
    // V4 = 바로 심볼 + V2처럼 그대로 올라오는 영상: 영상 구간은 기본 박자, 전환은 기본 식
    assert.ok(Math.abs((scrollFor(s1,geo,null,'symbol')-scrollFor(s1-len,geo,null,'symbol'))*api.travelScreens(null,'symbol')-api.SEQ.filmScreens)<1e-9,'V4 gives each film the column scene\'s film length');
    assert.deepEqual(api.backdropFrame(1,s1-.09*len,'rise'),api.backdropFrame(1,s1-.09*len),'V4 uses the plain rise transition'); }
  // 글도 원래 영상 장면의 박자: 영상이 앉을 때 올라오고(−.05u~+.3u), 다음 편이 올라오는 동안 빠진다(+.9u~+1.25u). 단위 u = 전환 길이
  { const len=(api.SEQ.end-api.SEQ.start)/4,u=len/2,order=api.COLUMN.order;
    for(let k=0;k<4;k++){const s=api.SEQ.start+k*len,c=order[k];
      assert.equal(captionState(c,s-.05*u,'rise','scale').opacity,0);assert.equal(captionState(c,s+.3*u,'rise','scale').opacity,1,'caption '+c+' is up as its film lands');
      if(k<3){assert.equal(captionState(c,s+1.25*u,'rise','scale').opacity,0,'and gone before the next film lands');assert.ok(captionState(c,s+.9*u,'rise','scale').opacity===1);}
      else assert.equal(captionState(c,1,'rise','scale').opacity,1,'the last caption stays');
      assert.equal(api.seqTarget(k,'scale'),s+.6*u,'a circle click lands on the held, fully captioned moment');}
    assert.deepEqual(api.seqRange(1),api.seqRange(1,'rise'),'the default column timing is unchanged'); }
  for(const q of [.3,.5,.8,1])assert.ok(Math.abs(timeline(scrollFor(q,geo,null,'symbol'),geo,null,'symbol').q-q)<1e-9,'scrollFor inverts the symbol timeline at q='+q);
  for(const q of [.3,LOGO.at,.8,1])assert.ok(Math.abs(timeline(scrollFor(q,geo,'logo','symbol'),geo,'logo','symbol').q-q)<1e-9,'…and the combined one at q='+q);
  assert.equal(scrollFor(.1,geo,null,'symbol'),0,'moments inside the skipped screens map to the moment the stage enters');
  // 점: 단어 자리가 없어도(words null) 원래처럼 한 번 휘는 궤도로 날아든다. 출발점은 보이지 않는 슬로건의 단어 자리(ENTRY.from)
  const at=q=>frame(scrollFor(q,geo,null,'symbol'),geo,'rise',null,'symbol');
  // 무대가 화면 아래로 들어오는 순간(p=0 · q0)에는 아직 점이 없다(대기하는 점 없음). 무대가 반쯤 올라오면 첫 점이 태어나 날고, 무대가 다 차면(lead 뒤) 네 점이 모두 날고 있다.
  { const q0=ENTRY.skip/LOGO.travel,qLock=q0+ENTRY.lead/LOGO.travel,starts=[1,2,3,4].map(i=>api.FLIGHT[i].start),f1=api.FLIGHT[1];
    assert.ok(at(q0).every(s=>s.er<.01),'nothing waiting as the black stage starts to rise');
    const born=(f1.start-q0)/(qLock-q0);assert.ok(born>.3&&born<.6,'the first dot is born while the stage is still rising ('+(born*100).toFixed(0)+'% of the way)');
    assert.ok(qLock>Math.max(...starts),'all four dots are flying by the time the black fills the screen');
    assert.ok(qLock<f1.start+f1.length,'…and none has landed yet');
    const lock=at(qLock);assert.ok([1,2,3,4].every(i=>lock[i].er>0&&lock[i].trailOpacity>0),'each with its tail'); }
  assert.match(fs.readFileSync(require.resolve('../jll-remix-vision-fusion.js'),'utf8'),/const lead = entry === 'symbol' \? \(win\.innerHeight \|\| h\) : 0;/,'the runtime starts the symbol timeline one viewport early');
  // 궤도 꼬리: 비행의 55% 를 덮는다(기본 판 30%)
  { const i=3,f=api.FLIGHT[i],raw=.7,q=f.start+raw*f.length,s=at(q)[i];
    const g={...geo,words:[null,...ENTRY.from.map(([ox,oy])=>({x:geo.w/2+ox*geo.w,y:geo.h/2+oy*geo.h}))]};
    const tail=api.flightPoint(i,raw-ENTRY.trail,g),head=api.flightPoint(i,raw,g);
    assert.ok(Math.hypot(s.trail[0][0]-tail[0],s.trail[0][1]-tail[1])<.5,'the tail starts 55% of the flight behind the dot');
    assert.ok(Math.hypot(s.trail[s.trail.length-1][0]-head[0],s.trail[s.trail.length-1][1]-head[1])<.5,'and ends at the dot');
    assert.equal(s.trail.length,ENTRY.trailSamples+1);assert.ok(ENTRY.trail>.3,'longer than the slogan scene\'s tail'); }
  for(let i=1;i<=4;i++){
    const f=api.FLIGHT[i],from={x:geo.w/2+ENTRY.from[i-1][0]*geo.w,y:geo.h/2+ENTRY.from[i-1][1]*geo.h},slot=[geo.w/2+geo.spacing*UNIT[i][0],geo.h/2+geo.spacing*UNIT[i][1]];
    const born=at(f.start+.02*f.length)[i],mid=at(f.start+.5*f.length)[i],done=at(f.start+f.length+.001)[i];
    assert.ok(Math.hypot(born.ex-from.x,born.ey-from.y)<Math.hypot(mid.ex-from.x,mid.ey-from.y),'dot '+i+' is born at its synthetic word spot and flies in');
    assert.ok(mid.trail.length>1&&mid.trailOpacity>0,'dot '+i+' leaves an orbit trail mid-flight');
    assert.ok(Math.abs(done.ex-slot[0])<.5&&Math.abs(done.ey-slot[1])<.5,'dot '+i+' lands on its slot');
    assert.ok(mid.er>0&&mid.er<done.er+.01,'dot '+i+' grows as it arrives');
  }
  { const a=at(.37),b=frame(.37,{...GEOS.desktop},'rise');assert.ok(a.every((s,i)=>i===0||Math.hypot(s.ex-b[i].ex,s.ey-b[i].ey)<.5),'the orbits land on the same slots as the slogan flights');
    const d=i=>Math.hypot(ENTRY.from[i-1][0]*geo.w,ENTRY.from[i-1][1]*geo.h);for(let i=1;i<=4;i++)assert.ok(d(i)>geo.h*.2,'dot '+i+' starts well outside the symbol so the orbit and tail read'); }
  assert.ok(at(T.open[1])[0].er>0&&at(T.open[1]).every(s=>s.opacity>.99),'the windows open as in the column scene');
  for(let j=0;j<=200;j++)for(const s of frame(j/200,geo,'rise',null,'symbol'))for(const key of ['ex','ey','er','opacity','tagX','tagY','x'])assert.ok(Number.isFinite(s[key]));
  // 영상 전환 scale = 원래 한화 영상 장면의 모션: 창이 66% 에서 열리며 올라오고 안의 영상은 반대로 밀린다. 앞 편은 같은 구간에 창이 닫히며 위로 빠진다. 기본(rise)은 그대로.
  const b=api.backdropFrame,len=(api.SEQ.end-api.SEQ.start)/4,s1=api.SEQ.start+len,cross=FILM.cross*len;
  { const f=b(1,s1-cross*.5,'scale');assert.ok(f.visible&&Math.abs(f.y-50)<1e-9&&Math.abs(f.size-(100-(100-FILM.size)*.5))<1e-9&&Math.abs(f.radius-FILM.radius*.5)<1e-9&&Math.abs(f.innerY-FILM.inner[0]*.5)<1e-9,'half-way: the window is half open, half-way up, the film inside pushed the other way'); }
  { const f=b(1,s1-cross+.0001,'scale');assert.ok(f.visible&&f.y>99.9&&Math.abs(f.size-FILM.size)<.01&&Math.abs(f.radius-FILM.radius)<.01,'it starts below as a 66% rounded window'); }
  { const f=b(1,s1,'scale');assert.ok(Math.abs(f.y)<1e-9&&Math.abs(f.size-100)<1e-9&&Math.abs(f.radius)<1e-9&&Math.abs(f.innerY)<1e-9,'and lands full-bleed, square, inside at rest'); }
  { const f=b(0,s1-cross*.5,'scale');assert.ok(f.visible&&Math.abs(f.y+50)<1e-9&&Math.abs(f.size-(100-(100-FILM.size)*.5))<1e-9&&Math.abs(f.innerY-FILM.inner[1]*.5)<1e-9,'the previous film closes its window and slides up out at the same time'); }
  assert.ok(!b(0,s1,'scale').visible&&b(0,s1-.0001,'scale').visible,'and is gone once the next has landed');
  { const f=b(1,s1-.09*len,'rise');assert.equal(f.size,100);assert.equal(f.radius,0);assert.equal(f.innerY,0);assert.deepEqual(b(1,s1-.09*len),f,'the default transition is unchanged');assert.ok(!b(0,s1,'rise').visible); }
  { const f0=b(0,api.SEQ.start-cross*.5,'scale');assert.ok(f0.visible&&Math.abs(f0.y-50)<1e-9&&f0.size<100&&f0.size>FILM.size,'the first film opens its window over the transition before its turn, while the column settles');assert.ok(!b(0,api.COLUMN.move[0]+.03,'scale').visible); }
  assert.ok(cross<len*.65,'the transition leaves room for the caption of each film');
  // 마크업·스타일·트윅
  const main=page('jll-remix-main-v4.html'),preview=page('jll-remix-vision-fusion.html'),css=page('jll-remix-vision-fusion.css');
  { const h=(intro,film)=>(api.travelScreens(intro,'symbol',film)-ENTRY.lead+1).toFixed(2).replace(/\.?0+$/,'').replace('.','\\.');
    assert.match(css,new RegExp('\\.hw-fusion\\[data-entry="symbol"\\] \\{ --fusion-screens: '+h(null)+'; \\}\\s*\\.hw-fusion\\[data-entry="symbol"\\]\\[data-intro="logo"\\] \\{ --fusion-screens: '+h('logo')+'; \\}\\s*\\.hw-fusion\\[data-entry="symbol"\\]\\[data-film="scale"\\] \\{ --fusion-screens: '+h(null,'scale')+'; \\}\\s*\\.hw-fusion\\[data-entry="symbol"\\]\\[data-film="scale"\\]\\[data-intro="logo"\\] \\{ --fusion-screens: '+h('logo','scale')+'; \\}'),'section heights = designed travel - lead + the stage, per combination'); }
  assert.match(css,/\.hw-fusion\[data-entry="symbol"\] \.hw-fusion-slogan \{ position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset\(50%\);/,'the slogan stays for assistive tech only');
  assert.match(main,/if\(v==="symbol"\)\{fusion\.dataset\.entry="symbol";fusion\.dataset\.film="scale";\}if\(v==="symbol-rise"\)fusion\.dataset\.entry="symbol";\}/,'the V4 chooser sets entry (+ film for V3)');
  assert.match(main,/name="main-v4-vision" value="symbol"/,'and the tweaks panel offers V3');assert.match(main,/name="main-v4-vision" value="symbol-rise"/,'and V4');
  assert.match(preview,/if\(v==="symbol"\)\{s\.dataset\.entry="symbol";s\.dataset\.film="scale";\}if\(v==="symbol-rise"\)s\.dataset\.entry="symbol";/,'the standalone preview takes ?variant=symbol and symbol-rise');
});

test("runtime: the symbol entry reads data-entry/data-film, paints scaled rounded films, and a circle click lands on its film's turn",()=>{
  const backdrops=[0,1].map(()=>({style:{},dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},load(){},play(){return Promise.resolve();},pause(){},parentElement:{classList:{contains:c=>c==='hw-fusion-film'},style:{}}}));
  const thumbsEls={};const scrolls=[];
  const mkThumb=w=>{const el={dataset:{window:String(w)},style:{},events:{},tabIndex:-1,addEventListener(n,fn){this.events[n]=fn;}};thumbsEls[w]=el;return el;};
  const tot=api.travelScreens(null,'symbol','scale');
  const h=fakeWindow({extraSection:{'.hw-fusion-backdrop':backdrops,'.hw-fusion-thumb':[1,2,3,4].map(mkThumb)},dataset:{variant:'rise',entry:'symbol',film:'scale'},smoothScroll:v=>scrolls.push(v),screens:tot});
  assert.equal(h.handle.entry,'symbol');assert.equal(h.handle.film,'scale');
  const geo={w:1440,h:800,spacing:88,travelScreens:tot},len=(api.SEQ.end-api.SEQ.start)/4,crossing=api.SEQ.start+len-api.FILM.cross*len*.4;
  h.scrollTo(api.scrollFor(crossing,geo,null,'symbol','scale'));
  const f=api.backdropFrame(1,crossing,'scale'),box=backdrops[1].parentElement;
  assert.equal(box.style.transform,'translateY('+f.y.toFixed(2)+'%)','the window rises');
  assert.equal(box.style.clipPath,'inset('+((100-f.size)/2).toFixed(2)+'% round '+f.radius.toFixed(2)+'vw)','half open with rounded corners');
  assert.equal(backdrops[1].style.transform,'translateY('+f.innerY.toFixed(2)+'%)','the film inside is pushed the other way');
  { const g=api.backdropFrame(0,crossing,'scale'),prev=backdrops[0].parentElement;assert.equal(prev.style.transform,'translateY('+g.y.toFixed(2)+'%)');assert.equal(prev.style.opacity,'1','the previous film is still on its way out'); }
  h.scrollTo(api.scrollFor(api.SEQ.start+len+.02,geo,null,'symbol','scale'));
  assert.equal(box.style.transform,'translateY(0.00%)','full-bleed once it has landed');assert.equal(box.style.clipPath,'inset(0.00% round 0.00vw)');assert.equal(backdrops[1].style.transform,'translateY(0.00%)');
  h.scrollTo(.6);scrolls.length=0;thumbsEls[4].events.click();
  const k=api.COLUMN.order.indexOf(4),p=(scrolls[0]-(1000-800))/(800*tot);
  assert.ok(Math.abs(api.timeline(p,geo,null,'symbol','scale').q-api.seqRange(k,'scale').mid)<1e-9,'the click lands on the 가능성 turn, at the film-scene caption moment');
});

test('runtime: the default column scene never clips or parallaxes its backdrop windows, and both pages wrap each backdrop video in a window',()=>{
  const backdrops=[0,1].map(()=>({style:{},dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},load(){},play(){return Promise.resolve();},pause(){},parentElement:{classList:{contains:c=>c==='hw-fusion-film'},style:{}}}));
  const h=fakeWindow({extraSection:{'.hw-fusion-backdrop':backdrops},dataset:{variant:'rise'}});
  for(const p of [.55,.72,.8,.95])h.scrollTo(p);
  for(const el of backdrops){assert.equal(el.parentElement.style.clipPath,undefined);assert.equal(el.style.transform,undefined);assert.match(el.parentElement.style.transform,/^translateY\(-?[\d.]+%\)$/);}
  for(const f of ['jll-remix-main-v4.html','jll-remix-vision-fusion.html'])assert.equal((page(f).match(/<div class="hw-fusion-film"><video class="hw-fusion-backdrop" muted playsinline loop><\/video><\/div>/g)||[]).length,2,f);
});

test("runtime: V4 (symbol entry + plain rise) skips the slogan but keeps the column scene's film transition and pace",()=>{
  const backdrops=[0,1].map(()=>({style:{},dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},load(){},play(){return Promise.resolve();},pause(){},parentElement:{classList:{contains:c=>c==='hw-fusion-film'},style:{}}}));
  const tot=api.travelScreens(null,'symbol');assert.ok(Math.abs(tot-(api.travelScreens()-api.ENTRY.skip))<1e-9);
  const h=fakeWindow({extraSection:{'.hw-fusion-backdrop':backdrops},dataset:{variant:'rise',entry:'symbol'},screens:tot});
  assert.equal(h.handle.entry,'symbol');assert.equal(h.handle.film,'rise');
  const geo={w:1440,h:800,spacing:88,travelScreens:tot},len=(api.SEQ.end-api.SEQ.start)/4,crossing=api.SEQ.start+len-.09*len;
  h.scrollTo(api.scrollFor(crossing,geo,null,'symbol'));
  const f=api.backdropFrame(1,crossing);
  assert.equal(backdrops[1].parentElement.style.transform,'translateY('+f.y.toFixed(2)+'%)','the next film simply rises');
  assert.equal(backdrops[1].parentElement.style.clipPath,undefined,'no window clip');assert.equal(backdrops[1].style.transform,undefined,'no inner parallax');
  h.scrollTo(0);assert.equal(h.section.dataset.phase,'gather');
  // 무대가 화면에 들어오는 순간(진행 0)에는 점이 하나도 그려지지 않는다
  { const rects=[];const fresh=fakeWindow({dataset:{variant:'rise',entry:'symbol'},screens:tot});fresh.scrollTo(0);assert.equal(fresh.section.dataset.phase,'gather'); }
});

test('column scene: the first caption (끊임없는 혁신) rises as soon as the circles settle into the column, with its circle growing, instead of after a wait',()=>{
  const geo=GEOS.desktop,{COLUMN,SEQ}=api,order=COLUMN.order;
  // 맨 위 원이 열에 닿는 때: t = EASE(move*1.25) = 1 → move = .8
  assert.ok(Math.abs(COLUMN.first-(COLUMN.move[0]+.8*(COLUMN.move[1]-COLUMN.move[0])))<.002,'first = the moment the top circle lands');
  const c=order[0];
  assert.equal(captionState(c,COLUMN.first,'rise').opacity,0);
  assert.equal(captionState(c,COLUMN.move[1],'rise').opacity,1,'fully up by the time the whole column has settled');
  assert.ok(captionState(c,(COLUMN.first+COLUMN.move[1])/2,'rise').opacity>0,'rising while the last circles land');
  assert.ok(COLUMN.move[1]<SEQ.start,'earlier than before (the turn used to start at SEQ.start)');
  { const f=frame(COLUMN.move[1],geo,'rise');assert.ok(f[c].er>frame(COLUMN.move[1],geo,'rise')[order[1]].er*1.2,'its circle has grown'); }
  assert.equal(api.circleActive(0,COLUMN.first-.001),0);assert.ok(api.circleActive(0,COLUMN.move[1])>.99,'the first circle becomes active as the column settles');
  for(const p of [.6,.63,.66,.69])assert.ok([1,2,3,4].map(k=>captionState(k,p,'rise').opacity).filter(o=>o>.01).length<=1,'still one caption at a time at p='+p);
  // V3(원래 영상 장면 박자)는 그대로
  assert.deepEqual(api.seqRange(0,'scale'),{in:[SEQ.start-.05*(SEQ.end-SEQ.start)/8,SEQ.start+.3*(SEQ.end-SEQ.start)/8],out:[SEQ.start+.9*(SEQ.end-SEQ.start)/8,SEQ.start+1.25*(SEQ.end-SEQ.start)/8],mid:SEQ.start+.6*(SEQ.end-SEQ.start)/8});
  assert.equal(api.circleActive(0,COLUMN.move[1],'scale'),0,'V3 keeps its own first turn');
});

test('column scenes hand over films slowly: one screen per film, the next film rises over 45% of it, and captions trade places around the rise',()=>{
  const {SEQ,backdropFrame,seqRange,COLUMN}=api,len=(SEQ.end-SEQ.start)/4,D=api.travelScreens(),pace=SEQ.filmScreens/len;   // q 단위 → 화면
  const s1=SEQ.start+len,f=k=>backdropFrame(k,s1-SEQ.cross*len*.5);
  assert.ok(SEQ.cross*len*pace>=.4,'a handover takes at least .4 screens ('+(SEQ.cross*len*pace).toFixed(2)+')');
  assert.ok(f(1).visible&&f(1).y>0&&f(1).y<100&&f(0).visible&&f(0).y<0,'half-way: the next film is part way up while the previous one is pushed up');
  assert.ok(!backdropFrame(1,s1-SEQ.cross*len-.0001).visible,'the next film waits until 45% before its turn');
  for(let k=0;k<3;k++){const c=COLUMN.order[k],n=COLUMN.order[k+1],sk=SEQ.start+k*len,r=seqRange(k),rn=seqRange(k+1);
    assert.equal(r.out[0],sk+(1-SEQ.cross)*len,'caption '+c+' leaves as the next film starts to rise');
    assert.ok(r.out[1]<=rn.in[0],'…and is gone before caption '+n+' arrives');
    assert.ok(rn.in[1]<=sk+len+.25*len,'caption '+n+' is up shortly after its film lands');
    assert.equal(captionState(c,r.mid,'rise').opacity,1);}
  assert.ok(Math.abs(D-(SEQ.start*api.LOGO.travel+4*SEQ.filmScreens+(1-SEQ.end)*api.LOGO.travel))<1e-9);
  const css=page('jll-remix-vision-fusion.css');
  assert.match(css,new RegExp('\\.hw-fusion\\[data-variant="rise"\\] \\{ --fusion-screens: '+String(+(D+1).toFixed(2)).replace('.','\\.')+'; \\}'),'column section height = designed travel + the stage');
  assert.match(css,new RegExp('\\.hw-fusion\\[data-intro="logo"\\] \\{ --fusion-screens: '+String(+(api.travelScreens('logo')+1).toFixed(2)).replace('.','\\.')+'; \\}'));
});

test('optional white start: the stage rises white and turns black as the dots begin to fly, driven continuously by the column timeline',()=>{
  const {LIGHT,lightState,FLIGHT}=api;
  assert.equal(LIGHT[0],FLIGHT[1].start,'the change starts with the first flight');
  assert.equal(lightState(LIGHT[0]),0);assert.equal(lightState(LIGHT[1]),1);assert.ok(lightState((LIGHT[0]+LIGHT[1])/2)>.3&&lightState((LIGHT[0]+LIGHT[1])/2)<.7);
  assert.ok(LIGHT[1]<=T.center[0],'black before the centre dot and the windows open');
  let prev=-1;for(let k=0;k<=100;k++){const v=lightState(k/100);assert.ok(v>=prev-1e-12);prev=v;}
  const css=page('jll-remix-vision-fusion.css');
  assert.match(css,/\.hw-fusion\[data-light="white"\], \.hw-fusion\[data-light="white"\] \.hw-fusion-stage \{ background: color-mix\(in srgb, var\(--fusion-black\) calc\(var\(--fusion-dark, 0\) \* 100%\), var\(--surface\)\); \}/,'white → black from tokens');
  assert.match(css,/\.hw-fusion\[data-light="white"\] \.hw-fusion-slogan \{ color: color-mix\(in srgb, var\(--surface\) calc\(var\(--fusion-dark, 0\) \* 100%\), var\(--ink\)\); \}/,'the slogan reads ink on the white start');
  assert.doesNotMatch(css,/hw-fusion-veil|--fusion-tail|data-fade|--fusion-light/,'no end fade, no black → white');
  assert.match(css,/\.hw-fusion \{ position: relative; --fusion-screens: 8\.4; height: calc\(var\(--hw-height\) \* var\(--fusion-screens\)\);/);
  const main=page('jll-remix-main-v4.html');
  assert.match(main,/vl=!\(s&&s\.visionLight===false\);if\(vlq==="0"\)vl=false;if\(vlq==="1"\)vl=true;if\(fusion&&vl\)fusion\.dataset\.light="white";/,'on unless switched off; ?light=0|1 previews');
  assert.match(main,/<input id="main-v4-vision-light" type="checkbox" checked>/);
  for(const html of [main,page('jll-remix-vision-fusion.html')])assert.doesNotMatch(html,/hw-fusion-veil/);
  // 런타임: 켜면 --fusion-dark 가 q 를 따르고(0 흰 → 1 검정), 끄면 0(속성이 없어 CSS 는 원래 검정)
  const on=fakeWindow({dataset:{variant:'rise',light:'white'}});
  on.scrollTo(api.scrollFor(.1,null));assert.equal(on.section.style['--fusion-dark'],'0.000','still white before the flights');
  on.scrollTo(api.scrollFor((LIGHT[0]+LIGHT[1])/2,null));assert.equal(on.section.style['--fusion-dark'],lightState((LIGHT[0]+LIGHT[1])/2).toFixed(3),'darkening with the flights');
  on.scrollTo(api.scrollFor(.35,null));assert.equal(on.section.style['--fusion-dark'],'1.000','black once the dots near the symbol');
  delete on.section.dataset.light;on.handle.paint();assert.equal(on.section.style['--fusion-dark'],'0.000','switching off takes effect at once');
});

test('optional image ground: a night-sky photo lies under everything on the stage instead of plain black, and rises in over the white start',()=>{
  const css=page('jll-remix-vision-fusion.css');
  assert.match(css,/\.hw-fusion-ground \{ display: none; position: absolute; inset: 0; z-index: 0; overflow: clip; pointer-events: none; \}/,'hidden unless a ground is chosen');
  assert.match(css,/\.hw-fusion\[data-ground="image"\] \.hw-fusion-ground \{ background: center \/ cover no-repeat url\("assets\/space-abyss\.svg\?v=\d+"\);[^}]*\}/,'the starfield is fetched only for the image ground');
  assert.match(css,/\.hw-fusion\[data-ground\^="video"\] \.hw-fusion-ground::after \{ content: ''; position: absolute; inset: 0; background: color-mix\(in srgb, var\(--fusion-black\) 55%, transparent\); \}/,'bright ground films are dimmed so the red dots read');
    assert.doesNotMatch(fs.readFileSync(require.resolve('../assets/space-abyss.svg'),'utf8').match(/<!--([\s\S]*?)-->/g).join(''),/<!--[\s\S]*--[\s\S]*-->/,'no "--" inside XML comments (it breaks the SVG)');
  { const svg=fs.readFileSync(require.resolve('../assets/space-abyss.svg'),'utf8');
    assert.deepEqual([...new Set(svg.match(/#[0-9a-f]{3,6}\b/gi).map(c=>c.toLowerCase()))].sort(),['#10252b','#181818','#fff'],'the starfield uses only existing colours (--ink, --fusion-black, --surface)');
    assert.ok((svg.match(/<circle /g)||[]).length>1200,'a dense field of stars');assert.ok(Buffer.byteLength(svg)<90000,'and stays light');
    const radii=[...svg.matchAll(/<circle cx="[\d.]+" cy="[\d.]+" r="([\d.]+)" opacity/g)].map(m=>Number(m[1]));assert.ok(radii.length>1200&&Math.max(...radii)<=1.05,'stars stay tiny (≤1px radius) so the field reads clean'); }
  assert.match(css,/\.hw-fusion\[data-ground\] \.hw-fusion-ground \{ display: block; opacity: var\(--fusion-ground, 1\); transform: scale\(calc\(1\.06 - \.06 \* var\(--fusion-ground, 1\)\)\);/,'every ground rises out of black and settles in as the dots fly');
  assert.match(css,/\.hw-fusion\[data-ground\]\[data-light="white"\], \.hw-fusion\[data-ground\]\[data-light="white"\] \.hw-fusion-stage \{ background: var\(--fusion-black\); \}/,'with a ground the stage starts black even if the white start is on');
  // 런타임: 사진 바탕이면 --fusion-ground 가 비행을 따르고, 흰 바탕 시작(--fusion-dark)은 쓰지 않는다
  const {LIGHT,lightState}=api,mid=(LIGHT[0]+LIGHT[1])/2;
  const g=fakeWindow({dataset:{variant:'rise',ground:'image',light:'white'}});
  g.scrollTo(api.scrollFor(.1,null));assert.equal(g.section.style['--fusion-ground'],'0.000','black before the flights');
  g.scrollTo(api.scrollFor(mid,null));assert.equal(g.section.style['--fusion-ground'],lightState(mid).toFixed(3),'the photo rises with the flights');assert.equal(g.section.style['--fusion-dark'],'0.000','no white start under the photo');
  g.scrollTo(api.scrollFor(.35,null));assert.equal(g.section.style['--fusion-ground'],'1.000');
  delete g.section.dataset.ground;g.handle.paint();assert.equal(g.section.style['--fusion-ground'],'0.000');assert.equal(g.section.style['--fusion-dark'],'1.000','turning the photo off brings the white start back at once');
  for(const f of ['jll-remix-main-v4.html','jll-remix-vision-fusion.html'])assert.match(page(f),/<div class="hw-fusion-stage">\n    <div class="hw-fusion-ground" aria-hidden="true"><video class="hw-fusion-ground-video" muted playsinline loop preload="none"><\/video><\/div>\n    <svg class="hw-fusion-svg"/,f+': the ground (with its film slot) is the first (lowest) layer of the stage');
  const z=sel=>Number((css.match(new RegExp(sel.replace(/[.[\]"]/g,'\\$&')+'\\s*\\{[^}]*z-index:\\s*(\\d+)'))||[])[1]);
  assert.ok(z('.hw-fusion-ground')<=z('.hw-fusion-backdrops')&&z('.hw-fusion-ground')<z('.hw-fusion-svg'),'below the films, the symbol and the windows');
});

test('runtime: a film ground loads once the scene is entered, plays only while the ground shows, and is dropped when another ground is chosen',()=>{
  const log=[];const gv={style:{},dataset:{},src:'',removeAttribute(k){if(k==='src')this.src='';},load(){log.push('load '+this.src);},play(){log.push('play');return Promise.resolve();},pause(){log.push('pause');}};
  const h=fakeWindow({dataset:{variant:'rise',ground:'video-water'},extraOne:{'.hw-fusion-ground-video':gv}});
  assert.deepEqual(log,[],'nothing is fetched before the scene is entered');
  h.scrollTo(api.scrollFor(.24,null));
  assert.deepEqual(log.splice(0),['load assets/vid/%EB%AC%BC.mp4','play'],'entering: the chosen film loads and plays while the ground rises');
  h.scrollTo(api.scrollFor(.8,null));assert.deepEqual(log.splice(0),['pause'],'covered by the column films: paused');
  h.scrollTo(api.scrollFor(.3,null));assert.deepEqual(log.splice(0),['play'],'back: plays again');
  h.section.dataset.ground='video-seoul';h.handle.paint();assert.deepEqual(log.splice(0),['load assets/vid/video1.mp4','play'],'switching film while playing loads and plays the new one');
  h.section.dataset.ground='image';h.handle.paint();assert.deepEqual(log.splice(0),['pause','load '],'switching to the starfield drops the film');
  assert.deepEqual(api.GROUND_VIDEOS,{'video-namsan':'assets/vid/Namsan.mp4','video-seoul':'assets/vid/video1.mp4','video-water':'assets/vid/%EB%AC%BC.mp4'});
  assert.match(page('jll-remix-vision-fusion.css'),/\.hw-fusion\[data-ground="image"\] \.hw-fusion-ground \{ background: center \/ cover no-repeat url\("assets\/space-abyss\.svg\?v=\d+"\); transform: none; \}/,'the starfield fades without zooming, so its tiny stars do not shimmer');
  for(const src of Object.values(api.GROUND_VIDEOS))assert.ok(fs.existsSync(require('node:path').join(__dirname,'..',decodeURIComponent(src))),src+' exists');
});
