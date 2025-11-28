import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Document template types
export type Align = "left" | "center" | "right";
export type FieldType = "text" | "image" | "table";

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  value?: string;
  dataUrl?: string;
  rows?: string[][];
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  align?: Align;
}

export interface TableItem {
  id: string;
  rows: string[][];
  x: number;
  y: number;
  w: number;
  h: number;
  headerRow?: boolean;
  borderStyle?: "none" | "light" | "full";
}

export interface HistoryState {
  fields: Field[];
  tables: TableItem[];
  timestamp: number;
  description: string;
}

export interface Template {
  id: string;
  title: string;
  fields: Field[];
  tables: TableItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Database tables for persistence
export const templates = pgTable("templates", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  fields: jsonb("fields").notNull().$type<Field[]>(),
  tables: jsonb("tables").notNull().$type<TableItem[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type SelectTemplate = typeof templates.$inferSelect;

// Uploaded documents for preview/parsing
export const uploadedDocuments = pgTable("uploaded_documents", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  fileData: text("file_data").notNull(),
  parsedContent: jsonb("parsed_content").$type<{
    text: string;
    html?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUploadedDocumentSchema = createInsertSchema(
  uploadedDocuments,
).omit({
  id: true,
  createdAt: true,
});

export type InsertUploadedDocument = z.infer<
  typeof insertUploadedDocumentSchema
>;
export type SelectUploadedDocument = typeof uploadedDocuments.$inferSelect;

// Constants for editor
export const GRID = 8;
export const PAGE_W = 794;
export const PAGE_H = 1123;
export const SAFE_MARGIN = 24;
