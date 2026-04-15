import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { guardsAPI } from '../utils/api';
import './Guards.css';

const StatusDot = ({ status }) => {
  const map = {
    'checked-in': { color: 'var(--success)', label: 'Active', bg: 'var(--success-dim)' },
    'checked-out': { color: 'var(--secondary)', label: 'Done', bg: '#f1f5f9' },
    'absent': { color: 'var(--danger)', label: 'Absent', bg: 'var(--danger-dim)' }
  };
  const s = map[status] || map['absent'];
  return (
    <span className="badge" style={{ backgroundColor: s.bg, color: s.color }}>
      <span style={{ 
        width: 6, height: 6, borderRadius: '50%', 
        backgroundColor: s.color, display: 'inline-block',
        marginRight: 6
      }}></span>
      {s.label}
    </span>
  );
};

const emptyForm = { name: '', email: '', password: '', phone: '', employeeId: '', assignedSite: '' };

export default function Guards() {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGuard, setEditGuard] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchGuards(); }, []);

  const fetchGuards = async () => {
    try {
      const res = await guardsAPI.getAll();
      setGuards(res.data.data);
    } catch {
      toast.error('Failed to load guards');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditGuard(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (guard) => {
    setEditGuard(guard);
    setForm({
      name: guard.name,
      email: guard.email,
      password: '',
      phone: guard.phone || '',
      employeeId: guard.employeeId || '',
      assignedSite: guard.assignedSite || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      if (editGuard) {
        const { password, email, ...updateData } = form;
        await guardsAPI.update(editGuard._id, updateData);
        toast.success('Guard updated!');
      } else {
        await guardsAPI.create(form);
        toast.success('Guard created! Default password: guard123');
      }
      setShowModal(false);
      fetchGuards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save guard');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await guardsAPI.delete(id);
      toast.success('Guard deactivated');
      fetchGuards();
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  const filtered = guards.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    g.assignedSite?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (t) => {
    if (!t) return '—';
    return new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="guards-page">
      <div className="page-header section-gap">
        <div>
          <h1 className="page-title">Guards</h1>
          <p className="page-subtitle">{guards.length} total · {guards.filter(g => g.todayStatus === 'checked-in').length} on duty</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Guard</button>
      </div>

      {/* Search */}
      <div className="section-gap">
        <input
          className="form-input"
          placeholder="🔍 Search by name, ID or site..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👮</div>
          <div className="empty-state-text">{search ? 'No guards match your search' : 'No guards added yet'}</div>
          {!search && <button className="btn btn-primary mt-4" onClick={openAdd}>Add First Guard</button>}
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="guards-cards">
            {filtered.map(guard => (
              <div key={guard._id} className="guard-card card">
                <div className="guard-card-header">
                  <div className="guard-avatar">
                    {guard.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="guard-info">
                    <div className="guard-name">{guard.name}</div>
                    <div className="text-xs text-muted">{guard.employeeId} · {guard.phone || 'No phone'}</div>
                  </div>
                  <StatusDot status={guard.todayStatus} />
                </div>
                <div className="guard-card-body">
                  <div className="guard-meta-item">
                    <span className="text-xs text-muted">Site</span>
                    <span className="text-sm">{guard.assignedSite || '—'}</span>
                  </div>
                  <div className="guard-meta-item">
                    <span className="text-xs text-muted">Check-in</span>
                    <span className="text-sm">{formatTime(guard.lastCheckIn)}</span>
                  </div>
                </div>
                <div className="guard-card-actions">
                  <button className="btn btn-outline" style={{ fontSize: 12, padding: '7px 12px' }}
                    onClick={() => openEdit(guard)}>✏️ Edit</button>
                  <button className="btn btn-danger" style={{ fontSize: 12, padding: '7px 12px' }}
                    onClick={() => handleDeactivate(guard._id, guard.name)}>Deactivate</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="card guards-table-wrap">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Guard</th>
                    <th>Employee ID</th>
                    <th>Site</th>
                    <th>Status</th>
                    <th>Last Check-in</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(guard => (
                    <tr key={guard._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="guard-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                            {guard.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 14 }}>{guard.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{guard.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{guard.employeeId || '—'}</td>
                      <td>{guard.assignedSite || '—'}</td>
                      <td><StatusDot status={guard.todayStatus} /></td>
                      <td>{formatTime(guard.lastCheckIn)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline" style={{ fontSize: 11, padding: '5px 10px' }}
                            onClick={() => openEdit(guard)}>Edit</button>
                          <button className="btn btn-danger" style={{ fontSize: 11, padding: '5px 10px' }}
                            onClick={() => handleDeactivate(guard._id, guard.name)}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editGuard ? 'Edit Guard' : 'Add New Guard'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Rajesh Kumar" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="guard@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  disabled={!!editGuard} required />
              </div>
              {!editGuard && (
                <div className="form-group">
                  <label className="form-label">Password (default: guard123)</label>
                  <input className="form-input" type="password" placeholder="Leave blank for default"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input className="form-input" placeholder="GRD001" value={form.employeeId}
                    onChange={e => setForm({ ...form, employeeId: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="9876543210" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Site</label>
                <input className="form-input" placeholder="Site A - Main Gate" value={form.assignedSite}
                  onChange={e => setForm({ ...form, assignedSite: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                  {saving ? 'Saving...' : editGuard ? 'Update Guard' : 'Create Guard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
