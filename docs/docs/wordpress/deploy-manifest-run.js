(async()=>{
  const steps=JSON.parse(atob(window.__manifestb64));
  const results=[];
  for(let i=0;i<steps.length;i++){
    const result=await new Function('return ('+steps[i]+')')();
    results.push({step:i,result});
  }
  return {ok:true,results,last:results[results.length-1]?.result};
})()