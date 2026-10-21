/* 사업실적 · 관리 중인 건물(부동산 자산관리 실적). 아래 buildings 목록만 고치면 '부동산 자산관리' · '전체' 탭과 메인 페이지 사업실적 줄의 건물 카드가 바뀐다.
   지금의 다섯 곳은 화면 구성을 위한 샘플(가상의 건물 · 사이트에 있던 사진)이며, 실제 관리 건물이 아니다. 실제 건물로 바꿀 때 sample 을 지운다. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SPSManagedBuildings=api;
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  // name 이름 · area 지역 · use 용도 · floors 규모 · gfa 연면적 · image / alt 사진 · sample 샘플 표시
  const buildings=Object.freeze([
    {name:'오피스 A',area:'서울 동대문구',use:'업무시설',floors:'지하 3층 · 지상 15층',gfa:'18,400㎡',
      image:'assets/landing/architecture.jpg',alt:'샘플 건물을 위한 도심 업무시설 외관 이미지',sample:true},
    {name:'근린상가 B',area:'서울 성동구',use:'근린생활시설',floors:'지하 1층 · 지상 6층',gfa:'4,200㎡',
      image:'assets/landing/city.jpg',alt:'샘플 건물을 위한 도심 건물 전경 이미지',sample:true},
    {name:'오피스텔 C',area:'서울 중랑구',use:'오피스텔',floors:'지하 2층 · 지상 14층',gfa:'9,800㎡',
      image:'assets/sps-main/city-poster.jpg',alt:'샘플 건물을 위한 도시 풍경 이미지',sample:true},
    {name:'복합빌딩 D',area:'서울 광진구',use:'업무 · 근린 복합',floors:'지하 2층 · 지상 10층',gfa:'11,600㎡',
      image:'assets/landing/workplace.jpg',alt:'샘플 건물을 위한 건물 공용 공간 이미지',sample:true},
    {name:'지식산업센터 E',area:'경기 하남시',use:'지식산업센터',floors:'지하 2층 · 지상 12층',gfa:'32,000㎡',
      image:'assets/landing/interior.jpg',alt:'샘플 건물을 위한 밝은 업무 공간 내부 이미지',sample:true}
  ]);
  // 사례 카드(공용 iv2-post)와 같은 틀: 사진 · 작은 글 · 제목. 건물은 따로 읽을 글이 없어 링크 대신 용도 · 규모 · 연면적 표를 둔다
  function cards(items,{label='부동산 자산관리'}={}){
    return items.map((building,index)=>`
      <article class="iv2-post cases-building" data-iv2-reveal>
        <div class="cases-building-card">
          <span class="iv2-photo"><img src="${escape(building.image)}" alt="${escape(building.alt)}" width="800" height="600" loading="${index<3?'eager':'lazy'}" decoding="async"></span>
          <div class="iv2-copy">
            <p class="iv2-meta">${escape(label)} · ${escape(building.area)}${building.sample?' · 샘플':''}</p>
            <h2>${escape(building.name)}</h2>
            <dl class="cases-building-facts">
              <div><dt>용도</dt><dd>${escape(building.use)}</dd></div>
              <div><dt>규모</dt><dd>${escape(building.floors)}</dd></div>
              <div><dt>연면적</dt><dd>${escape(building.gfa)}</dd></div>
            </dl>
          </div>
        </div>
      </article>`).join('');
  }
  return {buildings,cards};
});
