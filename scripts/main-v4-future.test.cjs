const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n?/g,'\n');

test('V4 고객지원 장면: the title travels from the top centre to the sentence spot over the growing photo, turns white on the way and stays there, left-aligned',()=>{
  const main=read('jll-remix-main-v4.html'),css=read('jll-remix-main-v4.css'),js=read('jll-remix-hanwha.js');
  assert.match(main,/<section class="hw-future" id="hw-future" aria-labelledby="hw-future-title" data-heading-travel>/,'V4 opts in');
  assert.match(main,/<div class="hw-future-heading" data-reveal>\s*<p class="hw-kicker">고객지원 <sps-arrow-up-right><\/sps-arrow-up-right><\/p>\s*<h2 id="hw-future-title"><span>어떤 도움이<\/span><br><span>필요하신가요\?<\/span><\/h2>/,'the title keeps its words; each line is a span so it can slide to the left edge');
  assert.match(main,/<div class="hw-future-top wrap"><p>고객지원<\/p><h3><span>우리 건물의 고민,<\/span><span>함께 정리합니다\.<\/span><\/h3><\/div>/,'the destination sentence stays in the markup as the landing spot');
  assert.match(css,/\.hw-main-v4 \.hw-future\[data-heading-travel\] \.hw-future-top \{ visibility:hidden; \}/,'but is never shown: the title no longer turns into 우리 건물의 고민');
  assert.match(js,/headingRows = rows\.map\(el => \{ text\.selectNodeContents\(el\); return \{ el, x: from\.left - text\.getBoundingClientRect\(\)\.left \}; \}\);/,'kicker and lines measure how far they sit right of the title text edge');
  assert.match(js,/metrics\.headingRows\.forEach\(row => \{ row\.el\.style\.transform = 'translateX\(' \+ \(row\.x\*go\)\.toFixed\(1\) \+ 'px\)'; \}\);/,'and close that gap along the same travel: centre → left alignment');
  assert.match(js,/futureHeading\.style\.opacity = 1;/,'the title never fades out');
  assert.match(js,/const headingTravel = Boolean\(future && future\.hasAttribute && future\.hasAttribute\('data-heading-travel'\)\);/);
  assert.match(js,/headingShift = \{ x: to\.left - from\.left, y: to\.top - h2\.getBoundingClientRect\(\)\.top \};/,'the shift is measured from the h2 text box to the h3 box with transforms cleared');
  assert.match(js,/futureHeading\.style\.transform = 'translate\(' \+ \(shift\.x\*go\)\.toFixed\(1\) \+ 'px,' \+ \(shift\.y\*go\)\.toFixed\(1\) \+ 'px\)';/,'and eased along the travel progress');
  assert.match(js,/futureHeading\.style\.setProperty\('--hw-future-heading-light', f\.light\.toFixed\(3\)\);/);
  assert.doesNotMatch(js,/futureHeadingLight|cloneNode/,'no clipped white twin (tried 2026-10-22, the blend read better)');
  assert.match(js,/\} else \{\s*futureHeading\.style\.opacity = f\.heading;\s*futureHeading\.style\.transform = 'translateY\(' \+ \(-30\*\(1-f\.heading\)\) \+ 'px\)';/,'pages without the attribute keep the old fade-out');
  assert.match(css,/\.hw-main-v4 \.hw-future\[data-heading-travel\] \.hw-future-heading \{ color:color-mix\(in srgb,var\(--surface\) calc\(var\(--hw-future-heading-light,0\) \* 100%\),var\(--ink\)\);/,'ink → white as the photo covers the title');
  assert.match(css,/\.hw-main-v4 \.hw-future\[data-heading-travel\] \.hw-future-heading \.hw-kicker \{ color:color-mix\(in srgb,var\(--surface\) calc\(var\(--hw-future-kicker-light,0\) \* 100%\),var\(--ink\)\); \}/,'the kicker whitens later, once covered');
  assert.match(css,/\.motion-ready \.hw-main-v4 \.hw-future\[data-heading-travel\] \.hw-future-heading\.is-revealed \{ transition:none; \}/,'no reveal transition lagging the scroll-driven move');
  assert.doesNotMatch(read('jll-remix-main-v2.html'),/data-heading-travel/,'V2 keeps the original scene');
});
