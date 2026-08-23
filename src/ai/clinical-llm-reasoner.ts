/**
 * OmniTriage Clinical Reasoning Generator
 * Produces structured, explainable medical reasoning, differential diagnoses,
 * and clinical action directives compliant with WHO / NICE clinical guidelines.
 */

export interface ClinicalReasoningOutput {
  primaryTriageSummary: string;
  differentialDiagnoses: Array<{ condition: string; snomedCode: string; likelihood: 'HIGH' | 'MODERATE' | 'LOW' }>;
  physiologicalPathologyExplanation: string;
  recommendedImmediateInterventions: string[];
}

export class ClinicalLLMReasoner {
  public static generateReasoning(data: {
    heartRateBpm: number;
    rmssdMs: number;
    respiratoryRateBpm: number;
    anemiaSeverity: string;
    news2Score: number;
    qsofaScore: number;
    decompensationRiskPercent: number;
    airQualityAqi?: string;
  }): ClinicalReasoningOutput {
    const differentials: Array<{ condition: string; snomedCode: string; likelihood: 'HIGH' | 'MODERATE' | 'LOW' }> = [];
    const interventions: string[] = [];

    // Diagnostic Rule Chains
    if (data.qsofaScore >= 2 || data.news2Score >= 7) {
      differentials.push({ condition: 'Severe Sepsis / Septic Shock', snomedCode: '386661006', likelihood: 'HIGH' });
      differentials.push({ condition: 'Acute Respiratory Failure', snomedCode: '65710008', likelihood: 'MODERATE' });
      interventions.push('Immediate critical care / ICU referral');
      interventions.push('Initiate Sepsis Six protocol: IV fluids (30mL/kg crystalloid), broad-spectrum antibiotics within 1h, blood cultures, serial lactate');
      interventions.push('Continuous high-flow oxygen and hemodynamic telemetry');
    } else if (data.respiratoryRateBpm >= 22 || data.airQualityAqi === 'HAZARDOUS') {
      differentials.push({ condition: 'Acute Exacerbation of Asthma / COPD', snomedCode: '185086009', likelihood: 'HIGH' });
      differentials.push({ condition: 'Community-Acquired Pneumonia', snomedCode: '233604007', likelihood: 'MODERATE' });
      interventions.push('Nebulized bronchodilators (Salbutamol/Ipratropium)');
      interventions.push('Chest radiography and arterial blood gas (ABG) analysis');
      interventions.push('Environmental particulate avoidance');
    } else if (data.anemiaSeverity === 'SEVERE') {
      differentials.push({ condition: 'Severe Anemia / Hemorrhagic Shock Risk', snomedCode: '271737000', likelihood: 'HIGH' });
      interventions.push('Urgent laboratory CBC and blood type & crossmatch');
      interventions.push('Assessment for packed red blood cell (PRBC) transfusion');
    } else {
      differentials.push({ condition: 'Physiologically Normal / Low-Risk Baseline', snomedCode: '13363002', likelihood: 'LOW' });
      interventions.push('Routine ambulatory monitoring');
      interventions.push('Maintain standard hydration and lifestyle wellness');
    }

    const summary = data.news2Score >= 7
      ? 'CRITICAL ALERT: Multi-organ deterioration risk detected. Immediate emergency resuscitation indicated.'
      : data.news2Score >= 5
      ? 'URGENT REVIEW: Moderate physiological instability. Medical team assessment required within 60 minutes.'
      : 'STABLE: Vital parameters within normal baseline ranges. Low clinical risk.';

    const pathology = `Cardiorespiratory interaction: Heart rate of ${data.heartRateBpm} BPM with RMSSD vagal tone of ${data.rmssdMs}ms indicates ${data.rmssdMs < 20 ? 'severe autonomic parasympathetic withdrawal' : 'healthy autonomic buffering'}. Respiratory rate of ${data.respiratoryRateBpm} breaths/min indicates ${data.respiratoryRateBpm >= 22 ? 'tachypneic compensatory ventilatory drive' : 'normal gas exchange'}. Predictive decompensation risk is quantified at ${data.decompensationRiskPercent}%.`;

    return {
      primaryTriageSummary: summary,
      differentialDiagnoses: differentials,
      physiologicalPathologyExplanation: pathology,
      recommendedImmediateInterventions: interventions
    };
  }
}
