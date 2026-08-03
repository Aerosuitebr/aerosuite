/** CDP expression: fetch chunks 4-13 from local server and append. */
export const expression = `(async()=>{
  const start=4,end=13,port=${process.env.CHUNK_PORT||8765};
  for(let i=start;i<=end;i++){
    const r=await fetch('http://127.0.0.1:'+port+'/chunk/'+i);
    if(!r.ok) throw new Error('fetch chunk '+i+' '+r.status);
    window.__b64buf+=await r.text();
  }
  return window.__b64buf.length;
})()`;
