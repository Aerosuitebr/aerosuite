const html = await fetch(`https://aerosuite.com.br/solucoes/?nocache=${Date.now()}`).then((r) => r.text());
console.log('hide-custom-logo', html.includes('custom-logo{display:none!important}'));
console.log('hide-in-header', html.includes('header.wp-block-template-part .custom-logo{display:none!important}'));
const idx = html.indexOf('aerosuite-critical-css');
console.log(html.slice(idx, idx + 800));
