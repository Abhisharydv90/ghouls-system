import './globals.css';
import Sidebar from '../components/Sidebar';

export const metadata = {
  title: 'Ghouls OS | Command Center',
  description: 'Multi-Agent DAG Framework',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-gray-100 flex h-screen overflow-hidden font-mono">
        {/* The Sidebar component now wraps the entire app */}
        <Sidebar />
        <main className="flex-1 relative h-full overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}