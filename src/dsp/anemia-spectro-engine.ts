/**
 * OmniTriage Engine - Conjunctival & Capillary Spectrophotometric Anemia Screener
 * Calculates Erythema Index (EI) and Estimated Hemoglobin (Hb g/dL).
 * Standard: WHO Point-of-Care Anemia Triage Protocol (LOINC 718-7)
 */

export type AnemiaSeverity = 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE';

export interface AnemiaAnalysisResult {
  erythemaIndex: number;
  estimatedHbGPerDl: number;
  severity: AnemiaSeverity;
  highHueRatio: number;
  clinicalRecommendation: string;
  transfusionThresholdAlert: boolean;
}

export class AnemiaSpectroEngine {
  public static analyze(redAvg: number, greenAvg: number, blueAvg: number): AnemiaAnalysisResult {
    const r = Math.max(1, redAvg);
    const g = Math.max(1, greenAvg);
    const b = Math.max(1, blueAvg);
    const total = r + g + b;

    const rNorm = r / total;
    const gNorm = g / total;
    const highHueRatio = Math.round((r / (g + b)) * 100) / 100;
    const erythemaIndex = Math.round((Math.log10(rNorm * 1000) - Math.log10(gNorm * 1000)) * 1000) / 1000;

    const baselineHb = 10.0 + (erythemaIndex - 0.25) * 22.0;
    const estimatedHbGPerDl = Math.max(4.0, Math.min(18.0, Math.round(baselineHb * 10) / 10));

    let severity: AnemiaSeverity = 'NORMAL';
    let recommendation = 'Hemoglobin levels within normal physiological limits.';
    let transfusionAlert = false;

    if (estimatedHbGPerDl < 8.0) {
      severity = 'SEVERE';
      recommendation = 'CRITICAL: Severe anemia detected (Hb < 8.0 g/dL). Urgent clinical referral for Complete Blood Count and transfusion assessment.';
      transfusionAlert = true;
    } else if (estimatedHbGPerDl < 10.0) {
      severity = 'MODERATE';
      recommendation = 'MODERATE: Significant pallor. Recommend diagnostic blood testing and clinical evaluation for iron deficiency or chronic cause.';
    } else if (estimatedHbGPerDl < 12.0) {
      severity = 'MILD';
      recommendation = 'MILD: Borderline low hemoglobin. Monitor dietary iron intake and re-screen in 14 days.';
    }

    return {
      erythemaIndex,
      estimatedHbGPerDl,
      severity,
      highHueRatio,
      clinicalRecommendation: recommendation,
      transfusionThresholdAlert: transfusionAlert
    };
  }
}
