import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PPGEngine } from '../src/dsp/ppg-engine';
import { SignalQualityIndex } from '../src/dsp/signal-quality-index';

describe('PPG & SQI Signal Processing Accuracy', () => {
  it('should reject noisy flatline or insufficient signals (SQI gatekeeper)', () => {
    const flatline = new Array(60).fill(120);
    const sqi = SignalQualityIndex.evaluate(flatline, 30);
    assert.strictEqual(sqi.isValid, false);
    assert.strictEqual(sqi.overallScore, 0);
  });

  it('should accurately detect heart rate within +/- 3 BPM on physiological 72 BPM PPG waveform', () => {
    const samplingRate = 30;
    const durationSeconds = 10;
    const targetBpm = 72;
    const freqHz = targetBpm / 60; // 1.2 Hz
    const samples: number[] = [];

    for (let i = 0; i < samplingRate * durationSeconds; i++) {
      const t = i / samplingRate;
      // Realistic physiological fingertip PPG: DC baseline 180, AC pulse amplitude 7.5 (PI ~ 4.2%)
      const fundamental = Math.sin(2 * Math.PI * freqHz * t);
      const harmonic = 0.25 * Math.sin(2 * Math.PI * freqHz * 2 * t - 0.3);
      const val = 180 + 7.5 * (fundamental + harmonic) + (Math.random() - 0.5) * 0.3;
      samples.push(val);
    }

    const engine = new PPGEngine(samplingRate);
    const result = engine.analyze(samples);

    assert.ok(result.sqi.overallScore >= 75, 'SQI score should be high for clean physiological pulse, got: ' + result.sqi.overallScore);
    assert.ok(Math.abs(result.heartRateBpm - targetBpm) <= 3, 'Expected HR around 72, got: ' + result.heartRateBpm);
    assert.ok(result.hrv.rmssdMs >= 0, 'RMSSD should be non-negative');
  });
});
