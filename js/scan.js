/**
 * FraudGuard AI - Scam Scanner Interface Controller
 * 
 * Implements:
 * - Multi-type input scanning (URL, SMS, Email, Social Message)
 * - Transparent client-side heuristic inspection rules (clearly labelled)
 * - Backend API readiness (POST /api/scans/analyze)
 * - Session history tracking in sessionStorage
 * - Direct pre-fill bridge to Report Scam page
 */

document.addEventListener('DOMContentLoaded', () => {
  // Render shared navigation and footer
  Navbar.render('navbar-mount');
  Footer.render('footer-mount');

  // Initialize Scanner Controller
  ScannerController.init();
});

const ScannerController = {
  activeType: 'URL',

  // Curated realistic test samples for instant demonstration
  SAMPLE_PRESETS: {
    URL: [
      { label: 'Phish Banking', val: 'http://wellsfargo-verify-security-login.top/auth/signin.php' },
      { label: 'Shortened Link', val: 'https://bit.ly/usps-unpaid-customs-fee-39' },
      { label: 'Crypto Drainer', val: 'https://metamask-airdrop-claim-bonus.xyz/connect' },
      { label: 'Legitimate Site', val: 'https://www.wikipedia.org' }
    ],
    SMS: [
      { label: 'Fake Delivery', val: 'USPS Notice: Your package #9400 has a pending customs charge of $1.85. Update payment within 12h to avoid package return: http://bit.ly/usps-track-99' },
      { label: 'Bank Fraud Alert', val: 'ALERT: Suspicious withdrawal of $940.00 flagged on your checking account. If not you, reply STOP or call security at +1-800-FAKE-NUM immediately.' },
      { label: 'Legit SMS', val: 'Your appointment with Dr. Henderson is confirmed for Tuesday at 2:30 PM. Reply 1 to confirm or 2 to reschedule.' }
    ],
    EMAIL: [
      { label: 'CEO Gift Card', val: 'From: ceo.executive@gmail-secure.com\nSubject: Urgent task while in conference\n\nI need you to purchase 5 x $100 Apple Gift Cards for our client immediately. Scratch the back and send photos to me. Do not call, I am in a board meeting.' },
      { label: 'Account Suspension', val: 'From: support@secure-paypal-notice.ru\nSubject: Account Permanently Locked\n\nWe detected unauthorized access. Click below to verify your SSN and card PIN within 24 hours or your funds will be forfeited.' },
      { label: 'Legit Newsletter', val: 'From: updates@github.com\nSubject: Your weekly digest\n\nHere are the top trending open source repositories in JavaScript and Python for this week.' }
    ],
    MESSAGE: [
      { label: 'Telegram Investment', val: 'Hey mate! I have an exclusive bot that yields 350% weekly on Binance. Send 0.1 BTC to join VIP signals group. 100% risk free guaranteed.' },
      { label: 'Job Scam', val: 'Hello! I represent Global Media HR. We offer remote video rating jobs paying $300-$500/day. No interview needed. Contact WhatsApp: +234-809-1234.' },
      { label: 'Legit Message', val: 'Hey! Are you still free for coffee this Saturday afternoon? Let me know what time works best for you.' }
    ]
  },

  init() {
    this.cacheElements();
    this.checkPrefillData();
    this.bindEvents();
    this.renderPresets();
    this.renderSessionScans();
  },

  checkPrefillData() {
    try {
      const raw = sessionStorage.getItem('prefill_scan');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.target) {
          this.switchType(data.type || 'URL');
          if (data.type === 'URL') {
            this.urlInput.value = data.target;
          } else {
            this.textInput.value = data.target;
            this.charCount.textContent = `${data.target.length} / 2500 chars`;
          }
          Toast.info('Threat Target Loaded', `Loaded target from scam report.`);
        }
        sessionStorage.removeItem('prefill_scan');
      }
    } catch (e) {
      console.warn('Failed to parse prefill scan data:', e);
    }
  },

  cacheElements() {
    this.typeBtns = document.querySelectorAll('.scan-type-btn');
    this.urlContainer = document.getElementById('url-input-container');
    this.textContainer = document.getElementById('text-input-container');
    this.urlInput = document.getElementById('scan-url-field');
    this.textInput = document.getElementById('scan-text-field');
    this.textLabel = document.getElementById('text-field-label');
    this.charCount = document.getElementById('char-count');
    this.clearBtn = document.getElementById('scan-clear-btn');
    this.scanBtn = document.getElementById('scan-submit-btn');
    this.presetsContainer = document.getElementById('sample-presets');

    // Result elements
    this.emptyState = document.getElementById('results-empty');
    this.loadingState = document.getElementById('results-loading');
    this.activeState = document.getElementById('results-active');

    this.scoreNumber = document.getElementById('result-score-num');
    this.scoreBox = document.getElementById('result-score-box');
    this.scoreBar = document.getElementById('result-score-bar');
    this.riskBadge = document.getElementById('result-risk-badge');
    this.confidenceBadge = document.getElementById('result-confidence-badge');
    this.engineBadge = document.getElementById('result-engine-badge');
    this.findingsList = document.getElementById('result-findings-list');
    this.explanationText = document.getElementById('result-explanation-text');
    this.recommendationsList = document.getElementById('result-recommendations-list');
    this.reportBridgeBtn = document.getElementById('result-report-bridge-btn');

    // Session Scans elements
    this.sessionTableBody = document.getElementById('session-scans-tbody');
    this.clearSessionBtn = document.getElementById('clear-session-history-btn');
    this.sessionScansWidget = document.getElementById('session-history-widget');
  },

  bindEvents() {
    // Tab switching
    this.typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        if (!type) return;
        this.switchType(type);
      });
    });

    // Character counter
    this.textInput.addEventListener('input', () => {
      const len = this.textInput.value.length;
      this.charCount.textContent = `${len} / 2500 chars`;
    });

    // Clear input
    this.clearBtn.addEventListener('click', () => {
      this.urlInput.value = '';
      this.textInput.value = '';
      this.charCount.textContent = '0 / 2500 chars';
      this.showEmptyState();
      Toast.info('Cleared', 'Input fields reset.');
    });

    // Submit Scan
    this.scanBtn.addEventListener('click', () => {
      this.handleScanSubmit();
    });

    // Clear session history
    if (this.clearSessionBtn) {
      this.clearSessionBtn.addEventListener('click', () => {
        if (confirm('Clear all scan records from this browser session?')) {
          SessionScanHistory.clearScans();
          this.renderSessionScans();
          Toast.info('History Cleared', 'Session scan history has been wiped.');
          // Refresh navbar badge if visible
          const badge = document.getElementById('nav-session-count');
          if (badge) badge.remove();
        }
      });
    }

    // Bridge to Report Scam page
    if (this.reportBridgeBtn) {
      this.reportBridgeBtn.addEventListener('click', () => {
        const target = this.activeType === 'URL' ? this.urlInput.value.trim() : this.textInput.value.trim();
        if (target) {
          sessionStorage.setItem('prefill_report', JSON.stringify({
            type: this.activeType,
            target: target,
            riskScore: this.currentResult ? this.currentResult.riskScore : 75
          }));
          window.location.href = 'report.html';
        }
      });
    }
  },

  switchType(type) {
    this.activeType = type;
    this.typeBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-type') === type);
    });

    if (type === 'URL') {
      this.urlContainer.style.display = 'block';
      this.textContainer.style.display = 'none';
    } else {
      this.urlContainer.style.display = 'none';
      this.textContainer.style.display = 'block';

      const labels = {
        SMS: 'Paste SMS / Text Message Body',
        EMAIL: 'Paste Full Email Content (Headers, Subject & Body)',
        MESSAGE: 'Paste Social Media / Chat Snippet (Telegram, WhatsApp, Discord)'
      };
      this.textLabel.textContent = labels[type] || 'Paste Suspicious Text Content';
    }

    this.renderPresets();
  },

  renderPresets() {
    const presets = this.SAMPLE_PRESETS[this.activeType] || [];
    this.presetsContainer.innerHTML = presets.map((p, idx) => `
      <span class="sample-chip" data-idx="${idx}">${p.label}</span>
    `).join('');

    this.presetsContainer.querySelectorAll('.sample-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const idx = parseInt(chip.getAttribute('data-idx'), 10);
        const item = presets[idx];
        if (!item) return;

        if (this.activeType === 'URL') {
          this.urlInput.value = item.val;
        } else {
          this.textInput.value = item.val;
          this.charCount.textContent = `${item.val.length} / 2500 chars`;
        }
        Toast.info('Sample Loaded', `Loaded preset: "${item.label}"`);
      });
    });
  },

  handleScanSubmit() {
    let target = '';
    if (this.activeType === 'URL') {
      target = this.urlInput.value.trim();
      if (!target) {
        Toast.warning('URL Required', 'Please enter a website address or URL to scan.');
        this.urlInput.focus();
        return;
      }
      // Check for rudimentary URL formatting
      if (!target.includes('.') || target.length < 4) {
        Toast.error('Invalid URL', 'Please enter a valid web domain or URL.');
        return;
      }
    } else {
      target = this.textInput.value.trim();
      if (!target) {
        Toast.warning('Input Required', 'Please paste the suspicious text content to scan.');
        this.textInput.focus();
        return;
      }
      if (target.length < 10) {
        Toast.warning('Content Too Short', 'Please enter at least 10 characters to perform a meaningful diagnostic.');
        return;
      }
    }

    this.runScan(this.activeType, target);
  },

  async runScan(type, target) {
    this.showLoadingState();

    // Check if backend API is reachable
    let result = null;
    let engineMode = 'Preliminary Rule-Based Analysis';

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.SCAN_ANALYZE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, target })
      });

      if (response.ok) {
        const data = await response.json();
        result = data.data;
        engineMode = data.data.engineMode || 'Backend Analysis Service';
      }
    } catch {
      // Backend not running — fallback to preliminary rule-based analysis
      engineMode = 'Preliminary Rule-Based Analysis';
    }

    // If backend wasn't reachable, evaluate using rigorous client heuristics
    if (!result) {
      // Realistic simulation delay for UX
      await new Promise(r => setTimeout(r, 650));
      result = this.evaluateClientHeuristics(type, target);
    }

    result.engineMode = engineMode;
    this.currentResult = result;

    // Save to current browser session (sessionStorage)
    SessionScanHistory.addScan({
      type: type,
      target: target,
      targetPreview: target.length > 80 ? target.substring(0, 80) + '...' : target,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      confidence: result.confidence,
      warnings: result.warnings,
      engineMode: engineMode
    });

    this.displayResults(result);
    this.renderSessionScans();

    // Update navbar badge count
    Navbar.render('navbar-mount');
  },

  /**
   * Transparent Rule-Based Client Heuristics
   * Does NOT pretend to be ML. Evaluates objective structural indicators.
   */
  evaluateClientHeuristics(type, target) {
    const lower = target.toLowerCase();
    let score = 10;
    let warnings = [];
    let recommendations = [];
    let explanation = '';

    if (type === 'URL') {
      // 1. IP address instead of domain name
      if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lower) || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lower)) {
        score += 45;
        warnings.push({ severity: 'danger', text: 'Direct IP address destination used instead of legitimate domain name' });
      }

      // 2. High-risk TLDs
      const dangerousTLDs = ['.xyz', '.top', '.ru', '.tk', '.work', '.click', '.buzz', '.zip', '.mov', '.cc', '.cn'];
      if (dangerousTLDs.some(tld => lower.includes(tld))) {
        score += 30;
        warnings.push({ severity: 'danger', text: 'Uses high-risk top-level domain frequently associated with throwaway phishing campaigns' });
      }

      // 3. Shortened URL masking true destination
      const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'cutt.ly'];
      if (shorteners.some(s => lower.includes(s))) {
        score += 25;
        warnings.push({ severity: 'warning', text: 'Masked via URL shortener service — actual destination server is hidden from view' });
      }

      // 4. Excessive subdomains
      const dotCount = (lower.match(/\./g) || []).length;
      if (dotCount >= 3) {
        score += 20;
        warnings.push({ severity: 'warning', text: `Contains ${dotCount} sub-domain levels, a technique used to spoof legitimate brand namespaces` });
      }

      // 5. Deceptive security / auth keywords
      const deceptiveKeywords = ['login', 'signin', 'verify', 'security-update', 'auth', 'wellsfargo', 'paypal', 'metamask', 'wallet', 'banking', 'refund'];
      const matchedKeywords = deceptiveKeywords.filter(k => lower.includes(k));
      if (matchedKeywords.length > 0) {
        score += 25;
        warnings.push({ severity: 'danger', text: `Deceptive keyword patterns detected: [${matchedKeywords.join(', ')}]` });
      }

      // 6. Non-standard port
      if (/:\d{4,5}/.test(lower)) {
        score += 20;
        warnings.push({ severity: 'warning', text: 'Routes traffic through non-standard network port' });
      }

    } else {
      // SMS, EMAIL, MESSAGE checks

      // 1. Psychological urgency & coercion
      const urgencyPhrases = ['within 24 hours', 'within 12h', 'immediately', 'account will be suspended', 'permanently locked', 'warrant for arrest', 'action required', 'final notice', 'unauthorized withdrawal', 'flagged'];
      const matchedUrgency = urgencyPhrases.filter(p => lower.includes(p));
      if (matchedUrgency.length > 0) {
        score += 30;
        warnings.push({ severity: 'danger', text: `Coercive urgency indicators: "${matchedUrgency.slice(0, 2).join('", "')}"` });
      }

      // 2. Financial pressure or lure
      const financialPhrases = ['customs fee', 'unpaid fee', 'wire money', 'gift card', 'crypto', 'airdrop', 'guaranteed returns', 'claim bonus', '350%', 'double your investment', 'earn $', 'free gift'];
      const matchedFinance = financialPhrases.filter(p => lower.includes(p));
      if (matchedFinance.length > 0) {
        score += 35;
        warnings.push({ severity: 'danger', text: `Financial solicitation pattern: "${matchedFinance.slice(0, 2).join('", "')}"` });
      }

      // 3. Credential / 2FA extraction
      const credentialPhrases = ['password', 'pin', 'ssn', 'seed phrase', 'otp', 'verification code', 'scratch the back', 'secret key'];
      const matchedCreds = credentialPhrases.filter(p => lower.includes(p));
      if (matchedCreds.length > 0) {
        score += 40;
        warnings.push({ severity: 'danger', text: `Credential or 2FA harvesting request: "${matchedCreds.join('", "')}"` });
      }

      // 4. Embedded link inside text
      if (lower.includes('http://') || lower.includes('https://') || lower.includes('.ly/') || lower.includes('.xyz')) {
        score += 20;
        warnings.push({ severity: 'warning', text: 'Contains external hyperlink requesting immediate action' });
      }

      // 5. Impersonation of authority / executive
      if (lower.includes('ceo') || lower.includes('board meeting') || lower.includes('support team') || lower.includes('do not call') || lower.includes('security department')) {
        score += 25;
        warnings.push({ severity: 'warning', text: 'Impersonation markers mimicking company executive or official support' });
      }
    }

    // Cap score at 98
    score = Math.min(score, 98);

    // Determine Risk Level & Confidence
    let riskLevel = 'SAFE';
    let confidence = 'High';

    if (score >= 70) {
      riskLevel = 'PHISHING';
      confidence = 'High (Multiple Strong Heuristic Flags)';
      explanation = 'Multiple high-risk indicators found. This content displays classic hallmarks of a phishing campaign or fraudulent financial lure aimed at harvesting credentials, funds, or private identity data.';
      recommendations = [
        'Do NOT click any embedded hyperlinks or download attachments.',
        'Never disclose two-factor verification codes, passwords, or gift card PINs.',
        'Block the sender address/phone number on your device.',
        'Report this item to the Community Scam Feed to protect other citizens.'
      ];
    } else if (score >= 35) {
      riskLevel = 'SUSPICIOUS';
      confidence = 'Medium (Borderline Urgency or Masked Link)';
      explanation = 'Suspicious elements detected. While not conclusively proven malicious, the presence of masked routing or urgency phrasing warrants strict caution.';
      recommendations = [
        'Verify the sender through an independent, official channel before proceeding.',
        'Inspect the true destination URL in a secure sandbox before opening.',
        'Do not reply directly to unsolicited payment requests.'
      ];
    } else {
      score = Math.max(score, 6);
      riskLevel = 'SAFE';
      confidence = 'High';
      explanation = 'No critical threat signatures or deceptive manipulation patterns detected by local heuristic rules. Standard communicative structure observed.';
      warnings.push({ severity: 'safe', text: 'Clean structural layout with no coercion, deceptive links, or credential requests' });
      recommendations = [
        'Content appears benign. Always follow safe web hygiene regardless.',
        'Ensure you only enter sensitive data on verified, HTTPS-secured official portals.'
      ];
    }

    return {
      riskScore: score,
      riskLevel: riskLevel,
      confidence: confidence,
      warnings: warnings,
      explanation: explanation,
      recommendations: recommendations
    };
  },

  displayResults(result) {
    this.hideAllStates();
    this.activeState.style.display = 'flex';

    const levelConfig = CONFIG.RISK_LEVELS[result.riskLevel] || CONFIG.RISK_LEVELS.SUSPICIOUS;

    // 1. Score number & progress bar
    this.scoreNumber.textContent = `${result.riskScore}`;
    this.scoreBar.style.width = `${result.riskScore}%`;
    this.scoreBar.style.backgroundColor = `var(--${levelConfig.color})`;
    this.scoreBar.style.boxShadow = `0 0 12px var(--${levelConfig.color})`;

    this.scoreBox.style.borderColor = `var(--${levelConfig.color})`;
    this.scoreBox.style.color = `var(--${levelConfig.color})`;

    // 2. Badges
    this.riskBadge.className = `badge ${levelConfig.badgeClass}`;
    this.riskBadge.innerHTML = `<span class="badge-dot"></span> ${levelConfig.label}`;

    this.confidenceBadge.textContent = `Confidence: ${result.confidence}`;
    this.engineBadge.textContent = result.engineMode || 'Heuristic Rules';

    // 3. Explanation
    this.explanationText.textContent = result.explanation;

    // 4. Warnings / Flags List
    if (result.warnings && result.warnings.length > 0) {
      this.findingsList.innerHTML = result.warnings.map(w => `
        <li class="finding-item ${w.severity || 'warning'}">
          <span style="font-weight:700;">${w.severity === 'danger' ? '⛔' : w.severity === 'warning' ? '⚠' : '✓'}</span>
          <span>${w.text || w}</span>
        </li>
      `).join('');
    } else {
      this.findingsList.innerHTML = `<li class="finding-item safe"><span>✓ No red flags identified.</span></li>`;
    }

    // 5. Recommended Actions
    if (result.recommendations && result.recommendations.length > 0) {
      this.recommendationsList.innerHTML = result.recommendations.map(r => `
        <li>
          <span style="color:var(--primary); font-weight:700;">•</span>
          <span>${r}</span>
        </li>
      `).join('');
    }

    // Scroll results into view smoothly on mobile
    if (window.innerWidth < 992) {
      this.activeState.scrollIntoView({ behavior: 'smooth' });
    }
  },

  showLoadingState() {
    this.hideAllStates();
    this.loadingState.style.display = 'flex';
  },

  showEmptyState() {
    this.hideAllStates();
    this.emptyState.style.display = 'flex';
  },

  hideAllStates() {
    this.emptyState.style.display = 'none';
    this.loadingState.style.display = 'none';
    this.activeState.style.display = 'none';
  },

  /**
   * Render Recent Scans Performed in This Browser Session
   */
  renderSessionScans() {
    if (!this.sessionTableBody) return;

    const scans = SessionScanHistory.getScans();

    if (scans.length === 0) {
      this.sessionTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 24px; color:var(--text-dim);">
            No scans performed in this browser session yet. Run a scan above to see your session audit history.
          </td>
        </tr>
      `;
      return;
    }

    this.sessionTableBody.innerHTML = scans.map(s => {
      const level = CONFIG.RISK_LEVELS[s.riskLevel] || CONFIG.RISK_LEVELS.SUSPICIOUS;
      const date = new Date(s.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <tr>
          <td><span class="badge ${CONFIG.SCAM_TYPES[s.type] ? CONFIG.SCAM_TYPES[s.type].badge : 'badge-primary'}">${s.type}</span></td>
          <td style="font-family:var(--font-mono); font-size:0.8rem; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${s.targetPreview}">
            ${s.targetPreview}
          </td>
          <td>
            <span class="badge ${level.badgeClass}" style="font-size:0.7rem;">
              ${s.riskScore}/100 • ${level.label.split('/')[0]}
            </span>
          </td>
          <td style="font-size:0.775rem; color:var(--text-dim);">${timeStr}</td>
          <td style="text-align:right;">
            <button class="btn btn-outline btn-sm recheck-scan-btn" data-type="${s.type}" data-target="${s.targetPreview.replace(/"/g, '&quot;')}" style="font-size:0.72rem; padding:3px 8px;">
              Reload
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach click listeners to "Reload" buttons
    this.sessionTableBody.querySelectorAll('.recheck-scan-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        const target = btn.getAttribute('data-target');
        if (type === 'SCREENSHOT') {
          window.location.href = 'screenshot.html';
          return;
        }
        this.switchType(type);
        if (type === 'URL') {
          this.urlInput.value = target;
        } else {
          this.textInput.value = target;
          this.charCount.textContent = `${target.length} / 2500 chars`;
        }
        this.handleScanSubmit();
      });
    });
  }
};
