const html = await fetch(`https://aerosuite.com.br/?nocache=${Date.now()}`).then((r) => r.text());
const idx = html.indexOf('<footer class="as-site-chrome"');
console.log('footer idx', idx);
console.log(html.slice(idx, idx + 800));
console.log('hero', html.match(/class="as-hero-v2__logo"[^>]*src="([^"]+)"/)?.[1]);
console.log('preload', html.match(/as-preload-hero-logo[^>]*href="([^"]+)"/)?.[1]);
