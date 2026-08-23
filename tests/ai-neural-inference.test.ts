import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NeuralTriageAI } from '../src/ai/neural-triage-ai';
import { ClinicalLLMReasoner } from '../src/ai/clinical-llm-reasoner';

describe('On-Device Neural Network AI & Clinical Reasoner', () => {
  it('should run forward-pass neural tensor inference and output calibrated risk probabilities', () => {
    const result = NeuralTriageAI.predict({
      normalizedHeartRate: 0.15,
      normalizedRmssd: 0.48,
      normalizedVascularRatio: 0.25,
      normalizedRespiratoryRate: 0.12,
      normalizedHemoglobin: 0.65,
      acousticWheezeEnergy: 0.05
    });

    assert.ok(result.decompensationProbability >= 0 && result.decompensationProbability <= 1.0, 'Decomp prob within [0,1]');
    assert.ok(result.sepsisLatentRisk >= 0 && result.sepsisLatentRisk <= 1.0, 'Sepsis risk within [0,1]');
    assert.strictEqual(result.latentEmbedding.length, 8, 'Should produce 8-dimensional latent vector');
    assert.strictEqual(result.neuralConfidence, 0.94);
  });

  it('should generate structured clinical reasoning and differential diagnosis for acute shock', () => {
    const output = ClinicalLLMReasoner.generateReasoning({
      heartRateBpm: 135,
      rmssdMs: 12,
      respiratoryRateBpm: 26,
      anemiaSeverity: 'SEVERE',
      news2Score: 8,
      qsofaScore: 2,
      decompensationRiskPercent: 85
    });

    assert.ok(output.primaryTriageSummary.includes('CRITICAL ALERT'), 'Summary should flag critical alert');
    assert.ok(output.differentialDiagnoses.some(d => d.condition.includes('Sepsis')), 'Should identify sepsis differential');
    assert.ok(output.recommendedImmediateInterventions.length >= 2, 'Should provide clinical intervention steps');
  });
});
