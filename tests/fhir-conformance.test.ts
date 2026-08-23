import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FHIRBundleBuilder } from '../src/fhir/fhir-bundle-builder';

describe('HL7 FHIR v4 Conformance & LOINC Validation', () => {
  it('should produce valid HL7 FHIR v4 Bundle with correct LOINC codes', () => {
    const bundle = FHIRBundleBuilder.buildBundle({
      patientId: 'patient-test-001',
      heartRateBpm: 76,
      rmssdMs: 42.5,
      respiratoryRateBpm: 16,
      systolicBpMmHg: 118,
      hemoglobinGPerDl: 14.2,
      news2Score: 0,
      triageBand: 'LOW'
    });

    assert.strictEqual(bundle.resourceType, 'Bundle');
    assert.strictEqual(bundle.type, 'collection');
    assert.strictEqual(bundle.entry.length, 5);

    // Validate LOINC codes
    const hrObs = bundle.entry.find(e => e.resource.code.coding[0].code === '8867-4');
    assert.ok(hrObs, 'Heart Rate LOINC 8867-4 must be present');
    assert.strictEqual(hrObs.resource.valueQuantity.value, 76);

    const hbObs = bundle.entry.find(e => e.resource.code.coding[0].code === '718-7');
    assert.ok(hbObs, 'Hemoglobin LOINC 718-7 must be present');
    assert.strictEqual(hbObs.resource.valueQuantity.value, 14.2);
  });
});
