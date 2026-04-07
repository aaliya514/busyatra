import React, { useState } from 'react';
import { Bus, MapPin, Clock, Bell, Zap, Shield, User, Truck, Settings } from 'lucide-react';
import './LandingPage.css';

const LandingPage = ({ onPassengerLogin, onDriverLogin, onAdminLogin }) => {
  const [showRoleModal, setShowRoleModal] = useState(false);

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Bus size={32} />
              <span>BusYatra</span>
            </div>
            <nav className="nav-links">
              <button className="btn-secondary" onClick={() => setShowRoleModal(true)}>Sign In</button>
              <button className="btn-primary" onClick={() => onPassengerLogin('register')}>Get Started</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Track Your Bus
                <span className="gradient-text"> in Real-Time</span>
              </h1>
              <p className="hero-subtitle">
                Never wait blindly again. Track buses live on the map, calculate fares instantly,
                and get arrival notifications for all major routes in Kathmandu Valley.
              </p>

              {/* Role Login Cards */}
              <div className="role-cards">
                <div className="role-card passenger" onClick={() => onPassengerLogin('login')}>
                  <div className="role-icon"><User size={32} /></div>
                  <h3>Passenger</h3>
                  <p>Track buses &amp; plan your trip</p>
                  <button className="role-btn">Login as Passenger</button>
                </div>

                <div className="role-card driver" onClick={() => onDriverLogin()}>
                  <div className="role-icon"><Truck size={32} /></div>
                  <h3>Driver</h3>
                  <p>Share your live location</p>
                  <button className="role-btn">Login as Driver</button>
                </div>

                <div className="role-card admin" onClick={() => onAdminLogin()}>
                  <div className="role-icon"><Settings size={32} /></div>
                  <h3>Admin</h3>
                  <p>Manage fleet &amp; routes</p>
                  <button className="role-btn">Login as Admin</button>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="map-preview">
                    <div className="bus-marker-demo"><Bus size={24} /></div>
                    <div className="pulse-ring"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-subtitle">Powerful features to make your daily commute easier</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon blue"><MapPin size={28} /></div>
              <h3>Live Tracking</h3>
              <p>See exactly where your bus is on the map with real-time GPS updates every 3 seconds.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon green"><Clock size={28} /></div>
              <h3>Arrival Times</h3>
              <p>Get accurate estimated arrival times for buses at your stop based on live traffic.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon orange"><Zap size={28} /></div>
              <h3>Fare Calculator</h3>
              <p>Calculate exact fares between any two stops with DoTM regulated pricing.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon purple"><Bell size={28} /></div>
              <h3>Smart Notifications</h3>
              <p>Get alerts when your bus is approaching or if there are delays on your route.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon red"><Bus size={28} /></div>
              <h3>Route Planning</h3>
              <p>Find the best routes between any two points in Kathmandu Valley.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon teal"><Shield size={28} /></div>
              <h3>Reliable Data</h3>
              <p>Accurate, real-time information you can trust for your daily commute.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Tracking?</h2>
            <p>Join thousands of commuters in Kathmandu Valley using BusYatra</p>
            <button className="btn-primary btn-lg" onClick={() => onPassengerLogin('register')}>
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo"><Bus size={28} /><span>BusYatra</span></div>
              <p>Real-time bus tracking for Nepal</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 BusYatra. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sign In modal with role selector */}
      {showRoleModal && (
        <div className="role-modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="role-modal" onClick={e => e.stopPropagation()}>
            <h2>Sign in as...</h2>
            <div className="modal-roles">
              <button className="modal-role-btn passenger" onClick={() => { setShowRoleModal(false); onPassengerLogin('login'); }}>
                <User size={24} /> Passenger
              </button>
              <button className="modal-role-btn driver" onClick={() => { setShowRoleModal(false); onDriverLogin(); }}>
                <Truck size={24} /> Driver
              </button>
              <button className="modal-role-btn admin" onClick={() => { setShowRoleModal(false); onAdminLogin(); }}>
                <Settings size={24} /> Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
