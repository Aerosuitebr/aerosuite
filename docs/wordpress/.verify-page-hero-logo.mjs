const base = process.argv[2] || 'https://aerosuite.com.br/sobre/';
const html = await fetch(`${base}?nocache=${Date.now()}`).then((r) => r.text());
console.log('url', base);
console.log('page-hero', html.match(/as-page-hero__media--logo[^>]*>[\s\S]*?src="([^"]+)"/)?.[1]);
