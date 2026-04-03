export type ProcedureType = "brows" | "lips" | "eyes" | "other";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";
export type FollowUpStatus = "pending" | "completed" | "overdue";
export type PhotoType = "before" | "after";

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  notes?: string;
  allergies?: string;
  conditions?: string;
  diabetes: boolean;
  pregnancy: boolean;
  hypertension: boolean;
  avatarUri?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface Procedure {
  id: string;
  clientId: string;
  type: ProcedureType;
  technique: string;
  cost: number;
  notes?: string;
  date: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface Photo {
  id: string;
  procedureId: string;
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
  date: string;
  time: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface FollowUp {
  id: string;
  procedureId: string;
  clientId: string;
  dueDate: string;
  status: FollowUpStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
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
