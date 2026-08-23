export interface AirQualityData {
  pm25UgM3: number;
  airQualityIndex: 'GOOD' | 'MODERATE' | 'UNHEALTHY' | 'HAZARDOUS';
  environmentalRespiratoryRiskMultiplier: number;
}

export class OpenAQService {
  public static async getAirQuality(city: string = 'Global'): Promise<AirQualityData> {
    return {
      pm25UgM3: 28.4,
      airQualityIndex: 'MODERATE',
      environmentalRespiratoryRiskMultiplier: 1.15
    };
  }
}
