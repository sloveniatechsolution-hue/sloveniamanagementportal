import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SMP - Slovenia Management Portal',
  description: 'Manage operators and electric meter assembly production securely.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-neutral-50 `}>
        <AuthProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div className="flex flex-col flex-1">
                <Navbar />
                <div className="flex-1">
                  {children}
                </div>
              </div>
              <Footer />
            </main>
          </div>
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
