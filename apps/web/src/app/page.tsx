import Link from 'next/link';
import { ShieldCheck, TrendingUp, Users, Truck, Car, BarChart3 } from 'lucide-react';

const features = [
  { icon: TrendingUp, title: 'Sales & Purchases', desc: 'Track invoices, purchases, and revenue in real time.' },
  { icon: Users, title: 'Employee Management', desc: 'Manage staff, attendance, and salary processing.' },
  { icon: Truck, title: 'Transport & Logistics', desc: 'Monitor trips, transporters, and towing settlements.' },
  { icon: Car, title: 'Fleet Compliance', desc: 'Automated alerts for road tax, insurance, and inspections.' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Cashbook, expense reports, and operational insights.' },
  { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Secure access control for admins and staff.' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: '#f1f5f9' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>N</div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Nur Afiq Recycling</span>
        </div>
        <Link href="/login" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '10px 24px', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
          Login to CRM
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px' }}>
        <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '999px', padding: '6px 18px', fontSize: '0.8rem', color: '#a5b4fc', marginBottom: '28px', fontWeight: 500 }}>
          Scrap Management CRM
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '24px', background: 'linear-gradient(135deg, #f1f5f9 40%, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Business Operations,<br />Fully Under Control
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '520px', margin: '0 auto 40px', lineHeight: 1.7 }}>
          An all-in-one enterprise system for managing scrap purchases, sales, fleet compliance, employees, and financials.
        </p>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '14px 36px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}>
          Login to CRM →
        </Link>
      </section>

      {/* Features */}
      <section style={{ padding: '0 48px 100px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px', transition: 'border-color 0.2s' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', marginBottom: '16px' }}>
                <Icon size={22} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>{title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#475569', fontSize: '0.85rem' }}>
        © {new Date().getFullYear()} Nur Afiq Recycling. All rights reserved.
      </footer>
    </div>
  );
}
