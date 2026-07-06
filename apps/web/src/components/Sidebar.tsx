'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  TrendingUp,
  Truck,
  CalendarMinus2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const links = [
  { href: '/', label: 'Overview Specs', icon: LayoutDashboard },
  { href: '/purchases', label: 'Purchase Inbound', icon: ShoppingBag },
  { href: '/sales', label: 'Sales Outbound', icon: TrendingUp },
  { href: '/transport', label: 'Transporters Lot', icon: Truck },
  { href: '/vehicles', label: 'Fleet & Alerts', icon: CalendarMinus2 },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* Toggle row */}
      <div className="sidebar-toggle-row">
        <div className="sidebar-logo-wrap">
          <div className="logo-icon">NA</div>
          <span className="logo-text">Nur Afiq Recycles</span>
        </div>
        <button className="sidebar-toggle-btn" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav links */}
      <ul className="nav-links">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
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

      {/* Footer */}
      <div className="sidebar-footer">
        <p className="sidebar-footer-title">Operational Portal</p>
        <p className="sidebar-footer-sub">Nur Afiq Enterprises</p>
      </div>
    </aside>
  );
}
