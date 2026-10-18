export function recordContact(previous,next,isNew,now){
  next.firstContactAt=previous.firstContactAt || (isNew?now:null);
  next.lastCustomerMessageAt=now;
}
