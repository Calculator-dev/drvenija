import { NavLink } from "react-router"
import { cn } from "../lib/utils"

const tabs = [
  { to: "/levha", label: "Zahtjevi" },
  { to: "/levha/tekstovi", label: "Tekstovi" },
  { to: "/levha/cijene", label: "Cijene" },
] as const

/** Sub-pages of the custom levha configurator. */
export function LevhaTabs() {
  return (
    <nav aria-label="Levhe" className="mt-6 flex flex-wrap gap-2 border-b border-border">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) => cn(
            "-mb-px border-b-2 px-4 py-2 text-sm transition-colors",
            isActive ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
