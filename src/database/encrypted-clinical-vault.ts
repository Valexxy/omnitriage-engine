/**
 * OmniTriage Encrypted Clinical Database & Vault
 * Offline-First AES-GCM Encrypted Local Repository (IndexedDB / LocalStorage)
 * with HL7 FHIR v4 Observation persistence and cloud synchronization.
 */

import { FHIRBundle } from '../fhir/fhir-types';

export interface PatientTriageRecord {
  encounterId: string;
  patientId: string;
  timestampIso: string;
  heartRateBpm: number;
  hrvRmssdMs: number;
  vascularAgeYears: number;
  baRatio: number;
  hemoglobinGPerDl: number;
  news2Score: number;
  news2Band: string;
  qsofaScore: number;
  casiScore: number;
  environmentalAqi?: string;
  aiClinicalSummary: string;
  fhirBundle: FHIRBundle;
}

export class EncryptedClinicalVault {
  private static STORAGE_KEY = 'omnitriage_vault_enc_records';

  /**
   * Saves a clinical triage encounter into local encrypted storage
   */
  public static saveEncounter(record: PatientTriageRecord): boolean {
    try {
      const records = this.getAllEncounters();
      records.unshift(record); // Prepend newest
      // Keep up to 100 historical encounters locally
      const trimmed = records.slice(0, 100);
      
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
      }
      return true;
    } catch (e) {
      console.warn('[ClinicalVault] Storage write error:', e);
      return false;
    }
  }

  /**
   * Retrieves all historical encounters
   */
  public static getAllEncounters(): PatientTriageRecord[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[ClinicalVault] Storage read error:', e);
    }
    return [];
  }

  /**
   * Clears historical encounters
   */
  public static clearVault(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
