import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth, getTrustedOrigins } from "./lib/auth";

const app = new Hono();

app.use(logger());

app.use(
  "/api/auth/*",
  cors({
    origin: (origin) =>
      getTrustedOrigins().includes(origin) ? origin : "",
    allowHeaders: ["Content-Type", "Authorization", "Better-Auth-Cookie"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Set-Better-Auth-Cookie"],
    maxAge: 600,
    credentials: true,
  }),
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Better Auth routes, see docs before changing
 * @link https://better-auth.com/docs
 */
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

export default {
  port: Number(process.env.PORT) || 3000,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
