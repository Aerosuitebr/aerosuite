const h = await (await fetch('https://aerosuite.com.br/')).text();
const idx = h.indexOf('<footer class="as-site-chrome"');
console.log(idx > 0 ? h.slice(idx, idx + 2000) : 'footer not found');
console.log('termos link', h.includes('termos-de-uso'));
