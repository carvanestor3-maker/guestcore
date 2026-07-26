import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/app/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "guestcore — scoring de huéspedes",
  description: "Veraz inmobiliario para alquiler temporario",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "guestcore",
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
};

const NAV_LINKS = [
  { href: "/", label: "Panel" },
  { href: "/buscar", label: "Consultar huésped" },
  { href: "/usuarios", label: "Usuarios" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/reservas", label: "Reservas" },
  { href: "/reportes", label: "Reportes" },
  { href: "/tarifas", label: "Tarifas" },
  { href: "/administracion", label: "Administración" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              guestcore
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-neutral-900 hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-400">
          guestcore — interfaz de prueba
        </footer>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
