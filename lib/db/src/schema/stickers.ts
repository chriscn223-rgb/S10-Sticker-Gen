import { pgTable, text, serial, timestamp, integer, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stickersTable = pgTable("stickers", {
  id: serial("id").primaryKey(),
  vin: text("vin").notNull(),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim").notNull(),
  engine: text("engine").notNull(),
  engineDisplacement: text("engine_displacement"),
  engineCylinders: integer("engine_cylinders"),
  horsepower: integer("horsepower"),
  torque: integer("torque"),
  transmission: text("transmission").notNull(),
  drivetrain: text("drivetrain").notNull(),
  cabConfig: text("cab_config").notNull(),
  bodyStyle: text("body_style"),
  assemblyPlant: text("assembly_plant"),
  exteriorColor: text("exterior_color"),
  interiorColor: text("interior_color"),
  msrpBase: doublePrecision("msrp_base").notNull(),
  msrpTotal: doublePrecision("msrp_total"),
  epaCity: integer("epa_city"),
  epaHighway: integer("epa_highway"),
  standardEquipment: jsonb("standard_equipment").$type<string[]>().notNull().default([]),
  selectedOptions: jsonb("selected_options").$type<Array<{ code: string; description: string; price: number }>>().notNull().default([]),
  disclaimerAcknowledged: boolean("disclaimer_acknowledged").notNull().default(false),
  shareToken: text("share_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStickerSchema = createInsertSchema(stickersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSticker = z.infer<typeof insertStickerSchema>;
export type Sticker = typeof stickersTable.$inferSelect;
