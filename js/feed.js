/**
 * FraudGuard AI - Community Scam Feed Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  Navbar.render('navbar-mount');
  Footer.render('footer-mount');

  FeedController.init();
});

const FeedController = {
  activeCategory: 'ALL',
  activeSort: 'newest',
  searchQuery: '',
  currentPage: 1,
  limit: 12,

  // Fallback realistic community seed dataset when backend is not actively running
  FALLBACK_REPORTS: [
    {
      id: 'rep-seed-1',
      title: 'USPS Unpaid Customs Delivery Fee Smishing SMS',
      category: 'PHISHING',
      status: 'VERIFIED',
      sourceUrl: 'http://usps-parcel-fees-tracking.top/pay',
      sourceContact: '+1 (833) 492-0199',
      description: 'Received an SMS claiming parcel #US-9821 was on hold due to an unpaid $1.85 customs fee. The link leads to a forged USPS gateway demanding full credit card number and billing address.',
      upvotes: 42,
      downvotes: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45m ago
    },
    {
      id: 'rep-seed-2',
      title: 'Fake Remote Job Video Rating Scam on WhatsApp',
      category: 'JOB_FRAUD',
      status: 'VERIFIED',
      sourceUrl: 'https://work-globalmedia-task.xyz',
      sourceContact: '+44 7911 123456',
      description: 'Recruiter named "Elena" contacted me on WhatsApp offering $300/day to rate YouTube videos. After 3 tasks, they insisted I deposit $150 crypto into a "workbench balance" to unlock higher pay.',
      upvotes: 29,
      downvotes: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3h ago
    },
    {
      id: 'rep-seed-3',
      title: 'Wells Fargo Account Lock Alert Phishing Page',
      category: 'PHISHING',
      status: 'VERIFIED',
      sourceUrl: 'http://wellsfargo-verify-security-login.top',
      sourceContact: 'security-alerts@domain-spoof.ru',
      description: 'Urgent email stating checking account was suspended due to abnormal wire transfer. Destination site clones the genuine Wells Fargo login layout to steal credentials.',
      upvotes: 38,
      downvotes: 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6h ago
    },
    {
      id: 'rep-seed-4',
      title: 'Guaranteed 400% ROI Telegram Crypto Trading Bot',
      category: 'INVESTMENT',
      status: 'PENDING',
      sourceUrl: 'https://t.me/BinanceSignalsVIP_OfficialBot',
      sourceContact: '@CryptoAdmin_VIP',
      description: 'Promoted on Reddit as an automated arbitrage bot. Promises 400% profit within 48h. Requires minimum 0.05 BTC transfer to unverified wallet address.',
      upvotes: 17,
      downvotes: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // 12h ago
    },
    {
      id: 'rep-seed-5',
      title: 'Fake Publisher Clearing House Winner Phone Call',
      category: 'LOTTERY',
      status: 'PENDING',
      sourceUrl: null,
      sourceContact: '+1 (876) 555-8931',
      description: 'Caller with Jamaican country code claimed I won $2.5 Million in the Mega Millions sweepstakes but must send $450 in Vanilla Visa gift cards to cover state tax paperwork.',
      upvotes: 14,
      downvotes: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() // 20h ago
    },
    {
      id: 'rep-seed-6',
      title: 'CEO Impersonation Gift Card Request Email',
      category: 'IMPERSONATION',
      status: 'VERIFIED',
      sourceUrl: null,
      sourceContact: 'ceo.corporate.meeting@gmail-fake.com',
      description: 'Email sent to company finance team claiming CEO is in an emergency board conference and needs five $100 Apple gift cards for a vendor immediately.',
      upvotes: 23,
      downvotes: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString() // 1d ago
    }
  ],

  init() {
    this.cacheElements();
    this.parseUrlParams();
    this.bindEvents();
    this.loadReports();
  },

  cacheElements() {
    this.searchInput = document.getElementById('feed-search-input');
    this.categoryChips = document.querySelectorAll('.feed-chip');
    this.sortSelect = document.getElementById('feed-sort-select');
    this.reportsGrid = document.getElementById('feed-reports-grid');
    this.emptyState = document.getElementById('feed-empty-state');
    this.loadingIndicator = document.getElementById('feed-loading-indicator');
    this.reportCountDisplay = document.getElementById('feed-total-count');
  },

  parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam) {
      this.activeCategory = filterParam.toUpperCase();
      this.categoryChips.forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('data-cat') === this.activeCategory);
      });
    }

    this.highlightId = urlParams.get('highlight');
  },

  bindEvents() {
    // Category chips
    this.categoryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.categoryChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeCategory = chip.getAttribute('data-cat');
        this.loadReports();
      });
    });

    // Search input (debounce)
    let searchTimeout;
    this.searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.searchQuery = this.searchInput.value.trim();
        this.loadReports();
      }, 350);
    });

    // Sort select
    this.sortSelect.addEventListener('change', () => {
      this.activeSort = this.sortSelect.value;
      this.loadReports();
    });
  },

  async loadReports() {
    this.showLoading(true);

    let items = [];
    let total = 0;

    try {
      const queryParams = new URLSearchParams({
        page: this.currentPage,
        limit: this.limit,
        sort: this.activeSort
      });
      if (this.activeCategory !== 'ALL') queryParams.append('category', this.activeCategory);
      if (this.searchQuery) queryParams.append('search', this.searchQuery);

      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REPORTS_LIST}?${queryParams.toString()}`);
      if (response.ok) {
        const result = await response.json();
        items = result.data.items || [];
        total = result.data.pagination ? result.data.pagination.total : items.length;
      }
    } catch {
      // Backend server currently offline — use local fallback reports combined with any newly submitted demo reports
    }

    if (items.length === 0) {
      // Combine user submitted demo reports with default seed reports
      const userReports = JSON.parse(sessionStorage.getItem('local_demo_reports') || '[]');
      let combined = [...userReports, ...this.FALLBACK_REPORTS];

      // Filter by category
      if (this.activeCategory !== 'ALL') {
        combined = combined.filter(r => r.category === this.activeCategory);
      }

      // Filter by search query
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        combined = combined.filter(r => 
          (r.title && r.title.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.sourceUrl && r.sourceUrl.toLowerCase().includes(q)) ||
          (r.sourceContact && r.sourceContact.toLowerCase().includes(q))
        );
      }

      // Sort
      if (this.activeSort === 'upvotes') {
        combined.sort((a, b) => b.upvotes - a.upvotes);
      } else {
        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      items = combined;
      total = items.length;
    }

    this.showLoading(false);
    this.renderReports(items, total);
  },

  showLoading(isLoading) {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    }
  },

  renderReports(items, total) {
    if (this.reportCountDisplay) {
      this.reportCountDisplay.textContent = `${total} Scams Cataloged`;
    }

    if (items.length === 0) {
      this.reportsGrid.style.display = 'none';
      this.emptyState.style.display = 'flex';
      return;
    }

    this.emptyState.style.display = 'none';
    this.reportsGrid.style.display = 'grid';

    this.reportsGrid.innerHTML = items.map(report => {
      const catConfig = CONFIG.SCAM_TYPES[report.category] || { label: report.category, badge: 'badge-primary' };
      const isVerified = report.status === 'VERIFIED';
      const timeAgo = this.formatTimeAgo(report.createdAt);
      const isHighlighted = this.highlightId && report.id === this.highlightId;

      return `
        <article class="feed-card ${isHighlighted ? 'highlight' : ''}" id="report-${report.id}">
          <div class="feed-card-header">
            <span class="badge ${catConfig.badge}">${catConfig.label}</span>
            <span class="badge ${isVerified ? 'badge-success' : 'badge-warning'}">
              <span class="badge-dot"></span>
              ${isVerified ? 'Verified Threat' : 'Pending Review'}
            </span>
          </div>

          <h3 class="feed-card-title">
            <a href="scam-details.html?id=${report.id}">${report.title}</a>
          </h3>

          ${report.sourceUrl ? `
            <div class="feed-evidence-pill" title="${report.sourceUrl}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span>${report.sourceUrl}</span>
            </div>
          ` : report.sourceContact ? `
            <div class="feed-evidence-pill" title="${report.sourceContact}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>${report.sourceContact}</span>
            </div>
          ` : ''}

          <p class="feed-card-desc">
            ${report.description}
          </p>

          <div class="feed-card-footer">
            <div style="font-size:0.775rem; color:var(--text-dim);">
              ${timeAgo}
            </div>

            <div style="display:flex; align-items:center; gap:8px;">
              <button class="upvote-btn" data-id="${report.id}" data-votes="${report.upvotes}">
                <span>▲</span>
                <span class="vote-count">${report.upvotes}</span>
              </button>
              <a href="scam-details.html?id=${report.id}" class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:4px 10px;">
                Details &rarr;
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    this.attachVoteHandlers();

    if (this.highlightId) {
      const el = document.getElementById(`report-${this.highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  },

  attachVoteHandlers() {
    this.reportsGrid.querySelectorAll('.upvote-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        let votes = parseInt(btn.getAttribute('data-votes'), 10);

        if (btn.classList.contains('voted')) {
          Toast.info('Already Voted', 'You have already verified this threat report.');
          return;
        }

        btn.classList.add('voted');
        votes += 1;
        btn.setAttribute('data-votes', votes);
        btn.querySelector('.vote-count').textContent = votes;
        Toast.success('Vote Recorded', 'Thank you for contributing to community threat verification!');

        // Try backend vote endpoint
        try {
          await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REPORT_VOTE(id)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: 1 })
          });
        } catch {
          // If offline, update local demo report in session
          const userReports = JSON.parse(sessionStorage.getItem('local_demo_reports') || '[]');
          const target = userReports.find(r => r.id === id);
          if (target) {
            target.upvotes = (target.upvotes || 0) + 1;
            sessionStorage.setItem('local_demo_reports', JSON.stringify(userReports));
          }
        }
      });
    });
  },

  formatTimeAgo(isoString) {
    if (!isoString) return 'Recently';
    const seconds = Math.floor((new Date() - new Date(isoString)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
};
