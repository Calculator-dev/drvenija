import { defineCloudflareConfig } from "@opennextjs/cloudflare"

// Every page reads the live catalogue at request time, so no incremental (page) cache is
// configured; this keeps the deployment on Cloudflare's free plan without R2.
export default defineCloudflareConfig({})
