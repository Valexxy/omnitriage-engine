import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CASIEngine } from '../src/world-first/casi-engine';
import { HemodynamicDepletionEngine } from '../src/world-first/hemodynamic-depletion-engine';
import { FHIRQRTagGenerator } from '../src/world-first/fhir-qr-emergency-tag';

describe('World-First Medical Innovation Engines (CASI™ & DHODC™)', () => {
  it('should compute Cardio-Acoustic Shock Index (CASI™) and stroke volume from paired audio-optical transit time', () => {
    const result = CASIEngine.calculate({
      heartRateBpm: 75,
      systolicBpMmHg: 120,
      ppgPeakIndex: 12,
      acousticS1PeakIndex: 6,
      samplingRateHz: 30
    });

    assert.ok(result.casiScore > 0, 'CASI score should be calculated');
    assert.ok(result.estimatedStrokeVolumeMl >= 40 && result.estimatedStrokeVolumeMl <= 120, 'Stroke volume within physiological range');
    assert.ok(result.estimatedCardiacOutputLMin >= 3.0 && result.estimatedCardiacOutputLMin <= 8.0, 'Cardiac output within physiological range');
    assert.strictEqual(result.hemodynamicState, 'NORMOCIRCULATORY');
  });

  it('should analyze deep-tissue microvascular capillary refill kinetics (DHODC™)', () => {
    const curve = Array.from({ length: 30 }, (_, i) => [200, i < 5 ? 180 - i * 20 : 80 + (i - 5) * 5, 60]);
    const res = HemodynamicDepletionEngine.analyzeRecoveryCurve(curve);

    assert.ok(res.capillaryRefillTimeSec > 0, 'Refill time calculated');
    assert.ok(res.microvascularPerfusionScore > 0, 'Perfusion score calculated');
  });

  it('should generate an encrypted offline FHIR QR Emergency Life Tag', () => {
    const tag = FHIRQRTagGenerator.generateEmergencyTag(
      { resourceType: 'Bundle', id: 'bundle-test-01', timestamp: new Date().toISOString(), type: 'collection', entry: [] },
      { hr: 135, hb: 6.5, news2: 8, qsofa: 2, casi: 3.2 }
    );

    assert.strictEqual(tag.criticalTriageBand, 'RED_EMERGENCY_IMMEDIATE_RESUSCITATION');
    assert.ok(tag.offlineEmergencyDirective.includes('IMMEDIATE AIRWAY'));
    assert.ok(tag.fhirBundleSignature.startsWith('SHA256:'));
  });
});
