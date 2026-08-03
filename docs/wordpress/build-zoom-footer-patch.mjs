import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const zoomJs = fs.readFileSync(path.join(dir, 'aerosuite-showcase-zoom.js'), 'utf8');
const zoomCss = `
.as-ui-shot{overflow:hidden;cursor:zoom-in;background:#0d1117;min-height:200px}
.as-ui-shot img{min-height:200px;object-fit:cover;object-position:top center;transition:transform .45s cubic-bezier(.22,1,.36,1);transform-origin:center top}
.as-ui-card:hover .as-ui-shot img,.as-ui-shot:focus-within img{transform:scale(1.14)}
.as-ui-shot__hint{display:block;margin:0 12px 8px;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(232,197,71,.75);text-align:center}
.as-shot-lightbox{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:rgba(5,26,61,.94);cursor:zoom-out}
.as-shot-lightbox img{max-width:min(1280px,96vw);max-height:92vh;border-radius:12px;box-shadow:0 24px 80px rgba(0,0,0,.55);border:1px solid rgba(201,162,39,.35)}
`;

const ex = `(async()=>{
  const zoomJs=${JSON.stringify(zoomJs)};
  const zoomCss=${JSON.stringify(zoomCss)};
  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  if(!footer.includes('as-shot-lightbox')){
    footer=footer.replace('</style>',zoomCss+'</style>');
  }
  if(!footer.includes('aerosuite-showcase-zoom-js')){
    footer=footer.replace('</script>\\n<!-- /wp:html -->','</script>\\n<script id="aerosuite-showcase-zoom-js">'+zoomJs+'</script>\\n<!-- /wp:html -->');
  }
  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
  return{ok:true};
})()`;

fs.writeFileSync(path.join(dir, 'zoom-footer-patch.js'), ex);
console.log('bytes', ex.length);
