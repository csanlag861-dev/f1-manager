import type { Metadata, Viewport } from 'next';
import '../presentation/styles/global.css';
import { ServiceWorkerRegister } from '../presentation/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'F1 Manager Web (Arcade)',
  description: 'Simulador táctico y arcade de gestión de Fórmula 1 en el navegador',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'F1 Manager Arcade',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0c10',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}

