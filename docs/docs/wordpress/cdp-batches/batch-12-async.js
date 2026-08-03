(async()=>{
      const b64=window.__b64buf;window.__b64buf='';
      const bin=atob(b64);const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      const fd=new FormData();
      fd.append('file',new Blob([arr],{type:'image/webp'}),"propostas-comerciais-web.webp");
      fd.append('title',"Aero Suite — Propostas comerciais");
      fd.append('alt_text',"Aero Suite — Propostas comerciais");
      const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
      window.__asUrls["URL_COMERCIAL"]=m.source_url;
      return {key:"URL_COMERCIAL",url:m.source_url};
    })()