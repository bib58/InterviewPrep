import { createClient } from 'redis';

let redisClient = global.redisClient;

if (!redisClient) {
  redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
      host: 'redis-12549.crce280.asia-south1-1.gcp.cloud.redislabs.com',
      port: 12549,
      connectTimeout: 3000,
      reconnectStrategy: (retries) => (retries > 2 ? false : 500)
    }
  });

  redisClient.on('error', err => console.error('Redis Client Error:', err?.message || err));
  redisClient.on('connect', () => console.log('Redis Connected successfully (Next.js)'));

  global.redisClient = redisClient;
}

export async function getRedisClient() {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (err) {
      console.warn('Redis connect warning:', err.message);
      throw err;
    }
  }
  return redisClient;
}

export default redisClient;

