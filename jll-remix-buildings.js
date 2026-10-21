/* 사업실적 · 관리 중인 건물(부동산 자산관리 실적). 아래 buildings 목록만 고치면 '부동산 자산관리' · '전체' 탭과 메인 페이지 사업실적 줄의 건물 카드가 바뀐다.
   2026-10-21 사용자가 준 실제 건물(이름 · 용도). 지역 · 규모 · 연면적 · 사진은 받는 대로 채운다 — 비어 있는 칸은 카드에 나오지 않고, 사진이 없으면 '사진 준비 중' 자리가 선다. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SPSManagedBuildings=api;
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  // name 이름 · use 용도 · area 지역 · floors 규모 · gfa 연면적 · image / alt 사진(없으면 '사진 준비 중') · sample 샘플 표시
  const buildings=Object.freeze([
    {name:'승리빌딩',use:'근린생활시설'},
    {name:'호성빌딩',use:'근린생활시설'},
    {name:'유니트125',use:'청년안심주택 · 아파트'},
    {name:'신의S컬렉션',use:'업무시설 · 오피스텔'}
  ]);
  // 사례 카드(공용 iv2-post)와 같은 틀: 사진 · 작은 글 · 제목. 건물은 따로 읽을 글이 없어 링크 대신 용도 · 규모 · 연면적 표(있는 칸만)를 둔다
  function cards(items,{label='부동산 자산관리'}={}){
    return items.map((building,index)=>`
      <article class="iv2-post cases-building" data-iv2-reveal>
        <div class="cases-building-card">
          ${building.image?`<span class="iv2-photo"><img src="${escape(building.image)}" alt="${escape(building.alt||building.name)}" width="800" height="600" loading="${index<3?'eager':'lazy'}" decoding="async"></span>`:'<span class="iv2-photo cases-building-nophoto"><span>사진 준비 중</span></span>'}
          <div class="iv2-copy">
            <p class="iv2-meta">${[label,building.area,building.sample&&'샘플'].filter(Boolean).map(escape).join(' · ')}</p>
            <h2>${escape(building.name)}</h2>
            <dl class="cases-building-facts">
              ${[['용도',building.use],['규모',building.floors],['연면적',building.gfa]].filter(([,value])=>value).map(([term,value])=>`<div><dt>${term}</dt><dd>${escape(value)}</dd></div>`).join('')}
            </dl>
          </div>
        </div>
      </article>`).join('');
  }
  return {buildings,cards};
});
