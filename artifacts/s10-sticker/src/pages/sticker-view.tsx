import React, { useRef } from 'react';
import { useParams, Link } from 'wouter';
import { useGetSticker, getGetStickerQueryKey, useGenerateStickerPdf } from '@workspace/api-client-react';
import { StickerPreview } from '@/components/sticker-preview';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

export default function StickerView() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  const { data: sticker, isLoading } = useGetSticker(id, {
    query: {
      enabled: !!id,
      queryKey: getGetStickerQueryKey(id)
    }
  });

  const generatePdf = useGenerateStickerPdf();

  const handlePdfDownload = () => {
    if (!id) return;
    generatePdf.mutate({ id }, {
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
      const dataUrl = canvas.toDataDataURL('image/png');
      const link = document.createElement('a');
      link.download = `S10_Sticker_${sticker?.vin || 'export'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      toast({ title: 'Export Failed', description: 'Could not generate PNG image.', variant: 'destructive' });
    }
  };

  const handleShare = () => {
    if (!sticker) return;
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!', description: 'Share link copied to clipboard.' });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (!sticker) return <div className="text-center py-12 text-muted-foreground">Sticker not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <Link href="/stickers" className="text-sm font-medium text-primary hover:underline">&larr; Back to Archive</Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={handlePngDownload}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
          <Button size="sm" onClick={handlePdfDownload} disabled={generatePdf.isPending}>
            {generatePdf.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download PDF
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-100 p-8 rounded-lg border overflow-auto flex justify-center">
        <div ref={previewRef}>
          <StickerPreview sticker={sticker} />
        </div>
      </div>
    </div>
  );
}
