/* 사업실적 · 관리 중인 건물(부동산 자산관리 실적). 아래 buildings 목록만 고치면 '부동산 자산관리' · '전체' 탭과 메인 페이지 사업실적 줄의 건물 카드가 바뀐다.
   2026-10-21 사용자가 준 실제 건물(이름 · 용도), 2026-10-22 층수 · 지역(시 단위만, 구는 너무 자세해 생략) 추가. 사진은 받는 대로 채운다 — 비어 있는 칸은 카드에 나오지 않고, 사진이 없으면 '사진 준비 중' 자리가 선다.
   연면적(gfa)은 2026-10-22 사용자 요청으로 넣은 임시값이다. 실제 값을 받으면 바꾼다.
   사진(image)도 2026-10-22 느낌을 보려고 넣은 예시다(Unsplash 무료 사진, 해당 건물이 아님 · imageSample → 사진에 '예시 이미지'). 실제 사진을 받으면 assets 에 넣고 imageSample 을 지운다. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SPSManagedBuildings=api;
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  // name 이름 · area 위치(시 단위) · use 용도 · gfa 연면적 · floors 층수 · image / alt 사진(없으면 '사진 준비 중') · imageSample 예시 사진 · sample 샘플 표시
  // undisclosed: 소유주 요청으로 이름과 건물 정보를 공개하지 않는 관리 건물. 이름은 모두 '비공개 요청 자산'(번호 없음), 사진 자리에는 자물쇠 픽토그램만,
  // 표에는 자산 정보 한 줄만 선다. 사진 · 위치 · 용도 · 연면적 · 층수는 값이 있어도 나오지 않고, 메인 페이지 사업실적 줄에도 서지 않는다
  const buildings=Object.freeze([
    {name:'승리빌딩',area:'서울특별시',use:'근린생활시설',gfa:'1,320㎡',floors:'지하 1층 · 지상 4층',image:'https://images.unsplash.com/photo-1671947491590-d3eea7fea511?w=1080&h=800&fit=crop&q=75&auto=format',alt:'붉은 벽돌의 저층 상가 건물(예시)',imageSample:true},
    {name:'호성빌딩',area:'서울특별시',use:'근린생활시설',gfa:'1,180㎡',floors:'지하 1층 · 지상 4층',image:'https://images.unsplash.com/photo-1744273876148-71718f401231?w=1080&h=800&fit=crop&q=75&auto=format',alt:'석재 마감의 저층 건물(예시)',imageSample:true},
    {name:'유니트125',area:'서울특별시',use:'청년안심주택 · 아파트',gfa:'8,450㎡',floors:'지하 2층 · 지상 13층',image:'https://images.unsplash.com/photo-1715118989197-88cd72a9a9ab?w=1080&h=800&fit=crop&q=75&auto=format',alt:'흰색 고층 아파트(예시)',imageSample:true},
    {name:'신의S컬렉션',area:'서울특별시',use:'업무시설 · 오피스텔',gfa:'9,640㎡',floors:'지하 3층 · 지상 11층',image:'https://images.unsplash.com/photo-1630829421842-fc4f5a296e49?w=1080&h=800&fit=crop&q=75&auto=format',alt:'베이지색 오피스텔 건물(예시)',imageSample:true},
    {name:'학삼빌딩',area:'서울특별시',use:'업무시설',gfa:'3,960㎡',floors:'지하 2층 · 지상 8층',image:'https://images.unsplash.com/photo-1691651598335-9bf98fae81d8?w=1080&h=800&fit=crop&q=75&auto=format',alt:'유리와 금속 패널의 업무용 건물(예시)',imageSample:true},   // 2026-10-22 추가(연면적은 임시값)
    {name:'비공개 요청 자산',undisclosed:true},
    {name:'비공개 요청 자산',undisclosed:true},
    {name:'비공개 요청 자산',undisclosed:true}
  ]);
  // 사례 카드(공용 iv2-post)와 같은 틀: 사진 · 작은 글(분류) · 제목. 건물은 따로 읽을 글이 없어 링크 대신 위치 · 용도 · 연면적 · 층수 표(있는 칸만)를 둔다
  // 사진 자리: 비공개 건물은 사진이 있어도 자물쇠 픽토그램만(꾸밈이라 보조기기에는 숨긴다) → 사진(예시면 '예시 이미지' 꼬리표) → '사진 준비 중'
  function photo(building,index){
    if(building.undisclosed)return `<span class="iv2-photo cases-building-nophoto cases-building-private"><span class="cases-building-seal" aria-hidden="true"><sps-service-pictogram data-service="private" data-style="reference"></sps-service-pictogram></span></span>`;
    if(building.image)return `<span class="iv2-photo cases-building-photo"><img src="${escape(building.image)}" alt="${escape(building.alt||building.name)}" width="800" height="600" loading="${index<3?'eager':'lazy'}" decoding="async">${building.imageSample?'<span class="cases-building-photo-note">예시 이미지</span>':''}</span>`;
    return `<span class="iv2-photo cases-building-nophoto"><span>사진 준비 중</span></span>`;
  }
  function cards(items,{label='부동산 자산관리'}={}){
    return items.map((building,index)=>`
      <article class="iv2-post cases-building" data-iv2-reveal>
        <div class="cases-building-card">
          ${photo(building,index)}
          <div class="iv2-copy">
            <p class="iv2-meta">${[label,building.sample&&'샘플'].filter(Boolean).map(escape).join(' · ')}</p>
            <h2>${escape(building.name)}</h2>
            <dl class="cases-building-facts">
              ${(building.undisclosed?[['자산 정보','소유주 요청에 따라 비공개로 관리합니다']]:[['위치',building.area],['용도',building.use],['연면적',building.gfa],['층수',building.floors]]).filter(([,value])=>value).map(([term,value])=>`<div><dt>${term}</dt><dd>${escape(value)}</dd></div>`).join('')}
            </dl>
          </div>
        </div>
      </article>`).join('');
  }
  return {buildings,cards};
});
