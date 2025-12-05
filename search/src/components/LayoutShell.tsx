import { ReactNode } from 'react'

type LayoutShellProps = {
  children: ReactNode
}

export default function LayoutShell({ children }: LayoutShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo-placeholder" aria-hidden="true">
          Logo
        </div>
        <div className="brand-text">
          The Brandon Wilcox Home Group at 616 Realty
        </div>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        © The Brandon Wilcox Home Group – Project X beta
      </footer>
    </div>
  )
}
