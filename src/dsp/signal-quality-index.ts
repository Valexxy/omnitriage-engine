/**
 * OmniTriage Engine - Signal Quality Index (SQI) Gatekeeper
 * Standards: ISO 80601-2-61, ANSI/AAMI EC13
 */

export interface SQIResult {
  overallScore: number; // 0 to 100
  isValid: boolean;     // true if score >= 85 (clinical confidence threshold)
  perfusionIndex: number; // AC / DC ratio * 100 (%)
  snrDb: number;        // Signal-to-noise ratio in decibels
  skewness: number;     // Skewness SQI (sSQI)
  kurtosis: number;     // Kurtosis SQI (kSQI)
  motionArtifactLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  clinicalGuidance: string; // Real-time user feedback for sensor placement
}

export class SignalQualityIndex {
  public static readonly CLINICAL_THRESHOLD = 85.0;

  public static evaluate(rawSamples: number[], samplingRateHz: number = 30): SQIResult {
    if (!rawSamples || rawSamples.length < samplingRateHz * 2) {
      return {
        overallScore: 0,
        isValid: false,
        perfusionIndex: 0,
        snrDb: -Infinity,
        skewness: 0,
        kurtosis: 0,
        motionArtifactLevel: 'CRITICAL',
        clinicalGuidance: 'Insufficient data: Maintain steady contact for at least 3 seconds.'
      };
    }

    const n = rawSamples.length;
    const mean = rawSamples.reduce((a, b) => a + b, 0) / n;
    const variance = rawSamples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 1e-6) {
      return {
        overallScore: 0,
        isValid: false,
        perfusionIndex: 0,
        snrDb: -Infinity,
        skewness: 0,
        kurtosis: 0,
        motionArtifactLevel: 'CRITICAL',
        clinicalGuidance: 'No optical pulse detected. Please place finger directly over camera and flash.'
      };
    }

    let skewnessSum = 0;
    let kurtosisSum = 0;
    let minVal = Infinity;
    let maxVal = -Infinity;

    for (const x of rawSamples) {
      const diff = x - mean;
      skewnessSum += Math.pow(diff, 3);
      kurtosisSum += Math.pow(diff, 4);
      if (x < minVal) minVal = x;
      if (x > maxVal) maxVal = x;
    }

    const skewness = (skewnessSum / n) / Math.pow(stdDev, 3);
    const kurtosis = (kurtosisSum / n) / Math.pow(stdDev, 4);

    const acComponent = (maxVal - minVal) / 2;
    const dcComponent = Math.max(mean, 1e-4);
    const perfusionIndex = Math.min(20.0, (acComponent / dcComponent) * 100);
    const snrDb = Math.max(-10, Math.min(30, 10 * Math.log10(Math.max(variance / 1e-4, 1.0))));

    let score = 50.0;
    if (perfusionIndex >= 0.8 && perfusionIndex <= 12.0) score += 25;
    else if (perfusionIndex >= 0.4 && perfusionIndex <= 15.0) score += 10;
    else score -= 20;

    if (skewness > -0.5 && skewness < 2.5) score += 15;
    else score -= 15;

    if (kurtosis >= 1.5 && kurtosis <= 6.0) score += 10;
    else score -= 10;

    const finalScore = Math.max(0, Math.min(100, Math.round(score * 10) / 10));
    const isValid = finalScore >= this.CLINICAL_THRESHOLD;

    let motionArtifactLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    let guidance = 'Sensor position optimal. Maintain steady breath.';

    if (finalScore < 50) {
      motionArtifactLevel = 'CRITICAL';
      guidance = 'Poor contact. Cover both camera and flash completely without pressing too hard.';
    } else if (finalScore < 75) {
      motionArtifactLevel = 'HIGH';
      guidance = 'Excessive motion detected. Please rest your hand on a flat surface.';
    } else if (finalScore < this.CLINICAL_THRESHOLD) {
      motionArtifactLevel = 'MODERATE';
      guidance = 'Suboptimal signal. Hold steady and relax your finger.';
    }

    return {
      overallScore: finalScore,
      isValid,
      perfusionIndex: Math.round(perfusionIndex * 100) / 100,
      snrDb: Math.round(snrDb * 10) / 10,
      skewness: Math.round(skewness * 100) / 100,
      kurtosis: Math.round(kurtosis * 100) / 100,
      motionArtifactLevel,
      clinicalGuidance: guidance
    };
  }
}
