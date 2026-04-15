import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './GuardDashboard.css';

const getLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    resolve({ latitude: null, longitude: null, accuracy: null, address: 'Location not supported' });
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => resolve({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
    }),
    () => resolve({ latitude: null, longitude: null, accuracy: null, address: 'Location unavailable' }),
    { timeout: 8000, enableHighAccuracy: true }
  );
});

const formatTime = (t) => {
  if (!t) return '—';
  return new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatDate = (d) => {
  return new Date(d || Date.now()).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

export default function GuardDashboard() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    fetchToday();
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchToday = async () => {
    try {
      const res = await attendanceAPI.getToday();
      setTodayRecord(res.data.data);
    } catch {
      toast.error('Failed to fetch today status');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      toast.loading('Getting your location...', { id: 'loc' });
      const location = await getLocation();
      toast.dismiss('loc');

      const res = await attendanceAPI.checkIn(location);
      setTodayRecord(res.data.data);
      toast.success('✅ Checked in successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      toast.loading('Getting your location...', { id: 'loc' });
      const location = await getLocation();
      toast.dismiss('loc');

      const res = await attendanceAPI.checkOut(location);
      setTodayRecord(res.data.data);
      toast.success(`✅ Checked out! Total: ${res.data.data.totalHours} hrs`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatus = () => {
    if (!todayRecord?.checkIn?.time) return 'not-started';
    if (todayRecord.status === 'checked-out') return 'done';
    return 'active';
  };

  const status = getStatus();

  const getDuration = () => {
    if (!todayRecord?.checkIn?.time) return null;
    const start = new Date(todayRecord.checkIn.time);
    const end = todayRecord.checkOut?.time ? new Date(todayRecord.checkOut.time) : clock;
    const diff = Math.max(0, end - start);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: '60vh' }}>
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="guard-dashboard">
      {/* Greeting */}
      <div className="guard-greeting section-gap">
        <div className="greeting-text">
          <h1 className="page-title">Guard Dashboard</h1>
          <p className="page-subtitle">Hello, {user?.name?.split(' ')[0]} 👋 · {formatDate(new Date())}</p>
        </div>
        <div className="live-clock">
          {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Status Card */}
      <div className={`status-hero section-gap status-${status}`}>
        <div className="status-indicator">
          <div className={`status-dot-big ${status === 'active' ? 'pulse' : ''}`}></div>
        </div>
        <div className="status-text">
          {status === 'not-started' && <>
            <div className="status-title">Not Checked In</div>
            <div className="status-sub">Tap the button below to start your shift</div>
          </>}
          {status === 'active' && <>
            <div className="status-title">On Duty</div>
            <div className="status-sub">Shift started at {formatTime(todayRecord?.checkIn?.time)}</div>
            {getDuration() && <div className="shift-timer">{getDuration()}</div>}
          </>}
          {status === 'done' && <>
            <div className="status-title">Shift Complete ✓</div>
            <div className="status-sub">
              {formatTime(todayRecord?.checkIn?.time)} → {formatTime(todayRecord?.checkOut?.time)}
            </div>
            <div className="shift-timer">{todayRecord?.totalHours} hours worked</div>
          </>}
        </div>
      </div>

      {/* Action Button */}
      {status !== 'done' && (
        <div className="action-section section-gap">
          {status === 'not-started' ? (
            <button
              className="action-btn action-checkin"
              onClick={handleCheckIn}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <><span className="loading-spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></span> Processing...</>
              ) : (
                <><span className="action-icon">📍</span> Check In</>
              )}
            </button>
          ) : (
            <button
              className="action-btn action-checkout"
              onClick={handleCheckOut}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <><span className="loading-spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></span> Processing...</>
              ) : (
                <><span className="action-icon">🚪</span> Check Out</>
              )}
            </button>
          )}
          <p className="action-note">📡 Your GPS location will be recorded automatically</p>
        </div>
      )}

      {/* Info Cards */}
      <div className="guard-info-grid section-gap">
        <div className="card">
          <div className="info-row-item">
            <span className="info-icon-sm">🏢</span>
            <div>
              <div className="text-xs text-muted">Assigned Site</div>
              <div className="font-medium" style={{ marginTop: 2 }}>{user?.assignedSite || 'Not assigned'}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="info-row-item">
            <span className="info-icon-sm">🪪</span>
            <div>
              <div className="text-xs text-muted">Employee ID</div>
              <div className="font-medium" style={{ marginTop: 2 }}>{user?.employeeId || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Detail */}
      {todayRecord?.checkIn?.time && (
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 16 }}>Today's Details</h2>
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-label">Check In</span>
              <span className="detail-value">{formatTime(todayRecord.checkIn.time)}</span>
            </div>
            {todayRecord.checkIn?.location?.latitude && (
              <div className="detail-row">
                <span className="detail-label">Check-In Location</span>
                <span className="detail-value location-val">
                  {todayRecord.checkIn.location.latitude?.toFixed(4)},
                  {todayRecord.checkIn.location.longitude?.toFixed(4)}
                </span>
              </div>
            )}
            {todayRecord.checkOut?.time && (
              <>
                <div className="detail-row">
                  <span className="detail-label">Check Out</span>
                  <span className="detail-value">{formatTime(todayRecord.checkOut.time)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Hours</span>
                  <span className="detail-value text-success">{todayRecord.totalHours} hrs</span>
                </div>
              </>
            )}
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className={`badge ${todayRecord.status === 'checked-in' ? 'badge-success' : 'badge-muted'}`}>
                {todayRecord.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
