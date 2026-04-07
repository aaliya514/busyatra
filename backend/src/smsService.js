// Sparrow SMS integration for Nepal (supports NTC, Ncell, SmartCell)
// Register free at https://sparrowsms.com → get token from dashboard
// Add to backend/.env:  SPARROW_TOKEN=your_token   SPARROW_FROM=BusYatra

const https = require('https');

const SPARROW_TOKEN = process.env.SPARROW_TOKEN || '';
const SPARROW_FROM  = process.env.SPARROW_FROM  || 'BusYatra';

/**
 * Send an SMS via Sparrow SMS (Nepal)
 * @param {string} to      - Nepali phone number e.g. "9841XXXXXX"
 * @param {string} message - SMS text (max 160 chars)
 * @returns {Promise<boolean>}
 */
async function sendSMS(to, message) {
  if (!SPARROW_TOKEN) {
    console.log('[SMS] SPARROW_TOKEN not set — skipping SMS');
    return false;
  }

  // Normalize number: strip +977 or 977 prefix, keep 10 digits
  const normalized = to.replace(/^(\+977|977)/, '').replace(/\D/g, '');
  if (normalized.length !== 10) {
    console.error('[SMS] Invalid phone number:', to);
    return false;
  }

  const payload = JSON.stringify({
    token:  SPARROW_TOKEN,
    from:   SPARROW_FROM,
    to:     normalized,
    text:   message.substring(0, 160)
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.sparrowsms.com',
      path:     '/v2/sms/',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.response_code === 200) {
            console.log(`[SMS] Sent to ${normalized}: ${message.substring(0, 40)}...`);
            resolve(true);
          } else {
            console.error('[SMS] Sparrow error:', result);
            resolve(false);
          }
        } catch {
          console.error('[SMS] Parse error:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('[SMS] Request error:', err.message);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Send delay alert SMS to a passenger
 * Called when a bus has been stationary (speed=0) for 5+ minutes
 */
async function sendDelayAlert(passengerPhone, busNumber, routeName, minutesDelayed) {
  const message =
    `BusYatra Alert: Bus ${busNumber} (${routeName}) is delayed by ~${minutesDelayed} mins. ` +
    `We apologise for the inconvenience.`;
  return sendSMS(passengerPhone, message);
}

/**
 * Send bus arrival alert SMS
 */
async function sendArrivalAlert(passengerPhone, busNumber, stopName, etaMinutes) {
  const message =
    `BusYatra: Bus ${busNumber} arriving at ${stopName} in ~${etaMinutes} min. Get ready!`;
  return sendSMS(passengerPhone, message);
}

module.exports = { sendSMS, sendDelayAlert, sendArrivalAlert };
