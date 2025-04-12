import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ProFinanzas - Sistema de Gestión de Préstamos',
  description: 'Aplicación interna para la gestión de préstamos en ProFinanzas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}