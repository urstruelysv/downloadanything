import { Redis } from "@upstash/redis";

let _client: Redis | null = null;

export function redis(): Redis {
  if (_client) return _client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Upstash env not configured");
  }
  _client = new Redis({ url, token });
  return _client;
}
