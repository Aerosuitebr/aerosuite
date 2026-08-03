(async()=>{
      const b64=window.__b64buf;window.__b64buf='';
      const bin=atob(b64);const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      const fd=new FormData();
      fd.append('file',new Blob([arr],{type:'image/webp'}),"os-list-web.webp");
      fd.append('title',"Aero Suite — Ordens de serviço");
      fd.append('alt_text',"Aero Suite — Ordens de serviço");
      const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
      window.__asUrls["URL_OS"]=m.source_url;
      return {key:"URL_OS",url:m.source_url};
    })()