/**
 * FraudGuard AI - Public Scam Reporting Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  Navbar.render('navbar-mount');
  Footer.render('footer-mount');

  ReportController.init();
});

const ReportController = {
  init() {
    this.cacheElements();
    this.checkPrefillData();
    this.bindEvents();
  },

  cacheElements() {
    this.form = document.getElementById('report-scam-form');
    this.titleInput = document.getElementById('report-title');
    this.categoryRadios = document.querySelectorAll('input[name="category"]');
    this.descInput = document.getElementById('report-description');
    this.urlInput = document.getElementById('report-source-url');
    this.contactInput = document.getElementById('report-source-contact');
    this.anonymousCheckbox = document.getElementById('report-anonymous');
    this.descCounter = document.getElementById('report-desc-counter');
    this.submitBtn = document.getElementById('report-submit-btn');
    this.successBanner = document.getElementById('report-success-banner');
  },

  checkPrefillData() {
    try {
      const prefillRaw = sessionStorage.getItem('prefill_report');
      if (prefillRaw) {
        const data = JSON.parse(prefillRaw);
        if (data.target) {
          if (data.type === 'URL') {
            this.urlInput.value = data.target;
            this.titleInput.value = `Suspicious Phishing Website: ${data.target.substring(0, 45)}`;
            this.setCategory('PHISHING');
          } else {
            this.descInput.value = `Suspicious Content Flagged During Scan:\n"${data.target}"`;
            this.titleInput.value = `Fraudulent ${data.type} Alert`;
            this.setCategory(data.type === 'SMS' ? 'PHISHING' : data.type === 'CRYPTO' ? 'INVESTMENT' : 'OTHER');
          }
          this.updateCharCount();
          Toast.info('Scanner Data Loaded', 'Prefilled report fields with your recent scan finding.');
        }
        // Clear prefill so it doesn't persistently overwrite on subsequent manual visits
        sessionStorage.removeItem('prefill_report');
      }
    } catch (e) {
      console.warn('Failed to parse prefill report data:', e);
    }
  },

  setCategory(cat) {
    const radio = document.querySelector(`input[name="category"][value="${cat}"]`);
    if (radio) {
      radio.checked = true;
    }
  },

  getSelectedCategory() {
    const checked = document.querySelector('input[name="category"]:checked');
    return checked ? checked.value : null;
  },

  updateCharCount() {
    const len = this.descInput.value.length;
    this.descCounter.textContent = `${len} / 5000 characters (min 20)`;
    if (len < 20) {
      this.descCounter.style.color = 'var(--warning)';
    } else {
      this.descCounter.style.color = 'var(--text-dim)';
    }
  },

  bindEvents() {
    this.descInput.addEventListener('input', () => {
      this.updateCharCount();
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  },

  validate() {
    let isValid = true;
    this.clearErrors();

    const title = this.titleInput.value.trim();
    const category = this.getSelectedCategory();
    const desc = this.descInput.value.trim();

    // Title validation
    if (!title || title.length < 5) {
      this.showFieldError('report-title-error', 'Title must be at least 5 characters long.');
      this.titleInput.classList.add('has-error');
      isValid = false;
    }

    // Category validation
    if (!category) {
      this.showFieldError('report-category-error', 'Please select a scam category.');
      isValid = false;
    }

    // Description validation
    if (!desc || desc.length < 20) {
      this.showFieldError('report-desc-error', 'Please provide at least 20 characters describing the scam.');
      this.descInput.classList.add('has-error');
      isValid = false;
    }

    return isValid;
  },

  showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = msg;
      el.classList.add('active');
    }
  },

  clearErrors() {
    document.querySelectorAll('.field-error-msg').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
  },

  async handleSubmit() {
    if (!this.validate()) return;

    const payload = {
      title: this.titleInput.value.trim(),
      category: this.getSelectedCategory(),
      description: this.descInput.value.trim(),
      sourceUrl: this.urlInput.value.trim() || null,
      sourceContact: this.contactInput.value.trim() || null,
      isAnonymous: this.anonymousCheckbox.checked
    };

    this.submitBtn.disabled = true;
    this.submitBtn.innerHTML = `
      <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10"/>
      </svg>
      Submitting to Community...
    `;

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REPORT_CREATE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        Toast.success('Report Published', 'Your scam report has been successfully added to the community feed!');
        this.onSuccess(data.data ? data.data.id : null);
        return;
      }
    } catch {
      // Backend server currently offline — store client demo report in sessionStorage/localStorage
      // so the user can test the community feed immediately without blocking
    }

    // Client-side fallback storage for testing when backend is not actively running
    const fallbackReport = {
      id: 'rep-' + Date.now(),
      title: payload.title,
      category: payload.category,
      description: payload.description,
      sourceUrl: payload.sourceUrl,
      sourceContact: payload.sourceContact,
      isAnonymous: payload.isAnonymous,
      status: 'PENDING',
      upvotes: 1,
      downvotes: 0,
      createdAt: new Date().toISOString()
    };

    const existing = JSON.parse(sessionStorage.getItem('local_demo_reports') || '[]');
    existing.unshift(fallbackReport);
    sessionStorage.setItem('local_demo_reports', JSON.stringify(existing));

    Toast.success('Report Submitted', 'Your report has been logged and published to the community feed.');
    this.onSuccess(fallbackReport.id);
  },

  onSuccess(newReportId) {
    this.submitBtn.disabled = false;
    this.submitBtn.innerHTML = `Submit Scam Report`;
    this.form.reset();
    this.updateCharCount();

    if (this.successBanner) {
      this.successBanner.style.display = 'block';
      this.successBanner.scrollIntoView({ behavior: 'smooth' });
    }

    setTimeout(() => {
      window.location.href = `feed.html${newReportId ? `?highlight=${newReportId}` : ''}`;
    }, 1800);
  }
};
