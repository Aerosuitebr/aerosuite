(async()=>{
    const hero=window.__urls.hero;
    const est=window.__urls.estoque;
    for(const id of [21,20]){
      let c=(await wp.apiFetch({path:'/wp/v2/pages/'+id+'?context=edit'})).content.raw||'';
      c=c.replace(/https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"'\s]*(Pictureandletter|aerosuite-logo-light)[^"'\s]*/gi,hero);
      c=c.replace(/https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"'\s]*estoque-(fifo|itens)[^"'\s]*/gi,est);
      await wp.apiFetch({path:'/wp/v2/pages/'+id,method:'POST',data:{content:c}});
    }
    return {hero,est,ok:true};
  })()