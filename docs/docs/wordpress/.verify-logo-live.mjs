const html = await fetch(`https://aerosuite.com.br/?nocache=${Date.now()}`).then((r) => r.text());
console.log('hero', html.match(/class="as-hero-v2__logo"[^>]*src="([^"]+)"/)?.[1]);
console.log('site-logo', html.match(/wp-block-site-logo[^>]*>[\s\S]*?src="([^"]+)"/)?.[1]);
console.log('custom-logo', html.match(/class="custom-logo"[^>]*src="([^"]+)"/)?.[1]);
console.log('footer-chrome', html.match(/as-site-chrome__brand[\s\S]*?src="([^"]+)"/)?.[1]);
console.log('preload-old', html.includes('hero-logo-transparent-v2'));
console.log('preload-new', html.includes('aero-colorido-logo'));
