import type { Sticker } from "@workspace/api-client-react/src/generated/api.schemas";

// ─── Helpers ────────────────────────────────────────────────────────────────

const DEST_CHARGE = 450;

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Equipment categorizer ───────────────────────────────────────────────────

interface EquipCat {
  label: string;
  items: string[];
}

const CAT_RULES: { label: string; re: RegExp }[] = [
  {
    label: "OWNER BENEFITS",
    re: /\b(warranty|bumper.to.bumper|powertrain limited|roadside|courtesy|maintenance|whichever|dealer|first maintenance|corrosion)\b/i,
  },
  {
    label: "PERFORMANCE & MECHANICAL",
    re: /\b(engine|transmission|drivetrain|drive|axle|suspension|steering|oil|exhaust|v6|v-6|v8|4-cylinder|i4|i-4|speed|manual|automatic|4wd|rwd|awd|4x4|4x2|horsepower|torque|spark|ignition|cylinder|fuel inject|throttle|skid plate|locking|differential|transfer case|coolant|radiator|belt|chain|trailer)\b/i,
  },
  {
    label: "SAFETY & SECURITY",
    re: /\b(airbag|air bag|abs|antilock|anti-lock|theft|alarm|seatbelt|seat belt|brake|crumple|rollover|side impact|child safety|daytime running|hazard|tire pressure|tpms|stability|traction control)\b/i,
  },
  {
    label: "CONNECTIVITY & TECHNOLOGY",
    re: /\b(radio|stereo|audio|speaker|cassette|cd|am\/fm|fm|equalizer|subwoofer|antenna|satellite|bluetooth|usb|aux|onstar|gps|navigation|phone|display|screen|touchscreen|digital|instrument)\b/i,
  },
  {
    label: "INTERIOR",
    re: /\b(seat|cloth|vinyl|upholstery|carpet|floor|bucket|bench|lumbar|armrest|headrest|cushion|reclining|console|gauge|voltmeter|tachometer|odometer|trip|compass|temperature|clock|mirror|wiper|reading light|outlet|visor|reminder|cruise|power window|power lock|keyless|tilt|intermittent|heated|12v|overhead|interior)\b/i,
  },
  {
    label: "EXTERIOR",
    re: /\b(bumper|wheel|tire|paint|grille|pickup box|spare|molding|stripe|window tint|tinted|hitch|step|running board|fender|door handle|badge|chrome|body color|spoiler|sunroof|roof|bed liner|cargo|mud flap|fog lamp|fog light|exterior|appearance|glass|door|tailgate)\b/i,
  },
];

function categorize(items: string[]): EquipCat[] {
  const buckets: Record<string, string[]> = {};
  const other: string[] = [];
  for (const item of items) {
    let hit = false;
    for (const r of CAT_RULES) {
      if (r.re.test(item)) {
        (buckets[r.label] ??= []).push(item);
        hit = true;
        break;
      }
    }
    if (!hit) other.push(item);
  }
  for (const item of other) {
    (buckets["INTERIOR"] ??= []).push(item);
  }
  return CAT_RULES.filter((r) => buckets[r.label]?.length).map((r) => ({
    label: r.label,
    items: buckets[r.label],
  }));
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ChevyBowtie({ size = 48 }: { size?: number }) {
  const w = size * 2.4;
  const h = size;
  return (
    <svg width={w} height={h} viewBox="0 0 120 50" style={{ display: "block" }}>
      <defs>
        <linearGradient id="bw-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0c020" />
          <stop offset="50%" stopColor="#e8b000" />
          <stop offset="100%" stopColor="#c89000" />
        </linearGradient>
        <linearGradient id="bw-dark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9a6f00" />
          <stop offset="100%" stopColor="#7a5500" />
        </linearGradient>
      </defs>
      {/* Outer bowtie shape */}
      <path
        d="M2,25 L18,4 L58,4 L62,25 L58,46 L18,46 Z"
        fill="url(#bw-gold)"
        stroke="#9a6f00"
        strokeWidth="1"
      />
      <path
        d="M118,25 L102,4 L62,4 L58,25 L62,46 L102,46 Z"
        fill="url(#bw-gold)"
        stroke="#9a6f00"
        strokeWidth="1"
      />
      {/* Center knot dark shadow */}
      <path d="M58,4 L62,25 L58,46 L54,25 Z" fill="#9a6f00" opacity="0.6" />
      <path d="M62,4 L66,25 L62,46 L58,25 Z" fill="#c89000" opacity="0.4" />
      {/* Inner highlight top-left of each wing */}
      <path d="M20,9 L50,9 L55,20 L20,20 Z" fill="#f8d840" opacity="0.5" />
      <path d="M100,9 L70,9 L65,20 L100,20 Z" fill="#f8d840" opacity="0.5" />
    </svg>
  );
}

function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span style={{ fontSize: "10px", letterSpacing: "1px", color: "#111" }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ color: i < count ? "#111" : "#bbb" }}>
          {i < count ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function RatingBar({
  label,
  value,
  max = 10,
  color = "#1a7a1a",
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  return (
    <div style={{ marginBottom: "4px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "6px",
          marginBottom: "2px",
          color: "#444",
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: "#111" }}>{value}/{max}</span>
      </div>
      <div
        style={{
          display: "flex",
          gap: "2px",
        }}
      >
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "7px",
              backgroundColor: i < value ? color : "#ddd",
              borderRadius: "1px",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function EquipColumn({ cats }: { cats: EquipCat[] }) {
  if (cats.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {cats.map((cat) => (
        <div key={cat.label}>
          <div
            style={{
              fontSize: "6px",
              fontWeight: 900,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#000",
              borderBottom: "0.75px solid #555",
              paddingBottom: "1.5px",
              marginBottom: "3px",
            }}
          >
            {cat.label}
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {cat.items.map((item, i) => (
              <li
                key={i}
                style={{
                  fontSize: "6.5px",
                  lineHeight: "1.4",
                  display: "flex",
                  gap: "3px",
                  alignItems: "flex-start",
                  color: "#111",
                }}
              >
                <span style={{ flexShrink: 0, marginTop: "1px" }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function StickerPreview({ sticker }: { sticker: Sticker }) {
  const options = sticker.selectedOptions ?? [];
  const optionsTotal = options.reduce((s, o) => s + o.price, 0);
  const totalPrice = sticker.msrpBase + optionsTotal + DEST_CHARGE;

  const city = sticker.epaCity ?? null;
  const hwy = sticker.epaHighway ?? null;
  const combined = city && hwy ? Math.round(city * 0.55 + hwy * 0.45) : null;
  const annualFuel = combined ? Math.round((15000 / combined) * 3.5) : null;
  const avgAnnual = 2250;
  const fiveYearDiff = annualFuel ? (annualFuel - avgAnnual) * 5 : null;
  const ghgRating = combined ? Math.min(10, Math.max(1, Math.round(combined / 4))) : 4;
  const smogRating = 5; // placeholder

  const allCats = categorize(sticker.standardEquipment ?? []);

  // Split into 3 columns for the equipment section
  const totalCatItems = allCats.reduce((s, c) => s + c.items.length + 1.4, 0);
  const colTargets = [totalCatItems / 3, (totalCatItems * 2) / 3];
  const cols: EquipCat[][] = [[], [], []];
  let colIdx = 0;
  let runCount = 0;
  for (const cat of allCats) {
    cols[colIdx].push(cat);
    runCount += cat.items.length + 1.4;
    if (colIdx < 2 && runCount >= colTargets[colIdx]) colIdx++;
  }

  const modelCode = `CS${String(sticker.year ?? "").slice(-2)}${sticker.drivetrain === "4WD" ? "4" : "2"}`;

  // ─── STICKER BODY ─────────────────────────────────────────────────────────

  return (
    <div
      id="sticker-preview-container"
      style={{
        width: "900px",
        backgroundColor: "#ffffff",
        border: "2.5px solid #111",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#111",
        fontSize: "10px",
        boxSizing: "border-box",
      }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          borderBottom: "2px solid #111",
        }}
      >
        {/* Logo block */}
        <div
          style={{
            padding: "10px 14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRight: "1.5px solid #111",
            minWidth: "130px",
            gap: "4px",
          }}
        >
          <ChevyBowtie size={30} />
          <div
            style={{
              fontSize: "22px",
              fontWeight: 900,
              letterSpacing: "-0.5px",
              lineHeight: 1,
              color: "#000",
              textTransform: "uppercase",
            }}
          >
            CHEVROLET
          </div>
          <div
            style={{
              fontSize: "6px",
              color: "#666",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Visit us at www.chevy.com
          </div>
        </div>

        {/* Vehicle title */}
        <div
          style={{
            flex: "1 1 0",
            padding: "8px 14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            borderRight: "1.5px solid #111",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.3px",
              lineHeight: 1.1,
            }}
          >
            {sticker.year} {(sticker.model ?? "S10").toUpperCase()}{" "}
            {(sticker.cabConfig ?? "").toUpperCase()}
          </div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#333",
              marginTop: "2px",
            }}
          >
            {sticker.trim} — {sticker.drivetrain}
          </div>
          <div
            style={{
              fontSize: "7.5px",
              color: "#555",
              marginTop: "3px",
              fontFamily: "Courier New, monospace",
              letterSpacing: "0.04em",
            }}
          >
            MODEL: {modelCode.toUpperCase()} &nbsp;|&nbsp; VIN: {sticker.vin}
          </div>
        </div>

        {/* Specs grid */}
        <div
          style={{
            padding: "8px 14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "3px",
            minWidth: "260px",
          }}
        >
          {[
            [
              "EXTERIOR:",
              (sticker.exteriorColor ?? "—").toUpperCase(),
            ],
            [
              "INTERIOR:",
              (sticker.interiorColor ?? "—").toUpperCase(),
            ],
            ["ENGINE:", sticker.engine ?? "—"],
            ["TRANSMISSION:", sticker.transmission ?? "—"],
          ].map(([label, val]) => (
            <div
              key={label}
              style={{
                display: "flex",
                gap: "6px",
                fontSize: "8.5px",
                lineHeight: 1.3,
              }}
            >
              <span
                style={{
                  fontWeight: 900,
                  minWidth: "90px",
                  textTransform: "uppercase",
                  color: "#000",
                }}
              >
                {label}
              </span>
              <span style={{ color: "#222" }}>{val}</span>
            </div>
          ))}
          {(sticker.horsepower || sticker.torque) && (
            <div style={{ fontSize: "7px", color: "#666", marginTop: "2px" }}>
              {sticker.horsepower ? `${sticker.horsepower} HP` : ""}
              {sticker.horsepower && sticker.torque ? " / " : ""}
              {sticker.torque ? `${sticker.torque} lb-ft TQ` : ""}
              {sticker.assemblyPlant
                ? `  ·  ASSEMBLED: ${sticker.assemblyPlant.toUpperCase()}`
                : ""}
            </div>
          )}
        </div>
      </div>

      {/* ── STANDARD EQUIPMENT LABEL BAR ────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #999",
          padding: "3px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: "7px",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#000",
          }}
        >
          STANDARD EQUIPMENT
        </div>
        <div style={{ fontSize: "6.5px", color: "#555" }}>
          OPTIONS FEATURED BELOW ARE INCLUDED AT EXTRA CHARGE AS PART OF STANDARD EQUIPMENT
        </div>
        <div
          style={{
            fontSize: "7px",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#000",
          }}
        >
          MANUFACTURER'S SUGGESTED RETAIL PRICE
        </div>
      </div>

      {/* ── EQUIPMENT + PRICING COLUMNS ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          borderBottom: "2px solid #111",
        }}
      >
        {/* Equipment Col 1 */}
        <div
          style={{
            flex: "1 1 0",
            borderRight: "1px solid #ccc",
            padding: "8px 10px 8px 14px",
          }}
        >
          <EquipColumn cats={cols[0]} />
        </div>

        {/* Equipment Col 2 */}
        <div
          style={{
            flex: "1 1 0",
            borderRight: "1px solid #ccc",
            padding: "8px 10px",
          }}
        >
          <EquipColumn cats={cols[1]} />
        </div>

        {/* Equipment Col 3 */}
        <div
          style={{
            flex: "1 1 0",
            borderRight: "2px solid #111",
            padding: "8px 10px",
          }}
        >
          <EquipColumn cats={cols[2]} />
        </div>

        {/* Right panel — Pricing */}
        <div
          style={{
            width: "210px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Standard Vehicle Price */}
          <div
            style={{
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #ccc",
              padding: "6px 10px",
            }}
          >
            <div
              style={{
                fontSize: "6.5px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "4px",
                borderBottom: "0.75px solid #999",
                paddingBottom: "2px",
              }}
            >
              STANDARD VEHICLE PRICE
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: "9px",
              }}
            >
              <span style={{ color: "#555" }}>Base MSRP</span>
              <strong style={{ fontSize: "13px" }}>{fmt$(sticker.msrpBase)}</strong>
            </div>
          </div>

          {/* Options & Pricing */}
          <div
            style={{
              borderBottom: "1px solid #ccc",
              padding: "6px 10px",
              flex: "1 1 auto",
            }}
          >
            <div
              style={{
                fontSize: "6.5px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "4px",
                borderBottom: "0.75px solid #999",
                paddingBottom: "2px",
              }}
            >
              OPTIONS &amp; PRICING
            </div>
            <div
              style={{
                fontSize: "6px",
                color: "#666",
                marginBottom: "4px",
                fontStyle: "italic",
              }}
            >
              OPTIONS INSTALLED BY THE MANUFACTURER AND REPLACE CORRESPONDING STANDARD EQUIPMENT SHOWN:
            </div>

            {options.length === 0 ? (
              <div style={{ fontSize: "7px", color: "#888", fontStyle: "italic" }}>
                No options installed.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {options.map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "4px",
                      fontSize: "7px",
                      lineHeight: 1.4,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontFamily: "Courier New, monospace",
                          fontSize: "6.5px",
                          backgroundColor: "#eee",
                          padding: "0 2px",
                          marginRight: "3px",
                        }}
                      >
                        {opt.code}
                      </span>
                      <span>{opt.description}</span>
                    </div>
                    <strong style={{ whiteSpace: "nowrap" }}>{fmt$(opt.price)}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Pricing totals */}
            <div
              style={{
                marginTop: "8px",
                borderTop: "0.75px solid #bbb",
                paddingTop: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              {options.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "7px",
                  }}
                >
                  <span style={{ color: "#555" }}>Total Options</span>
                  <span>{fmt$(optionsTotal)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "7px",
                }}
              >
                <span style={{ color: "#555" }}>Destination &amp; Delivery</span>
                <span>{fmt$(DEST_CHARGE)}</span>
              </div>
            </div>
          </div>

          {/* Total Vehicle Price */}
          <div
            style={{
              padding: "7px 10px",
              borderTop: "2px solid #111",
              backgroundColor: "#f5f5f5",
            }}
          >
            <div
              style={{
                fontSize: "6.5px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#444",
              }}
            >
              TOTAL VEHICLE PRICE*
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "#000",
                lineHeight: 1.1,
                marginTop: "2px",
              }}
            >
              {fmt$(totalPrice)}
            </div>
            <div style={{ fontSize: "5.5px", color: "#888", marginTop: "3px" }}>
              *PRICE INCLUDES STANDARD EQUIPMENT, OPTIONS &amp; DELIVERY.
              TAXES, TITLE &amp; LICENSE NOT INCLUDED.
            </div>
          </div>

          {/* Warranty mini-block */}
          <div
            style={{
              borderTop: "1px solid #bbb",
              padding: "5px 10px",
            }}
          >
            <div
              style={{
                fontSize: "6px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "3px",
                borderBottom: "0.5px solid #ccc",
                paddingBottom: "2px",
              }}
            >
              WARRANTY
            </div>
            {[
              ["Bumper-to-Bumper", "3 yr / 36,000 mi"],
              ["Powertrain Limited", "5 yr / 60,000 mi"],
              ["Corrosion", "6 yr / unlimited"],
              ["Roadside Assistance", "5 yr / 60,000 mi"],
            ].map(([l, v]) => (
              <div
                key={l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "6px",
                  lineHeight: 1.5,
                  gap: "6px",
                }}
              >
                <span style={{ color: "#555" }}>{l}</span>
                <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: EPA | SAFETY RATINGS | PARTS INFO ───────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          minHeight: "160px",
        }}
      >
        {/* ── EPA "Fuel Economy and Environment" ── */}
        <div
          style={{
            flex: "0 0 380px",
            borderRight: "1.5px solid #111",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* EPA header bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1.5px solid #111",
              backgroundColor: "#fff",
            }}
          >
            {/* DOT badge */}
            <div
              style={{
                padding: "4px 8px",
                borderRight: "1px solid #555",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1px",
              }}
            >
              <div
                style={{
                  border: "1.5px solid #000",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                <div style={{ fontSize: "4px", fontWeight: 700 }}>EPA</div>
                <div style={{ fontSize: "4px" }}>DOT</div>
              </div>
            </div>
            <div style={{ padding: "4px 8px", flex: 1 }}>
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  lineHeight: 1.1,
                }}
              >
                Fuel Economy and Environment
              </div>
              <div style={{ fontSize: "6px", color: "#555" }}>
                Fuel consumption information based on EPA testing procedures
              </div>
            </div>
            {/* Gasoline vehicle badge */}
            <div
              style={{
                padding: "4px 8px",
                borderLeft: "1px solid #ccc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1px",
              }}
            >
              <div
                style={{
                  border: "1.5px solid #000",
                  borderRadius: "4px",
                  padding: "2px 5px",
                  fontSize: "5.5px",
                  fontWeight: 700,
                  textAlign: "center",
                  textTransform: "uppercase",
                }}
              >
                Gasoline<br />Vehicle
              </div>
            </div>
          </div>

          {/* MPG body */}
          <div
            style={{
              display: "flex",
              flex: 1,
              padding: "8px 10px",
              gap: "10px",
              alignItems: "flex-start",
            }}
          >
            {/* Left: Fuel pump icon + MPG numbers */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {/* Fuel pump SVG */}
              <svg
                width="36"
                height="52"
                viewBox="0 0 36 52"
                style={{ flexShrink: 0 }}
              >
                <rect
                  x="2"
                  y="14"
                  width="22"
                  height="32"
                  rx="2"
                  fill="none"
                  stroke="#111"
                  strokeWidth="1.5"
                />
                <rect x="6" y="18" width="14" height="8" fill="#ddd" stroke="#999" strokeWidth="0.5" />
                <rect x="8" y="30" width="10" height="12" rx="1" fill="#ddd" stroke="#999" strokeWidth="0.5" />
                <path
                  d="M24,14 L30,10 L34,14 L34,28 L30,28 L30,14"
                  fill="none"
                  stroke="#111"
                  strokeWidth="1.5"
                />
                <line x1="24" y1="28" x2="34" y2="28" stroke="#111" strokeWidth="1" />
                <rect x="6" y="2" width="14" height="12" rx="1" fill="none" stroke="#111" strokeWidth="1" />
                <text x="13" y="11" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#111">
                  {city ?? "—"}
                </text>
              </svg>

              {/* MPG number display */}
              <div>
                <div
                  style={{
                    fontSize: "7px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#333",
                    letterSpacing: "0.06em",
                  }}
                >
                  Fuel Economy
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "6px",
                    marginTop: "2px",
                  }}
                >
                  {/* Combined (large) */}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "42px",
                        fontWeight: 900,
                        lineHeight: 1,
                        color: "#000",
                        letterSpacing: "-2px",
                      }}
                    >
                      {combined ?? "—"}
                    </div>
                    <div style={{ fontSize: "6.5px", fontWeight: 700, textTransform: "uppercase", color: "#444" }}>
                      MPG
                    </div>
                    <div style={{ fontSize: "5.5px", color: "#666" }}>combined city/hwy</div>
                  </div>

                  {/* City / Hwy sub-numbers */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                      marginBottom: "6px",
                    }}
                  >
                    {[
                      ["city", city],
                      ["highway", hwy],
                    ].map(([label, val]) => (
                      <div key={String(label)} style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                        <span
                          style={{
                            fontSize: "18px",
                            fontWeight: 900,
                            lineHeight: 1,
                            color: "#000",
                          }}
                        >
                          {val ?? "—"}
                        </span>
                        <div>
                          <div style={{ fontSize: "6px", fontWeight: 700, textTransform: "uppercase" }}>MPG</div>
                          <div style={{ fontSize: "5.5px", color: "#666" }}>{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Spend comparisons + ratings */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
              {fiveYearDiff !== null && (
                <div
                  style={{
                    border: "1px solid #aaa",
                    borderRadius: "3px",
                    padding: "4px 6px",
                    fontSize: "7px",
                    lineHeight: 1.4,
                  }}
                >
                  <strong style={{ fontSize: "7px" }}>You spend</strong>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 900,
                      color: fiveYearDiff > 0 ? "#000" : "#1a7a1a",
                    }}
                  >
                    {fmt$(Math.abs(fiveYearDiff))}
                  </div>
                  <div style={{ color: "#444" }}>
                    <strong>{fiveYearDiff > 0 ? "more" : "less"}</strong> in fuel costs
                    <br />
                    over 5 years compared to
                    <br />
                    the average new vehicle
                  </div>
                </div>
              )}

              {annualFuel && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      border: "1.5px solid #000",
                      borderRadius: "3px",
                      padding: "3px 6px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "5.5px", fontWeight: 700, textTransform: "uppercase", color: "#555" }}>
                      Annual fuel
                    </div>
                    <div style={{ fontSize: "5.5px", fontWeight: 700, textTransform: "uppercase", color: "#555" }}>
                      COST
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 900, lineHeight: 1 }}>
                      {fmt$(annualFuel)}
                    </div>
                  </div>
                  <div style={{ fontSize: "5.5px", color: "#666", lineHeight: 1.4 }}>
                    Cost estimates are based on 15,000 miles per year at $3.50 per gallon.
                    Actual costs will vary based on driving habits and conditions.
                  </div>
                </div>
              )}

              {/* GHG / Smog bars */}
              <div>
                <RatingBar label="Fuel Economy & Greenhouse Gas Rating (1=worst, 10=best)" value={ghgRating} color="#1a7a1a" />
                <RatingBar label="Smog Rating (1=worst, 10=best)" value={smogRating} color="#1a7a1a" />
              </div>

              <div
                style={{
                  fontSize: "7px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  textAlign: "center",
                  borderTop: "0.5px solid #ccc",
                  paddingTop: "3px",
                  color: "#000",
                }}
              >
                fueleconomy.gov
              </div>
              <div style={{ fontSize: "5px", color: "#888", lineHeight: 1.4 }}>
                Actual results will vary for many reasons, including driving conditions and how you drive and maintain your vehicle.
                The average new vehicle gets 27 MPG and costs $1,500 to fuel per year. Cost estimates based on 15,000 miles per
                year at $3.50/gallon.
              </div>
            </div>
          </div>
        </div>

        {/* ── GOVERNMENT 5-STAR SAFETY RATINGS ── */}
        <div
          style={{
            flex: "1 1 0",
            borderRight: "1.5px solid #111",
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div
            style={{
              fontSize: "7.5px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: "1px solid #999",
              paddingBottom: "3px",
              marginBottom: "2px",
            }}
          >
            GOVERNMENT 5-STAR SAFETY RATINGS
          </div>
          <div style={{ fontSize: "6px", color: "#555", lineHeight: 1.4, marginBottom: "4px" }}>
            Based on the combined ratings of frontal, side and rollover.
            Should ONLY be compared to other vehicles of similar size and weight.
          </div>

          {/* Overall */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#f5f5f5",
              padding: "3px 6px",
              borderRadius: "2px",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontSize: "7px", fontWeight: 700 }}>Overall Vehicle Score</span>
            <Stars count={0} />
          </div>

          {/* Crash categories */}
          {[
            {
              section: "Frontal Crash",
              note: "Based on the risk of injury in a frontal impact.",
              rows: [
                { label: "Driver", stars: 0 },
                { label: "Passenger", stars: 0 },
              ],
            },
            {
              section: "Side Crash",
              note: "Based on the risk of injury in a side impact.",
              rows: [
                { label: "Front seat", stars: 0 },
                { label: "Rear seat", stars: 0 },
              ],
            },
          ].map(({ section, note, rows }) => (
            <div key={section} style={{ marginBottom: "4px" }}>
              <div
                style={{
                  fontSize: "6.5px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color: "#000",
                  borderBottom: "0.5px solid #ddd",
                  paddingBottom: "1px",
                  marginBottom: "2px",
                }}
              >
                {section}
              </div>
              <div style={{ fontSize: "5.5px", color: "#777", marginBottom: "2px" }}>{note}</div>
              {rows.map(({ label, stars }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1px",
                  }}
                >
                  <span style={{ fontSize: "6px", color: "#444" }}>{label}</span>
                  <Stars count={stars} />
                </div>
              ))}
            </div>
          ))}

          {/* Rollover */}
          <div>
            <div
              style={{
                fontSize: "6.5px",
                fontWeight: 900,
                textTransform: "uppercase",
                borderBottom: "0.5px solid #ddd",
                paddingBottom: "1px",
                marginBottom: "2px",
              }}
            >
              Rollover
            </div>
            <div style={{ fontSize: "5.5px", color: "#777", marginBottom: "2px" }}>
              Based on the risk of rollover in a single-vehicle crash.
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "6px", color: "#444" }}>Resistance</span>
              <Stars count={0} />
            </div>
          </div>

          <div
            style={{
              fontSize: "5.5px",
              color: "#999",
              marginTop: "4px",
              borderTop: "0.5px solid #ddd",
              paddingTop: "3px",
            }}
          >
            Star ratings range from 1 to 5 stars (★★★★★) with 5 being the highest.
            Source: National Highway Traffic Safety Administration (NHTSA).
            www.safercar.gov or 1-888-327-4236
          </div>
          <div style={{ fontSize: "5.5px", color: "#aaa" }}>
            *Vintage vehicle — official NHTSA ratings not available for this model year.
          </div>
        </div>

        {/* ── PARTS CONTENT INFORMATION ── */}
        <div
          style={{
            width: "190px",
            flexShrink: 0,
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            borderLeft: "0px", // already has right border from sibling
          }}
        >
          <div
            style={{
              fontSize: "7px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: "1px solid #999",
              paddingBottom: "3px",
              marginBottom: "2px",
            }}
          >
            PARTS CONTENT INFORMATION
          </div>
          <div style={{ fontSize: "6px", color: "#555", lineHeight: 1.4 }}>
            FOR VEHICLES IN THIS CARLINE:
          </div>
          {[
            ["U.S./Canadian Parts Content:", "65%"],
            ["Major Sources of Foreign Parts:", "Mexico 25%"],
          ].map(([label, val]) => (
            <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", fontSize: "6.5px", gap: "4px" }}>
              <span style={{ color: "#444" }}>{label}</span>
              <strong style={{ color: "#000", whiteSpace: "nowrap" }}>{val}</strong>
            </div>
          ))}
          <div style={{ fontSize: "5.5px", color: "#888", lineHeight: 1.4, marginTop: "2px" }}>
            NOTE: PARTS CONTENT DOES NOT INCLUDE FINAL ASSEMBLY, DISTRIBUTION, OR OTHER NON-PARTS COSTS.
          </div>

          <div style={{ borderTop: "0.75px solid #ccc", paddingTop: "5px", marginTop: "2px" }}>
            <div style={{ fontSize: "6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>
              FOR THIS VEHICLE:
            </div>
            {[
              ["Final Assembly Point:", sticker.assemblyPlant ?? "United States"],
              ["Country of Origin:", "United States"],
              ["Engine:", sticker.engine ?? "—"],
              ["Transmission:", sticker.transmission ?? "—"],
            ].map(([l, v]) => (
              <div key={String(l)} style={{ display: "flex", flexDirection: "column", marginBottom: "3px" }}>
                <span style={{ fontSize: "5.5px", color: "#777", textTransform: "uppercase" }}>{l}</span>
                <span style={{ fontSize: "6.5px", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Barcode placeholder */}
          <div style={{ marginTop: "auto", paddingTop: "8px", borderTop: "0.75px solid #ccc" }}>
            {/* Simulated barcode */}
            <div
              style={{
                display: "flex",
                gap: "1px",
                height: "28px",
                alignItems: "stretch",
                marginBottom: "2px",
              }}
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: Math.random() > 0.6 ? 2 : 1,
                    backgroundColor: i % 3 === 0 ? "transparent" : "#000",
                    minWidth: "1px",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: "5.5px",
                fontFamily: "Courier New, monospace",
                color: "#444",
                letterSpacing: "0.04em",
                textAlign: "center",
              }}
            >
              {sticker.vin}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid #ccc",
          padding: "4px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#fafafa",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "5.5px", color: "#aaa", lineHeight: 1.5, flex: 1 }}>
          THIS DOCUMENT IS A RECONSTRUCTED HISTORICAL REPRESENTATION FOR ENTHUSIAST AND REFERENCE USE ONLY.
          NOT AN OFFICIAL MONRONEY LABEL. NOT AFFILIATED WITH OR ENDORSED BY GENERAL MOTORS, CHEVROLET, OR ANY ORIGINAL EQUIPMENT MANUFACTURER.
          SPECIFICATIONS, PRICING, AND EQUIPMENT ARE APPROXIMATE HISTORICAL VALUES. NOT A LEGAL DOCUMENT.
        </div>
        <div
          style={{
            fontSize: "5.5px",
            color: "#888",
            textAlign: "right",
            whiteSpace: "nowrap",
          }}
        >
          <div>PULL THIS STRIP TO EXPOSE ADHESIVE ►</div>
          <div style={{ marginTop: "2px", fontFamily: "Courier New, monospace" }}>
            Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  );
}
