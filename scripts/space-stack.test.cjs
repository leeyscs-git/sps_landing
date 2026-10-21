const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=f=>fs.readFileSync(require.resolve('../'+f),'utf8');

test('the label → title → text → link stack spacing is one fixed token scale shared by every stacked block',()=>{
  const tokens=read('jll-remix-tokens.css');
  assert.match(tokens,/--space-stack-label: 16px;/);assert.match(tokens,/--space-stack-text: 12px;/);assert.match(tokens,/--space-stack-action: 28px;/);
  const uses={
    'jll-remix-services3.css':['--space-stack-label','--space-stack-action'],
    'jll-remix-hanwha.css':['--space-stack-label','--space-stack-action'],
    'jll-remix-main-v4.css':['--space-stack-text','--space-stack-action','--space-stack-label'],
    'jll-remix-vision-fusion.css':['--space-stack-label'],
  };
  for(const [file,names] of Object.entries(uses)){const css=read(file);for(const n of names)assert.ok(css.includes('var('+n),file+' uses '+n);}
  // 토큰은 고정값: 화면 크기에 따라 바뀌는 clamp/vw/vh 나 미디어 쿼리 재정의가 없다
  assert.doesNotMatch(tokens,/--space-stack-[a-z]+:[^;]*(clamp|vw|vh)/);
  for(const f of ['jll-remix-tokens.css','jll-remix-theme.css','jll-remix-main-v4.css','jll-remix-hanwha.css'])assert.doesNotMatch(read(f),/--space-stack-[a-z]+\s*:(?!\s*(16|12|28)px;)/,f+' does not redefine the stack scale');
  assert.doesNotMatch(read('jll-remix-main-v4.css'),/hw-news-grid a > span \{ margin-top:12px; \}/,'no mobile override of the title → link gap');
});
