import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  age: integer("age"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  emergencyRelation: text("emergency_relation"),
  referralSource: text("referral_source"),
  fitzpatrickType: integer("fitzpatrick_type"),
  medicalConditions: text("medical_conditions"), // JSON array of condition keys
  clinicalAnswers: text("clinical_answers"), // JSON object of yes/no answers
  allergiesDetail: text("allergies_detail"),
  medicationsDetail: text("medications_detail"),
  notes: text("notes"),
  avatarUri: text("avatar_uri"),
  // Legacy
  allergies: text("allergies"),
  conditions: text("conditions"),
  diabetes: integer("diabetes", { mode: "boolean" }).notNull().default(false),
  pregnancy: integer("pregnancy", { mode: "boolean" }).notNull().default(false),
  hypertension: integer("hypertension", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  syncedAt: text("synced_at"),
});

export const procedures = sqliteTable("procedures", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id),
  type: text("type").notNull(),
  technique: text("technique").notNull(),
  zoneDetails: text("zone_details"), // JSON
  cost: real("cost").notNull(),
  guarantee: integer("guarantee", { mode: "boolean" }),
  guaranteeDays: integer("guarantee_days"),
  tones: text("tones"), // JSON: ToneEntry[]
  needles: text("needles"), // JSON: NeedleEntry[]
  notes: text("notes"),
  date: text("date").notNull(),
  followUpDate: text("follow_up_date"),
  beforePhotoId: text("before_photo_id"),
  afterPhotoId: text("after_photo_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  syncedAt: text("synced_at"),
});

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  procedureId: text("procedure_id"),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id),
  type: text("type").notNull(),
  localUri: text("local_uri").notNull(),
  remoteUrl: text("remote_url"),
  createdAt: text("created_at").notNull(),
  syncedAt: text("synced_at"),
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id),
  procedureType: text("procedure_type"),
  procedureTypes: text("procedure_types"), // JSON array of ProcedureType keys
  date: text("date").notNull(),
  time: text("time").notNull(),
  endTime: text("end_time"), // HH:mm calculated from time + duration
  duration: integer("duration"), // minutes
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  syncedAt: text("synced_at"),
});

export const followUps = sqliteTable("follow_ups", {
  id: text("id").primaryKey(),
  procedureId: text("procedure_id")
    .notNull()
    .references(() => procedures.id),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  syncedAt: text("synced_at"),
});

export const inspirations = sqliteTable("inspirations", {
  id: text("id").primaryKey(),
  category: text("category").notNull(), // "brows" | "lips" | "eyes"
  localUri: text("local_uri").notNull(),
  caption: text("caption"),
  createdAt: text("created_at").notNull(),
});

export const userProfile = sqliteTable("user_profile", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  avatarUri: text("avatar_uri"),
  biometricEnabled: integer("biometric_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  pinHash: text("pin_hash"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
