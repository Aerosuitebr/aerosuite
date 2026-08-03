(async()=>{
  const base='http://127.0.0.1:8765';
  const names=['css-q1','css-q2','css-q3','css-q4','css-verify','css-finalize','enc-init','enc-0','enc-1','enc-2','enc-3','enc-run'];
  const steps={};
  const out={};
  const errors=[];
  for (const name of names){
    try{
      const params=await fetch(base+'/'+name).then(r=>{if(!r.ok)throw new Error('fetch '+name+' '+r.status);return r.json();});
      let v=eval(params.expression);
      if(params.awaitPromise) v=await v;
      steps[name]=v;
      if(name==='css-verify') out.cssVerify=v;
      if(name==='css-finalize') out.cssFinalize=v;
      if(name==='enc-run') out.encRun=v;
    }catch(e){
      errors.push({step:name,message:String(e&&(e.message||e))});
      throw e;
    }
  }
  return {...out,steps,errors};
})()
