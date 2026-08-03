(async()=>{
  const expectedB64=26780;
  const got=(window.__homeb64||'').length;
  if(got!==expectedB64){
    return{ok:false,error:'b64 length mismatch',got,expectedB64};
  }
  const bin=atob(window.__homeb64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  const homeContent=new TextDecoder('utf-8').decode(bytes);
  if(!homeContent.includes('Integrações podem ser avaliadas na demo')){
    return{ok:false,error:'content integrity check failed',homeLen:homeContent.length,tail:homeContent.slice(-120)};
  }
  const seo={"title":"Aero Suite — Gestão aeronáutica para oficinas MRO | Rastreabilidade e conformidade","excerpt":"Plataforma SaaS para oficinas, MROs e OMs: OS, estoque FIFO, propostas, documentos e portal do cliente com rastreabilidade e controle operacional. Agende uma demonstração."};
  const sample=homeContent.match(/demonstra[^<]{0,12}/)?.[0]||'';
  await wp.apiFetch({path:'/wp/v2/pages/21',method:'POST',data:{content:homeContent,title:seo.title,excerpt:seo.excerpt,status:'publish'}});
  return{ok:true,homeLen:homeContent.length,sample,hasHeroV2:homeContent.includes('as-hero-v2'),title:seo.title,b64Len:got};
})()