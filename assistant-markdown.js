const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(text){return escape(text).replace(/`([^`]+)`|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g,(_,code,bold,em)=>code!==undefined?`<code>${code}</code>`:bold!==undefined?`<strong>${bold}</strong>`:`<em>${em}</em>`);}
const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(x=>x.trim());
const separator=line=>line.includes('|')&&cells(line).every(x=>/^:?-{3,}:?$/.test(x));
/** Limited Markdown subset. Raw HTML is always text; no remote media or executable links. */
export function renderAssistantMarkdown(value){
 const lines=String(value??'').replace(/\r\n?/g,'\n').split('\n'),out=[];let i=0;
 while(i<lines.length){const line=lines[i];if(!line.trim()){i++;continue;}
  if(/^```/.test(line)){const code=[];i++;while(i<lines.length&&!/^```/.test(lines[i]))code.push(lines[i++]);if(i<lines.length)i++;out.push('<pre><code>'+escape(code.join('\n'))+'</code></pre>');continue;}
  if(line.includes('|')&&i+1<lines.length&&separator(lines[i+1])){const headers=cells(line),rows=[];i+=2;while(i<lines.length&&lines[i].includes('|')&&lines[i].trim())rows.push(cells(lines[i++]));out.push('<div class="ai-table-scroll" role="region" aria-label="Tabla de la respuesta" tabindex="0"><table><thead><tr>'+headers.map(h=>'<th scope="col">'+inline(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+headers.map((_,j)=>'<td>'+inline(r[j]||'')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>');continue;}
  const heading=/^#{1,6}\s+(.+)$/.exec(line);if(heading){out.push('<h4>'+inline(heading[1])+'</h4>');i++;continue;}
  const item=/^\s*(?:([-+*])|\d+[.)])\s+(.+)$/.exec(line);if(item){const ordered=!item[1],tag=ordered?'ol':'ul',items=[];while(i<lines.length){const m=/^\s*(?:([-+*])|\d+[.)])\s+(.+)$/.exec(lines[i]);if(!m||!m[1]!==ordered)break;items.push('<li>'+inline(m[2])+'</li>');i++;}out.push('<'+tag+'>'+items.join('')+'</'+tag+'>');continue;}
  const para=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^\s*(?:#{1,6}\s|```|[-+*]\s|\d+[.)]\s)/.test(lines[i])&&!(lines[i].includes('|')&&separator(lines[i+1]||'')))para.push(lines[i++]);out.push('<p>'+para.map(inline).join('<br>')+'</p>');
 }
 return out.join('');
}
