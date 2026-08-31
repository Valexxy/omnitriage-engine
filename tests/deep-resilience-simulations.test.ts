import { describe, it } from 'node:test';
import assert from 'node:assert';
import { VasomotorThermalEngine } from '../src/clinical/vasomotor-thermal-engine';
import { AFibArrhythmiaDetector } from '../src/clinical/afib-arrhythmia-detector';
import { AdaptiveTemporalResampler } from '../src/engineering/adaptive-temporal-resampler';
import { CPTReimbursementEngine } from '../src/investor/cpt-reimbursement-engine';

describe('Medical Specialist, World-Class Developer & Investor Simulations', () => {
  it('[MEDICAL SIMULATION]: should compensate for cold-extremity peripheral vasoconstriction without distorting arterial age', () => {
    const coldSim = VasomotorThermalEngine.assess({
      rawPerfusionIndex: 0.65,
      rawBaRatio: -0.62,
      ambientTempCelsius: 14.0,
      redDcBaseline: 180
    });

    assert.strictEqual(coldSim.isHypothermicExtremity, true);
    assert.ok(coldSim.correctedBaRatio < -0.62, 'Should correct cold vasoconstriction tone');
    assert.ok(coldSim.clinicalGuidance.includes('Peripheral vasoconstriction detected'));
  });

  it('[MEDICAL SIMULATION]: should differentiate between benign sinus arrhythmia and chaotic Atrial Fibrillation (AFib)', () => {
    // 1. Regular Sinus Rhythm (IBI ~800ms +- 20ms)
    const normalIbi = [800, 810, 795, 805, 800, 790, 815, 800, 805, 795];
    const normalResult = AFibArrhythmiaDetector.analyzeRhythm(normalIbi);
    assert.strictEqual(normalResult.isAtrialFibrillationRisk, false);
    assert.strictEqual(normalResult.rhythmClassification, 'NORMAL_SINUS_RHYTHM');

    // 2. Chaotic Atrial Fibrillation (High entropy irregularly irregular R-R intervals)
    const afibIbi = [950, 520, 1100, 480, 890, 610, 1050, 490, 820, 560, 1150, 470];
    const afibResult = AFibArrhythmiaDetector.analyzeRhythm(afibIbi);
    assert.strictEqual(afibResult.isAtrialFibrillationRisk, true);
    assert.strictEqual(afibResult.rhythmClassification, 'ATRIAL_FIBRILLATION_SUSPECTED');
  });

  it('[ENGINEERING SIMULATION]: should resample low-end 15 FPS variable camera stream to locked 30 Hz clinical timebase', () => {
    const unevenTimes = [0, 66, 134, 200, 268, 335, 402, 469, 536, 603, 670, 737, 804, 871, 938, 1000];
    const rawValues = [100, 105, 115, 125, 120, 110, 100, 95, 98, 108, 122, 128, 118, 104, 98, 100];

    const resampled = AdaptiveTemporalResampler.resample(unevenTimes, rawValues, 30);
    assert.ok(resampled.resampledSignal.length >= 29, 'Should resample to ~30 standard points per second');
    assert.strictEqual(resampled.timebaseMs.length, resampled.resampledSignal.length);
  });

  it('[INVESTOR SIMULATION]: should calculate CPT Remote Patient Monitoring reimbursement revenue models', () => {
    const claim = CPTReimbursementEngine.mapClaim(16);
    assert.strictEqual(claim.eligibleCptCodes.length, 4);
    assert.ok(claim.totalMonthlyReimbursementPotentialUsd > 100, 'Monthly reimbursement > $100 per patient');
    assert.ok(claim.annualRecurringRevenuePer10kPatientsUsd > 10000000, 'ARR for 10k patients > $10M');
    assert.strictEqual(claim.commercializationFeasibility, 'HIGH_MARGIN_VENTURE_GRADE');
  });
});
