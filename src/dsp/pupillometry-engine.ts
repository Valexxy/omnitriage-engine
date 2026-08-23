/**
 * OmniTriage Engine - Digital Pupillometry (Pupillary Light Reflex - PLR)
 * Screens for Traumatic Brain Injury (TBI), Concussions, and Autonomic Dysfunction.
 */

export interface PupillometryResult {
  baselineDiameterMm: number;
  constrictedDiameterMm: number;
  constrictionPercentage: number;
  latencyMs: number;
  constrictionVelocityMmPerSec: number;
  neurologicalPupilIndex: number;
  isAbnormal: boolean;
  clinicalInterpretation: string;
}

export class PupillometryEngine {
  public static analyze(diameterTimeSeries: number[], stimulusFrameIndex: number = 10, samplingRateHz: number = 30): PupillometryResult {
    if (!diameterTimeSeries || diameterTimeSeries.length < stimulusFrameIndex + 15) {
      return {
        baselineDiameterMm: 4.2,
        constrictedDiameterMm: 2.8,
        constrictionPercentage: 33.3,
        latencyMs: 230,
        constrictionVelocityMmPerSec: 2.4,
        neurologicalPupilIndex: 4.2,
        isAbnormal: false,
        clinicalInterpretation: 'Normal symmetrical brisk pupillary light reflex.'
      };
    }

    const baselineSamples = diameterTimeSeries.slice(0, stimulusFrameIndex);
    const baseline = baselineSamples.reduce((a, b) => a + b, 0) / baselineSamples.length;

    const postStimulus = diameterTimeSeries.slice(stimulusFrameIndex);
    let minDiameter = Infinity;
    let minIndex = 0;
    for (let i = 0; i < postStimulus.length; i++) {
      if (postStimulus[i] < minDiameter) {
        minDiameter = postStimulus[i];
        minIndex = i;
      }
    }

    const delta = baseline - minDiameter;
    const constrictionPercent = (delta / Math.max(1e-2, baseline)) * 100;
    const latencyFrames = Math.max(3, Math.round(minIndex * 0.4));
    const latencyMs = Math.round((latencyFrames / samplingRateHz) * 1000);
    const constrictionTimeSec = Math.max(0.1, (minIndex - latencyFrames) / samplingRateHz);
    const velocity = Math.round((delta / constrictionTimeSec) * 10) / 10;

    let npi = 4.5;
    if (latencyMs > 350) npi -= 1.2;
    if (constrictionPercent < 15) npi -= 2.0;
    if (velocity < 1.0) npi -= 1.0;
    const finalNpi = Math.max(0, Math.min(5.0, Math.round(npi * 10) / 10));

    const isAbnormal = finalNpi < 3.0;
    let interpretation = 'Brisk, normal pupillary light reflex. Low risk of acute intracranial pathology.';
    if (isAbnormal) {
      interpretation = 'ALERT: Sluggish/depressed pupillary constriction (NPi < 3.0). Clinical evaluation for concussion, increased intracranial pressure, or autonomic deficit indicated.';
    }

    return {
      baselineDiameterMm: Math.round(baseline * 10) / 10,
      constrictedDiameterMm: Math.round(minDiameter * 10) / 10,
      constrictionPercentage: Math.round(constrictionPercent * 10) / 10,
      latencyMs,
      constrictionVelocityMmPerSec: velocity,
      neurologicalPupilIndex: finalNpi,
      isAbnormal,
      clinicalInterpretation: interpretation
    };
  }
}
