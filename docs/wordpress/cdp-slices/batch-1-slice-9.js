window.__batch+='nL2ZoXRMbZAwm71GZxhhtp+hqvSU7mUP91woAtOClfOyhczcdnA19cQHg5zX3FHr3qiSQxmbj5czlw9A0x3bF2WyVHZrSYLux3JLf2AvIaCnNH3pmbwmUfhBX82+o63Tj/X94JbBRvsFLRpr53Zuegjt9pD0a/+m7JdS4ZZj7Pf6ogzECK/n1mLtW2P+AoejW7BqDNFm2LYI3V3saNrag9lpKUN6Ak3CuEwLZIvyh05L5lLvgr19N2Unxln95OJaWi9xC/ltMgPlD3j9uiyXlrRGTQcg3iTfIAkifYpdwCOqfb15DEkYDEKS\\";window.__b64buf.length","awaitPromise":false}];
    const out={};
    for(const s of batch){
      let v=eval(s.expression);
      if(s.awaitPromise)v=await v;
      out[s.name]=v;
    }
    return out;
  })()';'ok'