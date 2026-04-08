export type ProcedureType = "brows" | "lips" | "eyes" | "other";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";
export type FollowUpStatus = "pending" | "completed" | "overdue";
export type PhotoType = "before" | "after";
export type FitzpatrickType = 1 | 2 | 3 | 4 | 5 | 6;

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  age?: number;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  referralSource?: string;
  fitzpatrickType?: FitzpatrickType;
  // Clinical conditions (JSON stringified array of keys)
  medicalConditions?: string;
  // Clinical yes/no questions (JSON stringified object)
  clinicalAnswers?: string;
  // Free text fields
  allergiesDetail?: string;
  medicationsDetail?: string;
  notes?: string;
  avatarUri?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;

  // Legacy fields (kept for backward compat)
  allergies?: string;
  conditions?: string;
  diabetes?: boolean;
  pregnancy?: boolean;
  hypertension?: boolean;
}

export interface ToneEntry {
  color: string;
  drops: number;
}

export interface NeedleEntry {
  type: string; // RM, RL, M1, F, etc.
  gauge: string; // 03, 05, 08, etc.
  count: number; // number of needles
}

export interface Procedure {
  id: string;
  clientId: string;
  type: ProcedureType;
  technique: string;
  // Zone details (JSON stringified - e.g. {"ojos": ["parpado_superior"]})
  zoneDetails?: string;
  cost: number;
  guarantee?: boolean;
  guaranteeDays?: number;
  // Tones used (JSON stringified ToneEntry[])
  tones?: string;
  // Needles used (JSON stringified NeedleEntry[])
  needles?: string;
  notes?: string;
  date: string;
  followUpDate?: string;
  beforePhotoId?: string;
  afterPhotoId?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface Photo {
  id: string;
  procedureId?: string;
  clientId: string;
  type: PhotoType;
  localUri: string;
  remoteUrl?: string;
  createdAt: string;
  syncedAt?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  procedureType?: ProcedureType;
  procedureTypes?: string; // JSON array of ProcedureType keys
  date: string;
  time: string;
  endTime?: string; // HH:mm
  duration?: number; // minutes
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface FollowUp {
  id: string;
  procedureId?: string;
  appointmentId?: string;
  clientId: string;
  dueDate: string;
  status: FollowUpStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export type InspirationCategory = "brows" | "lips" | "eyes";

export interface Inspiration {
  id: string;
  category: InspirationCategory;
  localUri: string;
  caption?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarUri?: string;
  biometricEnabled: boolean;
  pinHash?: string;
  createdAt: string;
  updatedAt: string;
}
