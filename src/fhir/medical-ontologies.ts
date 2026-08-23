/**
 * Global Clinical Coding Ontologies (LOINC & SNOMED CT)
 */
export const LOINC_CODES = {
  HEART_RATE: { code: '8867-4', display: 'Heart rate' },
  RR_INTERVAL_HRV: { code: '80404-7', display: 'R-R interval.standard deviation' },
  RESPIRATORY_RATE: { code: '9279-1', display: 'Respiratory rate' },
  OXYGEN_SATURATION: { code: '2708-6', display: 'Oxygen saturation in Arterial blood' },
  SYSTOLIC_BP: { code: '8480-6', display: 'Systolic blood pressure' },
  HEMOGLOBIN: { code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood' },
  NEWS2_SCORE: { code: '96514-5', display: 'National Early Warning Score 2' },
  WELLBEING_INDEX: { code: '75282-4', display: 'WHO-5 Well-Being Index' }
};

export const SNOMED_CODES = {
  ATRIAL_FIBRILLATION: { code: '49436004', display: 'Atrial fibrillation' },
  SEPSIS: { code: '386661006', display: 'Sepsis' },
  ANEMIA: { code: '271737000', display: 'Anemia' },
  PNEUMONIA: { code: '233604007', display: 'Pneumonia' },
  TACHYPNEA: { code: '271823003', display: 'Tachypnea' },
  STRIDOR: { code: '70407001', display: 'Stridor' }
};
