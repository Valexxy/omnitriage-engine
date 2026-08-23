/**
 * HL7 FHIR v4 Resource Interfaces
 */
export interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: 'final' | 'preliminary';
  category?: Array<{
    coding: Array<{ system: string; code: string; display: string }>;
  }>;
  code: {
    coding: Array<{ system: string; code: string; display: string }>;
    text?: string;
  };
  subject: { reference: string };
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  valueString?: string;
  interpretation?: Array<{
    coding: Array<{ system: string; code: string; display: string }>;
  }>;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'collection' | 'transaction';
  timestamp: string;
  entry: Array<{
    fullUrl: string;
    resource: FHIRObservation | any;
  }>;
}
