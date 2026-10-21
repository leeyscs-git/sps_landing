/* Section links and current-section tracking belong to the shared scroll engine. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else api.start(root);
})(typeof window==='undefined'?null:window,function(){
  function start(win){
    const doc=win.document,host=doc.querySelector('.main-v4-page-nav');
    if(!host)return;
    const header=doc.querySelector('[data-sps-header]')||doc.documentElement;
    function sync(){
      // A clamped header rect always fits the viewport; use its foundation desktop width.
      const style=win.getComputedStyle(header);
      const contentWidth=parseFloat(style.getPropertyValue('--content-max'))||1320;
      const gutter=parseFloat(style.getPropertyValue('--page-gutter'));
      const headerWidth=contentWidth+2*(Number.isFinite(gutter)?gutter:72);
      const narrow=win.innerWidth<=850||win.innerWidth<headerWidth;
      // inert(히어로·푸터 구간의 숨김)는 페이드·슬라이드로 보여야 하므로 display:none 으로 바꾸지 않는다.
      host.hidden=narrow||host.hasAttribute('data-tweak-hidden')||doc.hidden||doc.body.classList.contains('sps-menu-open')||Boolean(doc.querySelector('dialog[open]'));
    }
    doc.addEventListener('visibilitychange',sync);
    win.addEventListener('pageshow',sync);
    win.addEventListener('resize',sync);
    win.addEventListener('sps-theme-change',sync);
    if('MutationObserver' in win){
      const observer=new win.MutationObserver(sync);
      observer.observe(host,{attributes:true,attributeFilter:['data-tweak-hidden']});
      observer.observe(doc.body,{attributes:true,attributeFilter:['class']});
      doc.querySelectorAll('dialog').forEach(dialog=>observer.observe(dialog,{attributes:true,attributeFilter:['open']}));
    }
    sync();
  }
  return {start};
});
