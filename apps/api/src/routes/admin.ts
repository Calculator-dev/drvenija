import { catalogueRoutes } from "./catalogue.js"
import type { FastifyPluginAsync } from "fastify"
import { mediaRoutes } from "./media.js"
import { verifyAdminSession } from "../plugins/admin-auth.js"
import { seedDashboard } from "../lib/seed.js"
import { orderReviewRoutes } from "./order-review.js"

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.decorateRequest("adminUser", null)
  app.addHook("preHandler", verifyAdminSession)

  app.get("/me", async (request) => ({ user: request.adminUser }))

  app.get("/dashboard", async () => {
    return seedDashboard
  })

  app.register(catalogueRoutes)

  app.register(orderReviewRoutes)

  app.register(mediaRoutes)
}
