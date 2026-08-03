console.log(
  JSON.stringify({
    viewId: process.argv[2] || '265634',
    method: 'Runtime.evaluate',
    params: {
      expression:
        "(async()=>{const j=await(await fetch('http://127.0.0.1:18765/expr')).json();let v=eval(j.params.expression);if(v&&typeof v.then==='function')v=await v;return v;})()",
      awaitPromise: true,
      returnByValue: true,
    },
  })
);
