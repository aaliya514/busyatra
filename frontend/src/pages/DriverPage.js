import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Wifi, WifiOff, Bus, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { busAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DriverPage.css';

const DriverPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | tracking | error
  const [currentPos, setCurrentPos] = useState(null);
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [lastSent, setLastSent] = useState(null);
  const [sendCount, setSendCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const watchRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchBuses();
    return () => stopTracking();
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await busAPI.getAllBuses({ status: 'active' });
      setBuses(res.data.data);
      // Pre-select DEMO bus if exists
      const demo = res.data.data.find(b => b.busNumber === 'DEMO-001');
      if (demo) setSelectedBusId(demo._id);
    } catch (e) {
      console.error(e);
    }
  };

  const sendLocation = async (lat, lng, speed, heading) => {
    if (!selectedBusId) return;
    try {
      const token = localStorage.getItem('busyatra_token');
      await fetch(`/api/buses/${selectedBusId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude: lat, longitude: lng, speed, heading })
      });
      setLastSent(new Date());
      setSendCount(c => c + 1);
      setErrorMsg('');
    } catch (e) {
      setErrorMsg('Failed to send location — check connection');
    }
  };

  const startTracking = () => {
    if (!selectedBusId) { setErrorMsg('Please select a bus first'); return; }
    if (!navigator.geolocation) { setErrorMsg('GPS not available on this device'); return; }

    setStatus('tracking');
    setIsTracking(true);
    setErrorMsg('');
    setSendCount(0);

    // Continuous GPS watch
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        setCurrentPos({ lat: latitude, lng: longitude, speed, heading });
        sendLocation(latitude, longitude, speed || 0, heading || 0);
      },
      (err) => { setErrorMsg('GPS error: ' + err.message); setStatus('error'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );
  };

  const stopTracking = () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsTracking(false);
    setStatus('idle');
  };

  const selectedBus = buses.find(b => b._id === selectedBusId);

  return (
    <>
      <Navbar currentPage="driver" onNavigate={onNavigate} />
      <div className="driver-page">
        <div className="driver-container">

          <div className="driver-header">
            <div className="driver-icon"><Bus size={32} /></div>
            <div style={{flex:1}}>
              <h1>Driver Panel</h1>
              <p>Welcome, {user?.name}. Start tracking to go live.</p>
            </div>
            <button
              className="btn-secondary"
              style={{fontSize:'13px',padding:'8px 14px',whiteSpace:'nowrap'}}
              onClick={() => window.open(window.location.origin + '#driver', '_blank')}
            >
              ↗ Open in new tab
            </button>
          </div>

          {/* Bus selector */}
          <div className="driver-card">
            <h2>Select Your Bus</h2>
            <select
              className="driver-select"
              value={selectedBusId}
              onChange={e => setSelectedBusId(e.target.value)}
              disabled={isTracking}
            >
              <option value="">-- Choose bus --</option>
              {buses.map(b => (
                <option key={b._id} value={b._id}>
                  {b.busNumber} — {b.route?.name || 'Unknown route'}
                </option>
              ))}
            </select>

            {selectedBus && (
              <div className="bus-info-strip">
                <span className="bus-route-tag" style={{ background: selectedBus.route?.color || '#3B82F6' }}>
                  {selectedBus.route?.routeNumber}
                </span>
                <span>{selectedBus.route?.startPoint} → {selectedBus.route?.endPoint}</span>
              </div>
            )}
          </div>

          {/* Status + controls */}
          <div className="driver-card">
            <div className="tracking-status">
              {status === 'idle' && <><WifiOff size={20} className="status-icon idle" /><span>Not tracking</span></>}
              {status === 'tracking' && <><Wifi size={20} className="status-icon live" /><span className="live-text">LIVE — sending GPS</span></>}
              {status === 'error' && <><AlertCircle size={20} className="status-icon error" /><span>Error</span></>}
            </div>

            {errorMsg && <div className="driver-error">{errorMsg}</div>}

            {!isTracking ? (
              <button className="btn-start" onClick={startTracking} disabled={!selectedBusId}>
                <Navigation size={20} /> Start Trip
              </button>
            ) : (
              <button className="btn-stop" onClick={stopTracking}>
                Stop Trip
              </button>
            )}
          </div>

          {/* Live position */}
          {isTracking && currentPos && (
            <div className="driver-card live-card">
              <h2><CheckCircle size={16} className="inline-icon" /> Live Position</h2>
              <div className="pos-grid">
                <div className="pos-item">
                  <span className="pos-label">Latitude</span>
                  <span className="pos-value">{currentPos.lat.toFixed(6)}</span>
                </div>
                <div className="pos-item">
                  <span className="pos-label">Longitude</span>
                  <span className="pos-value">{currentPos.lng.toFixed(6)}</span>
                </div>
                <div className="pos-item">
                  <span className="pos-label">Speed</span>
                  <span className="pos-value">{currentPos.speed ? (currentPos.speed * 3.6).toFixed(1) : '0'} km/h</span>
                </div>
                <div className="pos-item">
                  <span className="pos-label">Updates sent</span>
                  <span className="pos-value">{sendCount}</span>
                </div>
              </div>
              {lastSent && (
                <p className="last-sent">Last sent: {lastSent.toLocaleTimeString()}</p>
              )}
            </div>
          )}

          {/* Demo instructions */}
          <div className="driver-card demo-card">
            <h2>📍 Demo Route</h2>
            <div className="demo-stops">
              <div className="demo-stop start">
                <MapPin size={16} /> Krishna Bakery, Kamaldi
              </div>
              <div className="demo-line"></div>
              <div className="demo-stop">Dillibazar Petrol Pump</div>
              <div className="demo-line"></div>
              <div className="demo-stop">Dillibazar Chowk</div>
              <div className="demo-line"></div>
              <div className="demo-stop">Naxal Bhagawati</div>
              <div className="demo-line"></div>
              <div className="demo-stop end">
                <MapPin size={16} /> Islington College, Baagbazar
              </div>
            </div>
            <p className="demo-note">Select DEMO-001, tap Start Trip, then ride your bike. The passenger map updates live!</p>
          </div>

        </div>
      </div>
    </>
  );
};

export default DriverPage;
