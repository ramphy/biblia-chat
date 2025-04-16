import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers'; // Import the Providers component
import NavbarComponent from './components/navbar'; // Import the Navbar

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biblia.chat - Explora la biblia como nunca antes.",
  description: "Asistente Bíblico con Inteligencia Artificial. Siempre disponible. Sin publicidad.",
};

export default function RootLayout({
  children,
  params: { lng }, // Changed locale to lng
}: Readonly<{
  children: React.ReactNode;
  params: { lng: string }; // Changed locale to lng
}>) {
  return (
    <html lang={lng}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <NavbarComponent />
          {children}
        </Providers>
      </body>
    </html>
  );
}
