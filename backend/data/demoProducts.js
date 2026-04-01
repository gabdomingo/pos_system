const picsum = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/900`;

export const PRODUCT_CATEGORIES = [
  'Accessories',
  'Graphics Card',
  'Laptops',
  'Memory',
  'Monitor',
  'Motherboard',
  'PC Case',
  'Power Supply',
  'Processor',
  'SSD'
];

const EXPECTED_ITEMS_PER_CATEGORY = 5;

const CATEGORY_IMAGE_POOLS = {
  Accessories: [
    picsum('charliepc-accessories-1'),
    picsum('charliepc-accessories-2'),
    picsum('charliepc-accessories-3')
  ],
  'Graphics Card': [
    'https://images.pexels.com/photos/18338417/pexels-photo-18338417.jpeg?auto=compress&cs=tinysrgb&w=1200',
    picsum('charliepc-gpu-2'),
    picsum('charliepc-gpu-3')
  ],
  Laptops: [
    'https://images.pexels.com/photos/1263558/pexels-photo-1263558.jpeg?auto=compress&cs=tinysrgb&w=1200',
    picsum('charliepc-laptop-2'),
    picsum('charliepc-laptop-3')
  ],
  Memory: [
    'https://images.pexels.com/photos/34338596/pexels-photo-34338596.jpeg?auto=compress&cs=tinysrgb&w=1200',
    picsum('charliepc-memory-2'),
    picsum('charliepc-memory-3')
  ],
  Monitor: [
    picsum('charliepc-monitor-1'),
    picsum('charliepc-monitor-2'),
    picsum('charliepc-monitor-3')
  ],
  Motherboard: [
    'https://images.pexels.com/photos/33402765/pexels-photo-33402765.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/33798622/pexels-photo-33798622.jpeg?auto=compress&cs=tinysrgb&w=1200',
    picsum('charliepc-motherboard-3')
  ],
  'PC Case': [
    'https://images.pexels.com/photos/33444592/pexels-photo-33444592.jpeg?auto=compress&cs=tinysrgb&w=1200',
    picsum('charliepc-case-2'),
    picsum('charliepc-case-3')
  ],
  'Power Supply': [
    'https://images.pexels.com/photos/33402763/pexels-photo-33402763.jpeg?auto=compress&cs=tinysrgb&w=1200',
    picsum('charliepc-psu-2'),
    picsum('charliepc-psu-3')
  ],
  Processor: [
    'https://images.pexels.com/photos/32300577/pexels-photo-32300577.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/34353877/pexels-photo-34353877.jpeg?auto=compress&cs=tinysrgb&w=1200',
    picsum('charliepc-processor-3')
  ],
  SSD: [
    'https://images.pexels.com/photos/13595110/pexels-photo-13595110.jpeg?auto=compress&cs=tinysrgb&w=1200',
    picsum('charliepc-ssd-2'),
    picsum('charliepc-ssd-3')
  ]
};

const CATEGORY_SEED_ITEMS = {
  Accessories: [
    { name: 'Attack Shark Wireless Mouse', price: 1490, stock: 12, barcode: 'ACC-MOUSE-001' },
    { name: 'Redragon Mechanical Keyboard', price: 2290, stock: 10, barcode: 'ACC-KEYBOARD-002' },
    { name: 'Logitech HD Webcam', price: 1890, stock: 8, barcode: 'ACC-WEBCAM-003' },
    { name: 'HyperX Cloud Stinger Headset', price: 2590, stock: 9, barcode: 'ACC-HEADSET-004' },
    { name: 'Large RGB Mouse Pad', price: 690, stock: 15, barcode: 'ACC-MOUSEPAD-005' }
  ],
  'Graphics Card': [
    { name: 'GeForce RTX 4060 8GB', price: 21990, stock: 5, barcode: 'GPU-4060-001' },
    { name: 'GeForce RTX 4070 Super', price: 39990, stock: 3, barcode: 'GPU-4070S-002' },
    { name: 'Radeon RX 7600 8GB', price: 18990, stock: 4, barcode: 'GPU-RX7600-003' },
    { name: 'Radeon RX 7700 XT', price: 29990, stock: 2, barcode: 'GPU-RX7700XT-004' },
    { name: 'GeForce RTX 3060 12GB', price: 17990, stock: 6, barcode: 'GPU-3060-005' }
  ],
  Laptops: [
    { name: 'Modern Work Laptop', price: 42990, stock: 3, barcode: 'LAP-WORK-001' },
    { name: 'ASUS TUF A15 Gaming Laptop', price: 58990, stock: 2, barcode: 'LAP-TUFA15-002' },
    { name: 'Lenovo IdeaPad Slim 5', price: 44990, stock: 4, barcode: 'LAP-IDEAPAD-003' },
    { name: 'Acer Nitro V 15', price: 51990, stock: 3, barcode: 'LAP-NITROV-004' },
    { name: 'HP Victus 16', price: 54990, stock: 2, barcode: 'LAP-VICTUS-005' }
  ],
  Memory: [
    { name: 'XPG DDR5 32GB RGB Kit', price: 6490, stock: 10, barcode: 'RAM-DDR5-001' },
    { name: 'Corsair Vengeance DDR5 32GB', price: 6790, stock: 7, barcode: 'RAM-CORSAIR-002' },
    { name: 'Kingston Fury Beast DDR4 16GB', price: 3290, stock: 14, barcode: 'RAM-KINGSTON-003' },
    { name: 'Teamgroup T-Force Delta RGB 32GB', price: 5990, stock: 8, barcode: 'RAM-TFORCE-004' },
    { name: 'Crucial Pro DDR5 16GB', price: 3890, stock: 11, barcode: 'RAM-CRUCIAL-005' }
  ],
  Monitor: [
    { name: '24-inch IPS Full HD Monitor', price: 6990, stock: 7, barcode: 'MON-24IPS-001' },
    { name: '27-inch QHD Productivity Monitor', price: 12990, stock: 5, barcode: 'MON-27QHD-002' },
    { name: '27-inch 165Hz Gaming Monitor', price: 14990, stock: 4, barcode: 'MON-27GAMING-003' },
    { name: '32-inch Curved Monitor', price: 16990, stock: 3, barcode: 'MON-32CURVE-004' },
    { name: '22-inch Office Monitor', price: 4990, stock: 6, barcode: 'MON-22OFFICE-005' }
  ],
  Motherboard: [
    { name: 'GIGABYTE X670E AORUS PRO', price: 16990, stock: 5, barcode: 'MB-X670E-001' },
    { name: 'ASRock B550M Steel Legend', price: 7890, stock: 7, barcode: 'MB-B550M-002' },
    { name: 'MSI B760 Gaming Plus WiFi', price: 11290, stock: 5, barcode: 'MB-B760-003' },
    { name: 'ASUS TUF Gaming B650M-Plus', price: 12490, stock: 4, barcode: 'MB-B650M-004' },
    { name: 'GIGABYTE H610M H V2', price: 4990, stock: 9, barcode: 'MB-H610M-005' }
  ],
  'PC Case': [
    { name: 'Tempered Glass ATX Case', price: 5290, stock: 5, barcode: 'CASE-ATX-001' },
    { name: 'NZXT H5 Flow', price: 6190, stock: 4, barcode: 'CASE-NZXT-002' },
    { name: 'Montech Air 903 Max', price: 4890, stock: 6, barcode: 'CASE-MONTECH-003' },
    { name: 'DeepCool CH370', price: 3590, stock: 7, barcode: 'CASE-DEEPCOOL-004' },
    { name: 'Lian Li Lancool 216', price: 6990, stock: 3, barcode: 'CASE-LIANLI-005' }
  ],
  'Power Supply': [
    { name: '850W Gold Power Supply', price: 6890, stock: 6, barcode: 'PSU-850G-001' },
    { name: 'Corsair RM750e', price: 6290, stock: 5, barcode: 'PSU-RM750E-002' },
    { name: 'MSI MAG A650BN', price: 3390, stock: 10, barcode: 'PSU-A650BN-003' },
    { name: 'Cooler Master MWE 750 Gold', price: 5890, stock: 4, barcode: 'PSU-MWE750-004' },
    { name: 'Seasonic Focus GX-650', price: 6090, stock: 5, barcode: 'PSU-GX650-005' }
  ],
  Processor: [
    { name: 'AMD Ryzen 7 9700X', price: 21950, stock: 8, barcode: 'CPU-9700X-001' },
    { name: 'Intel Core i7-14700', price: 24890, stock: 5, barcode: 'CPU-I7-14700-002' },
    { name: 'AMD Ryzen 5 7600', price: 13990, stock: 9, barcode: 'CPU-R57600-003' },
    { name: 'Intel Core i5-14400F', price: 11690, stock: 8, barcode: 'CPU-I5-14400F-004' },
    { name: 'AMD Ryzen 9 7900X', price: 27990, stock: 4, barcode: 'CPU-R97900X-005' }
  ],
  SSD: [
    { name: 'SanDisk Extreme Portable SSD 1TB', price: 7990, stock: 9, barcode: 'SSD-SDX-001' },
    { name: 'Samsung 990 EVO 1TB', price: 6890, stock: 7, barcode: 'SSD-990EVO-002' },
    { name: 'WD Blue SN580 1TB', price: 4590, stock: 12, barcode: 'SSD-SN580-003' },
    { name: 'Crucial P3 Plus 500GB', price: 3190, stock: 10, barcode: 'SSD-P3PLUS-004' },
    { name: 'Kingston NV2 1TB', price: 3990, stock: 11, barcode: 'SSD-NV2-005' }
  ]
};

function buildSeedCounts() {
  return PRODUCT_CATEGORIES.reduce((summary, category) => {
    summary[category] = Array.isArray(CATEGORY_SEED_ITEMS[category]) ? CATEGORY_SEED_ITEMS[category].length : 0;
    return summary;
  }, {});
}

function validateSeedCatalog() {
  const invalidCategory = PRODUCT_CATEGORIES.find(
    (category) => (CATEGORY_SEED_ITEMS[category] || []).length !== EXPECTED_ITEMS_PER_CATEGORY
  );

  if (!invalidCategory) {
    return;
  }

  const actualCount = (CATEGORY_SEED_ITEMS[invalidCategory] || []).length;
  throw new Error(
    `Seed catalog mismatch: "${invalidCategory}" has ${actualCount} items. Expected ${EXPECTED_ITEMS_PER_CATEGORY} products per category.`
  );
}

validateSeedCatalog();

export const demoProducts = PRODUCT_CATEGORIES.flatMap((category) => (
  CATEGORY_SEED_ITEMS[category].map((product) => ({
    ...product,
    category,
    image: resolveProductImage({ category, seed: product.barcode || product.name })
  }))
));

const legacyDemoNames = ['Apple', 'Banana', 'Milk', 'Bread', 'Eggs'];
const legacyDemoBarcodes = ['0001', '0002', '0003', '0004', '0005'];

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hashSeed(seed) {
  const input = cleanString(seed) || 'charliepc';
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function sanitizeCategory(value) {
  const next = cleanString(value);
  if (!next) return '';
  const match = PRODUCT_CATEGORIES.find((category) => category.toLowerCase() === next.toLowerCase());
  return match || '';
}

export function resolveProductImage({ category, image, seed = '', existingImage = '', previousCategory = '' } = {}) {
  const providedImage = cleanString(image);
  if (providedImage) return providedImage;

  const normalizedCategory = sanitizeCategory(category) || 'Accessories';
  const normalizedPreviousCategory = sanitizeCategory(previousCategory);
  const keptImage = cleanString(existingImage);

  if (keptImage && normalizedPreviousCategory === normalizedCategory) {
    return keptImage;
  }

  const pool = CATEGORY_IMAGE_POOLS[normalizedCategory] || CATEGORY_IMAGE_POOLS.Accessories;
  const index = hashSeed(seed || keptImage || normalizedCategory) % pool.length;
  return pool[index];
}

export async function cleanupLegacyDemoProducts(db) {
  const placeholders = await db.all(
    `SELECT id
     FROM products
     WHERE barcode IN (?, ?, ?, ?, ?)
        OR name IN (?, ?, ?, ?, ?)
        OR image LIKE ?`,
    ...legacyDemoBarcodes,
    ...legacyDemoNames,
    'https://via.placeholder.com/%'
  );

  for (const row of placeholders) {
    await db.run(`DELETE FROM products WHERE id = ?`, row.id);
  }

  return placeholders.length;
}

export async function cleanupProductsWithoutPhotos(db) {
  const missingPhotos = await db.all(
    `SELECT id
     FROM products
     WHERE image IS NULL
        OR TRIM(image) = ''`
  );

  for (const row of missingPhotos) {
    await db.run(`DELETE FROM products WHERE id = ?`, row.id);
  }

  return missingPhotos.length;
}

export async function seedDemoProducts(db) {
  let inserted = 0;
  let updated = 0;
  let removedStale = 0;
  const allowedNames = new Set(demoProducts.map((product) => product.name));
  const allowedBarcodes = new Set(demoProducts.map((product) => product.barcode).filter(Boolean));

  const placeholders = PRODUCT_CATEGORIES.map(() => '?').join(', ');
  const existingManagedProducts = await db.all(
    `SELECT id, name, barcode
     FROM products
     WHERE category IN (${placeholders})`,
    ...PRODUCT_CATEGORIES
  );

  for (const row of existingManagedProducts) {
    const hasAllowedBarcode = row.barcode && allowedBarcodes.has(row.barcode);
    const hasAllowedName = allowedNames.has(row.name);
    if (hasAllowedBarcode || hasAllowedName) continue;

    await db.run(`DELETE FROM products WHERE id = ?`, row.id);
    removedStale += 1;
  }

  for (const product of demoProducts) {
    const existing = await db.get(
      `SELECT id, image, category FROM products WHERE barcode = ? OR name = ? LIMIT 1`,
      product.barcode,
      product.name
    );

    const image = resolveProductImage({
      category: product.category,
      image: product.image,
      seed: product.barcode || product.name,
      existingImage: existing?.image || '',
      previousCategory: existing?.category || ''
    });

    if (existing?.id) {
      await db.run(
        `UPDATE products
         SET category = ?, price = ?, stock = ?, barcode = ?, image = ?
         WHERE id = ?`,
        product.category,
        product.price,
        product.stock,
        product.barcode,
        image,
        existing.id
      );
      updated += 1;
      continue;
    }

    await db.run(
      `INSERT INTO products (name, category, price, stock, barcode, image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      product.name,
      product.category,
      product.price,
      product.stock,
      product.barcode,
      image
    );
    inserted += 1;
  }

  return {
    inserted,
    updated,
    removedStale,
    total: demoProducts.length,
    categories: PRODUCT_CATEGORIES.length,
    itemsPerCategory: EXPECTED_ITEMS_PER_CATEGORY,
    categoryCounts: buildSeedCounts()
  };
}
