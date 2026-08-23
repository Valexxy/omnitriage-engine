/**
 * OmniTriage Engine - Quick Sepsis-related Organ Failure Assessment (qSOFA)
 * Sepsis-3 International Consensus Definition for Bedside Sepsis Triage.
 */

export interface qSOFAInput {
  respiratoryRateBpm: number;
  systolicBpMmHg: number;
  alteredMentation: boolean;
}

export interface qSOFAResult {
  score: number;
  sepsisHighRisk: boolean;
  inHospitalMortalityRisk: 'LOW' | 'MODERATE' | 'HIGH';
  clinicalProtocol: string;
}

export class QSOFATriage {
  public static evaluate(input: qSOFAInput): qSOFAResult {
    let score = 0;
    if (input.respiratoryRateBpm >= 22) score++;
    if (input.systolicBpMmHg <= 100) score++;
    if (input.alteredMentation) score++;

    const sepsisHighRisk = score >= 2;
    let mortalityRisk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
    let protocol = 'Low risk of septic organ failure. Continue standard clinical observation.';

    if (score === 1) {
      mortalityRisk = 'MODERATE';
      protocol = 'Moderate risk. Monitor closely for signs of infection, lactate elevation, and worsening vitals.';
    } else if (score >= 2) {
      mortalityRisk = 'HIGH';
      protocol = 'CRITICAL SEPSIS ALERT (qSOFA >= 2): High probability of sepsis and in-hospital decompensation. Initiate Sepsis Six protocol (IV fluids, blood cultures, broad-spectrum antibiotics, lactate test).';
    }

    return {
      score,
      sepsisHighRisk,
      inHospitalMortalityRisk: mortalityRisk,
      clinicalProtocol: protocol
    };
  }
}
