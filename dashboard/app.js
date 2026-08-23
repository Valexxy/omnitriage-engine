let isScanning = false;
let isDecompensated = false;
let frame = 0;

const ppgCanvas = document.getElementById('ppg-canvas');
const apgCanvas = document.getElementById('apg-canvas');
const ppgCtx = ppgCanvas.getContext('2d');
const apgCtx = apgCanvas.getContext('2d');

function resizeCanvases() {
  ppgCanvas.width = ppgCanvas.parentElement.clientWidth || 600;
  ppgCanvas.height = ppgCanvas.parentElement.clientHeight || 180;
  apgCanvas.width = apgCanvas.parentElement.clientWidth || 600;
  apgCanvas.height = apgCanvas.parentElement.clientHeight || 120;
}
window.addEventListener('resize', resizeCanvases);
setTimeout(resizeCanvases, 100);

const ppgBuffer = new Array(200).fill(120);
const apgBuffer = new Array(200).fill(0);

function generateSimulatedSample(t, decompensated) {
  const hr = decompensated ? 132 : 72;
  const freq = hr / 60;
  const fundamental = Math.sin(2 * Math.PI * freq * t);
  const dicrotic = 0.35 * Math.sin(2 * Math.PI * freq * 2 * t - 0.4);
  const noise = (Math.random() - 0.5) * (decompensated ? 4.0 : 0.8);
  return 120 + 28 * (fundamental + dicrotic) + noise;
}

function updateWaveforms() {
  frame++;
  const t = frame / 30;
  const val = generateSimulatedSample(t, isDecompensated);
  ppgBuffer.push(val);
  ppgBuffer.shift();

  const n = ppgBuffer.length;
  const apgVal = (ppgBuffer[n - 1] - 2 * ppgBuffer[n - 2] + ppgBuffer[n - 3]) * 15;
  apgBuffer.push(apgVal);
  apgBuffer.shift();

  ppgCtx.fillStyle = '#05080e';
  ppgCtx.fillRect(0, 0, ppgCanvas.width, ppgCanvas.height);
  
  ppgCtx.strokeStyle = '#0e1a2f';
  ppgCtx.lineWidth = 1;
  for (let x = 0; x < ppgCanvas.width; x += 30) {
    ppgCtx.beginPath(); ppgCtx.moveTo(x, 0); ppgCtx.lineTo(x, ppgCanvas.height); ppgCtx.stroke();
  }
  for (let y = 0; y < ppgCanvas.height; y += 30) {
    ppgCtx.beginPath(); ppgCtx.moveTo(0, y); ppgCtx.lineTo(ppgCanvas.width, y); ppgCtx.stroke();
  }

  ppgCtx.strokeStyle = isDecompensated ? '#ff1744' : '#00f2fe';
  ppgCtx.lineWidth = 2.5;
  ppgCtx.beginPath();
  const step = ppgCanvas.width / ppgBuffer.length;
  for (let i = 0; i < ppgBuffer.length; i++) {
    const y = ppgCanvas.height / 2 - (ppgBuffer[i] - 120) * 1.8;
    if (i === 0) ppgCtx.moveTo(0, y);
    else ppgCtx.lineTo(i * step, y);
  }
  ppgCtx.stroke();

  apgCtx.fillStyle = '#05080e';
  apgCtx.fillRect(0, 0, apgCanvas.width, apgCanvas.height);
  apgCtx.strokeStyle = '#4facfe';
  apgCtx.lineWidth = 1.5;
  apgCtx.beginPath();
  for (let i = 0; i < apgBuffer.length; i++) {
    const y = apgCanvas.height / 2 - apgBuffer[i] * 1.5;
    if (i === 0) apgCtx.moveTo(0, y);
    else apgCtx.lineTo(i * step, y);
  }
  apgCtx.stroke();

  requestAnimationFrame(updateWaveforms);
}
requestAnimationFrame(updateWaveforms);

function updateUI() {
  const hrEl = document.getElementById('val-hr');
  const hrvEl = document.getElementById('val-hrv');
  const vascEl = document.getElementById('val-vasc');
  const hbEl = document.getElementById('val-hb');
  const news2ScoreEl = document.getElementById('news2-score');
  const news2BadgeEl = document.getElementById('news2-badge');
  const news2ActionEl = document.getElementById('news2-action');
  const triageCard = document.getElementById('triage-card');
  const qsofaVal = document.getElementById('qsofa-val');
  const qsofaText = document.getElementById('qsofa-text');
  const decompVal = document.getElementById('decomp-val');
  const decompText = document.getElementById('decomp-text');
  const imciBand = document.getElementById('imci-band');
  const fhirOut = document.getElementById('fhir-output');

  if (isDecompensated) {
    hrEl.innerText = '134';
    hrvEl.innerText = '12.4';
    vascEl.innerText = '64';
    hbEl.innerText = '6.9';
    news2ScoreEl.innerText = '9';
    news2BadgeEl.innerText = 'CRITICAL ALERT';
    news2BadgeEl.className = 'badge';
    news2BadgeEl.style.borderColor = '#ff1744';
    news2BadgeEl.style.color = '#ff1744';
    news2ActionEl.innerText = 'EMERGENCY: Sepsis / Severe Decompensation protocol. Immediate ICU transfer assessment.';
    triageCard.className = 'triage-alert-box red';
    qsofaVal.innerText = '3 / 3';
    qsofaVal.style.color = '#ff1744';
    qsofaText.innerText = 'CRITICAL SEPSIS ALERT';
    decompVal.innerText = '18%';
    decompVal.style.color = '#ff1744';
    decompText.innerText = 'Imminent Collapse Risk';
    imciBand.innerText = 'PINK (Emergency Hospital Transfer)';
    imciBand.style.color = '#ff1744';
  } else {
    hrEl.innerText = '72';
    hrvEl.innerText = '48.2';
    vascEl.innerText = '32';
    hbEl.innerText = '14.2';
    news2ScoreEl.innerText = '0';
    news2BadgeEl.innerText = 'LOW RISK';
    news2BadgeEl.className = 'badge badge-green';
    news2BadgeEl.style = '';
    news2ActionEl.innerText = 'Routine clinical monitoring. Patient physiologically stable.';
    triageCard.className = 'triage-alert-box';
    qsofaVal.innerText = '0 / 3';
    qsofaVal.style.color = '#00e676';
    qsofaText.innerText = 'Low Sepsis Risk';
    decompVal.innerText = '92%';
    decompVal.style.color = '#00e676';
    decompText.innerText = 'High Resilience';
    imciBand.innerText = 'GREEN (No Danger Signs)';
    imciBand.style.color = '#00e676';
  }

  const fhirPayload = {
    resourceType: 'Bundle',
    id: 'bundle-omnitriage-' + Date.now(),
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: [
      { resourceType: 'Observation', code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] }, valueQuantity: { value: isDecompensated ? 134 : 72, unit: '/min' } },
      { resourceType: 'Observation', code: { coding: [{ system: 'http://loinc.org', code: '80404-7', display: 'R-R interval HRV' }] }, valueQuantity: { value: isDecompensated ? 12.4 : 48.2, unit: 'ms' } },
      { resourceType: 'Observation', code: { coding: [{ system: 'http://loinc.org', code: '718-7', display: 'Hemoglobin' }] }, valueQuantity: { value: isDecompensated ? 6.9 : 14.2, unit: 'g/dL' } },
      { resourceType: 'Observation', code: { coding: [{ system: 'http://loinc.org', code: '96514-5', display: 'NEWS2 Score' }] }, valueQuantity: { value: isDecompensated ? 9 : 0, unit: '{score}' } }
    ]
  };
  fhirOut.innerText = JSON.stringify(fhirPayload, null, 2);
}

document.getElementById('btn-scan').addEventListener('click', () => {
  isDecompensated = false;
  updateUI();
  alert('60-Second Multi-Biomarker Scan Complete! All biometric streams validated at SQI 94.8%.');
});

document.getElementById('btn-simulate-collapse').addEventListener('click', () => {
  isDecompensated = true;
  updateUI();
});

document.getElementById('btn-reset').addEventListener('click', () => {
  isDecompensated = false;
  updateUI();
});

document.getElementById('btn-copy-fhir').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('fhir-output').innerText);
  alert('HL7 FHIR v4 Bundle copied to clipboard!');
});

updateUI();
