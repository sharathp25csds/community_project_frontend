/**
 * FraudGuard AI - Shared Footer Component
 * Public-Access Architecture: Open access with separate isolated Admin Portal link.
 */

const Footer = {
  render(mountId = 'footer-mount') {
    const container = document.getElementById(mountId);
    if (!container) return;

    const currentPath = window.location.pathname.replace(/\\/g, '/');
    let basePath = './';
    if (currentPath.includes('/pages/admin/')) {
      basePath = '../../';
    } else if (currentPath.includes('/pages/')) {
      basePath = '../';
    }

    container.innerHTML = `
      <footer class="site-footer">
        <div class="app-container">
          <div class="footer-grid">
            <!-- Brand Info -->
            <div class="footer-brand">
              <a href="${basePath}index.html" class="brand-logo">
                <div class="brand-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <span>FraudGuard<span class="gradient-text-cyan">AI</span></span>
              </a>
              <p>
                An open, public-access scam and phishing defense utility combining Google Gemini semantic reasoning, custom ML pattern classification, and verified community intelligence.
              </p>
              <div style="margin-top: 14px;">
                <span class="system-status-pill">
                  <span class="status-dot-pulse"></span>
                  Public Service: Active (No Registration Required)
                </span>
              </div>
            </div>

            <!-- Public Tools -->
            <div>
              <div class="footer-col-title">Public Tools</div>
              <ul class="footer-links">
                <li><a href="${basePath}pages/scan.html">AI Threat Scanner</a></li>
                <li><a href="${basePath}pages/feed.html">Community Scam Feed</a></li>
                <li><a href="${basePath}pages/report.html">Report a Scam</a></li>
                <li><a href="${basePath}pages/scan-history.html">Session Scan History</a></li>
              </ul>
            </div>

            <!-- Community Intelligence -->
            <div>
              <div class="footer-col-title">Intelligence & Data</div>
              <ul class="footer-links">
                <li><a href="${basePath}pages/dashboard.html">Public Threat Dashboard</a></li>
                <li><a href="${basePath}pages/feed.html?filter=PHISHING">Recent Phishing URLs</a></li>
                <li><a href="${basePath}pages/feed.html?filter=SMS">Recent Smishing Alerts</a></li>
                <li><a href="${basePath}pages/feed.html?filter=CRYPTO">Crypto Fraud Trends</a></li>
              </ul>
            </div>

            <!-- Project Specifications -->
            <div>
              <div class="footer-col-title">Architecture</div>
              <ul class="footer-links">
                <li><span style="color:var(--text-muted); font-size:0.85rem;">Frontend: HTML5 / Vanilla CSS / JS</span></li>
                <li><span style="color:var(--text-muted); font-size:0.85rem;">Backend: Node.js / Express REST</span></li>
                <li><span style="color:var(--text-muted); font-size:0.85rem;">Database: PostgreSQL & Prisma</span></li>
                <li><span style="color:var(--text-muted); font-size:0.85rem;">ML: FastAPI Isolated Microservice</span></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom">
            <div>
              &copy; ${new Date().getFullYear()} FraudGuard AI — Academic Scam & Phishing Detection Assistant. Open Public Utility.
            </div>
            <div style="display:flex; align-items:center; gap: 16px;">
              <span style="color: var(--text-dim); font-size:0.775rem;">Privacy-First • No Tracking</span>
              <a href="${basePath}pages/admin/login.html" style="color: var(--text-dim); font-size:0.775rem; text-decoration:underline;">
                Admin Portal
              </a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }
};
