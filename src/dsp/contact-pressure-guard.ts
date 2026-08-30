/**
 * Real-time Contact Pressure & Perfusion Guard
 * Prevents capillary collapse caused by excessive fingertip pressure (The Goldilocks effect).
 */

export type PressureStatus = 'OPTIMAL' | 'TOO_HARD' | 'TOO_LIGHT' | 'NO_CONTACT';

export interface PressureFeedback {
  status: PressureStatus;
  userGuidance: string;
  perfusionIndexPercent: number;
  redChannelSaturation: number; // 0.0 to 1.0
  isUsable: boolean;
}

export class ContactPressureGuard {
  public static evaluatePressure(
    rawRedAvg: number,
    rawGreenAvg: number,
    acAmplitude: number
  ): PressureFeedback {
    const redSaturation = rawRedAvg / 255.0;
    const perfusionIndex = (acAmplitude / Math.max(1, rawRedAvg)) * 100;

    // 1. No contact (Ambient light / open sensor)
    if (rawRedAvg < 45 || redSaturation < 0.2) {
      return {
        status: 'NO_CONTACT',
        userGuidance: 'Place your finger gently over the rear camera & flashlight.',
        perfusionIndexPercent: 0,
        redChannelSaturation: redSaturation,
        isUsable: false
      };
    }

    // 2. Too Hard (Capillary bed compressed -> Perfusion collapsed, Red clipped > 0.96)
    if (redSaturation > 0.97 && perfusionIndex < 0.6) {
      return {
        status: 'TOO_HARD',
        userGuidance: 'Pressing too hard. Ease pressure to allow blood micro-flow.',
        perfusionIndexPercent: Math.round(perfusionIndex * 100) / 100,
        redChannelSaturation: redSaturation,
        isUsable: false
      };
    }

    // 3. Too Light (Sensor leak / high motion noise)
    if (perfusionIndex > 14.0) {
      return {
        status: 'TOO_LIGHT',
        userGuidance: 'Too light. Maintain steady, gentle contact without lifting.',
        perfusionIndexPercent: Math.round(perfusionIndex * 100) / 100,
        redChannelSaturation: redSaturation,
        isUsable: false
      };
    }

    // 4. Optimal Clinical Range (35-60 mmHg capillary perfusion equivalent)
    return {
      status: 'OPTIMAL',
      userGuidance: 'Optimal contact pressure. Hold steady for scanning.',
      perfusionIndexPercent: Math.round(perfusionIndex * 100) / 100,
      redChannelSaturation: redSaturation,
      isUsable: true
    };
  }
}
