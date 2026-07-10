'use client';

import { useState, useEffect } from 'react';
import { Plus, ShieldCheck, Save, X, Pencil, Trash2, KeyRound, UserCircle } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  createdAt: string;
}

const ROLES = [
  { value: 'ADMIN', label: 'Admin — Full Access' },
  { value: 'MANAGER', label: 'Manager — All except User Mgmt' },
  { value: 'STAFF', label: 'Staff — Limited View' },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#ef4444',
  MANAGER: '#f59e0b',
  STAFF: '#10b981',
};

const PERMISSION_MATRIX = [
  { module: 'Purchases',       staffRead: true,  staffWrite: false, managerRead: true,  managerWrite: true,  adminRead: true,  adminWrite: true  },
  { module: 'Sales',           staffRead: true,  staffWrite: false, managerRead: true,  managerWrite: true,  adminRead: true,  adminWrite: true  },
  { module: 'Suppliers',       staffRead: true,  staffWrite: false, managerRead: true,  managerWrite: true,  adminRead: true,  adminWrite: true  },
  { module: 'Customers',       staffRead: true,  staffWrite: false, managerRead: true,  managerWrite: true,  adminRead: true,  adminWrite: true  },
  { module: 'Transport',       staffRead: true,  staffWrite: false, managerRead: true,  managerWrite: true,  adminRead: true,  adminWrite: true  },
  { module: 'Vehicles',        staffRead: true,  staffWrite: false, managerRead: true,  managerWrite: true,  adminRead: true,  adminWrite: true  },
  { module: 'Attendance',      staffRead: true,  staffWrite: false, managerRead: true,  managerWrite: true,  adminRead: true,  adminWrite: true  },
  { module: 'Employees',       staffRead: false, staffWrite: false, managerRead: true,  managerWrite: true,  adminRead: true,  adminWrite: true  },
  { module: 'Expenses',        staffRead: false, staffWrite: false, managerRead: true,  managerWrite: true,  adminRead: true,  adminWrite: true  },
  { module: 'Salary',          staffRead: false, staffWrite: false, managerRead: true,  managerWrite: true,  adminRead: true,  adminWrite: true  },
  { module: 'Reports',         staffRead: false, staffWrite: false, managerRead: true,  managerWrite: true,  adminRead: true,  adminWrite: true  },
  { module: 'User Management', staffRead: false, staffWrite: false, managerRead: false, managerWrite: false, adminRead: true,  adminWrite: true  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const blank = { username: '', password: '', name: '', role: 'STAFF' };
  const [form, setForm] = useState<any>(blank);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
  };

  const openAdd = () => { setEditing(null); setForm(blank); setShowModal(true); };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ username: u.username, password: '', name: u.name, role: u.role });
    setShowModal(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
      const url = editing ? `/api/users/${editing.id}` : '/api/users';
      const method = editing ? 'PUT' : 'POST';
      const body: any = { name: form.name, role: form.role };
      if (!editing) { body.username = form.username; body.password = form.password; }
      if (editing && form.password) body.password = form.password;

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: editing ? `Updated ${form.name}` : `User ${form.username} created.` });
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/users/${confirmDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      setMessage({ type: 'success', text: `User ${confirmDelete.username} deleted.` });
      setConfirmDelete(null);
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Roles & Permissions</h1>
          <p className="page-title-desc">Manage system accounts, assign roles and control access levels.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add User</button>
      </div>

      {message && (
        <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: message.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', color: message.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}

      {/* Jenkins-style Permission Matrix */}
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <ShieldCheck size={18} style={{ color: '#c9a84c' }} />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Role Permission Matrix</h2>
        </div>
        <div className="table-wrapper">
          <table className="custom-table" style={{ textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: '160px' }}>Module / Permission</th>
                <th colSpan={2} style={{ color: '#10b981' }}>STAFF</th>
                <th colSpan={2} style={{ color: '#f59e0b' }}>MANAGER</th>
                <th colSpan={2} style={{ color: '#ef4444' }}>ADMIN</th>
              </tr>
              <tr>
                <th style={{ textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>— item permissions —</th>
                {['Read','Write','Read','Write','Read','Write'].map((p, i) => (
                  <th key={i} style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map(row => (
                <tr key={row.module}>
                  <td style={{ textAlign: 'left', fontWeight: 600, color: '#cbd5e1' }}>{row.module}</td>
                  {(['staffRead','staffWrite','managerRead','managerWrite','adminRead','adminWrite'] as const).map(key => (
                    <td key={key}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '20px', height: '20px', borderRadius: '4px', fontSize: '13px',
                        background: row[key] ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.08)',
                        border: row[key] ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(239,68,68,0.2)',
                        color: row[key] ? '#10b981' : '#ef4444',
                      }}>
                        {row[key] ? '✓' : '✕'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Role</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: `${ROLE_COLORS[u.role]}18`, color: ROLE_COLORS[u.role], width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCircle size={18} />
                      </div>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{u.name}</span>
                    </div>
                  </td>
                  <td><code style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{u.username}</code></td>
                  <td>
                    <span style={{ color: ROLE_COLORS[u.role], fontWeight: 700, fontSize: '0.85rem', background: `${ROLE_COLORS[u.role]}18`, padding: '4px 10px', borderRadius: '6px' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(u)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirmDelete(u)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="overlay">
          <div className="modal-content">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{editing ? `Edit User — ${editing.username}` : 'Create New User'}</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              {!editing && (
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" className="form-input" placeholder="e.g. admin01" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                </div>
              )}
              <div className="form-group">
                <label>{editing ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                    placeholder={editing ? '••••••••' : 'Set password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required={!editing}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Role</label>
                <CustomSelect value={form.role} onChange={v => setForm({ ...form, role: v })} options={ROLES} required />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> {editing ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <h2 className="modal-title">Confirm Delete</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>
              Are you sure you want to delete user <strong style={{ color: '#fff' }}>{confirmDelete.username}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDelete}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
