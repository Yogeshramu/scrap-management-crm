'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  TrendingUp,
  Truck,
  CalendarMinus2,
  Users,
  Building2,
  UserCheck,
  Receipt,
  CreditCard,
  CalendarDays,
  Banknote,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  LogOut,
  UserCircle,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const allLinks = [
  { href: '/dashboard', label: 'Overview Specs', icon: LayoutDashboard },
  { href: '/purchases', label: 'Purchase Inbound', icon: ShoppingBag },
  { href: '/sales', label: 'Sales Outbound', icon: TrendingUp },
  { href: '/transport', label: 'Transporters Lot', icon: Truck },
  { href: '/vehicles', label: 'Fleet & Alerts', icon: CalendarMinus2 },
  { href: '/employees', label: 'Employees', icon: Users, role: 'MANAGER' },
  { href: '/suppliers', label: 'Suppliers', icon: Building2 },
  { href: '/customers', label: 'Customers', icon: UserCheck },
  { href: '/expenses', label: 'Expenses', icon: CreditCard, role: 'MANAGER' },
  { href: '/attendance', label: 'Attendance', icon: CalendarDays },
  { href: '/salary', label: 'Salary', icon: Banknote, role: 'MANAGER' },
  { href: '/reports', label: 'Reports', icon: BarChart3, role: 'MANAGER' },
  { href: '/users', label: 'User Management', icon: ShieldCheck, role: 'ADMIN' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const roleRank: Record<string, number> = { STAFF: 0, MANAGER: 1, ADMIN: 2 };
  const visibleLinks = allLinks.filter(link => {
    if (!link.role) return true;
    if (!user) return false;
    return (roleRank[user.role] ?? 0) >= (roleRank[link.role] ?? 0);
  });

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* Toggle row */}
      <div className="sidebar-toggle-row">
        <div className="sidebar-logo-wrap">
          <div className="logo-icon">NA</div>
          <span className="logo-text">Nur Afiq Recycling</span>
        </div>
        <button className="sidebar-toggle-btn" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav links */}
      <ul className="nav-links" style={{ overflowY: 'auto', flex: 1 }}>
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? link.label : undefined}
              >
                <span className="nav-icon"><Icon size={18} /></span>
                <span className="nav-label">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer — expanded */}
      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserCircle size={24} style={{ color: '#c9a84c' }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user.role}</p>
            </div>
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <p className="sidebar-footer-sub">Loading...</p>
        )}
      </div>

      {/* Logout btn — collapsed only, outside hidden footer */}
      {collapsed && user && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '10px' }} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}
