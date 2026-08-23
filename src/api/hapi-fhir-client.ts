/**
 * HAPI FHIR Open Cloud Sync Gateway
 * Connects directly to the global open-source public FHIR testbed: https://hapi.fhir.org/baseR4
 */
import { FHIRBundle } from '../fhir/fhir-types';

export interface FHIRSyncResult {
  success: boolean;
  statusCode: number;
  fhirServerUrl: string;
  assignedId?: string;
  errorMessage?: string;
}

export class HAPIFHIRClient {
  public static readonly PUBLIC_FHIR_SERVER = 'https://hapi.fhir.org/baseR4';

  public static async syncBundle(bundle: FHIRBundle, serverUrl: string = this.PUBLIC_FHIR_SERVER): Promise<FHIRSyncResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${serverUrl}/Bundle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json'
        },
        body: JSON.stringify(bundle),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok || response.status === 201) {
        const json = await response.json();
        return {
          success: true,
          statusCode: response.status,
          fhirServerUrl: serverUrl,
          assignedId: json.id || bundle.id
        };
      }

      return {
        success: false,
        statusCode: response.status,
        fhirServerUrl: serverUrl,
        errorMessage: `Server returned ${response.status}: ${response.statusText}`
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 0,
        fhirServerUrl: serverUrl,
        errorMessage: `Network error (offline-cached locally): ${err.message}`
      };
    }
  }
}
