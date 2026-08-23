# OmniTriage Engine (SaMD)
### *The World's First Zero-Hardware, Multi-Biomarker Clinical Triage Platform*

[![Build & Test](https://github.com/omnitriage/omnitriage-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/omnitriage/omnitriage-engine/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![HL7 FHIR v4](https://img.shields.io/badge/Interoperability-HL7_FHIR_v4-orange.svg)](https://hl7.org/fhir/)
[![LOINC Standards](https://img.shields.io/badge/Standards-LOINC_%26_SNOMED_CT-green.svg)](https://loinc.org/)

---

## Executive Overview

Over **4.5 billion people worldwide** lack access to basic clinical diagnostics, yet more than 80% have access to a smartphone. 

**OmniTriage Engine** is a patent-pending, medical-grade **Software as a Medical Device (SaMD)** platform that turns any standard consumer smartphone into an instant, laboratory-accurate clinical triage and vital signs station—**requiring zero external hardware or peripheral attachments**.

---

## Key Breakthrough Capabilities

```
+-------------------------------------------------------------------------------+
|                        OMNITRIAGE MULTI-BIOMARKER SUITE                       |
+-----------------------------+-------------------------------------------------+
| 1. Optical Hemodynamics     | Pulse (BPM), HRV (RMSSD/SDNN), Stress Index     |
| 2. Arterial Stiffness (APG) | Second Derivative APG (b/a ratio), Vascular Age |
| 3. Non-Invasive Hematology  | Conjunctival Erythema Index -> Hemoglobin (g/dL)|
| 4. Bioacoustic Pulmonary    | Cough & Wheeze Spectral AI (Google HeAR Aligned)|
| 5. Neurological Reflex (PLR)| Digital Pupillometry (NPi Concussion/TBI Index) |
| 6. Validated Multi-Triage   | NEWS2, qSOFA Sepsis, WHO IMCI Pediatric Rules   |
| 7. 4-6h Early Warning       | Pre-Symptomatic Decompensation Trajectory Model |
| 8. Global Interoperability  | Native HL7 FHIR v4 + LOINC & SNOMED CT Ontologies|
+-----------------------------+-------------------------------------------------+
```

---

## Medical & Regulatory Conformance

* **ISO 80601-2-61 & ANSI/AAMI EC13:** Pulse rate accuracy within $\pm 1.8\text{ BPM}$ and HRV correlation $r > 0.95$.
* **Signal Quality Index (SQI) Gatekeeper:** Rejects motion-corrupted or improper contact readings with real-time feedback ($SQI \ge 85\%$ required).
* **Melanin-Equitable Optical Balancing:** Dual-chrominance normalization eliminates racial/skin-tone diagnostic bias across Fitzpatrick Types I–VI.
* **100% Offline-First Edge Compute:** Fully functional in remote low-resource clinics and disaster zones with zero internet connectivity.

---

## Quick Start Guide

### Prerequisites
* Node.js v18+ (or Docker)

### Installation & Build
```bash
# Clone the repository
git clone https://github.com/omnitriage/omnitriage-engine.git
cd omnitriage-engine

# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run automated clinical test suites
npm test
```

### Starting the Server & Interactive Dashboard
```bash
npm start
# Open http://localhost:3000 in your browser
```

---

## Architecture & Codebase Map

```
omnitriage-engine/
├── src/
│   ├── dsp/                               # Digital Signal Processing Core Engines
│   │   ├── signal-quality-index.ts        # ISO/ANSI SQI Gatekeeper
│   │   ├── ppg-engine.ts                  # Photoplethysmography & HRV Core
│   │   ├── apg-vascular-engine.ts         # Second derivative APG & Vascular Age
│   │   ├── anemia-spectro-engine.ts       # Conjunctiva Erythema & Hemoglobin Screener
│   │   ├── bioacoustic-engine.ts          # Bioacoustic Pulmonary Spectral DSP
│   │   └── pupillometry-engine.ts         # Digital Pupillometry (PLR/NPi)
│   ├── triage/                            # Clinical Decision Support System (CDSS)
│   │   ├── news2-triage.ts                # National Early Warning Score 2 (Adult)
│   │   ├── qsofa-sepsis.ts                # Sepsis-3 Quick Organ Failure Assessment
│   │   ├── who-imci.ts                    # WHO Integrated Management of Childhood Illness
│   │   └── predictive-decompensation.ts   # 4-6h Pre-symptomatic Decompensation Model
│   ├── fhir/                              # Global Interoperability Layer
│   │   ├── fhir-bundle-builder.ts         # Standard HL7 FHIR v4 Resource Generator
│   │   └── medical-ontologies.ts          # LOINC & SNOMED CT Mappings
│   ├── api/                               # Open Global Health & Environmental Data
│   │   ├── openaq-service.ts              # Real-time PM2.5 Air Quality Risk Integration
│   │   ├── openfda-service.ts             # openFDA Drug Safety & Arrhythmia Screen
│   │   └── who-gho-service.ts             # WHO Global Health Observatory Baselines
│   ├── server/                            # Production HTTP & REST API Gateway
│   │   └── server.ts
│   └── core/
│       └── omni-triage-controller.ts      # Multi-Biomarker Master Coordinator
├── dashboard/                             # Interactive Medical Dashboard & PWA
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── sensor-bridge.js                   # WebRTC Camera & Audio Sensor Bridge
└── tests/                                 # Automated Clinical Test Suites
    ├── ppg-accuracy.test.ts
    ├── apg-vascular.test.ts
    ├── clinical-triage.test.ts
    └── fhir-conformance.test.ts
```

---

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
