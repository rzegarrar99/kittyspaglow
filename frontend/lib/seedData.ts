import { clientService } from '../services/client.service';
import { serviceService } from '../services/service.service';
import { supplierService, areaService } from '../services/operations.service';
import { staffService } from '../services/staff.service';
import { inventoryService, categoryService, brandService, unitService } from '../services/inventory.service';

if (!import.meta.env.DEV) {
  throw new Error('[seedData] No disponible en producción');
}

// ─── HELPERS ────────────────────────────────────────────────────────
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const isoDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

// ─── CATEGORÍAS (100) ───────────────────────────────────────────────
const CATEGORY_NAMES = [
  'Faciales','Masajes','Manicura','Pedicura','Depilación',
  'Tratamientos Corporales','Pestañas','Cejas','Aromaterapia','Reflexología',
  'Exfoliación','Envolvimientos','Hidratación','Anti-edad','Acné',
  'Blanqueamiento','Drenaje Linfático','Reafirmante','Relajación','Terapias',
];

export const seedCategories = async () => {
  const results = [];
  for (let i = 0; i < 100; i++) {
    const base = CATEGORY_NAMES[i % CATEGORY_NAMES.length];
    results.push(categoryService.create({
      name: i < CATEGORY_NAMES.length ? base : `${base} ${Math.floor(i / CATEGORY_NAMES.length) + 1}`,
      description: `Categoría profesional de ${base.toLowerCase()} para spa`,
    }));
  }
  await Promise.all(results);
};

// ─── MARCAS (100) ───────────────────────────────────────────────────
const BRAND_BASES = [
  ['Glow Beauty','Línea premium facial','Francia'],
  ['Dermalogica','Cosmética profesional','Estados Unidos'],
  ['Natura','Cosméticos naturales','Brasil'],
  ["L'Oréal Professionnel",'Línea profesional','Francia'],
  ['Inkanatural','Ingredientes peruanos','Perú'],
  ['Kitty Cosmetics','Accesorios coquette','Japón'],
  ['Clinique','Dermatología cosmética','Estados Unidos'],
  ['Clarins','Botánica de lujo','Francia'],
  ['Bioderma','Dermo-cosmética','Francia'],
  ['Eucerin','Cuidado médico de piel','Alemania'],
  ['Avène','Agua termal','Francia'],
  ['Vichy','Cosmética activa','Francia'],
  ['La Roche-Posay','Sensibilidad cutánea','Francia'],
  ['Kiehl\'s','Farmacia naturista','Estados Unidos'],
  ['Origins','Ingredientes naturales','Estados Unidos'],
  ['Skinceuticals','Ciencia cosmética','Estados Unidos'],
  ['Paula\'s Choice','Fórmulas sin irritantes','Estados Unidos'],
  ['The Ordinary','Activos directos','Canadá'],
  ['CeraVe','Barrera cutánea','Estados Unidos'],
  ['Neutrogena','Dermatología masiva','Estados Unidos'],
];

export const seedBrands = async () => {
  const results = [];
  for (let i = 0; i < 100; i++) {
    const [name, description, origin] = BRAND_BASES[i % BRAND_BASES.length];
    results.push(brandService.create({
      name: i < BRAND_BASES.length ? name : `${name} ${Math.floor(i / BRAND_BASES.length) + 1}`,
      description,
      origin,
    }));
  }
  await Promise.all(results);
};

// ─── UNIDADES (100) ─────────────────────────────────────────────────
const UNIT_BASES = [
  ['Mililitros','ml'],['Gramos','g'],['Unidades','und'],['Litros','L'],
  ['Onzas','oz'],['Kilogramos','kg'],['Centímetros','cm'],['Metros','m'],
  ['Piezas','pz'],['Paquetes','paq'],['Frascos','fco'],['Tubos','tbo'],
  ['Ampollas','amp'],['Sobres','sob'],['Cajas','cja'],['Rollos','rol'],
  ['Pares','par'],['Juegos','jgo'],['Sets','set'],['Bolsas','bol'],
];

export const seedUnits = async () => {
  const results = [];
  for (let i = 0; i < 100; i++) {
    const [name, abbreviation] = UNIT_BASES[i % UNIT_BASES.length];
    results.push(unitService.create({
      name: i < UNIT_BASES.length ? name : `${name} ${Math.floor(i / UNIT_BASES.length) + 1}`,
      abbreviation: i < UNIT_BASES.length ? abbreviation : `${abbreviation}${Math.floor(i / UNIT_BASES.length) + 1}`,
    }));
  }
  await Promise.all(results);
};

// ─── ÁREAS (100) ────────────────────────────────────────────────────
const AREA_PREFIXES = ['Sala','Cabina','Suite','Módulo','Box','Cuarto','Espacio'];
const AREA_NAMES = [
  'VIP Rosé','Sakura','Lavanda','Jade','Ámbar','Cristal','Diamante','Zafiro',
  'Esmeralda','Rubí','Perla','Coral','Turquesa','Ópalo','Topacio','Onix',
  'Malaquita','Amatista','Granate','Citrino',
];
const STATUSES: ('Disponible'|'Ocupado'|'Mantenimiento')[] = ['Disponible','Disponible','Disponible','Ocupado','Mantenimiento'];

export const seedAreas = async () => {
  const results = [];
  for (let i = 0; i < 100; i++) {
    results.push(areaService.create({
      name: `${pick(AREA_PREFIXES)} ${AREA_NAMES[i % AREA_NAMES.length]} ${i < AREA_NAMES.length ? '' : Math.floor(i / AREA_NAMES.length) + 1}`.trim(),
      capacity: rnd(1, 4),
      status: pick(STATUSES),
    }));
  }
  await Promise.all(results);
};

// ─── PROVEEDORES (100) ──────────────────────────────────────────────
const SUPPLIER_BASES = [
  'Distribuidora Belleza SAC','Cosméticos del Pacífico','Importaciones Glow EIRL',
  'ProSalud Dermocosméticos','Natura Distribuciones','BellezaPro Perú SAC',
  'Insumos Estéticos Lima','TreatMed Perú EIRL','DermaSupply SAC',
  'Corporación Estética Sur','MediBeauty Importaciones','GlowPro Distribuciones',
  'Salud & Belleza SAC','AromaPro Perú','KosmoPro EIRL',
];

export const seedSuppliers = async () => {
  const results = [];
  for (let i = 0; i < 100; i++) {
    const base = SUPPLIER_BASES[i % SUPPLIER_BASES.length];
    const suffix = i < SUPPLIER_BASES.length ? '' : ` ${Math.floor(i / SUPPLIER_BASES.length) + 1}`;
    const ruc = `20${String(500000000 + i).padStart(9,'0')}`;
    results.push(supplierService.create({
      name: `${base}${suffix}`,
      ruc,
      phone: `9${String(rnd(70000000,99999999))}`,
      email: `ventas${i}@${base.toLowerCase().replace(/[^a-z]/g,'')}.pe`,
    }));
  }
  await Promise.all(results);
};

// ─── SERVICIOS (100) ────────────────────────────────────────────────
const SERVICE_TEMPLATES = [
  ['Limpieza Facial Profunda','Faciales',85,60],
  ['Hidratación Facial Premium','Faciales',110,75],
  ['Tratamiento Anti-acné','Faciales',95,60],
  ['Facial Vitamina C','Faciales',130,90],
  ['Peeling Químico Suave','Faciales',150,60],
  ['Masaje Relajante Completo','Masajes',120,60],
  ['Masaje con Piedras Calientes','Masajes',160,90],
  ['Masaje Descontracturante','Masajes',100,45],
  ['Masaje Californiano','Masajes',140,75],
  ['Reflexología Podal','Masajes',80,45],
  ['Manicura Clásica','Manicura',35,30],
  ['Manicura Semipermanente','Manicura',65,60],
  ['Pedicura Spa','Pedicura',55,45],
  ['Nail Art Diseño','Manicura',45,45],
  ['Depilación Piernas Completas','Depilación',75,45],
  ['Depilación Axilas','Depilación',25,15],
  ['Depilación Bikini','Depilación',45,30],
  ['Exfoliación Corporal','Exfoliación',90,60],
  ['Envolvimiento Nutritivo','Envolvimientos',120,75],
  ['Extensión Pestañas Classic','Pestañas',100,90],
  ['Diseño y Perfilado de Cejas','Cejas',35,30],
  ['Tintura de Cejas','Cejas',45,30],
  ['Laminado de Cejas','Cejas',80,60],
  ['Lifting de Pestañas','Pestañas',90,75],
  ['Aromaterapia Facial','Aromaterapia',75,60],
  ['Drenaje Linfático Facial','Drenaje Linfático',110,60],
  ['Tratamiento Reafirmante','Reafirmante',140,75],
  ['Mascarilla Anti-edad','Anti-edad',120,60],
  ['Hidratación Corporal','Hidratación',100,60],
  ['Tratamiento Blanqueamiento','Blanqueamiento',160,90],
];

export const seedServices = async () => {
  const results = [];
  for (let i = 0; i < 100; i++) {
    const [name, category, basePrice, baseDuration] = SERVICE_TEMPLATES[i % SERVICE_TEMPLATES.length] as [string,string,number,number];
    const variant = Math.floor(i / SERVICE_TEMPLATES.length);
    results.push(serviceService.create({
      name: variant === 0 ? name : `${name} ${['Express','Premium','Deluxe','Pro','VIP'][variant - 1] || `V${variant}`}`,
      category,
      price: basePrice + (variant * 10),
      duration: baseDuration,
    }));
  }
  await Promise.all(results);
};

// ─── INVENTARIO (100) ───────────────────────────────────────────────
const INVENTORY_TEMPLATES = [
  ['Crema Hidratante Facial','Faciales','Dermalogica','ml',45,85],
  ['Sérum Vitamina C','Faciales','Glow Beauty','ml',60,110],
  ['Mascarilla de Arcilla','Faciales','Inkanatural','g',20,40],
  ['Aceite Masaje Relajante','Masajes','Natura','ml',35,65],
  ['Aceite Esencial Lavanda','Masajes','Inkanatural','ml',25,50],
  ['Gel Descongestivo','Masajes','Dermalogica','ml',30,55],
  ['Esmalte Semipermanente','Manicura','Kitty Cosmetics','und',12,25],
  ['Base Coat Uñas','Manicura','Kitty Cosmetics','und',10,20],
  ['Cera Depilatoria','Depilación',"L'Oréal Professionnel",'g',18,35],
  ['Tiras Depiladoras','Depilación',"L'Oréal Professionnel",'und',1,3],
  ['Exfoliante Corporal Sal','Tratamientos Corporales','Inkanatural','g',28,55],
  ['Mascarilla Corporal','Tratamientos Corporales','Natura','g',35,70],
  ['Pegamento Pestañas','Pestañas','Kitty Cosmetics','und',22,45],
  ['Extensiones Pestañas','Pestañas','Kitty Cosmetics','und',30,60],
  ['Loción Post-tratamiento','Tratamientos Corporales','Dermalogica','ml',40,75],
  ['Tónico Facial','Faciales','Clinique','ml',38,72],
  ['Contorno de Ojos','Faciales','Clarins','ml',55,100],
  ['Protector Solar SPF50','Faciales','Bioderma','ml',42,80],
  ['Limpiador Micelar','Faciales','Bioderma','ml',28,55],
  ['Crema Corporal Nutritiva','Tratamientos Corporales','Eucerin','ml',32,60],
];

export const seedInventory = async () => {
  const results = [];
  for (let i = 0; i < 100; i++) {
    const [name, category, brand, unit, cost, price] = INVENTORY_TEMPLATES[i % INVENTORY_TEMPLATES.length] as [string,string,string,string,number,number];
    const variant = Math.floor(i / INVENTORY_TEMPLATES.length);
    const variantLabel = ['','250ml','500ml','1L','Kit'][variant] || `V${variant}`;
    results.push(inventoryService.create({
      name: variant === 0 ? name : `${name} ${variantLabel}`,
      category,
      brand,
      unit,
      stock: rnd(10, 80),
      minStock: rnd(3, 10),
      cost: cost + (variant * 5),
      price: price + (variant * 10),
      lastUpdated: isoDate(rnd(0, 30)),
    }));
  }
  await Promise.all(results);
};

// ─── CLIENTES (100) ─────────────────────────────────────────────────
const FIRST_NAMES = [
  'Valeria','Luciana','Camila','Fernanda','Daniela','Alejandra','Gabriela',
  'Isabella','Natalia','Sofía','Mariana','Paola','Renata','Antonella','Valentina',
  'Claudia','Ximena','Ariana','Priscila','Michelle','Kristel','Esperanza',
  'Milagros','Brenda','Tatiana','Andrea','Karla','Diana','Mónica','Patricia',
  'Susana','Elena','Rosa','Carmen','Luz','Sara','Nadia','Cecilia','Rebeca','Alicia',
];
const LAST_NAMES = [
  'Quispe','Mendoza','Herrera','Castro','Rojas','Flores','Soto','Vargas','Reyes',
  'Paredes','Díaz','Gutiérrez','Morales','Ramírez','Ortiz','Navarro','Peña',
  'López','Torres','Cabrera','Aguirre','Villanueva','Fuentes','Salazar','Espinoza',
  'Mamani','Condori','Huanca','Ticona','Lazo','Apaza','Puma','Cruz','Llanos',
  'Chávez','Núñez','Cáceres','Quiñones','Medina','Ayala','Pinto','Ccopa','Turpo',
];
const STATUSES_CLIENT: ('VIP'|'Activo'|'Inactivo')[] = ['VIP','Activo','Activo','Activo','Activo','Inactivo'];

export const seedClients = async () => {
  const results = [];
  for (let i = 0; i < 100; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName1 = LAST_NAMES[i % LAST_NAMES.length];
    const lastName2 = LAST_NAMES[(i + 13) % LAST_NAMES.length];
    const name = `${firstName} ${lastName1} ${lastName2}`;
    results.push(clientService.create({
      name,
      dni: String(40000000 + i * 137).slice(0, 8),
      phone: `9${String(70000000 + i * 97).slice(0, 8)}`,
      email: `${firstName.toLowerCase()}.${lastName1.toLowerCase()}${i}@gmail.com`,
      status: pick(STATUSES_CLIENT),
    }));
  }
  await Promise.all(results);
};

// ─── FUNCIÓN MAESTRA ────────────────────────────────────────────────
export const runFullSeed = async () => {
  await seedCategories();
  await seedBrands();
  await seedUnits();
  await seedAreas();
  await seedSuppliers();
  await seedServices();
  await seedInventory();
  await seedClients();
};
