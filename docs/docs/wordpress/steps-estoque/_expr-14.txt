(async()=>{
    const b64=window.__b64buf;window.__b64buf='';
    const bin=atob(b64);const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    const fd=new FormData();
    fd.append('file',new Blob([arr],{type:'image/png'}),'estoque-itens-web.png');
    fd.append('title','Aero Suite — Estoque FIFO');
    fd.append('alt_text','Módulo de estoque com rastreio FIFO');
    const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
    const url=m.source_url;
    const results=[];
    for(const id of [21,20]){
      const page=await wp.apiFetch({path:'/wp/v2/pages/'+id+'?context=edit'});
      let c=page.content.raw||'';
      c=c.replace(/estoque-itens-web\.webp/g,url.split('/').pop());
      c=c.replace(/https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"']*estoque-itens[^"']*/g,url);
      await wp.apiFetch({path:'/wp/v2/pages/'+id,method:'POST',data:{content:c}});
      results.push({id,url});
    }
    return {url,results};
  })()