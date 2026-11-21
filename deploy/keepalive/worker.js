/**
 * Keeps the free API host awake and the free Supabase database active.
 *
 * Render's free plan puts the API to sleep after 15 minutes without requests, and waking it
 * takes about a minute, which would make the first webshop visit fail. Every 10 minutes this
 * Worker requests the public catalogue (which also queries the database).
 */
export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(ping(env))
  },
  // Visiting the Worker's URL runs a ping too, handy for checking it works.
  async fetch(_request, env) {
    const result = await ping(env)
    return Response.json(result, { status: result.ok ? 200 : 502 })
  },
}

async function ping(env) {
  const url = `${String(env.API_URL).replace(/\/$/, "")}/public/catalogue`
  const started = Date.now()
  try {
    const response = await fetch(url, { headers: { "user-agent": "drvenija-keepalive" }, signal: AbortSignal.timeout(90_000) })
    return { ok: response.ok, status: response.status, ms: Date.now() - started }
  } catch (error) {
    return { ok: false, error: String(error), ms: Date.now() - started }
  }
}
