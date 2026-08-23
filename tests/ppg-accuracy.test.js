"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const ppg_engine_1 = require("../src/dsp/ppg-engine");
const signal_quality_index_1 = require("../src/dsp/signal-quality-index");
(0, node_test_1.describe)('PPG & SQI Signal Processing Accuracy', () => {
    (0, node_test_1.it)('should reject noisy flatline or insufficient signals (SQI gatekeeper)', () => {
        const flatline = new Array(60).fill(120);
        const sqi = signal_quality_index_1.SignalQualityIndex.evaluate(flatline, 30);
        node_assert_1.default.strictEqual(sqi.isValid, false);
        node_assert_1.default.strictEqual(sqi.overallScore, 0);
    });
    (0, node_test_1.it)('should accurately detect heart rate within +/- 3 BPM on synthetic 72 BPM PPG waveform', () => {
        const samplingRate = 30;
        const durationSeconds = 10;
        const targetBpm = 72;
        const freqHz = targetBpm / 60; // 1.2 Hz
        const samples = [];
        for (let i = 0; i < samplingRate * durationSeconds; i++) {
            const t = i / samplingRate;
            const fundamental = Math.sin(2 * Math.PI * freqHz * t);
            const harmonic = 0.3 * Math.sin(2 * Math.PI * freqHz * 2 * t);
            const val = 120 + 25 * (fundamental + harmonic) + (Math.random() - 0.5) * 1.5;
            samples.push(val);
        }
        const engine = new ppg_engine_1.PPGEngine(samplingRate);
        const result = engine.analyze(samples);
        node_assert_1.default.ok(result.sqi.overallScore >= 70, 'SQI score should be high for clean synthetic pulse');
        node_assert_1.default.ok(Math.abs(result.heartRateBpm - targetBpm) <= 3, 'Expected HR around 72');
        node_assert_1.default.ok(result.hrv.rmssdMs >= 0, 'RMSSD should be non-negative');
    });
});
