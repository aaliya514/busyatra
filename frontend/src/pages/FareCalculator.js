import React, { useState, useEffect } from 'react';
import { Calculator, MapPin, ArrowRight, DollarSign, Route as RouteIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import { routeAPI } from '../services/api';
import './FareCalculator.css';

const FareCalculator = ({ onNavigate }) => {
  const [routes, setRoutes]           = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [fromStop, setFromStop]       = useState('');
  const [toStop, setToStop]           = useState('');
  const [fareResult, setFareResult]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => { fetchRoutes(); }, []);

  const fetchRoutes = async () => {
    try {
      const res = await routeAPI.getAllRoutes({ isActive: true });
      setRoutes(res.data.data);
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    setFromStop('');
    setToStop('');
    setFareResult(null);
    setError('');
  };

  const calculateFare = async () => {
    if (!selectedRoute || !fromStop || !toStop) return;
    if (fromStop === toStop) { setError('From and To stops cannot be the same.'); return; }

    setCalculating(true);
    setError('');
    try {
      const res = await routeAPI.calculateFare(selectedRoute._id, { fromStop, toStop });
      setFareResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error calculating fare. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const resetCalculator = () => {
    setFromStop('');
    setToStop('');
    setFareResult(null);
    setError('');
  };

  // Sort stops by order for the dropdowns
  const sortedStops = selectedRoute
    ? [...selectedRoute.stops].sort((a, b) => a.order - b.order)
    : [];

  if (loading) return (
    <>
      <Navbar currentPage="fare" onNavigate={onNavigate} />
      <div className="fare-loading"><div className="spinner"></div></div>
    </>
  );

  return (
    <>
      <Navbar currentPage="fare" onNavigate={onNavigate} />
      <div className="fare-calculator">
        <div className="fare-container">

          {/* Header */}
          <div className="fare-header">
            <div className="header-icon"><Calculator size={40} /></div>
            <h1>Fare Calculator</h1>
            <p>Calculate bus fares between any two stops based on distance</p>
          </div>

          <div className="calculator-card">

            {/* Route Selection */}
            <div className="calculator-section">
              <h2>Select Route</h2>
              <div className="route-selector">
                {routes.map(route => (
                  <button
                    key={route._id}
                    className={`route-option ${selectedRoute?._id === route._id ? 'selected' : ''}`}
                    onClick={() => handleRouteSelect(route)}
                  >
                    <div className="route-badge" style={{ background: route.color || '#3B82F6' }}>
                      {route.routeNumber}
                    </div>
                    <div className="route-option-info">
                      <h4>{route.name}</h4>
                      <p>{route.startPoint} → {route.endPoint}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedRoute && (
              <>
                {/* Stop Selection */}
                <div className="calculator-section">
                  <h2>Select Stops</h2>
                  <div className="stop-inputs">

                    <div className="input-group">
                      <label>From Stop</label>
                      <div className="select-wrapper">
                        <MapPin size={18} className="select-icon" />
                        <select
                          value={fromStop}
                          onChange={e => { setFromStop(e.target.value); setFareResult(null); setError(''); }}
                          className="input select"
                        >
                          <option value="">Choose starting stop</option>
                          {sortedStops.map(stop => (
                            <option key={stop._id || stop.name} value={stop.name}>
                              {stop.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="arrow-icon"><ArrowRight size={24} /></div>

                    <div className="input-group">
                      <label>To Stop</label>
                      <div className="select-wrapper">
                        <MapPin size={18} className="select-icon destination" />
                        <select
                          value={toStop}
                          onChange={e => { setToStop(e.target.value); setFareResult(null); setError(''); }}
                          className="input select"
                        >
                          <option value="">Choose destination</option>
                          {sortedStops.map(stop => (
                            <option key={stop._id || stop.name} value={stop.name}>
                              {stop.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && <p style={{ color: '#E24B4A', marginTop: '8px', fontSize: '14px' }}>{error}</p>}

                  <button
                    className="btn-primary btn-full"
                    onClick={calculateFare}
                    disabled={!fromStop || !toStop || calculating}
                    style={{ marginTop: '16px' }}
                  >
                    {calculating ? 'Calculating...' : 'Calculate Fare'}
                  </button>
                </div>

                {/* Result */}
                {fareResult && (
                  <div className="fare-result">
                    <div className="result-header">
                      <h2>Fare Details</h2>
                      <button className="btn-secondary" onClick={resetCalculator}>Reset</button>
                    </div>

                    <div className="result-journey">
                      <div className="journey-point">
                        <div className="journey-dot start"></div>
                        <span>{fareResult.from}</span>
                      </div>
                      <div className="journey-line"></div>
                      <div className="journey-point">
                        <div className="journey-dot end"></div>
                        <span>{fareResult.to}</span>
                      </div>
                    </div>

                    <div className="result-breakdown">
                      <div className="breakdown-row">
                        <span>Estimated Distance</span>
                        <strong>{fareResult.distance} km</strong>
                      </div>
                      <div className="breakdown-row">
                        <span>Base Fare</span>
                        <strong>NPR {fareResult.baseFare}</strong>
                      </div>
                      <div className="breakdown-row">
                        <span>Distance Charge ({fareResult.farePerKm} NPR/km)</span>
                        <strong>NPR {Math.round(fareResult.distance * fareResult.farePerKm)}</strong>
                      </div>
                      <div className="breakdown-divider"></div>
                      <div className="breakdown-row total">
                        <span>Total Fare</span>
                        <strong>NPR {fareResult.totalFare}</strong>
                      </div>
                    </div>

                    <div className="result-info">
                      <DollarSign size={18} />
                      <p>DoTM regulated fare: NPR {fareResult.farePerKm}/km — affordable for everyone! 🚌</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {!selectedRoute && (
              <div className="empty-state">
                <RouteIcon size={48} />
                <p>Select a route to get started</p>
              </div>
            )}
          </div>

          {/* Pricing Info */}
          <div className="pricing-info">
            <h3>Nepal Government Regulated Bus Fares</h3>
            <div className="info-grid">
              <div className="info-card">
                <h4>Minimum Fare</h4>
                <p>Minimum fare for any trip: <strong>NPR 15</strong> (DoTM regulated)</p>
              </div>
              <div className="info-card">
                <h4>Distance Charge</h4>
                <p>Only <strong>NPR 2.2 per kilometer</strong> — affordable for all passengers</p>
              </div>
              <div className="info-card">
                <h4>Example</h4>
                <p>Ratnapark to Koteshwor (~8.5 km) = NPR 20 + (8.5 × 2.2) ≈ <strong>NPR 39</strong></p>
              </div>
            </div>
            <p className="fare-note">💡 Fares follow Nepal Department of Transport Management (DoTM) guidelines. Much cheaper than ride-hailing apps!</p>
          </div>

        </div>
      </div>
    </>
  );
};

export default FareCalculator;
