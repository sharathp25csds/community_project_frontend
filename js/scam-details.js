/**
 * FraudGuard AI - Scam Details View Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  Navbar.render('navbar-mount');
  Footer.render('footer-mount');

  ScamDetailsController.init();
});

const ScamDetailsController = {
  reportId: null,
  currentReport: null,

  // Fallback seed catalog matching feed.js
  SEED_REPORTS: [
    {
      id: 'rep-seed-1',
      title: 'USPS Unpaid Customs Delivery Fee Smishing SMS',
      category: 'PHISHING',
      status: 'VERIFIED',
      sourceUrl: 'http://usps-parcel-fees-tracking.top/pay',
      sourceContact: '+1 (833) 492-0199',
      description: 'Received an SMS claiming parcel #US-9821 was on hold due to an unpaid $1.85 customs fee. The link leads to a forged USPS gateway demanding full credit card number, billing address, and Social Security Number for "identity verification". The domain was registered less than 48 hours ago in a foreign jurisdiction.',
      upvotes: 42,
      downvotes: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 'rep-seed-2',
      title: 'Fake Remote Job Video Rating Scam on WhatsApp',
      category: 'JOB_FRAUD',
      status: 'VERIFIED',
      sourceUrl: 'https://work-globalmedia-task.xyz',
      sourceContact: '+44 7911 123456',
      description: 'Recruiter named "Elena" contacted me on WhatsApp offering $300/day to rate YouTube videos. After 3 tasks, they insisted I deposit $150 crypto into a "workbench balance" to unlock higher pay. Once funds were sent, they deleted the chat and blocked my number.',
      upvotes: 29,
      downvotes: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
    },
    {
      id: 'rep-seed-3',
      title: 'Wells Fargo Account Lock Alert Phishing Page',
      category: 'PHISHING',
      status: 'VERIFIED',
      sourceUrl: 'http://wellsfargo-verify-security-login.top',
      sourceContact: 'security-alerts@domain-spoof.ru',
      description: 'Urgent email stating checking account was suspended due to abnormal wire transfer. Destination site clones the genuine Wells Fargo login layout to steal credentials and 2FA authentication codes.',
      upvotes: 38,
      downvotes: 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
    },
    {
      id: 'rep-seed-4',
      title: 'Guaranteed 400% ROI Telegram Crypto Trading Bot',
      category: 'INVESTMENT',
      status: 'PENDING',
      sourceUrl: 'https://t.me/BinanceSignalsVIP_OfficialBot',
      sourceContact: '@CryptoAdmin_VIP',
      description: 'Promoted on Reddit as an automated arbitrage bot. Promises 400% profit within 48h. Requires minimum 0.05 BTC transfer to unverified wallet address. Classic Ponzi / wallet drainer setup.',
      upvotes: 17,
      downvotes: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    },
    {
      id: 'rep-seed-5',
      title: 'Fake Publisher Clearing House Winner Phone Call',
      category: 'LOTTERY',
      status: 'PENDING',
      sourceUrl: null,
      sourceContact: '+1 (876) 555-8931',
      description: 'Caller with Jamaican country code claimed I won $2.5 Million in the Mega Millions sweepstakes but must send $450 in Vanilla Visa gift cards to cover state tax paperwork. Threatened that prize would be forfeited if not paid within 2 hours.',
      upvotes: 14,
      downvotes: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
    },
    {
      id: 'rep-seed-6',
      title: 'CEO Impersonation Gift Card Request Email',
      category: 'IMPERSONATION',
      status: 'VERIFIED',
      sourceUrl: null,
      sourceContact: 'ceo.corporate.meeting@gmail-fake.com',
      description: 'Email sent to company finance team claiming CEO is in an emergency board conference and needs five $100 Apple gift cards for a vendor immediately. Instructed employee not to call and to reply with scratched card codes.',
      upvotes: 23,
      downvotes: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString()
    }
  ],

  init() {
    const params = new URLSearchParams(window.location.search);
    this.reportId = params.get('id');

    if (!this.reportId) {
      this.renderNotFound('No Scam Report ID specified in URL.');
      return;
    }

    this.cacheElements();
    this.loadReportDetails();
  },

  cacheElements() {
    this.container = document.getElementById('details-content');
    this.loading = document.getElementById('details-loading');
    this.notFound = document.getElementById('details-not-found');
  },

  async loadReportDetails() {
    this.showLoading(true);

    let report = null;

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REPORT_DETAILS(this.reportId)}`);
      if (response.ok) {
        const json = await response.json();
        report = json.data;
      }
    } catch {
      // Backend offline — look up in local session or seed catalog
    }

    if (!report) {
      const userReports = JSON.parse(sessionStorage.getItem('local_demo_reports') || '[]');
      report = userReports.find(r => r.id === this.reportId);
    }

    if (!report) {
      report = this.SEED_REPORTS.find(r => r.id === this.reportId);
    }

    this.showLoading(false);

    if (!report) {
      this.renderNotFound(`Scam report with ID "${this.reportId}" could not be found.`);
      return;
    }

    this.currentReport = report;
    this.renderReport(report);
  },

  showLoading(isLoading) {
    if (this.loading) this.loading.style.display = isLoading ? 'flex' : 'none';
  },

  renderNotFound(msg) {
    if (this.container) this.container.style.display = 'none';
    if (this.loading) this.loading.style.display = 'none';
    if (this.notFound) {
      this.notFound.style.display = 'flex';
      const p = this.notFound.querySelector('p');
      if (p) p.textContent = msg;
    }
  },

  renderReport(report) {
    this.container.style.display = 'block';

    const catConfig = CONFIG.SCAM_TYPES[report.category] || { label: report.category, badge: 'badge-primary' };
    const isVerified = report.status === 'VERIFIED';
    const dateFormatted = new Date(report.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    this.container.innerHTML = `
      <div class="details-card">
        
        <!-- Header -->
        <div class="details-header">
          <div class="details-badges-row">
            <span class="badge ${catConfig.badge}" style="font-size:0.8rem; padding:6px 12px;">${catConfig.label}</span>
            <span class="badge ${isVerified ? 'badge-success' : 'badge-warning'}" style="font-size:0.8rem; padding:6px 12px;">
              <span class="badge-dot"></span>
              ${isVerified ? 'Confirmed Scam Threat' : 'Pending Community Review'}
            </span>
          </div>

          <h1 class="details-title">${report.title}</h1>

          <div class="details-meta-row">
            <span>📅 Submitted on ${dateFormatted}</span>
            <span>•</span>
            <span>👤 Author: ${report.isAnonymous ? 'Community Guardian (Anonymous)' : 'Verified Citizen'}</span>
            <span>•</span>
            <span>🛡️ Report ID: <code style="font-size:0.8rem;">${report.id}</code></span>
          </div>
        </div>

        <!-- Evidence Box -->
        ${(report.sourceUrl || report.sourceContact) ? `
          <div class="evidence-section">
            <div class="evidence-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Reported Target Evidence</span>
            </div>

            <div class="evidence-grid">
              ${report.sourceUrl ? `
                <div class="evidence-item">
                  <span class="evidence-label">Suspicious Website / URL</span>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="evidence-val">${report.sourceUrl}</span>
                    <button class="btn btn-outline btn-sm copy-btn" data-copy="${report.sourceUrl}" style="font-size:0.7rem; padding:2px 8px;">Copy</button>
                  </div>
                </div>
              ` : ''}

              ${report.sourceContact ? `
                <div class="evidence-item">
                  <span class="evidence-label">Fraudulent Phone / Contact / Email</span>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="evidence-val">${report.sourceContact}</span>
                    <button class="btn btn-outline btn-sm copy-btn" data-copy="${report.sourceContact}" style="font-size:0.7rem; padding:2px 8px;">Copy</button>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Narrative Description -->
        <div class="narrative-section">
          <div class="narrative-title">Incident Details & Observations</div>
          <p style="white-space:pre-line; margin-top:8px;">${report.description}</p>
        </div>

        <!-- Community Consensus Voting Bar -->
        <div class="consensus-box">
          <div class="consensus-left">
            <div style="width:36px; height:36px; border-radius:var(--radius-sm); background:rgba(16, 185, 129, 0.1); color:var(--success); display:flex; align-items:center; justify-content:center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            </div>
            <div>
              <div style="font-size:0.9rem; font-weight:700; color:var(--text-main);">
                Community Consensus: <span id="details-upvotes-count" style="color:var(--success);">${report.upvotes}</span> Verifications
              </div>
              <div style="font-size:0.75rem; color:var(--text-dim);">
                Upvoting confirms this threat pattern to protect others.
              </div>
            </div>
          </div>

          <div class="vote-actions-group">
            <button id="details-upvote-btn" class="vote-action-btn">
              <span>▲</span>
              <span>Confirm Scam (+1)</span>
            </button>
            <button id="details-downvote-btn" class="vote-action-btn">
              <span>▼</span>
              <span>Dispute (-1)</span>
            </button>
          </div>
        </div>

        <!-- Remediation Guidance Box -->
        <div class="remediation-box">
          <div class="remediation-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            <span>Safety Guidance for this Scam Type</span>
          </div>
          <ul style="list-style:none; padding-left:0; margin-top:8px; display:flex; flex-direction:column; gap:6px; font-size:0.85rem; color:var(--text-muted);">
            <li style="display:flex; gap:6px;"><span>•</span> <span>Never click links sent via unsolicited SMS or messaging apps claiming parcel holds or locked accounts.</span></li>
            <li style="display:flex; gap:6px;"><span>•</span> <span>If you entered credentials on this target, immediately change passwords on the official service and enable 2FA.</span></li>
            <li style="display:flex; gap:6px;"><span>•</span> <span>Block the sender contact on your device and file a fraud report with your local cybercrime authority.</span></li>
          </ul>
        </div>

        <!-- Actions Footer -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:var(--space-md); border-top:1px solid var(--border-subtle); flex-wrap:wrap; gap:var(--space-md);">
          <a href="feed.html" class="btn btn-secondary">
            &larr; Return to Community Feed
          </a>

          ${report.sourceUrl ? `
            <button id="inspect-in-scanner-btn" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              Run Diagnostic in Threat Scanner &rarr;
            </button>
          ` : ''}
        </div>

      </div>
    `;

    this.bindActionEvents(report);
  },

  bindActionEvents(report) {
    // Copy buttons
    this.container.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(text).then(() => {
          Toast.success('Copied', 'Target text copied to clipboard.');
        }).catch(() => {
          Toast.info('Copied', text);
        });
      });
    });

    // Scanner Bridge button
    const inspectBtn = document.getElementById('inspect-in-scanner-btn');
    if (inspectBtn && report.sourceUrl) {
      inspectBtn.addEventListener('click', () => {
        sessionStorage.setItem('prefill_scan', JSON.stringify({
          type: 'URL',
          target: report.sourceUrl
        }));
        window.location.href = 'scan.html';
      });
    }

    // Upvote / Downvote buttons
    const upBtn = document.getElementById('details-upvote-btn');
    const downBtn = document.getElementById('details-downvote-btn');
    const countDisplay = document.getElementById('details-upvotes-count');

    let hasVoted = false;

    if (upBtn) {
      upBtn.addEventListener('click', async () => {
        if (hasVoted) {
          Toast.info('Vote Recorded', 'You have already voted on this report.');
          return;
        }
        hasVoted = true;
        upBtn.classList.add('active-up');
        report.upvotes += 1;
        countDisplay.textContent = report.upvotes;
        Toast.success('Verification Added', 'You verified this threat report!');

        try {
          await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REPORT_VOTE(report.id)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: 1 })
          });
        } catch {
          // Local fallback handled in memory
        }
      });
    }

    if (downBtn) {
      downBtn.addEventListener('click', async () => {
        if (hasVoted) {
          Toast.info('Vote Recorded', 'You have already voted on this report.');
          return;
        }
        hasVoted = true;
        downBtn.classList.add('active-down');
        report.downvotes = (report.downvotes || 0) + 1;
        Toast.warning('Dispute Logged', 'You disputed this report.');

        try {
          await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REPORT_VOTE(report.id)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: -1 })
          });
        } catch {
          // Local fallback handled in memory
        }
      });
    }
  }
};
