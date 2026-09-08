import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { Pool } from "pg";
import { Redis } from "ioredis";

function parseOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getTrustedOrigins(): string[] {
  const origins = parseOrigins(process.env.CORS_ORIGINS);
  return origins.length > 0 ? origins : ["http://localhost:3001"];
}

export const trustedOrigins = getTrustedOrigins();

const redis = new Redis(`${process.env.REDIS_URL}?family=0`)
  .on("error", (err) => {
    console.error("Redis connection error:", err);
  })
  .on("connect", () => {
    console.log("Redis connected");
  })
  .on("ready", () => {
    console.log("Redis ready");
  });

// Check better-auth docs for more info https://www.better-auth.com/docs/
export const auth = betterAuth({
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  // Session config
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  // Add your plugins here
  plugins: [openAPI()],
  // DB config
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  // This is for the redis session storage
  secondaryStorage: {
    get: async (key) => {
      const value = await redis.get(key);
      return value ? value : null;
    },
    set: async (key, value, ttl) => {
      if (ttl) {
        await redis.set(key, value, "EX", ttl);
      } else {
        await redis.set(key, value);
      }
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },
});
