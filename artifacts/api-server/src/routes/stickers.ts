import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { db, stickersTable } from "@workspace/db";
import {
  CreateStickerBody,
  UpdateStickerBody,
  UpdateStickerParams,
  GetStickerParams,
  DeleteStickerParams,
  GenerateStickerPdfParams,
} from "@workspace/api-zod";
import { generateStickerPdf } from "../lib/pdf-generator";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DEST_CHARGE = 450;

function computeTotal(msrpBase: number, options: Array<{ price: number }>): number {
  return options.reduce((sum, o) => sum + o.price, msrpBase + DEST_CHARGE);
}

// GET /stickers
router.get("/stickers", async (_req, res): Promise<void> => {
  const stickers = await db.select().from(stickersTable).orderBy(desc(stickersTable.createdAt));
  res.json(stickers);
});

// GET /stickers/recent
router.get("/stickers/recent", async (_req, res): Promise<void> => {
  const stickers = await db.select().from(stickersTable).orderBy(desc(stickersTable.createdAt)).limit(5);
  res.json(stickers);
});

// POST /stickers
router.post("/stickers", async (req, res): Promise<void> => {
  const parsed = CreateStickerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const selectedOptions = (data.selectedOptions ?? []) as Array<{ code: string; description: string; price: number }>;
  const msrpTotal = computeTotal(data.msrpBase, selectedOptions);
  const shareToken = crypto.randomBytes(8).toString("hex");

  const [sticker] = await db
    .insert(stickersTable)
    .values({
      vin: data.vin,
      year: data.year,
      make: data.make,
      model: data.model,
      trim: data.trim,
      engine: data.engine,
      engineDisplacement: data.engineDisplacement ?? null,
      engineCylinders: data.engineCylinders ?? null,
      horsepower: data.horsepower ?? null,
      torque: data.torque ?? null,
      transmission: data.transmission,
      drivetrain: data.drivetrain,
      cabConfig: data.cabConfig,
      bodyStyle: data.bodyStyle ?? null,
      assemblyPlant: data.assemblyPlant ?? null,
      exteriorColor: data.exteriorColor ?? null,
      interiorColor: data.interiorColor ?? null,
      msrpBase: data.msrpBase,
      msrpTotal,
      epaCity: data.epaCity ?? null,
      epaHighway: data.epaHighway ?? null,
      standardEquipment: (data.standardEquipment ?? []) as string[],
      selectedOptions,
      disclaimerAcknowledged: data.disclaimerAcknowledged ?? false,
      shareToken,
    })
    .returning();

  res.status(201).json(sticker);
});

// GET /stickers/:id
router.get("/stickers/:id", async (req, res): Promise<void> => {
  const params = GetStickerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sticker] = await db.select().from(stickersTable).where(eq(stickersTable.id, params.data.id));
  if (!sticker) {
    res.status(404).json({ error: "Sticker not found" });
    return;
  }

  res.json(sticker);
});

// PATCH /stickers/:id
router.patch("/stickers/:id", async (req, res): Promise<void> => {
  const params = UpdateStickerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStickerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(stickersTable).where(eq(stickersTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Sticker not found" });
    return;
  }

  const updates = parsed.data;
  const selectedOptions = (updates.selectedOptions ?? existing.selectedOptions) as Array<{ code: string; description: string; price: number }>;
  const msrpBase = updates.msrpBase ?? existing.msrpBase;
  const msrpTotal = computeTotal(msrpBase, selectedOptions);

  const [updated] = await db
    .update(stickersTable)
    .set({
      ...(updates.trim !== undefined && { trim: updates.trim }),
      ...(updates.engine !== undefined && { engine: updates.engine }),
      ...(updates.transmission !== undefined && { transmission: updates.transmission }),
      ...(updates.drivetrain !== undefined && { drivetrain: updates.drivetrain }),
      ...(updates.exteriorColor !== undefined && { exteriorColor: updates.exteriorColor }),
      ...(updates.interiorColor !== undefined && { interiorColor: updates.interiorColor }),
      ...(updates.msrpBase !== undefined && { msrpBase: updates.msrpBase }),
      ...(updates.epaCity !== undefined && { epaCity: updates.epaCity }),
      ...(updates.epaHighway !== undefined && { epaHighway: updates.epaHighway }),
      ...(updates.standardEquipment !== undefined && { standardEquipment: updates.standardEquipment as string[] }),
      ...(updates.selectedOptions !== undefined && { selectedOptions }),
      ...(updates.disclaimerAcknowledged !== undefined && { disclaimerAcknowledged: updates.disclaimerAcknowledged }),
      msrpTotal,
    })
    .where(eq(stickersTable.id, params.data.id))
    .returning();

  res.json(updated);
});

// DELETE /stickers/:id
router.delete("/stickers/:id", async (req, res): Promise<void> => {
  const params = DeleteStickerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(stickersTable).where(eq(stickersTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Sticker not found" });
    return;
  }

  res.sendStatus(204);
});

// POST /stickers/:id/pdf
router.post("/stickers/:id/pdf", async (req, res): Promise<void> => {
  const params = GenerateStickerPdfParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sticker] = await db.select().from(stickersTable).where(eq(stickersTable.id, params.data.id));
  if (!sticker) {
    res.status(404).json({ error: "Sticker not found" });
    return;
  }

  const pdfBytes = await generateStickerPdf({
    vin: sticker.vin,
    year: sticker.year,
    make: sticker.make,
    model: sticker.model,
    trim: sticker.trim,
    engine: sticker.engine,
    engineDisplacement: sticker.engineDisplacement,
    engineCylinders: sticker.engineCylinders,
    horsepower: sticker.horsepower,
    torque: sticker.torque,
    transmission: sticker.transmission,
    drivetrain: sticker.drivetrain,
    cabConfig: sticker.cabConfig,
    bodyStyle: sticker.bodyStyle,
    assemblyPlant: sticker.assemblyPlant,
    exteriorColor: sticker.exteriorColor,
    interiorColor: sticker.interiorColor,
    msrpBase: sticker.msrpBase,
    msrpTotal: sticker.msrpTotal,
    epaCity: sticker.epaCity,
    epaHighway: sticker.epaHighway,
    standardEquipment: (sticker.standardEquipment as string[]) ?? [],
    selectedOptions: (sticker.selectedOptions as Array<{ code: string; description: string; price: number }>) ?? [],
  });

  // Save PDF to /tmp and serve as base64 data URL for direct download
  const filename = `s10-sticker-${sticker.year}-${sticker.vin.slice(-6)}.pdf`;
  const tmpDir = "/tmp/sticker-pdfs";
  await fs.mkdir(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, filename);
  await fs.writeFile(filePath, pdfBytes);

  logger.info({ stickerId: sticker.id, filename }, "PDF generated");

  // Return a data URL for direct browser download
  const base64 = Buffer.from(pdfBytes).toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

  res.json({ url: dataUrl, filename });
});

export default router;
