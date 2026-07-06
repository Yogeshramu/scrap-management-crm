'use client';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);

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
