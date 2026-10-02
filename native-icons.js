import {platformStorage as localStorage} from './platform-cloud.js';
// Local vector artwork. No font glyphs, external requests or provider accounts.
const p=d=>`<path d="${d}"/>`,c=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}"/>`,r=(x,y,w,h,rx=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const art={
 leaf:p('M20 3C8 2 2 7 5 15C9 23 21 16 20 3ZM5 20L16 8M10 14V9M10 14H16'),
 tree:p('M8 16C1 18-1 9 5 7C3 1 10-1 12 3C16-1 23 2 21 7C27 11 22 18 16 16M10 15V22H14V15M12 16L7 11M12 16L17 10M12 16V8M7 22H17'),
 nut:p('M12 3C5 4 3 9 4 15C5 21 11 23 16 20C22 16 22 8 17 5Z M12 5C8 9 15 13 11 20M5 10L8 8M16 8L18 11'),
 seed:p('M18 3C5 4 2 10 5 16C11 22 20 17 18 3ZM6 16L15 7'),
 sprout:p('M12 22V11C12 4 4 3 3 5C3 11 7 13 12 11M12 16C13 9 18 8 22 9C22 15 17 18 12 16M7 22H17'),
 field:p('M3 21L9 10M10 21L13 10M17 21L17 10M2 10H22M2 16H22')+c(6,4,2),
 pin:p('M12 22S3 14 3 9A9 9 0 0 1 21 9C21 14 12 22 12 22Z')+c(12,9,3),
 sun:c(12,12,4)+p('M12 1V4M12 20V23M1 12H4M20 12H23M4 4L6 6M18 18L20 20M4 20L6 18M18 6L20 4'),
 rain:p('M5 15C0 15 1 8 6 8C7 1 18 1 19 8C24 9 23 15 19 15ZM6 18L5 21M12 18L11 21M18 18L17 21'),
 drop:p('M12 2C10 7 4 10 4 15A8 8 0 0 0 20 15C20 10 14 7 12 2ZM8 15C8 18 10 19 12 19'),
 water:p('M2 8Q5 4 8 8T14 8T20 8M2 14Q5 10 8 14T14 14T20 14M2 20Q5 16 8 20T14 20T20 20'),
 irrigation:p('M12 22V13M6 22H18M7 13H17M12 13C12 5 2 4 2 10M12 13C12 5 22 4 22 10M4 13V15M20 13V15M7 8V10M17 8V10'),
 shovel:p('M9 2H15V6L12 9L9 6ZM12 9V14M7 14H17V18L12 23L7 18Z'),
 scissors:c(5,17,3)+c(19,17,3)+p('M7 15L18 2M17 15L6 2M9 11L15 11'),
 tractor:p('M3 16V9H13V4H19V16M13 9H19M3 13H8M1 9H5M8 19H15')+c(5,19,3)+c(18,18,4),
 bug:p('M8 7H16V15A4 4 0 0 1 8 15ZM9 7L7 3M15 7L17 3M12 8V19M3 10H8M16 10H21M3 16H8M16 16H21M5 22L9 18M15 18L19 22'),
 flower:c(12,12,3)+p('M12 9C3 3 8-1 12 5C16-1 21 3 15 9C24 8 24 16 16 15C20 23 13 25 12 18C8 25 2 21 8 15C0 18-1 9 9 10'),
 basket:p('M3 9H21L19 22H5ZM7 10L10 2M17 10L14 2M9 14V18M15 14V18'),
 greenhouse:p('M2 11L12 2L22 11V22H2ZM2 11H22M12 2V22M7 11V22M17 11V22'),
 pot:p('M5 13H19L17 22H7ZM4 10H20V13H4ZM12 10V4M12 7C6 8 4 3 5 2C10 2 12 4 12 7M12 7C17 7 20 4 19 2C15 2 12 4 12 7'),
 tray:r(2,5,20,15)+p('M2 10H22M2 15H22M7 5V20M12 5V20M17 5V20'),
 graft:p('M12 22V12L6 6M12 12L18 6M9 16H15M9 19H15M6 6V2M18 6V2M3 5H8M16 5H21'),
 growth:p('M3 21V14H7V21M10 21V10H14V21M17 21V5H21V21M3 10L10 6L14 8L21 2M17 2H21V6'),
 ruler:r(3,3,18,18)+p('M7 3V8M11 3V6M15 3V8M3 7H8M3 11H6M3 15H8'),
 thermometer:p('M9 15V5A3 3 0 0 1 15 5V15A5 5 0 1 1 9 15ZM12 8V18M18 5H21M18 9H20')+c(12,18,1.5),
 bag:p('M8 2H16L14 6C23 13 23 22 17 22H7C1 22 1 13 10 6ZM9 6H15M9 13H15M12 10V18'),
 scale:p('M12 2V21M7 22H17M3 6H21M6 6L2 15H10ZM18 6L14 15H22ZM2 15Q6 21 10 15M14 15Q18 21 22 15'),
 truck:r(2,5,12,12)+p('M14 9H19L22 13V17H14M15 13H22')+c(6,18,3)+c(18,18,3),
 calendar:r(3,5,18,17)+p('M7 2V8M17 2V8M3 10H21M7 14H10M14 14H17M7 18H10'),
 clock:c(12,12,9)+p('M12 6V12L16 15'),
 check:p('M4 12L9 18L21 5'),
 clipboard:r(4,4,16,18)+r(8,2,8,4)+p('M8 11H16M8 15H16M8 19H12'),
 oil:p('M9 2H15V6L18 10V22H6V10L9 6ZM6 12H18M12 14C7 18 12 22 14 18Z'),
 press:p('M3 2H21M6 2V22M18 2V22M3 22H21M8 7H16V12H8ZM12 2V7M8 17H16M10 15V17M14 15V17'),
 factory:p('M2 22V10L9 6V11L16 6V11H22V22ZM18 11V2H21V11M6 16V18M11 16V18M17 16V18'),
 filter:p('M2 3H22L15 12V20L9 23V12ZM5 7H19'),
 tank:p('M5 6A7 4 0 0 1 19 6V18A7 4 0 0 1 5 18ZM5 6A7 4 0 0 0 19 6M8 22V21M16 22V21M5 12H19'),
 gears:c(12,12,5)+c(12,12,1.5)+p('M12 2V6M12 18V22M2 12H6M18 12H22M5 5L8 8M16 16L19 19M5 19L8 16M16 8L19 5'),
 conveyor:p('M4 14H20A4 4 0 0 1 20 22H4A4 4 0 0 1 4 14ZM6 14V6H13V14M13 9H19V14')+c(5,18,1)+c(12,18,1)+c(19,18,1),
 bottle:p('M9 2H15V7L18 10V22H6V10L9 7ZM9 5H15M6 12H18M9 16H15'),
 pump:p('M5 22V8H15V22ZM4 22H16M7 4H13V8M10 4V1H20V4M15 12H19V18H22'),
 heat:p('M2 22H22M5 18H19M7 14C3 10 11 8 7 3M12 14C8 10 16 8 12 3M17 14C13 10 21 8 17 3'),
 snow:p('M12 2V22M3 7L21 17M3 17L21 7M8 4L12 8L16 4M8 20L12 16L16 20M3 11L7 10L6 5M18 19L17 14L21 13'),
 mixer:p('M3 6H21L18 20H6ZM12 1V14M8 12L16 16M8 16L16 12M7 23V20M17 23V20'),
 package:p('M3 7L12 2L21 7V19L12 23L3 19ZM3 7L12 12L21 7M12 12V23M7 4L17 9'),
 tag:p('M3 3H13L22 12L12 22L3 13Z')+c(8,8,1.5),
 barcode:p('M2 4V20M5 4V20M9 4V20M11 4V20M15 4V20M19 4V20M22 4V20'),
 seal:c(12,10,7)+p('M8 16L5 23L12 20L19 23L16 16M8 10L11 13L16 7'),
 search:c(10,10,7)+p('M15 15L22 22'),
 shield:p('M12 2L21 6V12C21 18 16 21 12 23C8 21 3 18 3 12V6ZM8 12L11 15L17 9'),
 chart:p('M3 2V22H23M6 18V13H9V18M12 18V8H15V18M18 18V4H21V18'),
 target:c(12,12,9)+c(12,12,5)+c(12,12,1),
 flask:p('M8 2H16M10 2V9L3 20Q3 22 6 22H18Q21 22 21 20L14 9V2M7 15H17')+c(11,18,1),
 microscope:p('M9 2L15 5L11 13L5 10ZM7 11L6 14M14 9C24 11 20 21 13 21H4M12 21V17M4 17H13M3 23H22'),
 tube:p('M8 2H16M9 2V18A3 3 0 0 0 15 18V2M9 9H15M12 13H15M12 17H15'),
 pipette:p('M16 2L22 8L18 12L12 6ZM13 7L3 17L2 22L7 21L17 11M8 13L11 16'),
 dna:p('M7 2C7 12 17 12 17 22M17 2C17 12 7 12 7 22M7 4H17M9 8H15M9 16H15M7 20H17'),
 petri:c(12,12,9)+p('M3 12Q12 20 21 12')+c(8,9,1)+c(15,7,1)+c(15,12,1),
 eye:p('M1 12Q12-2 23 12Q12 26 1 12Z')+c(12,12,4),
 warning:p('M12 2L23 22H1ZM12 9V15M12 18V19'),
 person:c(12,5,3)+p('M5 22V15A7 7 0 0 1 19 15V22M9 16V22M15 16V22'),
 helmet:p('M3 16V12A9 9 0 0 1 21 12V16M2 16H22V20H2ZM10 4V12M14 4V12M6 10V14M18 10V14'),
 goggles:p('M2 9H22V16H15L12 13L9 16H2ZM2 9L5 6H19L22 9M5 11H8M16 11H19'),
 gloves:p('M6 22L2 13Q2 10 5 12L7 14V5Q9 1 10 5V10V3Q12 0 13 3V10V4Q15 1 16 4V11V7Q19 4 19 8V18L16 22Z'),
 boots:p('M6 2H15V14L22 17V22H2V18L6 14ZM6 7H15M2 19H22'),
 mask:p('M5 7Q12 11 19 7V16Q12 24 5 16ZM5 9C0 3-1 17 5 17M19 9C24 3 25 17 19 17M8 12H16M8 15H16'),
 ear:p('M7 17C0 5 10 0 16 4C23 9 16 13 14 16C13 23 7 24 7 17M9 11C6 6 15 5 14 10L11 13'),
 vest:p('M7 2L12 6L17 2L22 8L19 11V22H5V11L2 8ZM12 6V22M5 15H19M5 18H19'),
 harness:c(12,4,2)+p('M8 8H16L18 17L16 22H8L6 17ZM8 8L16 18M16 8L8 18M6 17H18M12 18V22'),
 extinguisher:p('M8 9H16V22H8ZM10 6H15V9M12 6V3H19M8 2H15M15 3C22 3 22 10 20 13M8 13H16'),
 fire:p('M12 2C13 10 22 9 20 17C19 25 5 25 4 17C3 12 6 8 8 7C8 12 12 11 12 2ZM12 13C7 18 9 22 12 22C17 22 16 17 12 13Z'),
 firstaid:r(2,7,20,15)+p('M8 7V3H16V7M12 11V18M8 14H16'),
 heart:p('M12 22C-8 10 4-3 12 6C20-3 32 10 12 22ZM3 12H8L10 8L13 16L15 12H21'),
 exit:p('M2 22V2H14V7M14 18V22H2M6 4V20M10 12H23M18 7L23 12L18 17'),
 bell:p('M5 16V10A7 7 0 0 1 19 10V16L22 19H2ZM9 22H15M12 1V3'),
 phone:p('M5 2L9 7L6 10C8 14 10 16 14 18L17 15L22 19C19 28-4 5 5 2Z'),
 megaphone:p('M3 10L20 3V19L3 14ZM7 15L9 22H13L11 16M20 8H23V14H20'),
 lightning:p('M14 1L3 14H11L9 23L21 10H13Z'),
 lock:r(4,10,16,13)+p('M7 10V6A5 5 0 0 1 17 6V10M12 15V18'),
 ladder:p('M6 1V23M18 1V23M6 5H18M6 10H18M6 15H18M6 20H18'),
 lift:p('M5 2V22M19 2V22M2 22H22M5 5H19M12 5V10Q17 13 12 16Q8 16 8 13M3 18H21'),
 hand:p('M6 20L2 12L5 10L8 13V3H11V10V2H14V10V4H17V11V7H20V18L16 22H9Z'),
 wash:p('M3 20L8 16H17L21 18L16 22H7ZM3 7H14V11M7 7V3H16M14 14V16M18 10V13'),
 recycle:p('M9 3H15L19 10M15 9L19 10L21 6M20 14L17 20H8M10 17L7 20L10 23M4 18L1 12L6 5M3 5H7V9'),
 bin:p('M3 6H21M8 6V2H16V6M5 6L7 22H17L19 6M10 10V18M14 10V18'),
 globe:c(12,12,10)+p('M2 12H22M12 2C5 8 5 16 12 22C19 16 19 8 12 2M4 6H20M4 18H20'),
 animal:p('M8 12L5 5L8 2L11 6L16 4L22 8L18 12V17L14 22H7L3 18V13Z')+c(16,8,1),
 bird:p('M2 18L8 15L5 7L12 11C15 2 21 3 21 8L24 10L20 11C18 18 11 20 2 18Z'),
 fish:p('M2 12C8 2 17 5 19 9L23 5V19L19 15C17 19 8 22 2 12Z')+c(7,11,1),
 solar:p('M3 10H21L23 21H1ZM12 10V21M2 16H22M6 10L5 21M18 10L19 21')+c(12,4,2),
 warehouse:p('M2 22V8L12 2L22 8V22ZM7 22V11H17V22M7 15H17M7 19H17'),
 shelves:p('M3 2V22M21 2V22M3 9H21M3 18H21M6 9V3H12V9M14 9V5H18V9M7 18V12H17V18'),
 forklift:p('M2 18V9H12V18M7 9V3H13V18M17 2V18H23M17 18H12')+c(5,20,2)+c(12,20,2),
 pallet:p('M2 18H22V22H2ZM5 18V22M19 18V22M5 18V8H19V18M12 8V18M8 8V2H16V8'),
 cart:p('M1 3H4L7 17H20L23 7H5M8 12H21')+c(9,21,1)+c(19,21,1),
 wrench:p('M15 2L12 7L17 12L22 9C23 15 18 18 14 15L6 23L1 18L9 10C6 6 10 0 15 2Z'),
 hammer:p('M3 4L8 1L16 7L14 11L10 8L4 22L1 20L7 6ZM16 7L20 7L23 10L20 14L16 11'),
 toolcase:r(2,7,20,15)+p('M8 7V3H16V7M2 13H22M10 11V15H14V11'),
 bolt:p('M9 1H15V6L19 10V15L15 19V23H9V19L5 15V10L9 6ZM5 10H19M5 15H19'),
 motor:r(5,6,14,14)+p('M1 10H5M1 16H5M19 10H23M19 16H23M8 3H16M8 23H16M9 10V16M13 10V16M17 10V16'),
 gauge:p('M3 21A11 11 0 1 1 21 21ZM12 16L18 7M4 13H6M7 6L8 8M16 5L15 7')+c(12,16,2),
 plug:p('M7 1V7M17 1V7M4 7H20V11A8 8 0 0 1 4 11ZM12 19V23'),
 battery:r(2,6,18,13)+p('M20 10H23V15H20M6 10V15M9 12H15M12 9V15'),
 computer:r(2,3,20,15)+p('M12 18V22M7 22H17M6 7H18'),
 users:c(9,6,3)+p('M2 22V16A7 7 0 0 1 16 16V22M17 3A3 3 0 0 1 17 9M19 13Q23 15 22 22'),
 book:p('M12 5Q6 1 2 4V21Q6 18 12 22Q18 18 22 21V4Q18 1 12 5ZM12 5V22M5 8H9M15 8H19M5 12H9M15 12H19'),
 document:p('M4 2H14L20 8V22H4ZM14 2V8H20M8 12H16M8 16H16M8 19H13'),
 folder:p('M2 5H9L12 8H22V22H2ZM2 11H22'),
 pen:p('M3 17L16 2L22 8L8 22L2 23ZM13 5L19 11M3 17L8 22'),
 mail:r(2,4,20,16)+p('M2 5L12 13L22 5M2 20L8 12M22 20L16 12'),
 handshake:p('M1 8L6 3L10 6L14 4L23 8L19 19L15 22L5 16ZM10 6L7 10L10 13L14 9L21 15M5 16L8 12M9 19L12 15M13 21L16 18'),
 money:r(2,5,20,15)+c(12,12.5,3)+p('M5 8H6M18 17H19'),
 route:c(5,4,2)+c(19,20,2)+p('M5 6V12H17Q22 12 22 7T17 2H13M19 18H7Q2 18 2 22'),
 upload:p('M12 18V2M6 8L12 2L18 8M3 16V22H21V16'),
 download:p('M12 2V18M6 12L12 18L18 12M3 16V22H21V16'),
 qr:p('M2 2H9V9H2ZM15 2H22V9H15ZM2 15H9V22H2ZM15 15H18V18H22V22H15ZM5 5H6V6H5ZM18 5H19V6H18ZM5 18H6V19H5Z'),
 link:p('M10 7L14 3A5 5 0 0 1 21 10L17 14M7 10L3 14A5 5 0 0 0 10 21L14 17M8 16L16 8'),
 flag:p('M4 23V2M4 3C10 0 15 7 22 3V15C15 19 10 12 4 16'),
 network:r(8,2,8,6)+r(1,17,7,6)+r(16,17,7,6)+p('M12 8V12M4 17V12H20V17'),
 lightbulb:p('M8 17C0 8 7 0 12 2C22 2 22 12 16 17ZM8 20H16M10 23H14M12 17V11M9 9L12 12L15 9'),
 star:p('M12 2L15 8L22 9L17 14L18 22L12 18L6 22L7 14L2 9L9 8Z')
};
const groups=[];
// Labels and search terms reflect the workflows of a cacay-oil producer.
function category(id,name,rows){groups.push({id,name,items:rows.map(([label,glyph,keywords='',badge=''],i)=>({id:id+'-'+i,name:label,glyph,keywords,badge,category:id}))});}
category('campo','Cacay y plantación',[
 ['Árbol de cacay','tree','caryodendron orinocense cultivo'],['Nuez de cacay','nut','fruto almendra semilla'],['Plantación','field','lote cultivo campo'],['Lote de cultivo','pin','ubicacion sector mapa'],['Siembra','shovel','plantar terreno'],['Nutrición vegetal','leaf','fertilizacion abono'],['Riego','irrigation','agua irrigacion'],['Poda','scissors','ramas corte'],['Floración','flower','flores fenologia'],['Fructificación','tree','frutos produccion','nut'],['Sanidad vegetal','leaf','fitosanitario enfermedad','shield'],['Plagas','bug','insectos control'],['Monitoreo de campo','search','inspeccion plantacion','leaf'],['Clima y radiación','sun','sol temperatura'],['Lluvia','rain','precipitacion'],['Suelo','field','terreno analisis','flask'],['Maquinaria agrícola','tractor','tractor campo'],['Conteo de árboles','tree','censo inventario','check']]);
category('vivero','Vivero y propagación',[
 ['Semilla','seed','germinacion cacay'],['Germinación','sprout','brote semillero'],['Plántula','pot','planta bolsa'],['Vivero','greenhouse','invernadero'],['Bandeja de propagación','tray','semillero'],['Injertación','graft','injerto patron'],['Trasplante','pot','trasplantar','shovel'],['Sustrato','bag','tierra mezcla abono'],['Crecimiento','growth','desarrollo altura'],['Medición de planta','ruler','diametro altura'],['Humedad','drop','riego agua'],['Endurecimiento','sprout','adaptacion','sun'],['Inventario de plantas','clipboard','conteo vivero','leaf'],['Despacho de plantas','truck','salida vivero','leaf']]);
category('cosecha','Cosecha y poscosecha',[
 ['Recolección de frutos','basket','cosecha cacay'],['Calendario de cosecha','calendar','programacion','nut'],['Selección de nueces','nut','clasificacion','check'],['Recepción de cosecha','download','ingreso frutos'],['Pesaje de frutos','scale','peso bascula'],['Sacos de cosecha','bag','empaque bultos'],['Transporte de frutos','truck','cosecha logistica'],['Limpieza de nueces','wash','lavado fruto'],['Secado','sun','humedad poscosecha'],['Descascarado','nut','pelado cascara','gears'],['Almendra seleccionada','seed','nuez calidad','seal'],['Lote de cosecha','tag','trazabilidad origen','nut']]);
category('aceite','Producción de aceite de cacay',[
 ['Aceite de cacay','oil','aceite vegetal nuez'],['Planta de producción','factory','fabrica proceso'],['Prensado','press','prensa extraccion frio'],['Extracción de aceite','drop','rendimiento prensa','gears'],['Filtración','filter','filtro impurezas'],['Decantación','tank','reposo separacion'],['Tanque de aceite','tank','almacenamiento','drop'],['Bombeo','pump','trasiego transferencia'],['Mezclado','mixer','homogeneizacion'],['Control de temperatura','thermometer','proceso calor'],['Calentamiento','heat','calor termico'],['Enfriamiento','snow','frio refrigeracion'],['Línea de producción','conveyor','proceso transporte'],['Envasado','bottle','llenado empaque'],['Tapado y sellado','bottle','tapa sello','lock'],['Etiquetado','tag','rotulo etiqueta'],['Aceite terminado','oil','producto final','check'],['Subproducto','bag','torta prensado'],['Rendimiento de extracción','chart','eficiencia aceite','drop'],['Lote de producción','barcode','trazabilidad lote']]);
category('calidad','Calidad y mejora continua',[
 ['Control de calidad','shield','calidad control'],['Producto aprobado','seal','liberado conforme'],['Inspección','search','revision verificar'],['Lista de verificación','clipboard','checklist chequeo'],['No conformidad','warning','incumplimiento hallazgo'],['Acción correctiva','wrench','correccion mejora','check'],['Mejora continua','growth','phva progreso'],['Auditoría','document','auditoria evidencia','search'],['Trazabilidad','route','origen lote seguimiento'],['Indicadores','chart','kpi resultados'],['Objetivos de calidad','target','metas'],['Control de cambios','pen','version revision'],['Muestra de retención','tube','contramuestra','lock'],['Producto en revisión','package','pendiente cuarentena','clock'],['Producto rechazado','package','rechazo no conforme','warning'],['Liberación de lote','tag','aprobacion lote','check'],['Satisfacción del cliente','star','cliente encuesta'],['Gestión de riesgos','shield','riesgo evaluacion','warning']]);
category('laboratorio','Laboratorio y análisis',[
 ['Laboratorio','flask','analisis ensayo'],['Microscopía','microscope','microbiologia'],['Muestreo','pipette','muestra tomar'],['Tubo de ensayo','tube','muestra analisis'],['Microbiología','petri','cultivo bacterias'],['Análisis de humedad','drop','humedad laboratorio','flask'],['Análisis de acidez','flask','acidez aceite','drop'],['Análisis de pureza','flask','pureza','seal'],['Propiedades del aceite','oil','caracterizacion fisicoquimica','flask'],['Evaluación visual','eye','aspecto color'],['Balanza de laboratorio','scale','masa peso precision','flask'],['Temperatura de muestra','thermometer','ensayo','tube'],['Reactivos','bottle','quimicos laboratorio','flask'],['Resultados de análisis','document','informe laboratorio','flask']]);
category('sst','SG-SST y prevención',[
 ['Gestión SG-SST','shield','sst seguridad salud trabajo'],['Identificación de peligros','warning','peligro riesgo'],['Inspección de seguridad','search','sst inspeccion','shield'],['Reporte de incidente','clipboard','incidente casi accidente','warning'],['Accidente de trabajo','person','lesion accidente','firstaid'],['Riesgo eléctrico','lightning','electricidad voltaje'],['Trabajo en alturas','ladder','altura caida'],['Izaje de cargas','lift','carga suspendida'],['Protección de manos','hand','atrapamiento manos'],['Ruido ocupacional','ear','ruido audicion'],['Exposición al calor','heat','temperaturas altas'],['Sustancias químicas','bottle','quimico hds sga','warning'],['Bloqueo de energía','lock','bloqueo etiquetado loto'],['Pausas activas','person','ergonomia pausa','clock'],['Autocuidado','heart','salud bienestar'],['Capacitación en seguridad','book','sst formacion','shield'],['Permiso de trabajo','document','autorizacion permiso','shield'],['Reporte de condición insegura','flag','hallazgo sst'],['Inspección de equipos','gears','seguridad equipo','search'],['Salud ocupacional','firstaid','medicina laboral']]);
category('epp','Elementos de protección personal',[
 ['Casco de seguridad','helmet','epp cabeza'],['Gafas de protección','goggles','epp ojos'],['Guantes','gloves','epp manos'],['Botas de seguridad','boots','epp pies calzado'],['Protección respiratoria','mask','epp mascarilla respirador'],['Protección auditiva','ear','epp oidos orejeras'],['Chaleco de seguridad','vest','epp reflectivo'],['Arnés','harness','epp alturas'],['Dotación','vest','uniforme ropa trabajo','package'],['Entrega de EPP','hand','epp entrega registro','check'],['Reposición de EPP','helmet','epp reemplazo','clock'],['Inspección de EPP','helmet','epp revisar','search']]);
category('emergencias','Emergencias y primeros auxilios',[
 ['Extintor','extinguisher','incendio fuego'],['Incendio','fire','fuego emergencia'],['Botiquín','firstaid','primeros auxilios'],['Atención de emergencia','heart','asistencia salud','firstaid'],['Evacuación','exit','salida emergencia'],['Punto de encuentro','users','reunion evacuacion','pin'],['Alarma','bell','alerta emergencia'],['Teléfono de emergencia','phone','contacto ayuda'],['Brigada de emergencia','helmet','brigadista','firstaid'],['Comunicación de emergencia','megaphone','megafono aviso'],['Kit para derrames','drop','derrame contencion','toolcase'],['Simulacro','users','evacuacion practica','clock'],['Lavado de emergencia','wash','lavaojos ducha'],['Ruta de evacuación','route','ruta salida','exit']]);
category('ambiente','Ambiente y sostenibilidad',[
 ['Gestión ambiental','globe','ambiente sostenibilidad'],['Reciclaje','recycle','aprovechamiento residuos'],['Separación de residuos','bin','clasificacion residuos'],['Residuo orgánico','leaf','compost organico','bin'],['Residuo aprovechable','package','reciclable','recycle'],['Residuo de manejo especial','bin','residuo manejo','warning'],['Ahorro de agua','drop','conservacion agua','leaf'],['Tratamiento de agua','filter','agua vertimientos','drop'],['Energía solar','solar','renovable panel'],['Eficiencia energética','lightning','ahorro energia','leaf'],['Biodiversidad','animal','fauna conservacion'],['Avifauna','bird','aves biodiversidad'],['Ecosistema acuático','fish','rio agua fauna'],['Reforestación','tree','siembra restauracion','leaf'],['Protección de suelos','field','erosion cobertura','shield'],['Huella ambiental','globe','impacto indicadores','leaf']]);
category('almacen','Almacén y logística',[
 ['Almacén','warehouse','bodega inventario'],['Estantería','shelves','ubicacion anaquel'],['Existencias','package','stock inventario'],['Entrada a almacén','download','ingreso recepcion'],['Salida de almacén','upload','despacho entrega'],['Montacargas','forklift','transporte carga'],['Estiba','pallet','pallet almacenamiento'],['Preparación de pedido','cart','picking pedido'],['Código de barras','barcode','identificacion codigo'],['Código QR','qr','qr identificacion'],['Transporte','truck','logistica vehiculo'],['Conteo físico','clipboard','inventario conteo','package'],['Rotación de inventario','clock','fifo fefo rotacion','package'],['Ubicación en bodega','pin','localizacion almacen'],['Entrega verificada','truck','recibido entrega','check'],['Compras','cart','abastecimiento compra']]);
category('mantenimiento','Mantenimiento y taller',[
 ['Mantenimiento','wrench','taller reparacion'],['Herramientas','toolcase','equipo taller'],['Reparación','hammer','correctivo'],['Repuesto','bolt','pieza tornillo'],['Motor','motor','maquina motor'],['Manómetro','gauge','presion instrumento'],['Conexión eléctrica','plug','enchufe energia'],['Batería','battery','acumulador carga'],['Lubricación','oil','grasa lubricante','wrench'],['Mantenimiento preventivo','calendar','programado preventivo','wrench'],['Mantenimiento correctivo','wrench','averia correctivo','warning'],['Orden de trabajo','clipboard','orden ot','wrench'],['Equipo disponible','gears','operativo disponible','check'],['Equipo fuera de servicio','gears','parado averia','warning'],['Calibración','gauge','calibrar metrologia','check'],['Historial de equipo','document','hoja vida maquina','gears']]);
category('personal','Personal y formación',[
 ['Trabajador','person','personal empleado'],['Equipo de trabajo','users','equipo grupo'],['Contrato','document','contrato laboral','pen'],['Turnos','calendar','horario turno'],['Asistencia','person','asistencia ingreso','check'],['Descanso','clock','descanso jornada'],['Capacitación','book','formacion aprendizaje'],['Inducción','person','induccion bienvenida','book'],['Evaluación de competencias','clipboard','competencia evaluacion','person'],['Bienestar','heart','personal bienestar'],['Comunicación interna','megaphone','aviso informacion'],['Responsable de área','person','jefe supervisor','flag']]);
category('documentos','Documentación y sistemas',[
 ['Documento','document','formato archivo'],['Carpeta','folder','biblioteca archivo'],['Firma','pen','firmar aprobacion'],['Documento vigente','document','vigente aprobado','check'],['Documento en revisión','document','borrador revision','clock'],['Documento protegido','document','acceso permiso','lock'],['Vínculo','link','enlace hipervinculo'],['Correo','mail','email comunicacion'],['Sistema informático','computer','software plataforma'],['Copia de respaldo','document','backup respaldo','shield'],['Flujo de aprobación','network','aprobacion proceso'],['Historial de cambios','document','trazabilidad versiones','route']]);
category('gestion','Gestión empresarial',[
 ['Dirección','flag','gerencia estrategia'],['Organización','network','organigrama areas'],['Plan de trabajo','calendar','planificacion actividades'],['Objetivo','target','meta estrategia'],['Presupuesto','money','costos presupuesto'],['Indicadores de gestión','chart','kpi desempeno'],['Acuerdo comercial','handshake','proveedor cliente acuerdo'],['Proveedor','truck','proveedor abastecimiento','handshake'],['Cliente','person','cliente comprador','star'],['Innovación','lightbulb','idea proyecto mejora'],['Proyecto','folder','proyecto gestion','flag'],['Mercado de aceite','oil','ventas comercial cacay','globe'],['Exportación','globe','internacional exportar','truck'],['Reconocimiento','seal','logro reconocimiento']]);
export const iconGroups=groups;
export const icons=groups.flatMap(g=>g.items);
export function iconSVG(id,{color='#197650',style='transparent'}={}){const icon=icons.find(i=>i.id===id);if(!icon||!art[icon.glyph]||icon.badge&&!art[icon.badge])throw Error('Icono no disponible.');if(!/^#[\da-f]{6}$/i.test(color)||!['transparent','soft','solid'].includes(style))throw Error('Estilo no válido.');const ink=style==='solid'?'#ffffff':color;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="512" height="512">${style==='transparent'?'':`<rect x="1" y="1" width="30" height="30" rx="8" fill="${color}" ${style==='soft'?'fill-opacity=".1"':''}/>`}<g transform="translate(4 4)" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${art[icon.glyph]}</g>${icon.badge?`<circle cx="25" cy="25" r="6.5" fill="${style==='solid'?color:'#ffffff'}" stroke="${ink}" stroke-width=".7"/><g transform="translate(20 20) scale(.4167)" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${art[icon.badge]}</g>`:''}</svg>`;}
export async function iconCanvas(id,options){const url=URL.createObjectURL(new Blob([iconSVG(id,options)],{type:'image/svg+xml'}));try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;canvas.getContext('2d').drawImage(img,0,0);return canvas;}finally{URL.revokeObjectURL(url);}}
const norm=s=>String(s).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function searchIcons(query='',category='all'){const words=norm(query).split(/\s+/).filter(Boolean);return icons.filter(i=>(category==='all'||i.category===category)&&words.every(w=>norm(i.name+' '+i.keywords+' '+groups.find(g=>g.id===i.category).name).includes(w)));}
export function openIcons(modal,onInsert){let active='all',selected=icons[0],busy=false;const key='arles-icons-preferences-v1';let prefs={recent:[],favorites:[]};try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const k of ['recent','favorites'])if(Array.isArray(saved[k]))prefs[k]=saved[k].filter(id=>icons.some(i=>i.id===id)).slice(0,k==='recent'?18:250);}catch{}
 const d=document.createElement('dialog');d.className='ic-gallery';d.innerHTML=`<header><div><small>ICONOS PARA ARLES</small><h3>Del campo al aceite de cacay</h3></div><button type="button" data-ic-close aria-label="Cerrar iconos">×</button></header><div class="ic-search"><input type="search" aria-label="Buscar iconos" placeholder="Busca cacay, calidad, EPP, riego, mantenimiento…"><span data-ic-count></span></div><div class="ic-body"><nav aria-label="Categorías de iconos">${[['all','Todos los iconos'],['favorites','★ Favoritos'],['recent','◷ Recientes'],...groups.map(g=>[g.id,g.name])].map(([id,name])=>`<button type="button" data-ic-category="${id}">${name}</button>`).join('')}</nav><div class="ic-grid" role="group" aria-label="Iconos disponibles"></div><aside><div class="ic-preview"></div><strong data-ic-name></strong><small data-ic-group></small><button type="button" data-ic-favorite>☆ Guardar favorito</button><label>Color<input type="color" value="#197650" data-ic-color></label><div class="ic-swatches">${['#197650','#1f6ca2','#d38322','#b23c3c','#704eb1','#24332d'].map(color=>`<button type="button" data-ic-swatch="${color}" style="background:${color}" aria-label="Color ${color}"></button>`).join('')}</div><label>Presentación<select data-ic-style><option value="transparent">Sin fondo</option><option value="soft">Fondo suave</option><option value="solid">Fondo de color</option></select></label><label>Tamaño en la hoja<select data-ic-size><option value="10">Pequeño</option><option value="15" selected>Mediano</option><option value="25">Grande</option></select></label><p>Después de insertarlo puedes moverlo, girarlo o cambiar su tamaño.</p></aside></div><footer><span role="alert" data-ic-error></span><button type="button" data-ic-close>Cancelar</button><button type="button" data-ic-insert>Insertar icono</button></footer>`;modal.append(d);const grid=d.querySelector('.ic-grid'),options=()=>({color:d.querySelector('[data-ic-color]').value,style:d.querySelector('[data-ic-style]').value});
 function savePrefs(){try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}}
 function preview(){d.querySelector('.ic-preview').innerHTML=iconSVG(selected.id,options());d.querySelector('[data-ic-name]').textContent=selected.name;d.querySelector('[data-ic-group]').textContent=groups.find(g=>g.id===selected.category).name;const star=d.querySelector('[data-ic-favorite]');star.textContent=prefs.favorites.includes(selected.id)?'★ Quitar favorito':'☆ Guardar favorito';star.setAttribute('aria-pressed',prefs.favorites.includes(selected.id));for(const b of grid.querySelectorAll('[data-ic]'))b.setAttribute('aria-pressed',b.dataset.ic===selected.id);}
 function draw(){let results=searchIcons(d.querySelector('.ic-search input').value,['favorites','recent'].includes(active)?'all':active);if(active==='favorites'||active==='recent')results=prefs[active].map(id=>results.find(i=>i.id===id)).filter(Boolean);if(results.length&&!results.some(i=>i.id===selected.id))selected=results[0];d.querySelector('[data-ic-insert]').disabled=!results.length;d.querySelector('aside').hidden=!results.length;grid.innerHTML=results.map(i=>`<button type="button" data-ic="${i.id}" title="${i.name}" aria-pressed="${selected.id===i.id}">${iconSVG(i.id)}<span>${i.name}</span></button>`).join('')||'<p class="ic-empty">No hay iconos en esta selección. Prueba otra búsqueda o categoría.</p>';d.querySelector('[data-ic-count]').textContent=results.length+' iconos';for(const b of d.querySelectorAll('[data-ic-category]'))b.setAttribute('aria-pressed',b.dataset.icCategory===active);preview();}
 function close(){if(busy)return;d.close();d.remove();}d.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();close();});d.querySelector('.ic-search input').oninput=draw;d.querySelector('[data-ic-color]').oninput=preview;d.querySelector('[data-ic-style]').onchange=preview;
 d.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||busy)return;if(b.hasAttribute('data-ic-close')){close();return;}if(b.dataset.icCategory){active=b.dataset.icCategory;draw();return;}if(b.dataset.ic){selected=icons.find(i=>i.id===b.dataset.ic);preview();return;}if(b.dataset.icSwatch){d.querySelector('[data-ic-color]').value=b.dataset.icSwatch;preview();return;}if(b.hasAttribute('data-ic-favorite')){prefs.favorites=prefs.favorites.includes(selected.id)?prefs.favorites.filter(id=>id!==selected.id):[selected.id,...prefs.favorites];savePrefs();if(active==='favorites')draw();else preview();return;}if(b.hasAttribute('data-ic-insert')){busy=true;b.disabled=true;d.querySelector('[data-ic-error]').textContent='';try{const canvas=await iconCanvas(selected.id,options());d.close();await onInsert(canvas,selected.name,Number(d.querySelector('[data-ic-size]').value));prefs.recent=[selected.id,...prefs.recent.filter(id=>id!==selected.id)].slice(0,18);savePrefs();d.remove();}catch(err){d.querySelector('[data-ic-error]').textContent=err.message;if(!d.open)d.showModal();}finally{busy=false;b.disabled=false;}}});d.showModal();draw();}
