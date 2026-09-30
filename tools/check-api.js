// Live smoke test of the agent endpoint (site/api/password.php): output shape and length
// rules must match the page's generator. Usage: node tools/check-api.js [endpoint-url]
'use strict';
const B = process.argv[2] || 'https://asimplepassword.com/api/password';
const get = async (qs) => (await (await fetch(B + qs)).text()).trim();

(async () => {
  let bad = 0;
  const check = (label, p, re, max) => {
    if (!re.test(p) || (max && p.length > max)) { bad++; console.log('BAD', label, JSON.stringify(p)); }
  };
  for (let i = 0; i < 20; i++) { const p = await get(''); check('default', p, /^[a-z]{5}-[A-Z]{5}-[a-z]{5}-\d$/); if (p.length !== 19) { bad++; console.log('BAD default length', p); } }
  for (let i = 0; i < 10; i++) check('memorable 5 words pt', await get('?memorable=1&words=5&lang=pt'), /^[a-z]+-[A-Z]+-[a-z]+-[A-Z]+-[a-z]+-\d$/);
  for (let i = 0; i < 10; i++) check('max 16', await get('?max=16'), /^[a-z]+-[A-Z]+-[a-z]+-\d$/, 16);
  for (let i = 0; i < 10; i++) check('memorable max 18 es', await get('?memorable=1&max=18&lang=es'), /^[a-z]+-[A-Z]+-[a-z]+-\d$/, 18);
  const j = JSON.parse(await get('?format=json'));
  if (typeof j.password !== 'string' || j.length !== j.password.length) { bad++; console.log('BAD json', j); }
  const res = await fetch(B + '?words=9');
  if (res.status !== 400) { bad++; console.log('BAD: words=9 gave', res.status); }
  const unique = new Set(); for (let i = 0; i < 10; i++) unique.add(await get(''));
  if (unique.size < 10) { bad++; console.log('BAD: repeated passwords', [...unique]); }
  console.log(bad ? 'api FAILED (' + bad + ')' : 'ok   api/password');
  process.exit(bad ? 1 : 0);
})();
