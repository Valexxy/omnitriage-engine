/**
 * OmniTriage Engine - WHO Integrated Management of Childhood Illness (IMCI)
 * Field Triage Protocol for Infants and Children aged 2 months to 5 years.
 */

export interface WHOIMCIInput {
  ageMonths: number;
  respiratoryRateBpm: number;
  hasConvulsions: boolean;
  isUnableToDrinkOrBreastfeed: boolean;
  vomitsEverything: boolean;
  isLethargicOrUnconscious: boolean;
  hasChestIndrawing: boolean;
  hasStridorInCalmState: boolean;
  temperatureCelsius: number;
}

export type IMCIColorBand = 'PINK' | 'YELLOW' | 'GREEN';

export interface WHOIMCIResult {
  triageBand: IMCIColorBand;
  dangerSignsPresent: string[];
  diagnosisClassification: string;
  immediateFieldAction: string;
}

export class WHOIMCITriage {
  public static evaluate(input: WHOIMCIInput): WHOIMCIResult {
    const dangerSigns: string[] = [];

    if (input.hasConvulsions) dangerSigns.push('Convulsions during current illness');
    if (input.isUnableToDrinkOrBreastfeed) dangerSigns.push('Inability to drink or breastfeed');
    if (input.vomitsEverything) dangerSigns.push('Vomiting everything');
    if (input.isLethargicOrUnconscious) dangerSigns.push('Lethargic or unconscious');
    if (input.hasChestIndrawing) dangerSigns.push('Severe chest indrawing');
    if (input.hasStridorInCalmState) dangerSigns.push('Stridor in calm state');

    let fastBreathingThreshold = 40;
    if (input.ageMonths < 2) fastBreathingThreshold = 60;
    else if (input.ageMonths < 12) fastBreathingThreshold = 50;

    const hasFastBreathing = input.respiratoryRateBpm >= fastBreathingThreshold;
    const hasFever = input.temperatureCelsius >= 38.0;

    let triageBand: IMCIColorBand = 'GREEN';
    let classification = 'No Signs of Severe Pneumonia / Illness';
    let action = 'Home care advice, fluid hydration, and return for follow-up in 3 days if not improving.';

    if (dangerSigns.length > 0) {
      triageBand = 'PINK';
      classification = 'VERY SEVERE DISEASE / SEVERE PNEUMONIA';
      action = 'EMERGENCY: Give first dose of appropriate antibiotic and REFER URGENTLY to hospital.';
    } else if (hasFastBreathing) {
      triageBand = 'YELLOW';
      classification = 'PNEUMONIA';
      action = 'Give oral amoxicillin for 5 days, soothe throat, and advise mother to return in 2 days.';
    } else if (hasFever) {
      triageBand = 'YELLOW';
      classification = 'FEVER - POSSIBLE MALARIA / INFECTION';
      action = 'Perform rapid malaria test (RDT), manage fever, and follow up in 2 days.';
    }

    return {
      triageBand,
      dangerSignsPresent: dangerSigns,
      diagnosisClassification: classification,
      immediateFieldAction: action
    };
  }
}
