const html = await fetch(`https://aerosuite.com.br/solucoes/?nocache=${Date.now()}`).then((r) => r.text());
const home = await fetch(`https://aerosuite.com.br/?nocache=${Date.now()}`).then((r) => r.text());

function logos(label, t) {
  const imgs = [...t.matchAll(/<img[^>]+>/gi)].map((m) => m[0]);
  const hits = imgs.filter((tag) => /site-logo|custom-logo|as-hero-v2__logo/i.test(tag));
  console.log('\n' + label);
  hits.forEach((tag) => console.log(tag.slice(0, 280)));
}

logos('HOME', home);
logos('SOLUCOES', html);
