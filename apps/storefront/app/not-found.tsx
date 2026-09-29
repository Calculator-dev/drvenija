import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">404</p>
      <h1 className="mt-4 font-serif text-5xl">Stranica nije pronađena</h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        Ova ruta trenutno ne postoji. Vratite se na početnu ili otvorite shop.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/" className="inline-flex h-12 items-center justify-center bg-foreground px-6 text-sm tracking-wide text-background">
          Početna
        </Link>
        <Link href="/shop" className="inline-flex h-12 items-center justify-center border border-border px-6 text-sm tracking-wide">
          Shop
        </Link>
      </div>
    </div>
  )
}
