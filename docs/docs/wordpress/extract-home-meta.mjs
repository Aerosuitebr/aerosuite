const h = await (await fetch('https://aerosuite.com.br/')).text();
const imgs = [...h.matchAll(/https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^\s"'<>]+\.webp/gi)].map((m) => m[0]);
const unique = [...new Set(imgs)];
console.log('webp', unique.length);
unique.forEach((u) => console.log(u));
const legal = [...h.matchAll(/href="([^"]*(?:privacidade|termos)[^"]*)"/gi)].map((m) => m[1]);
console.log('legal links', legal);
console.log('sticky-cta js', /aerosuite-sticky-cta/.test(h));
console.log('whatsapp float', /as-wa-float|whatsapp-float|fab-whatsapp/i.test(h));
