import React, { useState } from 'react';
import { Bus, MapPin, Calculator, Bell, User, LogOut, Menu, X, Settings, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ currentPage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const passengerLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Bus },
    { id: 'map',       label: 'Live Map',  icon: MapPin },
    { id: 'fare',      label: 'Fare',      icon: Calculator },
    { id: 'notifications', label: 'Alerts', icon: Bell },
  ];

  const driverLinks = [
    { id: 'driver', label: 'Driver Panel', icon: Navigation },
    { id: 'map',    label: 'Live Map',     icon: MapPin },
  ];

  const adminLinks = [
    { id: 'admin',  label: 'Admin',    icon: Settings },
    { id: 'map',    label: 'Live Map', icon: MapPin },
    { id: 'driver', label: 'Driver',   icon: Navigation },
  ];

  const links =
    user?.role === 'admin'  ? adminLinks  :
    user?.role === 'driver' ? driverLinks :
    passengerLinks;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => onNavigate(links[0].id)}>
          <Bus size={26} />
          <span>BusYatra</span>
          {user?.role !== 'user' && (
            <span className={`role-badge ${user?.role}`}>{user?.role}</span>
          )}
        </div>

        <div className="navbar-links">
          {links.map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                className={`nav-link ${currentPage === link.id ? 'active' : ''}`}
                onClick={() => onNavigate(link.id)}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>

        <div className="navbar-right">
          <button className="nav-link" onClick={() => onNavigate('profile')}>
            <User size={16} /><span>{user?.name?.split(' ')[0]}</span>
          </button>
          <button className="nav-link logout" onClick={logout}>
            <LogOut size={16} />
          </button>
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {links.map(link => {
            const Icon = link.icon;
            return (
              <button key={link.id} className="mobile-link"
                onClick={() => { onNavigate(link.id); setMenuOpen(false); }}>
                <Icon size={18} />{link.label}
              </button>
            );
          })}
          <button className="mobile-link" onClick={() => { onNavigate('profile'); setMenuOpen(false); }}>
            <User size={18} />Profile
          </button>
          <button className="mobile-link logout" onClick={logout}>
            <LogOut size={18} />Log Out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
