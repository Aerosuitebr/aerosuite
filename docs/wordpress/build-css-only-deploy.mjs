import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const deployScript = `(async()=>{
  const css=${JSON.stringify(css)};
  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  const cssRe=/<style id="aerosuite-premium-css">[\\s\\S]*?<\\/style>/;
  if(!cssRe.test(footer)) throw new Error('css missing');
  footer=footer.replace(cssRe,'<style id="aerosuite-premium-css">'+css+'</style>');
  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
  return{ok:true,len:css.length};
})()`;
fs.writeFileSync(path.join(dir, '.deploy-css-only-once.js'), deployScript);
