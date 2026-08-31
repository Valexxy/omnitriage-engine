/**
 * Vasomotor & Peripheral Thermoregulation Compensation Engine
 * Distinguishes between pathological vascular stiffening vs cold-induced
 * peripheral vasoconstriction (cold hands / low ambient temp).
 */

export interface VasomotorAssessment {
  vasoconstrictionIndex: number; // 0.0 (dilated) to 1.0 (severe vasoconstriction)
  isHypothermicExtremity: boolean;
  adjustedPerfusionIndex: number;
  correctedBaRatio: number;
  clinicalGuidance: string;
}

export class VasomotorThermalEngine {
  public static assess(data: {
    rawPerfusionIndex: number;
    rawBaRatio: number;
    ambientTempCelsius?: number;
    redDcBaseline: number;
  }): VasomotorAssessment {
    const temp = data.ambientTempCelsius || 22.0;
    
    // Cold-induced peripheral vasoconstriction index
    let vasoconstriction = 0.0;
    if (data.rawPerfusionIndex < 1.0 && temp < 20.0) {
      vasoconstriction = Math.min(1.0, (20.0 - temp) * 0.08 + (1.0 - data.rawPerfusionIndex) * 0.5);
    }

    const isColdExtremity = vasoconstriction > 0.4 || (data.rawPerfusionIndex < 0.8 && temp < 18.0);
    
    // Correct b/a ratio by removing artificial smooth muscle contraction artifact
    const correctionFactor = isColdExtremity ? (vasoconstriction * 0.18) : 0.0;
    const correctedBa = Math.round((data.rawBaRatio - correctionFactor) * 100) / 100;
    const adjustedPi = Math.round((data.rawPerfusionIndex * (1.0 + vasoconstriction * 0.4)) * 100) / 100;

    let guidance = 'Normal vasomotor tone.';
    if (isColdExtremity) {
      guidance = 'Peripheral vasoconstriction detected (cold extremity). Vitals adjusted for localized hypothermia.';
    }

    return {
      vasoconstrictionIndex: Math.round(vasoconstriction * 100) / 100,
      isHypothermicExtremity: isColdExtremity,
      adjustedPerfusionIndex: adjustedPi,
      correctedBaRatio: correctedBa,
      clinicalGuidance: guidance
    };
  }
}
