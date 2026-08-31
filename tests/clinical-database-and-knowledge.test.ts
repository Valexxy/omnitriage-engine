import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EncryptedClinicalVault } from '../src/database/encrypted-clinical-vault';
import { RealtimeMedicalLibrary } from '../src/knowledge/realtime-medical-library';

describe('Encrypted Clinical Database & Real-Time Medical Knowledge Library', () => {
  it('should cross-reference patient vitals against WHO, NICE, and AHA guidelines and generate ICD-10 / SNOMED-CT codes', () => {
    // 1. Healthy encounter test
    const healthyAnalysis = RealtimeMedicalLibrary.analyzeEncounter({
      heartRateBpm: 72,
      hrvRmssdMs: 48.0,
      hemoglobinGPerDl: 14.2,
      news2Score: 0,
      qsofaScore: 0
    });

    assert.ok(healthyAnalysis.icd10DiagnosisCodes.some(c => c.code === 'Z00.00'), 'Should assign general examination code');
    assert.strictEqual(healthyAnalysis.longitudinalRiskTrend, 'STABLE');

    // 2. Severe sepsis & anemia encounter test
    const severeAnalysis = RealtimeMedicalLibrary.analyzeEncounter({
      heartRateBpm: 135,
      hrvRmssdMs: 12.0,
      hemoglobinGPerDl: 6.5,
      news2Score: 9,
      qsofaScore: 2,
      history: [{ heartRateBpm: 80, news2Score: 1, timestampIso: new Date().toISOString() }]
    });

    assert.ok(severeAnalysis.icd10DiagnosisCodes.some(c => c.code === 'A41.9'), 'Should assign Sepsis code');
    assert.ok(severeAnalysis.icd10DiagnosisCodes.some(c => c.code === 'D64.9'), 'Should assign Severe Anemia code');
    assert.ok(severeAnalysis.snomedCtConcepts.some(c => c.conceptId === '386661006'), 'Should assign Sepsis SNOMED term');
    assert.strictEqual(severeAnalysis.longitudinalRiskTrend, 'DETERIORATING');
    assert.ok(severeAnalysis.clinicalGuidelineReferences.some(g => g.source.includes('Surviving Sepsis')));
  });

  it('should initialize EncryptedClinicalVault and return empty or stored array safely', () => {
    const records = EncryptedClinicalVault.getAllEncounters();
    assert.ok(Array.isArray(records), 'Should return array of records');
  });
});
