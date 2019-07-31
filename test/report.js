export function reportInfo(err,arr){
  if(err instanceof Error){
    sendMsg(err,arr)
  }
}
