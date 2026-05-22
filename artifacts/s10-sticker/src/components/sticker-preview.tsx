import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sticker } from "@workspace/api-client-react/src/generated/api.schemas";

export function StickerPreview({ sticker }: { sticker: Sticker }) {
  const destCharge = 450;
  
  return (
    <div className="sticker-preview flex flex-col" id="sticker-preview-container" style={{ width: '800px', backgroundColor: '#fcfcfc', border: '1px solid #1a1a1a', padding: '24px', fontFamily: "'Space Mono', monospace", color: '#111' }}>
      
      {/* Header */}
      <div className="flex justify-between items-end border-b-4 border-black pb-4 mb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>CHEVROLET</h1>
          <div className="text-xl font-bold mt-1 tracking-widest uppercase">{sticker.year} {sticker.model} {sticker.trim}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase font-bold text-gray-600 tracking-widest">Vehicle Identification Number</div>
          <div className="text-xl font-bold tracking-widest mt-1">{sticker.vin}</div>
        </div>
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-[1fr_2fr_1fr] gap-0 border-2 border-black mb-6">
        
        {/* Left Column - Vehicle Desc */}
        <div className="border-r-2 border-black p-4">
          <h2 className="font-bold text-sm bg-black text-white px-2 py-1 uppercase mb-4 text-center tracking-wider">Vehicle Description</h2>
          <div className="space-y-3 text-xs">
            <div>
              <div className="font-bold text-gray-500 uppercase text-[10px]">Assembly Plant</div>
              <div className="font-semibold">{sticker.assemblyPlant || 'N/A'}</div>
            </div>
            <div>
              <div className="font-bold text-gray-500 uppercase text-[10px]">Body Style</div>
              <div className="font-semibold">{sticker.bodyStyle || 'N/A'}</div>
            </div>
            <div>
              <div className="font-bold text-gray-500 uppercase text-[10px]">Cab Configuration</div>
              <div className="font-semibold">{sticker.cabConfig || 'N/A'}</div>
            </div>
            <div className="pt-2 border-t border-gray-300">
              <div className="font-bold text-gray-500 uppercase text-[10px]">Exterior Color</div>
              <div className="font-semibold uppercase">{sticker.exteriorColor || 'N/A'}</div>
            </div>
            <div>
              <div className="font-bold text-gray-500 uppercase text-[10px]">Interior Color</div>
              <div className="font-semibold uppercase">{sticker.interiorColor || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Middle Column - Standard Equip */}
        <div className="p-4 border-r-2 border-black">
          <h2 className="font-bold text-sm bg-black text-white px-2 py-1 uppercase mb-4 text-center tracking-wider">Standard Equipment</h2>
          <div className="text-[10px] uppercase font-bold text-gray-500 mb-2 border-b border-gray-300 pb-1">Items featured below are included at no extra charge in the standard vehicle price shown</div>
          <ul className="text-[11px] space-y-1 column-count-2 gap-4">
            {sticker.standardEquipment?.map((eq, i) => (
              <li key={i} className="break-inside-avoid leading-tight">• {eq}</li>
            ))}
            {!sticker.standardEquipment?.length && (
              <li className="italic text-gray-500">Standard equipment list unavailable</li>
            )}
          </ul>
        </div>

        {/* Right Column - Pricing */}
        <div className="p-0 flex flex-col h-full bg-[#f8f8f8]">
          <h2 className="font-bold text-sm bg-black text-white px-2 py-1 uppercase text-center tracking-wider m-4 mb-2">Manufacturer's Suggested Retail Price</h2>
          
          <div className="px-4 flex-1">
            <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-2">
              <span className="text-xs font-bold uppercase">Standard Vehicle Price</span>
              <span className="text-base font-bold">${sticker.msrpBase?.toLocaleString()}</span>
            </div>

            <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Options Installed By Manufacturer</div>
            <div className="text-xs space-y-1 mb-4">
              {sticker.selectedOptions?.map((opt, i) => (
                <div key={i} className="flex justify-between items-end leading-tight">
                  <span className="pr-2">{opt.description}</span>
                  <span className="whitespace-nowrap">${opt.price}</span>
                </div>
              ))}
              {!sticker.selectedOptions?.length && (
                <div className="italic text-gray-500">No optional equipment selected</div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-200 border-t-2 border-black p-4 pt-3 mt-auto">
             <div className="flex justify-between items-end mb-2">
                <span className="text-[11px] uppercase">Destination Charge</span>
                <span className="text-sm font-bold">${destCharge}</span>
             </div>
             <div className="flex justify-between items-end border-t-4 border-black pt-2">
               <span className="text-sm font-black uppercase">Total Vehicle Price</span>
               <span className="text-xl font-black">${(sticker.msrpBase + (sticker.selectedOptions?.reduce((a,b)=>a+b.price,0)||0) + destCharge).toLocaleString()}</span>
             </div>
          </div>
        </div>

      </div>

      {/* EPA Grid */}
      <div className="grid grid-cols-2 gap-0 border-2 border-black mb-4 h-32">
        <div className="p-4 border-r-2 border-black flex flex-col justify-center items-center text-center">
           <div className="text-sm font-black uppercase mb-1">EPA Fuel Economy Estimates</div>
           <div className="flex items-center gap-6 mt-2">
             <div className="text-center">
               <div className="text-3xl font-black leading-none">{sticker.epaCity || '--'}</div>
               <div className="text-[10px] uppercase font-bold text-gray-600 mt-1">Estimated<br/>City MPG</div>
             </div>
             <div className="text-center">
               <div className="text-3xl font-black leading-none">{sticker.epaHighway || '--'}</div>
               <div className="text-[10px] uppercase font-bold text-gray-600 mt-1">Estimated<br/>Highway MPG</div>
             </div>
           </div>
        </div>
        <div className="p-4 flex flex-col justify-center text-xs space-y-2">
          <div className="flex justify-between border-b border-dashed border-gray-400 pb-1">
            <span className="font-bold uppercase">Engine</span>
            <span>{sticker.engineDisplacement}L {sticker.engineCylinders} Cyl ({sticker.engine})</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-400 pb-1">
            <span className="font-bold uppercase">Performance</span>
            <span>{sticker.horsepower} HP @ {sticker.torque} lb-ft</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-400 pb-1">
            <span className="font-bold uppercase">Transmission</span>
            <span>{sticker.transmission}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="font-bold uppercase">Drivetrain</span>
            <span>{sticker.drivetrain}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-2 border-t-2 border-gray-300 text-[9px] text-center text-gray-500 uppercase tracking-widest leading-relaxed">
        <p>Not affiliated with or endorsed by General Motors, Chevrolet, or any OEM.</p>
        <p>Reconstructed from historical data for enthusiast reference. Not an official document.</p>
      </div>
    </div>
  );
}
