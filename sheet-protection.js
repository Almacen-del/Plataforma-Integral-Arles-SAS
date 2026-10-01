// Local editing policy. Password verifiers are not file encryption.
const grants=new Set();
const grantKey=(r,sheetId)=>sheetId+'|'+r.id+'|'+r.range+'|'+(r.password?.hash||'');
export function resetRangeAccess(){grants.clear();}
export function assertBookStructure(book){if(book.structureProtection?.enabled)throw Error('Desprotege el libro para cambiar sus hojas.');}
export function assertAnnotations(sheet){if(sheet.protected&&!sheet.protection?.editAnnotations)throw Error('Desprotege la hoja o permite editar comentarios y notas.');}
export function rangeHas(ref,area){
 const parse=s=>{const m=/^([A-Z])(\d{1,3})$/.exec(s);if(!m||+m[2]<1||+m[2]>100)throw Error('Usa un rango entre A1 y Z100.');return [+m[2],m[1].charCodeAt(0)];};
 const parts=String(area).toUpperCase().split(':');if(parts.length>2)throw Error('Rango no válido.');const a=parse(parts[0]),b=parse(parts[1]||parts[0]),p=parse(ref);
 return p[0]>=Math.min(a[0],b[0])&&p[0]<=Math.max(a[0],b[0])&&p[1]>=Math.min(a[1],b[1])&&p[1]<=Math.max(a[1],b[1]);
}
export function cellEditable(sheet,ref){return !sheet.protected||sheet.cells[ref]?.locked===false||(sheet.editableRanges||[]).some(r=>rangeHas(ref,r.range)&&(!r.password||grants.has(grantKey(r,sheet.id))));}
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
async function derive(password,salt,iterations){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt.match(/../g).map(x=>parseInt(x,16))),iterations},key,256)));}
export async function passwordVerifier(password){if(!password)return null;if(password.length>200)throw Error('La contraseña admite hasta 200 caracteres.');const salt=hex(crypto.getRandomValues(new Uint8Array(16))),iterations=100000;return {salt,iterations,hash:await derive(password,salt,iterations)};}
export async function verifyPassword(password,verifier){return !verifier||await derive(password,verifier.salt,verifier.iterations)===verifier.hash;}
export async function unlockEditRange(entry,password,sheetId){if(!await verifyPassword(password,entry.password))throw Error('Contraseña incorrecta.');grants.add(grantKey(entry,sheetId));}
