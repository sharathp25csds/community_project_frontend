/**
 * FraudGuard AI - Session Scan History Page Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  Navbar.render('navbar-mount');
  Footer.render('footer-mount');

  ScanHistoryController.init();
});

const ScanHistoryController = {
  activeCategory: 'ALL',
  searchQuery: '',

  init() {
    this.cacheElements();
    this.bindEvents();
    this.render();
  },

  cacheElements() {
    this.searchInput = document.getElementById('history-search-input');
    this.categorySelect = document.getElementById('history-category-select');
    this.clearBtn = document.getElementById('history-clear-btn');
    this.exportBtn = document.getElementById('history-export-btn');

    this.tableBody = document.getElementById('history-tbody');
    this.emptyState = document.getElementById('history-empty-state');
    this.contentSection = document.getElementById('history-content-section');

    // KPI elements
    this.kpiTotal = document.getElementById('history-kpi-total');
    this.kpiPhish = document.getElementById('history-kpi-phish');
    this.kpiSuspicious = document.getElementById('history-kpi-suspicious');
    this.kpiSafe = document.getElementById('history-kpi-safe');
  },

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.searchQuery = this.searchInput.value.trim().toLowerCase();
        this.render();
      });
    }

    if (this.categorySelect) {
      this.categorySelect.addEventListener('change', () => {
        this.activeCategory = this.categorySelect.value;
        this.render();
      });
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all scan records from this browser session?')) {
          SessionScanHistory.clearScans();
          Toast.info('Session Scans Cleared', 'All temporary scan logs have been removed.');
          this.render();
          Navbar.render('navbar-mount');
        }
      });
    }

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => {
        this.exportLog();
      });
    }
  },

  render() {
    const allScans = SessionScanHistory.getScans();

    // 1. Calculate Session KPIs
    const total = allScans.length;
    let phishCount = 0;
    let suspCount = 0;
    let safeCount = 0;

    allScans.forEach(s => {
      if (s.riskLevel === 'PHISHING') phishCount++;
      else if (s.riskLevel === 'SUSPICIOUS') suspCount++;
      else safeCount++;
    });

    if (this.kpiTotal) this.kpiTotal.textContent = total;
    if (this.kpiPhish) this.kpiPhish.textContent = phishCount;
    if (this.kpiSuspicious) this.kpiSuspicious.textContent = suspCount;
    if (this.kpiSafe) this.kpiSafe.textContent = safeCount;

    // 2. Check Empty State
    if (total === 0) {
      this.contentSection.style.display = 'none';
      this.emptyState.style.display = 'flex';
      return;
    }

    this.emptyState.style.display = 'none';
    this.contentSection.style.display = 'block';

    // 3. Filter
    let filtered = allScans;
    if (this.activeCategory !== 'ALL') {
      filtered = filtered.filter(s => s.type === this.activeCategory);
    }
    if (this.searchQuery) {
      filtered = filtered.filter(s => 
        (s.targetPreview && s.targetPreview.toLowerCase().includes(this.searchQuery)) ||
        (s.riskLevel && s.riskLevel.toLowerCase().includes(this.searchQuery))
      );
    }

    // 4. Render Table Rows
    if (filtered.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:24px; color:var(--text-dim);">
            No session scans matched your search or category filter.
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = filtered.map(scan => {
      const level = CONFIG.RISK_LEVELS[scan.riskLevel] || CONFIG.RISK_LEVELS.SUSPICIOUS;
      const catConfig = CONFIG.SCAM_TYPES[scan.type] || { badge: 'badge-primary' };
      const date = new Date(scan.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return `
        <tr>
          <td style="font-size:0.775rem; color:var(--text-dim);">${timeStr}</td>
          <td><span class="badge ${catConfig.badge}">${scan.type}</span></td>
          <td style="font-family:var(--font-mono); font-size:0.8rem; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${scan.targetPreview}">
            ${scan.targetPreview}
          </td>
          <td>
            <span class="badge ${level.badgeClass}">
              ${scan.riskScore}/100 • ${level.label.split('/')[0]}
            </span>
          </td>
          <td style="font-size:0.8rem; color:var(--text-dim);">
            ${scan.warningCount || 0} flags
          </td>
          <td style="text-align:right;">
            <div style="display:flex; justify-content:flex-end; gap:6px;">
              <button class="btn btn-outline btn-sm rescan-btn" data-type="${scan.type}" data-target="${scan.targetPreview.replace(/"/g, '&quot;')}" style="font-size:0.72rem; padding:3px 8px;" title="Reload in scanner">
                Re-Scan
              </button>
              <button class="btn btn-secondary btn-sm report-bridge-btn" data-type="${scan.type}" data-target="${scan.targetPreview.replace(/"/g, '&quot;')}" data-score="${scan.riskScore}" style="font-size:0.72rem; padding:3px 8px;" title="File community report">
                Report
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.attachTableActions();
  },

  attachTableActions() {
    // Re-scan button
    this.tableBody.querySelectorAll('.rescan-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        const target = btn.getAttribute('data-target');
        if (type === 'SCREENSHOT') {
          window.location.href = 'screenshot.html';
          return;
        }
        sessionStorage.setItem('prefill_scan', JSON.stringify({ type, target }));
        window.location.href = 'scan.html';
      });
    });

    // Report bridge button
    this.tableBody.querySelectorAll('.report-bridge-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        const target = btn.getAttribute('data-target');
        const score = btn.getAttribute('data-score');
        sessionStorage.setItem('prefill_report', JSON.stringify({ type, target, riskScore: score }));
        window.location.href = 'report.html';
      });
    });
  },

  exportLog() {
    const scans = SessionScanHistory.getScans();
    if (scans.length === 0) {
      Toast.warning('Empty Log', 'No scans in current session to export.');
      return;
    }

    const exportData = {
      platform: 'FraudGuard AI',
      exportDate: new Date().toISOString(),
      sessionScansCount: scans.length,
      scans: scans
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraudguard-session-audit-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Toast.success('Export Complete', 'Downloaded session audit log.');
  }
};
