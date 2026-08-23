import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NEWS2Triage } from '../src/triage/news2-triage';
import { QSOFATriage } from '../src/triage/qsofa-sepsis';
import { WHOIMCITriage } from '../src/triage/who-imci';
import { PredictiveDecompensation } from '../src/triage/predictive-decompensation';

describe('Clinical Decision Support & Multi-Triage Scoring', () => {
  it('should correctly score a normal healthy adult as NEWS2 Low Risk (Score 0)', () => {
    const result = NEWS2Triage.calculate({
      respirationRateBpm: 16,
      spO2Percent: 98,
      onSupplementalOxygen: false,
      systolicBpMmHg: 120,
      pulseRateBpm: 70,
      consciousness: 'ALERT',
      temperatureCelsius: 36.8
    });

    assert.strictEqual(result.totalScore, 0);
    assert.strictEqual(result.riskBand, 'LOW');
  });

  it('should trigger EMERGENCY HIGH RISK when NEWS2 >= 7 on severe decompensation', () => {
    const result = NEWS2Triage.calculate({
      respirationRateBpm: 26,
      spO2Percent: 88,
      onSupplementalOxygen: true,
      systolicBpMmHg: 85,
      pulseRateBpm: 135,
      consciousness: 'CONFUSION',
      temperatureCelsius: 39.5
    });

    assert.ok(result.totalScore >= 7, 'Expected score >= 7');
    assert.strictEqual(result.riskBand, 'HIGH');
  });

  it('should flag qSOFA >= 2 as critical sepsis alert', () => {
    const qsofa = QSOFATriage.evaluate({
      respiratoryRateBpm: 24,
      systolicBpMmHg: 95,
      alteredMentation: true
    });

    assert.strictEqual(qsofa.score, 3);
    assert.strictEqual(qsofa.sepsisHighRisk, true);
    assert.strictEqual(qsofa.inHospitalMortalityRisk, 'HIGH');
  });

  it('should trigger WHO IMCI PINK band emergency for child with danger signs', () => {
    const imci = WHOIMCITriage.evaluate({
      ageMonths: 18,
      respiratoryRateBpm: 55,
      hasConvulsions: true,
      isUnableToDrinkOrBreastfeed: true,
      vomitsEverything: false,
      isLethargicOrUnconscious: false,
      hasChestIndrawing: true,
      hasStridorInCalmState: false,
      temperatureCelsius: 39.0
    });

    assert.strictEqual(imci.triageBand, 'PINK');
    assert.ok(imci.dangerSignsPresent.length >= 2);
  });

  it('should predict 4-6h decompensation risk on severe multi-biomarker collapse', () => {
    const pred = PredictiveDecompensation.predict({
      heartRateBpm: 125,
      rmssdMs: 11,
      stressIndex: 520,
      bOverARatio: -0.1,
      respiratoryRateBpm: 28,
      anemiaHbGPerDl: 6.8,
      sqiScore: 92
    });

    assert.strictEqual(pred.earlyWarningBand, 'IMMINENT_COLLAPSE');
    assert.strictEqual(pred.fourHourTrajectoryWarning, true);
    assert.ok(pred.decompensationRiskScore >= 70);
  });
});
