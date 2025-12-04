import './globals.css';

import Link from 'next/link';
import { Activity, Github, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'Xandeum pNode Analytics',
  description: 'Real-time observability for the Xandeum pNode gossip layer'
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-xandeum-950 text-zinc-100">
        {/* Cosmic gradient + aurora overlay */}
        <div className="pointer-events-none fixed inset-0">
          <div className="h-full w-full bg-hero-pattern" />
          <div className="h-full w-full bg-hero-aurora" />
        </div>

        <div className="relative">
          {/* Header */}
          <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-gradient-to-b from-black/40 to-black/10 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
              <Link
                href="/"
                className="group flex items-center gap-2.5 text-sm font-semibold tracking-wide transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-xandeum-gradient shadow-lg shadow-glow-teal">
                  <Activity className="h-5 w-5 text-xandeum-950" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-gradient-teal text-lg font-bold">XANDEUM</span>
                  <span className="ml-2 text-xs uppercase tracking-[0.3em] text-zinc-400">pNode Analytics</span>
                </div>
              </Link>

              <nav className="flex items-center gap-2">
                <NavLink href="/">Overview</NavLink>
                <NavLink href="/pnodes">pNodes</NavLink>
                <a
                  href="https://github.com/xandeum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition hover:border-xandeum-cyan/40 hover:text-white"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6">
            {props.children}
          </main>

          {/* Footer */}
          <footer className="border-t border-white/10 bg-gradient-to-b from-black/40 to-black/70 py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-xandeum-gradient shadow-glow-teal">
                    <Activity className="h-4 w-4 text-xandeum-950" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gradient-teal">XANDEUM</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Exabytes for Solana Programs</p>
                  </div>
                </div>

                <a
                  href="https://xandeum.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition hover:border-xandeum-cyan/40 hover:text-white"
                >
                  xandeum.network
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="mt-6 border-t border-white/5 pt-6 text-center text-xs text-zinc-500">
                © {new Date().getFullYear()} Xandeum. Built for the decentralized future.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

function NavLink(props: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={props.href}
      className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 transition hover:bg-white/5 hover:text-white"
    >
      {props.children}
    </Link>
  );
}
