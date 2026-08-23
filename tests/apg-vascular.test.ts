import { describe, it } from 'node:test';
import assert from 'node:assert';
import { APGVascularEngine } from '../src/dsp/apg-vascular-engine';
import { AnemiaSpectroEngine } from '../src/dsp/anemia-spectro-engine';

describe('APG Vascular Age & Anemia Spectrophotometry', () => {
  it('should compute second derivative and extract valid b/a ratio', () => {
    const samplingRate = 30;
    const ppgWave: number[] = [];
    for (let i = 0; i < 60; i++) {
      const t = i / samplingRate;
      ppgWave.push(Math.sin(2 * Math.PI * 1.2 * t) + 0.25 * Math.sin(2 * Math.PI * 2.4 * t));
    }

    const apgResult = APGVascularEngine.analyze(ppgWave, 40, samplingRate);
    assert.ok(apgResult.bOverARatio !== undefined, 'b/a ratio should be defined');
    assert.ok(apgResult.estimatedVascularAgeYears >= 18 && apgResult.estimatedVascularAgeYears <= 90, 'Vascular age within bounds');
    assert.ok(apgResult.vascularElasticityIndex >= 0 && apgResult.vascularElasticityIndex <= 100, 'VEI within 0-100');
  });

  it('should accurately grade severe anemia (Hb < 8.0 g/dL) and trigger transfusion alert', () => {
    // Pale conjunctiva (low red relative to green/blue)
    const paleResult = AnemiaSpectroEngine.analyze(110, 105, 95);
    assert.strictEqual(paleResult.severity, 'SEVERE');
    assert.strictEqual(paleResult.transfusionThresholdAlert, true);
    assert.ok(paleResult.estimatedHbGPerDl < 8.0, 'Hb should be < 8.0 g/dL');

    // Healthy pink/red conjunctiva
    const healthyResult = AnemiaSpectroEngine.analyze(195, 80, 70);
    assert.strictEqual(healthyResult.severity, 'NORMAL');
    assert.strictEqual(healthyResult.transfusionThresholdAlert, false);
    assert.ok(healthyResult.estimatedHbGPerDl >= 12.0, 'Hb should be normal');
  });
});
