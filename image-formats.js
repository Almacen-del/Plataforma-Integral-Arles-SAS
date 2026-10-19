// Decoders are loaded only after a library image is opened.
export const imageFormats = Object.freeze({png:'PNG',jpg:'JPEG',jpeg:'JPEG',jfif:'JPEG',gif:'GIF',webp:'WEBP',avif:'AVIF',svg:'SVG',bmp:'BMP',ico:'ICO',tif:'TIFF',tiff:'TIFF',psd:'PSD',psb:'PSB',heic:'HEIC',heif:'HEIC',dng:'DNG',cr2:'DNG',cr3:'DNG',nef:'DNG',nrw:'DNG',arw:'DNG',orf:'DNG',rw2:'DNG',raf:'DNG',pef:'DNG',srw:'DNG',raw:'DNG',tga:'TGA',dds:'DDS',exr:'EXR',hdr:'HDR',jp2:'JP2',j2k:'J2K',jxl:'JXL',ppm:'PPM',pgm:'PGM',pbm:'PBM',pnm:'PNM',pcx:'PCX',qoi:'QOI'});
export function imageExtension(name=''){return String(name).split('.').pop().toLowerCase();}
export function isLibraryImage(name){return Object.hasOwn(imageFormats,imageExtension(name));}
export const nativeImageTypes={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',jfif:'image/jpeg',gif:'image/gif',webp:'image/webp',avif:'image/avif',svg:'image/svg+xml',bmp:'image/bmp',ico:'image/x-icon'};
