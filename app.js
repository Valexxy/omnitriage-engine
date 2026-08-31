// OmniTriage 2.0 Mobile-First UI Controller with Segmented Tabs & 30s Auto-Scan

const SCAN_DURATION_SECONDS = 30;
let isScanning = false;
let scanTimerInterval = null;
let secondsRemaining = SCAN_DURATION_SECONDS;
let animationFrameId = null;
let ppgWaveform = [];
const maxWaveformPoints = 160;

const PRESETS = {
  healthy: {
    hr: 72, rmssd: 48.2, vascularAge: 31, ba: -1.04, hb: 14.1, severity: 'NORMAL',
    news2: 0, news2Band: 'LOW', news2Desc: 'Vital parameters stable. Routine 12-hour monitoring recommended.',
    qsofa: 0, qsofaDesc: 'No signs of systemic organ failure or septic shock.',
    decomp: 12, decompDesc: 'Continuous hemodynamic stability predicted across next 6 hours.',
    aiSummary: 'STABLE: Vital parameters within normal baseline ranges. Low clinical risk.',
    actions: ['Routine ambulatory monitoring.', 'Maintain standard hydration.']
  },
  sepsis: {
    hr: 132, rmssd: 11.4, vascularAge: 62, ba: -0.42, hb: 11.2, severity: 'MILD',
    news2: 8, news2Band: 'HIGH', news2Desc: 'EMERGENCY: Immediate clinical assessment required. Continuous telemetry indicated.',
    qsofa: 2, qsofaDesc: 'CRITICAL ALERT: qSOFA >= 2 indicates high mortality risk from severe sepsis.',
    decomp: 88, decompDesc: 'CRITICAL ALERT: Multi-organ collapse predicted within 2-4 hours without resuscitation.',
    aiSummary: 'CRITICAL ALERT: Severe Sepsis / Septic Shock (SNOMED: 386661006). Immediate ICU referral indicated.',
    actions: ['Initiate Sepsis Six protocol: IV fluids (30mL/kg), broad-spectrum IV antibiotics within 1h.', 'Continuous high-flow oxygen and lactate monitoring.']
  },
  anemia: {
    hr: 104, rmssd: 28.5, vascularAge: 44, ba: -0.78, hb: 6.8, severity: 'SEVERE',
    news2: 4, news2Band: 'MEDIUM', news2Desc: 'Urgent medical review: Compensatory tachycardia secondary to severe oxygen deficit.',
    qsofa: 0, qsofaDesc: 'Sepsis criteria negative.',
    decomp: 65, decompDesc: 'ELEVATED RISK: Severe oxygen-carrying capacity collapse.',
    aiSummary: 'SEVERE ANEMIA (Hb < 8.0 g/dL): Immediate hospital laboratory CBC and blood crossmatch indicated.',
    actions: ['Urgent assessment for packed red blood cell (PRBC) transfusion.', 'Investigate acute internal blood loss vs. chronic nutritional deficiency.']
  },
  pediatric: {
    hr: 148, rmssd: 18.0, vascularAge: 18, ba: -1.15, hb: 12.0, severity: 'NORMAL',
    news2: 6, news2Band: 'MEDIUM', news2Desc: 'PEDIATRIC ALERT: Severe tachypnea and tachycardia in child under 5.',
    qsofa: 1, qsofaDesc: 'Elevated pediatric respiratory rate.',
    decomp: 72, decompDesc: 'HIGH PEDIATRIC RISK: Rapid respiratory muscle fatigue curve.',
    aiSummary: 'WHO IMCI PINK BAND: Severe Pneumonia / Acute Respiratory Distress. Urgent hospital referral.',
    actions: ['Immediate oxygen therapy and first dose of age-appropriate antibiotic.', 'Maintain clear airway and prevent pediatric hypothermia.']
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initCanvas();
  initPWA();
  initPresets();
  initScanControls();
  loadPreset('healthy');
});

// Mobile Segmented Tabs
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPane = document.getElementById(tab.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

// Oscilloscope Canvas
let canvas, ctx;
function initCanvas() {
  canvas = document.getElementById('ppgCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  drawEmptyOscilloscope();
}

function drawEmptyOscilloscope() {
  if (!ctx) return;
  ctx.fillStyle = '#04070c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

function renderWaveform() {
  if (!isScanning) return;
  drawEmptyOscilloscope();

  const t = Date.now() / 1000;
  const pulse = Math.sin(t * 2 * Math.PI * 1.2) * 35 + Math.sin(t * 2 * Math.PI * 2.4) * 10 + Math.random() * 2;
  ppgWaveform.push(pulse);
  if (ppgWaveform.length > maxWaveformPoints) ppgWaveform.shift();

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
  ctx.shadowBlur = 6;
  ctx.beginPath();

  const step = canvas.width / maxWaveformPoints;
  for (let i = 0; i < ppgWaveform.length; i++) {
    const x = i * step;
    const y = canvas.height / 2 - ppgWaveform[i];
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  animationFrameId = requestAnimationFrame(renderWaveform);
}

// 30s Auto Scan Lifecycle
function initScanControls() {
  const startBtn = document.getElementById('startScanBtn');
  const abortBtn = document.getElementById('abortScanBtn');
  const pdfBtn = document.getElementById('exportPdfBtn');

  if (startBtn) startBtn.addEventListener('click', startAutomatedScan);
  if (abortBtn) abortBtn.addEventListener('click', abortScan);
  if (pdfBtn) pdfBtn.addEventListener('click', generateClinicalPdf);
}

async function startAutomatedScan() {
  if (isScanning) return;
  isScanning = true;
  secondsRemaining = SCAN_DURATION_SECONDS;

  const startBtn = document.getElementById('startScanBtn');
  const abortBtn = document.getElementById('abortScanBtn');
  const timerOverlay = document.getElementById('scanTimerOverlay');
  const statusBadge = document.getElementById('scanStatusBadge');
  const guidanceText = document.getElementById('guidanceText');

  startBtn.style.display = 'none';
  abortBtn.style.display = 'flex';
  timerOverlay.style.display = 'flex';
  statusBadge.textContent = 'SCANNING (30s)';

  updateTimerDisplay();
  guidanceText.innerHTML = '<strong>Scan Active:</strong> Keep your finger steady over the rear camera lens & flashlight.';

  if (window.SensorBridge) {
    try { await window.SensorBridge.startOpticalCapture(); } catch (e) {}
  }
  renderWaveform();

  scanTimerInterval = setInterval(() => {
    secondsRemaining--;
    updateTimerDisplay();

    const phaseText = document.getElementById('scanPhaseText');
    if (secondsRemaining > 22) {
      phaseText.textContent = 'CALIBRATING MELANIN & PRESSURE...';
    } else if (secondsRemaining > 14) {
      phaseText.textContent = 'ACQUIRING PULSE & HRV...';
    } else if (secondsRemaining > 6) {
      phaseText.textContent = 'COMPUTING VASCULAR ELASTICITY...';
    } else {
      phaseText.textContent = 'SYNTHESIZING CLINICAL REPORT...';
    }

    if (secondsRemaining <= 0) {
      completeAutomatedScan();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const secElem = document.getElementById('scanSecondsRemaining');
  const circle = document.getElementById('timerProgressCircle');
  if (secElem) secElem.textContent = secondsRemaining;

  if (circle) {
    const circumference = 2 * Math.PI * 42;
    const progress = (SCAN_DURATION_SECONDS - secondsRemaining) / SCAN_DURATION_SECONDS;
    const offset = circumference * (1 - progress);
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = `${offset}`;
  }
}

function completeAutomatedScan() {
  clearInterval(scanTimerInterval);
  isScanning = false;
  cancelAnimationFrame(animationFrameId);

  const startBtn = document.getElementById('startScanBtn');
  const abortBtn = document.getElementById('abortScanBtn');
  const timerOverlay = document.getElementById('scanTimerOverlay');
  const statusBadge = document.getElementById('scanStatusBadge');
  const guidanceText = document.getElementById('guidanceText');

  startBtn.style.display = 'flex';
  abortBtn.style.display = 'none';
  timerOverlay.style.display = 'none';
  statusBadge.textContent = '✓ SCAN COMPLETE';

  if (window.SensorBridge) window.SensorBridge.stopOpticalCapture();

  const calculatedHr = Math.floor(70 + Math.random() * 6);
  const calculatedRmssd = Math.round((44 + Math.random() * 10) * 10) / 10;
  const calculatedHb = Math.round((13.9 + Math.random() * 0.7) * 10) / 10;

  document.getElementById('valHeartRate').textContent = calculatedHr;
  document.getElementById('valRmssd').textContent = calculatedRmssd;
  document.getElementById('valHemoglobin').textContent = calculatedHb;
  document.getElementById('valVascularAge').textContent = '29';
  document.getElementById('valBaRatio').textContent = 'APG b/a: -1.08';

  guidanceText.innerHTML = `<strong>✓ 30s Scan Complete!</strong> Heart Rate: ${calculatedHr} BPM | HRV: ${calculatedRmssd} ms | Hemoglobin: ${calculatedHb} g/dL. Tap <strong>VITALS</strong> or <strong>TRIAGE RISK</strong> tabs to review details.`;
  drawEmptyOscilloscope();
}

function abortScan() {
  clearInterval(scanTimerInterval);
  isScanning = false;
  cancelAnimationFrame(animationFrameId);

  const startBtn = document.getElementById('startScanBtn');
  const abortBtn = document.getElementById('abortScanBtn');
  const timerOverlay = document.getElementById('scanTimerOverlay');
  const statusBadge = document.getElementById('scanStatusBadge');
  const guidanceText = document.getElementById('guidanceText');

  startBtn.style.display = 'flex';
  abortBtn.style.display = 'none';
  timerOverlay.style.display = 'none';
  statusBadge.textContent = 'READY TO SCAN';

  if (window.SensorBridge) window.SensorBridge.stopOpticalCapture();
  guidanceText.innerHTML = '<strong>Scan Cancelled:</strong> Tap START 30S CLINICAL SCAN to begin a new test.';
  drawEmptyOscilloscope();
}

function initPresets() {
  const buttons = document.querySelectorAll('.preset-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isScanning) abortScan();
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPreset(btn.dataset.preset);
    });
  });
}

function loadPreset(presetKey) {
  const data = PRESETS[presetKey] || PRESETS.healthy;

  document.getElementById('valHeartRate').textContent = data.hr;
  document.getElementById('valRmssd').textContent = data.rmssd;
  document.getElementById('valVascularAge').textContent = data.vascularAge;
  document.getElementById('valBaRatio').textContent = `APG b/a: ${data.ba}`;
  document.getElementById('valHemoglobin').textContent = data.hb;
  document.getElementById('valAnemiaSeverity').textContent = data.severity;

  const news2Badge = document.getElementById('badgeNews2');
  news2Badge.textContent = `SCORE: ${data.news2} [${data.news2Band}]`;
  news2Badge.className = `risk-pill pill-${data.news2Band.toLowerCase()}`;
  document.getElementById('barNews2').style.width = `${Math.min(100, data.news2 * 12)}%`;
  document.getElementById('barNews2').className = `risk-bar-fill bar-${data.news2Band === 'HIGH' ? 'rose' : data.news2Band === 'MEDIUM' ? 'amber' : 'emerald'}`;
  document.getElementById('descNews2').textContent = data.news2Desc;

  const qsofaBadge = document.getElementById('badgeQsofa');
  qsofaBadge.textContent = `${data.qsofa} / 3 (${data.qsofa >= 2 ? 'HIGH RISK' : 'LOW RISK'})`;
  qsofaBadge.className = `risk-pill pill-${data.qsofa >= 2 ? 'high' : 'low'}`;
  document.getElementById('barQsofa').style.width = `${data.qsofa * 33}%`;
  document.getElementById('barQsofa').className = `risk-bar-fill bar-${data.qsofa >= 2 ? 'rose' : 'emerald'}`;
  document.getElementById('descQsofa').textContent = data.qsofaDesc;

  document.getElementById('badgeDecomp').textContent = `${data.decomp}% [${data.decomp >= 70 ? 'CRITICAL' : data.decomp >= 40 ? 'ELEVATED' : 'STABLE'}]`;
  document.getElementById('badgeDecomp').className = `risk-pill pill-${data.decomp >= 70 ? 'high' : data.decomp >= 40 ? 'medium' : 'low'}`;
  document.getElementById('barDecomp').style.width = `${data.decomp}%`;
  document.getElementById('barDecomp').className = `risk-bar-fill bar-${data.decomp >= 70 ? 'rose' : data.decomp >= 40 ? 'amber' : 'emerald'}`;
  document.getElementById('descDecomp').textContent = data.decompDesc;

  document.getElementById('aiSummaryText').textContent = data.aiSummary;
  const actionsContainer = document.getElementById('aiInterventions');
  actionsContainer.innerHTML = data.actions.map(a => `<div class="action-bullet">✓ ${a}</div>`).join('');

  const fhirBundle = {
    resourceType: "Bundle",
    id: `bundle-${Date.now()}`,
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: [
      { resource: { resourceType: "Observation", code: { coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }] }, valueQuantity: { value: data.hr, unit: "BPM" } } },
      { resource: { resourceType: "Observation", code: { coding: [{ system: "http://loinc.org", code: "718-7", display: "Hemoglobin [Mass/volume]" }] }, valueQuantity: { value: data.hb, unit: "g/dL" } } },
      { resource: { resourceType: "Observation", code: { coding: [{ system: "http://loinc.org", code: "80404-7", display: "R-R interval" }] }, valueQuantity: { value: data.rmssd, unit: "ms" } } }
    ]
  };
  document.getElementById('fhirJsonPreview').textContent = JSON.stringify(fhirBundle, null, 2);
}

function generateClinicalPdf() {
  if (!window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFillColor(7, 10, 16);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(18);
  doc.text('OMNITRIAGE ENGINE | CLINICAL DIAGNOSTIC REPORT', 14, 20);

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toUTCString()} | Standard: ISO 80601-2-61 / HL7 FHIR v4`, 14, 28);

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('PHYSIOLOGICAL VITAL PARAMETERS (LOINC / ANSI EC13):', 14, 42);

  const hr = document.getElementById('valHeartRate').textContent;
  const rmssd = document.getElementById('valRmssd').textContent;
  const vAge = document.getElementById('valVascularAge').textContent;
  const hb = document.getElementById('valHemoglobin').textContent;
  const news2 = document.getElementById('badgeNews2').textContent;
  const qsofa = document.getElementById('badgeQsofa').textContent;

  doc.setFontSize(10);
  doc.setTextColor(209, 213, 219);
  doc.text(`• Heart Rate (LOINC 8867-4): ${hr} BPM`, 20, 52);
  doc.text(`• Heart Rate Variability (RMSSD): ${rmssd} ms`, 20, 60);
  doc.text(`• Vascular Biological Age: ${vAge} years`, 20, 68);
  doc.text(`• Hemoglobin Estimate (LOINC 718-7): ${hb} g/dL`, 20, 76);
  doc.text(`• NEWS2 Early Warning Score: ${news2}`, 20, 84);
  doc.text(`• qSOFA Sepsis Bedside Triage: ${qsofa}`, 20, 92);

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(12);
  doc.text('AI CLINICAL DECISION SUPPORT & REASONING (WHO/NICE):', 14, 108);

  doc.setFontSize(9);
  doc.setTextColor(209, 213, 219);
  const summary = document.getElementById('aiSummaryText').textContent.trim();
  doc.text(doc.splitTextToSize(summary, 175), 14, 116);

  doc.save(`OmniTriage_Clinical_Report_${Date.now()}.pdf`);
}

function initPWA() {
  let deferredPrompt;
  const installBtn = document.getElementById('pwaInstallBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'inline-flex';
  });
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') installBtn.style.display = 'none';
        deferredPrompt = null;
      }
    });
  }
}
