import React, { useState, useEffect } from 'react';
import { Bus, MapPin, TrendingUp, Clock, ArrowRight, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import { busAPI, routeAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    activeBuses: 0,
    activeRoutes: 0,
    nearbyBuses: 0
  });
  const [nearbyBuses, setNearbyBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch buses and routes
      const [busesRes, routesRes] = await Promise.all([
        busAPI.getAllBuses({ status: 'active' }),
        routeAPI.getAllRoutes({ isActive: true })
      ]);

      const buses = busesRes.data.data;
      const routesData = routesRes.data.data;

      setStats({
        activeBuses: buses.length,
        activeRoutes: routesData.length,
        nearbyBuses: Math.min(buses.length, 5)
      });

      // Get first 5 buses as "nearby"
      setNearbyBuses(buses.slice(0, 5));
      setRoutes(routesData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Track Live',
      description: 'See buses on map',
      icon: MapPin,
      color: 'blue',
      action: () => onNavigate('map')
    },
    {
      title: 'Calculate Fare',
      description: 'Find route costs',
      icon: TrendingUp,
      color: 'green',
      action: () => onNavigate('fare')
    },
    {
      title: 'Notifications',
      description: 'Bus alerts & updates',
      icon: Clock,
      color: 'orange',
      action: () => onNavigate('notifications')
    }
  ];

  if (loading) {
    return (
      <>
        <Navbar currentPage="dashboard" onNavigate={onNavigate} />
        <div className="dashboard-loading">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar currentPage="dashboard" onNavigate={onNavigate} />
      <div className="dashboard">
        <div className="dashboard-container">
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1>Dashboard</h1>
              <p>Welcome back! Here's what's happening today.</p>
            </div>
            <button className="btn-primary" onClick={() => onNavigate('map')}>
              <Zap size={20} />
              Track Now
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">
                <Bus size={28} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Active Buses</p>
                <h2 className="stat-value">{stats.activeBuses}</h2>
                <p className="stat-change">
                  <span className="positive">+3 from yesterday</span>
                </p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">
                <MapPin size={28} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Active Routes</p>
                <h2 className="stat-value">{stats.activeRoutes}</h2>
                <p className="stat-change">
                  <span className="neutral">Serving Kathmandu</span>
                </p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">
                <Clock size={28} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Avg Wait Time</p>
                <h2 className="stat-value">5 min</h2>
                <p className="stat-change">
                  <span className="positive">-2 min faster</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="section">
            <h2 className="section-title">Quick Actions</h2>
            <div className="quick-actions">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className={`action-card ${action.color}`}
                  onClick={action.action}
                >
                  <action.icon size={32} />
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                  <ArrowRight className="action-arrow" size={20} />
                </button>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          <div className="content-grid">
            {/* Nearby Buses */}
            <div className="content-card">
              <div className="card-header">
                <h2>Nearby Buses</h2>
                <button className="btn-secondary" onClick={() => onNavigate('map')}>
                  View All
                </button>
              </div>
              <div className="bus-list">
                {nearbyBuses.length > 0 ? (
                  nearbyBuses.map((bus) => (
                    <div key={bus._id} className="bus-item">
                      <div className="bus-info-primary">
                        <div className="bus-icon">
                          <Bus size={20} />
                        </div>
                        <div>
                          <h4>Bus {bus.busNumber}</h4>
                          <p>{bus.route?.name || 'Loading route...'}</p>
                        </div>
                      </div>
                      <div className="bus-details">
                        <span className={`status-badge ${bus.status}`}>
                          {bus.status}
                        </span>
                        <span className="seats-info">
                          {bus.currentPassengers}/{bus.capacity}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No buses available</p>
                )}
              </div>
            </div>

            {/* Popular Routes */}
            <div className="content-card">
              <div className="card-header">
                <h2>Popular Routes</h2>
                <button className="btn-secondary" onClick={() => onNavigate('fare')}>
                  Calculate
                </button>
              </div>
              <div className="route-list">
                {routes.length > 0 ? (
                  routes.map((route) => (
                    <div key={route._id} className="route-item">
                      <div className="route-number">{route.routeNumber}</div>
                      <div className="route-info">
                        <h4>{route.name}</h4>
                        <p>{route.startPoint} → {route.endPoint}</p>
                        <div className="route-meta">
                          <span>{route.totalDistance} km</span>
                          <span>•</span>
                          <span>NPR {Math.round(route.baseFare + (route.totalDistance * route.farePerKm))}</span>
                          <span>•</span>
                          <span className="fare-tag">Govt. Fare</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No routes available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
