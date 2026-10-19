export const emptySchedule=()=>({people:[],types:[{id:'A',name:'Turno',color:'#5098d5'},{id:'D',name:'Descanso',color:'#f1cc38'},{id:'V',name:'Vacaciones',color:'#262626'},{id:'I',name:'Incapacidad',color:'#772577'},{id:'N',name:'No asistió',color:'#e52b35'},{id:'P',name:'Permiso por urgencia',color:'#809b91'},{id:'DP',name:'Descanso pendiente por compensar',color:'#f49732'}],entries:{},history:[]});
export function setPersonStatus(state,id,status){
 if(!['active','inactive'].includes(status))throw Error('El estado de la persona no es válido.');
 const person=state.people.find(p=>p.id===id);if(!person)throw Error('La persona ya no existe en Personal.');
 if(person.status===status)return false;
 person.status=status;return true;
}
export function dateRange(from,to){
 const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(!valid(from)||!valid(to)||from>to)throw Error('Revisa las fechas de inicio y fin.');
 const result=[];for(let d=new Date(from+'T00:00:00Z');d<=new Date(to+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1)){result.push(d.toISOString().slice(0,10));if(result.length>366)throw Error('Selecciona un máximo de 366 días.');}return result;
}
export function applyRange(state,{ids,from,to,type,note='',replace=false,weekdays=[0,1,2,3,4,5,6]}){
 if(!ids.length)throw Error('Selecciona al menos una persona.');
 if(type&&!state.types.some(t=>t.id===type))throw Error('El turno no existe.');
 if(ids.some(id=>!state.people.some(p=>p.id===id)))throw Error('La persona no existe.');
 const days=dateRange(from,to).filter(d=>weekdays.includes(new Date(d+'T00:00:00Z').getUTCDay()));
 const keys=[...new Set(ids)].flatMap(id=>days.map(d=>id+'|'+d));
 if(!keys.length)throw Error('No hay días seleccionados en este período.');
 if(!replace&&keys.some(k=>state.entries[k]))throw Error('Hay días programados. Activa reemplazar para modificarlos.');
 assertUnlinked(state,keys);
 for(const key of keys){const old=state.entries[key];const [personId,day]=key.split('|');const expected=old?.expected||cycleType(state.people.find(p=>p.id===personId),day);if(type||expected)state.entries[key]={type,note:note.trim().slice(0,500),expected,changedAt:new Date().toISOString(),previous:old?.type||'',review:null};else delete state.entries[key];}
 return keys.length;
}
export function applyCycle(state,{id,start,from,to,replace=false}){
 const person=state.people.find(p=>p.id===id&&p.status==='active');
 if(!person)throw Error('Selecciona una persona activa.');
 dateRange(start,start);
 if(new Date(start+'T00:00:00Z').getUTCDay()!==1)throw Error('El ciclo debe iniciar un lunes para descansar de domingo a domingo.');
 const days=dateRange(from,to);
 if(from<start)throw Error('El período debe comenzar en la fecha de inicio del ciclo o después.');
 if(!replace&&days.some(d=>state.entries[id+'|'+d]))throw Error('Hay días programados. Confirma reemplazar para aplicar el ciclo.');
 assertUnlinked(state,days.map(d=>id+'|'+d));
 for(const day of days){const offset=Math.round((Date.parse(day)-Date.parse(start))/86400000)%28;state.entries[id+'|'+day]={type:offset<20?'A':'D',expected:offset<20?'A':'D',note:'Ciclo 20 trabajo / 8 descanso'};}
 person.cycleStart=start;
 return days.length;
}
export function seedCycleDemo(state,month){
 const from=month+'-01';
 const [year,m]=month.split('-').map(Number);
 const to=month+'-'+new Date(year,m,0).getDate();
 dateRange(from,to);
 let examples=state.people.filter(p=>p.demo);
 if(!examples.length){
  for(let i=0;i<6;i++)state.people.push({id:crypto.randomUUID(),name:`Persona de ejemplo ${String(i+1).padStart(2,'0')}`,role:['Auxiliar de campo','Tractorista','Jefe de campo'][i%3],area:i<4?'Plantación':'Vivero',status:i===5?'inactive':'active',demo:true});
  examples=state.people.filter(p=>p.demo);
 }
 examples.forEach((person,i)=>{
  if(person.status!=='active')return;
  const startDate=new Date(from+'T00:00:00Z');startDate.setUTCDate(startDate.getUTCDate()-((startDate.getUTCDay()+6)%7)-i*7);
  const start=state.demoCycleVersion===2&&person.cycleStart&&person.cycleStart<=from?person.cycleStart:startDate.toISOString().slice(0,10);
  applyCycle(state,{id:person.id,start,from,to,replace:true});
 });
 state.demoCycleVersion=2;
}



export function cycleType(person,day){if(!person?.cycleStart||day<person.cycleStart)return '';return Math.round((Date.parse(day)-Date.parse(person.cycleStart))/86400000)%28<20?'A':'D';}
export function fillMonth(state,month){const [y,m]=month.split('-').map(Number);const days=dateRange(month+'-01',month+'-'+new Date(y,m,0).getDate());let count=0;for(const p of state.people.filter(p=>p.status==='active'&&p.cycleStart)){for(const day of days){const key=p.id+'|'+day,type=cycleType(p,day);if(type&&!Object.hasOwn(state.entries,key)){state.entries[key]={type,expected:type,note:'Ciclo 20/8 · generación mensual'};count++;}}}return count;}
export function adjustments(state,id){const p=state.people.find(p=>p.id===id);return Object.entries(state.entries).filter(([k])=>k.startsWith(id+'|')).map(([key,e])=>{const day=key.split('|')[1],expected=e.expected||cycleType(p,day);let kind=e.type==='DP'||expected==='D'&&e.type==='A'?'rest':expected==='A'&&e.type==='D'?'work':'other';return {key,day,...e,expected,kind};}).filter(e=>e.type==='DP'||e.expected&&e.expected!==e.type).sort((a,b)=>a.day.localeCompare(b.day));}

export function assertUnlinked(state,keys){if(keys.some(k=>state.entries[k]?.review?.date||state.entries[k]?.compensatedBy))throw Error('Hay una compensación enlazada. Desvincúlala desde la novedad original antes de modificar esos días.');}
export function linkCompensation(state,key,review,today=new Date().toLocaleDateString('en-CA')){
 const entry=state.entries[key];if(!entry)throw Error('La novedad ya no existe.');if(entry.compensatedBy)throw Error('Este día ya compensa otra novedad.');if(!review.note?.trim())throw Error('Explica la revisión.');
 const [id,originDate]=key.split('|');let targetKey,target;
 if(review.date&&Object.entries(state.entries).some(([k,e])=>k!==key&&k.startsWith(id+'|')&&e.review?.date===review.date))throw Error('Ese día ya está vinculado a otra novedad.');
 if(review.date){dateRange(review.date,review.date);if(review.date===originDate)throw Error('La compensación debe ocurrir en otro día.');targetKey=id+'|'+review.date;target=state.entries[targetKey];if(!target)throw Error('Programa primero el día de compensación en la tabla.');if(target.compensatedBy&&target.compensatedBy!==key)throw Error('Ese día ya compensa otra novedad.');if(target.review?.date)throw Error('Ese día ya tiene otro vínculo de compensación.');const expected=review.kind==='rest'?'D':review.kind==='work'?'A':null;if(!expected)throw Error('Solo un descanso o turno pendiente puede vincular una compensación.');if(target.type!==expected)throw Error('El día de compensación debe estar programado como '+expected+'.');if(review.status==='resolved'&&review.date>today)throw Error('Una compensación futura queda pendiente hasta verificar su cumplimiento.');
 }else if(review.status==='resolved'&&review.kind!=='other')throw Error('Selecciona la fecha que compensó este pendiente.');
 if(target){const expected=target.expected||cycleType(state.people.find(p=>p.id===id),review.date);if(review.kind==='rest'&&expected!=='A'||review.kind==='work'&&expected!=='D')throw Error('La compensación debe ser un cambio respecto al ciclo: descanso en un día de trabajo, o trabajo en un día de descanso.');}
 const old=entry.review?.date;if(old&&state.entries[id+'|'+old]?.compensatedBy===key){const previous=state.entries[id+'|'+old];delete previous.compensatedBy;delete previous.compensationStatus;}
 entry.review={...review,note:review.note.trim(),targetKey:targetKey||null};if(target){target.compensatedBy=key;target.compensationStatus=review.status;}
}
