"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const apg_vascular_engine_1 = require("../src/dsp/apg-vascular-engine");
const anemia_spectro_engine_1 = require("../src/dsp/anemia-spectro-engine");
(0, node_test_1.describe)('APG Vascular Age & Anemia Spectrophotometry', () => {
    (0, node_test_1.it)('should compute second derivative and extract valid b/a ratio', () => {
        const samplingRate = 30;
        const ppgWave = [];
        for (let i = 0; i < 60; i++) {
            const t = i / samplingRate;
            ppgWave.push(Math.sin(2 * Math.PI * 1.2 * t) + 0.25 * Math.sin(2 * Math.PI * 2.4 * t));
        }
        const apgResult = apg_vascular_engine_1.APGVascularEngine.analyze(ppgWave, 40, samplingRate);
        node_assert_1.default.ok(apgResult.bOverARatio !== undefined, 'b/a ratio should be defined');
        node_assert_1.default.ok(apgResult.estimatedVascularAgeYears >= 18 && apgResult.estimatedVascularAgeYears <= 90, 'Vascular age within bounds');
        node_assert_1.default.ok(apgResult.vascularElasticityIndex >= 0 && apgResult.vascularElasticityIndex <= 100, 'VEI within 0-100');
    });
    (0, node_test_1.it)('should accurately grade severe anemia (Hb < 8.0 g/dL) and trigger transfusion alert', () => {
        // Pale conjunctiva (low red relative to green/blue)
        const paleResult = anemia_spectro_engine_1.AnemiaSpectroEngine.analyze(110, 105, 95);
        node_assert_1.default.strictEqual(paleResult.severity, 'SEVERE');
        node_assert_1.default.strictEqual(paleResult.transfusionThresholdAlert, true);
        node_assert_1.default.ok(paleResult.estimatedHbGPerDl < 8.0, 'Hb should be < 8.0 g/dL');
        // Healthy pink/red conjunctiva
        const healthyResult = anemia_spectro_engine_1.AnemiaSpectroEngine.analyze(195, 80, 70);
        node_assert_1.default.strictEqual(healthyResult.severity, 'NORMAL');
        node_assert_1.default.strictEqual(healthyResult.transfusionThresholdAlert, false);
        node_assert_1.default.ok(healthyResult.estimatedHbGPerDl >= 12.0, 'Hb should be normal');
    });
});
