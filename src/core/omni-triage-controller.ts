import { PPGEngine, PPGAnalysisResult } from '../dsp/ppg-engine';
import { APGVascularEngine, APGWaveformFeatures } from '../dsp/apg-vascular-engine';
import { AnemiaSpectroEngine, AnemiaAnalysisResult } from '../dsp/anemia-spectro-engine';
import { BioacousticEngine, BioacousticFeatures } from '../dsp/bioacoustic-engine';
import { PupillometryEngine, PupillometryResult } from '../dsp/pupillometry-engine';
import { NEWS2Triage, NEWS2Result } from '../triage/news2-triage';
import { QSOFATriage, qSOFAResult } from '../triage/qsofa-sepsis';
import { WHOIMCITriage, WHOIMCIResult } from '../triage/who-imci';
import { PredictiveDecompensation, PredictiveDecompensationResult } from '../triage/predictive-decompensation';
import { FHIRBundleBuilder } from '../fhir/fhir-bundle-builder';
import { FHIRBundle } from '../fhir/fhir-types';

export interface ComprehensivePatientInput {
  patientId: string;
  ageYears: number;
  isChildUnder5?: boolean;
  rawPpgSignal: number[];
  rgbColorValues: { r: number; g: number; b: number };
  rawAudioSamples?: number[];
  pupilTimeSeries?: number[];
  systolicBpEstimate?: number;
  temperatureCelsius?: number;
  consciousness?: 'ALERT' | 'CONFUSION' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
}

export interface ComprehensiveTriageReport {
  patientId: string;
  timestamp: string;
  signalQualityValid: boolean;
  ppg: PPGAnalysisResult;
  vascular: APGWaveformFeatures;
  anemia: AnemiaAnalysisResult;
  acoustics: BioacousticFeatures;
  pupillometry: PupillometryResult;
  news2: NEWS2Result;
  qsofa: qSOFAResult;
  whoImci?: WHOIMCIResult;
  predictiveDecompensation: PredictiveDecompensationResult;
  fhirBundle: FHIRBundle;
}

export class OmniTriageController {
  private ppgEngine: PPGEngine;

  constructor(samplingRateHz: number = 30) {
    this.ppgEngine = new PPGEngine(samplingRateHz);
  }

  public runFullTriage(input: ComprehensivePatientInput): ComprehensiveTriageReport {
    const ppg = this.ppgEngine.analyze(input.rawPpgSignal);
    const vascular = APGVascularEngine.analyze(ppg.filteredSignal, input.ageYears);
    const anemia = AnemiaSpectroEngine.analyze(input.rgbColorValues.r, input.rgbColorValues.g, input.rgbColorValues.b);
    const acoustics = BioacousticEngine.analyze(input.rawAudioSamples || []);
    const pupillometry = PupillometryEngine.analyze(input.pupilTimeSeries || []);

    const systolicBp = input.systolicBpEstimate || 120;
    const temp = input.temperatureCelsius || 37.0;
    const consciousness = input.consciousness || 'ALERT';

    const news2 = NEWS2Triage.calculate({
      respirationRateBpm: acoustics.respiratoryRateBpm,
      spO2Percent: 98,
      onSupplementalOxygen: false,
      systolicBpMmHg: systolicBp,
      pulseRateBpm: ppg.heartRateBpm || 75,
      consciousness,
      temperatureCelsius: temp
    });

    const qsofa = QSOFATriage.evaluate({
      respiratoryRateBpm: acoustics.respiratoryRateBpm,
      systolicBpMmHg: systolicBp,
      alteredMentation: consciousness !== 'ALERT'
    });

    let whoImci: WHOIMCIResult | undefined;
    if (input.isChildUnder5 || input.ageYears < 5) {
      whoImci = WHOIMCITriage.evaluate({
        ageMonths: Math.round(input.ageYears * 12),
        respiratoryRateBpm: acoustics.respiratoryRateBpm,
        hasConvulsions: false,
        isUnableToDrinkOrBreastfeed: false,
        vomitsEverything: false,
        isLethargicOrUnconscious: consciousness !== 'ALERT',
        hasChestIndrawing: false,
        hasStridorInCalmState: acoustics.stridorDetected,
        temperatureCelsius: temp
      });
    }

    const predictiveDecompensation = PredictiveDecompensation.predict({
      heartRateBpm: ppg.heartRateBpm || 75,
      rmssdMs: ppg.hrv.rmssdMs,
      stressIndex: ppg.hrv.stressIndex,
      bOverARatio: vascular.bOverARatio,
      respiratoryRateBpm: acoustics.respiratoryRateBpm,
      anemiaHbGPerDl: anemia.estimatedHbGPerDl,
      sqiScore: ppg.sqi.overallScore
    });

    const fhirBundle = FHIRBundleBuilder.buildBundle({
      patientId: input.patientId,
      heartRateBpm: ppg.heartRateBpm || 75,
      rmssdMs: ppg.hrv.rmssdMs,
      respiratoryRateBpm: acoustics.respiratoryRateBpm,
      systolicBpMmHg: systolicBp,
      hemoglobinGPerDl: anemia.estimatedHbGPerDl,
      news2Score: news2.totalScore,
      triageBand: news2.riskBand
    });

    return {
      patientId: input.patientId,
      timestamp: new Date().toISOString(),
      signalQualityValid: ppg.sqi.isValid,
      ppg,
      vascular,
      anemia,
      acoustics,
      pupillometry,
      news2,
      qsofa,
      whoImci,
      predictiveDecompensation,
      fhirBundle
    };
  }
}
