(async()=>{
      const b64=window.__b64buf;window.__b64buf='';
      const bin=atob(b64);const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      const fd=new FormData();
      fd.append('file',new Blob([arr],{type:"image/png"}),"hero-logo-transparent.png");
      fd.append('title',"Aero Suite — logo hero");
      fd.append('alt_text',"Aero Suite — logo hero");
      const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
      window.__urls["hero"]=m.source_url;
      return m.source_url;
    })()