import React, { useState, useEffect, useCallback } from 'react';
import { Bus, MapPin, Users, RefreshCw, Activity } from 'lucide-react';
import Navbar from '../components/Navbar';
import { busAPI, routeAPI } from '../services/api';
import socketService from '../services/socket';
import './AdminPage.css';

const AdminPage = ({ onNavigate }) => {
  const [buses, setBuses]             = useState([]);
  const [routes, setRoutes]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [busRes, routeRes] = await Promise.all([
        busAPI.getAllBuses({}),
        routeAPI.getAllRoutes({})
      ]);
      setBuses(busRes.data.data);
      setRoutes(routeRes.data.data);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  // FIXED: useCallback defined BEFORE useEffect — no hoisting issue
  const handleBusUpdate = useCallback((data) => {
    setBuses(prev => prev.map(b =>
      b._id === data.busId
        ? {
            ...b,
            location:    { ...b.location, coordinates: [data.location.longitude, data.location.latitude] },
            speed:       data.speed,
            currentStop: data.currentStop,
            nextStop:    data.nextStop,
            lastUpdated: data.lastUpdated
          }
        : b
    ));
  }, []);

  useEffect(() => {
    fetchData();
    socketService.on('bus_location_update', handleBusUpdate);
    return () => socketService.off('bus_location_update', handleBusUpdate);
  }, [fetchData, handleBusUpdate]);

  const activeBuses     = buses.filter(b => b.status === 'active');
  const iotBuses        = buses.filter(b => b.iotMode);
  const totalPassengers = buses.reduce((s, b) => s + (b.currentPassengers || 0), 0);

  if (loading) return (
    <>
      <Navbar currentPage="admin" onNavigate={onNavigate} />
      <div className="admin-loading"><div className="spinner"></div></div>
    </>
  );

  return (
    <>
      <Navbar currentPage="admin" onNavigate={onNavigate} />
      <div className="admin-page">
        <div className="admin-container">

          <div className="admin-header">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Last refresh: {lastRefresh.toLocaleTimeString()}</p>
            </div>
            <button className="refresh-btn" onClick={fetchData}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <div className="admin-stats">
            <div className="admin-stat blue">
              <Bus size={24} />
              <div><span className="stat-n">{activeBuses.length}</span><span className="stat-l">Active Buses</span></div>
            </div>
            <div className="admin-stat green">
              <MapPin size={24} />
              <div><span className="stat-n">{routes.length}</span><span className="stat-l">Routes</span></div>
            </div>
            <div className="admin-stat orange">
              <Users size={24} />
              <div><span className="stat-n">{totalPassengers}</span><span className="stat-l">Passengers</span></div>
            </div>
            <div className="admin-stat red">
              <Activity size={24} />
              <div><span className="stat-n">{iotBuses.length}</span><span className="stat-l">IoT/Live GPS</span></div>
            </div>
          </div>

          <div className="admin-card">
            <h2>Bus Fleet</h2>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bus Number</th><th>Route</th><th>Status</th>
                    <th>GPS Mode</th><th>Current Stop</th><th>Next Stop</th>
                    <th>Speed</th><th>Passengers</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map(bus => (
                    <tr key={bus._id} className={bus.iotMode ? 'iot-row' : ''}>
                      <td><strong>{bus.busNumber}</strong></td>
                      <td>{bus.route?.routeNumber || '—'}</td>
                      <td><span className={`status-pill ${bus.status}`}>{bus.status}</span></td>
                      <td>
                        {bus.iotMode
                          ? <span className="iot-pill">🛰️ IoT/Phone</span>
                          : <span className="sim-pill">⚙️ Simulated</span>}
                      </td>
                      <td>{bus.currentStop || '—'}</td>
                      <td>{bus.nextStop || '—'}</td>
                      <td>{bus.speed || 0} km/h</td>
                      <td>{bus.currentPassengers || 0}/{bus.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-card">
            <h2>Routes</h2>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Number</th><th>Name</th><th>From → To</th>
                    <th>Distance</th><th>Stops</th><th>Base Fare</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map(route => (
                    <tr key={route._id}>
                      <td>
                        <span className="route-num" style={{ background: route.color || '#3B82F6' }}>
                          {route.routeNumber}
                        </span>
                      </td>
                      <td>{route.name}</td>
                      <td>{route.startPoint} → {route.endPoint}</td>
                      <td>{route.totalDistance} km</td>
                      <td>{route.stops?.length || 0}</td>
                      <td>NPR {route.baseFare}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdminPage;
