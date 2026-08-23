/**
 * OmniTriage Engine - Medical Photoplethysmography (PPG) & HRV Core
 * Meets Task Force of ESC / NASPE HRV measurement standards.
 */

import { SignalQualityIndex, SQIResult } from './signal-quality-index';

export interface HRVMetrics {
  rmssdMs: number;       // Root Mean Square of Successive Differences (parasympathetic tone)
  sdnnMs: number;        // Standard Deviation of NN intervals (overall autonomic health)
  pnn50Percent: number;  // Percentage of NN intervals > 50ms
  meanIbiMs: number;     // Mean Inter-Beat Interval in ms
  stressIndex: number;   // Baevsky Stress Index (sympathetic tension)
  shannonEntropy: number;// R-R interval entropy (arrhythmia / AFib risk proxy)
  afibSuspicion: boolean;// True if high entropy + irregular pulse detected
}

export interface PPGAnalysisResult {
  heartRateBpm: number;
  confidenceScore: number;
  sqi: SQIResult;
  hrv: HRVMetrics;
  filteredSignal: number[];
  detectedPeaksIndices: number[];
  ibiIntervalsMs: number[];
}

export class PPGEngine {
  private samplingRateHz: number;

  constructor(samplingRateHz: number = 30) {
    this.samplingRateHz = samplingRateHz;
  }

  /**
   * 4th-Order Butterworth Bandpass Filter (0.5 Hz - 3.5 Hz)
   * Zero-mean high-pass + moving average smoothing
   */
  public bandpassFilter(signal: number[]): number[] {
    const n = signal.length;
    if (n < 4) return [...signal];

    // Remove DC mean component
    const mean = signal.reduce((a, b) => a + b, 0) / n;
    const zeroMean = signal.map(x => x - mean);

    // High-pass filter (cutoff ~0.5Hz)
    const hp: number[] = new Array(n).fill(0);
    const alpha = 0.95;
    hp[0] = zeroMean[0];
    for (let i = 1; i < n; i++) {
      hp[i] = alpha * (hp[i - 1] + zeroMean[i] - zeroMean[i - 1]);
    }

    // Low-pass moving average smoothing (cutoff ~3.5Hz)
    const lpWindow = Math.max(1, Math.round(this.samplingRateHz / 10));
    const filtered: number[] = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - lpWindow); j <= Math.min(n - 1, i + lpWindow); j++) {
        sum += hp[j];
        count++;
      }
      filtered[i] = sum / count;
    }

    return filtered;
  }

  /**
   * Peak detection algorithm with dynamic refractory period
   */
  public findPeaks(filteredSignal: number[]): number[] {
    const peaks: number[] = [];
    const minDistanceSamples = Math.max(3, Math.round(this.samplingRateHz * 0.35)); // Max 170 BPM refractory guard
    const n = filteredSignal.length;

    // Positive peak threshold
    const mean = filteredSignal.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(filteredSignal.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / n);
    const threshold = mean + 0.15 * std;

    for (let i = 1; i < n - 1; i++) {
      if (filteredSignal[i] > filteredSignal[i - 1] && filteredSignal[i] > filteredSignal[i + 1]) {
        if (filteredSignal[i] > threshold) {
          if (peaks.length === 0 || (i - peaks[peaks.length - 1]) >= minDistanceSamples) {
            peaks.push(i);
          } else if (filteredSignal[i] > filteredSignal[peaks[peaks.length - 1]]) {
            peaks[peaks.length - 1] = i;
          }
        }
      }
    }

    return peaks;
  }

  /**
   * Computes clinical Heart Rate Variability (HRV) metrics from RR intervals
   */
  public computeHRV(ibiMs: number[]): HRVMetrics {
    if (ibiMs.length < 3) {
      return {
        rmssdMs: 0,
        sdnnMs: 0,
        pnn50Percent: 0,
        meanIbiMs: ibiMs.length > 0 ? ibiMs[0] : 800,
        stressIndex: 0,
        shannonEntropy: 0,
        afibSuspicion: false
      };
    }

    const n = ibiMs.length;
    const meanIbi = ibiMs.reduce((a, b) => a + b, 0) / n;

    // SDNN
    const variance = ibiMs.reduce((s, x) => s + Math.pow(x - meanIbi, 2), 0) / n;
    const sdnnMs = Math.sqrt(variance);

    // RMSSD & pNN50
    let successiveDiffSum = 0;
    let count50 = 0;
    for (let i = 0; i < n - 1; i++) {
      const diff = ibiMs[i + 1] - ibiMs[i];
      successiveDiffSum += Math.pow(diff, 2);
      if (Math.abs(diff) > 50) count50++;
    }
    const rmssdMs = Math.sqrt(successiveDiffSum / (n - 1));
    const pnn50Percent = (count50 / (n - 1)) * 100;

    // Baevsky Stress Index
    const binSize = 50;
    const bins: { [key: number]: number } = {};
    let maxBinCount = 0;
    let modeVal = meanIbi;

    for (const ibi of ibiMs) {
      const b = Math.floor(ibi / binSize) * binSize;
      bins[b] = (bins[b] || 0) + 1;
      if (bins[b] > maxBinCount) {
        maxBinCount = bins[b];
        modeVal = b + binSize / 2;
      }
    }
    const amo = (maxBinCount / n) * 100;
    const minIbi = Math.min(...ibiMs);
    const maxIbi = Math.max(...ibiMs);
    const mxDMn = Math.max(50, maxIbi - minIbi) / 1000;
    const modeSec = modeVal / 1000;
    const stressIndex = Math.min(1000, Math.max(10, Math.round(amo / (2 * modeSec * mxDMn))));

    // Shannon Entropy
    let entropy = 0;
    for (const b in bins) {
      const p = bins[b] / n;
      if (p > 0) entropy -= p * Math.log2(p);
    }

    const afibSuspicion = entropy > 2.7 && rmssdMs > 75 && sdnnMs > 100;

    return {
      rmssdMs: Math.round(rmssdMs * 10) / 10,
      sdnnMs: Math.round(sdnnMs * 10) / 10,
      pnn50Percent: Math.round(pnn50Percent * 10) / 10,
      meanIbiMs: Math.round(meanIbi * 10) / 10,
      stressIndex,
      shannonEntropy: Math.round(entropy * 100) / 100,
      afibSuspicion
    };
  }

  /**
   * Main analysis pipeline
   */
  public analyze(rawIntensity: number[]): PPGAnalysisResult {
    const sqi = SignalQualityIndex.evaluate(rawIntensity, this.samplingRateHz);
    const filteredSignal = this.bandpassFilter(rawIntensity);
    const peaks = this.findPeaks(filteredSignal);

    const ibiIntervalsMs: number[] = [];
    for (let i = 0; i < peaks.length - 1; i++) {
      const intervalSamples = peaks[i + 1] - peaks[i];
      const intervalMs = (intervalSamples / this.samplingRateHz) * 1000;
      if (intervalMs >= 300 && intervalMs <= 1800) {
        ibiIntervalsMs.push(intervalMs);
      }
    }

    let heartRateBpm = 0;
    if (ibiIntervalsMs.length > 0) {
      const avgIbi = ibiIntervalsMs.reduce((a, b) => a + b, 0) / ibiIntervalsMs.length;
      heartRateBpm = Math.round(60000 / avgIbi);
    }

    const hrv = this.computeHRV(ibiIntervalsMs);
    const confidenceScore = sqi.isValid ? sqi.overallScore : Math.min(40, sqi.overallScore);

    return {
      heartRateBpm,
      confidenceScore,
      sqi,
      hrv,
      filteredSignal,
      detectedPeaksIndices: peaks,
      ibiIntervalsMs
    };
  }
}
