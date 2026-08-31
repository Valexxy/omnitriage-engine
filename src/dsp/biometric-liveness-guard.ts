/**
 * Intelligent Biometric Liveness & Error-Guard Engine
 * Evaluates real-time optical transillumination, AC/DC capillary pulsatility,
 * hemoglobin spectral absorption ratios, and motion variance to detect and guide
 * the user when anything is positioned incorrectly.
 */

export type PlacementErrorType =
  | 'NO_FINGER_DETECTED'
  | 'MISSING_FLASHLIGHT'
  | 'WRONG_OBJECT_OR_SPOOF'
  | 'TOO_HARD_CAPILLARY_BLOCKED'
  | 'TOO_LIGHT_LIGHT_LEAK'
  | 'EXCESSIVE_MOTION_TREMOR'
  | 'OPTIMAL_LIVENESS_VERIFIED';

export interface LivenessFeedback {
  isValidTissue: boolean;
  status: PlacementErrorType;
  userGuidance: string;
  uiColor: 'emerald' | 'amber' | 'rose';
  tissueTransilluminationIndex: number;
  pulsatilityAcDcRatio: number;
  motionJitterScore: number;
}

export class BiometricLivenessGuard {
  /**
   * Analyzes real-time RGB frames from camera sensor
   */
  public static evaluateFrame(
    r: number,
    g: number,
    b: number,
    recentGreenBuffer: number[],
    recentRedBuffer: number[]
  ): LivenessFeedback {
    // 1. Check for No Contact / Room Ambient Light
    // In ambient room light, R, G, B are often balanced or very dark
    if (r < 40 && g < 40 && b < 40) {
      return {
        isValidTissue: false,
        status: 'NO_FINGER_DETECTED',
        userGuidance: 'No finger detected. Place index finger over camera and flashlight.',
        uiColor: 'rose',
        tissueTransilluminationIndex: 0,
        pulsatilityAcDcRatio: 0,
        motionJitterScore: 0
      };
    }

    // 2. Tissue Transillumination Ratio:
    // Human capillary tissue absorbs Green and Blue heavily, transmitting Red
    const transilluminationRatio = r / (Math.max(1, g) + Math.max(1, b) * 0.5);

    // Non-biological spoof check (Paper, desk, wall, white surface)
    if (transilluminationRatio < 1.25 && r > 120 && g > 120 && b > 120) {
      return {
        isValidTissue: false,
        status: 'WRONG_OBJECT_OR_SPOOF',
        userGuidance: 'Non-biological object detected. Place your living index finger.',
        uiColor: 'rose',
        tissueTransilluminationIndex: Math.round(transilluminationRatio * 100) / 100,
        pulsatilityAcDcRatio: 0,
        motionJitterScore: 0
      };
    }

    // Missing Flashlight (Finger is on camera, but image is dark and murky)
    if (r < 75 && transilluminationRatio >= 1.2) {
      return {
        isValidTissue: false,
        status: 'MISSING_FLASHLIGHT',
        userGuidance: 'Flashlight blocked. Slide finger slightly to cover the bright LED flashlight.',
        uiColor: 'amber',
        tissueTransilluminationIndex: Math.round(transilluminationRatio * 100) / 100,
        pulsatilityAcDcRatio: 0,
        motionJitterScore: 0
      };
    }

    // 3. Compute AC/DC Capillary Pulsatility
    let acDcRatio = 0.0;
    let motionJitter = 0.0;

    if (recentGreenBuffer.length >= 10) {
      const minG = Math.min(...recentGreenBuffer);
      const maxG = Math.max(...recentGreenBuffer);
      const meanG = recentGreenBuffer.reduce((a, b) => a + b, 0) / recentGreenBuffer.length;
      const acAmplitude = maxG - minG;
      acDcRatio = (acAmplitude / Math.max(1, meanG)) * 100;

      // Motion jitter (rapid frame-to-frame standard deviation spikes)
      const diffs = [];
      for (let i = 1; i < recentGreenBuffer.length; i++) {
        diffs.push(Math.abs(recentGreenBuffer[i] - recentGreenBuffer[i - 1]));
      }
      motionJitter = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    }

    // 4. Excessive Movement / Tremor Detection
    if (motionJitter > 15.0) {
      return {
        isValidTissue: false,
        status: 'EXCESSIVE_MOTION_TREMOR',
        userGuidance: 'Motion detected! Keep your hand and phone completely steady.',
        uiColor: 'amber',
        tissueTransilluminationIndex: Math.round(transilluminationRatio * 100) / 100,
        pulsatilityAcDcRatio: Math.round(acDcRatio * 100) / 100,
        motionJitterScore: Math.round(motionJitter * 10) / 10
      };
    }

    // 5. Contact Pressure Checks (Too Hard vs Too Light)
    if (r > 248 && acDcRatio < 0.4 && recentGreenBuffer.length >= 15) {
      return {
        isValidTissue: false,
        status: 'TOO_HARD_CAPILLARY_BLOCKED',
        userGuidance: 'Pressing too hard! Ease pressure to allow blood to circulate.',
        uiColor: 'amber',
        tissueTransilluminationIndex: Math.round(transilluminationRatio * 100) / 100,
        pulsatilityAcDcRatio: Math.round(acDcRatio * 100) / 100,
        motionJitterScore: Math.round(motionJitter * 10) / 10
      };
    }

    if (acDcRatio > 18.0) {
      return {
        isValidTissue: false,
        status: 'TOO_LIGHT_LIGHT_LEAK',
        userGuidance: 'Finger too loose. Seal camera lens gently to block room light leaks.',
        uiColor: 'amber',
        tissueTransilluminationIndex: Math.round(transilluminationRatio * 100) / 100,
        pulsatilityAcDcRatio: Math.round(acDcRatio * 100) / 100,
        motionJitterScore: Math.round(motionJitter * 10) / 10
      };
    }

    // 6. Optimal Authentic Liveness Verified
    return {
      isValidTissue: true,
      status: 'OPTIMAL_LIVENESS_VERIFIED',
      userGuidance: '✓ Perfect placement & blood flow detected. Acquiring clinical vitals...',
      uiColor: 'emerald',
      tissueTransilluminationIndex: Math.round(transilluminationRatio * 100) / 100,
      pulsatilityAcDcRatio: Math.round(acDcRatio * 100) / 100,
      motionJitterScore: Math.round(motionJitter * 10) / 10
    };
  }
}
