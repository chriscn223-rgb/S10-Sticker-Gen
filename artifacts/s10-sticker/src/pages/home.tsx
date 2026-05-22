import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  useDecodeVin,
  useGetS10ConfigsByYear,
  useCreateSticker,
  useGenerateStickerPdf,
  getGetS10ConfigsByYearQueryKey,
} from '@workspace/api-client-react';
import type { S10Config, VinDecodeResult } from '@workspace/api-client-react/src/generated/api.schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StickerPreview } from '@/components/sticker-preview';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Image as ImageIcon, Search, PenLine, Link as LinkIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryMode = 'vin' | 'manual';

interface DecodedVehicle {
  vin: string;
  isValid: boolean;
  isS10: boolean;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  assemblyPlant: string | null;
  suggestedConfig: S10Config | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const YEARS = Array.from({ length: 2004 - 1982 + 1 }, (_, i) => 1982 + i);

function configLabel(c: S10Config): string {
  return `${c.trim} · ${c.engine} · ${c.drivetrain} · ${c.cabConfig}  —  $${c.msrpBase.toLocaleString()}`;
}

function placeholderVin(): string {
  // 17-char placeholder: valid WMI prefix + padding; not submitted to decode endpoint
  return `1GCC00000M0000000`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [entryMode, setEntryMode] = useState<EntryMode>('vin');

  // ── Step 1 VIN mode
  const [vin, setVin] = useState('');
  const decodeVin = useDecodeVin();

  // ── Step 1 Manual mode
  const [manualYear, setManualYear] = useState<number>(0);
  const [manualConfigIdx, setManualConfigIdx] = useState<number | null>(null);
  const [manualVin, setManualVin] = useState('');

  const manualConfigsQuery = useGetS10ConfigsByYear(manualYear, {
    query: {
      enabled: manualYear >= 1982,
      queryKey: getGetS10ConfigsByYearQueryKey(manualYear),
    },
  });
  const manualConfigs = manualConfigsQuery.data ?? [];

  // ── Shared wizard state
  const [decodedData, setDecodedData] = useState<DecodedVehicle | null>(null);
  const [year, setYear] = useState<number>(0);

  const configsQuery = useGetS10ConfigsByYear(year, {
    query: {
      enabled: !!year,
      queryKey: getGetS10ConfigsByYearQueryKey(year),
    },
  });

  const [selectedOptions, setSelectedOptions] = useState<Array<{ code: string; description: string; price: number }>>([]);
  const [extColor, setExtColor] = useState('');
  const [intColor, setIntColor] = useState('');
  const [disclaimer, setDisclaimer] = useState(false);

  const [previewSticker, setPreviewSticker] = useState<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const createSticker = useCreateSticker();
  const generatePdf = useGenerateStickerPdf();

  // ── Handlers ─────────────────────────────────────────────────────────────

  function resetWizard() {
    setStep(1);
    setVin('');
    setManualYear(0);
    setManualConfigIdx(null);
    setManualVin('');
    setDecodedData(null);
    setYear(0);
    setSelectedOptions([]);
    setExtColor('');
    setIntColor('');
    setDisclaimer(false);
    setPreviewSticker(null);
  }

  function enterStep2(data: DecodedVehicle) {
    setDecodedData(data);
    if (data.year) setYear(data.year);
    setSelectedOptions([]);
    setStep(2);
  }

  // VIN mode: decode
  function handleDecode() {
    if (vin.length !== 17) {
      toast({ title: 'Invalid VIN', description: 'VIN must be exactly 17 characters.', variant: 'destructive' });
      return;
    }
    decodeVin.mutate({ data: { vin } }, {
      onSuccess: (res: VinDecodeResult) => {
        if (!res.isValid || !res.isS10) {
          toast({ title: 'Not an S10', description: 'This VIN is not a valid 1982–2004 Chevrolet S10.', variant: 'destructive' });
          return;
        }
        enterStep2({
          vin: res.vin,
          isValid: true,
          isS10: true,
          year: res.year ?? null,
          make: res.make ?? 'Chevrolet',
          model: res.model ?? 'S10',
          trim: res.trim ?? null,
          assemblyPlant: res.assemblyPlant ?? null,
          suggestedConfig: (res.suggestedConfig as S10Config | null) ?? null,
        });
      },
      onError: (err: any) => {
        toast({ title: 'Decode failed', description: err?.error ?? 'VIN could not be decoded.', variant: 'destructive' });
      },
    });
  }

  // Manual mode: continue
  function handleManualContinue() {
    if (!manualYear) {
      toast({ title: 'Select a year', description: 'Choose a model year to continue.', variant: 'destructive' });
      return;
    }
    if (manualConfigIdx === null) {
      toast({ title: 'Select a configuration', description: 'Choose a trim/engine configuration to continue.', variant: 'destructive' });
      return;
    }
    const config = manualConfigs[manualConfigIdx];
    if (!config) return;

    const effectiveVin = manualVin.length === 17 ? manualVin.toUpperCase() : placeholderVin();

    enterStep2({
      vin: effectiveVin,
      isValid: true,
      isS10: true,
      year: manualYear,
      make: 'Chevrolet',
      model: 'S10',
      trim: config.trim,
      assemblyPlant: null,
      suggestedConfig: config,
    });
  }

  // Step 2: generate sticker
  function handleGenerate() {
    if (!disclaimer) {
      toast({ title: 'Disclaimer required', description: 'Please acknowledge the disclaimer before generating.', variant: 'destructive' });
      return;
    }
    const config = decodedData?.suggestedConfig ?? configsQuery.data?.[0];
    if (!config) return;

    createSticker.mutate({
      data: {
        vin: decodedData!.vin,
        year: decodedData!.year ?? 1990,
        make: decodedData!.make ?? 'Chevrolet',
        model: decodedData!.model ?? 'S10',
        trim: decodedData!.trim ?? config.trim,
        engine: config.engine,
        engineDisplacement: config.engineDisplacement,
        engineCylinders: config.engineCylinders,
        horsepower: config.horsepower,
        torque: config.torque,
        transmission: config.transmission,
        drivetrain: config.drivetrain,
        cabConfig: config.cabConfig,
        bodyStyle: config.bodyStyle,
        assemblyPlant: decodedData!.assemblyPlant,
        exteriorColor: extColor || null,
        interiorColor: intColor || null,
        msrpBase: config.msrpBase,
        epaCity: config.epaCity,
        epaHighway: config.epaHighway,
        standardEquipment: config.standardEquipment,
        selectedOptions,
        disclaimerAcknowledged: true,
      },
    }, {
      onSuccess: (res) => {
        setPreviewSticker(res);
        setStep(3);
      },
      onError: (err: any) => {
        toast({ title: 'Error', description: err?.error ?? 'Failed to generate sticker.', variant: 'destructive' });
      },
    });
  }

  // Step 3: download PDF
  function handlePdfDownload() {
    if (!previewSticker?.id) return;
    generatePdf.mutate({ id: previewSticker.id }, {
      onSuccess: (res) => {
        const a = document.createElement('a');
        a.href = res.url;
        a.download = res.filename;
        a.click();
      },
      onError: () => {
        toast({ title: 'PDF failed', description: 'Could not generate PDF.', variant: 'destructive' });
      },
    });
  }

  // Step 3: download PNG
  async function handlePngDownload() {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2 });
      const a = document.createElement('a');
      a.download = `S10_Sticker_${previewSticker?.vin ?? 'export'}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    } catch {
      toast({ title: 'PNG failed', description: 'Could not export image.', variant: 'destructive' });
    }
  }

  const runningTotal =
    (decodedData?.suggestedConfig?.msrpBase ?? configsQuery.data?.[0]?.msrpBase ?? 15000) +
    selectedOptions.reduce((s, o) => s + o.price, 0) +
    450;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto py-8">

      {/* ── STEP 1 ─────────────────────────────────────────────────────── */}
      {step === 1 && (
        <Card className="shadow-lg border-2 border-primary/10" data-testid="step-1-card">
          <CardHeader className="bg-muted/50 border-b pb-0">
            <CardTitle className="text-2xl font-bold uppercase tracking-wider text-primary">
              Generate Window Sticker
            </CardTitle>
            <CardDescription className="mb-4">
              Decode a VIN to auto-fill vehicle data, or build a sticker from scratch using manual entry.
            </CardDescription>

            {/* Mode tabs */}
            <div className="flex gap-1 border-b border-transparent -mb-px mt-2">
              <button
                data-testid="tab-vin"
                onClick={() => setEntryMode('vin')}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  entryMode === 'vin'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Search className="h-4 w-4" />
                VIN Decode
              </button>
              <button
                data-testid="tab-manual"
                onClick={() => setEntryMode('manual')}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  entryMode === 'manual'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <PenLine className="h-4 w-4" />
                Manual Entry
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">

            {/* ── VIN mode ── */}
            {entryMode === 'vin' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Vehicle Identification Number</Label>
                  <div className="flex gap-2">
                    <Input
                      data-testid="input-vin"
                      className="font-mono text-lg uppercase h-12 tracking-widest"
                      value={vin}
                      onChange={(e) =>
                        setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17))
                      }
                      maxLength={17}
                      placeholder="1GC..."
                      onKeyDown={(e) => e.key === 'Enter' && handleDecode()}
                    />
                    <Button
                      data-testid="button-decode"
                      size="lg"
                      className="h-12 px-8"
                      onClick={handleDecode}
                      disabled={decodeVin.isPending || vin.length !== 17}
                    >
                      {decodeVin.isPending
                        ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        : <Search className="mr-2 h-5 w-5" />}
                      Decode
                    </Button>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span data-testid="text-vin-count">{vin.length}/17 characters</span>
                    <span>Letters I, O, and Q are never used in VINs</span>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg border p-4 text-sm text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-2">S10 VIN Guide</p>
                  <p><span className="font-mono bg-background px-1 rounded">1GC</span> — U.S.-built Chevrolet truck (first 3 digits)</p>
                  <p><span className="font-mono bg-background px-1 rounded">pos 4</span> — Division code &nbsp;
                     <span className="font-mono bg-background px-1 rounded">pos 5</span> — Model/cab (C=Reg, T=Ext, P=Crew)</p>
                  <p><span className="font-mono bg-background px-1 rounded">pos 8</span> — Engine &nbsp;
                     <span className="font-mono bg-background px-1 rounded">pos 10</span> — Model year (C=1982 … 4=2004)</p>
                </div>
              </div>
            )}

            {/* ── Manual Entry mode ── */}
            {entryMode === 'manual' && (
              <div className="space-y-6">

                {/* Year */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Model Year</Label>
                  <Select
                    value={manualYear ? String(manualYear) : ''}
                    onValueChange={(v) => {
                      setManualYear(Number(v));
                      setManualConfigIdx(null);
                    }}
                  >
                    <SelectTrigger data-testid="select-year" className="h-11 font-mono text-base">
                      <SelectValue placeholder="Select year (1982–2004)" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)} data-testid={`year-option-${y}`}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Config — shown once year selected */}
                {manualYear >= 1982 && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Trim / Engine / Drivetrain / Cab
                    </Label>
                    {manualConfigsQuery.isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground h-11 border rounded-md px-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading {manualYear} configurations…
                      </div>
                    ) : manualConfigs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No configurations found for {manualYear}.</p>
                    ) : (
                      <Select
                        value={manualConfigIdx !== null ? String(manualConfigIdx) : ''}
                        onValueChange={(v) => setManualConfigIdx(Number(v))}
                      >
                        <SelectTrigger data-testid="select-config" className="h-11 text-sm">
                          <SelectValue placeholder="Select a configuration…" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {manualConfigs.map((c, i) => (
                            <SelectItem
                              key={i}
                              value={String(i)}
                              data-testid={`config-option-${i}`}
                              className="font-mono text-xs"
                            >
                              {configLabel(c)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Selected config preview */}
                {manualConfigIdx !== null && manualConfigs[manualConfigIdx] && (() => {
                  const c = manualConfigs[manualConfigIdx];
                  return (
                    <div className="bg-muted/30 border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {[
                        ['Trim', c.trim],
                        ['Engine', c.engine],
                        ['Drivetrain', c.drivetrain],
                        ['Cab', c.cabConfig],
                        ['HP / Torque', `${c.horsepower} hp / ${c.torque} lb-ft`],
                        ['Transmission', c.transmission],
                        ['EPA City/Hwy', `${c.epaCity} / ${c.epaHighway} mpg`],
                        ['Base MSRP', `$${c.msrpBase.toLocaleString()}`],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
                          <div className="font-semibold text-foreground leading-tight mt-0.5">{value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Optional VIN */}
                <div className="space-y-2">
                  <Label className="font-semibold">
                    VIN <span className="text-muted-foreground font-normal">(optional — 17 characters if you know it)</span>
                  </Label>
                  <Input
                    data-testid="input-manual-vin"
                    className="font-mono uppercase tracking-widest"
                    value={manualVin}
                    onChange={(e) =>
                      setManualVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17))
                    }
                    maxLength={17}
                    placeholder="Leave blank for a placeholder VIN"
                  />
                  {manualVin.length > 0 && manualVin.length < 17 && (
                    <p className="text-xs text-muted-foreground font-mono">{manualVin.length}/17 — must be exactly 17 chars or leave blank</p>
                  )}
                </div>

                <Button
                  data-testid="button-manual-continue"
                  size="lg"
                  className="w-full font-bold"
                  onClick={handleManualContinue}
                  disabled={!manualYear || manualConfigIdx === null || manualConfigsQuery.isLoading}
                >
                  <PenLine className="mr-2 h-5 w-5" />
                  Continue to Vehicle Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2 ─────────────────────────────────────────────────────── */}
      {step === 2 && decodedData && (
        <div className="space-y-6" data-testid="step-2-container">
          <Card className="shadow-lg border-2 border-primary/10">
            <CardHeader className="bg-muted/50 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold uppercase tracking-wider text-primary">
                  Vehicle Details
                </CardTitle>
                <CardDescription>
                  Review{entryMode === 'manual' ? ' and confirm' : ' decoded data and'} select optional equipment.
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Estimated MSRP</div>
                <div className="text-2xl font-black font-mono text-primary" data-testid="text-msrp-total">
                  ${runningTotal.toLocaleString()}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">
              {/* Vehicle summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-lg border">
                <div className="space-y-1 border-b pb-2 md:border-b-0 md:border-r md:pr-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Vehicle Info</div>
                  <div className="font-mono text-sm space-y-1">
                    {[
                      ['Year', decodedData.year],
                      ['Make', decodedData.make],
                      ['Model', decodedData.model],
                      ['Trim', decodedData.trim ?? (decodedData.suggestedConfig?.trim ?? '—')],
                      ['Assembly', decodedData.assemblyPlant ?? '—'],
                      ['VIN', decodedData.vin],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <span className="font-semibold">{label}: </span>
                        <span className={label === 'VIN' ? 'tracking-widest' : ''}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Powertrain</div>
                  <div className="font-mono text-sm space-y-1">
                    {[
                      ['Engine', decodedData.suggestedConfig?.engine ?? '—'],
                      ['HP / Torque', decodedData.suggestedConfig ? `${decodedData.suggestedConfig.horsepower} hp / ${decodedData.suggestedConfig.torque} lb-ft` : '—'],
                      ['Transmission', decodedData.suggestedConfig?.transmission ?? '—'],
                      ['Drivetrain', decodedData.suggestedConfig?.drivetrain ?? '—'],
                      ['Cab Config', decodedData.suggestedConfig?.cabConfig ?? '—'],
                      ['EPA', decodedData.suggestedConfig ? `${decodedData.suggestedConfig.epaCity} city / ${decodedData.suggestedConfig.epaHighway} hwy mpg` : '—'],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <span className="font-semibold">{label}: </span>{String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Exterior Color</Label>
                  <Input
                    data-testid="input-ext-color"
                    value={extColor}
                    onChange={(e) => setExtColor(e.target.value)}
                    placeholder="e.g. Apple Red Metallic"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interior Color</Label>
                  <Input
                    data-testid="input-int-color"
                    value={intColor}
                    onChange={(e) => setIntColor(e.target.value)}
                    placeholder="e.g. Charcoal Gray"
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Optional equipment */}
              <div className="space-y-4">
                <Label className="text-base font-bold uppercase border-b pb-2 block">Optional Equipment</Label>
                {configsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="animate-spin h-4 w-4" /> Loading options database…
                  </div>
                ) : (configsQuery.data?.[0]?.availableOptions ?? decodedData.suggestedConfig?.availableOptions ?? []).length > 0 ? (
                  <div className="grid gap-2 bg-card border rounded-lg p-4 max-h-72 overflow-y-auto">
                    {(configsQuery.data?.[0]?.availableOptions ?? decodedData.suggestedConfig?.availableOptions ?? []).map((opt) => (
                      <div
                        key={opt.code}
                        className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors"
                        data-testid={`option-${opt.code}`}
                      >
                        <Checkbox
                          id={`opt-${opt.code}`}
                          className="mt-0.5"
                          checked={selectedOptions.some((o) => o.code === opt.code)}
                          onCheckedChange={(checked) => {
                            setSelectedOptions(checked
                              ? [...selectedOptions, opt]
                              : selectedOptions.filter((o) => o.code !== opt.code));
                          }}
                        />
                        <label
                          htmlFor={`opt-${opt.code}`}
                          className="flex flex-1 items-center justify-between cursor-pointer text-sm leading-snug"
                        >
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs mr-2 shrink-0">{opt.code}</span>
                          <span className="flex-1">{opt.description}</span>
                          <span className="font-mono font-bold ml-4 shrink-0">${opt.price}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/20">
                    No factory options available for this configuration.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer + actions */}
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-start gap-3 bg-muted/30 p-4 rounded-lg border max-w-2xl w-full">
              <Checkbox
                id="disclaimer"
                data-testid="checkbox-disclaimer"
                checked={disclaimer}
                onCheckedChange={(c) => setDisclaimer(!!c)}
                className="mt-0.5"
              />
              <label htmlFor="disclaimer" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                I acknowledge that the generated document is a <strong>reconstructed historical representation</strong> for
                reference and enthusiast use only. It is <strong>not an official Monroney label</strong> and is not
                affiliated with or endorsed by General Motors, Chevrolet, or any OEM.
              </label>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Button
                data-testid="button-back"
                variant="outline"
                size="lg"
                className="flex-1 md:w-28"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                data-testid="button-generate"
                size="lg"
                className="flex-1 md:w-64 font-bold"
                onClick={handleGenerate}
                disabled={createSticker.isPending || !disclaimer}
              >
                {createSticker.isPending
                  ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  : null}
                Generate Sticker
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3 ─────────────────────────────────────────────────────── */}
      {step === 3 && previewSticker && (
        <div className="space-y-6" data-testid="step-3-container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-primary">Sticker Generated</h2>
              <p className="text-sm text-muted-foreground font-mono tracking-widest">{previewSticker.vin}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="button-share"
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/sticker/${previewSticker.id}`;
                  navigator.clipboard.writeText(url).then(() =>
                    toast({ title: 'Link copied to clipboard' }),
                  );
                }}
              >
                <LinkIcon className="h-4 w-4 mr-2" /> Share
              </Button>
              <Button
                data-testid="button-download-png"
                variant="outline"
                size="sm"
                onClick={handlePngDownload}
              >
                <ImageIcon className="h-4 w-4 mr-2" /> PNG
              </Button>
              <Button
                data-testid="button-download-pdf"
                size="sm"
                onClick={handlePdfDownload}
                disabled={generatePdf.isPending}
              >
                {generatePdf.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Download className="mr-2 h-4 w-4" />}
                Download PDF
              </Button>
              <Button
                data-testid="button-start-over"
                variant="ghost"
                size="sm"
                onClick={resetWizard}
              >
                Start Over
              </Button>
            </div>
          </div>

          <div className="bg-gray-200 p-8 rounded-xl border shadow-inner overflow-x-auto flex justify-center">
            <div ref={previewRef} className="shadow-2xl">
              <StickerPreview sticker={previewSticker} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
