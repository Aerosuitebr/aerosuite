const html = await fetch(`https://aerosuite.com.br/solucoes/?nocache=${Date.now()}`).then((r) => r.text());
console.log('as-site-header-logo', html.includes('as-site-header-logo'));
console.log('header-logo-css', html.includes('as-site-header-logo img'));
console.log('1254', html.includes('width="1254"'));
const m = html.match(/as-site-header-logo[\s\S]{0,250}/);
console.log(m?.[0] || 'missing');
const logos = [...html.matchAll(/<img[^>]+>/gi)].filter((x) => /logo|aero-colorido|site-header/i.test(x[0])).slice(0, 6);
logos.forEach((x) => console.log(x[0].slice(0, 220)));
