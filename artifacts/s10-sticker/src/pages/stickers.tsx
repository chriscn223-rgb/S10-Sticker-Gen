import React from 'react';
import { useListStickers, getListStickersQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { format } from 'date-fns';

export default function Stickers() {
  const { data: stickers, isLoading } = useListStickers({
    query: { queryKey: getListStickersQueryKey() }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Sticker Archive</h1>
      {!stickers?.length ? (
        <p>No stickers generated yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stickers.map(sticker => (
            <Link key={sticker.id} href={`/sticker/${sticker.id}`} className="block">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{sticker.year} {sticker.trim}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">VIN: {sticker.vin}</p>
                  <p className="text-sm text-muted-foreground">Generated: {format(new Date(sticker.createdAt), 'PP')}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
