(async()=>{
      const b64=window.__b64buf;window.__b64buf='';
      const bin=atob(b64);const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      const fd=new FormData();
      fd.append('file',new Blob([arr],{type:'image/webp'}),"estoque-itens-web.webp");
      fd.append('title',"Aero Suite — Estoque");
      fd.append('alt_text',"Aero Suite — Estoque");
      const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
      window.__asUrls["URL_ESTOQUE"]=m.source_url;
      return {key:"URL_ESTOQUE",url:m.source_url};
    })()