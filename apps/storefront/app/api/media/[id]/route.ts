export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new Response(null, { status: 404 })
  const api = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "")
  try {
    const response = await fetch(`${api}/public/media/${id}`, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(10000) })
    const location = response.headers.get("location")
    if (response.status >= 300 && response.status < 400 && location) return new Response(null, { status: 302, headers: { Location: location, "Cache-Control": "no-store" } })
    return new Response(null, { status: response.status === 404 ? 404 : 502 })
  } catch { return new Response(null, { status: 502 }) }
}
