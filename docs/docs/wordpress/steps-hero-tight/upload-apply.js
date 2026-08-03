(async()=>{
    const b64=window.__b64buf;window.__b64buf='';
    const bin=atob(b64);const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    const fd=new FormData();
    fd.append('file',new Blob([arr],{type:'image/png'}),'hero-logo-transparent-v2.png');
    fd.append('title','Aero Suite — logo hero');
    fd.append('alt_text','Aero Suite');
    const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
    const hero=m.source_url;
    for(const id of [21,20,16]){
      let c=(await wp.apiFetch({path:'/wp/v2/pages/'+id+'?context=edit'})).content.raw||'';
      c=c.replace(/https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"'\s]*(hero-logo-transparent|Pictureandletter|aerosuite-logo-light)[^"'\s]*/gi,hero);
      await wp.apiFetch({path:'/wp/v2/pages/'+id,method:'POST',data:{content:c}});
    }
    return {hero,ok:true};
  })()