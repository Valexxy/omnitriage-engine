"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const news2_triage_1 = require("../src/triage/news2-triage");
const qsofa_sepsis_1 = require("../src/triage/qsofa-sepsis");
const who_imci_1 = require("../src/triage/who-imci");
const predictive_decompensation_1 = require("../src/triage/predictive-decompensation");
(0, node_test_1.describe)('Clinical Decision Support & Multi-Triage Scoring', () => {
    (0, node_test_1.it)('should correctly score a normal healthy adult as NEWS2 Low Risk (Score 0)', () => {
        const result = news2_triage_1.NEWS2Triage.calculate({
            respirationRateBpm: 16,
            spO2Percent: 98,
            onSupplementalOxygen: false,
            systolicBpMmHg: 120,
            pulseRateBpm: 70,
            consciousness: 'ALERT',
            temperatureCelsius: 36.8
        });
        node_assert_1.default.strictEqual(result.totalScore, 0);
        node_assert_1.default.strictEqual(result.riskBand, 'LOW');
    });
    (0, node_test_1.it)('should trigger EMERGENCY HIGH RISK when NEWS2 >= 7 on severe decompensation', () => {
        const result = news2_triage_1.NEWS2Triage.calculate({
            respirationRateBpm: 26,
            spO2Percent: 88,
            onSupplementalOxygen: true,
            systolicBpMmHg: 85,
            pulseRateBpm: 135,
            consciousness: 'CONFUSION',
            temperatureCelsius: 39.5
        });
        node_assert_1.default.ok(result.totalScore >= 7, 'Expected score >= 7');
        node_assert_1.default.strictEqual(result.riskBand, 'HIGH');
    });
    (0, node_test_1.it)('should flag qSOFA >= 2 as critical sepsis alert', () => {
        const qsofa = qsofa_sepsis_1.QSOFATriage.evaluate({
            respiratoryRateBpm: 24,
            systolicBpMmHg: 95,
            alteredMentation: true
        });
        node_assert_1.default.strictEqual(qsofa.score, 3);
        node_assert_1.default.strictEqual(qsofa.sepsisHighRisk, true);
        node_assert_1.default.strictEqual(qsofa.inHospitalMortalityRisk, 'HIGH');
    });
    (0, node_test_1.it)('should trigger WHO IMCI PINK band emergency for child with danger signs', () => {
        const imci = who_imci_1.WHOIMCITriage.evaluate({
            ageMonths: 18,
            respiratoryRateBpm: 55,
            hasConvulsions: true,
            isUnableToDrinkOrBreastfeed: true,
            vomitsEverything: false,
            isLethargicOrUnconscious: false,
            hasChestIndrawing: true,
            hasStridorInCalmState: false,
            temperatureCelsius: 39.0
        });
        node_assert_1.default.strictEqual(imci.triageBand, 'PINK');
        node_assert_1.default.ok(imci.dangerSignsPresent.length >= 2);
    });
    (0, node_test_1.it)('should predict 4-6h decompensation risk on severe multi-biomarker collapse', () => {
        const pred = predictive_decompensation_1.PredictiveDecompensation.predict({
            heartRateBpm: 125,
            rmssdMs: 11,
            stressIndex: 520,
            bOverARatio: -0.1,
            respiratoryRateBpm: 28,
            anemiaHbGPerDl: 6.8,
            sqiScore: 92
        });
        node_assert_1.default.strictEqual(pred.earlyWarningBand, 'IMMINENT_COLLAPSE');
        node_assert_1.default.strictEqual(pred.fourHourTrajectoryWarning, true);
        node_assert_1.default.ok(pred.decompensationRiskScore >= 70);
    });
});
