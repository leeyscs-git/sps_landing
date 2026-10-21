/* Shared SPS footer and business details. Page-specific notes remain in the host. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.SPSFooter=api;api.mount(root);}
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const arrow='<sps-arrow-up-right></sps-arrow-up-right>';
  // 패밀리사이트: 같은 그룹의 사이트(shineui.kr 의 패밀리사이트 목록에서 SPS 자신을 뺀 것)
  const family=Object.freeze([
    {label:'신의알앤씨',href:'https://shineui.kr'},
    {label:'UNIT125',href:'https://unit125.shineui.kr'},
  ]);
  // 대표전화 · 상담 운영시간 (운영시간은 사용자 확인: 평일 09:00–18:00, 점심 12–13시, 2026-10-20)
  const contact=Object.freeze({
    phone:'02-2247-5799', tel:'0222475799',
    hours:'평일 09:00 – 18:00', lunch:'점심 12:00 – 13:00', closed:'주말·공휴일 휴무'
  });
  // Transcribed from the business registration certificate supplied by the user.
  const company=Object.freeze({
    name:'주식회사 신의프라퍼티솔루션',
    representative:'이영수',
    registration:'219-87-04014',
    rental:'동대문구-위탁관리형-주택임대관리업자-2',   // 주택임대관리업등록번호 (사용자 제공, 2026-10-21)
    address:'서울특별시 동대문구 장한로 85, 20층 2007호 (장안동, 장안현대벤처빌)'
  });
  function companyDetails(includeName=false){
    const rows=[...(includeName?[['상호',company.name]]:[]),['대표자',company.representative],['사업자등록번호',company.registration],['주택임대관리업등록번호',company.rental],['주소',company.address]];
    return `<dl class="sps-company-details">${rows.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
  }
  function routes(win){
    const doc=win.document;
    const header=doc.querySelector('[data-sps-header]');
    const variant=doc.documentElement.dataset.serviceMenu;
    const prefix=['v2','v3','v4'].includes(variant)?'jll-remix-'+variant:'jll-remix';
    return {
      home:header?.dataset.homeHref||prefix+'.html',
      about:header?.dataset.aboutHref||prefix+'-about.html',
      insights:header?.dataset.journalHref||'jll-remix-journal-v2.html',
      top:doc.getElementById('main')?'#main':'#overview'
    };
  }
  // V1 아래 줄: 로고 · 사업자 정보 · 저작권 / 패밀리사이트(위로 열림) · 맨 위로. V1 과 V3 가 같이 쓴다.
  function bottomV1(paths,year,{top=true}={}){
    return `      <div class="sps-footer-bottom">
        <div class="sps-footer-identity">
          <a class="sps-footer-logo" href="${escape(paths.home)}" target="_top" aria-label="SPS 홈"><img src="assets/logo.svg" alt="SPS" width="120" height="40" loading="lazy"></a>
          <p class="sps-footer-business"><span>${escape(company.name)}</span><span>대표자 ${escape(company.representative)}</span><span>사업자등록번호 ${escape(company.registration)}</span></p>
          <p class="sps-footer-business"><span>${escape(company.address)}</span><span class="sps-footer-phone">대표전화 ${escape(contact.phone)}</span></p>
          <p class="sps-footer-business"><span>주택임대관리업등록번호 ${escape(company.rental)}</span></p>
          <p class="sps-footer-copy">© ${escape(year)} SPS. All rights reserved.</p>
        </div>
        <div class="sps-footer-side">
          <details class="sps-footer-family" data-footer-family>
            <summary>패밀리사이트 <sps-chevron aria-hidden="true"></sps-chevron></summary>
            <ul>${family.map(site=>`<li><a href="${escape(site.href)}" target="_blank" rel="noopener">${escape(site.label)} ${arrow}</a></li>`).join('')}</ul>
          </details>
          ${top?`<a class="sps-footer-top" href="${escape(paths.top)}" data-footer-top>맨 위로 <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="M10 16V4m-6 6 6-6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`:''}
        </div>
      </div>`;
  }
  // V1 메뉴: 묶음 제목 아래로 링크를 세로로 쌓는다. V1 과 V3 가 같이 쓴다.
  function navV1(paths){
    const link=(href,label)=>`<a href="${escape(href)}" target="_top">${label}</a>`;
    return `<nav class="sps-footer-nav" aria-label="하단 메뉴">
          <div class="sps-footer-group"><h3>사업영역</h3>
            ${link('jll-remix.html?service=management#services','부동산 자산관리')}
            ${link('jll-remix.html?service=marketing#services','임대 마케팅')}
            ${link('jll-remix.html?service=interior#services','실내건축')}
          </div>
          <div class="sps-footer-group"><h3>SPS 알아보기</h3>
            ${link(paths.about,'SPS 소개')}
            ${link('jll-remix-cases.html','사업실적')}
            ${link(paths.insights,'인사이트')}
          </div>
          <div class="sps-footer-group"><h3>고객지원</h3>
            ${link('jll-remix-support.html','고객지원 안내')}
            ${link('jll-remix-support.html#questions','자주 묻는 질문')}
            ${link('jll-remix-about.html#credentials','등록·면허 자료')}
          </div>
        </nav>`;
  }
  // variant '2': 먹색 바탕의 푸터 V2(회사소개서 · 브로슈어 카드). '3': V1 바탕 + V2 배치 + V1 아래 줄. 호스트의 data-footer-variant 로 고른다.
  // consult: 상담·견적 문의 버튼 자리. 'contact' 기본(V1 문장 오른쪽 · V2/V3 연락처 아래) · 'statement' 문장 아래 · 'none' 없음. 호스트의 data-footer-consult 로 고른다.
  function markup(paths,year,{top=true,variant='1',consult='contact'}={}){
    if(variant==='2')return markupV2(paths,year,{top,consult});
    if(variant==='3')return markupV3(paths,year,{top,consult});
    return `<div class="sps-footer-inner">
      <div class="sps-footer-lead"${consult==='statement'?' data-consult="statement"':''}>
        <h2 class="sps-footer-statement">공간을 이해합니다.<br>가능성을 연결합니다.</h2>
        ${consult==='none'?'':`<a class="sps-footer-consult" href="jll-remix-support.html#inquiry" data-inquiry aria-haspopup="dialog">상담·견적 문의 ${arrow}</a>`}
      </div>
      <div class="sps-footer-directory">
        <div class="sps-footer-call-block">
          <a class="sps-footer-call" href="tel:${escape(contact.tel)}"><span class="sps-footer-call-label">대표전화</span><span class="sps-footer-call-number">${escape(contact.phone)}</span></a>
          <dl class="sps-footer-hours"><dt>상담 운영시간</dt><dd>${escape(contact.hours)}</dd><dd>${escape(contact.lunch)}</dd><dd>${escape(contact.closed)}</dd></dl>
        </div>
        ${navV1(paths)}
      </div>
      ${bottomV1(paths,year,{top})}
    </div>`;
  }
  // 푸터 자료 카드. PDF 가 준비되면 href 를 파일로, action 을 '다운로드'로, download:true 로 바꾼다.
  // 그전까지는 누르면 soon(제목 · 설명 줄 · 글 링크)의 '준비 중' 창이 뜨고, 창의 글 링크와 새 탭 열기는 실제 페이지(href)로 간다.
  const resources=Object.freeze([
    {key:'profile',eyebrow:'Company Profile',label:'회사소개서',desc:'회사 개요 및 등록·면허 자료',action:'보기',href:'jll-remix-about.html',
      soon:{title:'회사소개서를 준비하고 있습니다.',lines:['지금은 SPS 소개에서 회사 개요와 등록·면허 자료를 확인해보세요.'],action:'SPS 소개 살펴보기'}},
    {key:'brochure',eyebrow:'Brochure',label:'브로슈어',desc:'서비스 안내',action:'보기',href:'jll-remix.html#services',
      soon:{title:'브로슈어를 준비하고 있습니다.',lines:['지금은 서비스 소개에서 세 가지 서비스를 살펴보세요.'],action:'서비스 살펴보기'}}
  ]);
  // '준비 중' 창 내용: 인사이트의 빈 상태(제목 · 설명 · 글 링크 iv2-empty-cta)와 같은 꼴, 가운데 정렬. 닫기는 테두리 없는 선 X 아이콘
  function soonMarkup(item){
    return `<button class="sps-footer-soon-close" type="button" data-soon-close aria-label="닫기"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      <p class="sps-footer-soon-kicker">준비 중</p>
      <h3 id="sps-footer-soon-title" tabindex="-1" autofocus>${escape(item.soon.title)}</h3>
      <p class="sps-footer-soon-text">${item.soon.lines.map(escape).join('<br>')}</p>
      <a class="sps-footer-soon-cta" href="${escape(item.href)}" target="_top">${escape(item.soon.action)}${arrow}</a>`;
  }
  // 푸터 V2: 먹색 띠 · 회사 자료 카드 두 장 · 라벨 + 가로 링크 줄. 스타일은 jll-remix-footer.css 의 .sps-footer[data-variant="2"] 블록.
  // V2 조각: brand(로고 · 문장) · reach(대표전화 · 운영시간 · 문의) · resources(자료 카드) · nav(라벨 + 가로 링크 줄).
  // V2 는 머리 = brand | reach, 몸 = resources | nav. V3 는 머리 = 문장 | resources, 몸 = reach | V1 세로 메뉴(navV1).
  function v2Parts(paths){
    const link=(href,label)=>`<a href="${escape(href)}" target="_top">${label}</a>`;
    // 줄: [라벨 칸][가로 링크 목록]. 항목 사이 막대는 CSS 가 li 왼쪽 바깥에 그리고, 줄 첫 항목(줄바꿈 뒤 포함)의 막대는 overflow:clip 으로 잘린다
    const row=(label,items)=>`<div class="sps-footer-v2-row"><h3 class="sps-footer-v2-label">${escape(label)}</h3><ul class="sps-footer-v2-cells">${items.map(item=>`<li>${item}</li>`).join('')}</ul></div>`;
    // 카드 아이콘: currentColor 선 아이콘(문서 · 3단 접지). 24px · 1.5 획
    const icons={
      profile:'<svg class="sps-footer-v2-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/></svg>',
      brochure:'<svg class="sps-footer-v2-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 6l6-2v16l-6 2z"/><path d="M9 4l6 2v16l-6-2z"/><path d="M15 6l6-2v16l-6 2z"/></svg>'
    };
    // 회사 자료 카드: 카드 전체가 링크. resources 항목에 download:true 가 켜지면(PDF) target 대신 download 속성이 붙는다
    // compact = 3단(V3): 영문 눈썹 없이 [제목 · 아이콘] / 설명 / 보기. 기본은 4단(V2): 눈썹 · 아이콘 / 제목 / 설명 / 보기
    const card=(item,{compact=false}={})=>`<li><a class="sps-footer-v2-card" data-resource="${escape(item.key)}" href="${escape(item.href)}"${item.download?' download':' target="_top" data-soon aria-haspopup="dialog"'}>
            ${compact?`<span class="sps-footer-v2-card-head"><strong class="sps-footer-v2-card-title">${escape(item.label)}</strong>${icons[item.key]||''}</span>
            ${item.desc?`<span class="sps-footer-v2-card-desc">${escape(item.desc)}</span>`:''}`:`<span class="sps-footer-v2-card-head"><span class="sps-footer-v2-eyebrow" lang="en">${escape(item.eyebrow)}</span>${icons[item.key]||''}</span>
            <span class="sps-footer-v2-card-text"><strong class="sps-footer-v2-card-title">${escape(item.label)}</strong>${item.desc?`<span class="sps-footer-v2-card-desc">${escape(item.desc)}</span>`:''}</span>`}
            <span class="sps-footer-v2-card-action">${escape(item.action)} ${arrow}</span>
          </a></li>`;
    const consultLink=`<a class="sps-footer-v2-consult" href="jll-remix-support.html#inquiry" data-inquiry aria-haspopup="dialog">상담·견적 문의 ${arrow}</a>`;
    return {
      brand:({logo=true,consult=false}={})=>`<div class="sps-footer-v2-brand">
          ${logo?`<a class="sps-footer-v2-logo" href="${escape(paths.home)}" target="_top" aria-label="SPS 홈"><img src="assets/logo-on-film.svg" alt="SPS" width="120" height="40" loading="lazy"></a>`:''}
          <h2 class="sps-footer-v2-statement">공간을 이해합니다.<br>가능성을 연결합니다.</h2>${consult?`
          ${consultLink}`:''}
        </div>`,
      reach:({consult=true}={})=>`<div class="sps-footer-v2-reach">
          <a class="sps-footer-v2-row sps-footer-v2-call" href="tel:${escape(contact.tel)}"><span class="sps-footer-v2-label">대표전화</span><span class="sps-footer-v2-call-number">${escape(contact.phone)}</span></a>
          <dl class="sps-footer-v2-row sps-footer-v2-hours"><dt class="sps-footer-v2-label">상담 운영시간</dt><dd>${escape(contact.hours)}</dd><dd>${escape(contact.lunch)}</dd><dd>${escape(contact.closed)}</dd></dl>
          ${consult?consultLink:''}
        </div>`,
      resources:({compact=false}={})=>`<nav class="sps-footer-v2-resources" aria-label="회사 자료">
          <ul class="sps-footer-v2-cards">${resources.map(item=>card(item,{compact})).join('')}</ul>
        </nav>`,
      nav:()=>`<nav class="sps-footer-v2-nav" aria-label="하단 메뉴">
          ${row('사업영역',[link('jll-remix.html?service=management#services','부동산 자산관리'),link('jll-remix.html?service=marketing#services','임대 마케팅'),link('jll-remix.html?service=interior#services','실내건축')])}
          ${row('SPS 알아보기',[link(paths.about,'SPS 소개'),link('jll-remix-cases.html','사업실적'),link(paths.insights,'인사이트')])}
          ${row('고객지원',[link('jll-remix-support.html','고객지원 안내'),link('jll-remix-support.html#questions','자주 묻는 질문'),link('jll-remix-about.html#credentials','등록·면허 자료')])}
          ${row('패밀리사이트',family.map(site=>`<a href="${escape(site.href)}" target="_blank" rel="noopener">${escape(site.label)} ${arrow}<span class="sps-footer-v2-sr">(새 창)</span></a>`))}
        </nav>`
    };
  }
  function markupV2(paths,year,{top=true,consult='contact'}={}){
    const v2=v2Parts(paths);
    return `<div class="sps-footer-inner">
      <div class="sps-footer-v2-head">
        ${v2.brand({consult:consult==='statement'})}
        ${v2.reach({consult:consult==='contact'})}
      </div>
      <div class="sps-footer-v2-body">
        ${v2.resources()}
        ${v2.nav()}
      </div>
      <div class="sps-footer-v2-foot">
        <div class="sps-footer-v2-identity">
          <p class="sps-footer-v2-business"><span>${escape(company.name)}</span><span>대표자 ${escape(company.representative)}</span><span>사업자등록번호 ${escape(company.registration)}</span></p>
          <p class="sps-footer-v2-business"><span>${escape(company.address)}</span><span class="sps-footer-v2-phone">대표전화 ${escape(contact.phone)}</span></p>
          <p class="sps-footer-v2-business"><span>주택임대관리업등록번호 ${escape(company.rental)}</span></p>
          <p class="sps-footer-v2-copy">© ${escape(year)} SPS. All rights reserved.</p>
        </div>
        ${top?`<a class="sps-footer-v2-top" href="${escape(paths.top)}" data-footer-top aria-label="맨 위로"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="M10 16V4m-6 6 6-6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`:''}
      </div>
    </div>`;
  }
  // 푸터 V3: V1 바탕(쿨 화이트 · 먹색 글 · 빨간 대표전화). 머리 = 문장 | 3단 자료 카드, 몸 = 대표전화 · 운영시간 · 문의 | V1 세로 메뉴(카드와 같은 폭), 맨 아래는 V1 아래 줄 그대로.
  function markupV3(paths,year,{top=true,consult='contact'}={}){
    const v2=v2Parts(paths);
    return `<div class="sps-footer-inner">
      <div class="sps-footer-v2-head">
        ${v2.brand({logo:false,consult:consult==='statement'})}
        ${v2.resources({compact:true})}
      </div>
      <div class="sps-footer-v2-body">
        ${v2.reach({consult:consult==='contact'})}
        ${navV1(paths)}
      </div>
      ${bottomV1(paths,year,{top})}
    </div>`;
  }
  // 스크롤 등장: 푸터의 띠(머리 · 몸 · 아래 줄)가 화면에 들어오면 위 구분선이 왼쪽부터 그어지고, 띠 안의 조각이 차례로 떠오른다.
  // 문장은 위에서부터 걷히듯 드러난다. 움직임 줄이기 · IntersectionObserver 없음 · 디자인 시스템 미리보기는 처음부터 그대로 보인다.
  const REVEAL_BANDS='.sps-footer-lead, .sps-footer-directory, .sps-footer-bottom, .sps-footer-v2-head, .sps-footer-v2-body, .sps-footer-v2-foot';
  const REVEAL_ITEMS=['.sps-footer-lead > *','.sps-footer-call-block > *','.sps-footer-nav > .sps-footer-group','.sps-footer-identity > *','.sps-footer-side > *',
    '.sps-footer-v2-brand > *','.sps-footer-v2-cards > li','.sps-footer-v2-reach > *','.sps-footer-v2-nav > *','.sps-footer-v2-identity > *','.sps-footer-v2-foot > .sps-footer-v2-top'].join(', ');
  function revealOnScroll(win,host){
    if(host.hasAttribute('data-footer-preview')||typeof win.IntersectionObserver!=='function'||win.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const bands=[...host.querySelectorAll(REVEAL_BANDS)];
    if(!bands.length)return;
    bands.forEach(band=>{
      [...band.querySelectorAll(REVEAL_ITEMS)].forEach((item,index)=>{item.setAttribute('data-footer-item','');item.style.setProperty('--fi',String(index));});
      // 띠 위의 구분선(border-top)은 같은 색의 선으로 바꿔 그린다
      const style=win.getComputedStyle(band);
      if(parseFloat(style.borderTopWidth)>0){band.setAttribute('data-footer-rule','');band.style.setProperty('--footer-rule',style.borderTopColor);}
    });
    host.setAttribute('data-footer-motion','');
    const show=band=>{band.classList.add('is-in');observer.unobserve(band);};
    const observer=new win.IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)show(entry.target);}),{rootMargin:'0px 0px -8% 0px',threshold:.12});
    bands.forEach(band=>observer.observe(band));
    // 키보드로 먼저 들어오면 기다리지 않고 모두 보인다
    host.addEventListener('focusin',()=>bands.forEach(show),{once:true});
  }
  // '준비 중' 창은 페이지에 하나만 두고 누른 카드에 맞춰 내용을 바꾼다. 닫기 단추 · 창 바깥(배경) 클릭 · Esc 로 닫히고, 닫히면 초점은 카드로 돌아간다
  function soonDialog(doc,item){
    if(!item?.soon)return null;
    let dialog=doc.getElementById('sps-footer-soon');
    if(!dialog){
      dialog=doc.createElement('dialog');
      if(typeof dialog.showModal!=='function')return null;
      dialog.className='dialog sps-footer-soon';
      dialog.id='sps-footer-soon';
      dialog.setAttribute('aria-labelledby','sps-footer-soon-title');
      dialog.addEventListener('click',event=>{
        if(event.target.closest('[data-soon-close]'))return dialog.close();
        const box=dialog.getBoundingClientRect();
        if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))dialog.close();
      });
      dialog.addEventListener('close',()=>{if(!doc.querySelector('dialog[open]'))doc.body.classList.remove('modal-open');});
      doc.body.append(dialog);
    }
    dialog.innerHTML=soonMarkup(item);
    return dialog;
  }
  function mount(win){
    const doc=win.document;
    doc.querySelectorAll('[data-sps-company-details]').forEach(host=>{host.innerHTML=companyDetails(true);});
    const hosts=[...doc.querySelectorAll('[data-sps-footer]')].filter(host=>!host.hasAttribute('data-footer-ready'));
    if(!hosts.length)return;
    const paths=routes(win);
    hosts.forEach(host=>{
      const notes=[...host.querySelectorAll('[data-footer-note]')];
      // 페이지에 떠 있는 '맨 위로' 버튼이 따로 있으면(V4: data-footer-no-top) 푸터의 '맨 위로'는 넣지 않는다
      // 기본은 메인 V4 의 기본과 같은 판: 푸터 V3 · 상담 버튼 없음(2026-10-21 전역 적용). 호스트가 1 · 2 / contact · statement 를 적으면 그 판을 그린다
      const asked=host.getAttribute?.('data-footer-variant'),variant=asked==='1'||asked==='2'?asked:'3';
      const place=host.getAttribute?.('data-footer-consult'),consult=place==='contact'||place==='statement'?place:'none';
      host.setAttribute('data-variant',variant);
      host.innerHTML=markup(paths,new Date().getFullYear(),{top:!host.hasAttribute('data-footer-no-top'),variant,consult});
      const inner=host.querySelector('.sps-footer-inner');
      notes.forEach(note=>inner.append(note));
      host.setAttribute('data-footer-ready','');
      // 패밀리사이트: 바깥을 누르거나 Esc 를 누르면 닫힌다(열고 닫기는 details 가 맡는다)
      const familyMenu=host.querySelector('[data-footer-family]');
      if(familyMenu&&typeof familyMenu.addEventListener==='function'&&'open' in familyMenu){
        doc.addEventListener('click',event=>{if(familyMenu.open&&!familyMenu.contains(event.target))familyMenu.open=false;});
        familyMenu.addEventListener('keydown',event=>{if(event.key==='Escape'&&familyMenu.open){familyMenu.open=false;familyMenu.querySelector('summary')?.focus();}});
      }
      host.querySelector('[data-footer-top]')?.addEventListener('click',event=>{
        if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        event.preventDefault();
        win.scrollTo({top:0,behavior:win.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
        const firstLink=doc.querySelector('[data-sps-header] .brand, .ds-top a');
        firstLink?.focus({preventScroll:true});
      });
      // 자료 카드(파일 전): 누르면 '준비 중' 창. 수정키 · 가운데 클릭(새 탭)과 dialog 를 못 쓰는 브라우저는 링크 그대로 실제 페이지로 간다
      host.addEventListener?.('click',event=>{
        const card=event.target?.closest?.('[data-soon]');
        if(!card||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        const dialog=soonDialog(doc,resources.find(item=>item.key===card.dataset.resource));
        if(!dialog)return;
        event.preventDefault();
        dialog.showModal();
        doc.body.classList.add('modal-open');
      });
      revealOnScroll(win,host);
    });
    // About variants scope foundation edits to the header; share those values here too.
    if(doc.body.dataset.themeScope==='header'){
      const source=doc.querySelector('[data-sps-header]');
      function syncTheme(){
        const style=win.getComputedStyle(source);
        hosts.forEach(host=>(win.SPSThemeSchema||[]).forEach(field=>{
          const value=style.getPropertyValue(field.token);
          if(value.trim())host.style.setProperty(field.token,value);
          else host.style.removeProperty(field.token);
        }));
      }
      win.addEventListener('sps-theme-change',syncTheme);
      syncTheme();
    }
  }
  return {routes,markup,markupV2,markupV3,mount,company,companyDetails,family,contact,resources,soonMarkup};
});
