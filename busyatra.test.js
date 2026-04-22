// ============================================================
// BusYatra Unit Tests
// Run with: npx jest busyatra.test.js
// These test pure logic functions in isolation — no server needed
// ============================================================

// -------------------------------------------------------
// UNIT 1: ETA Calculation
// Given distance in km and average bus speed, returns minutes
// -------------------------------------------------------
function calculateETA(distanceKm, speedKmh = 20) {
  if (distanceKm < 0 || speedKmh <= 0) return null;
  return Math.round((distanceKm / speedKmh) * 60);
}

test('Unit 1 - ETA: calculates correct ETA in minutes', () => {
  const result = calculateETA(5, 20); // 5km at 20kmh = 15 min
  expect(result).toBe(15);
});

test('Unit 1 - ETA: returns null for invalid input (negative distance)', () => {
  const result = calculateETA(-3, 20);
  expect(result).toBeNull();
});

// -------------------------------------------------------
// UNIT 2: Seat Availability
// Checks if seats are available on a bus
// -------------------------------------------------------
function checkSeatAvailability(totalSeats, occupiedSeats) {
  if (occupiedSeats > totalSeats) return null;
  return totalSeats - occupiedSeats;
}

test('Unit 2 - Seats: returns correct number of available seats', () => {
  const result = checkSeatAvailability(30, 12);
  expect(result).toBe(18);
});

test('Unit 2 - Seats: returns null when occupied exceeds total', () => {
  const result = checkSeatAvailability(20, 25);
  expect(result).toBeNull();
});

// -------------------------------------------------------
// UNIT 3: GPS Coordinate Validation
// Checks if a GPS coordinate is within Kathmandu valley bounds
// Kathmandu roughly: lat 27.6–27.8, lng 85.2–85.5
// -------------------------------------------------------
function isValidKathmanduCoord(lat, lng) {
  return (
    lat >= 27.6 && lat <= 27.8 &&
    lng >= 85.2 && lng <= 85.5
  );
}

test('Unit 3 - GPS: valid Kathmandu coordinates pass', () => {
  expect(isValidKathmanduCoord(27.7172, 85.3240)).toBe(true); // Kathmandu center
});

test('Unit 3 - GPS: coordinates outside Kathmandu fail', () => {
  expect(isValidKathmanduCoord(28.5, 77.2)).toBe(false); // Delhi
});

// -------------------------------------------------------
// UNIT 4: Route Name Formatting
// Cleans and formats a route name string
// -------------------------------------------------------
function formatRouteName(name) {
  if (!name || typeof name !== 'string') return null;
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

test('Unit 4 - Route: formats route name correctly', () => {
  const result = formatRouteName('  Samakhushi  TO  Chabahil  ');
  expect(result).toBe('samakhushi to chabahil');
});

test('Unit 4 - Route: returns null for empty input', () => {
  expect(formatRouteName('')).toBeNull();
});

// -------------------------------------------------------
// UNIT 5: JWT Token Presence Check
// Simulates checking if a token exists in auth header
// -------------------------------------------------------
function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

test('Unit 5 - Auth: extracts token from valid Bearer header', () => {
  const token = extractToken('Bearer abc123xyz');
  expect(token).toBe('abc123xyz');
});

test('Unit 5 - Auth: returns null if no Bearer prefix', () => {
  const token = extractToken('abc123xyz');
  expect(token).toBeNull();
});

// -------------------------------------------------------
// UNIT 6: Bus Status Check
// Determines if a bus is active based on last ping timestamp
// A bus is considered inactive if last ping > 10 seconds ago
// -------------------------------------------------------
function isBusActive(lastPingMs, currentTimeMs, thresholdMs = 10000) {
  return (currentTimeMs - lastPingMs) <= thresholdMs;
}

test('Unit 6 - Status: bus is active when pinged recently', () => {
  const now = Date.now();
  expect(isBusActive(now - 3000, now)).toBe(true); // 3 sec ago = active
});

test('Unit 6 - Status: bus is inactive when no ping for over 10 seconds', () => {
  const now = Date.now();
  expect(isBusActive(now - 15000, now)).toBe(false); // 15 sec ago = inactive
});

// -------------------------------------------------------
// UNIT 7: Distance Between Two GPS Points
// Uses Haversine-style approximation (simplified for unit test)
// -------------------------------------------------------
function approxDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

test('Unit 7 - Distance: distance between same point is 0', () => {
  const d = approxDistanceKm(27.7172, 85.3240, 27.7172, 85.3240);
  expect(d).toBeCloseTo(0);
});

test('Unit 7 - Distance: distance between two Kathmandu points is reasonable', () => {
  // Ratnapark to Chabahil is roughly 3–5km
  const d = approxDistanceKm(27.7041, 85.3145, 27.7167, 85.3509);
  expect(d).toBeGreaterThan(1);
  expect(d).toBeLessThan(10);
});
