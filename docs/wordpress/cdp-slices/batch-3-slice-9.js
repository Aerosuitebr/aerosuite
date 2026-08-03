window.__batch+='lseg5XOZ\\";window.__b64buf.length","awaitPromise":false}];
    const out={};
    for(const s of batch){
      let v=eval(s.expression);
      if(s.awaitPromise)v=await v;
      out[s.name]=v;
    }
    return out;
  })()';'ok'