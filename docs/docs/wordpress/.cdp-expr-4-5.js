(async()=>{
  const steps=["(async()=>{window.__cssb64=(window.__cssParts||[]).join('');window.__cssParts=null;return{len:window.__cssb64.length,ok:window.__cssb64.length===34708}})()","(async()=>{const css=atob(window.__cssb64);return{b64:window.__cssb64.length,dec:css.length,hasGrid:css.includes('as-hero-v2__grid')}})()"];
  const results={};
  for(let i=0;i<steps.length;i++){
    const n=4+i;
    try{
      let v=eval(steps[i]);
      if(v&&typeof v.then==='function')v=await v;
      results[n]=v;
    }catch(e){
      results[n]={error:String(e)};
      break;
    }
  }
  return results;
})()