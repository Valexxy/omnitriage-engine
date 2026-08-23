export interface DrugSafetyAlert {
  drugName: string;
  qtcProlongationRisk: boolean;
  arrhythmiaWarning: boolean;
}

export class OpenFDAService {
  public static checkMedication(drugName: string): DrugSafetyAlert {
    const knownArrhythmics = ['azithromycin', 'hydroxychloroquine', 'haloperidol', 'amiodarone', 'citalopram'];
    const match = knownArrhythmics.includes(drugName.toLowerCase().trim());
    return {
      drugName,
      qtcProlongationRisk: match,
      arrhythmiaWarning: match
    };
  }
}
