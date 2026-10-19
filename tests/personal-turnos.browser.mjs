import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=process.cwd(),errors=[],person={id:'linked-person',name:'Persona de prueba vinculada',role:'Auxiliar de campo',area:'',status:'active',phone:'3000000000',identity:'123456'};
const entries={'linked-person|2026-10-05':{type:'A',color:'#6fa8dc',source:{cell:'D4'}},'linked-person|2026-10-06':{type:'D'}};
const fixture={people:[person],types:[{id:'A',name:'Turno',color:'#5098d5'},{id:'D',name:'Descanso',color:'#f1cc38'}],entries,history:[]};
const server=http.createServer(async(req,res)=>{try{const route=new URL(req.url,'http://localhost').pathname,file=path.join(root,route==='/'?'index.html':route);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');let body=await readFile(file);if(file.endsWith('index.html'))body=body.toString().replace('<script type="module" src="/platform-boot.js"></script>','<script type="module">await import("/app.js");await import("/turnos.js");await import("/document-control.js");await import("/platform.js");</script>');res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(4201,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1500,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 await page.addInitScript(state=>localStorage.setItem('arles-turnos-v1',JSON.stringify(state)),fixture);await page.goto('http://127.0.0.1:4201/');await page.locator('[data-home-link]').first().waitFor();await page.locator('#nav-personal').dispatchEvent('click');
 const other=await context.newPage();other.on('pageerror',e=>errors.push(e.message));await other.goto('http://127.0.0.1:4201/');await other.locator('[data-home-link]').first().waitFor();await other.locator('#nav-turnos').dispatchEvent('click');assert.equal(await other.locator('.ts-person').count(),1);
 async function confirmAudit(){await page.locator('.ts-dialog[open] [name="reason"]').fill('Verificación aislada de la vinculación Personal y Turnos');await page.getByRole('button',{name:'Confirmar y registrar',exact:true}).click();}
 await page.locator('#platform-view [data-person-state]').click();await confirmAudit();
 await page.waitForFunction(()=>document.querySelector('#platform-view .personal-status.inactive'));await other.waitForFunction(()=>document.querySelector('#turnos-view')&&!document.querySelector('#turnos-view .ts-person'));
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('arles-turnos-v1')).entries),entries);
 await page.locator('#nav-turnos').dispatchEvent('click');await page.locator('#ts-status').selectOption('inactive');assert.equal(await page.locator('.ts-person').count(),1);await page.locator('[data-balance="linked-person"]').click();await page.locator('#ts-dialog [data-person-state]').click();await confirmAudit();
 await other.waitForFunction(()=>document.querySelector('#turnos-view .ts-person'));await page.locator('#nav-personal').dispatchEvent('click');assert.equal(await page.locator('.personal-status.active').count(),1);
 await page.locator('[data-edit-personal]').first().click();assert.equal(await page.locator('#ts-dialog [name="area"]').inputValue(),'');await page.locator('#ts-dialog [name="phone"]').fill('3111111111');await page.locator('#ts-form footer .primary').click();await confirmAudit();await page.waitForFunction(()=>!document.querySelector('#ts-dialog[open]'));
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('arles-turnos-v1')));assert.equal(state.people.length,1);assert.equal(state.people[0].phone,'3111111111');assert.equal(state.people[0].area,'');assert.equal(state.people[0].identity,'123456');assert.deepEqual(state.entries,entries);
 await page.locator('[data-personal-shifts]').click();assert.equal(await page.locator('#turnos-view').isVisible(),true);assert.equal(await page.locator('.ts-person strong').textContent(),person.name);
 await page.locator('[data-balance="linked-person"]').click();await page.locator('#ts-dialog [data-person="linked-person"]').click();await page.locator('#ts-dialog [name="name"]').fill('Nombre actualizado de la persona vinculada');await page.locator('#ts-form footer .primary').click();await confirmAudit();await page.waitForFunction(()=>!document.querySelector('#ts-dialog[open]'));assert.equal(await page.locator('.ts-person strong').textContent(),'Nombre actualizado de la persona vinculada');
 await page.locator('[data-ts="people"]').click();assert.equal(await page.locator('#platform-view').isVisible(),true);assert.equal(await page.locator('.personal-name').textContent(),'Nombre actualizado de la persona vinculada');
 assert.deepEqual(errors,[]);console.log('PASS Personal → inactivo en Turnos y otra pestaña; Turnos → activo en Personal; ficha única, contactos compartidos, área vacía y turnos conservados.');
}finally{await browser.close();server.close();}
