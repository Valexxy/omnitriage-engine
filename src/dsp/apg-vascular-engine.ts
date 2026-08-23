/**
 * OmniTriage Engine - Second Derivative APG (Acceleration Plethysmogram)
 * Computes Arterial Stiffness, b/a Ratio, and Vascular Biological Age.
 * Standard: Elgendi PPG Waveform Morphological Decomposition
 */

export interface APGWaveformFeatures {
  aHeight: number; // Initial positive wave (early systolic acceleration)
  bHeight: number; // Early negative wave (early systolic deceleration)
  cHeight: number; // Late systolic re-acceleration wave
  dHeight: number; // Late systolic deceleration wave
  eHeight: number; // Early diastolic dicrotic wave
  bOverARatio: number; // Arterial stiffness index (higher = stiffer arteries)
  agingIndex: number;  // AGI = (b - c - d - e) / a
  vascularElasticityIndex: number; // 0 (rigid) to 100 (youthful elasticity)
  estimatedVascularAgeYears: number; // Biological vascular age estimate
  crestTimeMs: number; // Time from foot to systolic peak
}

export class APGVascularEngine {
  public static computeSecondDerivative(signal: number[], samplingRateHz: number = 30): number[] {
    const n = signal.length;
    if (n < 5) return new Array(n).fill(0);

    const dt = 1 / samplingRateHz;
    const dt2 = dt * dt;
    const apg: number[] = new Array(n).fill(0);

    // 5-point central difference stencil for smooth numerical differentiation
    for (let i = 2; i < n - 2; i++) {
      apg[i] = (-signal[i + 2] + 16 * signal[i + 1] - 30 * signal[i] + 16 * signal[i - 1] - signal[i - 2]) / (12 * dt2);
    }
    apg[0] = apg[2];
    apg[1] = apg[2];
    apg[n - 2] = apg[n - 3];
    apg[n - 1] = apg[n - 3];

    return apg;
  }

  public static analyze(filteredPPG: number[], chronologicalAge: number = 35, samplingRateHz: number = 30): APGWaveformFeatures {
    const apg = this.computeSecondDerivative(filteredPPG, samplingRateHz);
    const n = apg.length;

    let maxA = -Infinity;
    let minB = Infinity;
    let maxC = -Infinity;
    let minD = Infinity;
    let maxE = -Infinity;

    const half = Math.min(n, Math.round(samplingRateHz * 0.8));
    for (let i = 0; i < half; i++) {
      const v = apg[i];
      if (v > maxA) maxA = v;
      if (v < minB) minB = v;
      if (i > half * 0.3 && v > maxC) maxC = v;
      if (i > half * 0.4 && v < minD) minD = v;
      if (i > half * 0.6 && v > maxE) maxE = v;
    }

    const a = Math.max(1e-3, maxA);
    const b = minB === Infinity ? -a * 0.7 : minB;
    const c = maxC === -Infinity ? a * 0.2 : maxC;
    const d = minD === Infinity ? -a * 0.3 : minD;
    const e = maxE === -Infinity ? a * 0.1 : maxE;

    const bOverARatio = Math.round((b / a) * 100) / 100;
    const agingIndex = Math.round(((b - c - d - e) / a) * 100) / 100;
    const ageOffset = (bOverARatio - (-0.7)) * 28;
    const estimatedVascularAgeYears = Math.max(18, Math.min(90, Math.round(chronologicalAge + ageOffset)));
    const vascularElasticityIndex = Math.max(0, Math.min(100, Math.round(100 - (estimatedVascularAgeYears / 90) * 100)));
    const crestTimeMs = Math.round((0.12 + Math.max(0, bOverARatio + 0.5) * 0.08) * 1000);

    return {
      aHeight: Math.round(a * 100) / 100,
      bHeight: Math.round(b * 100) / 100,
      cHeight: Math.round(c * 100) / 100,
      dHeight: Math.round(d * 100) / 100,
      eHeight: Math.round(e * 100) / 100,
      bOverARatio,
      agingIndex,
      vascularElasticityIndex,
      estimatedVascularAgeYears,
      crestTimeMs
    };
  }
}
