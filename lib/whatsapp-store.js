import {createHash, randomUUID} from 'node:crypto';

export const TTL = 7 * 86400;
export const BEGIN = `
local cached = redis.call('GET', KEYS[3])
if cached then return {'cached'} end
if redis.call('EXISTS', KEYS[1]) == 1 then return {'busy'} end
local count = tonumber(redis.call('GET', KEYS[4]) or '0')
if ARGV[2] == '1' then
  if count >= 100 then return {'limited'} end
  redis.call('INCR', KEYS[4])
  redis.call('EXPIRE', KEYS[4], 90000)
end
redis.call('SET', KEYS[1], ARGV[1], 'EX', 30)
return {'ready', redis.call('GET', KEYS[2]) or ''}
`;
export const COMMIT = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[4])
redis.call('SET', KEYS[3], '1', 'EX', ARGV[4])
redis.call('DEL', KEYS[1])
return 1
`;
export const RELEASE = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`;

export function createStore(env, fetcher = fetch) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !url.startsWith('https://')) throw Error('storage_configuration');
  async function command(args) {
    const response = await fetcher(url, {method:'POST', headers:{Authorization:`Bearer ${token}`, 'Content-Type':'application/json'}, body:JSON.stringify(args), signal:AbortSignal.timeout(1500)});
    if (!response.ok) throw Error('storage_unavailable');
    const payload = await response.json();
    if (payload.error) throw Error('storage_unavailable');
    return payload.result;
  }
  return {
    async saveAlert(sid,result) {await command(['SET',`nyvara:hipotecas:7b:alert:${sid}`,JSON.stringify(result),'EX',TTL]);},
    async begin(from, sid, charge = true, now = new Date()) {
      const id = createHash('sha256').update(from).digest('hex');
      const base = `nyvara:hipotecas:7b:${id}`;
      const keys = [`${base}:lock`, `${base}:state`, `${base}:message:${sid}`, `nyvara:hipotecas:7b:budget:${now.toISOString().slice(0,10)}`];
      const lease = randomUUID();
      const result = await command(['EVAL', BEGIN, 4, ...keys, lease, charge ? '1' : '0']);
      if (!Array.isArray(result)) throw Error('storage_invalid');
      return {kind:result[0], value:result[1], keys, lease};
    },
    async commit(turn, state, reply) {
      const result = await command(['EVAL', COMMIT, 3, ...turn.keys.slice(0,3), turn.lease, JSON.stringify(state), reply, TTL]);
      if (result !== 1) throw Error('storage_commit');
    },
    async release(turn) { await command(['EVAL', RELEASE, 1, turn.keys[0], turn.lease]); }
  };
}
