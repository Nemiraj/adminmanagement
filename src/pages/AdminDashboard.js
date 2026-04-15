import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import { dashboardAPI } from '../utils/api';
import './AdminDashboard.css';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={{ color }}>{value}</div>
    <div className="stat-sub">{sub}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    'checked-in': { cls: 'badge-success', label: '● Active', dot: 'dot-success' },
    'checked-out': { cls: 'badge-muted', label: '✓ Done', dot: 'dot-muted' },
    'absent': { cls: 'badge-danger', label: '✗ Absent', dot: 'dot-danger' }
  };
  const s = map[status] || map['absent'];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data.data);
      setLastRefresh(new Date());
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds (real-time bonus)
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatTime = (t) => {
    if (!t) return '—';
    return new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="page-header section-gap">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Live · Refreshed {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={fetchStats} className="btn btn-outline">
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid section-gap">
        <StatCard
          label="Total Guards"
          value={stats?.totalGuards ?? '—'}
          sub="Active personnel"
          color="var(--accent)"
          icon="👮"
        />
        <StatCard
          label="On Duty"
          value={stats?.checkedIn ?? 0}
          sub="Currently active"
          color="var(--success)"
        />
        <StatCard
          label="Completed"
          value={stats?.checkedOut ?? 0}
          sub="Checked out today"
          color="var(--warning)"
        />
        <StatCard
          label="Absent"
          value={stats?.absent ?? 0}
          sub={`${stats?.attendanceRate ?? 0}% attendance`}
          color="var(--danger)"
        />
      </div>

      {/* Avg Hours Card */}
      <div className="info-row section-gap">
        <div className="card info-card">
          <div className="info-icon">⏱</div>
          <div>
            <div className="info-value">{stats?.avgHoursThisWeek ?? 0} hrs</div>
            <div className="info-label">Avg hours/shift this week</div>
          </div>
        </div>
        <div className="card info-card">
          <div className="info-icon">📍</div>
          <div>
            <div className="info-value">{stats?.present ?? 0} / {stats?.totalGuards ?? 0}</div>
            <div className="info-label">Guards present today</div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {stats?.trend?.length > 0 && (
        <div className="card section-gap">
          <div className="card-header">
            <h2 className="card-title">7-Day Attendance Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.trend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={formatDate}
              />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b', border: '1px solid #2d3f57',
                  borderRadius: 10, color: '#f1f5f9', fontSize: 12
                }}
                labelFormatter={formatDate}
                formatter={(val) => [val, 'Present']}
              />
              <Area
                type="monotone" dataKey="present"
                stroke="#6366f1" strokeWidth={2}
                fill="url(#areaGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Today's Activity</h2>
          <Link to="/admin/attendance" className="btn btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}>
            View All
          </Link>
        </div>

        {!stats?.recentActivity?.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No activity recorded today</div>
          </div>
        ) : (
          <div className="activity-list">
            {stats.recentActivity.map((rec) => (
              <div key={rec._id} className="activity-item">
                <div className="activity-avatar">
                  {rec.guard?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="activity-info">
                  <div className="activity-name">{rec.guard?.name || 'Unknown'}</div>
                  <div className="activity-site text-muted text-xs">{rec.guard?.assignedSite || '—'}</div>
                </div>
                <div className="activity-right">
                  <StatusBadge status={rec.status} />
                  <div className="activity-time text-xs text-muted">
                    {rec.status === 'checked-in' && rec.checkIn?.time
                      ? `In: ${formatTime(rec.checkIn.time)}`
                      : rec.checkOut?.time
                        ? `Out: ${formatTime(rec.checkOut.time)}`
                        : '—'
                    }
                    {rec.totalHours > 0 && ` · ${rec.totalHours}h`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
