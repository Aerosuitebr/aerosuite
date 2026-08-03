const ORIGIN = 'https://aerosuite.com.br';
const pick = (html) => html.match(/name="wpforms\[token\]" value="([^"]+)"/)?.[1] || null;

const t1 = await fetch(`${ORIGIN}/contato/?a=1`).then((r) => r.text());
const t2 = await fetch(`${ORIGIN}/contato/?b=${Date.now()}`).then((r) => r.text());
const preview = await fetch(`${ORIGIN}/?wpforms_form_preview=12`).then((r) => r.text());

console.log(JSON.stringify({
  contato1: pick(t1),
  contato2: pick(t2),
  preview: pick(preview),
  sameContato: pick(t1) === pick(t2),
}, null, 2));
