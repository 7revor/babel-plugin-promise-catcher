function update(){

  // ... ...
  itemUpdate(item).then(result=>{
    //...
  })

  itemDetailGet(item).then(res=>{
    //...
  }).catch(e=>{
    //原有逻辑
  })

  addLog(item).catch(e=>{
    //原有逻辑
  })

  // ... ...
}
