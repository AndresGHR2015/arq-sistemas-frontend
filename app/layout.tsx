import { Suspense } from 'react';
import type { Metadata } from "next";
import "./globals.css";
import { WorkspaceProvider } from '@/components/nexo/store';

export const metadata: Metadata = {
  title: "Nexo · Tu espacio de proyectos",
  description: "Archivos, ideas y personas conectados en un mismo espacio de trabajo.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased"><WorkspaceProvider><Suspense fallback={<p>Cargando…</p>}>{children}</Suspense></WorkspaceProvider></body>
    </html>
  );
}
