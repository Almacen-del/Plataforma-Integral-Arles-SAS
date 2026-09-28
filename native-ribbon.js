// Presentation only: retain command attributes and the editor's selection handling.
export function styleRibbon(bar){
 const symbols={bold:'<b>N</b>',italic:'<i>K</i>',underline:'<u>S</u>',undo:'↶',redo:'↷',removeFormat:'A<span class="nr-eraser">⌫</span>',insertUnorderedList:'<span class="nr-bullets" aria-hidden="true">• ━<br>• ━<br>• ━</span>',insertOrderedList:'1≡'};
 const names={bold:'Negrita',italic:'Cursiva',underline:'Subrayado',undo:'Deshacer',redo:'Rehacer',removeFormat:'Limpiar formato',insertUnorderedList:'Viñetas',insertOrderedList:'Numeración'};
 for(const b of bar.querySelectorAll('[data-command]')){const key=b.dataset.command,label=names[key]||b.textContent;b.title=label;b.setAttribute('aria-label',label);if(symbols[key]){b.innerHTML=symbols[key];b.classList.add('nr-icon');}if(key.startsWith('justify')){const type={justifyLeft:'left',justifyCenter:'center',justifyRight:'right',justifyFull:'justify'}[key];b.innerHTML=`<span class="nr-lines nr-${type}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;b.classList.add('nr-icon');}}
 for(const b of bar.querySelectorAll('[data-indent]')){b.title=b.textContent;b.setAttribute('aria-label',b.textContent);b.innerHTML=b.dataset.indent==='1'?'→≡':'←≡';b.classList.add('nr-icon');}
 for(const b of bar.querySelectorAll('[data-block]')){const label=b.textContent;b.classList.add('nr-style');b.innerHTML=`<span class="nr-style-preview nr-${b.dataset.block}">AaBbCc</span><span>${label}</span>`;b.setAttribute('aria-label',label);}
 const home=bar.querySelector('[data-panel="0"]'),groups=home.querySelectorAll(':scope > .nd-tool-group');
 const labelGroup=(group,label)=>{group.classList.add('nr-group');group.setAttribute('aria-label',label);const caption=document.createElement('div');caption.className='nr-caption';caption.textContent=label;group.append(caption);};
 ['Fuente','Párrafo','Estilos'].forEach((label,i)=>{if(groups[i])labelGroup(groups[i],label);});
 if(groups[0]){groups[0].classList.add('nr-font');const row=document.createElement('div');row.className='nr-row';for(const n of [...groups[0].children].slice(0,2))row.append(n);groups[0].prepend(row);}
 if(groups[2]){const edit=document.createElement('div');edit.className='nd-tool-group';for(const b of groups[2].querySelectorAll('[data-command]'))edit.append(b);home.append(edit);labelGroup(edit,'Edición');}
 for(const panel of bar.querySelectorAll('[data-panel]:not([data-panel="0"])'))for(const group of panel.querySelectorAll(':scope > .nd-tool-group'))labelGroup(group,panel.dataset.panel==='1'?(group.querySelector('[data-tool=image-upload]')?'Imágenes':group.querySelector('[data-tool=page-break]')?'Páginas':'Tablas'):panel.dataset.panel==='2'?'Configurar página':'Encabezado y pie');
}
