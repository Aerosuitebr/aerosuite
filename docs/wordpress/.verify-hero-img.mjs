const html = await fetch('https://aerosuite.com.br/').then((r) => r.text());
const hero = html.match(/class="as-hero-v2__logo"[^>]*src="([^"]+)"/);
console.log('hero-img', hero?.[1] || 'missing');
