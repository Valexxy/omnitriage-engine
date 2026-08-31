import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BiometricLivenessGuard } from '../src/dsp/biometric-liveness-guard';

describe('Intelligent Biometric Liveness & Placement Error Detection', () => {
  it('should detect when no finger is covering the camera', () => {
    const res = BiometricLivenessGuard.evaluateFrame(20, 25, 20, [], []);
    assert.strictEqual(res.isValidTissue, false);
    assert.strictEqual(res.status, 'NO_FINGER_DETECTED');
    assert.strictEqual(res.uiColor, 'rose');
  });

  it('should detect non-biological spoof or white surface (paper/desk/clothing)', () => {
    const res = BiometricLivenessGuard.evaluateFrame(210, 215, 205, [210, 212, 215], [210, 211, 212]);
    assert.strictEqual(res.isValidTissue, false);
    assert.strictEqual(res.status, 'WRONG_OBJECT_OR_SPOOF');
    assert.ok(res.userGuidance.includes('Non-biological object detected'));
  });

  it('should detect when finger is placed but LED flashlight is missed (dark/murky)', () => {
    const res = BiometricLivenessGuard.evaluateFrame(60, 20, 15, [20, 22, 20], [60, 62, 60]);
    assert.strictEqual(res.isValidTissue, false);
    assert.strictEqual(res.status, 'MISSING_FLASHLIGHT');
    assert.ok(res.userGuidance.includes('Flashlight blocked'));
  });

  it('should detect excessive motion tremor during scanning', () => {
    const erraticGreen = [80, 120, 60, 140, 70, 130, 65, 125, 75, 135];
    const res = BiometricLivenessGuard.evaluateFrame(190, 80, 40, erraticGreen, [190, 192, 188]);
    assert.strictEqual(res.isValidTissue, false);
    assert.strictEqual(res.status, 'EXCESSIVE_MOTION_TREMOR');
    assert.ok(res.userGuidance.includes('Motion detected'));
  });

  it('should verify authentic human capillary pulsatility on optimal finger placement', () => {
    // Physiological steady pulsatile green wave (mean ~80, AC ~4)
    const steadyGreen = [80, 82, 84, 83, 81, 79, 78, 79, 81, 83, 84, 82, 80, 78];
    const steadyRed = new Array(14).fill(200);
    const res = BiometricLivenessGuard.evaluateFrame(200, 80, 40, steadyGreen, steadyRed);
    assert.strictEqual(res.isValidTissue, true);
    assert.strictEqual(res.status, 'OPTIMAL_LIVENESS_VERIFIED');
    assert.strictEqual(res.uiColor, 'emerald');
    assert.ok(res.userGuidance.includes('Perfect placement'));
  });
});
