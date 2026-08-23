export class WHOGHOService {
  public static getRegionalMortalityBaseline(regionCode: string = 'AFRO'): { maternalMortalityPer100k: number, cvdMortalityRiskPercent: number } {
    return {
      maternalMortalityPer100k: 545,
      cvdMortalityRiskPercent: 21.4
    };
  }
}
