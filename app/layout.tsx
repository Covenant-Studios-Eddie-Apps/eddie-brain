import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'eddie brain',
  description: "Interactive visualization of Eddie's neural network — skills, memory, and connections",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ background: '#0a0a0f', margin: 0, padding: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
