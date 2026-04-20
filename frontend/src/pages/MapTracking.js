import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Bus, MapPin, Navigation, Search, Users, Clock } from 'lucide-react';
import L from 'leaflet';
import Navbar from '../components/Navbar';
import { busAPI, routeAPI } from '../services/api';
import socketService from '../services/socket';
import 'leaflet/dist/leaflet.css';
import './MapTracking.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const createBusIcon = (color = '#3B82F6') => {
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div class="bus-marker-wrapper">
        <div class="bus-marker" style="background: ${color}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
            <circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
          </svg>
        </div>
        <div class="bus-pulse"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

const MapTracking = ({ onNavigate }) => {
  const [buses, setBuses]                 = useState([]);
  const [routes, setRoutes]               = useState([]);
  const [selectedBus, setSelectedBus]     = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [mapCenter, setMapCenter]         = useState([27.7172, 85.3240]);
  const [mapZoom, setMapZoom]             = useState(13);
  const [loading, setLoading]             = useState(true);

  // FIXED: defined with useCallback FIRST before fetchMapData
  // FIXED: reads flat updateData.latitude / updateData.longitude
  const handleBusUpdate = useCallback((updateData) => {
    if (!updateData?.busId) return;
    if (updateData.latitude == null || updateData.longitude == null) return;

    setBuses(prev => prev.map(bus =>
      bus._id === updateData.busId
        ? {
            ...bus,
            location: {
              ...bus.location,
              coordinates: [updateData.longitude, updateData.latitude]
            },
            speed:       updateData.speed       ?? bus.speed,
            heading:     updateData.heading     ?? bus.heading,
            currentStop: updateData.currentStop ?? bus.currentStop,
            nextStop:    updateData.nextStop    ?? bus.nextStop,
            lastUpdated: updateData.lastUpdated || new Date()
          }
        : bus
    ));
  }, []);

  const fetchMapData = useCallback(async () => {
    try {
      const [busesRes, routesRes] = await Promise.all([
        busAPI.getAllBuses({ status: 'active' }),
        routeAPI.getAllRoutes({ isActive: true })
      ]);

      const busesData  = busesRes.data.data;
      const routesData = routesRes.data.data;

      setBuses(busesData);
      setRoutes(routesData);

      // Join every bus room so we receive driver GPS updates
      busesData.forEach(bus => {
        socketService.emit('track_bus', bus._id);
      });

    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
    socketService.on('bus_location_update', handleBusUpdate);
    socketService.on('route_bus_update', handleBusUpdate);
    return () => {
      socketService.off('bus_location_update', handleBusUpdate);
      socketService.off('route_bus_update', handleBusUpdate);
    };
  }, [fetchMapData, handleBusUpdate]);

  const handleBusClick = (bus) => {
    setSelectedBus(bus);
    setMapCenter([bus.location.coordinates[1], bus.location.coordinates[0]]);
    setMapZoom(15);
  };

  const handleRouteClick = async (route) => {
    try {
      const res = await routeAPI.getRouteLive(route._id);
      setSelectedRoute(res.data.data);
      if (route.stops?.length > 0) {
        const firstStop = route.stops[0];
        setMapCenter([firstStop.location.coordinates[1], firstStop.location.coordinates[0]]);
        setMapZoom(12);
      }
    } catch (error) {
      console.error('Error fetching route data:', error);
    }
  };

  const filteredBuses = buses.filter(bus =>
    bus.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.route?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <Navbar currentPage="map" onNavigate={onNavigate} />
        <div className="map-loading"><div className="spinner"></div></div>
      </>
    );
  }

  return (
    <>
      <Navbar currentPage="map" onNavigate={onNavigate} />
      <div className="map-tracking">

        <div className="map-sidebar">
          <div className="map-search">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search buses or routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
            />
          </div>

          <div className="sidebar-stats">
            <div className="sidebar-stat">
              <Bus size={20} />
              <div>
                <span className="stat-number">{buses.length}</span>
                <span className="stat-label">Live Buses</span>
              </div>
            </div>
            <div className="sidebar-stat">
              <MapPin size={20} />
              <div>
                <span className="stat-number">{routes.length}</span>
                <span className="stat-label">Routes</span>
              </div>
            </div>
          </div>

          <div className="sidebar-content">
            <h3 className="sidebar-title">Active Buses</h3>
            <div className="bus-grid">
              {filteredBuses.map((bus) => (
                <div
                  key={bus._id}
                  className={`sidebar-bus-card ${selectedBus?._id === bus._id ? 'selected' : ''}`}
                  onClick={() => handleBusClick(bus)}
                >
                  <div className="bus-card-header">
                    <h4>Bus {bus.busNumber}</h4>
                    <span className={`badge-${bus.status}`}>{bus.status}</span>
                  </div>
                  <p className="bus-route">{bus.route?.name || 'Unknown Route'}</p>
                  <div className="bus-card-footer">
                    <div className="bus-card-info"><Users size={14} /><span>{bus.currentPassengers}/{bus.capacity}</span></div>
                    <div className="bus-card-info"><Clock size={14} /><span>{bus.speed} km/h</span></div>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="sidebar-title">Routes</h3>
            <div className="route-grid">
              {routes.map((route) => (
                <div
                  key={route._id}
                  className={`sidebar-route-card ${selectedRoute?.route?.id === route._id ? 'selected' : ''}`}
                  onClick={() => handleRouteClick(route)}
                >
                  <div className="route-badge" style={{ background: route.color || '#3B82F6' }}>
                    {route.routeNumber}
                  </div>
                  <div>
                    <h4>{route.name}</h4>
                    <p>{route.startPoint} → {route.endPoint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="map-container">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {buses.map((bus) => {
              // Skip buses with missing/invalid coordinates — this was causing the crash
              if (
                !bus.location?.coordinates ||
                bus.location.coordinates.length < 2 ||
                bus.location.coordinates[0] == null ||
                bus.location.coordinates[1] == null
              ) return null;

              return (
                <Marker
                  key={bus._id}
                  position={[bus.location.coordinates[1], bus.location.coordinates[0]]}
                  icon={createBusIcon(bus.route?.color || '#3B82F6')}
                  eventHandlers={{ click: () => handleBusClick(bus) }}
                >
                  <Popup>
                    <div className="map-popup">
                      <h3>Bus {bus.busNumber}</h3>
                      <p className="popup-route">{bus.route?.name}</p>
                      <div className="popup-info">
                        <div className="popup-row"><span>Current Stop:</span><strong>{bus.currentStop || 'Unknown'}</strong></div>
                        <div className="popup-row"><span>Next Stop:</span><strong>{bus.nextStop || 'Unknown'}</strong></div>
                        <div className="popup-row"><span>Passengers:</span><strong>{bus.currentPassengers}/{bus.capacity}</strong></div>
                        <div className="popup-row"><span>Speed:</span><strong>{bus.speed} km/h</strong></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {selectedRoute && selectedRoute.route.stops && (
              <>
                <Polyline
                  positions={selectedRoute.route.stops.map(stop => [
                    stop.location.coordinates[1],
                    stop.location.coordinates[0]
                  ])}
                  color={selectedRoute.route.color || '#3B82F6'}
                  weight={4}
                  opacity={0.7}
                />
                {selectedRoute.route.stops.map((stop, index) => (
                  <Marker
                    key={index}
                    position={[stop.location.coordinates[1], stop.location.coordinates[0]]}
                  >
                    <Popup>
                      <div className="map-popup">
                        <h4>{stop.name}</h4>
                        <p>Stop {stop.order}</p>
                        <p>{stop.distanceFromStart} km from start</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            )}
          </MapContainer>

          <div className="map-controls">
            <button
              className="map-control-btn"
              onClick={() => { setMapCenter([27.7172, 85.3240]); setMapZoom(13); }}
              title="Reset View"
            >
              <Navigation size={20} />
            </button>
          </div>

          <div className="map-legend">
            <h4>Legend</h4>
            <div className="legend-item"><div className="legend-icon bus"></div><span>Active Bus</span></div>
            <div className="legend-item"><div className="legend-icon stop"></div><span>Bus Stop</span></div>
            <div className="legend-item"><div className="legend-line"></div><span>Route Path</span></div>
          </div>
        </div>

      </div>
    </>
  );
};

export default MapTracking;
