(async()=>{
      const b64=window.__b64buf;window.__b64buf='';
      const bin=atob(b64);const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      const fd=new FormData();
      fd.append('file',new Blob([arr],{type:"image/png"}),"estoque-fifo-web.png");
      fd.append('title',"Aero Suite — Estoque FIFO");
      fd.append('alt_text',"Aero Suite — Estoque FIFO");
      window.__lastEstoque=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
    })();return window.__lastEstoque;