import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes"),
  allergies: text("allergies"),
  conditions: text("conditions"),
  diabetes: integer("diabetes", { mode: "boolean" }).notNull().default(false),
  pregnancy: integer("pregnancy", { mode: "boolean" }).notNull().default(false),
  hypertension: integer("hypertension", { mode: "boolean" })
    .notNull()
    .default(false),
  avatarUri: text("avatar_uri"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  syncedAt: text("synced_at"),
});

export const procedures = sqliteTable("procedures", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id),
  type: text("type").notNull(), // 'brows' | 'lips' | 'eyes' | 'other'
  technique: text("technique").notNull(),
  cost: real("cost").notNull(),
  notes: text("notes"),
  date: text("date").notNull(),
  followUpDate: text("follow_up_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  syncedAt: text("synced_at"),
});

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  procedureId: text("procedure_id")
    .notNull()
    .references(() => procedures.id),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id),
  type: text("type").notNull(), // 'before' | 'after'
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
  date: text("date").notNull(),
  time: text("time").notNull(),
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
