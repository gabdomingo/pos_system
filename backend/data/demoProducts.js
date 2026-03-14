export const demoProducts = [
  {
    name: "AMD Ryzen 7 9700X",
    category: "Processor",
    price: 21950,
    stock: 8,
    barcode: "CPU-9700X-001",
    image: "https://images.pexels.com/photos/32300577/pexels-photo-32300577.jpeg?auto=compress&cs=tinysrgb&w=1200"
  },
  {
    name: "Intel Core i7 with Thermal Paste Kit",
    category: "Processor",
    price: 19850,
    stock: 6,
    barcode: "CPU-I7KIT-002",
    image: "https://images.pexels.com/photos/34353877/pexels-photo-34353877.jpeg?auto=compress&cs=tinysrgb&w=1200"
  },
  {
    name: "GIGABYTE X670E AORUS PRO",
    category: "Motherboard",
    price: 16990,
    stock: 5,
    barcode: "MB-X670E-003",
    image: "https://images.pexels.com/photos/33402765/pexels-photo-33402765.jpeg?auto=compress&cs=tinysrgb&w=1200"
  },
  {
    name: "ASRock B550M Steel Legend",
    category: "Motherboard",
    price: 7890,
    stock: 7,
    barcode: "MB-B550M-004",
    image: "https://images.pexels.com/photos/33798622/pexels-photo-33798622.jpeg?auto=compress&cs=tinysrgb&w=1200"
  },
  {
    name: "GeForce RTX 2080 Super",
    category: "Graphics Card",
    price: 23990,
    stock: 4,
    barcode: "GPU-2080S-005",
    image: "https://images.pexels.com/photos/18338417/pexels-photo-18338417.jpeg?auto=compress&cs=tinysrgb&w=1200"
  },
  {
    name: "XPG DDR5 32GB RGB Kit",
    category: "Memory",
    price: 6490,
    stock: 10,
    barcode: "RAM-DDR5-006",
    image: "https://images.pexels.com/photos/34338596/pexels-photo-34338596.jpeg?auto=compress&cs=tinysrgb&w=1200"
  },
  {
    name: "SanDisk Extreme Portable SSD 1TB",
    category: "SSD",
    price: 7990,
    stock: 9,
    barcode: "SSD-SDX-007",
    image: "https://images.pexels.com/photos/13595110/pexels-photo-13595110.jpeg?auto=compress&cs=tinysrgb&w=1200"
  },
  {
    name: "850W Gold Power Supply",
    category: "Power Supply",
    price: 6890,
    stock: 6,
    barcode: "PSU-850G-008",
    image: "https://images.pexels.com/photos/33402763/pexels-photo-33402763.jpeg?auto=compress&cs=tinysrgb&w=1200"
  },
  {
    name: "Tempered Glass ATX Case",
    category: "PC Case",
    price: 5290,
    stock: 5,
    barcode: "CASE-TG-009",
    image: "https://images.pexels.com/photos/33444592/pexels-photo-33444592.jpeg?auto=compress&cs=tinysrgb&w=1200"
  },
  {
    name: "Modern Work Laptop",
    category: "Laptops",
    price: 42990,
    stock: 3,
    barcode: "LAP-WORK-010",
    image: "https://images.pexels.com/photos/1263558/pexels-photo-1263558.jpeg?auto=compress&cs=tinysrgb&w=1200"
  }
];

const legacyDemoNames = ["Apple", "Banana", "Milk", "Bread", "Eggs"];
const legacyDemoBarcodes = ["0001", "0002", "0003", "0004", "0005"];

export async function cleanupLegacyDemoProducts(db) {
  const placeholders = await db.all(
    `SELECT id
     FROM products
     WHERE barcode IN (?, ?, ?, ?, ?)
        OR name IN (?, ?, ?, ?, ?)
        OR image LIKE ?`,
    ...legacyDemoBarcodes,
    ...legacyDemoNames,
    "https://via.placeholder.com/%"
  );

  for (const row of placeholders) {
    await db.run(`DELETE FROM products WHERE id = ?`, row.id);
  }

  return placeholders.length;
}

export async function seedDemoProducts(db) {
  let inserted = 0;
  let updated = 0;

  for (const product of demoProducts) {
    const existing = await db.get(
      `SELECT id FROM products WHERE barcode = ? OR name = ? LIMIT 1`,
      product.barcode,
      product.name
    );

    if (existing?.id) {
      await db.run(
        `UPDATE products
         SET category = ?, price = ?, stock = ?, barcode = ?, image = ?
         WHERE id = ?`,
        product.category,
        product.price,
        product.stock,
        product.barcode,
        product.image,
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
      product.image
    );
    inserted += 1;
  }

  return {
    inserted,
    updated,
    total: demoProducts.length
  };
}
