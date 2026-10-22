import type { Metadata } from 'next';
import '../presentation/styles/global.css';

export const metadata: Metadata = {
  title: 'F1 Manager Web (Arcade)',
  description: 'Simulador táctico y arcade de gestión de Fórmula 1 en el navegador',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
