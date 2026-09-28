import {localDay} from './platform-model.js';
import {createControlledDocument,addRevision,decideRevision} from './document-control-model.js';
import {seed} from './model.js';
import {seedCycleDemo,applyRange} from './turnos-model.js';
const shiftDate=(days)=>{const d=new Date(localDay()+'T12:00:00');d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function seedCompleteExamples(lib,sched,findings){
 seed(lib);if(!sched.people.some(p=>p.demo))seedCycleDemo(sched,localDay().slice(0,7));
 const person=sched.people.find(p=>p.demo&&p.status==='active');if(!person)return;
 if(!person.completeDemo){const key=Object.keys(sched.entries).find(k=>k.startsWith(person.id+'|')&&sched.entries[k].type==='D');if(key){const date=key.split('|')[1];applyRange(sched,{ids:[person.id],from:date,to:date,type:'A',replace:true,note:'Ejemplo: trabajo en descanso; compensación por acordar'});}person.completeDemo=true;}
 for(const external of [false,true]){
  const code=external?'EXT-DEMO-INTEGRAL':'CAL-DEMO-INTEGRAL';if(lib.documents.some(d=>d.code===code))continue;
  const d=createControlledDocument(lib,{name:external?'Ficha externa · demostración integral':'Procedimiento · demostración integral',code,origin:external?'external':'internal',ownerArea:'Calidad',documentKind:external?'Ficha técnica':'Procedimiento',folder:lib.folders.find(f=>f.parent!=='root')?.id||lib.folders[0].id,number:'01',reason:'Documento ficticio del escenario completo',fileName:'ejemplo.png',issuer:external?'Proveedor de ejemplo':'',source:external?'Catálogo ficticio':'',documentDate:shiftDate(-90),demo:true});d.completeDemo=true;d.responsibleId=person.id;d.reviewDate=shiftDate(-2);d.expiresOn=external?shiftDate(7):'';decideRevision(d,d.versions[0].id,'approve','Aprobación de ejemplo');const v=addRevision(d,{number:'02',reason:'Ejemplo: cambio de controles y responsabilidades',fileName:'ejemplo-v02.png'});if(!external)decideRevision(d,v.id,'approve','Aprobada para fecha futura',shiftDate(7));
 }
 if(!findings.items.some(f=>f.completeDemo))findings.items.push({id:crypto.randomUUID(),name:'Revisión vencida de ficha técnica · ejemplo',type:'Inconformidad',process:'Calidad',description:'Una ficha externa no tiene registrada su revisión periódica.',cause:'No se había asignado un responsable y una fecha de revisión.',evidence:'Escenario ficticio para probar el flujo completo.',ownerId:person.id,due:shiftDate(-1),status:'progress',demo:true,completeDemo:true,documentIds:lib.documents.filter(d=>d.completeDemo&&d.origin==='external').map(d=>d.id),actions:[{id:crypto.randomUUID(),name:'Verificar edición vigente con el emisor',ownerId:person.id,due:shiftDate(-1),status:'pending',evidence:''},{id:crypto.randomUUID(),name:'Asignar la próxima revisión y verificar el resultado',ownerId:person.id,due:shiftDate(3),status:'pending',evidence:''}]});
}
export function resetExamples(lib,sched,findings){
 const protectedDocs=new Set(),protectedPeople=new Set(),protectedFolders=new Set();
 for(const f of findings.items.filter(f=>!f.demo)){f.documentIds?.forEach(id=>protectedDocs.add(id));protectedPeople.add(f.ownerId);protectedPeople.add(f.verifierId);f.actions?.forEach(a=>protectedPeople.add(a.ownerId));}
 for(const d of lib.documents.filter(d=>!d.demo&&!d.controlDemo)){if(d.templateId)protectedDocs.add(d.templateId);if(d.responsibleId)protectedPeople.add(d.responsibleId);}
 // Keep referenced templates recursively, and folders that hold manual or retained records.
 for(const id of protectedDocs){const d=lib.documents.find(d=>d.id===id);if(d?.templateId)protectedDocs.add(d.templateId);if(d?.responsibleId)protectedPeople.add(d.responsibleId);}
 const keepFolder=id=>{const seen=new Set();while(id&&id!=='root'&&!seen.has(id)){seen.add(id);protectedFolders.add(id);id=lib.folders.find(f=>f.id===id)?.parent;}};
 for(const d of lib.documents.filter(d=>!d.demo&&!d.controlDemo||protectedDocs.has(d.id))){keepFolder(d.folder);d.linkedFolders?.forEach(keepFolder);}
 for(const f of lib.folders.filter(f=>!f.demo)){keepFolder(f.parent);f.linkedFolders?.forEach(keepFolder);}
 const removedDocs=lib.documents.filter(d=>(d.demo||d.controlDemo)&&!protectedDocs.has(d.id)),removedFindings=findings.items.filter(f=>f.demo);
 lib.documents=lib.documents.filter(d=>!removedDocs.includes(d));lib.folders=lib.folders.filter(f=>!f.demo||protectedFolders.has(f.id));const folderIds=new Set(lib.folders.map(f=>f.id));for(const item of [...lib.documents,...lib.folders])item.linkedFolders=(item.linkedFolders||[]).filter(id=>folderIds.has(id));lib.favorites=lib.favorites.filter(id=>lib.documents.some(d=>d.id===id));
 const people=sched.people.filter(p=>p.demo&&!protectedPeople.has(p.id)),ids=new Set(people.map(p=>p.id));sched.people=sched.people.filter(p=>!ids.has(p.id));for(const key of Object.keys(sched.entries))if(ids.has(key.split('|')[0]))delete sched.entries[key];findings.items=findings.items.filter(f=>!f.demo);
 return {documents:removedDocs.length,people:people.length,findings:removedFindings.length,protected:protectedDocs.size+protectedPeople.size,files:[...removedDocs.flatMap(d=>(d.versions||[]).map(v=>v.fileId)),...removedFindings.flatMap(f=>(f.evidenceFiles||[]).map(e=>e.id))].filter(Boolean)};
}
