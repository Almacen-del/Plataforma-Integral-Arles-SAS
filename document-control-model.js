import {localDay,validDate} from './platform-model.js';
export const AREAS={ALM:'Almacén',VIV:'Vivero',CAM:'Campo',MNT:'Mantenimiento',CAL:'Calidad',GH:'Gestión humana',SST:'Seguridad y salud',GER:'Gerencia'};
export function versions(doc){return doc.versions||[{id:'legacy-'+doc.id,number:doc.version||'01',status:doc.status==='Vigente'?'current':doc.status==='En revisión'?'review':'draft',created:doc.modified||'',reason:'Documento previo al control de versiones',fileName:'Sin archivo adjunto',fileId:null}];}
export function addRevision(doc,input){
 const number=String(input.number||'').trim();if(!number)throw Error('Indica la versión o edición del emisor.');
 const list=versions(doc);if(list.some(v=>v.number.toLocaleLowerCase()===number.toLocaleLowerCase()))throw Error('Esta versión ya existe. Usa una identificación distinta.');
 if(list.some(v=>['draft','review','approved'].includes(v.status)))throw Error('Termina o rechaza la versión pendiente antes de cargar otra.');
 if(!input.reason?.trim())throw Error('Describe qué cambió en el documento.');
 const revision={...input,id:crypto.randomUUID(),number,status:'review',created:new Date().toISOString()};doc.versions=[...list,revision];return revision;
}
export function decideRevision(doc,id,decision,reason,effectiveDate=localDay()){
 if(!reason?.trim())throw Error('Indica el motivo de la decisión.');
 const list=versions(doc).map(v=>({...v})),v=list.find(v=>v.id===id);if(!v||!['draft','review','approved'].includes(v.status))throw Error('La versión ya no está pendiente de revisión.');
 if(decision==='approve'){
  if(!validDate(effectiveDate)||effectiveDate<localDay())throw Error('La vigencia debe iniciar hoy o en una fecha futura.');
  if(!v.fileId&&!doc.demo)throw Error('Adjunta el archivo antes de aprobar esta versión.');
  v.approvedAt=new Date().toISOString();v.effectiveDate=effectiveDate;v.status='approved';doc.retired=false;
  if(effectiveDate<=localDay())activate(doc,list,v);else if(!list.some(x=>x.status==='current'))doc.status='Aprobado';
 }else if(decision==='reject'){v.status='rejected';if(!list.some(x=>x.status==='current'))doc.status='Borrador';}else throw Error('Decisión inválida.');
 v.decisionReason=reason.trim();doc.versions=list;
}
export function retireDocument(doc,reason){if(!reason?.trim())throw Error('Indica por qué se retira.');doc.versions=versions(doc).map(v=>['current','draft','review','approved'].includes(v.status)?{...v,status:'obsolete',obsoleteAt:new Date().toISOString(),obsoleteReason:reason}:v);doc.retired=true;doc.status='Obsoleto';doc.currentVersionId=null;}
export function createControlledDocument(state,data,areaPrefixes=AREAS){
 const name=data.name.trim(),code=data.code.trim().toUpperCase();if(!name||!code)throw Error('Completa el nombre y el código.');
 if(state.documents.some(d=>d.code?.toUpperCase()===code))throw Error('Ese código ya existe. Carga una versión en el documento original.');
 const prefix=code.split('-')[0];if(data.origin==='internal'&&areaPrefixes[prefix]&&data.ownerArea&&areaPrefixes[prefix]!==data.ownerArea)throw Error('El prefijo '+prefix+' corresponde a '+areaPrefixes[prefix]+'. Revisa el código o el área responsable.');
 if(!state.folders.some(f=>f.id===data.folder))throw Error('Selecciona una carpeta de origen.');
 if(data.origin==='external'&&(!data.issuer.trim()||!data.source.trim()))throw Error('Indica el emisor y la fuente del documento externo.');
 if(data.origin==='external'&&(!/^\d{4}-\d{2}-\d{2}$/.test(data.documentDate||'')||!Number.isFinite(Date.parse(data.documentDate))||new Date(data.documentDate).toISOString().slice(0,10)!==data.documentDate))throw Error('Indica una fecha de creación válida para el documento externo.');
 const doc={...data,id:crypto.randomUUID(),name,code,version:data.number,status:'En revisión',type:data.fileName?.split('.').at(-1).toUpperCase()||'PDF',shared:data.audiences||[],linkedFolders:[],description:data.description||'',modified:new Date().toISOString(),versions:[],managed:true};
 if(data.documentKind==='Registro diligenciado'){const template=state.documents.find(d=>d.id===data.templateId&&d.documentKind==='Formato'&&!d.retired);const current=template&&versions(template).find(v=>v.status==='current');if(!current)throw Error('Selecciona un formato vigente para conservar la versión utilizada por el registro.');doc.templateCode=template.code;doc.templateVersion=current.number;doc.templateRevisionId=current.id;}
 addRevision(doc,data);state.documents.push(doc);return doc;
}

function activate(doc,list,v){for(const old of list)if(old.status==='current'){old.status='obsolete';old.obsoleteAt=new Date().toISOString();old.obsoleteReason='Sustituida por versión '+v.number;}v.status='current';v.activatedAt=new Date().toISOString();doc.version=v.number;doc.status='Vigente';doc.currentVersionId=v.id;}
export function activateDueVersions(state,today=localDay()){let count=0;for(const doc of state.documents){if(doc.retired)continue;const list=doc.versions||[];for(const v of list)if(v.status==='approved'&&v.effectiveDate<=today){activate(doc,list,v);count++;}}return count;}
