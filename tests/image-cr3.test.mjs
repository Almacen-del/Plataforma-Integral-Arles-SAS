import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractCR3Preview} from '../image-cr3.js';
function fixture(){
 const b=new Uint8Array(80),v=new DataView(b.buffer);v.setUint32(0,16);b.set(new TextEncoder().encode('ftypcrx '),4);v.setUint32(16,64);b.set(new TextEncoder().encode('uuid'),20);
 b.set(Uint8Array.from('eaf42b5e1c984b88b9fbb7dc406e4d16'.match(/../g).map(x=>parseInt(x,16))),24);
 b.set(new TextEncoder().encode('PRVW'),52);v.setUint32(68,4);b.set([255,216,255,217],72);return b;
}
test('extracts only the bounded Canon preview and preserves input',()=>{const b=fixture(),copy=b.slice();assert.deepEqual([...extractCR3Preview(b.buffer)],[255,216,255,217]);assert.deepEqual(b,copy);});
test('rejects truncation, invalid size, fake brands and unrelated JPEG data',()=>{
 for(const mutate of [b=>b.subarray(0,60).slice(),b=>{new DataView(b.buffer).setUint32(68,999999);return b;},b=>{b[8]=0;return b;},b=>{b[24]=0;return b;},b=>{new DataView(b.buffer).setUint32(16,4);return b;}])assert.equal(extractCR3Preview(mutate(fixture()).buffer),null);
});
