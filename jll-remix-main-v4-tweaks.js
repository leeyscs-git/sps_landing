/* V4-only layout tweaks: the headline position, the vision-scene choice and the header condense style. Foundation colors and the shared motion engine stay intact. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else api.start(root);
})(typeof window==='undefined'?null:window,function(){
  const storageKey='sps-main-v4-layout-tweaks-v1';
  const VISIONS=['fusion','rise','logo','symbol','symbol-rise','film'];   // 결합 장면 · 결합(올라오는 장면) · V2(로고 도입부) · V3(바로 심볼, 원래 영상 장면의 창 전환) · V4(바로 심볼, V2처럼 그대로 올라옴) · 원래 영상 장면
  const DEFAULT_VISION='symbol-rise';  // 2026-10-21: 사용자가 고른 판이 기본(비전 V4 · 헤더 메뉴 줄만 · hero · 서비스 V3 · 푸터 V3 · 상담 버튼 없음 · 흰 카드 · h1 · 페이지 메뉴 숨김)
  const HEADERS=['row','bar'];              // 접힘: 로고 줄 유지 · 메뉴 줄만(이전 방식)
  const DEFAULT_HEADER='bar';
  const HEADER_STYLES=['solid','hero','clear'];  // 헤더 배경: 흰색 · 히어로에서 투명 · 항상 투명
  const DEFAULT_HEADER_STYLE='hero';
  const BAR_MIN=52,BAR_MAX=80,DEFAULT_BAR=58;  // '메뉴 줄만' 띠 높이(px)
  const SERVICES=['1','2','3'];             // 서비스 섹션: 원래 구성 · V2(사진 카드) · V3(사진 반 글 반). 하나만 보인다.
  const DEFAULT_SERVICES='3';
  const FOOTERS=['1','2','3'];              // 푸터: 밝은 바탕(원래) · V2(먹색 바탕, 회사소개서·브로슈어 카드) · V3(V1 바탕 + V2 배치 + V1 아래 줄)
  const DEFAULT_FOOTER='3';
  const CONSULTS=['contact','statement','none'];   // 푸터 상담 버튼: 기본 자리(V1 문장 오른쪽 · V2/V3 연락처 아래) · 문장 아래 · 없음. 모든 푸터에 적용
  const DEFAULT_CONSULT='none';
  const CARDS=['grey','tint','blush','duo','ink','soft','white']; // 푸터 V3 자료 카드 색: 연한 먹색 둘 · 연한 빨강 | 연한 먹색 · 연한 빨강 둘 · 먹색 | 빨강 · 먹색 둘 · 피치 | 세이지 · 흰 종이
  const DEFAULT_CARDS='white';
  const CAPTIONS=['h2','h1'];               // 열 장면의 영상 글 크기: 섹션 제목 단계(36) · 중간 단계(44, 파운데이션 --ts-h1)
  const DEFAULT_CAPTION='h1';
  const DEFAULT_PAGE_NAV=false;             // 오른쪽 페이지 메뉴: 기본 숨김
  const STORAGE_VERSION=20;                 // 이보다 오래된 저장값은 예전 기본이 자동 저장된 것이라 한 번 버리고 새 기본으로 시작한다
  function start(win){
    const doc=win.document,panel=doc.querySelector('.main-v4-tweaks');
    if(!panel||new URLSearchParams(win.location.search).has('embed'))return;
    if(new URLSearchParams(win.location.search).has('tweaks'))doc.documentElement.dataset.tweaks='show';   // 폰에서는 '+'를 숨긴다(CSS). ?tweaks 로 열면 보인다
    const hero=doc.querySelector('#hw-intro');
    const copy=hero?.querySelector('.hw-hero-copy'),bar=hero?.querySelector('.main-v4-stories');
    if(!hero||!copy||!bar)return;
    const slider=panel.querySelector('#main-v4-title-position');
    const output=panel.querySelector('#main-v4-title-value');
    const reset=panel.querySelector('#main-v4-tweaks-reset');
    const summary=panel.querySelector('summary');
    const visionInputs=[...(panel.querySelectorAll?.('input[name="main-v4-vision"]')||[])];
    const headerInputs=[...(panel.querySelectorAll?.('input[name="main-v4-header"]')||[])];
    const servicesInputs=[...(panel.querySelectorAll?.('input[name="main-v4-services"]')||[])];
    const footerInputs=[...(panel.querySelectorAll?.('input[name="main-v4-footer"]')||[])];
    const consultInputs=[...(panel.querySelectorAll?.('input[name="main-v4-footer-consult"]')||[])];
    const cardsInputs=[...(panel.querySelectorAll?.('input[name="main-v4-footer-cards"]')||[])];
    const captionInputs=[...(panel.querySelectorAll?.('input[name="main-v4-caption"]')||[])];
    const barSlider=panel.querySelector('#main-v4-bar-height'),barOutput=panel.querySelector('#main-v4-bar-value');
    const navToggle=panel.querySelector('#main-v4-nav-toggle');
    const withToggle=panel.querySelector('#main-v4-with-toggle');
    const linkRuleToggle=panel.querySelector('#main-v4-link-rule');
    const lightToggle=panel.querySelector('#main-v4-vision-light');
    const groundInputs=[...(panel.querySelectorAll?.('input[name="main-v4-vision-ground"]')||[])];
    const GROUNDS=['black','image','video-namsan','video-seoul','video-water'];   // 비전 바탕: 검정 · 우주 별밭 · 영상(히어로 첫 영상 남산, 기본) · 영상(서울 노을) · 영상(바다 물결)
    const headerBgInputs=[...(panel.querySelectorAll?.('input[name="main-v4-header-bg"]')||[])];
    // ?title=bottom|center|middle|top|<px> : 제목 위치 미리보기(compare-hero-position.html). 저장하지 않는다.
    const titlePreview=(()=>{const v=new URLSearchParams(win.location.search).get('title');if(!v)return null;if(/^-?\d+$/.test(v))return Number(v);return ['bottom','center','middle','top'].includes(v)?v:null;})();
    // ?vision=film|fusion : 본문 선택 스크립트가 그 장면을 보여준다(저장하지 않음). 패널은 실제로 보이는 장면을 표시한다.
    const queryVision=new URLSearchParams(win.location.search).get('vision');
    const shown=()=>VISIONS.includes(queryVision)?queryVision:vision;
    // ?condense=bar|row : 헤더 접힘 방식 미리보기(저장하지 않음). 머리의 스크립트가 같은 값을 html 에 미리 적는다.
    let queryHeader=new URLSearchParams(win.location.search).get('condense');
    const shownHeader=()=>HEADERS.includes(queryHeader)?queryHeader:headerMode;
    // ?services=1|2|3 : 서비스 섹션 미리보기(저장하지 않음). 본문의 선택 스크립트가 같은 값을 읽어 하나만 남긴다.
    const queryServices=new URLSearchParams(win.location.search).get('services');
    const shownServices=()=>SERVICES.includes(queryServices)?queryServices:services;
    // ?footer=1|2 : 푸터 미리보기(저장하지 않음). 본문의 선택 스크립트가 같은 값을 읽어 푸터 호스트에 적는다.
    const queryFooter=new URLSearchParams(win.location.search).get('footer');
    const shownFooter=()=>FOOTERS.includes(queryFooter)?queryFooter:footer;
    // ?consult=contact|statement|none · ?cards=grey|tint|blush|duo|ink|soft|white : 상담 버튼 자리 · 자료 카드 색 미리보기(저장하지 않음)
    const queryConsult=new URLSearchParams(win.location.search).get('consult');
    const shownConsult=()=>CONSULTS.includes(queryConsult)?queryConsult:footerConsult;
    let queryCards=new URLSearchParams(win.location.search).get('cards');
    const shownCards=()=>CARDS.includes(queryCards)?queryCards:footerCards;
    let requestedOffset='auto',vision=DEFAULT_VISION,headerMode=DEFAULT_HEADER,services=DEFAULT_SERVICES,barHeight=DEFAULT_BAR,pageNav=DEFAULT_PAGE_NAV,withSection=true,linkRule=false,headerStyle=DEFAULT_HEADER_STYLE,footer=DEFAULT_FOOTER,footerConsult=DEFAULT_CONSULT,footerCards=DEFAULT_CARDS,caption=DEFAULT_CAPTION,visionLight=true,visionGround='video-namsan';
    // ?caption=h2|h1 : 영상 글 크기 미리보기(저장하지 않음). 머리의 선택 스크립트가 같은 값을 html 에 미리 적는다.
    let queryCaption=new URLSearchParams(win.location.search).get('caption');
    const shownCaption=()=>CAPTIONS.includes(queryCaption)?queryCaption:caption;
    // ?headerbg=solid|hero|clear : 헤더 배경 미리보기(저장하지 않음). 머리의 스크립트가 같은 값을 html 에 적는다.
    const queryHeaderStyle=new URLSearchParams(win.location.search).get('headerbg');
    const shownHeaderStyle=()=>HEADER_STYLES.includes(queryHeaderStyle)?queryHeaderStyle:headerStyle;
    const clampBar=v=>Math.max(BAR_MIN,Math.min(BAR_MAX,Math.round(v)));
    try{
      const stored=JSON.parse(win.localStorage.getItem(storageKey));
      const saved=stored?.version>=STORAGE_VERSION?stored:null;
      if(Number.isFinite(saved?.offset))requestedOffset=Math.max(-20,Math.min(2000,saved.offset));
      if(VISIONS.includes(saved?.vision))vision=saved.vision;
      if(HEADERS.includes(saved?.header))headerMode=saved.header;
      if(SERVICES.includes(saved?.services))services=saved.services;
      if(FOOTERS.includes(saved?.footer))footer=saved.footer;
      if(CONSULTS.includes(saved?.footerConsult))footerConsult=saved.footerConsult;
      if(CARDS.includes(saved?.footerCards))footerCards=saved.footerCards;
      if(CAPTIONS.includes(saved?.caption))caption=saved.caption;
      if(typeof saved?.visionLight==='boolean')visionLight=saved.visionLight;
      if(GROUNDS.includes(saved?.visionGround))visionGround=saved.visionGround;
      if(Number.isFinite(saved?.barHeight))barHeight=clampBar(saved.barHeight);
      if(typeof saved?.pageNav==='boolean')pageNav=saved.pageNav;
      if(typeof saved?.withSection==='boolean')withSection=saved.withSection;
      if(typeof saved?.linkRule==='boolean')linkRule=saved.linkRule;
      if(HEADER_STYLES.includes(saved?.headerStyle))headerStyle=saved.headerStyle;
    }catch{}
    function save(){
      try{win.localStorage.setItem(storageKey,JSON.stringify({version:STORAGE_VERSION,offset:requestedOffset,vision,header:headerMode,services,barHeight,pageNav,withSection,linkRule,headerStyle,footer,footerConsult,footerCards,caption,visionLight,visionGround}));}catch{}
    }
    function measure(){
      // offsetHeight uses the page's logical pixels, including desktop-canvas zoom.
      const barInset=parseFloat(win.getComputedStyle(bar).bottom)||0;
      const upper=Math.max(0,Math.floor(hero.offsetHeight-bar.offsetHeight-barInset-copy.offsetHeight-56));
      // 기본(auto)은 '바 위': 문구가 하단 바 위 48px에 앉는다(32px 기준선 + 16). 나머지는 미리보기 규칙.
      const centered=(hero.offsetHeight-bar.offsetHeight-barInset-copy.offsetHeight)/2-32;
      const modes={bottom:16,center:centered,middle:(hero.offsetHeight-copy.offsetHeight)/2-(bar.offsetHeight+barInset+32),top:upper-72};
      const wanted=titlePreview===null?(requestedOffset==='auto'?modes.bottom:requestedOffset):(typeof titlePreview==='number'?titlePreview:modes[titlePreview]);
      const offset=Math.round(Math.max(-20,Math.min(upper,wanted)));
      slider.max=String(upper);slider.value=String(offset);
      hero.style.setProperty('--main-title-offset',offset+'px');
      const label=requestedOffset==='auto'?'기본(바 위)':offset===0?'0px':(offset>0?'위 ':'아래 ')+Math.abs(offset)+'px';
      output.value=label;slider.setAttribute('aria-valuetext',label);
    }
    function syncVision(){visionInputs.forEach(input=>{input.checked=input.value===shown();});}
    function chooseVision(next){
      if(!VISIONS.includes(next)||next===shown())return;
      vision=next;save();
      // 장면 교체는 페이지가 다시 읽힐 때 적용된다(본문의 선택 스크립트가 한쪽 장면을 떼어낸다). 임시 ?vision= 은 걷어내고 저장값이 보이게 한다.
      if(queryVision!==null){const url=new URL(win.location.href);url.searchParams.delete('vision');win.location.replace(url.href);}
      else win.location.reload();
    }
    function syncServices(){servicesInputs.forEach(input=>{input.checked=input.value===shownServices();});}
    function chooseServices(next){
      if(!SERVICES.includes(next)||next===shownServices())return;
      services=next;save();
      // 섹션 교체는 페이지가 다시 읽힐 때 적용된다(본문의 선택 스크립트가 나머지를 떼어낸다). 임시 ?services= 는 걷어낸다.
      if(queryServices!==null){const url=new URL(win.location.href);url.searchParams.delete('services');win.location.replace(url.href);}
      else win.location.reload();
    }
    servicesInputs.forEach(input=>input.addEventListener('change',()=>{if(input.checked)chooseServices(input.value);}));
    function syncFooter(){footerInputs.forEach(input=>{input.checked=input.value===shownFooter();});}
    function chooseFooter(next){
      if(!FOOTERS.includes(next)||next===shownFooter())return;
      footer=next;save();
      // 푸터 교체는 페이지가 다시 읽힐 때 적용된다(본문의 선택 스크립트가 호스트에 판을 적고 공용 푸터가 그 판을 그린다). 임시 ?footer= 는 걷어낸다.
      if(queryFooter!==null){const url=new URL(win.location.href);url.searchParams.delete('footer');win.location.replace(url.href);}
      else win.location.reload();
    }
    footerInputs.forEach(input=>input.addEventListener('change',()=>{if(input.checked)chooseFooter(input.value);}));
    // 상담 버튼 자리도 푸터를 다시 그려야 하므로 페이지를 다시 읽어 적용한다(선택 스크립트가 호스트에 data-footer-consult 를 적는다)
    function syncConsult(){consultInputs.forEach(input=>{input.checked=input.value===shownConsult();});}
    function chooseConsult(next){
      if(!CONSULTS.includes(next)||next===shownConsult())return;
      footerConsult=next;save();
      if(queryConsult!==null){const url=new URL(win.location.href);url.searchParams.delete('consult');win.location.replace(url.href);}
      else win.location.reload();
    }
    consultInputs.forEach(input=>input.addEventListener('change',()=>{if(input.checked)chooseConsult(input.value);}));
    // 자료 카드 색: html[data-footer-cards] 하나만 바꾸면 CSS 변수가 카드 색을 바꾼다. 바로 적용된다
    function applyCards(){
      const root=doc.documentElement;
      if(root?.dataset)root.dataset.footerCards=shownCards();
      cardsInputs.forEach(input=>{input.checked=input.value===shownCards();});
    }
    cardsInputs.forEach(input=>input.addEventListener('change',()=>{
      if(!input.checked||!CARDS.includes(input.value))return;
      if(queryCards!==null){queryCards=null;try{const url=new URL(win.location.href);url.searchParams.delete('cards');win.history?.replaceState?.(null,'',url.href);}catch{}}
      footerCards=input.value;save();applyCards();
    }));
    // 영상 글 크기: html[data-caption-size="h1"] 이면 타입 스케일이 열 장면의 글을 중간 단계(44px)로 그린다. 바로 적용된다.
    function applyCaption(){
      const root=doc.documentElement;
      // CSS 는 "h1" 에만 반응한다: 기본값이 무엇이든 h1 이면 적고 h2 면 지운다(기본이 h1 로 바뀐 뒤에도 머리의 선택 스크립트가 적은 값을 지우지 않게)
      if(root?.dataset){if(shownCaption()==='h1')root.dataset.captionSize='h1';else delete root.dataset.captionSize;}
      captionInputs.forEach(input=>{input.checked=input.value===shownCaption();});
    }
    function chooseCaption(next){
      if(!CAPTIONS.includes(next)||next===shownCaption())return;
      if(queryCaption!==null){queryCaption=null;try{const url=new URL(win.location.href);url.searchParams.delete('caption');win.history?.replaceState?.(null,'',url.href);}catch{}}
      caption=next;save();applyCaption();
    }
    captionInputs.forEach(input=>input.addEventListener('change',()=>{if(input.checked)chooseCaption(input.value);}));
    // 띠 높이: 공용 헤더가 html 의 --sps-bar-height 를 읽어 바로 다시 잰다
    function applyBar(){
      doc.documentElement?.style?.setProperty?.('--sps-bar-height',barHeight+'px');
      if(barSlider)barSlider.value=String(barHeight);
      if(barOutput)barOutput.value=barHeight+'px';
      win.SPSHeader?.refresh?.();
    }
    barSlider?.addEventListener('input',()=>{barHeight=clampBar(Number(barSlider.value)||DEFAULT_BAR);applyBar();save();});
    // 페이지 메뉴 표시: html[data-page-nav="off"] 이면 CSS 가 오른쪽 페이지 메뉴를 감춘다
    function applyNav(){
      const root=doc.documentElement;
      if(root?.dataset){if(pageNav)delete root.dataset.pageNav;else root.dataset.pageNav='off';}
      if(navToggle)navToggle.checked=pageNav;
    }
    navToggle?.addEventListener('change',()=>{pageNav=Boolean(navToggle.checked);applyNav();save();});
    // 더 알아보기 표시: html[data-with-section="off"] 이면 CSS 가 #hw-with 와 그 페이지 메뉴 항목을 감춘다. 바로 적용된다
    function applyWith(){
      const root=doc.documentElement;
      if(root?.dataset){if(withSection)delete root.dataset.withSection;else root.dataset.withSection='off';}
      if(withToggle)withToggle.checked=withSection;
    }
    withToggle?.addEventListener('change',()=>{withSection=Boolean(withToggle.checked);applyWith();save();});
    // 링크 밑줄: html[data-link-rule="on"] 이면 CSS 가 글 링크 밑줄을 보인다(기본 감춤). 바로 적용된다
    function applyLinkRule(){
      const root=doc.documentElement;
      if(root?.dataset){if(linkRule)root.dataset.linkRule='on';else delete root.dataset.linkRule;}
      if(linkRuleToggle)linkRuleToggle.checked=linkRule;
    }
    linkRuleToggle?.addEventListener('change',()=>{linkRule=Boolean(linkRuleToggle.checked);applyLinkRule();save();});
    // 비전을 흰 바탕으로 시작(원이 움직이면 검정으로): 결합 장면에 data-light="white" 를 붙였다 뗀다. 장면 스크립트가 매 프레임 읽으므로 다시 읽지 않고 바로 적용된다
    let queryLight=new URLSearchParams(win.location.search).get('light');
    const shownLight=()=>queryLight==='0'?false:queryLight==='1'?true:visionLight;
    function applyLight(){
      const fusion=doc.querySelector?.('.hw-fusion');
      if(fusion?.dataset){if(shownLight())fusion.dataset.light='white';else delete fusion.dataset.light;}
      if(lightToggle)lightToggle.checked=shownLight();
      win.SPSVisionFusion?.paint?.();
    }
    // 비전 바탕(검정 · 우주 별밭 · 영상 둘): data-ground 를 바꾼다. 장면 스크립트가 매 프레임 읽어 영상을 받고 돌리므로 바로 적용된다
    let queryGround=new URLSearchParams(win.location.search).get('ground');
    const shownGround=()=>GROUNDS.includes(queryGround)?queryGround:visionGround;
    function applyGround(){
      const fusion=doc.querySelector?.('.hw-fusion');
      if(fusion?.dataset){if(shownGround()==='black')delete fusion.dataset.ground;else fusion.dataset.ground=shownGround();}
      groundInputs.forEach(input=>{input.checked=input.value===shownGround();});
      win.SPSVisionFusion?.paint?.();
    }
    groundInputs.forEach(input=>input.addEventListener('change',()=>{
      if(!input.checked||!GROUNDS.includes(input.value))return;
      if(queryGround!==null){queryGround=null;try{const url=new URL(win.location.href);url.searchParams.delete('ground');win.history?.replaceState?.(null,'',url.href);}catch{}}
      visionGround=input.value;save();applyGround();
    }));
    lightToggle?.addEventListener('change',()=>{
      if(queryLight!==null){queryLight=null;try{const url=new URL(win.location.href);url.searchParams.delete('light');win.history?.replaceState?.(null,'',url.href);}catch{}}
      visionLight=Boolean(lightToggle.checked);save();applyLight();
    });
    // 헤더 배경은 레이아웃(히어로 위로 겹침)을 바꾸므로 페이지를 다시 읽어 적용한다
    function syncHeaderStyle(){headerBgInputs.forEach(input=>{input.checked=input.value===shownHeaderStyle();});}
    function chooseHeaderStyle(next){
      if(!HEADER_STYLES.includes(next)||next===shownHeaderStyle())return;
      headerStyle=next;save();
      if(queryHeaderStyle!==null){const url=new URL(win.location.href);url.searchParams.delete('headerbg');win.location.replace(url.href);}
      else win.location.reload();
    }
    headerBgInputs.forEach(input=>input.addEventListener('change',()=>{if(input.checked)chooseHeaderStyle(input.value);}));
    // 헤더 접힘은 공용 헤더 스크립트에 바로 적용된다(페이지를 다시 읽지 않는다).
    function applyHeader(mode){win.SPSHeader?.setCondenseMode?.(mode);}
    function syncHeader(){headerInputs.forEach(input=>{input.checked=input.value===shownHeader();});}
    function chooseHeader(next){
      if(!HEADERS.includes(next)||next===shownHeader())return;
      if(queryHeader!==null){queryHeader=null;try{const url=new URL(win.location.href);url.searchParams.delete('condense');win.history?.replaceState?.(null,'',url.href);}catch{}}
      headerMode=next;save();applyHeader(next);syncHeader();
    }
    slider.addEventListener('input',()=>{requestedOffset=Number(slider.value)||0;measure();save();});
    headerInputs.forEach(input=>input.addEventListener('change',()=>{if(input.checked)chooseHeader(input.value);}));
    visionInputs.forEach(input=>input.addEventListener('change',()=>{if(input.checked)chooseVision(input.value);}));
    reset.addEventListener('click',()=>{
      requestedOffset='auto';measure();
      barHeight=DEFAULT_BAR;applyBar();
      pageNav=DEFAULT_PAGE_NAV;applyNav();
      withSection=true;applyWith();
      linkRule=false;applyLinkRule();
      if(queryCaption!==null){queryCaption=null;try{const url=new URL(win.location.href);url.searchParams.delete('caption');win.history?.replaceState?.(null,'',url.href);}catch{}}
      caption=DEFAULT_CAPTION;applyCaption();
      if(queryLight!==null){queryLight=null;try{const url=new URL(win.location.href);url.searchParams.delete('light');win.history?.replaceState?.(null,'',url.href);}catch{}}
      visionLight=true;applyLight();
      if(queryGround!==null){queryGround=null;try{const url=new URL(win.location.href);url.searchParams.delete('ground');win.history?.replaceState?.(null,'',url.href);}catch{}}
      visionGround='video-namsan';applyGround();
      if(queryCards!==null){queryCards=null;try{const url=new URL(win.location.href);url.searchParams.delete('cards');win.history?.replaceState?.(null,'',url.href);}catch{}}
      footerCards=DEFAULT_CARDS;applyCards();
      if(shownHeader()!==DEFAULT_HEADER)chooseHeader(DEFAULT_HEADER);
      if(shownServices()!==DEFAULT_SERVICES||shown()!==DEFAULT_VISION||shownHeaderStyle()!==DEFAULT_HEADER_STYLE||shownFooter()!==DEFAULT_FOOTER||shownConsult()!==DEFAULT_CONSULT){
        // 장면·섹션·헤더 배경·푸터·상담 버튼 기본값은 한 번의 다시 읽기로 돌아온다
        services=DEFAULT_SERVICES;vision=DEFAULT_VISION;headerStyle=DEFAULT_HEADER_STYLE;footer=DEFAULT_FOOTER;footerConsult=DEFAULT_CONSULT;save();
        if(queryVision!==null||queryServices!==null||queryHeaderStyle!==null||queryFooter!==null||queryConsult!==null){const url=new URL(win.location.href);['vision','services','headerbg','footer','consult'].forEach(k=>url.searchParams.delete(k));win.location.replace(url.href);}
        else win.location.reload();
        return;
      }
      save();
    });
    panel.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&panel.open){panel.open=false;summary.focus();event.preventDefault();}
    });
    doc.addEventListener('pointerdown',event=>{if(panel.open&&!panel.contains(event.target))panel.open=false;});
    win.addEventListener('resize',measure,{passive:true});
    win.addEventListener('sps-theme-change',measure);
    win.addEventListener('pageshow',measure);
    if('ResizeObserver' in win){
      const observer=new win.ResizeObserver(measure);
      [hero,copy,bar].forEach(element=>observer.observe(element,{box:'border-box'}));
    }
    doc.fonts?.ready.then(measure);
    syncVision();syncHeader();syncServices();syncHeaderStyle();syncFooter();syncConsult();applyCards();applyBar();applyNav();applyWith();applyLinkRule();applyCaption();applyLight();applyGround();applyHeader(shownHeader());measure();save();panel.open=false;panel.hidden=false;
  }
  return {start,storageKey,VISIONS,DEFAULT_VISION,HEADERS,DEFAULT_HEADER,SERVICES,DEFAULT_SERVICES,DEFAULT_BAR,DEFAULT_HEADER_STYLE,FOOTERS,DEFAULT_FOOTER,CONSULTS,DEFAULT_CONSULT,CARDS,DEFAULT_CARDS,CAPTIONS,DEFAULT_CAPTION,DEFAULT_PAGE_NAV,STORAGE_VERSION};
});
