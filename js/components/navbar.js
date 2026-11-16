/**
 * FraudGuard AI - Shared Navigation Bar Component
 * Public-Access Architecture: Open access for all visitors without accounts or logins.
 */

const Navbar = {
  render(mountId = 'navbar-mount') {
    const container = document.getElementById(mountId);
    if (!container) return;

    // Determine current path depth for relative links
    const currentPath = window.location.pathname.replace(/\\/g, '/');
    let basePath = './';
    if (currentPath.includes('/pages/admin/')) {
      basePath = '../../';
    } else if (currentPath.includes('/pages/')) {
      basePath = '../';
    }

    // Check active links
    const isHome = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('frontend/');
    const isScan = currentPath.includes('scan.html') && !currentPath.includes('screenshot');
    const isScreenshot = currentPath.includes('screenshot.html');
    const isFeed = currentPath.includes('feed.html') || currentPath.includes('scam-details.html');
    const isReport = currentPath.includes('report.html');
    const isDashboard = currentPath.includes('dashboard.html') && !currentPath.includes('/admin/');
    const isHistory = currentPath.includes('scan-history.html');

    // Get count of scans in this session
    const sessionScanCount = SessionScanHistory.getCount();

    container.innerHTML = `
      <header class="site-header">
        <div class="app-container header-inner">
          <!-- Brand Logo -->
          <a href="${basePath}index.html" class="brand-logo" aria-label="FraudGuard AI Home">
            <div class="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <span>FraudGuard<span class="gradient-text-cyan">AI</span></span>
            <span class="brand-badge">Open</span>
          </a>

          <!-- Public Navigation Links -->
          <nav aria-label="Main Navigation">
            <ul class="nav-links">
              <li>
                <a href="${basePath}index.html" class="nav-link ${isHome ? 'active' : ''}">Home</a>
              </li>
              <li>
                <a href="${basePath}pages/scan.html" class="nav-link ${isScan ? 'active' : ''}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  Scan Threat
                </a>
              </li>
              <li>
                <a href="${basePath}pages/screenshot.html" class="nav-link ${isScreenshot ? 'active' : ''}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Screenshot Scanner
                </a>
              </li>
              <li>
                <a href="${basePath}pages/feed.html" class="nav-link ${isFeed ? 'active' : ''}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Community Feed
                </a>
              </li>
              <li>
                <a href="${basePath}pages/report.html" class="nav-link ${isReport ? 'active' : ''}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Report Scam
                </a>
              </li>
              <li>
                <a href="${basePath}pages/dashboard.html" class="nav-link ${isDashboard ? 'active' : ''}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  Public Dashboard
                </a>
              </li>
              <li>
                <a href="${basePath}pages/scan-history.html" class="nav-link ${isHistory ? 'active' : ''}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                  Session History
                  ${sessionScanCount > 0 ? `
                    <span id="nav-session-count" class="badge badge-info" style="font-size:0.65rem; padding:1px 5px; margin-left:4px;">${sessionScanCount}</span>
                  ` : ''}
                </a>
              </li>
            </ul>
          </nav>

          <!-- Action CTA -->
          <div class="nav-actions">
            <a href="${basePath}pages/report.html" class="btn btn-secondary btn-sm" title="Submit a scam you encountered">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Report Scam
            </a>
            <a href="${basePath}pages/scan.html" class="btn btn-primary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              Scan Threat
            </a>
          </div>
        </div>
      </header>
    `;
  }
};
