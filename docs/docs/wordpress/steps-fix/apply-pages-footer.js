(async()=>{
      const logo=(window.__lastLogo||{}).source_url;
      const est=(window.__lastEstoque||{}).source_url;
      if(!logo||!est) return {err:'missing uploads',logo:!!logo,est:!!est};
      for(const id of [21,20]){
        const page=await wp.apiFetch({path:'/wp/v2/pages/'+id+'?context=edit'});
        let c=page.content.raw||'';
        c=c.replace(/https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"'\s]*Pictureandletter[^"'\s]*/gi,logo);
        c=c.replace(/https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"'\s]*estoque-itens[^"'\s]*/gi,est);
        c=c.replace(/https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"'\s]*estoque-fifo[^"'\s]*/gi,est);
        if(!c.includes('as-hero-cover')) c=c.replace('wp-block-cover alignfull','wp-block-cover alignfull as-hero-cover');
        await wp.apiFetch({path:'/wp/v2/pages/'+id,method:'POST',data:{content:c}});
      }
      return {logo,est,ok:true};
    })()