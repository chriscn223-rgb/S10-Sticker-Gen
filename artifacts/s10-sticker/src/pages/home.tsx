import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useDecodeVin, useGetS10ConfigsByYear, useCreateSticker, useGenerateStickerPdf } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StickerPreview } from '@/components/sticker-preview';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Image as ImageIcon, Search } from 'lucide-react';
import { getGetS10ConfigsByYearQueryKey } from '@workspace/api-client-react';
import html2canvas from 'html2canvas';

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [vin, setVin] = useState('');
  
  const decodeVin = useDecodeVin();
  const createSticker = useCreateSticker();
  const generatePdf = useGenerateStickerPdf();

  const [decodedData, setDecodedData] = useState<any>(null);
  const [year, setYear] = useState<number>(0);
  
  const configsQuery = useGetS10ConfigsByYear(year, { 
    query: { 
      enabled: !!year,
      queryKey: getGetS10ConfigsByYearQueryKey(year)
    } 
  });

  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
  const [extColor, setExtColor] = useState('');
  const [intColor, setIntColor] = useState('');
  const [disclaimer, setDisclaimer] = useState(false);

  const [previewSticker, setPreviewSticker] = useState<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDecode = () => {
    if (vin.length !== 17) {
      toast({ title: 'Invalid VIN', description: 'VIN must be exactly 17 characters', variant: 'destructive' });
      return;
    }
    decodeVin.mutate({ data: { vin } }, {
      onSuccess: (res) => {
        if (!res.isValid || !res.isS10) {
          toast({ title: 'Invalid Vehicle', description: 'VIN is not a valid Chevy S10', variant: 'destructive' });
          return;
        }
        setDecodedData(res);
        if (res.year) setYear(res.year);
        setStep(2);
      },
      onError: (err) => {
        toast({ title: 'Error', description: err.error || 'Failed to decode VIN', variant: 'destructive' });
      }
    });
  };

  const handleGenerate = () => {
    if (!disclaimer) {
      toast({ title: 'Disclaimer required', description: 'Please acknowledge the disclaimer', variant: 'destructive' });
      return;
    }

    const config = decodedData.suggestedConfig || configsQuery.data?.[0];
    if (!config) return;

    const basePrice = config.msrpBase || 15000;
    const optionsTotal = selectedOptions.reduce((acc, opt) => acc + opt.price, 0);

    const inputData = {
      vin: decodedData.vin,
      year: decodedData.year || 1990,
      make: decodedData.make || 'Chevrolet',
      model: decodedData.model || 'S10',
      trim: decodedData.trim || config.trim,
      engine: config.engine,
      engineDisplacement: config.engineDisplacement,
      engineCylinders: config.engineCylinders,
      horsepower: config.horsepower,
      torque: config.torque,
      transmission: config.transmission,
      drivetrain: config.drivetrain,
      cabConfig: config.cabConfig,
      bodyStyle: config.bodyStyle,
      assemblyPlant: decodedData.assemblyPlant,
      exteriorColor: extColor,
      interiorColor: intColor,
      msrpBase: basePrice,
      epaCity: config.epaCity,
      epaHighway: config.epaHighway,
      standardEquipment: config.standardEquipment,
      selectedOptions: selectedOptions,
      disclaimerAcknowledged: true
    };

    createSticker.mutate({ data: inputData }, {
      onSuccess: (res) => {
        setPreviewSticker(res);
        setStep(3);
      },
      onError: (err) => {
        toast({ title: 'Error', description: err.error || 'Failed to generate sticker', variant: 'destructive' });
      }
    });
  };

  const handlePdfDownload = () => {
    if (!previewSticker?.id) return;
    generatePdf.mutate({ id: previewSticker.id }, {
      onSuccess: (res) => {
        window.open(res.url, '_blank');
      },
      onError: (err) => {
        toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
      }
    });
  };

  const handlePngDownload = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `S10_Sticker_${previewSticker?.vin || 'export'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      toast({ title: 'Export Failed', description: 'Could not generate PNG image.', variant: 'destructive' });
    }
  };

  const runningTotal = (decodedData?.suggestedConfig?.msrpBase || configsQuery.data?.[0]?.msrpBase || 15000) 
    + selectedOptions.reduce((acc, opt) => acc + opt.price, 0)
    + 450; // Destination charge

  return (
    <div className="max-w-4xl mx-auto py-8">
      {step === 1 && (
        <Card className="shadow-lg border-2 border-primary/10">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="text-2xl font-bold uppercase tracking-wider text-primary">VIN DECODER</CardTitle>
            <CardDescription>Enter the 17-character Vehicle Identification Number for your 1982-2004 Chevrolet S10.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Vehicle Identification Number</Label>
              <div className="flex gap-2">
                <Input 
                  className="font-mono text-lg uppercase h-12"
                  value={vin} 
                  onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17))} 
                  maxLength={17}
                  placeholder="1GC..."
                />
                <Button size="lg" className="h-12 px-8" onClick={handleDecode} disabled={decodeVin.isPending || vin.length !== 17}>
                  {decodeVin.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                  Decode
                </Button>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{vin.length}/17 characters</span>
                <span>(Letters I, O, and Q are never used)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && decodedData && (
        <div className="space-y-6">
          <Card className="shadow-lg border-2 border-primary/10">
            <CardHeader className="bg-muted/50 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold uppercase tracking-wider text-primary">VEHICLE DETAILS</CardTitle>
                <CardDescription>Review decoded data and select options.</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-muted-foreground uppercase">Estimated MSRP</div>
                <div className="text-2xl font-black font-mono text-primary">${runningTotal.toLocaleString()}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-lg border">
                <div className="space-y-1 border-b pb-2 md:border-b-0 md:border-r md:pr-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vehicle Info</div>
                  <div className="font-mono text-sm">
                    <div><span className="font-semibold">Year:</span> {decodedData.year}</div>
                    <div><span className="font-semibold">Make:</span> {decodedData.make}</div>
                    <div><span className="font-semibold">Model:</span> {decodedData.model}</div>
                    <div><span className="font-semibold">Trim:</span> {decodedData.trim || 'Standard'}</div>
                    <div><span className="font-semibold">Assembly:</span> {decodedData.assemblyPlant || 'N/A'}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Powertrain</div>
                  <div className="font-mono text-sm">
                    <div><span className="font-semibold">Engine:</span> {decodedData.suggestedConfig?.engine || 'N/A'}</div>
                    <div><span className="font-semibold">Transmission:</span> {decodedData.suggestedConfig?.transmission || 'N/A'}</div>
                    <div><span className="font-semibold">Drivetrain:</span> {decodedData.suggestedConfig?.drivetrain || 'N/A'}</div>
                    <div><span className="font-semibold">Cab Config:</span> {decodedData.suggestedConfig?.cabConfig || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Exterior Color</Label>
                  <Input value={extColor} onChange={e => setExtColor(e.target.value)} placeholder="e.g. Apple Red" className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Interior Color</Label>
                  <Input value={intColor} onChange={e => setIntColor(e.target.value)} placeholder="e.g. Charcoal" className="font-mono" />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-bold uppercase border-b pb-2 block">Optional Equipment</Label>
                {configsQuery.isLoading ? (
                  <div className="flex items-center space-x-2 text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /> <span>Loading options database...</span></div>
                ) : configsQuery.data && configsQuery.data[0]?.availableOptions?.length ? (
                  <div className="grid gap-3 bg-card border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    {configsQuery.data[0].availableOptions.map((opt: any) => (
                      <div key={opt.code} className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                        <Checkbox 
                          id={opt.code} 
                          className="mt-1"
                          checked={selectedOptions.some(o => o.code === opt.code)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedOptions([...selectedOptions, opt]);
                            else setSelectedOptions(selectedOptions.filter(o => o.code !== opt.code));
                          }}
                        />
                        <div className="grid gap-1.5 leading-none flex-1">
                          <label htmlFor={opt.code} className="text-sm font-medium leading-none cursor-pointer flex justify-between">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs mr-2">{opt.code}</span>
                            <span className="flex-1">{opt.description}</span>
                            <span className="font-mono font-bold">${opt.price}</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/20">No specific options found for this configuration.</p>}
              </div>

            </CardContent>
          </Card>

          <div className="flex flex-col items-center gap-6">
            <div className="flex items-start space-x-3 bg-muted/30 p-4 rounded-lg border max-w-2xl">
              <Checkbox id="disclaimer" checked={disclaimer} onCheckedChange={(c) => setDisclaimer(!!c)} className="mt-0.5" />
              <label htmlFor="disclaimer" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                I acknowledge that the generated document is a reconstructed historical representation intended for reference and enthusiast use. It is not an official document and is not endorsed by or affiliated with General Motors.
              </label>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <Button variant="outline" size="lg" className="flex-1 md:w-32" onClick={() => setStep(1)}>Back</Button>
              <Button size="lg" className="flex-1 md:w-64 font-bold" onClick={handleGenerate} disabled={createSticker.isPending || !disclaimer}>
                {createSticker.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                GENERATE STICKER
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && previewSticker && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-primary">Sticker Generated Successfully</h2>
              <p className="text-sm text-muted-foreground font-mono">{previewSticker.vin}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => {
                const url = `${window.location.origin}/sticker/${previewSticker.id}`;
                navigator.clipboard.writeText(url);
                toast({ title: 'Link copied!' });
              }}>
                <LinkIcon className="h-4 w-4 mr-2" /> Share Link
              </Button>
              <Button variant="outline" size="sm" onClick={handlePngDownload}>
                <ImageIcon className="h-4 w-4 mr-2" /> PNG
              </Button>
              <Button size="sm" onClick={handlePdfDownload} disabled={generatePdf.isPending}>
                {generatePdf.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { 
                setStep(1); setVin(''); setDecodedData(null); setSelectedOptions([]); setDisclaimer(false); 
              }}>
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
