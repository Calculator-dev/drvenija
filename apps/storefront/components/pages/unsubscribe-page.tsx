"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { unsubscribeNewsletter } from "@/lib/products"

// Unsubscribing needs a click, so link previews and mail scanners do not unsubscribe people.
export function UnsubscribePage({ token }: { token: string }) {
  const t = useTranslations("newsletter")
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle")
  const valid = /^[0-9a-f-]{36}$/i.test(token)

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center md:px-6">
      <h1 className="font-serif text-4xl">{t("unsubscribeTitle")}</h1>
      {state === "done" ? (
        <p role="status" className="mt-5 text-sm text-muted-foreground">{t("unsubscribed")}</p>
      ) : !valid ? (
        <p className="mt-5 text-sm text-muted-foreground">{t("invalidLink")}</p>
      ) : (
        <>
          <p className="mt-5 text-sm text-muted-foreground">{t("unsubscribeText")}</p>
          <button
            type="button"
            disabled={state === "sending"}
            onClick={async () => {
              setState("sending")
              try {
                await unsubscribeNewsletter(token)
                setState("done")
              } catch {
                setState("error")
              }
            }}
            className="mt-8 h-12 bg-accent px-6 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
          >
            {t("unsubscribeButton")}
          </button>
          {state === "error" && <p role="alert" className="mt-4 text-sm text-destructive">{t("error")}</p>}
        </>
      )}
    </div>
  )
}
