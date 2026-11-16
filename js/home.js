/**
 * FraudGuard AI - Home Page Interactive Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mount shared components
  Navbar.render('navbar-mount');
  Footer.render('footer-mount');

  // Initialize Home Page Modules
  initHeroDemoWidget();
  initThreatTicker();
  initStatsCounter();
});

/**
 * 1. Hero Quick Interactive Demo Widget
 * Provides an immediate, engaging playground on the landing page
 * with realistic threat detection heuristic simulation.
 */
function initHeroDemoWidget() {
  const inputEl = document.getElementById('demo-threat-input');
  const analyzeBtn = document.getElementById('demo-analyze-btn');
  const resultPanel = document.getElementById('demo-result-panel');
  const scoreNumber = document.getElementById('demo-score-number');
  const scoreFill = document.getElementById('demo-score-fill');
  const riskBadge = document.getElementById('demo-risk-badge');
  const analysisSummary = document.getElementById('demo-analysis-summary');
  const flagsList = document.getElementById('demo-flags-list');
  const presetChips = document.querySelectorAll('.preset-chip');
  const demoTabs = document.querySelectorAll('.demo-tab');

  if (!inputEl || !analyzeBtn) return;

  // Realistic sample presets
  const PRESETS = {
    sms: "ALERT: Your delivery parcel #US-8829 is on hold due to unpaid customs fee of $2.45. Resolve immediately within 12h: http://bit.ly/usps-post-pay-online",
    url: "http://secure-login.wellsfargo-verify-security.top/account/auth.php",
    crypto: "GUARANTEED 450% Return! Connect your MetaMask wallet to our AI liquidity pool and earn 2.5 ETH daily. Claim bonus airdrop now: http://airdrop-eth-bonus.xyz",
    safe: "Hi Sarah, just following up on our scheduled meeting tomorrow at 10:00 AM regarding the Q4 review. Meeting link is on your Google Calendar invite."
  };

  // Tab switching
  demoTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      demoTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const type = tab.getAttribute('data-type');
      if (PRESETS[type]) {
        inputEl.value = PRESETS[type];
      }
    });
  });

  // Preset chips click
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const presetKey = chip.getAttribute('data-preset');
      if (PRESETS[presetKey]) {
        inputEl.value = PRESETS[presetKey];
        // Activate matching tab
        demoTabs.forEach(t => {
          if (t.getAttribute('data-type') === presetKey) {
            demoTabs.forEach(tb => tb.classList.remove('active'));
            t.classList.add('active');
          }
        });
        runDemoAnalysis(PRESETS[presetKey]);
      }
    });
  });

  // Analyze button click
  analyzeBtn.addEventListener('click', () => {
    const text = inputEl.value.trim();
    if (!text) {
      Toast.warning('Input Required', 'Please enter or paste an SMS message, email snippet, or URL to analyze.');
      return;
    }
    runDemoAnalysis(text);
  });

  function runDemoAnalysis(text) {
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `
      <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10"/>
      </svg>
      Analyzing Heuristics...
    `;

    setTimeout(() => {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        Inspect Sample Threat
      `;

      // Structural heuristic evaluation for the demo widget
      const lower = text.toLowerCase();
      let score = 15;
      let flags = [];
      let summary = '';

      if (lower.includes('bit.ly') || lower.includes('.xyz') || lower.includes('.top') || lower.includes('.ru') || lower.includes('.tk')) {
        score += 35;
        flags.push('High-risk top level domain / URL shortener masking true destination');
      }
      if (lower.includes('unpaid') || lower.includes('fee') || lower.includes('resolve immediately') || lower.includes('within 12h') || lower.includes('alert:') || lower.includes('urgent')) {
        score += 25;
        flags.push('Psychological urgency & immediate financial penalty pressure detected');
      }
      if (lower.includes('guaranteed') || lower.includes('airdrop') || lower.includes('450%') || lower.includes('eth daily') || lower.includes('metamask')) {
        score += 45;
        flags.push('Unrealistic high-yield financial promise / Crypto wallet drainer vector');
      }
      if (lower.includes('login') || lower.includes('verify-security') || lower.includes('account/auth')) {
        score += 30;
        flags.push('Deceptive credential harvesting pattern mimicking banking gateway');
      }

      score = Math.min(score, 98);

      if (score >= 70) {
        riskBadge.className = 'badge badge-danger';
        riskBadge.innerHTML = '<span class="badge-dot"></span> Critical Threat Alert';
        scoreFill.style.backgroundColor = 'var(--danger)';
        scoreFill.style.boxShadow = '0 0 12px var(--danger)';
        summary = 'Severe phishing indicators identified. High probability of malicious intent and credential or financial theft.';
      } else if (score >= 35) {
        riskBadge.className = 'badge badge-warning';
        riskBadge.innerHTML = '<span class="badge-dot"></span> Suspicious Vector';
        scoreFill.style.backgroundColor = 'var(--warning)';
        scoreFill.style.boxShadow = '0 0 12px var(--warning)';
        summary = 'Caution advised. This content displays manipulative phrasing or unverified routing.';
      } else {
        score = 8;
        riskBadge.className = 'badge badge-success';
        riskBadge.innerHTML = '<span class="badge-dot"></span> Benign / Low Risk';
        scoreFill.style.backgroundColor = 'var(--success)';
        scoreFill.style.boxShadow = '0 0 12px var(--success)';
        flags.push('Standard conversational tone, no coercive triggers or masking patterns');
        summary = 'No obvious malicious indicators detected. Normal professional communications structure.';
      }

      scoreNumber.textContent = `${score}/100`;
      scoreFill.style.width = `${score}%`;
      analysisSummary.textContent = summary;

      flagsList.innerHTML = flags.map(f => `
        <li style="display:flex; align-items:flex-start; gap:6px; font-size:0.775rem; color:var(--text-muted); margin-bottom:4px;">
          <span style="color:${score >= 70 ? 'var(--danger)' : score >= 35 ? 'var(--warning)' : 'var(--success)'};">▸</span>
          ${f}
        </li>
      `).join('');

      resultPanel.style.display = 'block';
      Toast.info('Interactive Demo Evaluated', `Computed threat risk score: ${score}/100.`);
    }, 450);
  }
}

/**
 * 2. Live Community Threat Ticker
 */
function initThreatTicker() {
  const tickerContainer = document.getElementById('threat-ticker-track');
  if (!tickerContainer) return;

  const mockThreatFeed = [
    { type: 'SMS Smishing', target: 'Postal Delivery Impersonation', risk: '96% Risk', time: '2m ago' },
    { type: 'Phishing URL', target: 'secure-web-portal.login-auth.xyz', risk: '98% Risk', time: '5m ago' },
    { type: 'Crypto Scam', target: 'Fake DEX AirDrop Token Claim', risk: '92% Risk', time: '8m ago' },
    { type: 'Bank Impersonator', target: 'Urgent Wire Transfer Authorization', risk: '94% Risk', time: '11m ago' },
    { type: 'Job Fraud', target: 'Telegram Remote Task Recruitment', risk: '89% Risk', time: '15m ago' }
  ];

  // Repeat twice for seamless infinite scrolling
  const feedItems = [...mockThreatFeed, ...mockThreatFeed];

  tickerContainer.innerHTML = feedItems.map(item => `
    <div class="ticker-item">
      <span class="badge badge-danger" style="font-size:0.7rem; padding: 2px 6px;">${item.type}</span>
      <span style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-main);">${item.target}</span>
      <span style="color:var(--danger); font-weight:700; font-size:0.8rem;">[${item.risk}]</span>
      <span style="color:var(--text-dim); font-size:0.75rem;">• ${item.time}</span>
    </div>
  `).join('');
}

/**
 * 3. Animated Counter for Platform Statistics
 */
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number-animated');
  if (!statNumbers.length) return;

  let hasAnimated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        statNumbers.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-target'), 10);
          const suffix = stat.getAttribute('data-suffix') || '';
          animateNumber(stat, target, suffix);
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.getElementById('community-stats-section');
  if (statsSection) {
    observer.observe(statsSection);
  }

  function animateNumber(element, target, suffix) {
    let current = 0;
    const duration = 1500;
    const stepTime = 25;
    const increment = Math.ceil(target / (duration / stepTime));

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = current.toLocaleString() + suffix;
    }, stepTime);
  }
}
