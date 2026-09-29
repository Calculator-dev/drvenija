import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthGate } from "./auth-gate"
import { ApiError } from "./lib/api"
import { App } from "./app"
import "./styles.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Client errors (auth, validation, not found) won't succeed on retry.
      retry: (failures, error) => !(error instanceof ApiError && error.status < 500) && failures < 3,
    },
  },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthGate><App /></AuthGate>
    </QueryClientProvider>
  </React.StrictMode>,
)
