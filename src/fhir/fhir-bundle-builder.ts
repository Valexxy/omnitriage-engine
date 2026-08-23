import { FHIRBundle, FHIRObservation } from './fhir-types';
import { LOINC_CODES } from './medical-ontologies';

export interface ClinicalVitalsPayload {
  patientId: string;
  timestampIso?: string;
  heartRateBpm: number;
  rmssdMs: number;
  respiratoryRateBpm: number;
  systolicBpMmHg: number;
  hemoglobinGPerDl: number;
  news2Score: number;
  triageBand: string;
}

export class FHIRBundleBuilder {
  public static buildBundle(payload: ClinicalVitalsPayload): FHIRBundle {
    const timestamp = payload.timestampIso || new Date().toISOString();
    const bundleId = 'bundle-omnitriage-' + Date.now();
    const observations: FHIRObservation[] = [];

    observations.push({
      resourceType: 'Observation',
      id: 'obs-hr-' + Date.now(),
      status: 'final',
      code: {
        coding: [{ system: 'http://loinc.org', code: LOINC_CODES.HEART_RATE.code, display: LOINC_CODES.HEART_RATE.display }]
      },
      subject: { reference: 'Patient/' + payload.patientId },
      effectiveDateTime: timestamp,
      valueQuantity: {
        value: payload.heartRateBpm,
        unit: 'beats/minute',
        system: 'http://unitsofmeasure.org',
        code: '/min'
      }
    });

    observations.push({
      resourceType: 'Observation',
      id: 'obs-hrv-' + Date.now(),
      status: 'final',
      code: {
        coding: [{ system: 'http://loinc.org', code: LOINC_CODES.RR_INTERVAL_HRV.code, display: LOINC_CODES.RR_INTERVAL_HRV.display }]
      },
      subject: { reference: 'Patient/' + payload.patientId },
      effectiveDateTime: timestamp,
      valueQuantity: {
        value: payload.rmssdMs,
        unit: 'milliseconds',
        system: 'http://unitsofmeasure.org',
        code: 'ms'
      }
    });

    observations.push({
      resourceType: 'Observation',
      id: 'obs-rr-' + Date.now(),
      status: 'final',
      code: {
        coding: [{ system: 'http://loinc.org', code: LOINC_CODES.RESPIRATORY_RATE.code, display: LOINC_CODES.RESPIRATORY_RATE.display }]
      },
      subject: { reference: 'Patient/' + payload.patientId },
      effectiveDateTime: timestamp,
      valueQuantity: {
        value: payload.respiratoryRateBpm,
        unit: 'breaths/minute',
        system: 'http://unitsofmeasure.org',
        code: '/min'
      }
    });

    observations.push({
      resourceType: 'Observation',
      id: 'obs-hb-' + Date.now(),
      status: 'final',
      code: {
        coding: [{ system: 'http://loinc.org', code: LOINC_CODES.HEMOGLOBIN.code, display: LOINC_CODES.HEMOGLOBIN.display }]
      },
      subject: { reference: 'Patient/' + payload.patientId },
      effectiveDateTime: timestamp,
      valueQuantity: {
        value: payload.hemoglobinGPerDl,
        unit: 'g/dL',
        system: 'http://unitsofmeasure.org',
        code: 'g/dL'
      }
    });

    observations.push({
      resourceType: 'Observation',
      id: 'obs-news2-' + Date.now(),
      status: 'final',
      code: {
        coding: [{ system: 'http://loinc.org', code: LOINC_CODES.NEWS2_SCORE.code, display: LOINC_CODES.NEWS2_SCORE.display }]
      },
      subject: { reference: 'Patient/' + payload.patientId },
      effectiveDateTime: timestamp,
      valueQuantity: {
        value: payload.news2Score,
        unit: 'score',
        system: 'http://unitsofmeasure.org',
        code: '{score}'
      },
      valueString: 'Triage Risk Band: ' + payload.triageBand
    });

    return {
      resourceType: 'Bundle',
      id: bundleId,
      type: 'collection',
      timestamp,
      entry: observations.map(obs => ({
        fullUrl: 'urn:uuid:' + obs.id,
        resource: obs
      }))
    };
  }
}
