import { ZodError } from "zod"
import { pool } from "./db/client.js"
import cors from "@fastify/cors"
import sensible from "@fastify/sensible"
import Fastify from "fastify"
import { publicRoutes } from "./routes/public.js"
import { adminRoutes } from "./routes/admin.js"

export function createApp() {
  const app = Fastify({ logger: { redact: ["req.headers.authorization", "req.headers.cookie"] } })

  app.addHook("onClose", async () => { await pool.end() })
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ message: "Invalid request", fields: error.issues.map((issue) => issue.path.join(".")) })
    }
    const failure = error as { statusCode?: number; code?: string; message?: string }
    const status = failure.statusCode ?? 500
    if (status >= 500) request.log.error({ code: failure.code }, "Request failed")
    return reply.code(status).send({ message: status >= 500 ? "Internal server error" : failure.message })
  })

  app.register(cors, {
    origin: true,
    credentials: true,
  })
  app.register(sensible)

  app.get("/health", async () => ({ ok: true }))
  app.register(publicRoutes, { prefix: "/public" })
  app.register(adminRoutes, { prefix: "/admin" })

  return app
}
