/* Compare the archived footer with the shared applied footer, without changing saved choices. */
(() => {
  const comparison=document.querySelector('.comparison');
  const frames=[...comparison.querySelectorAll('iframe')];
  const note=document.querySelector('#view-note');
  let device=innerWidth<=700?'mobile':'desktop';
  function resize(){
    const [width,height]=device==='mobile'?[390,844]:[1316,820];
    for(const frame of frames){
      const box=frame.parentElement, available=box.clientWidth;
      if(!available)continue;
      const scale=Math.min(1,available/width);
      frame.style.width=width+'px';frame.style.height=height+'px';
      frame.style.transform=`scale(${scale})`;
      frame.style.left=Math.max(0,(available-width*scale)/2)+'px';
      box.style.height=Math.ceil(height*scale)+1+'px';
    }
    note.textContent=(device==='mobile'?'390px 모바일':'1316px 데스크톱')+' 기준 · 큰 화면으로 보려면 ‘적용 전’ 또는 ‘적용 후’를 선택하세요.';
  }
  function setDevice(next){
    device=next;comparison.dataset.device=device;
    document.querySelectorAll('button[data-device]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.device===device)));
    resize();
  }
  document.querySelectorAll('button[data-device]').forEach(button=>button.addEventListener('click',()=>setDevice(button.dataset.device)));
  document.querySelectorAll('button[data-view]').forEach(button=>button.addEventListener('click',()=>{
    comparison.dataset.view=button.dataset.view;
    document.querySelectorAll('button[data-view]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    comparison.querySelectorAll('[data-version]').forEach(panel=>panel.hidden=button.dataset.view!=='both'&&panel.dataset.version!==button.dataset.view);
    resize();
  }));
  new ResizeObserver(resize).observe(comparison);
  setDevice(device);
})();
