import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './AttendanceLogs.css';

const fmt = (t) => {
  if (!t) return '—';
  return new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const StatusBadge = ({ status }) => {
  const map = {
    'checked-in': { cls: 'badge-success', label: '● Active' },
    'checked-out': { cls: 'badge-muted', label: '✓ Done' },
    'absent': { cls: 'badge-danger', label: '✗ Absent' }
  };
  const s = map[status] || map['absent'];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};

export default function AttendanceLogs({ guardView = false }) {
  const { isAdmin } = useAuth();
  const isGuardView = guardView || !isAdmin;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [stats, setStats] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    startDate: sevenDaysAgo,
    endDate: today,
    status: '',
    page: 1
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (isGuardView) {
        res = await attendanceAPI.getMyAttendance(filters);
        setStats(res.data.stats);
      } else {
        res = await attendanceAPI.getAllAttendance({ ...filters, limit: 30 });
      }
      setRecords(res.data.data);
      setPagination(res.data.pagination || { total: res.data.data.length, page: 1, pages: 1 });
    } catch {
      toast.error('Failed to load attendance logs');
    } finally {
      setLoading(false);
    }
  }, [filters, isGuardView]);

  useEffect(() => { fetch(); }, [fetch]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div className="attendance-page">
      <div className="page-header section-gap">
        <div>
          <h1 className="page-title">Attendance Logs</h1>
          <p className="page-subtitle">
            {isGuardView ? 'Your attendance history' : 'All guards · ' + pagination.total + ' records'}
          </p>
        </div>
      </div>

      {/* Guard Stats */}
      {isGuardView && stats && (
        <div className="att-stats section-gap">
          <div className="card att-stat-card">
            <div className="att-stat-icon">📅</div>
            <div className="att-stat-val">{stats.presentDays}</div>
            <div className="att-stat-label">Days Present</div>
          </div>
          <div className="card att-stat-card">
            <div className="att-stat-icon">⏱</div>
            <div className="att-stat-val">{stats.totalHours}</div>
            <div className="att-stat-label">Total Hours</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card section-gap">
        <div className="filters-row">
          <div className="filter-item">
            <label className="form-label">From</label>
            <input type="date" className="form-input" value={filters.startDate}
              onChange={e => setFilter('startDate', e.target.value)} />
          </div>
          <div className="filter-item">
            <label className="form-label">To</label>
            <input type="date" className="form-input" value={filters.endDate}
              onChange={e => setFilter('endDate', e.target.value)} />
          </div>
          {!isGuardView && (
            <div className="filter-item">
              <label className="form-label">Status</label>
              <select className="form-input" value={filters.status}
                onChange={e => setFilter('status', e.target.value)}>
                <option value="">All Status</option>
                <option value="checked-in">Active</option>
                <option value="checked-out">Completed</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          )}
          <div className="filter-item filter-btn-wrap">
            <label className="form-label">&nbsp;</label>
            <button className="btn btn-outline" onClick={() => setFilters({
              startDate: sevenDaysAgo, endDate: today, status: '', page: 1
            })}>Reset</button>
          </div>
        </div>
      </div>

      {/* Records */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '30vh' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No records found for selected period</div>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="att-cards">
            {records.map(rec => (
              <div key={rec._id} className="card att-card">
                <div className="att-card-top">
                  <div>
                    {!isGuardView && (
                      <div className="att-guard-name">{rec.guard?.name || '—'}</div>
                    )}
                    <div className="att-date">{fmtDate(rec.date)}</div>
                    {!isGuardView && (
                      <div className="text-xs text-muted">{rec.guard?.assignedSite || '—'}</div>
                    )}
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
                <div className="att-card-times">
                  <div className="att-time-item">
                    <span className="text-xs text-muted">Check In</span>
                    <span className="font-medium">{fmt(rec.checkIn?.time)}</span>
                  </div>
                  <div className="att-time-sep">→</div>
                  <div className="att-time-item">
                    <span className="text-xs text-muted">Check Out</span>
                    <span className="font-medium">{fmt(rec.checkOut?.time)}</span>
                  </div>
                  <div className="att-time-item att-hours">
                    <span className="text-xs text-muted">Hours</span>
                    <span className="font-medium text-success">
                      {rec.totalHours > 0 ? `${rec.totalHours}h` : '—'}
                    </span>
                  </div>
                </div>
                {rec.checkIn?.location?.latitude && (
                  <div className="att-location">
                    📍 {rec.checkIn.location.latitude?.toFixed(4)}, {rec.checkIn.location.longitude?.toFixed(4)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="card att-table-wrap">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    {!isGuardView && <th>Guard</th>}
                    {!isGuardView && <th>Site</th>}
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(rec => (
                    <tr key={rec._id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(rec.date)}</td>
                      {!isGuardView && (
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>
                            {rec.guard?.name || '—'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rec.guard?.employeeId}</div>
                        </td>
                      )}
                      {!isGuardView && <td style={{ fontSize: 12 }}>{rec.guard?.assignedSite || '—'}</td>}
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{fmt(rec.checkIn?.time)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{fmt(rec.checkOut?.time)}</td>
                      <td>
                        {rec.totalHours > 0
                          ? <span className="text-success font-medium">{rec.totalHours}h</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {rec.checkIn?.location?.latitude
                          ? `${rec.checkIn.location.latitude.toFixed(3)}, ${rec.checkIn.location.longitude.toFixed(3)}`
                          : '—'}
                      </td>
                      <td><StatusBadge status={rec.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button className="btn btn-outline" disabled={filters.page === 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                ← Prev
              </button>
              <span className="text-muted text-sm">
                Page {filters.page} of {pagination.pages}
              </span>
              <button className="btn btn-outline" disabled={filters.page >= pagination.pages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
