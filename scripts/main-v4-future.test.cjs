const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n?/g,'\n');

test('V4 고객지원 장면: the title travels from the top centre to the sentence spot over the growing photo, turns white on the way and hands over in place',()=>{
  const main=read('jll-remix-main-v4.html'),css=read('jll-remix-main-v4.css'),js=read('jll-remix-hanwha.js');
  assert.match(main,/<section class="hw-future" id="hw-future" aria-labelledby="hw-future-title" data-heading-travel>/,'V4 opts in');
  assert.match(main,/<div class="hw-future-heading" data-reveal>\s*<p class="hw-kicker">고객지원 <sps-arrow-up-right><\/sps-arrow-up-right><\/p>\s*<h2 id="hw-future-title">어떤 도움이<br>필요하신가요\?<\/h2>/,'the title block is unchanged');
  assert.match(main,/<div class="hw-future-top wrap"><p>고객지원<\/p><h3><span>우리 건물의 고민,<\/span><span>함께 정리합니다\.<\/span><\/h3><\/div>/,'the destination sentence stays');
  assert.match(js,/const headingTravel = Boolean\(future && future\.hasAttribute && future\.hasAttribute\('data-heading-travel'\)\);/);
  assert.match(js,/headingShift = \{ x: to\.left - from\.left, y: to\.top - h2\.getBoundingClientRect\(\)\.top \};/,'the shift is measured from the h2 text box to the h3 box with transforms cleared');
  assert.match(js,/futureHeading\.style\.transform = 'translate\(' \+ \(shift\.x\*go\)\.toFixed\(1\) \+ 'px,' \+ \(shift\.y\*go\)\.toFixed\(1\) \+ 'px\)';/,'and eased along the travel progress');
  assert.match(js,/futureHeading\.style\.setProperty\('--hw-future-heading-light', f\.light\.toFixed\(3\)\);/);
  assert.match(js,/\} else \{\s*futureHeading\.style\.opacity = f\.heading;\s*futureHeading\.style\.transform = 'translateY\(' \+ \(-30\*\(1-f\.heading\)\) \+ 'px\)';/,'pages without the attribute keep the old fade-out');
  assert.match(css,/\.hw-main-v4 \.hw-future\[data-heading-travel\] \.hw-future-heading \{ color:color-mix\(in srgb,var\(--surface\) calc\(var\(--hw-future-heading-light,0\) \* 100%\),var\(--ink\)\);/,'ink → white as the photo covers the title');
  assert.match(css,/\.motion-ready \.hw-main-v4 \.hw-future\[data-heading-travel\] \.hw-future-heading\.is-revealed \{ transition:none; \}/,'no reveal transition lagging the scroll-driven move');
  assert.doesNotMatch(read('jll-remix-main-v2.html'),/data-heading-travel/,'V2 keeps the original scene');
});
