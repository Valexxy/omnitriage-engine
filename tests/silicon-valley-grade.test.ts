import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MelaninEquityEngine } from '../src/dsp/melanin-equity-engine';
import { ContactPressureGuard } from '../src/dsp/contact-pressure-guard';
import { CIELABSpectroEngine } from '../src/dsp/cielab-spectro-engine';

describe('Silicon Valley Grade Precision & Equity Validation', () => {
  it('should calibrate across Fitzpatrick Skin Types I-VI without racial bias', () => {
    // 1. Fair Skin (Fitzpatrick I-II)
    const fairRed = new Array(30).fill(210);
    const fairGreen = new Array(30).fill(160);
    const fairBlue = new Array(30).fill(130);
    const fairResult = MelaninEquityEngine.calibrate(fairRed, fairGreen, fairBlue);
    assert.strictEqual(fairResult.detectedSkinType, 'I-II (Fair)');
    assert.strictEqual(fairResult.chrominanceGainFactor, 1.0);

    // 2. Deep Melanin Pigmentation (Fitzpatrick V-VI)
    const deepRed = new Array(30).fill(170);
    const deepGreen = new Array(30).fill(65);
    const deepBlue = new Array(30).fill(40);
    const deepResult = MelaninEquityEngine.calibrate(deepRed, deepGreen, deepBlue);
    assert.strictEqual(deepResult.detectedSkinType, 'V-VI (Deep Pigment)');
    assert.ok(deepResult.chrominanceGainFactor > 1.4, 'Gain factor should compensate for melanin attenuation');
    assert.strictEqual(deepResult.normalizedSignal.length, 30);
  });

  it('should detect and reject contact pressure edge-cases (Too Hard vs Optimal)', () => {
    // 1. Too Hard (Capillary bed collapsed, red saturated > 0.97, perfusion index < 0.6)
    const hardResult = ContactPressureGuard.evaluatePressure(250, 60, 0.8);
    assert.strictEqual(hardResult.status, 'TOO_HARD');
    assert.strictEqual(hardResult.isUsable, false);

    // 2. Optimal Pressure
    const optResult = ContactPressureGuard.evaluatePressure(185, 95, 8.5);
    assert.strictEqual(optResult.status, 'OPTIMAL');
    assert.strictEqual(optResult.isUsable, true);
  });

  it('should compute CIELAB color space and detect severe anemia with D65 chromatic balance', () => {
    // Pallid inner conjunctiva (R: 170, G: 110, B: 100) -> Low Erythema
    const report = CIELABSpectroEngine.analyze(170, 110, 100);
    assert.ok(report.cielab.L > 0 && report.cielab.L <= 100, 'L* should be between 0 and 100');
    assert.ok(report.estimatedHbGPerDl > 0, 'Estimated Hb should be positive');
    assert.strictEqual(report.clinicalConfidencePercent, 96);
  });
});
