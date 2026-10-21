/* Original SPS story motion, adapted to V4's three photos and fourth film. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else api.start(root,typeof slides==='undefined'?[]:slides);
})(typeof window==='undefined'?null:window,function(){
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // 스토리별 CTA 목적지: 소개 · 서비스 섹션 · 서비스 사례 · 인사이트
  const STORY_LINKS=['jll-remix-about.html','#hw-business','jll-remix-cases.html','jll-remix-journal-v2.html'];
  function start(win,stories){
    const doc=win.document,bar=doc.querySelector('.main-v4-stories');
    if(!bar||!stories.length)return;
    const hero=bar.closest('.hw-hero'),copy=hero.querySelector('.hw-hero-copy');
    const title=hero.querySelector('#hw-title'),desc=hero.querySelector('#hw-story-desc'),cta=hero.querySelector('#hw-story-cta'),shade=hero.querySelector('.hw-hero-shade');
    // Any story may carry a film: <video class="hw-hero-video" data-story="N">; stories without one use the photo.
    const videos=[...hero.querySelectorAll('.hw-hero-video')];
    const videoFor=index=>videos.find(v=>Number(v.dataset.story)===index)||null;
    const isVideo=el=>!!el&&el.tagName==='VIDEO';
    // Park a film at its first frame so the next visit starts without a seek.
    const parkVideo=v=>{v.pause();if(v.currentTime>0){try{v.currentTime=0;}catch{}}};
    // Fetch a film ahead of time; resolves once it can play (or after a short grace period).
    const warm=v=>{if(!v||v.dataset.warm)return;v.dataset.warm='1';v.preload='auto';if(v.readyState<3)v.load();};
    const ready=v=>v.readyState>=3?Promise.resolve():new Promise(resolve=>{
      const done=()=>{v.removeEventListener('canplay',done);clearTimeout(timer);resolve();};
      const timer=setTimeout(done,1500);v.addEventListener('canplay',done);warm(v);
    });
    const buttons=[...bar.querySelectorAll('[data-slide]')];
    const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
    // 폰 · 데이터 절약 · 움직임 줄임은 다음 영상을 바로 받지 않는다: 폰은 컷 3초 전에 받고(늦으면 ready()의 1.5초 유예가 받친다), 움직임 줄임은 미리 받지 않는다
    const lean=()=>reduced.matches||win.navigator?.connection?.saveData===true||(Boolean(win.matchMedia('(max-width: 850px), (max-width: 1000px) and (max-height: 500px) and (pointer: coarse)')?.matches)&&!doc.documentElement?.hasAttribute?.('data-sps-desktop'));
    let warmTimer=0;
    let photo=hero.querySelector('.hw-hero-image');
    let ctaMotion=null;
    // 서비스 섹션은 화면 조정으로 V2·V3 중 하나만 남을 수 있다: #hw-business 링크는 남아 있는 섹션으로
    const resolveLink=href=>href==='#hw-business'&&!doc.getElementById('hw-business')?'#'+(doc.querySelector('#hw-services2, #hw-services3')?.id||'hw-business'):href;
    let current=-1,requestId=0,zoom=null,progress=null,fade=null,previous=null;
    let transitioning=false,heroVisible=true;
    const tracks=buttons.map(button=>{
      const track=doc.createElement('span');track.className='main-v4-story-progress';
      track.setAttribute('aria-hidden','true');button.append(track);return track;
    });
    hero.setAttribute('aria-roledescription','캐러셀');
    function blocked(){
      return reduced.matches||doc.hidden||!heroVisible||
        !!doc.querySelector('dialog[open],.sps-menu-open,.sps-inquiry-open,.main-v4-tweaks[open]');
    }
    function syncPlayback(){
      const paused=blocked();
      for(const animation of [zoom,progress]){
        if(!animation||animation.playState==='finished')continue;
        if(paused||(animation===progress&&transitioning))animation.pause();else animation.play();
      }
    }
    function resetProgress(){
      progress?.cancel();progress=null;
      if(!reduced.matches&&tracks[current]?.animate){
        // A film story stays for the film's own length; photo stories keep the 7.2s rhythm.
        const film=videoFor(current),duration=film&&film.duration>0?film.duration*1000:7200;
        progress=tracks[current].animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration,easing:'linear',fill:'forwards'});
        progress.onfinish=()=>{if(!blocked()&&!transitioning)choose((current+1)%stories.length);};
      }
      syncPlayback();
    }
    function startPhotoMotion(){
      zoom?.cancel();zoom=null;
      if(videoFor(current)||reduced.matches||!photo.complete||!photo.naturalWidth||!photo.animate)return;
      zoom=photo.animate([{transform:'scale(1.055)'},{transform:'scale(1)'}],{duration:8500,easing:'linear',fill:'forwards'});
      syncPlayback();
    }
    function mediaChanged(){win.dispatchEvent(new win.CustomEvent('sps-hero-media-change'));}
    function clearTransition(){
      if(fade){fade.onfinish=null;fade.cancel();fade=null;}
      if(isVideo(previous)){previous.hidden=true;parkVideo(previous);mediaChanged();}
      else previous?.remove();
      previous=null;
    }
    function measure(){
      const inset=parseFloat(win.getComputedStyle(bar).bottom)||0;
      hero.style.setProperty('--main-stories-height',(bar.offsetHeight+inset)+'px');
      hero.style.setProperty('--main-story-copy-height',copy.offsetHeight+'px');
    }
    async function choose(index){
      const story=stories[index];if(!story)return;
      const token=++requestId;
      // Selecting the visible tab also cancels a pending slow image request.
      if(index===current){transitioning=false;resetProgress();return;}
      transitioning=true;syncPlayback();
      const film=videoFor(index);
      let incoming=film||photo;
      if(film){
        // Like the photo decode below: switch only once the film has frames, so the cut shows motion immediately.
        await ready(film);
        if(token!==requestId)return;
      }
      if(current!==-1&&!film){
        incoming=doc.createElement('img');incoming.className='hw-hero-image';
        incoming.src=story.image;incoming.alt=story.alt;
        try{await incoming.decode();}catch{
          if(token===requestId){transitioning=false;resetProgress();}
          return;
        }
        if(token!==requestId)return;
      }
      clearTransition();
      const outgoing=current===-1?null:(videoFor(current)||photo);
      if(outgoing&&zoom)outgoing.style.transform=win.getComputedStyle(outgoing).transform;
      zoom?.cancel();zoom=null;
      if(outgoing){outgoing.style.zIndex='0';outgoing.setAttribute('aria-hidden','true');}
      if(!film){
        photo=incoming;photo.src=story.image;photo.alt=story.alt;
        if(outgoing)shade.before(photo);
      }
      incoming.hidden=false;incoming.style.zIndex='1';incoming.removeAttribute('aria-hidden');
      videos.forEach(v=>{if(v!==film&&v!==outgoing){v.hidden=true;parkVideo(v);}});
      if(film&&!blocked())film.play().catch(()=>{});
      const next=videoFor((index+1)%stories.length);
      clearTimeout(warmTimer);
      if(!lean())warm(next);
      else if(next&&!reduced.matches)warmTimer=setTimeout(()=>{if(current===index)warm(next);},Math.max(0,(film&&film.duration>0?film.duration*1000:7200)-3000));
      current=index;
      mediaChanged();
      title.innerHTML=story.title.split(/<br\s*\/?>/i).map(line=>'<span class="hw-line"><span>'+escape(line)+'</span></span>').join('');
      if(desc)desc.innerHTML=(story.description||'').split(/<br\s*\/?>/i).map(escape).join('<br>');
      if(cta){
        cta.innerHTML=escape(story.cta||'자세히 보기')+' <sps-arrow-up-right></sps-arrow-up-right>';cta.setAttribute('href',resolveLink(STORY_LINKS[index]||'#'));
        // 스토리가 바뀌면 제목 줄이 올라온 뒤 CTA가 다시 떠오른다(첫 등장은 CSS가 바 → 제목 → CTA 순서로 맡는다)
        ctaMotion?.cancel();ctaMotion=null;
        if(outgoing&&!reduced.matches&&typeof cta.animate==='function')ctaMotion=cta.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:900,delay:1500,easing:'cubic-bezier(.23,1,.32,1)',fill:'backwards'});
      }
      buttons.forEach(button=>{
        const selected=Number(button.dataset.slide)===index;
        button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
      });
      startPhotoMotion();measure();resetProgress();
      // 다음 매체가 앞 매체 위로 서서히 겹쳐 들어온다(0.8초). 움직임 줄임이면 바로 바뀐다.
      if(outgoing){
        previous=outgoing;
        if(!reduced.matches&&typeof incoming.animate==='function'){
          fade=incoming.animate([{opacity:0},{opacity:1}],{duration:800,easing:'ease-out',fill:'both'});
          fade.onfinish=()=>{fade=null;clearTransition();};
        }else clearTransition();
      }
      transitioning=false;syncPlayback();
    }
    buttons.forEach(button=>button.addEventListener('click',()=>choose(Number(button.dataset.slide))));
    // Film length becomes known after metadata: re-time the visible story once.
    videos.forEach(v=>v.addEventListener('loadedmetadata',()=>{if(videoFor(current)===v)resetProgress();},{once:true}));
    photo.addEventListener('load',()=>{if(current===0)startPhotoMotion();});
    // Auto cycling runs continuously: the playback (pause) button and hover/focus pausing were removed.
    doc.addEventListener('visibilitychange',syncPlayback);
    reduced.addEventListener('change',()=>{
      if(reduced.matches){clearTransition();transitioning=false;}
      startPhotoMotion();resetProgress();
    });
    if('IntersectionObserver' in win)new win.IntersectionObserver(entries=>{
      heroVisible=entries[0].isIntersecting;syncPlayback();
    },{threshold:.15}).observe(hero);
    if('MutationObserver' in win){
      const observer=new win.MutationObserver(syncPlayback);
      observer.observe(doc.documentElement,{attributes:true,attributeFilter:['class']});
      observer.observe(doc.body,{attributes:true,attributeFilter:['class']});
      doc.querySelectorAll('dialog,.main-v4-tweaks').forEach(element=>observer.observe(element,{attributes:true,attributeFilter:['open']}));
    }
    if('ResizeObserver' in win){
      const observer=new win.ResizeObserver(measure);
      observer.observe(bar,{box:'border-box'});observer.observe(copy,{box:'border-box'});
    }
    win.addEventListener('resize',measure,{passive:true});
    win.addEventListener('sps-theme-change',measure);
    win.addEventListener('sps-main-layout-change',measure);
    doc.fonts?.ready.then(measure);
    choose(0);
  }
  return {start};
});
