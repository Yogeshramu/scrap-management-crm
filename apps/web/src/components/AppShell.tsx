'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/') {
    return <main>{children}</main>;
  }

  return (
    <div
      className="app-container"
      style={{ gridTemplateColumns: `${collapsed ? 72 : 280}px 1fr` }}
    >
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      <main className="main-content">{children}</main>
    </div>
  );
}
