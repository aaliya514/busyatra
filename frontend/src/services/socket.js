import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✓ Connected to BusYatra server');
    });

    this.socket.on('disconnect', () => {
      console.log('✗ Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // Track a specific bus
  trackBus(busId, callback) {
    if (!this.socket) this.connect();
    
    this.socket.emit('track_bus', busId);
    
    const eventName = 'bus_location_update';
    this.socket.on(eventName, callback);
    
    // Store listener for cleanup
    if (!this.listeners.has(busId)) {
      this.listeners.set(busId, []);
    }
    this.listeners.get(busId).push({ event: eventName, callback });
  }

  // Stop tracking a bus
  untrackBus(busId) {
    if (!this.socket) return;
    
    this.socket.emit('untrack_bus', busId);
    
    // Remove listeners
    const busListeners = this.listeners.get(busId);
    if (busListeners) {
      busListeners.forEach(({ event, callback }) => {
        this.socket.off(event, callback);
      });
      this.listeners.delete(busId);
    }
  }

  // Track all buses on a route
  trackRoute(routeId, callback) {
    if (!this.socket) this.connect();
    
    this.socket.emit('track_route', routeId);
    
    const eventName = 'route_bus_update';
    this.socket.on(eventName, callback);
    
    // Store listener for cleanup
    if (!this.listeners.has(`route_${routeId}`)) {
      this.listeners.set(`route_${routeId}`, []);
    }
    this.listeners.get(`route_${routeId}`).push({ event: eventName, callback });
  }

  // Stop tracking a route
  untrackRoute(routeId) {
    if (!this.socket) return;
    
    this.socket.emit('untrack_route', routeId);
    
    // Remove listeners
    const routeListeners = this.listeners.get(`route_${routeId}`);
    if (routeListeners) {
      routeListeners.forEach(({ event, callback }) => {
        this.socket.off(event, callback);
      });
      this.listeners.delete(`route_${routeId}`);
    }
  }

  // Listen to custom events
  on(event, callback) {
    if (!this.socket) this.connect();
    this.socket.on(event, callback);
  }

  // Remove custom event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit custom events
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

const socketService = new SocketService();
export default socketService;
