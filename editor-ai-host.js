// Requests execute in the signed-in platform page. Nested editor frames do not
// need another login or access to the browser's partitioned auth storage.
export function createEditorAIHost(document,{getSession,fetcher=fetch}={}){
 const identity={documentId:document.documentId,versionId:document.versionId,type:document.type};
 return Object.freeze({...identity,editable:document.editable,async request(body,signal){
  const {data,error}=await getSession();if(error||!data.session)throw Error('Inicia sesión en Arles y vuelve a abrir el documento.');
  const input={...identity,operation:body.operation,...(body.question!==undefined?{question:body.question}:{}),...(body.context!==undefined?{context:body.context}:{}),...(body.history!==undefined?{history:body.history}:{})};
  const response=await fetcher('/api/editor-assistant',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify(input),signal});
  const result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo completar la solicitud.');return result;
 }});
}
