/**
 * OmniTriage Engine - National Early Warning Score 2 (NEWS2)
 * UK Royal College of Physicians Standard for Acute Deterioration.
 */

export interface NEWS2Input {
  respirationRateBpm: number;
  spO2Percent: number;
  onSupplementalOxygen: boolean;
  systolicBpMmHg: number;
  pulseRateBpm: number;
  consciousness: 'ALERT' | 'CONFUSION' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
  temperatureCelsius: number;
}

export type NEWS2RiskBand = 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH';

export interface NEWS2Result {
  totalScore: number;
  riskBand: NEWS2RiskBand;
  clinicalAction: string;
  subScores: {
    respiration: number;
    spO2: number;
    oxygen: number;
    systolicBp: number;
    pulse: number;
    consciousness: number;
    temperature: number;
  };
}

export class NEWS2Triage {
  public static calculate(input: NEWS2Input): NEWS2Result {
    let resp = 0;
    if (input.respirationRateBpm <= 8) resp = 3;
    else if (input.respirationRateBpm >= 9 && input.respirationRateBpm <= 11) resp = 1;
    else if (input.respirationRateBpm >= 12 && input.respirationRateBpm <= 20) resp = 0;
    else if (input.respirationRateBpm >= 21 && input.respirationRateBpm <= 24) resp = 2;
    else resp = 3;

    let spo2 = 0;
    if (input.spO2Percent <= 91) spo2 = 3;
    else if (input.spO2Percent >= 92 && input.spO2Percent <= 93) spo2 = 2;
    else if (input.spO2Percent >= 94 && input.spO2Percent <= 95) spo2 = 1;
    else spo2 = 0;

    const oxygen = input.onSupplementalOxygen ? 2 : 0;

    let sbp = 0;
    if (input.systolicBpMmHg <= 90) sbp = 3;
    else if (input.systolicBpMmHg >= 91 && input.systolicBpMmHg <= 100) sbp = 2;
    else if (input.systolicBpMmHg >= 101 && input.systolicBpMmHg <= 110) sbp = 1;
    else if (input.systolicBpMmHg >= 111 && input.systolicBpMmHg <= 219) sbp = 0;
    else sbp = 3;

    let pulse = 0;
    if (input.pulseRateBpm <= 40) pulse = 3;
    else if (input.pulseRateBpm >= 41 && input.pulseRateBpm <= 50) pulse = 1;
    else if (input.pulseRateBpm >= 51 && input.pulseRateBpm <= 90) pulse = 0;
    else if (input.pulseRateBpm >= 91 && input.pulseRateBpm <= 110) pulse = 1;
    else if (input.pulseRateBpm >= 111 && input.pulseRateBpm <= 130) pulse = 2;
    else pulse = 3;

    const consciousness = input.consciousness === 'ALERT' ? 0 : 3;

    let temp = 0;
    if (input.temperatureCelsius <= 35.0) temp = 3;
    else if (input.temperatureCelsius >= 35.1 && input.temperatureCelsius <= 36.0) temp = 1;
    else if (input.temperatureCelsius >= 36.1 && input.temperatureCelsius <= 38.0) temp = 0;
    else if (input.temperatureCelsius >= 38.1 && input.temperatureCelsius <= 39.0) temp = 1;
    else temp = 2;

    const totalScore = resp + spo2 + oxygen + sbp + pulse + consciousness + temp;
    const hasSingleScore3 = [resp, spo2, oxygen, sbp, pulse, consciousness, temp].some(s => s === 3);

    let riskBand: NEWS2RiskBand = 'LOW';
    let action = 'Routine clinical monitoring (every 12 hours). Continue planned care.';

    if (totalScore >= 7) {
      riskBand = 'HIGH';
      action = 'EMERGENCY RESPONSE: Immediate clinical review by emergency/critical care team. Continuous vital monitoring and ICU transfer assessment.';
    } else if (totalScore >= 5 || hasSingleScore3) {
      riskBand = totalScore >= 5 ? 'MEDIUM' : 'LOW_MEDIUM';
      action = 'URGENT REVIEW: Urgent assessment by medical team within 1 hour. Increase monitoring frequency to at least hourly.';
    }

    return {
      totalScore,
      riskBand,
      clinicalAction: action,
      subScores: {
        respiration: resp,
        spO2: spo2,
        oxygen,
        systolicBp: sbp,
        pulse,
        consciousness,
        temperature: temp
      }
    };
  }
}
