const html = await fetch('https://aerosuite.com.br/').then((r) => r.text());
for (const needle of ['aero-colorido-logo', 'hero-logo-transparent-v2', 'Pictureandletter-1']) {
  const idx = html.indexOf(needle);
  console.log('\n===', needle, '===');
  if (idx === -1) {
    console.log('not found');
    continue;
  }
  console.log(html.slice(Math.max(0, idx - 120), idx + needle.length + 120));
}
