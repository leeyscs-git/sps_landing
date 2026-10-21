/* Main V2/V3/V4 share routing; only opted-in variants overlay the opening film. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else api.start(root);
})(typeof window==='undefined'?null:window,function(){
  const sections={
    '#main':'#hw-intro','#about':'#hw-vision','#services':'#hw-business',
    '#spaces':'#hw-future','#insights':'#hw-news','#faq':'#hw-footer','#contact':'#hw-footer'
  };
  function canonicalHash(hash){return sections[hash]||hash;}
  function navigationOverlap(header,nav,scale=1){
    return nav&&nav.height>0 ? Math.max(0,(header.bottom-nav.top)/scale) : 0;
  }
  function overlayHeader(win){
    const doc=win.document;
    if(!doc?.body?.hasAttribute('data-overlay-header'))return;
    const header=doc?.querySelector('[data-sps-header]');
    const hero=doc?.querySelector('.hw-hero');
    if(!header||!hero)return;
    const navigationOnly=doc.body?.dataset.overlayHeader==='navigation';
    const navigation=navigationOnly?header.querySelector('.nav'):null;
    // 폰(850 이하, 또는 851~1000 × 500 이하 터치 화면인 눕힌 폰 · 데스크톱 보기 아님)은 헤더가 접히지 않아, 히어로 바닥이 아니라 제목 윗변이 헤더에 닿을 때 흰 바탕으로 칠한다
    const phoneQuery=win.matchMedia?.('(max-width: 850px), (max-width: 1000px) and (max-height: 500px) and (pointer: coarse)');
    let pending=0;
    function paint(){
      pending=0;
      const headerRect=header.getBoundingClientRect();
      let overlap=null;
      if(navigationOnly){
        const scale=headerRect.width/header.offsetWidth||1;
        overlap=navigationOverlap(headerRect,navigation?.getBoundingClientRect(),scale);
        doc.body.style.setProperty('--main-nav-overlap',overlap+'px');
      }
      const menuOpen=Boolean(header.querySelector('[aria-expanded="true"]'));
      const phone=Boolean(phoneQuery?.matches)&&!doc.documentElement?.hasAttribute?.('data-sps-desktop');
      const copy=phone?hero.querySelector?.('.hw-hero-copy'):null;
      const edge=copy?copy.getBoundingClientRect().top:hero.getBoundingClientRect().bottom;
      header.classList.toggle('is-over-film',!menuOpen&&overlap!==0&&edge>headerRect.bottom);
    }
    function schedule(){if(!pending)pending=win.requestAnimationFrame(paint);}
    win.addEventListener('scroll',schedule,{passive:true});
    win.addEventListener('resize',schedule,{passive:true});
    win.addEventListener('pageshow',schedule);
    win.addEventListener('sps-theme-change',schedule);
    if('ResizeObserver' in win){
      const observer=new win.ResizeObserver(schedule);
      observer.observe(header,{box:'border-box'});
      observer.observe(hero,{box:'border-box'});
      if(navigation)observer.observe(navigation,{box:'border-box'});
    }
    if('MutationObserver' in win)new win.MutationObserver(schedule).observe(header,{subtree:true,attributes:true,attributeFilter:['aria-expanded']});
    paint();
  }
  function start(win){
    const hash=canonicalHash(win.location.hash);
    if(hash!==win.location.hash)win.history.replaceState(win.history.state,'',win.location.pathname+win.location.search+hash);
    overlayHeader(win);
  }
  return {canonicalHash,start,overlayHeader,navigationOverlap};
});
