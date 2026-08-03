(async()=>{
      const b64=window.__b64buf;window.__b64buf='';
      const bin=atob(b64);const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      const fd=new FormData();
      fd.append('file',new Blob([arr],{type:"image/png"}),"aerosuite-logo-light.png");
      fd.append('title',"Aero Suite — logotipo claro");
      fd.append('alt_text',"Aero Suite — logotipo claro");
      window.__lastLogo=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
    })();return window.__lastLogo;