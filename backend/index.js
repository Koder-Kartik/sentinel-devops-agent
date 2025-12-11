const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios'); // Needed for manual actions

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- IN-MEMORY DATABASE ---
let systemStatus = {
  services: {
    auth: { code: 0 },
    payment: { code: 0 },
    notification: { code: 0 }
  },
  lastUpdated: new Date()
};

let activityLog = []; // Events for the feed
let aiInsights = [];  // Deep dive reasoning for the "Insights" panel

// --- HELPER: Add to Activity Log ---
const addActivity = (message, type = 'info') => {
  const entry = {
    id: Date.now(),
    timestamp: new Date(),
    message,
    type // 'info', 'alert', 'success'
  };
  activityLog.unshift(entry);
  if (activityLog.length > 50) activityLog.pop(); // Keep last 50
  return entry;
};

// --- ENDPOINTS ---

// 1. Get Status
app.get('/api/status', (req, res) => {
  res.json(systemStatus);
});

// 2. Get Activity Feed
app.get('/api/activity', (req, res) => {
  res.json({ activity: activityLog });
});

// 3. Get AI Insights
app.get('/api/insights', (req, res) => {
  res.json({ insights: aiInsights });
});

// 4. Manual Actions (Triggered by Dashboard Buttons)
app.post('/api/action/:service/:type', async (req, res) => {
  const { service, type } = req.params;
  const serviceMap = {
    'auth': '3001',
    'payment': '3002',
    'notification': '3003'
  };

  const port = serviceMap[service];
  if (!port) return res.status(400).json({ error: 'Unknown service' });

  try {
    // Call the service's simulation endpoint
    // If type is 'restart', we simulate making it healthy
    const mode = type === 'restart' || type === 'heal' ? 'healthy' : type;

    await axios.post(`http://${service}-service:${port}/simulate/${mode}`, {}, {
      timeout: 5000
    });

    addActivity(`Manual Action: Triggered ${type} on ${service}`, 'success');
    res.json({ success: true, message: `Executed ${type} on ${service}` });
  } catch (error) {
    addActivity(`Failed to execute ${type} on ${service}`, 'alert');
    res.status(500).json({ error: 'Action failed' });
  }
});

// --- WEBHOOK FOR KESTRA ---
app.post('/api/kestra-webhook', (req, res) => {
  const { aiReport, metrics, raw_ai } = req.body; // raw_ai is the full JSON from AI

  console.log('📦 Received Kestra Update');

  // Update Status
  systemStatus.lastUpdated = new Date();
  if (metrics) systemStatus.services = metrics;

  // Process AI Report
  // If the report contains "CRITICAL" or "DEGRADED", log it as an alert
  if (aiReport && (aiReport.includes("CRITICAL") || aiReport.includes("DEGRADED"))) {
    addActivity(aiReport, 'alert');
  } else if (aiReport && aiReport.includes("HEALTHY")) {
    // Only log healthy if previous state was bad, otherwise it's spammy
    // For now, let's just log it so you see it working
    addActivity("System Health Check: All Systems Normal", 'success');
  }

  // Store detailed insight
  if (raw_ai) {
    aiInsights.unshift({
      id: Date.now(),
      timestamp: new Date(),
      analysis: raw_ai
    });
    if (aiInsights.length > 20) aiInsights.pop();
  }

  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sentinel Backend running on http://0.0.0.0:${PORT}`);
});
