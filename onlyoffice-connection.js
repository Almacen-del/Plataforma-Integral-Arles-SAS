export function officeServerURL(value){
 if(!value)return '';
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('La dirección del editor no es válida.');
 return url.origin;
}

export async function officeHealth(){
 let response;
 try{response=await fetch('/api/onlyoffice/health',{signal:AbortSignal.timeout(10000),cache:'no-store'});}catch{throw Error('No se pudo comprobar la conexión con el editor. Intenta nuevamente.');}
 if(response.status===404)return {enabled:false,ready:false,serverURL:''};
 if(!response.ok)throw Error('No se pudo comprobar la conexión con el editor. Intenta nuevamente.');
 const value=await response.json();
 return {...value,serverURL:officeServerURL(value.serverURL)};
}

export function requireOfficeReady(health){
 if(!health.enabled||!health.ready)throw Error('El editor temporal no está disponible. Comprueba que el equipo servidor y Docker estén encendidos.');
 return health.serverURL||location.origin;
}
