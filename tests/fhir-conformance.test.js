"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const fhir_bundle_builder_1 = require("../src/fhir/fhir-bundle-builder");
(0, node_test_1.describe)('HL7 FHIR v4 Conformance & LOINC Validation', () => {
    (0, node_test_1.it)('should produce valid HL7 FHIR v4 Bundle with correct LOINC codes', () => {
        const bundle = fhir_bundle_builder_1.FHIRBundleBuilder.buildBundle({
            patientId: 'patient-test-001',
            heartRateBpm: 76,
            rmssdMs: 42.5,
            respiratoryRateBpm: 16,
            systolicBpMmHg: 118,
            hemoglobinGPerDl: 14.2,
            news2Score: 0,
            triageBand: 'LOW'
        });
        node_assert_1.default.strictEqual(bundle.resourceType, 'Bundle');
        node_assert_1.default.strictEqual(bundle.type, 'collection');
        node_assert_1.default.strictEqual(bundle.entry.length, 5);
        // Validate LOINC codes
        const hrObs = bundle.entry.find(e => e.resource.code.coding[0].code === '8867-4');
        node_assert_1.default.ok(hrObs, 'Heart Rate LOINC 8867-4 must be present');
        node_assert_1.default.strictEqual(hrObs.resource.valueQuantity.value, 76);
        const hbObs = bundle.entry.find(e => e.resource.code.coding[0].code === '718-7');
        node_assert_1.default.ok(hbObs, 'Hemoglobin LOINC 718-7 must be present');
        node_assert_1.default.strictEqual(hbObs.resource.valueQuantity.value, 14.2);
    });
});
