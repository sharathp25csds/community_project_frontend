/**
 * FraudGuard AI - Centralized Application & API Configuration
 * 
 * Public Access Architecture:
 * - Public access for all visitors (no account/login required for general citizens).
 * - Client-side session storage for local scan history during the active browser session.
 * - Centralized Express API endpoints ready for backend connection.
 * - Zero API keys or internal ML endpoints exposed on client.
 */

const CONFIG = {
  // Backend API Base URL (Express server)
  API_BASE_URL: 'http://localhost:5000/api',

  // Application Backend Endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    // Scans & Analysis
    SCAN_ANALYZE: '/scans/analyze',
    // Community Reports
    REPORTS_LIST: '/reports',
    REPORT_CREATE: '/reports',
    REPORT_DETAILS: (id) => `/reports/${id}`,
    REPORT_VOTE: (id) => `/reports/${id}/vote`,
    // Screenshot Scam Detection
    SCREENSHOT_ANALYZE: '/screenshot/analyze',
    // Public Dashboard Stats
    STATS_SUMMARY: '/stats/summary',
    // Isolated Admin Portal
    ADMIN_LOGIN: '/admin/login',
    ADMIN_STATS: '/admin/stats',
    ADMIN_REPORTS: '/admin/reports',
  },

  // Internal Page Navigation Routing
  ROUTES: {
    HOME: '/index.html',
    SCAN: '/pages/scan.html',
    FEED: '/pages/feed.html',
    REPORT: '/pages/report.html',
    SCAM_DETAILS: '/pages/scam-details.html',
    DASHBOARD: '/pages/dashboard.html',
    SCAN_HISTORY: '/pages/scan-history.html',
    SCREENSHOT: '/pages/screenshot.html',
    ADMIN_LOGIN: '/pages/admin/login.html',
    ADMIN_DASHBOARD: '/pages/admin/dashboard.html',
    ADMIN_REPORTS: '/pages/admin/reports.html',
  },

  // Client Storage Keys
  STORAGE_KEYS: {
    SESSION_SCANS: 'fraudguard_session_scans',
    ADMIN_TOKEN: 'fraudguard_admin_token',
  },

  // Supported Scam Categories
  SCAM_TYPES: {
    URL: { id: 'URL', label: 'Phishing URL / Website', icon: 'link', badge: 'badge-primary' },
    SMS: { id: 'SMS', label: 'SMS Smishing', icon: 'message-square', badge: 'badge-warning' },
    EMAIL: { id: 'EMAIL', label: 'Phishing Email', icon: 'mail', badge: 'badge-danger' },
    MESSAGE: { id: 'MESSAGE', label: 'Social & Chat Scam', icon: 'send', badge: 'badge-secondary' },
    CRYPTO: { id: 'CRYPTO', label: 'Crypto & Investment Fraud', icon: 'trending-up', badge: 'badge-danger' },
    JOB: { id: 'JOB', label: 'Fake Job / Recruitment', icon: 'briefcase', badge: 'badge-warning' },
    SCREENSHOT: { id: 'SCREENSHOT', label: 'Screenshot Threat Scan', icon: 'image', badge: 'badge-info' },
  },

  // Threat & Risk Standards
  RISK_LEVELS: {
    SAFE: { label: 'Safe / Low Risk', color: 'success', badgeClass: 'badge-success', maxScore: 30 },
    SUSPICIOUS: { label: 'Suspicious / Caution', color: 'warning', badgeClass: 'badge-warning', maxScore: 69 },
    PHISHING: { label: 'Critical Threat / Phishing', color: 'danger', badgeClass: 'badge-danger', maxScore: 100 },
  },

  // Prototype flags
  BACKEND_INTEGRATED: false // Flips to true when Express API is running
};

Object.freeze(CONFIG);
