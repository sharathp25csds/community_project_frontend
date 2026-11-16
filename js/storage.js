/**
 * FraudGuard AI - Storage & Session Management
 * 
 * Provides session-based scan history using sessionStorage (privacy-centric).
 * General citizens do not log in; no personal data or credentials stored.
 */

const SessionScanHistory = {
  /**
   * Retrieves all scan records saved during the current browser session.
   * @returns {Array} Array of scan objects, sorted newest first.
   */
  getScans() {
    try {
      const data = sessionStorage.getItem(CONFIG.STORAGE_KEYS.SESSION_SCANS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Unable to access sessionStorage:', e);
      return [];
    }
  },

  /**
   * Saves a new scan result to the current browser session.
   * Keeps up to 20 most recent scans. Never stores raw sensitive credentials.
   * @param {Object} scan
   */
  addScan(scan) {
    if (!scan) return null;

    const record = {
      id: 'scan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      type: scan.type || 'URL',
      // Store sanitized preview (truncate long text to prevent storing unnecessary private body)
      targetPreview: scan.targetPreview || (scan.target ? scan.target.substring(0, 100) : 'Unnamed Scan'),
      riskLevel: scan.riskLevel || 'SUSPICIOUS',
      riskScore: typeof scan.riskScore === 'number' ? scan.riskScore : 50,
      confidence: scan.confidence || 'Medium',
      warningCount: Array.isArray(scan.warnings) ? scan.warnings.length : 0,
      warnings: Array.isArray(scan.warnings) ? scan.warnings.slice(0, 5) : [],
      engineMode: scan.engineMode || 'Client Heuristics'
    };

    const scans = this.getScans();
    scans.unshift(record);

    // Retain maximum 20 scans per session
    const trimmed = scans.slice(0, 20);

    try {
      sessionStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_SCANS, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save scan to sessionStorage:', e);
    }

    return record;
  },

  /**
   * Clears the current session's scan history.
   */
  clearScans() {
    try {
      sessionStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION_SCANS);
      return true;
    } catch (e) {
      console.warn('Failed to clear sessionStorage scans:', e);
      return false;
    }
  },

  /**
   * Returns count of scans in this session.
   */
  getCount() {
    return this.getScans().length;
  }
};

/**
 * Storage helper strictly for isolated Admin portal verification.
 */
const AdminAuth = {
  getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
  },
  setToken(token) {
    if (token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN, token);
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
    }
  },
  isAdmin() {
    return !!this.getToken();
  },
  logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
  }
};
