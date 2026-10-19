import {transformPDF} from './pdf-tools-model.js';
self.onmessage=async({data})=>{try{const results=await transformPDF(data);self.postMessage({results},results.map(item=>item.bytes.buffer));}catch(error){self.postMessage({error:error.message});}};
