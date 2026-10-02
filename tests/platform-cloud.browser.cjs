// Isolated browser backend double. Never authenticates or writes to production.
const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:1500,height:950}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/public/vendor/supabase-2.117.2.js',route=>route.fulfill({contentType:'text/javascript',body:`
 const rows=new Map(), files=new Map();window.__cloudTest={rows,files};
 window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:"test-token"}}}),getUser:async()=>({data:{user:{id:'test-admin',email:'admin@example.invalid'}}}),onAuthStateChange:()=>{}},from(table){let key;const q={select:()=>q,eq:(k,v)=>{key=v;return q;},like:async()=>({data:[...rows.values()]}),maybeSingle:async()=>({data:table==='integral_members'?{display_name:'Administrador de prueba',active:true}:rows.get(key)||null}),then(resolve){resolve({count:7});}};return q;},rpc:async(name,{changes})=>{if(changes.some(c=>(rows.get(c.key)?.revision||0)!==c.revision))return {error:{message:'CONFLICT: test'}};return {data:changes.map(c=>{const row={...c,revision:c.revision+1};rows.set(c.key,row);return row;})};},storage:{from:()=>({upload:async(p,b)=>{files.set(p,b);return {};},download:async p=>({data:files.get(p)}),remove:async()=>({})})}})};` }));
 await page.goto('http://127.0.0.1:4173');
 await page.locator('#integral-cloud-account').waitFor();
 await page.waitForFunction(()=>document.querySelector('#integral-cloud-account')?.textContent.includes('Administrador de prueba'));
 await page.locator('#integral-cloud-account').click();
 await page.locator('[data-cloud-field]').click();
 await page.locator('[data-cloud-info]').filter({hasText:'FLORACION: 7'}).waitFor();
 await page.locator('[data-cloud-close]').click();
 await page.getByRole('button',{name:'Explorar la biblioteca'}).click();
 await page.locator('#open-sheet-workspace').click();
 await page.locator('[data-formula]').fill('Guardado en nube de prueba');await page.locator('[data-formula]').press('Enter');
 await page.locator('[data-sx=save]').click();
 await page.waitForFunction(()=>[...window.__cloudTest.rows.values()].some(r=>r.key.startsWith('state:')&&JSON.stringify(r.payload).includes('Guardado en nube de prueba')));
 await page.locator('[data-sx=close]').click();await page.locator('#open-sheet-workspace').click();
 assert.equal(await page.locator('[data-sx-cell=A1]').textContent(),'Guardado en nube de prueba');
 await page.locator('[data-sx=close]').click();
 await page.locator('.ai-launch').click();await page.locator('[data-ai=field-live]').click();
 await page.locator('.ai-answer-label').filter({hasText:'DATOS CONSULTADOS'}).waitFor();
 assert.match(await page.locator('.ai-messages').textContent(),/no totales de árboles/);
 await page.route('**/api/assistant',route=>{if(route.request().method()==='GET')return route.fulfill({json:{ready:true}});const body=route.request().postDataJSON();assert.equal(body.scope,'field');return route.fulfill({json:{answer:'Respuesta IA verificada <script>throw Error("injected")</script>',refs:[{name:'Censos',url:'https://censos-arles.vercel.app/'}],model:'test-model',at:new Date().toISOString()}});});
 await page.locator('.ai-scope select').selectOption('field');await page.locator('.ai-compose textarea').fill('Resume los censos');await page.locator('.ai-compose textarea').press('Enter');
 await page.locator('.ai-answer-label').filter({hasText:'IA · GROQ'}).waitFor();assert.match(await page.locator('.ai-messages').textContent(),/Respuesta IA verificada/);assert.equal(await page.locator('.ai-messages script').count(),0);
 // Exercise actual browser Blob/gzip path independently of the editor state wrapper.
 const roundtrip=await page.evaluate(async()=>{const c=await import('/platform-cloud.js');await c.cloudObject('pdf','put','test',{file:new File(['bytes preserved'],'test.pdf')});return (await c.cloudObject('pdf','get','test')).file.text();});
 assert.equal(roundtrip,'bytes preserved');
 await page.locator('[data-ai=close]').click();await page.locator('[data-library-file-input]').setInputFiles({name:'cloud-upload.txt',mimeType:'text/plain',buffer:Buffer.from('private original')});await page.locator('[data-upload-start]').click();const audit=page.locator('dialog[open]').filter({hasText:'Registrar cambio'});await audit.locator('[name=reason]').fill('Probar carga autenticada');await audit.getByRole('button',{name:'Confirmar y registrar'}).click();await page.locator('[data-upload-status]').filter({hasText:'Guardados en Supabase'}).waitFor();
 const cloudFile=await page.evaluate(async()=>{const row=window.__cloudTest.rows.get('state:arles-documental-prototipo-v1');const d=JSON.parse(row.payload).documents.find(d=>d.name==='cloud-upload.txt');const {cloudObject}=await import('/platform-cloud.js');return (await cloudObject('document','get',d.versions[0].fileId)).text();});assert.equal(cloudFile,'private original');assert.deepEqual(errors,[]);
 console.log('PASS authenticated boot, isolated state, spreadsheet save/reopen, real-query UI labels, private binary roundtrip (mock backend).');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
