// Read-only context from the platform roster and the Floración record contract.
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const trim=(value,max=180)=>String(value??'').slice(0,max);
const count=value=>typeof value==='number'&&Number.isInteger(value)&&value>=0;
export function assistantTopics(question){const q=normalize(question);return {field:/\b(censos?|sensos?|floracion|inflorescencias|arboles?|surcos?|lotes?|botones|frutos)\b/.test(q),people:/\b(disponibilidad|disponibles?|turnos?|descansos?|personal|empleados?|colaboradores?|trabajadores?|vacaciones|incapacidad|permiso|inactiv[oa]s?)\b/.test(q),documents:/\b(documentos?|manuales?|manual|caracterizacion|procedimientos?|instructivo|archivos?|biblioteca)\b/.test(q)};}
export function needsDocumentContext(scope,question,roster={}){if(scope==='library')return true;if(scope!=='all')return false;const topics=assistantTopics(question);return topics.documents||!topics.field&&!topics.people&&!matchPeople(roster,question).length;}
export function questionScope(current,question,roster={}){const topics=assistantTopics(question),people=topics.people||matchPeople(roster,question).length>0;if(topics.documents&&(topics.field||people)||topics.field&&people)return 'all';if(topics.documents)return 'library';if(topics.field)return 'field';if(people)return 'people';if(/resumen general|toda la plataforma|resumen integral/.test(normalize(question)))return 'all';return current;}
export function bogotaDay(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),part=type=>parts.find(p=>p.type===type).value;return `${part('year')}-${part('month')}-${part('day')}`;}
const validDay=day=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&!isNaN(Date.parse(day))&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day;
const shiftDay=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export function questionPeriod(question,now=new Date()){
 const q=normalize(question),today=bogotaDay(now),year=today.slice(0,4),dates=[];let invalid=false;
 for(const m of q.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g))if(validDay(m[1]))dates.push(m[1]);else invalid=true;
 for(const m of q.matchAll(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/g)){const d=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;if(validDay(d))dates.push(d);else invalid=true;}
 const names=months.join('|'),range=new RegExp(`\\b(?:del? |entre )?(\\d{1,2})\\s*(?:al|a|y|hasta)\\s*(\\d{1,2})\\s+(?:de\\s+)?(${names})(?:\\s+(?:de\\s+)?(\\d{4}))?\\b`,'g');
 for(const m of q.matchAll(range))for(const day of [m[1],m[2]]){const d=`${m[4]||year}-${String(months.indexOf(m[3])+1).padStart(2,'0')}-${day.padStart(2,'0')}`;if(validDay(d))dates.push(d);else invalid=true;}
 const named=new RegExp(`\\b(\\d{1,2})\\s+(?:de\\s+)?(${names})(?:\\s+(?:de\\s+)?(\\d{4}))?\\b`,'g');
 for(const m of q.matchAll(named)){const d=`${m[3]||year}-${String(months.indexOf(m[2])+1).padStart(2,'0')}-${m[1].padStart(2,'0')}`;if(validDay(d))dates.push(d);else invalid=true;}
 if(invalid)return {error:'La pregunta contiene una fecha inválida. Confirma la fecha antes de consultar disponibilidad.'};
 if(dates.length){dates.sort();return {from:dates[0],to:dates.at(-1),basis:'Fechas indicadas en la pregunta'};}
 if(/hoy.*manana/.test(q))return {from:today,to:shiftDay(today,1),basis:'Hoy y mañana, hora de Colombia'};
 if(/pasado manana/.test(q)){const d=shiftDay(today,2);return {from:d,to:d,basis:'Pasado mañana, hora de Colombia'};}
 if(/\bmanana\b/.test(q)){const d=shiftDay(today,1);return {from:d,to:d,basis:'Mañana, hora de Colombia'};}
 if(/\bayer\b/.test(q)){const d=shiftDay(today,-1);return {from:d,to:d,basis:'Ayer, hora de Colombia'};}
 const duration=q.match(/\b(?:proximos|siguientes)\s+(\d{1,4})\s+dias\b/);if(duration){const length=Number(duration[1]);if(!length)return {error:'Indica al menos un día para consultar la disponibilidad.'};return {from:today,to:shiftDay(today,length-1),basis:'Próximos '+length+' días, incluido hoy'};}
 if(/\bsemana\b/.test(q)){const offset=(new Date(today+'T12:00:00Z').getUTCDay()+6)%7,start=shiftDay(today,-offset+(/proxima|siguiente/.test(q)?7:0));return {from:start,to:shiftDay(start,6),basis:'Semana de lunes a domingo'};}
 if(/\b(este|actual) mes\b/.test(q)){const [y,m]=today.split('-').map(Number);return {from:today.slice(0,7)+'-01',to:today.slice(0,7)+'-'+String(new Date(y,m,0).getDate()).padStart(2,'0'),basis:'Mes actual'};}
 const weekDays=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'],day=weekDays.findIndex(d=>new RegExp('\\b'+d+'\\b').test(q));
 if(day>=0){let offset=(day-new Date(today+'T12:00:00Z').getUTCDay()+7)%7;if(!offset&&/proxim[oa]|siguiente/.test(q))offset=7;const d=shiftDay(today,offset);return {from:d,to:d,basis:'Próximo día de la semana indicado'};}
 return {from:today,to:today,basis:'Hoy, hora de Colombia; no se indicó otra fecha'};
}
const nameTokens=name=>[...new Set(normalize(name).split(/[^a-z0-9]+/).filter(w=>w.length>2&&!['del','las','los'].includes(w)))];
export function matchPeople(state,question,history=[]){
 const people=(state.people||[]).filter(p=>!p.demo),aliases=new Map();for(const source of state.imports||[])for(const row of source.rows||[]){if(!aliases.has(row.personId))aliases.set(row.personId,[]);aliases.get(row.personId).push(row.sourceName);}
 function matches(q){const tokens=new Set(normalize(q).split(/[^a-z0-9]+/)),scores=people.map(p=>({person:p,score:Math.max(...[p.name,...aliases.get(p.id)||[]].map(n=>nameTokens(n).filter(w=>tokens.has(w)).length))})),best=Math.max(0,...scores.map(s=>s.score));return best?scores.filter(s=>s.score===best).map(s=>s.person):[];}
 let found=matches(question);if(found.length)return found;
 for(const message of [...history].reverse().filter(m=>m.role==='user')){found=matches(message.content);if(found.length)return found;}
 return [];
}
const dayDescriptions={A:'Turno de trabajo programado',D:'Descanso programado',V:'Vacaciones',I:'Incapacidad registrada',P:'Permiso registrado',N:'No asistió (registro de novedad)',DP:'Descanso pendiente por compensar'};
export function personnelContext(state,question,{now=new Date(),history=[]}={}){
 const people=(state.people||[]).filter(p=>!p.demo),matches=matchPeople(state,question,history),period=questionPeriod(question,now),all=assistantTopics(question).people&&!matches.length&&/dispon|turno|descanso|vacacion|quien|cuales|listar|nombres|equipo/.test(normalize(question));
 const summary={personas:people.length,activas:people.filter(p=>p.status==='active').length,inactivas:people.filter(p=>p.status==='inactive').length,periodo:period,alcance:'Programación guardada de turnos. No acredita asistencia, horas libres ni disponibilidad física.'};
 if(period.error||!matches.length&&!all)return summary;
 const targets=matches.length?matches:people;
 summary.coincidencia=matches.length>1?'El nombre coincide con varias personas; confirma cuál antes de atribuirle un turno.':matches.length===1?'Persona identificada':'Consulta del personal registrado';
 summary.personasConsultadas=targets.map(p=>{
  const groups=[],counts={},add=(from,to,code)=>{const label=dayDescriptions[code]||(code?'Código '+code+' · significado no definido':'Sin turno registrado'),length=Math.round((Date.parse(to)-Date.parse(from))/86400000)+1;counts[code||'SIN_REGISTRO']=(counts[code||'SIN_REGISTRO']||0)+length;const previous=groups.at(-1);if(previous?.codigo===code&&shiftDay(previous.hasta,1)===from)previous.hasta=to;else groups.push({desde:from,hasta:to,codigo:code,programacion:label});};
  const known=Object.entries(state.entries||{}).filter(([key])=>key.startsWith(p.id+'|')).map(([key,entry])=>({day:key.split('|')[1],code:entry?.type||''})).filter(e=>e.day>=period.from&&e.day<=period.to).sort((a,b)=>a.day.localeCompare(b.day));let cursor=period.from;
  for(const entry of known){if(entry.day>cursor)add(cursor,shiftDay(entry.day,-1),'');add(entry.day,entry.day,entry.code);cursor=shiftDay(entry.day,1);}if(cursor<=period.to)add(cursor,period.to,'');
  const limit=matches.length?60:16,result={nombre:trim(p.name),cargo:trim(p.role),estado:p.status==='active'?'Activo':'Inactivo',diasPorCodigo:counts,periodos:groups.slice(0,limit),periodosTotales:groups.length,detalleRecortado:groups.length>limit};
  if(p.status!=='active')result.disponibilidad='Inactivo en Personal; los turnos conservados son históricos y no habilitan nuevas asignaciones.';
  if(period.from===period.to){const upcoming=[];let previous=state.entries?.[p.id+'|'+period.from]?.type||'';for(let n=1;n<=28;n++){const day=shiftDay(period.from,n),code=state.entries?.[p.id+'|'+day]?.type||'';if(code!==previous){upcoming.push({fecha:day,codigo:code,programacion:dayDescriptions[code]||(code?'Código no definido':'Sin turno registrado')});previous=code;}}result.proximosCambios=upcoming.slice(0,4);}
  return result;
 });
 return summary;
}
export function completeFloracion(record){
 const d=record.datos||{};if(d.estado!=='COMPLETO')return false;
 if(d.muerto===true)return d.inflorescencias==null&&d.botones==null;
 return ['Hembra','Macho'].includes(d.sexo)&&count(d.inflorescencias)&&(d.inflorescencias===0?d.botones==null:count(d.botones));
}
function censusDate(value){const date=new Date(typeof value==='number'||/^\d{10,}$/.test(String(value))?Number(value):value);return isNaN(date)?'Sin fecha':bogotaDay(date);}
function censusTotals(rows){const complete=rows.filter(completeFloracion),trees=new Set(rows.map(r=>{const d=r.datos||{};return d.loteId&&d.lineaId&&d.arbolCodigo?[d.loteId,d.lineaId,d.arbolCodigo].join('|'):null;}).filter(Boolean));return {registros:rows.length,capturasCompletas:complete.length,pendientesOIncompletas:rows.length-complete.length,plantasIdentificadasDistintas:trees.size,hembrasVivasCompletas:complete.filter(r=>r.datos.sexo==='Hembra'&&r.datos.muerto!==true).length,machosVivosCompletos:complete.filter(r=>r.datos.sexo==='Macho'&&r.datos.muerto!==true).length,muertosCompletos:complete.filter(r=>r.datos.muerto===true).length,inflorescenciasCompletas:complete.reduce((n,r)=>n+(r.datos.inflorescencias??0),0),botonesEnMuestra:complete.reduce((n,r)=>n+(r.datos.botones??0),0)};}
export function censusContext(records,question,{history=[]}={}){
 const all=records.filter(r=>r.tipo==='FLORACION'),q=normalize(question),previous=history.filter(m=>m.role==='user').at(-1)?.content||'';
 const lots=[...q.matchAll(/\blote\s*0*(\d+)\b/g)].map(m=>Number(m[1])),line=q.match(/\b(?:linea|surco)\s*l?0*(\d+)\b/),plant=q.match(/\b(?:arbol|planta)\s*p?0*(\d+)\b/);
 const inheritedLots=!lots.length&&/\by (cuanto|cuantos|como|que)\b/.test(q)?[...normalize(previous).matchAll(/\blote\s*0*(\d+)\b/g)].map(m=>Number(m[1])):[];
 const selectedLots=lots.length?lots:inheritedLots;
 let selected=all.filter(r=>{const d=r.datos||{},lot=Number(String(d.loteNombre||d.loteId||'').match(/\d+$/)?.[0]),rowLine=Number(String(d.lineaNumero||d.lineaId||'').match(/\d+$/)?.[0]),tree=Number(String(d.arbolCodigo||'').match(/\d+$/)?.[0]);return (!selectedLots.length||selectedLots.includes(lot))&&(!line||rowLine===Number(line[1]))&&(!plant||tree===Number(plant[1]));});
 const period=questionPeriod(question);if(period.error)return {tipo:'Floración',error:period.error,alcance:'No se calculó un resumen para una fecha inválida.'};if(period.basis==='Fechas indicadas en la pregunta'||/censo (?:de )?(?:hoy|ayer|manana)\b/.test(q))selected=selected.filter(r=>{const date=censusDate(r.datos?.fechaCenso);return date>=period.from&&date<=period.to;});
 if(/ultimo censo|censo mas reciente/.test(q)){const latest=all.reduce((max,r)=>Math.max(max,Number(r.datos?.fechaCenso)||Date.parse(r.datos?.fechaCenso)||0),0);selected=selected.filter(r=>(Number(r.datos?.fechaCenso)||Date.parse(r.datos?.fechaCenso)||0)===latest);}
 const groups=new Map(),surveys=new Map();for(const r of selected){const lot=trim(r.datos?.loteNombre||r.datos?.loteId||'Sin lote');if(!groups.has(lot))groups.set(lot,[]);groups.get(lot).push(r);if(!surveys.has(r.censo_id))surveys.set(r.censo_id,[]);surveys.get(r.censo_id).push(r);}
 const result={tipo:'Floración',registrosVisibles:all.length,filtros:{lotes:selectedLots,linea:line?Number(line[1]):null,arbol:plant?Number(plant[1]):null,...(period.basis==='Fechas indicadas en la pregunta'?{periodo:period}:{})},resumen:censusTotals(selected),porLote:[...groups].map(([lote,rows])=>({lote,...censusTotals(rows)})),porCenso:[...surveys.values()].map(rows=>({fecha:censusDate(rows[0]?.datos?.fechaCenso),...censusTotals(rows)})),alcance:'Registros visibles por los permisos de tu cuenta, leídos con paginación completa. Se separan fichas completas de borradores; no se suman los conteos incompletos. Plantas distintas son las identificadas en estos registros, no todo el catálogo de la plantación. Totales de capturas pueden incluir la misma planta en censos distintos. Botones es el conteo de una inflorescencia de muestra por árbol, no el total de flores de la plantación.'};
 if(line||plant||/observacion|detalle|pendiente|incompleto/.test(q))result.detalle=selected.filter(r=>!/observacion/.test(q)||r.datos?.observacion).slice(0,20).map(r=>({lote:trim(r.datos?.loteNombre),linea:trim(r.datos?.lineaNumero),arbol:trim(r.datos?.arbolCodigo),fecha:censusDate(r.datos?.fechaCenso),sexo:trim(r.datos?.sexo),muerto:r.datos?.muerto===true,completo:completeFloracion(r),inflorescencias:r.datos?.inflorescencias??null,botones:r.datos?.botones??null,observacion:trim(r.datos?.observacion,300)}));
 if(/estim|previ|proyeccion|peso|kilogram|\bkg\b/.test(q)){const fruits=selected.reduce((n,r)=>n+(completeFloracion(r)&&r.datos.muerto!==true&&r.datos.sexo==='Hembra'?r.datos.inflorescencias*(r.datos.botones??0)*.70:0),0);result.estimacion={frutosPrevistos:fruits,pesoKg:fruits*50/1000,supuestos:'Estimación por árbol: inflorescencias × botones de la muestra × 70 % de retención. Peso supuesto: 50 g por fruto. No es cosecha medida.'};}
 return result;
}
