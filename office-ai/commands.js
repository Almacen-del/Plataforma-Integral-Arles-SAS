// Functions passed to callCommand run inside ONLYOFFICE, with only Api and Asc.scope.
export function readEditorContext(){
 try{
  const type=Asc.scope.arlesType;
  if(type==='word'){
   const doc=Api.GetDocument(),range=doc.GetRangeBySelect(),paragraphs=doc.GetAllParagraphs();let text='';
   for(let i=0;i<Math.min(paragraphs.length,120)&&text.length<12000;i++)text+=paragraphs[i].GetText()+'\n';
   const selected=range?range.GetText():'';
   if(selected.length>8000)return {error:'Selecciona un texto de hasta 8.000 caracteres.'};
   return {context:{type,text:text.slice(0,12000),selectedText:selected,truncated:text.length>12000||paragraphs.length>120},target:{text:selected,start:range?range.GetStartPos():null,end:range?range.GetEndPos():null}};
  }
  if(type==='cell'){
   const sheet=Api.GetActiveSheet(),range=Api.GetSelection(),count=range.GetCellsCount();
   if(count<1||count>200)return {error:'Selecciona un rango de hasta 200 celdas.'};
   const address=String(range.GetAddress(false,false,'xlA1',false)).split('!').pop().replace(/\$/g,'');
   if(!/^[A-Z]+[1-9][0-9]*(?::[A-Z]+[1-9][0-9]*)?$/.test(address))return {error:'Selecciona un único rango rectangular.'};
   const first=/^([A-Z]+)([0-9]+)/.exec(address),cells=[],row=Number(first[2]),rows=range.GetRowsCount(),cols=count/rows;let col=0;
   for(let i=0;i<first[1].length;i++)col=col*26+first[1].charCodeAt(i)-64;
   for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    let n=col+c,letters='';while(n>0){letters=String.fromCharCode(65+(n-1)%26)+letters;n=Math.floor((n-1)/26);}
    const cell=sheet.GetRange(letters+(row+r)),value=cell.GetValue(),formula=cell.GetFormula();
    if(String(value).length>1000||String(formula).length>1000)return {error:'La selección contiene celdas demasiado largas. Reduce el rango.'};
    cells.push({address:String(cell.GetAddress(false,false,'xlA1',false)).split('!').pop().replace(/\$/g,''),value,formula});
   }
   const context={type,sheet:sheet.GetName(),range:address,cells};return {context,target:context};
  }
  if(type==='slide'){
   const doc=Api.GetPresentation(),slide=doc.GetCurrentSlide(),shapes=slide?slide.GetAllShapes():[];let text='';
   for(let i=0;i<Math.min(shapes.length,30)&&text.length<12000;i++){
    const content=shapes[i].GetDocContent();if(!content)continue;
    for(let p=0;p<Math.min(content.GetElementsCount(),50)&&text.length<12000;p++){const el=content.GetElement(p);if(el&&el.GetText)text+=el.GetText()+'\n';}
   }
   return {context:{type,slide:doc.GetCurSlideIndex()+1,text:text.slice(0,12000),truncated:text.length>12000||shapes.length>30},target:null};
  }
  return {error:'Editor no compatible.'};
 }catch(e){return {error:'No se pudo leer la selección del editor. '+e.message};}
}
export function applyEditorProposal(){
 try{
  const input=Asc.scope.arlesApply,type=input.type,proposal=input.proposal;
  if(type==='word'){
   const doc=Api.GetDocument();
   if(input.replace){
    const range=doc.GetRangeBySelect(),target=input.target;
    if(!range||!target.text||range.GetText()!==target.text||range.GetStartPos()!==target.start||range.GetEndPos()!==target.end)return {error:'La selección cambió. Genera una nueva propuesta antes de reemplazarla.'};
   }
   const paragraphs=proposal.text.split(/\r?\n/).map(text=>{const p=Api.CreateParagraph();p.AddText(text);return p;});
   if(input.replace)doc.InsertContent(paragraphs);else for(let i=0;i<paragraphs.length;i++)doc.Push(paragraphs[i]);
   return {ok:true};
  }
  if(type==='cell'){
   const sheet=Api.GetActiveSheet(),range=Api.GetSelection(),target=input.target;
   const address=String(range.GetAddress(false,false,'xlA1',false)).split('!').pop().replace(/\$/g,'');
   if(sheet.GetName()!==target.sheet||address!==target.range)return {error:'La hoja o la selección cambió. Genera una nueva propuesta.'};
   for(let i=0;i<target.cells.length;i++){const old=target.cells[i],cell=sheet.GetRange(old.address);if(cell.GetValue()!==old.value||cell.GetFormula()!==old.formula)return {error:'Las celdas cambiaron desde la consulta. Genera una nueva propuesta.'};}
   // All preconditions are checked before the first edit. ONLYOFFICE handles undo/coediting.
   for(let i=0;i<proposal.cells.length;i++){
    const next=proposal.cells[i],cell=sheet.GetRange(next.address);let ok;
    if(next.formula)ok=cell.SetValue(next.formula);
    else ok=cell.SetValue(typeof next.value==='string'&&/^[=+\-@]/.test(next.value)?"'"+next.value:next.value);
    if(ok===false)return {error:'El editor no permitió cambiar una celda. Revisa la protección de la hoja y los cambios aplicados.'};
   }
   return {ok:true};
  }
  if(type==='slide'){
   const doc=Api.GetPresentation(),width=doc.GetWidth(),height=doc.GetHeight();
   for(let i=0;i<proposal.slides.length;i++){
    const next=proposal.slides[i],slide=Api.CreateSlide();slide.SetBackground(Api.CreateSolidFill(Api.CreateRGBColor(255,255,255)));
    const title=Api.CreateShape('rect',width*.84,height*.16,Api.CreateNoFill(),Api.CreateStroke(0,Api.CreateNoFill()));title.SetPosition(width*.08,height*.07);
    const tp=title.GetDocContent().GetElement(0);tp.AddText(next.title);tp.SetFontSize(56);tp.SetBold(true);tp.SetFontFamily('Arial');tp.SetColor(Api.RGB(23,62,54));slide.AddObject(title);
    const body=Api.CreateShape('rect',width*.84,height*.62,Api.CreateNoFill(),Api.CreateStroke(0,Api.CreateNoFill()));body.SetPosition(width*.08,height*.27);
    const content=body.GetDocContent();content.RemoveAllElements();
    for(let b=0;b<next.bullets.length;b++){const p=Api.CreateParagraph();p.AddText('• '+next.bullets[b]);p.SetFontSize(36);p.SetFontFamily('Arial');p.SetColor(Api.RGB(23,62,54));p.SetSpacingAfter(240);content.Push(p);}
    slide.AddObject(body);doc.AddSlide(slide);
   }
   return {ok:true};
  }
  return {error:'Propuesta no compatible.'};
 }catch(e){return {error:'No se pudo aplicar la propuesta. Revisa el documento antes de reintentar. '+e.message};}
}
