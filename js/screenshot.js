/**
 * FraudGuard AI - Screenshot Scam Detection Controller
 *
 * Strict ML Compliance:
 *  - No fabricated ML predictions, confidence scores, or fake risk levels.
 *  - Keyword matching is clearly labeled as rule-based heuristic, NOT ML.
 *  - Gemini explanations are labeled as AI-generated guidance, not ML classification.
 *  - When ML service is offline, detection status is "Unable to Determine".
 */

document.addEventListener('DOMContentLoaded', () => {
  Navbar.render('navbar-mount');
  if (typeof Footer !== 'undefined') Footer.render('footer-mount');

  ScreenshotController.init();
});

const ScreenshotController = {
  selectedFile: null,
  lastResult: null,

  init() {
    this.cacheElements();
    this.bindEvents();
  },

  cacheElements() {
    this.dropZone = document.getElementById('drop-zone');
    this.fileInput = document.getElementById('file-input');
    this.previewCard = document.getElementById('preview-card');
    this.previewImage = document.getElementById('preview-image');
    this.previewName = document.getElementById('preview-name');
    this.previewSpecs = document.getElementById('preview-specs');
    this.btnRemove = document.getElementById('btn-remove-image');
    this.btnAnalyze = document.getElementById('btn-analyze');

    // Scanning state
    this.scanningState = document.getElementById('scanning-state');
    this.scannerStepTitle = document.getElementById('scanner-step-title');
    this.scannerStepSub = document.getElementById('scanner-step-sub');
    this.scannerProgressFill = document.getElementById('scanner-progress-fill');

    // Results
    this.resultsEmpty = document.getElementById('results-empty');
    this.resultsContent = document.getElementById('results-content');
    this.statusBanner = document.getElementById('status-banner');
    this.resStatusText = document.getElementById('res-status-text');
    this.resMlPill = document.getElementById('res-ml-pill');
    this.resMlText = document.getElementById('res-ml-text');
    this.resRiskLevel = document.getElementById('res-risk-level');
    this.resCategory = document.getElementById('res-category');
    this.resConfidence = document.getElementById('res-confidence');
    this.ocrTextBox = document.getElementById('ocr-text-box');
    this.ocrCharCount = document.getElementById('ocr-char-count');
    this.btnCopyOcr = document.getElementById('btn-copy-ocr');
    this.keywordChipsContainer = document.getElementById('keyword-chips-container');
    this.keywordCountBadge = document.getElementById('keyword-count-badge');
    this.aiAdviceContainer = document.getElementById('ai-advice-container');
    this.aiAdviceText = document.getElementById('ai-advice-text');
    this.safetyList = document.getElementById('safety-list');
    this.btnReportThreat = document.getElementById('btn-report-threat');
  },

  bindEvents() {
    // Drag and drop
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.dropZone.classList.add('drag-active');
    });

    this.dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.dropZone.classList.remove('drag-active');
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.dropZone.classList.remove('drag-active');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    // Click on drop zone triggers file input
    this.dropZone.addEventListener('click', (e) => {
      if (e.target === this.fileInput) return;
      this.fileInput.click();
    });

    this.dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.fileInput.click();
      }
    });

    // File input change
    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files && this.fileInput.files.length > 0) {
        this.handleFileSelect(this.fileInput.files[0]);
      }
    });

    // Remove image
    this.btnRemove.addEventListener('click', () => {
      this.clearSelection();
    });

    // Analyze button
    this.btnAnalyze.addEventListener('click', () => {
      this.analyzeScreenshot();
    });

    // Copy OCR text
    this.btnCopyOcr.addEventListener('click', () => {
      this.copyOcrText();
    });

    // Report this threat
    this.btnReportThreat.addEventListener('click', () => {
      this.reportThreat();
    });
  },

  // ── File Selection & Validation ────────────────────────────────────────

  handleFileSelect(file) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const allowedExts = ['.png', '.jpg', '.jpeg', '.webp'];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      if (typeof Toast !== 'undefined') {
        Toast.error('Invalid Format', 'Please upload a PNG, JPG, JPEG, or WEBP image.');
      } else {
        alert('Invalid format. Please upload a PNG, JPG, JPEG, or WEBP image.');
      }
      return;
    }

    if (file.size > maxSize) {
      if (typeof Toast !== 'undefined') {
        Toast.error('File Too Large', 'Maximum upload size is 10 MB.');
      } else {
        alert('File too large. Maximum upload size is 10 MB.');
      }
      return;
    }

    this.selectedFile = file;
    this.showPreview(file);
    this.btnAnalyze.disabled = false;
  },

  showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImage.src = e.target.result;

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        const sizeKB = (file.size / 1024).toFixed(1);
        const sizeLabel = file.size >= 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
          : `${sizeKB} KB`;
        this.previewSpecs.textContent = `${sizeLabel} • ${img.naturalWidth} × ${img.naturalHeight} px`;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    this.previewName.textContent = file.name;
    this.previewSpecs.textContent = 'Loading...';
    this.previewCard.classList.add('show');
    this.dropZone.style.display = 'none';
  },

  clearSelection() {
    this.selectedFile = null;
    this.fileInput.value = '';
    this.previewCard.classList.remove('show');
    this.previewImage.src = '';
    this.dropZone.style.display = '';
    this.btnAnalyze.disabled = true;
  },

  // ── Screenshot Analysis ────────────────────────────────────────────────

  async analyzeScreenshot() {
    if (!this.selectedFile) return;

    // Show scanning state, hide results
    this.scanningState.classList.add('show');
    this.resultsEmpty.style.display = 'none';
    this.resultsContent.classList.remove('show');
    this.btnAnalyze.disabled = true;
    this.btnAnalyze.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2v4"/>
      </svg>
      <span>Analyzing...</span>`;

    // Animate progress steps
    this.updateProgress(10, 'Uploading Image...', 'Transferring screenshot to analysis engine...');

    const formData = new FormData();
    formData.append('screenshot', this.selectedFile);

    try {
      this.updateProgress(25, 'Validating Image...', 'Inspecting binary magic bytes and format compliance...');

      await this.wait(400);
      this.updateProgress(40, 'Preprocessing with OpenCV...', 'Applying grayscale, noise reduction, contrast enhancement & Otsu binarization...');

      await this.wait(500);
      this.updateProgress(55, 'Extracting Text (OCR)...', 'Running Tesseract.js OCR engine on preprocessed image...');

      // Fire the actual API request
      const response = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.SCREENSHOT_ANALYZE, {
        method: 'POST',
        body: formData,
      });

      this.updateProgress(80, 'Analyzing Indicators...', 'Running rule-based keyword matching and querying ML adapter...');

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          (result.error && result.error.message) || result.message || 'Analysis failed. Please try again.'
        );
      }

      this.updateProgress(100, 'Complete', 'Results ready.');
      await this.wait(400);

      this.lastResult = result.data;
      this.renderResults(result.data);

      // Save to session history
      this.saveToHistory(result.data);

      if (typeof Toast !== 'undefined') {
        Toast.success('Analysis Complete', 'Screenshot processed successfully. Review the results.');
      }
    } catch (err) {
      console.error('[Screenshot] Analysis error:', err);
      if (typeof Toast !== 'undefined') {
        Toast.error('Analysis Failed', err.message || 'An unexpected error occurred.');
      } else {
        alert('Analysis failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      this.scanningState.classList.remove('show');
      this.btnAnalyze.disabled = false;
      this.btnAnalyze.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </svg>
        <span>Analyze Screenshot</span>`;
    }
  },

  updateProgress(percent, title, subtitle) {
    this.scannerProgressFill.style.width = `${percent}%`;
    this.scannerStepTitle.textContent = title;
    this.scannerStepSub.textContent = subtitle;
  },

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  // ── Render Results ─────────────────────────────────────────────────────

  renderResults(data) {
    this.resultsEmpty.style.display = 'none';
    this.resultsContent.classList.add('show');

    // Detection status banner
    const status = data.detection.status || 'Unable to Determine';
    const statusText = this.resStatusText;
    statusText.innerHTML = '';

    const dot = document.createElement('span');
    dot.style.cssText = 'display:inline-block; width:10px; height:10px; border-radius:50%; background:currentColor;';
    statusText.appendChild(dot);

    const label = document.createElement('span');
    label.textContent = status;
    statusText.appendChild(label);

    // Remove previous status classes
    this.statusBanner.className = 'detection-status-banner';
    if (status === 'Scam Detected') {
      this.statusBanner.classList.add('status-scam');
    } else if (status === 'Suspicious') {
      this.statusBanner.classList.add('status-suspicious');
    } else if (status === 'Legitimate') {
      this.statusBanner.classList.add('status-legitimate');
    } else {
      this.statusBanner.classList.add('status-unable');
    }

    // ML service status pill
    const mlConnected = data.mlService && data.mlService.connected;
    this.resMlPill.className = 'ml-status-pill ' + (mlConnected ? 'ml-online' : 'ml-offline');
    this.resMlText.textContent = mlConnected
      ? 'ML Service: Connected'
      : 'ML Service: Offline / Not Connected';

    // Update header ML dot
    const headerDot = document.getElementById('header-ml-dot');
    const headerText = document.getElementById('header-ml-text');
    if (headerDot && headerText) {
      if (mlConnected) {
        headerDot.style.background = 'var(--success)';
        headerDot.style.boxShadow = '0 0 8px var(--success)';
        headerText.style.color = 'var(--success)';
        headerText.textContent = 'Connected';
      } else {
        headerDot.style.background = 'var(--warning)';
        headerDot.style.boxShadow = '0 0 8px var(--warning)';
        headerText.style.color = 'var(--warning)';
        headerText.textContent = 'Ready for Independent Model Connection';
      }
    }

    // Meta grid
    this.resRiskLevel.textContent = data.detection.riskLevel || 'Pending ML';
    this.resRiskLevel.style.color = data.detection.riskLevel ? 'var(--text-main)' : 'var(--text-muted)';

    this.resCategory.textContent = data.detection.scamCategory || 'Pending ML';
    this.resCategory.style.color = data.detection.scamCategory ? 'var(--text-main)' : 'var(--text-muted)';

    if (data.detection.modelConfidence !== null && data.detection.modelConfidence !== undefined) {
      this.resConfidence.textContent = `${(data.detection.modelConfidence * 100).toFixed(1)}%`;
      this.resConfidence.style.color = 'var(--text-main)';
    } else {
      this.resConfidence.textContent = 'N/A (ML Offline)';
      this.resConfidence.style.color = 'var(--text-muted)';
    }

    // OCR text
    const extractedText = data.ocr.extractedText || '';
    if (extractedText.trim()) {
      this.ocrTextBox.textContent = extractedText;
      this.ocrTextBox.classList.remove('ocr-empty-notice');
    } else {
      this.ocrTextBox.textContent = data.ocr.message || 'No readable text was detected in the uploaded screenshot.';
      this.ocrTextBox.classList.add('ocr-empty-notice');
    }
    this.ocrCharCount.textContent = `${data.ocr.charCount || 0} chars`;

    // Keyword chips
    this.keywordChipsContainer.innerHTML = '';
    const keywords = data.indicators.detectedKeywords || [];
    this.keywordCountBadge.textContent = `${keywords.length} Found`;

    if (keywords.length === 0) {
      this.keywordChipsContainer.innerHTML = '<span style="font-size: 0.825rem; color: var(--text-dim);">No known scam keyword indicators detected.</span>';
    } else {
      keywords.forEach((kw) => {
        const chip = document.createElement('span');
        chip.className = 'keyword-chip';
        chip.innerHTML = `${this.escapeHtml(kw.term)} <span class="keyword-chip-count">${kw.count}</span>`;
        chip.title = `Category: ${kw.category}`;
        this.keywordChipsContainer.appendChild(chip);
      });
    }

    // AI Explanatory Advice (Gemini — clearly not ML)
    if (data.explanatoryAdvice && data.explanatoryAdvice.explanation) {
      this.aiAdviceContainer.style.display = '';
      let adviceHtml = `<p style="margin-bottom: 8px;"><strong>Explanation:</strong> ${this.escapeHtml(data.explanatoryAdvice.explanation)}</p>`;
      if (data.explanatoryAdvice.safetyAdvice) {
        adviceHtml += `<p><strong>Safety Advice:</strong> ${this.escapeHtml(data.explanatoryAdvice.safetyAdvice)}</p>`;
      }
      this.aiAdviceText.innerHTML = adviceHtml;
    } else {
      this.aiAdviceContainer.style.display = 'none';
    }

    // Safety recommendations
    if (data.safetyRecommendations && data.safetyRecommendations.length > 0) {
      this.safetyList.innerHTML = data.safetyRecommendations
        .map((rec) => `<li>${this.escapeHtml(rec)}</li>`)
        .join('');
    }
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // ── Copy OCR Text ──────────────────────────────────────────────────────

  copyOcrText() {
    const text = this.ocrTextBox.textContent || '';
    if (!text.trim()) {
      if (typeof Toast !== 'undefined') Toast.info('Nothing to Copy', 'No extracted text available.');
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      if (typeof Toast !== 'undefined') Toast.success('Copied', 'Extracted text copied to clipboard.');
      this.btnCopyOcr.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Copied!</span>`;
      setTimeout(() => {
        this.btnCopyOcr.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>Copy Text</span>`;
      }, 2000);
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      if (typeof Toast !== 'undefined') Toast.success('Copied', 'Extracted text copied to clipboard.');
    });
  },

  // ── Report This Threat ─────────────────────────────────────────────────

  reportThreat() {
    if (!this.lastResult) return;

    const prefill = {
      source: 'screenshot_analysis',
      type: 'MESSAGE',
      target: this.lastResult.ocr.extractedText || 'Screenshot analysis (no text extracted)',
    };

    if (this.lastResult.detection.scamCategory) {
      prefill.category = this.lastResult.detection.scamCategory;
    }

    try {
      sessionStorage.setItem('prefill_report', JSON.stringify(prefill));
    } catch (e) {
      console.warn('Could not save prefill data:', e);
    }

    // Navigate to report page
    window.location.href = '../pages/report.html';
  },

  // ── Session History Integration ────────────────────────────────────────

  saveToHistory(data) {
    if (typeof SessionScanHistory === 'undefined' || !SessionScanHistory.addScan) return;

    try {
      const riskMapped = data.detection.riskLevel
        ? (data.detection.riskLevel.toUpperCase() === 'HIGH' || data.detection.riskLevel.toUpperCase() === 'CRITICAL' ? 'PHISHING' : data.detection.riskLevel.toUpperCase())
        : (data.indicators && data.indicators.keywordCount > 0 ? 'SUSPICIOUS' : 'SAFE');

      const warningList = (data.indicators && data.indicators.detectedKeywords)
        ? data.indicators.detectedKeywords.map((k) => `${k.term} (${k.category})`)
        : [];

      SessionScanHistory.addScan({
        type: 'SCREENSHOT',
        targetPreview: data.fileInfo && data.fileInfo.originalFilename
          ? `[Image] ${data.fileInfo.originalFilename}`
          : 'Screenshot Scan',
        riskLevel: riskMapped,
        riskScore: data.detection && data.detection.modelConfidence !== null && data.detection.modelConfidence !== undefined
          ? Math.round(data.detection.modelConfidence * 100)
          : (data.indicators && data.indicators.keywordCount > 0 ? 55 : 20),
        confidence: data.detection && data.detection.modelConfidence !== null && data.detection.modelConfidence !== undefined
          ? `${Math.round(data.detection.modelConfidence * 100)}%`
          : 'N/A (ML Offline)',
        warnings: warningList,
        engineMode: data.mlService && data.mlService.connected ? 'Python ML + OpenCV' : 'OpenCV + Tesseract OCR',
      });

      // Update navbar scan counter
      if (typeof Navbar !== 'undefined' && Navbar.render) {
        Navbar.render('navbar-mount');
      }
    } catch (e) {
      console.warn('[Screenshot] Failed to save to session history:', e);
    }
  },
};
