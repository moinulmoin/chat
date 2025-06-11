import { Redis } from "ioredis";

/*
 * A **single** Redis connection that is re-used across the entire
 * Lambda / Edge / Node runtime.  All options are tuned for the
 * resumable-stream helper and serverless environments:
 *   • keepAlive            – keep the TCP socket open between invocations
 *   • enableAutoPipelining – batches commands issued in the same tick
 *   • maxRetriesPerRequest – retry a couple of times before failing
 *   • showFriendlyErrorStack – useful during local development
 */
export const redis = new Redis(process.env.REDIS_URL!, {
  // keeps the socket open so "Socket closed unexpectedly" goes away
  keepAlive: 15000,
  // bundle multiple commands automatically
  enableAutoPipelining: true,
  // try a few times before erroring – set to `null` for infinite retries
  maxRetriesPerRequest: 5,
  // only show long stacks locally
  showFriendlyErrorStack: process.env.NODE_ENV !== "production",
});

// The resumable-stream context needs **two** connections: one for
// publishing (writes) and one for subscribing (pub/sub).  ioredis lets us
// duplicate a connection very cheaply.

export const redisSubscriber = redis.duplicate();
