const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {start,DEFAULT_VISION,DEFAULT_HEADER,DEFAULT_SERVICES,DEFAULT_BAR,DEFAULT_HEADER_STYLE,DEFAULT_FOOTER,DEFAULT_CAPTION,DEFAULT_CONSULT,DEFAULT_CARDS,DEFAULT_PAGE_NAV,STORAGE_VERSION}=require('../jll-remix-main-v4-tweaks.js');
// 2026-10-21: 사용자가 고른 판이 V4 기본(비전 V4 · 헤더 메뉴 줄만 · hero · 서비스 V3 · 푸터 V3 · 상담 버튼 없음 · 흰 카드 · h1 · 페이지 메뉴 숨김), 버전 20 이전 저장값은 버린다
const DEFAULTS={version:STORAGE_VERSION,offset:'auto',vision:DEFAULT_VISION,header:DEFAULT_HEADER,services:DEFAULT_SERVICES,barHeight:DEFAULT_BAR,pageNav:DEFAULT_PAGE_NAV,withSection:true,linkRule:false,headerStyle:DEFAULT_HEADER_STYLE,footer:DEFAULT_FOOTER,footerConsult:DEFAULT_CONSULT,footerCards:DEFAULT_CARDS,caption:DEFAULT_CAPTION,visionLight:true,visionGround:'video-namsan'};

test('the V4 defaults are the chosen layout and the storage version moves to 20',()=>{
  assert.deepEqual([DEFAULT_VISION,DEFAULT_HEADER,DEFAULT_HEADER_STYLE,DEFAULT_SERVICES,DEFAULT_FOOTER,DEFAULT_CONSULT,DEFAULT_CARDS,DEFAULT_CAPTION,DEFAULT_PAGE_NAV,STORAGE_VERSION],
    ['symbol-rise','bar','hero','3','3','none','white','h1',false,20]);
});

test('corner tweaks paint above the shared opaque header while leaving skip navigation on top',()=>{
  const layer=(file,selector)=>{
    const css=fs.readFileSync(require.resolve('../'+file),'utf8');
    const rule=css.slice(css.indexOf(selector+' {')+selector.length).split('}')[0];
    return Number(rule.match(/z-index:\s*(\d+)/)[1]);
  };
  const header=layer('jll-remix-hanwha.css','.hw-page .nav-shell');
  const tweak=layer('jll-remix-main-v4.css','.main-v4-tweaks');
  assert.ok(tweak>header,'a control placed over the header cannot be behind its white background');
  assert.ok(tweak<100,'the shared skip link must remain reachable above the preview controls');
});

function fixture({saved=null,storageBlocked=false,search=''}={}){
  const events={},docEvents={},observers=[],styles={};
  const control=()=>({events:{},addEventListener(name,fn){this.events[name]=fn;},setAttribute(name,value){this[name]=value;}});
  const slider=control(),reset=control(),output={},barSlider=control(),barOutput={},navToggle={...control(),checked:true},withToggle={...control(),checked:true},linkRuleToggle={...control(),checked:false},lightToggle={...control(),checked:true},groundToggle={...control(),checked:true};let refreshes=0;const rootStyle={},rootData={};
  const radios=['fusion','rise','logo','symbol','symbol-rise','film'].map(value=>({...control(),value,checked:false}));
  const headerRadios=['row','bar'].map(value=>({...control(),value,checked:false}));
  const servicesRadios=['1','2','3'].map(value=>({...control(),value,checked:false}));
  const footerRadios=['1','2','3'].map(value=>({...control(),value,checked:false}));
  const consultRadios=['contact','statement','none'].map(value=>({...control(),value,checked:false}));
  const cardsRadios=['grey','tint','blush','duo','ink','soft','white'].map(value=>({...control(),value,checked:false}));
  const groundRadios=['black','image','video-namsan','video-seoul','video-water'].map(value=>({...control(),value,checked:false}));
  const captionRadios=['h2','h1'].map(value=>({...control(),value,checked:false}));
  const headerBgRadios=['solid','hero','clear'].map(value=>({...control(),value,checked:false}));
  const headerCalls=[];let historyUrl=null;
  const summary={focus(){this.focused=true;}};
  const panel={...control(),hidden:true,open:false,contains(target){return target===slider;},
    querySelector:selector=>({'#main-v4-title-position':slider,'#main-v4-title-value':output,'#main-v4-tweaks-reset':reset,'#main-v4-bar-height':barSlider,'#main-v4-bar-value':barOutput,'#main-v4-nav-toggle':navToggle,'#main-v4-with-toggle':withToggle,'#main-v4-link-rule':linkRuleToggle,'#main-v4-vision-light':lightToggle,'#main-v4-vision-ground':groundToggle,summary})[selector],
    querySelectorAll:selector=>selector==='input[name="main-v4-vision"]'?radios:selector==='input[name="main-v4-header"]'?headerRadios:selector==='input[name="main-v4-services"]'?servicesRadios:selector==='input[name="main-v4-header-bg"]'?headerBgRadios:selector==='input[name="main-v4-footer"]'?footerRadios:selector==='input[name="main-v4-vision-ground"]'?groundRadios:selector==='input[name="main-v4-caption"]'?captionRadios:selector==='input[name="main-v4-footer-consult"]'?consultRadios:selector==='input[name="main-v4-footer-cards"]'?cardsRadios:[]};
  const copy={offsetHeight:230},bar={offsetHeight:138,bottom:null};
  const hero={offsetHeight:700,style:{setProperty(name,value){styles[name]=value;}},
    querySelector:selector=>({'.hw-hero-copy':copy,'.main-v4-stories':bar})[selector]};
  let stored=saved,reloads=0,replaced=null;
  const win={location:{search,href:'http://localhost/jll-remix-main-v4.html'+search,reload(){reloads+=1;},replace(url){replaced=url;reloads+=1;}},
    getComputedStyle:element=>({bottom:element===bar?(bar.bottom??28)+'px':'auto'}),
    document:{documentElement:{dataset:rootData,style:{setProperty(k,v){rootStyle[k]=v;}}},querySelector:selector=>({'.main-v4-tweaks':panel,'#hw-intro':hero})[selector],addEventListener(name,fn){docEvents[name]=fn;}},
    localStorage:{getItem(){if(storageBlocked)throw Error('blocked');return stored;},setItem(key,value){if(storageBlocked)throw Error('blocked');stored=value;}},
    addEventListener(name,fn){events[name]=fn;},
    SPSHeader:{setCondenseMode(mode){headerCalls.push(mode);},refresh(){refreshes++;}},history:{replaceState(_,__,url){historyUrl=url;}},
    ResizeObserver:class{constructor(fn){this.fn=fn;}observe(element){observers.push({element,fn:this.fn});}}
  };
  start(win);
  return {panel,slider,reset,output,summary,radios,copy,bar,hero,styles,events,docEvents,observers,
    stored:()=>JSON.parse(stored),reloads:()=>reloads,replaced:()=>replaced,move(value){slider.value=String(value);slider.events.input();},
    pick(value){radios.forEach(r=>{r.checked=r.value===value;});radios.find(r=>r.value===value).events.change();},
    headerRadios,headerCalls,historyUrl:()=>historyUrl,servicesRadios,barSlider,barOutput,rootStyle,refreshes:()=>refreshes,
    moveBar(v){barSlider.value=String(v);barSlider.events.input();},consultRadios,cardsRadios,
    pickConsult(value){consultRadios.forEach(r=>{r.checked=r.value===value;});consultRadios.find(r=>r.value===value).events.change();},
    pickCards(value){cardsRadios.forEach(r=>{r.checked=r.value===value;});cardsRadios.find(r=>r.value===value).events.change();},navToggle,lightToggle,groundRadios,pickGround(value){groundRadios.forEach(r=>{r.checked=r.value===value;});groundRadios.find(r=>r.value===value).events.change();},rootData,
    toggleNav(on){navToggle.checked=on;navToggle.events.change();},withToggle,toggleWith(on){withToggle.checked=on;withToggle.events.change();},linkRuleToggle,toggleLinkRule(on){linkRuleToggle.checked=on;linkRuleToggle.events.change();},headerBgRadios,
    pickHeaderBg(value){headerBgRadios.forEach(r=>{r.checked=r.value===value;});headerBgRadios.find(r=>r.value===value).events.change();},
    pickServices(value){servicesRadios.forEach(r=>{r.checked=r.value===value;});servicesRadios.find(r=>r.value===value).events.change();},
    footerRadios,pickFooter(value){footerRadios.forEach(r=>{r.checked=r.value===value;});footerRadios.find(r=>r.value===value).events.change();},
    captionRadios,pickCaption(value){captionRadios.forEach(r=>{r.checked=r.value===value;});captionRadios.find(r=>r.value===value).events.change();},
    pickHeader(value){headerRadios.forEach(r=>{r.checked=r.value===value;});headerRadios.find(r=>r.value===value).events.change();}};
}

test('V4 opens with a collapsed panel, seats the headline above the bar by default and restores a saved position',()=>{
  const h=fixture();
  assert.equal(h.panel.hidden,false);assert.equal(h.panel.open,false);
  assert.equal(h.output.value,'기본(바 위)');assert.equal(h.styles['--main-title-offset'],'16px','default seats the headline 48px above the story bar');
  assert.deepEqual(h.stored(),DEFAULTS);
  h.move(100);assert.equal(h.styles['--main-title-offset'],'100px');
  assert.equal(h.output.value,'위 100px');assert.equal(h.slider['aria-valuetext'],'위 100px');
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.equal(restored.styles['--main-title-offset'],'100px');
});

test('headline movement stays between the hero top and story bar after wrapping, resizing and theme changes',()=>{
  const h=fixture();
  assert.equal(h.slider.max,'248');
  h.move(-20);assert.equal(h.output.value,'아래 20px');
  h.move(240);assert.equal(h.styles['--main-title-offset'],'240px');
  h.hero.offsetHeight=520;h.events.resize();
  assert.equal(h.styles['--main-title-offset'],'68px');assert.equal(h.slider.value,'68');
  h.hero.offsetHeight=700;h.events.resize();
  assert.equal(h.styles['--main-title-offset'],'240px');
  h.copy.offsetHeight=330;h.observers.find(item=>item.element===h.copy).fn();
  assert.equal(h.styles['--main-title-offset'],'148px');
  h.bar.offsetHeight=220;h.events['sps-theme-change']();
  assert.equal(h.styles['--main-title-offset'],'66px');
  const bottom=h.bar.offsetHeight+32+Number.parseFloat(h.styles['--main-title-offset']);
  assert.ok(bottom>=h.bar.offsetHeight+12);
  assert.ok(h.hero.offsetHeight-bottom-h.copy.offsetHeight>=24);
});

test('payloads older than version 20 are ignored once so everyone starts from the new defaults; version-20 choices survive; retired fields are dropped',()=>{
  const legacy=fixture({saved:'{"version":2,"offset":0,"showNav":false,"fontToken":"--hero-title-size","barInset":24}'});
  assert.equal(legacy.styles['--main-title-offset'],'16px');
  assert.deepEqual(legacy.stored(),DEFAULTS);
  const old=fixture({saved:JSON.stringify({version:19,offset:80,vision:'fusion',header:'row',services:'1',footer:'1',footerConsult:'contact',footerCards:'grey',caption:'h2',pageNav:true,headerStyle:'solid'})});
  assert.equal(old.styles['--main-title-offset'],'16px','an auto-saved old layout does not override the new defaults');
  assert.deepEqual(old.stored(),DEFAULTS);
  const custom=fixture({saved:'{"version":20,"offset":40}'});
  assert.equal(custom.styles['--main-title-offset'],'40px');
  assert.equal(custom.stored().vision,DEFAULT_VISION,'a payload without a vision choice keeps the default scene');
});

test('the vision scene choice persists and reloads the page; reset restores both the position and the default scene',()=>{
  const h=fixture();
  assert.deepEqual(h.radios.map(r=>r.checked),[false,false,false,false,true,false],'V4 (symbol-rise) is the default scene');
  h.pick('film');
  assert.equal(h.stored().vision,'film');assert.equal(h.reloads(),1);
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.deepEqual(restored.radios.map(r=>r.checked),[false,false,false,false,false,true]);
  restored.pick('film');assert.equal(restored.reloads(),0,'re-selecting the current scene does nothing');
  restored.move(200);
  restored.reset.events.click();
  assert.equal(restored.styles['--main-title-offset'],'16px');
  assert.equal(restored.stored().vision,DEFAULT_VISION);assert.equal(restored.stored().offset,'auto');
  assert.equal(restored.reloads(),1,'switching back to the default scene reloads once');
  const unchanged=fixture({saved:'{"version":20,"offset":120,"vision":"symbol-rise"}'});
  unchanged.reset.events.click();
  assert.equal(unchanged.reloads(),0,'reset without a scene change does not reload');
  assert.equal(unchanged.styles['--main-title-offset'],'16px');
});

test('dismissal leaves focus accessible and outside pointer closes the panel',()=>{
  const h=fixture();
  h.panel.open=true;h.docEvents.pointerdown({target:h.slider});assert.equal(h.panel.open,true);
  h.docEvents.pointerdown({target:{}});assert.equal(h.panel.open,false);
  h.panel.open=true;let prevented=false;
  h.panel.events.keydown({key:'Escape',preventDefault(){prevented=true;}});
  assert.equal(h.panel.open,false);assert.equal(h.summary.focused,true);assert.equal(prevented,true);
});

test('unavailable or malformed storage fails open; embedded comparison previews get no controls',()=>{
  for(const options of [{storageBlocked:true},{saved:'{bad json'},{saved:'[]'}]){
    const h=fixture(options);assert.equal(h.output.value,'기본(바 위)');assert.equal(h.panel.hidden,false);
  }
  const embedded=fixture({search:'?embed=1'});
  assert.equal(embedded.panel.hidden,true);assert.equal(embedded.observers.length,0);
});

test('?title= previews a placement rule without saving it',()=>{
  const centered=fixture({search:'?title=center'});
  assert.equal(centered.styles['--main-title-offset'],'120px');
  assert.equal(centered.stored().offset,'auto');
  const pixels=fixture({search:'?title=90'});
  assert.equal(pixels.styles['--main-title-offset'],'90px');
});

test('saved title offsets stay above the mobile stories and restore on a larger viewport',()=>{
  const h=fixture();h.move(240);
  h.hero.offsetHeight=680;h.bar.offsetHeight=210;h.bar.bottom=0;h.copy.offsetHeight=240;
  h.events.resize();
  const offset=Number.parseFloat(h.styles['--main-title-offset']);
  assert.equal(offset,174);
  const bottom=h.bar.offsetHeight+h.bar.bottom+32+offset;
  assert.equal(h.hero.offsetHeight-bottom-h.copy.offsetHeight,24);
  assert.equal(h.stored().offset,240,'responsive clamping does not overwrite the desktop preference');
  h.hero.offsetHeight=900;h.bar.bottom=0;h.events.resize();
  assert.equal(h.styles['--main-title-offset'],'240px');
});

test('?vision= previews a scene without saving it; the panel shows the rendered scene and switching clears the query',()=>{
  const h=fixture({search:'?vision=film'});
  assert.deepEqual(h.radios.map(r=>r.checked),[false,false,false,false,false,true],'the radio reflects the scene the chooser rendered');
  assert.equal(h.stored().vision,DEFAULT_VISION,'the preview is not persisted');
  h.pick('film');assert.equal(h.reloads(),0,'re-selecting the shown scene does nothing');
  h.pick('fusion');
  assert.equal(h.stored().vision,'fusion');assert.equal(h.reloads(),1);
  assert.ok(h.replaced()&&!h.replaced().includes('vision='),'navigates to the URL without the preview query');
  const saved=fixture({search:'?vision=symbol-rise',saved:'{"version":20,"offset":"auto","vision":"film"}'});
  assert.deepEqual(saved.radios.map(r=>r.checked),[false,false,false,false,true,false]);
  saved.reset.events.click();assert.equal(saved.reloads(),0,'the shown scene is already the default');
});

test('the header condense style persists, applies to the shared header at once without a reload, previews via ?condense= and resets',()=>{
  const h=fixture();
  assert.deepEqual(h.headerRadios.map(r=>r.checked),[false,true],'메뉴 줄만 (bar) is the default');
  assert.deepEqual(h.headerCalls,['bar'],'the saved style is applied on start');
  h.pickHeader('row');
  assert.equal(h.stored().header,'row');assert.deepEqual(h.headerCalls,['bar','row']);assert.equal(h.reloads(),0,'no reload: the header re-measures itself');
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.deepEqual(restored.headerRadios.map(r=>r.checked),[true,false]);assert.deepEqual(restored.headerCalls,['row']);
  restored.pickHeader('row');assert.equal(restored.headerCalls.length,1,'re-selecting the current style does nothing');
  restored.reset.events.click();
  assert.equal(restored.stored().header,DEFAULT_HEADER);assert.deepEqual(restored.headerCalls,['row','bar']);
  assert.equal(restored.reloads(),0,'reset without a scene change does not reload');
  const preview=fixture({search:'?condense=row'});
  assert.deepEqual(preview.headerRadios.map(r=>r.checked),[true,false],'the panel shows the previewed style');
  assert.deepEqual(preview.headerCalls,['row']);assert.equal(preview.stored().header,DEFAULT_HEADER,'a preview is not saved');
  preview.pickHeader('bar');
  assert.equal(preview.stored().header,'bar');assert.match(preview.historyUrl(),/^http:\/\/localhost\/jll-remix-main-v4\.html$/,'choosing clears the preview query without reloading');
  const html=require('node:fs').readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/if\(sv&&!\(sv\.version>=20\)\)sv=null;if\(!\(sv&&sv\.header==="row"\)\)document\.documentElement\.dataset\.spsCondense="bar";/,'the head script condenses to the bar unless the row was chosen');
  assert.match(html,/name="main-v4-header" value="bar" checked/);
});

test('the service-section choice (원래 · V2 · V3) persists and reloads; a ?services= preview is shown but not saved; reset restores the original',()=>{
  const h=fixture();
  assert.deepEqual(h.servicesRadios.map(r=>r.checked),[false,false,true],'V3 is the default');
  h.pickServices('2');
  assert.equal(h.stored().services,'2');assert.equal(h.reloads(),1);
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.deepEqual(restored.servicesRadios.map(r=>r.checked),[false,true,false]);
  restored.pickServices('2');assert.equal(restored.reloads(),0,'re-selecting the shown section does nothing');
  restored.reset.events.click();
  assert.equal(restored.stored().services,DEFAULT_SERVICES);assert.equal(restored.reloads(),1,'reset reloads once');
  const preview=fixture({search:'?services=1'});
  assert.deepEqual(preview.servicesRadios.map(r=>r.checked),[true,false,false]);
  assert.equal(preview.stored().services,DEFAULT_SERVICES,'a preview is not saved');
  preview.pickServices('2');
  assert.equal(preview.stored().services,'2');assert.match(preview.replaced(),/jll-remix-main-v4\.html$/,'choosing clears the preview query');
  const html=require('node:fs').readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/name="main-v4-services" value="3" checked/);
  assert.match(html,/if\(sv!=="1"&&sv!=="2"\)sv="3";document\.documentElement\.dataset\.services=sv;/,'the inline chooser falls back to V3');
  assert.match(html,/var keep=\{"1":"hw-business","2":"hw-services2","3":"hw-services3"\}\[sv\]/,'the inline chooser keeps exactly one service section');
  assert.match(html,/querySelectorAll\('a\[href="#hw-business"\]'\)/,'links to the removed original are redirected to the kept section');
});

test('the menu-bar height slider (52–80px, default 58) writes --sps-bar-height, asks the header to re-measure, persists and resets',()=>{
  const h=fixture();
  assert.equal(h.rootStyle['--sps-bar-height'],'58px');assert.equal(h.barOutput.value,'58px');assert.ok(h.refreshes()>=1);
  h.moveBar(72);
  assert.equal(h.rootStyle['--sps-bar-height'],'72px');assert.equal(h.stored().barHeight,72);assert.equal(h.reloads(),0,'applies live');
  h.moveBar(200);assert.equal(h.stored().barHeight,80,'clamped to 80');
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.equal(restored.rootStyle['--sps-bar-height'],'80px');
  restored.reset.events.click();
  assert.equal(restored.stored().barHeight,DEFAULT_BAR);assert.equal(restored.rootStyle['--sps-bar-height'],'58px');
  const html=require('node:fs').readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/<input id="main-v4-bar-height" type="range" min="52" max="80" step="2" value="58">/);
});

test('the 페이지 메뉴 표시 toggle is off by default (html[data-page-nav="off"] from the first paint), shows the menu live, persists and resets to hidden',()=>{
  const h=fixture();
  assert.equal(h.navToggle.checked,false);assert.equal(h.rootData.pageNav,'off');
  h.toggleNav(true);
  assert.equal(h.rootData.pageNav,undefined);assert.equal(h.stored().pageNav,true);assert.equal(h.reloads(),0);
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.equal(restored.rootData.pageNav,undefined);assert.equal(restored.navToggle.checked,true);
  restored.reset.events.click();
  assert.equal(restored.rootData.pageNav,'off');assert.equal(restored.stored().pageNav,false);
  const css=require('node:fs').readFileSync(require.resolve('../jll-remix-main-v4.css'),'utf8');
  assert.match(css,/html\[data-page-nav="off"\] \.hw-main-v4 \.main-v4-page-nav \{ display:none !important; \}/);
  const html=require('node:fs').readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/<input id="main-v4-nav-toggle" type="checkbox">/);
  assert.match(html,/if\(!\(s&&s\.pageNav===true\)\)document\.documentElement\.dataset\.pageNav="off";/,'hidden before the tweak script runs');
});

test('the 더 알아보기 toggle hides #hw-with and its page-menu entry via html[data-with-section="off"], live and persisted, painted early by the chooser, and resets to shown',()=>{
  const h=fixture();
  assert.equal(h.withToggle.checked,true);assert.equal(h.rootData.withSection,undefined);
  h.toggleWith(false);
  assert.equal(h.rootData.withSection,'off');assert.equal(h.stored().withSection,false);assert.equal(h.reloads(),0,'applies without a reload');
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.equal(restored.rootData.withSection,'off');assert.equal(restored.withToggle.checked,false);
  restored.reset.events.click();
  assert.equal(restored.rootData.withSection,undefined);assert.equal(restored.stored().withSection,true);
  const fsx=require('node:fs');
  const css=fsx.readFileSync(require.resolve('../jll-remix-main-v4.css'),'utf8');
  assert.match(css,/html\[data-with-section="off"\] \.hw-main-v4 :is\(#hw-with, \.main-v4-page-nav a\[href="#hw-with"\]\) \{ display:none !important; \}/);
  const html=fsx.readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/<input id="main-v4-with-toggle" type="checkbox" checked>/);
  assert.match(html,/if\(s&&s\.withSection===false\)document\.documentElement\.dataset\.withSection="off";/,'hidden from the first paint');
});

test('footer consult button: 기본 자리 · 문장 아래 · 없음 is saved and applied by a reload; the chooser writes it on the footer host for every footer',()=>{
  const h=fixture();
  assert.deepEqual(h.consultRadios.map(r=>r.checked),[false,false,true],'없음 by default');
  h.pickConsult('statement');
  assert.equal(h.stored().footerConsult,'statement');assert.equal(h.reloads(),1,'the footer is re-rendered on reload');
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.deepEqual(restored.consultRadios.map(r=>r.checked),[false,true,false]);
  restored.reset.events.click();
  assert.equal(restored.stored().footerConsult,'none');assert.equal(restored.reloads(),1,'reset brings the default back with one reload');
  const fsx=require('node:fs'),html=fsx.readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/var fc=\(s&&s\.footerConsult\)\|\|"none",/,'the inline chooser defaults to no button');
  assert.match(html,/name="main-v4-footer-consult" value="none" checked/);
  assert.match(html,/if\(footerHost&&\(fc==="contact"\|\|fc==="statement"\|\|fc==="none"\)\)footerHost\.dataset\.footerConsult=fc;/,'the chooser always hands the choice to the shared footer (whose own default is 없음)');
  assert.equal((html.match(/name="main-v4-footer-consult"/g)||[]).length,3);
});

test('footer V3 card colours switch live through html[data-footer-cards] (흰 종이 by default) using only existing tokens',()=>{
  const h=fixture();
  assert.equal(h.rootData.footerCards,'white');assert.deepEqual(h.cardsRadios.map(r=>r.checked),[false,false,false,false,false,false,true]);
  h.pickCards('blush');assert.equal(h.rootData.footerCards,'blush','연한 빨강 on both cards');
  h.pickCards('soft');
  assert.equal(h.rootData.footerCards,'soft');assert.equal(h.stored().footerCards,'soft');assert.equal(h.reloads(),0,'no reload');
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.equal(restored.rootData.footerCards,'soft');
  restored.reset.events.click();
  assert.equal(restored.rootData.footerCards,'white');assert.equal(restored.stored().footerCards,'white');
  assert.equal(fixture({saved:JSON.stringify({version:19,footerCards:'grey'})}).rootData.footerCards,'white','an old stored colour moves to the new default');
  assert.equal(fixture({saved:JSON.stringify({version:20,footerCards:'tint'})}).rootData.footerCards,'tint','a colour chosen after the change is kept');
  assert.equal(fixture({saved:JSON.stringify({version:20,footerCards:'duo'})}).rootData.footerCards,'duo','먹색 · 빨강 chosen after the change is kept');
  const fsx=require('node:fs'),html=fsx.readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/document\.documentElement\.dataset\.footerCards=fk;/,'painted from the first frame');
  assert.match(html,/fk=\(s&&s\.footerCards\)\|\|"white";/);assert.match(html,/if\(cardsList\.indexOf\(fk\)<0\)fk="white";/);
  assert.match(html,/name="main-v4-footer-cards" value="white" checked/);
  const css=fsx.readFileSync(require.resolve('../jll-remix-footer.css'),'utf8'),block=css.slice(css.indexOf('/* 자료 카드 색'));
  assert.match(block,/html\[data-footer-cards="duo"\] \.sps-footer\[data-variant="3"\] \.sps-footer-v2-card\[data-resource="brochure"\] \{[^}]*--fv3-card-bg: var\(--red\);/);
  assert.match(block,/html\[data-footer-cards="tint"\] \.sps-footer\[data-variant="3"\] \.sps-footer-v2-card\[data-resource="profile"\],\s*html\[data-footer-cards="blush"\] \.sps-footer\[data-variant="3"\] \.sps-footer-v2-card \{ --fv3-card-bg: color-mix\(in srgb, var\(--red\) 12%, var\(--surface\)\);/,'연한 빨강 (tint 왼쪽 · blush 두 장)');
  assert.match(block,/html\[data-footer-cards="tint"\] \.sps-footer\[data-variant="3"\] \.sps-footer-v2-card\[data-resource="brochure"\],\s*html\[data-footer-cards="grey"\] \.sps-footer\[data-variant="3"\] \.sps-footer-v2-card \{ --fv3-card-bg: color-mix\(in srgb, var\(--ink\) 12%, var\(--surface\)\);/,'연한 먹색 (tint 오른쪽 · grey 두 장)');
  assert.match(block,/--fv3-card-bg: var\(--ink\);/);assert.match(block,/--fv3-card-bg: var\(--peach\);/);assert.match(block,/--fv3-card-bg: var\(--surface-sage\);/);assert.doesNotMatch(block,/--fv3-card-bg: var\(--rose-soft\)/,'--rose-soft is grey in the V4 theme');
  assert.doesNotMatch(block,/#[0-9a-f]{3,6}\b|rgb\(/i,'no new colours');
});

test('a bar height stored before version 20 falls back to the 58px default; a version-20 height survives',()=>{
  const old=fixture({saved:'{"version":19,"offset":"auto","barHeight":70}'});
  assert.equal(old.rootStyle['--sps-bar-height'],'58px');assert.equal(old.stored().barHeight,58);
  const chosen=fixture({saved:'{"version":20,"offset":"auto","barHeight":70}'});
  assert.equal(chosen.rootStyle['--sps-bar-height'],'70px');
  const current=fixture({saved:'{"version":20,"offset":"auto","barHeight":64}'});
  assert.equal(current.rootStyle['--sps-bar-height'],'64px','a chosen 64 is respected');
});


test('the 헤더 배경 choice (흰색 · 히어로에서 투명 · 항상 투명) persists and reloads; ?headerbg= previews without saving; reset restores 히어로에서 투명',()=>{
  const h=fixture();
  assert.deepEqual(h.headerBgRadios.map(r=>r.checked),[false,true,false],'히어로에서 투명 is the default');
  h.pickHeaderBg('solid');
  assert.equal(h.stored().headerStyle,'solid');assert.equal(h.reloads(),1,'the overlay changes layout, so the page reloads');
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.deepEqual(restored.headerBgRadios.map(r=>r.checked),[true,false,false]);
  restored.reset.events.click();
  assert.equal(restored.stored().headerStyle,DEFAULT_HEADER_STYLE);assert.equal(restored.reloads(),1);
  const preview=fixture({search:'?headerbg=clear'});
  assert.deepEqual(preview.headerBgRadios.map(r=>r.checked),[false,false,true]);assert.equal(preview.stored().headerStyle,DEFAULT_HEADER_STYLE,'a preview is not saved');
  const html=require('node:fs').readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/if\(hs==="hero"\|\|hs==="clear"\)document\.documentElement\.dataset\.headerStyle=hs;/,'the head script applies the saved style before first paint');
  assert.match(html,/hs="hero";try\{var sh=JSON\.parse\(localStorage\.getItem\("sps-main-v4-layout-tweaks-v1"\)\);if\(sh&&sh\.version>=20&&sh\.headerStyle\)hs=sh\.headerStyle;\}catch\(e\)\{\}/,'hero unless a version-20 choice says otherwise');
  assert.match(html,/name="main-v4-header-bg" value="hero" checked/);
  assert.match(html,/if\(document\.documentElement\.dataset\.headerStyle\)document\.body\.setAttribute\("data-overlay-header",""\);/,'and marks the body so the shared overlay script tracks the hero');
  const css=require('node:fs').readFileSync(require.resolve('../jll-remix-main-v4.css'),'utf8');
  assert.match(css,/html\[data-header-style\] \.hw-main-v4 #main \{ margin-top:calc\(-1 \* var\(--sps-header-height,137px\)\); \}/,'the hero slides under the header');
  assert.match(css,/html\[data-header-style="hero"\] \.hw-main-v4 \[data-sps-header\]\.is-over-film,\r?\nhtml\[data-header-style="clear"\] \.hw-main-v4:not\(\.sps-menu-open\) \[data-sps-header\] \{ background-size:100% 0;/,'transparent over the hero; always transparent in clear mode');
  assert.match(css,/\.is-over-film \.brand-logo \{ content:url\('assets\/logo-on-film\.svg'\); \}/,'white logo over the hero');
});

test('the footer choice (원래 · V2) persists and reloads; a ?footer= preview is shown but not saved; reset restores the original; the chooser marks the shared footer host',()=>{
  const h=fixture();
  assert.deepEqual(h.footerRadios.map(r=>r.checked),[false,false,true],'V3 is the default');
  h.pickFooter('2');
  assert.equal(h.stored().footer,'2');assert.equal(h.reloads(),1);
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.deepEqual(restored.footerRadios.map(r=>r.checked),[false,true,false]);
  restored.pickFooter('2');assert.equal(restored.reloads(),0,'re-selecting the shown footer does nothing');
  restored.reset.events.click();
  assert.equal(restored.stored().footer,DEFAULT_FOOTER);assert.equal(restored.reloads(),1,'reset reloads once');
  const preview=fixture({search:'?footer=2'});
  assert.deepEqual(preview.footerRadios.map(r=>r.checked),[false,true,false]);
  assert.equal(preview.stored().footer,DEFAULT_FOOTER,'a preview is not saved');
  preview.pickFooter('1');
  assert.equal(preview.stored().footer,'1');assert.match(preview.replaced(),/jll-remix-main-v4\.html$/,'choosing clears the preview query');
  const html=require('node:fs').readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/name="main-v4-footer" value="3" checked/);
  assert.match(html,/var fv=\(s&&s\.footer\)\|\|null,qf=new URLSearchParams\(location\.search\)\.get\("footer"\);if\(qf==="1"\|\|qf==="2"\|\|qf==="3"\)fv=qf;if\(fv!=="1"&&fv!=="2"\)fv="3";/,'the inline chooser reads the saved choice or ?footer=, falling back to V3');
  assert.match(html,/if\(footerHost\)footerHost\.dataset\.footerVariant=fv;/,'and always marks the shared footer host (V1 too, since the shared default is V3) before the footer script mounts');
  { const v1=fixture({search:'?footer=1'});assert.deepEqual(v1.footerRadios.map(r=>r.checked),[true,false,false],'V1 previews too');assert.match(html,/name="main-v4-footer" value="1"/); }
  assert.ok(html.indexOf('data-sps-footer')<html.indexOf('footerHost.dataset.footerVariant'),'the host is parsed before the chooser runs');
});

test("the 'logo' scene (올라오는 장면 V2) persists, reloads, previews via ?vision=logo and resets to the default",()=>{
  const h=fixture();h.pick('logo');
  assert.equal(h.stored().vision,'logo');assert.equal(h.reloads(),1);
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.deepEqual(restored.radios.map(r=>r.checked),[false,false,true,false,false,false]);
  restored.pick('logo');assert.equal(restored.reloads(),0,'re-selecting V2 does nothing');
  restored.reset.events.click();
  assert.equal(restored.stored().vision,DEFAULT_VISION);assert.equal(restored.reloads(),1,'reset reloads once so the intro is dropped');
  const preview=fixture({search:'?vision=logo'});
  assert.deepEqual(preview.radios.map(r=>r.checked),[false,false,true,false,false,false]);
  assert.equal(preview.stored().vision,DEFAULT_VISION,'a preview is not saved');
});

test("the caption-size choice (섹션 제목 36 · 중간 단계 44) applies at once through html[data-caption-size], persists, previews via ?caption= and resets",()=>{
  const h=fixture();
  assert.deepEqual(h.captionRadios.map(r=>r.checked),[false,true],'중간 단계 (h1) is the default');assert.equal(h.stored().caption,'h1');
  assert.equal(h.rootData.captionSize,'h1','the default keeps html[data-caption-size="h1"] (44px), not the 36px fallback');
  h.pickCaption('h2');
  assert.notEqual(h.rootData.captionSize,'h1');assert.equal(h.stored().caption,'h2');assert.equal(h.reloads(),0,'no reload: the type scale reads the attribute');
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.notEqual(restored.rootData.captionSize,'h1');assert.deepEqual(restored.captionRadios.map(r=>r.checked),[true,false]);
  restored.reset.events.click();
  assert.equal(restored.stored().caption,DEFAULT_CAPTION);assert.deepEqual(restored.captionRadios.map(r=>r.checked),[false,true]);
  assert.equal(restored.rootData.captionSize,'h1','reset brings the 44px caption back');
  const preview=fixture({search:'?caption=h2'});
  assert.notEqual(preview.rootData.captionSize,'h1');assert.deepEqual(preview.captionRadios.map(r=>r.checked),[true,false]);assert.equal(preview.stored().caption,DEFAULT_CAPTION,'a preview is not saved');
  preview.pickCaption('h1');assert.ok(preview.historyUrl()&&!preview.historyUrl().includes('caption='),'choosing clears the preview query');
  const html=require('node:fs').readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/name="main-v4-caption" value="h1" checked/);assert.match(html,/name="main-v4-caption" value="h2"/);
  assert.match(html,/var cs=\(s&&s\.caption\)\|\|"h1",/,'the inline chooser defaults to h1');
  assert.match(html,/if\(cs==="h1"\)document\.documentElement\.dataset\.captionSize="h1";/,'the inline chooser pre-applies the saved size');
  const scale=require('node:fs').readFileSync(require.resolve('../jll-remix-main-v4-typescale.css'),'utf8');
  assert.match(scale,/--ts-h2: 36px; --ts-h1: 44px; --ts-display: 56px;/,'the foundation gains a 44px step between the section title and the display size');
  assert.match(scale,/--ts-h2: 32px; --ts-h1: 38px; \}/);assert.match(scale,/--ts-h2: 28px; --ts-h1: 30px;/);
  assert.match(scale,/html\[data-caption-size="h1"\]:not\(\[data-typescale="0"\]\) \.hw-main-v4 \.hw-fusion\[data-variant="rise"\] \.hw-fusion-caption p:last-child \{ font-size: var\(--ts-h1\); line-height: 1\.3; \}/);
  assert.match(scale,/html\[data-caption-size="h1"\] \.hw-main-v4 \.hw-fusion\[data-variant="rise"\] \.hw-fusion-caption \{ width: min\(720px,[^}]*right: max\(24px, calc\(var\(--fusion-left\) - 56px\)\);/,'the box widens so two lines still fit and sits 56px further right');
});

test('the vision light-start toggle is on by default, applies at once without a reload, persists, previews via ?light= and resets to on',()=>{
  const h=fixture();
  assert.equal(h.lightToggle.checked,true);
  h.lightToggle.checked=false;h.lightToggle.events.change();
  assert.equal(h.stored().visionLight,false);assert.equal(h.reloads(),0,'applied live (the scene reads data-light every frame)');
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.equal(restored.lightToggle.checked,false);
  restored.reset.events.click();
  assert.equal(restored.stored().visionLight,true);assert.equal(restored.lightToggle.checked,true);
  const preview=fixture({search:'?light=0'});assert.equal(preview.lightToggle.checked,false,'?light=0 previews the black start');assert.equal(preview.stored().visionLight,true,'and is not saved');
});

test('the vision ground choice (검정 · 우주 · 히어로 첫 영상 · 영상 둘) defaults to the hero film, applies at once, persists, previews via ?ground= and resets',()=>{
  const h=fixture();
  assert.deepEqual(h.groundRadios.map(r=>r.checked),[false,false,true,false,false],'the hero\'s first film is the default');
  h.pickGround('image');
  assert.equal(h.stored().visionGround,'image');assert.equal(h.reloads(),0,'no reload: the scene reads data-ground every frame');
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.deepEqual(restored.groundRadios.map(r=>r.checked),[false,true,false,false,false]);
  restored.reset.events.click();
  assert.equal(restored.stored().visionGround,'video-namsan');assert.deepEqual(restored.groundRadios.map(r=>r.checked),[false,false,true,false,false]);
  const preview=fixture({search:'?ground=video-water'});assert.deepEqual(preview.groundRadios.map(r=>r.checked),[false,false,false,false,true]);assert.equal(preview.stored().visionGround,'video-namsan','a preview is not saved');
  const migrated=fixture({saved:JSON.stringify({version:19,visionGround:'image'})});assert.equal(migrated.stored().visionGround,'video-namsan','a ground stored before version 20 falls back to the default');
  const kept=fixture({saved:JSON.stringify({version:20,visionGround:'image'})});assert.equal(kept.stored().visionGround,'image','a starfield chosen at version 20 is kept');
  const bogus=fixture({saved:JSON.stringify({version:20,visionGround:'nope'})});assert.deepEqual(bogus.groundRadios.map(r=>r.checked),[false,false,true,false,false],'unknown values fall back to the default');
  const html=require('node:fs').readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/var grounds=\["black","image","video-namsan","video-seoul","video-water"\],vg=\(s&&s\.visionGround\)\|\|"video-namsan",vgq=new URLSearchParams\(location\.search\)\.get\("ground"\);if\(grounds\.indexOf\(vgq\)>=0\)vg=vgq;if\(fusion&&vg!=="black"&&grounds\.indexOf\(vg\)>0\)fusion\.dataset\.ground=vg;/);
  assert.match(html,/var s=JSON\.parse\(localStorage\.getItem\("sps-main-v4-layout-tweaks-v1"\)\);if\(s&&!\(s\.version>=20\)\)s=null;/,'the body chooser ignores payloads older than version 20');
  assert.match(html,/name="main-v4-vision-ground" value="video-namsan" checked/);
  for(const v of ['black','image','video-namsan','video-seoul','video-water'])assert.match(html,new RegExp('name="main-v4-vision-ground" value="'+v+'"'));
  assert.match(html,/<video class="hw-hero-video" data-story="0"[^>]*src="assets\/vid\/Namsan\.mp4"/,'the default ground is the hero\'s first film');
});

test('the 링크 밑줄 표시 toggle (off by default) shows the text-link underline via html[data-link-rule="on"], live and persisted, and resets to hidden',()=>{
  const h=fixture();
  assert.equal(h.linkRuleToggle.checked,false);assert.equal(h.rootData.linkRule,undefined,'hidden by default');assert.equal(h.stored().linkRule,false);
  h.toggleLinkRule(true);
  assert.equal(h.rootData.linkRule,'on');assert.equal(h.stored().linkRule,true);assert.equal(h.reloads(),0,'applies without a reload');
  const restored=fixture({saved:JSON.stringify(h.stored())});
  assert.equal(restored.rootData.linkRule,'on');assert.equal(restored.linkRuleToggle.checked,true);
  restored.reset.events.click();
  assert.equal(restored.rootData.linkRule,undefined);assert.equal(restored.stored().linkRule,false);
  const fsx=require('node:fs');
  const css=fsx.readFileSync(require.resolve('../jll-remix-main-v4.css'),'utf8');
  assert.match(css,/html:not\(\[data-link-rule="on"\]\) \.hw-main-v4 :is\(\.hw-with-link, \.hw-services3-link\) \{ border-bottom-color: transparent; \}/);
  const html=fsx.readFileSync(require.resolve('../jll-remix-main-v4.html'),'utf8');
  assert.match(html,/<input id="main-v4-link-rule" type="checkbox">/);
  assert.match(html,/if\(s&&s\.linkRule===true\)document\.documentElement\.dataset\.linkRule="on";/,'shown from the first paint when saved on');
});
