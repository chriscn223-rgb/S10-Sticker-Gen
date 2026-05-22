import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

interface StickerOption {
  code: string;
  description: string;
  price: number;
}

interface StickerData {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  engineDisplacement: string | null;
  engineCylinders: number | null;
  horsepower: number | null;
  torque: number | null;
  transmission: string;
  drivetrain: string;
  cabConfig: string;
  bodyStyle: string | null;
  assemblyPlant: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  msrpBase: number;
  msrpTotal: number | null;
  epaCity: number | null;
  epaHighway: number | null;
  standardEquipment: string[];
  selectedOptions: StickerOption[];
}

const DESTINATION_CHARGE = 450;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function splitTextToWidth(
  text: string,
  maxWidth: number,
  font: PDFFont,
  fontSize: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateStickerPdf(sticker: StickerData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Letter size: 8.5" × 11" = 612 × 792 pts
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  // Colors
  const black = rgb(0, 0, 0);
  const darkBlue = rgb(0.05, 0.15, 0.35);
  const lightGray = rgb(0.94, 0.94, 0.94);
  const midGray = rgb(0.6, 0.6, 0.6);
  const white = rgb(1, 1, 1);
  const darkGray = rgb(0.25, 0.25, 0.25);
  const accentRed = rgb(0.7, 0.05, 0.05);

  const margin = 28;
  const contentWidth = width - margin * 2;

  let y = height - margin;

  function drawRect(
    px: number, py: number, pw: number, ph: number,
    fillColor: typeof black, border = false,
  ) {
    page.drawRectangle({
      x: px, y: py - ph, width: pw, height: ph,
      color: fillColor,
      ...(border ? { borderColor: black, borderWidth: 0.5 } : {}),
    });
  }

  function drawText(
    text: string,
    px: number, py: number,
    font: PDFFont, size: number,
    color: typeof black = black,
  ) {
    page.drawText(text, { x: px, y: py, size, font, color });
  }

  function drawLine(
    x1: number, y1: number, x2: number, y2: number,
    thickness = 0.5, color: typeof black = midGray,
  ) {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  }

  // ─── HEADER ───────────────────────────────────────────────────────────────
  drawRect(margin, y, contentWidth, 52, darkBlue);

  const headerTitle = `${sticker.year} CHEVROLET ${sticker.model.toUpperCase()}`;
  const headerFontSize = 18;
  const headerWidth = helveticaBold.widthOfTextAtSize(headerTitle, headerFontSize);
  drawText(headerTitle, margin + (contentWidth - headerWidth) / 2, y - 26, helveticaBold, headerFontSize, white);

  const subTitle = `${sticker.trim} • ${sticker.cabConfig}`;
  const subTitleSize = 9;
  const subTitleWidth = helvetica.widthOfTextAtSize(subTitle, subTitleSize);
  drawText(subTitle, margin + (contentWidth - subTitleWidth) / 2, y - 40, helvetica, subTitleSize, rgb(0.7, 0.8, 0.95));

  y -= 52;

  // VIN band
  drawRect(margin, y, contentWidth, 16, lightGray);
  drawText("VIN:", margin + 6, y - 11, helveticaBold, 7.5, darkGray);
  drawText(sticker.vin, margin + 30, y - 11, courier, 7.5, darkBlue);
  drawText("WINDOW STICKER — RECONSTRUCTED FROM HISTORICAL DATA", margin + contentWidth - 240, y - 11, helveticaOblique, 6, midGray);
  y -= 16;

  // Thin separator
  drawLine(margin, y, margin + contentWidth, y, 1, darkBlue);
  y -= 8;

  // ─── TWO-COLUMN LAYOUT ────────────────────────────────────────────────────
  const col1W = contentWidth * 0.55;
  const col2W = contentWidth * 0.45;
  const col2X = margin + col1W + 6;
  const colContentWidth1 = col1W - 6;
  const colContentWidth2 = col2W - 6;

  const sectionStartY = y;

  // ── LEFT: Vehicle Details + Standard Equipment ──
  // Section: Vehicle Description
  function sectionHeader(title: string, px: number, py: number, pw: number): number {
    drawRect(px, py, pw, 14, rgb(0.12, 0.22, 0.45));
    drawText(title.toUpperCase(), px + 4, py - 10, helveticaBold, 7, white);
    return py - 14;
  }

  let leftY = sectionStartY;
  leftY = sectionHeader("Vehicle Description", margin, leftY, colContentWidth1);
  leftY -= 3;

  const vehicleDetails = [
    ["Year:", `${sticker.year}`],
    ["Make:", sticker.make],
    ["Model:", sticker.model],
    ["Trim Level:", sticker.trim],
    ["Cab Config:", sticker.cabConfig],
    ["Body Style:", sticker.bodyStyle ?? "Pickup"],
    ["Assembly Plant:", sticker.assemblyPlant ?? "—"],
    ["Exterior Color:", sticker.exteriorColor ?? "—"],
    ["Interior Color:", sticker.interiorColor ?? "—"],
  ];

  for (const [label, value] of vehicleDetails) {
    drawText(label, margin + 4, leftY - 8, helveticaBold, 7, darkGray);
    drawText(value, margin + 80, leftY - 8, helvetica, 7, black);
    drawLine(margin + 4, leftY - 10, margin + colContentWidth1 - 4, leftY - 10, 0.3, lightGray);
    leftY -= 12;
  }

  leftY -= 4;

  // Section: Powertrain
  leftY = sectionHeader("Powertrain", margin, leftY, colContentWidth1);
  leftY -= 3;

  const powertrainDetails = [
    ["Engine:", sticker.engine],
    ["Displacement:", sticker.engineDisplacement ?? "—"],
    ["Cylinders:", sticker.engineCylinders ? `${sticker.engineCylinders}` : "—"],
    ["Horsepower:", sticker.horsepower ? `${sticker.horsepower} hp @ peak` : "—"],
    ["Torque:", sticker.torque ? `${sticker.torque} lb-ft @ peak` : "—"],
    ["Transmission:", sticker.transmission],
    ["Drivetrain:", sticker.drivetrain],
    ["Fuel Type:", "Gasoline"],
  ];

  for (const [label, value] of powertrainDetails) {
    drawText(label, margin + 4, leftY - 8, helveticaBold, 7, darkGray);
    drawText(value, margin + 80, leftY - 8, helvetica, 7, black);
    drawLine(margin + 4, leftY - 10, margin + colContentWidth1 - 4, leftY - 10, 0.3, lightGray);
    leftY -= 12;
  }

  leftY -= 4;

  // Section: Standard Equipment
  leftY = sectionHeader("Standard Equipment", margin, leftY, colContentWidth1);
  leftY -= 3;

  const equip = sticker.standardEquipment;
  const midEquip = Math.ceil(equip.length / 2);
  const equipLeft = equip.slice(0, midEquip);
  const equipRight = equip.slice(midEquip);
  const dotX1 = margin + 6;
  const dotX2 = margin + colContentWidth1 / 2 + 4;
  const equipFontSize = 6.2;
  const maxEquipRows = Math.max(equipLeft.length, equipRight.length);

  for (let i = 0; i < maxEquipRows; i++) {
    const rowY = leftY - (i * 9) - 7;
    if (equipLeft[i]) {
      page.drawCircle({ x: dotX1 + 2, y: rowY + 2.5, size: 1.2, color: darkBlue });
      drawText(equipLeft[i], dotX1 + 6, rowY, helvetica, equipFontSize, black);
    }
    if (equipRight[i]) {
      page.drawCircle({ x: dotX2 + 2, y: rowY + 2.5, size: 1.2, color: darkBlue });
      drawText(equipRight[i], dotX2 + 6, rowY, helvetica, equipFontSize, black);
    }
  }

  leftY -= maxEquipRows * 9 + 6;

  // ── RIGHT COLUMN ──────────────────────────────────────────────────────────
  let rightY = sectionStartY;

  // Section: Optional Equipment
  rightY = sectionHeader("Optional Equipment", col2X, rightY, colContentWidth2);
  rightY -= 3;

  if (sticker.selectedOptions.length === 0) {
    drawText("No options selected", col2X + 4, rightY - 9, helveticaOblique, 7, midGray);
    rightY -= 18;
  } else {
    // Header row
    drawRect(col2X, rightY, colContentWidth2, 11, rgb(0.88, 0.88, 0.88));
    drawText("CODE", col2X + 4, rightY - 8, helveticaBold, 6.5, darkGray);
    drawText("DESCRIPTION", col2X + 34, rightY - 8, helveticaBold, 6.5, darkGray);
    drawText("PRICE", col2X + colContentWidth2 - 35, rightY - 8, helveticaBold, 6.5, darkGray);
    rightY -= 11;

    for (const opt of sticker.selectedOptions) {
      drawText(opt.code, col2X + 4, rightY - 8, helveticaBold, 6.5, darkBlue);
      const descLines = splitTextToWidth(opt.description, colContentWidth2 - 70, helvetica, 6.5);
      drawText(descLines[0] ?? opt.description, col2X + 34, rightY - 8, helvetica, 6.5, black);
      drawText(formatCurrency(opt.price), col2X + colContentWidth2 - 35, rightY - 8, helvetica, 6.5, black);
      drawLine(col2X + 4, rightY - 10, col2X + colContentWidth2 - 4, rightY - 10, 0.3, lightGray);
      rightY -= 11;
    }
  }

  rightY -= 6;

  // Section: EPA Fuel Economy
  rightY = sectionHeader("EPA Estimated Fuel Economy", col2X, rightY, colContentWidth2);
  rightY -= 5;

  const cityMpg = sticker.epaCity ?? "—";
  const hwyMpg = sticker.epaHighway ?? "—";

  // City box
  const boxW = 55;
  drawRect(col2X + 10, rightY, boxW, 36, lightGray, true);
  const cityLabel = `${cityMpg}`;
  const cityLabelWidth = helveticaBold.widthOfTextAtSize(cityLabel, 20);
  drawText(cityLabel, col2X + 10 + (boxW - cityLabelWidth) / 2, rightY - 24, helveticaBold, 20, darkBlue);
  drawText("CITY", col2X + 10 + (boxW - helvetica.widthOfTextAtSize("CITY", 7)) / 2, rightY - 33, helvetica, 7, darkGray);

  // Highway box
  drawRect(col2X + 80, rightY, boxW, 36, lightGray, true);
  const hwyLabel = `${hwyMpg}`;
  const hwyLabelWidth = helveticaBold.widthOfTextAtSize(hwyLabel, 20);
  drawText(hwyLabel, col2X + 80 + (boxW - hwyLabelWidth) / 2, rightY - 24, helveticaBold, 20, darkBlue);
  drawText("HIGHWAY", col2X + 80 + (boxW - helvetica.widthOfTextAtSize("HIGHWAY", 7)) / 2, rightY - 33, helvetica, 7, darkGray);

  drawText("MPG", col2X + 70, rightY - 14, helveticaBold, 9, darkGray);

  rightY -= 40;
  drawText("EPA estimated fuel economy. Actual results may vary.", col2X + 4, rightY - 6, helveticaOblique, 5.5, midGray);
  rightY -= 14;

  // Section: MSRP Summary
  rightY = sectionHeader("Manufacturer's Suggested Retail Price", col2X, rightY, colContentWidth2);
  rightY -= 3;

  const priceRows: [string, number][] = [
    ["Base Price", sticker.msrpBase],
    ...sticker.selectedOptions.map(o => [o.description.substring(0, 28), o.price] as [string, number]),
    ["Destination & Delivery", DESTINATION_CHARGE],
  ];

  for (const [label, amt] of priceRows) {
    drawText(label, col2X + 4, rightY - 8, helvetica, 6.5, black);
    const priceStr = formatCurrency(amt);
    const priceWidth = helvetica.widthOfTextAtSize(priceStr, 6.5);
    drawText(priceStr, col2X + colContentWidth2 - 6 - priceWidth, rightY - 8, helvetica, 6.5, black);
    drawLine(col2X + 4, rightY - 10, col2X + colContentWidth2 - 4, rightY - 10, 0.3, lightGray);
    rightY -= 11;
  }

  // Total
  const totalMsrp = (sticker.msrpTotal ?? priceRows.reduce((s, [, p]) => s + p, 0));
  drawRect(col2X, rightY, colContentWidth2, 16, darkBlue);
  drawText("TOTAL MSRP", col2X + 4, rightY - 11, helveticaBold, 8, white);
  const totalStr = formatCurrency(totalMsrp);
  const totalWidth = helveticaBold.widthOfTextAtSize(totalStr, 10);
  drawText(totalStr, col2X + colContentWidth2 - 6 - totalWidth, rightY - 11, helveticaBold, 10, white);
  rightY -= 20;

  // ─── FOOTER ───────────────────────────────────────────────────────────────
  const footerY = Math.min(leftY, rightY) - 10;

  drawLine(margin, footerY, margin + contentWidth, footerY, 1, darkBlue);

  const disclaimerText =
    "IMPORTANT NOTICE: This document is a reconstructed window sticker generated from historical automotive data and user input. " +
    "It is NOT an official Monroney label, not affiliated with General Motors, Chevrolet, or any original equipment manufacturer. " +
    "Specifications, pricing, and equipment listed are approximate historical values and may not match the actual vehicle. " +
    "This document has no legal standing and is intended for informational and historical reference purposes only.";

  const disclaimerLines = splitTextToWidth(disclaimerText, contentWidth - 8, helveticaOblique, 5.5);
  let discY = footerY - 8;
  for (const line of disclaimerLines) {
    drawText(line, margin + 4, discY, helveticaOblique, 5.5, midGray);
    discY -= 8;
  }

  drawText(
    `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} — S10 Window Sticker Generator — Not an official document`,
    margin + 4, discY - 4,
    helveticaOblique, 5, midGray,
  );

  const bytes = await pdfDoc.save();
  return bytes;
}
