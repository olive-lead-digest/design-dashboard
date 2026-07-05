import type { Metadata } from 'next';
import { Inter, Poppins, Fira_Code } from 'next/font/google';
import '@/styles/globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-poppins' });
const fira = Fira_Code({ subsets: ['latin'], variable: '--font-fira' });

export const metadata: Metadata = {
  title: 'Olive Living — Design & Project Management',
  description: 'Design & Project Management Dashboard for Olive Living (@oliveliving.com only)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${fira.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
