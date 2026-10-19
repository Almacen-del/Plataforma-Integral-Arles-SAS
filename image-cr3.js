// Canon CR3 ISO-BMFF preview UUID, documented by ExifTool QuickTime.pm.
// Original parser: read bounded boxes, never scan arbitrary RAW bytes for JPEG markers.
const previewUUID='eaf42b5e1c984b88b9fbb7dc406e4d16';
export function extractCR3Preview(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);
 const text=(p,n)=>String.fromCharCode(...bytes.subarray(p,p+n));
 if(bytes.length<16||text(4,4)!=='ftyp'||text(8,4)!=='crx ')return null;
 let offset=0;
 while(offset+8<=bytes.length){
  let size=view.getUint32(offset),header=8;
  if(size===1){if(offset+16>bytes.length)return null;const wide=view.getBigUint64(offset+8);if(wide>BigInt(Number.MAX_SAFE_INTEGER))return null;size=Number(wide);header=16;}
  if(size===0)size=bytes.length-offset;
  if(size<header||size>bytes.length-offset)return null;
  const start=offset+header,end=offset+size;
  if(text(offset+4,4)==='uuid'&&end-start>=48){
   const uuid=[...bytes.subarray(start,start+16)].map(v=>v.toString(16).padStart(2,'0')).join('');
   if(uuid===previewUUID&&text(start+28,4)==='PRVW'){
    const count=view.getUint32(start+44),jpeg=start+48;
    if(count>=4&&count<=end-jpeg&&bytes[jpeg]===255&&bytes[jpeg+1]===216&&bytes[jpeg+count-2]===255&&bytes[jpeg+count-1]===217)return bytes.slice(jpeg,jpeg+count);
   }
  }
  offset=end;
 }
 return null;
}
