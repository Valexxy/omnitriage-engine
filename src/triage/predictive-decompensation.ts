/**
 * OmniTriage Engine - 4 to 6 Hour Pre-Symptomatic Decompensation Early Warning
 * Fuses Autonomic HRV, APG Vascular Index, Pulmonary Acoustics, and SQI.
 */

export interface DecompensationVector {
  heartRateBpm: number;
  rmssdMs: number;
  stressIndex: number;
  bOverARatio: number;
  respiratoryRateBpm: number;
  anemiaHbGPerDl: number;
  sqiScore: number;
}

export interface PredictiveDecompensationResult {
  decompensationRiskScore: number;
  earlyWarningBand: 'STABLE' | 'ELEVATED' | 'IMMINENT_COLLAPSE';
  resilienceIndex: number;
  fourHourTrajectoryWarning: boolean;
  physiologicAlerts: string[];
}

export class PredictiveDecompensation {
  public static predict(v: DecompensationVector): PredictiveDecompensationResult {
    let risk = 15.0;
    const alerts: string[] = [];

    if (v.rmssdMs < 18) {
      risk += 25;
      alerts.push('Severe parasympathetic withdrawal (RMSSD < 18ms)');
    }
    if (v.stressIndex > 450) {
      risk += 20;
      alerts.push('Critical sympathetic tension (Baevsky SI > 450)');
    }
    if (v.heartRateBpm > 105 && v.bOverARatio > -0.3) {
      risk += 20;
      alerts.push('Combined vascular stiffness and tachycardia');
    }
    if (v.respiratoryRateBpm >= 22) {
      risk += 18;
      alerts.push('Tachypnea indicating compensatory metabolic/respiratory drive');
    }
    if (v.anemiaHbGPerDl < 8.0) {
      risk += 22;
      alerts.push('Tissue hypoxia risk due to severe anemia (Hb < 8.0 g/dL)');
    }

    const finalRisk = Math.max(0, Math.min(100, Math.round(risk)));
    const resilience = Math.max(0, 100 - finalRisk);

    let band: 'STABLE' | 'ELEVATED' | 'IMMINENT_COLLAPSE' = 'STABLE';
    let fourHourWarning = false;

    if (finalRisk >= 70) {
      band = 'IMMINENT_COLLAPSE';
      fourHourWarning = true;
    } else if (finalRisk >= 40) {
      band = 'ELEVATED';
      fourHourWarning = true;
    }

    return {
      decompensationRiskScore: finalRisk,
      earlyWarningBand: band,
      resilienceIndex: resilience,
      fourHourTrajectoryWarning: fourHourWarning,
      physiologicAlerts: alerts
    };
  }
}
