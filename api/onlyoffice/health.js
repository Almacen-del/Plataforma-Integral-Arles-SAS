import {officeServerURL} from '../../onlyoffice-connection.js';

export const config={maxDuration:15};
export function createOfficeHealthHandler({env=process.env,fetcher=fetch}={}){
 return async function(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.setHeader('Allow','GET, HEAD');res.end(JSON.stringify({error:'Método no disponible.'}));return;}
  if(!env.ONLYOFFICE_SERVER_URL){res.end(JSON.stringify({enabled:false,ready:false,serverURL:''}));return;}
  let serverURL;
  try{serverURL=officeServerURL(env.ONLYOFFICE_SERVER_URL);}catch{res.statusCode=503;res.end(JSON.stringify({error:'La conexión del editor necesita configuración.'}));return;}
  let ready=false;
  try{
   const response=await fetcher(serverURL+'/api/onlyoffice/health',{redirect:'error',signal:AbortSignal.timeout(5000)});
   if(response.ok){const value=await response.json();ready=value.enabled===true&&value.ready===true&&officeServerURL(value.publicURL)===serverURL;}
  }catch{}
  res.end(JSON.stringify({enabled:true,ready,serverURL}));
 };
}
export default createOfficeHealthHandler();
