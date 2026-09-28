import {ROOT,LIBRARY_ROOTS,ancestors,itemById,renameItem,moveItem,linkItem} from './model.js';
export function setupEditor({state,save,render,select,toast,escape}){
 const menu=document.createElement('div');menu.id='item-menu';menu.hidden=true;menu.className='item-menu';menu.setAttribute('role','menu');
 menu.innerHTML='<div class="menu-title">Editar</div>'+[['rename','Renombrar'],['move','Mover'],['links','Enlaces'],['properties','Propiedades']].map(([a,n])=>`<button role="menuitem" data-edit-action="${a}">${n}</button>`).join('');document.body.append(menu);
 const dialog=document.createElement('dialog');dialog.id='edit-dialog';document.body.append(dialog);
 let context=null,anchor=null;
 const closeMenu=()=>{menu.hidden=true;if(anchor)anchor.setAttribute('aria-expanded','false');};
 const path=f=>ancestors(state.folders,f.id).map(x=>x.name).join(' / ');
 function open(action){
  closeMenu();const {kind,id}=context,item=itemById(state,kind,id),origin=kind==='folder'?item.parent:item.folder;
  const label={rename:'Renombrar',move:'Mover',links:'Enlaces a otras carpetas',properties:'Propiedades'}[action];
  let body='';
  if(action==='rename')body=`<label>Nombre<input name="name" value="${escape(item.name)}" maxlength="100" required></label>`;
  if(action==='move'){
   const locked=kind==='folder'&&LIBRARY_ROOTS.includes(id);
   body=locked?'<p>Esta carpeta raíz permanece en Biblioteca.</p>':`<p class="move-instruction">Entra en la carpeta de destino y pulsa <b>Mover aquí</b>.</p><input type="hidden" name="target" value="root"><section class="destination-picker" aria-label="Elegir destino"><nav class="destination-path" aria-label="Ruta de destino"></nav><div class="destination-folders"></div><div class="destination-current" aria-live="polite"></div></section>`;
  }
  if(action==='links')body=`<p>Marca las carpetas donde debe aparecer un acceso al original. Desmarca para quitar un enlace; no se elimina el documento ni la carpeta.</p><div class="link-choices">${state.folders.filter(f=>f.id!==origin&&(kind!=='folder'||f.id!==id)).map(f=>`<label><input type="checkbox" name="links" value="${escape(f.id)}" ${(item.linkedFolders||[]).includes(f.id)?'checked':''}><span>${escape(path(f))}</span></label>`).join('')}</div>`;
  if(action==='properties')body=`<dl class="property-list"><dt>Nombre</dt><dd>${escape(item.name)}</dd><dt>Tipo</dt><dd>${kind==='folder'?'Carpeta':escape(item.type)}</dd><dt>Identidad única</dt><dd>${escape(id)}</dd><dt>Ubicación del original</dt><dd>${escape(origin===ROOT?'Biblioteca':path(state.folders.find(f=>f.id===origin)))}</dd>${kind==='document'?`<dt>Estado / versión</dt><dd>${escape(item.status)} / ${escape(item.version)}</dd>`:''}<dt>Enlaces</dt><dd>${(item.linkedFolders||[]).length}</dd></dl><label>Descripción<textarea name="description" rows="3" maxlength="1500">${escape(item.description||'')}</textarea></label>`;
  if(action==='properties'&&kind==='document'&&!item.managed)body+=`<label>Versión<input name="version" required maxlength="20" value="${escape(item.version)}"></label><label>Estado<select name="status">${['Borrador','En revisión','Vigente'].map(s=>`<option ${s===item.status?'selected':''}>${s}</option>`).join('')}</select></label>`;
  const locked=action==='move'&&kind==='folder'&&LIBRARY_ROOTS.includes(id);
  dialog.innerHTML=`<form id="edit-form"><div class="dialog-heading"><h2>${label}</h2><button type="button" class="icon-button" data-editor-close aria-label="Cerrar">×</button></div><p class="edit-item-name">${escape(item.name)}</p>${body}<p id="edit-error" class="form-error" role="alert"></p><div class="dialog-actions"><button type="button" class="button secondary" data-editor-close>Cancelar</button>${locked?'':`<button class="button primary" type="submit">${action==='move'?'Mover aquí':'Guardar cambios'}</button>`}</div></form>`;
  if(action==='move'&&!locked){
   const picker=dialog.querySelector('.destination-picker');
   const folderIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h6l2 3h10v12H3z"/></svg>';
   function showDestination(target){
    dialog.querySelector('[name="target"]').value=target;
    const route=ancestors(state.folders,target);
    picker.querySelector('.destination-path').innerHTML=`<button type="button" data-destination="root">Biblioteca</button>${route.map(f=>`<span aria-hidden="true">/</span><button type="button" data-destination="${escape(f.id)}">${escape(f.name)}</button>`).join('')}`;
    const children=state.folders.filter(f=>f.parent===target&&(kind!=='folder'||(f.id!==id&&!ancestors(state.folders,f.id).some(a=>a.id===id))));
    picker.querySelector('.destination-folders').innerHTML=children.length?children.map(f=>`<button type="button" class="destination-folder" data-destination="${escape(f.id)}">${folderIcon}<span>${escape(f.name)}</span><span class="destination-arrow" aria-hidden="true">›</span></button>`).join(''):'<p class="destination-empty">No hay subcarpetas. Puedes mover el elemento aquí.</p>';
    picker.querySelector('.destination-current').textContent=target===ROOT?'Selecciona una raíz para entrar. Biblioteca no es un destino de movimiento.':'Destino: '+route.map(f=>f.name).join(' / ');
    let error='';
    if(target===origin)error='El elemento ya está en esta carpeta.';
    else try{moveItem(structuredClone(state),kind,id,target);}catch(err){error=err.message;}
    dialog.querySelector('#edit-error').textContent=error;
    dialog.querySelector('button[type="submit"]').disabled=!!error;
   }
   picker.addEventListener('click',e=>{const button=e.target.closest('[data-destination]');if(button){showDestination(button.dataset.destination);picker.querySelector('.destination-path button:last-child')?.focus();}});
   showDestination(ROOT);
  }
  dialog.querySelectorAll('[data-editor-close]').forEach(b=>b.onclick=()=>dialog.close());
  dialog.querySelector('form').onsubmit=e=>{e.preventDefault();try{
   const data=new FormData(e.target);
   if(action==='rename')renameItem(state,kind,id,data.get('name'));
   if(action==='move')moveItem(state,kind,id,data.get('target'));
   if(action==='links')linkItem(state,kind,id,data.getAll('links'));
   if(action==='properties'){item.description=String(data.get('description')).trim();if(kind==='document'&&!item.managed){item.version=String(data.get('version')).trim();item.status=String(data.get('status'));}}
   save();dialog.close();render();toast('Cambios guardados en este navegador.');
  }catch(err){dialog.querySelector('#edit-error').textContent=err.message;}};
  dialog.showModal();
 }
 document.addEventListener('click',e=>{
  const more=e.target.closest('[data-more]');
  if(more){e.stopPropagation();context={kind:more.dataset.kind,id:more.dataset.more};select(context.kind,context.id);closeMenu();anchor=more;more.setAttribute('aria-expanded','true');
   menu.hidden=false;const r=more.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(r.right-185,innerWidth-195))+'px';menu.style.top=Math.max(8,Math.min(r.bottom+5,innerHeight-menu.offsetHeight-8))+'px';menu.querySelector('button').focus();return;}
  const action=e.target.closest('[data-edit-action]');if(action){open(action.dataset.editAction);return;}
  if(!menu.contains(e.target))closeMenu();
 });
 document.addEventListener('keydown',e=>{
  if(menu.hidden)return;const buttons=[...menu.querySelectorAll('button')];let n=buttons.indexOf(document.activeElement);
  if(e.key==='Escape'){closeMenu();anchor?.focus();}
  if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();buttons[(n+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();}
 });
 window.addEventListener('resize',closeMenu);document.addEventListener('scroll',closeMenu,true);
 return {openProperties:(kind,id)=>{context={kind,id};open('properties');}};
}


