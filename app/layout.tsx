import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Gambit · A Chess Studio",
  description:
    "Play a tuned bot, train tactics, and analyze positions with a coach that speaks plain English. A boutique chess studio.",
};

// Runs before hydration to set the color theme and avoid a flash of the
// wrong palette. Reads the saved preference, falling back to the OS setting.
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('gambit-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-parchment text-slate-900 antialiased dark:bg-charcoal dark:text-slate-100">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-300 px-6 py-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
            <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <span className="font-display text-sm tracking-tight text-slate-700 dark:text-slate-300">
                Gambit
              </span>
              <span>
                Built for study. Pieces by chess.js · Board by react-chessboard.
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
