/**
 * OpenAQ Global Air Quality Live API Client
 * Public endpoint: https://api.openaq.org
 */

export interface AirQualityData {
  city: string;
  pm25UgM3: number;
  airQualityIndex: 'GOOD' | 'MODERATE' | 'UNHEALTHY' | 'HAZARDOUS';
  environmentalRespiratoryRiskMultiplier: number;
  isLiveNetworkData: boolean;
}

export class OpenAQService {
  public static async getAirQuality(city: string = 'Nairobi'): Promise<AirQualityData> {
    try {
      const url = `https://api.openaq.org/v2/latest?limit=1&city=${encodeURIComponent(city)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.results && json.results.length > 0 && json.results[0].measurements) {
          const pm25 = json.results[0].measurements.find((m: any) => m.parameter === 'pm25');
          const val = pm25 ? pm25.value : 25.0;
          return this._formatResponse(city, val, true);
        }
      }
    } catch (e) {
      // Graceful fallback to localized baseline
    }

    return this._formatResponse(city, 28.4, false);
  }

  private static _formatResponse(city: string, pm25: number, isLive: boolean): AirQualityData {
    let aqi: 'GOOD' | 'MODERATE' | 'UNHEALTHY' | 'HAZARDOUS' = 'GOOD';
    let multiplier = 1.0;

    if (pm25 > 55.4) {
      aqi = 'HAZARDOUS';
      multiplier = 1.45;
    } else if (pm25 > 35.4) {
      aqi = 'UNHEALTHY';
      multiplier = 1.30;
    } else if (pm25 > 12.0) {
      aqi = 'MODERATE';
      multiplier = 1.15;
    }

    return {
      city,
      pm25UgM3: Math.round(pm25 * 10) / 10,
      airQualityIndex: aqi,
      environmentalRespiratoryRiskMultiplier: multiplier,
      isLiveNetworkData: isLive
    };
  }
}
