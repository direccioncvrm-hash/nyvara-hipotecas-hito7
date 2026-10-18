// Atomic with webhook BEGIN/COMMIT. Never extend the customer's retention period.
export const ATTENTION = `
if redis.call('EXISTS',KEYS[1]) == 1 then return 'busy' end
local raw=redis.call('GET',KEYS[2])
if not raw then return 'missing' end
if redis.sha1hex(raw) ~= ARGV[2] then return 'stale' end
redis.call('SET',KEYS[2],ARGV[3],'KEEPTTL')
return 'ok'
`;

export function changeAttention(state, action) {
  const next=structuredClone(state);
  if(action==='take'){next.humanActive=true;next.paused=true;}
  else if(action==='return'){next.humanActive=false;next.paused=false;}
  else if(action==='resolve'){next.handoffRequested=false;}
  else throw Error('invalid_action');
  return next;
}
