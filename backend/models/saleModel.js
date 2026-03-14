import { getDB } from "../config/database.js";
import { isValidPhilippinePhone, isValidStandardEmail, normalizeEmail, normalizePhilippinePhone } from "../utils/inputValidation.js";

function roundMoney(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function normalizeText(value, maxLength = 255) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeDiscountType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "%" || raw === "percent" || raw === "percentage") return "%";
  return "fixed";
}

function normalizeTaxRate(value) {
  let rate = Number(value || 0);
  if (!Number.isFinite(rate) || rate < 0) return 0;
  if (rate > 1) rate = rate / 100;
  return Math.min(rate, 1);
}

function normalizePaymentMethod(value, saleChannel) {
  const raw = String(value || "").trim().toLowerCase();
  const aliases = {
    cash: "Cash",
    card: "Card",
    gcash: "GCash",
    "e-wallet": "GCash",
    online: saleChannel === "online" ? "Card" : "GCash",
    "cash on delivery": "Cash on Delivery",
    cod: "Cash on Delivery"
  };
  const normalized = raw ? aliases[raw] : (saleChannel === "pos" ? "Cash" : "Card");
  const allowed = saleChannel === "pos"
    ? ["Cash", "Card", "GCash"]
    : ["Card", "GCash", "Cash on Delivery"];
  return allowed.includes(normalized) ? normalized : null;
}

function normalizeFulfillmentType(value, saleChannel) {
  if (saleChannel === "pos") return "in-store";
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "delivery";
  if (["delivery", "ship", "shipping"].includes(raw)) return "delivery";
  if (["pickup", "pick-up", "pick up", "store pickup", "store-pickup"].includes(raw)) return "pickup";
  return null;
}

function normalizeSaleChannel(value, user) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "pos" || raw === "online") return raw;
  if (user && (user.role === "admin" || user.role === "cashier")) return "pos";
  return "online";
}

function makeReceiptNumber(createdAt, saleId) {
  const d = new Date(createdAt || Date.now());
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `RCPT-${year}${month}${day}-${String(saleId || 0).padStart(6, "0")}`;
}

function normalizeSaleRow(row) {
  if (!row) return null;
  const createdAt = row.createdAt || row.created_at || null;
  const receiptNumber = row.receipt_number || row.receiptNumber || makeReceiptNumber(createdAt, row.id);
  const subtotal = roundMoney(row.subtotal ?? row.total ?? 0);
  const discountValue = roundMoney(row.discount_value ?? row.discountValue ?? 0);
  const discountAmount = roundMoney(row.discount_amount ?? row.discountAmount ?? 0);
  const taxRate = normalizeTaxRate(row.tax_rate ?? row.taxRate ?? 0);
  const taxAmount = roundMoney(row.tax_amount ?? row.taxAmount ?? 0);
  const total = roundMoney(row.total ?? 0);
  const amountTendered = roundMoney(row.amount_tendered ?? row.amountTendered ?? total);
  const changeAmount = roundMoney(row.change_amount ?? row.changeAmount ?? 0);
  const status = row.status || "completed";
  const saleChannel = row.sale_channel || row.saleChannel || "pos";
  const cashier = row.cashier || row.cashier_name || row.name || null;
  const fulfillmentType = row.fulfillment_type || row.fulfillmentType || (saleChannel === "online" ? "delivery" : "in-store");
  const customerName = row.customer_name || row.customerName || "";
  const customerPhone = row.customer_phone || row.customerPhone || "";
  const customerEmail = row.customer_email || row.customerEmail || "";
  const deliveryAddress = row.delivery_address || row.deliveryAddress || "";
  const paymentReference = row.payment_reference || row.paymentReference || "";
  const paymentLast4 = row.payment_last4 || row.paymentLast4 || "";

  return {
    ...row,
    createdAt,
    receiptNumber,
    receipt_number: receiptNumber,
    subtotal,
    discountValue,
    discount_value: discountValue,
    discountAmount,
    discount_amount: discountAmount,
    discountType: row.discount_type || row.discountType || "fixed",
    discount_type: row.discount_type || row.discountType || "fixed",
    taxRate,
    tax_rate: taxRate,
    taxAmount,
    tax_amount: taxAmount,
    total,
    amountTendered,
    amount_tendered: amountTendered,
    changeAmount,
    change_amount: changeAmount,
    status,
    saleChannel,
    sale_channel: saleChannel,
    cashier,
    fulfillmentType,
    fulfillment_type: fulfillmentType,
    customerName,
    customer_name: customerName,
    customerPhone,
    customer_phone: customerPhone,
    customerEmail,
    customer_email: customerEmail,
    deliveryAddress,
    delivery_address: deliveryAddress,
    paymentReference,
    payment_reference: paymentReference,
    paymentLast4,
    payment_last4: paymentLast4
  };
}

function normalizeSaleItemRow(row) {
  if (!row) return null;
  const quantity = Number(row.quantity || 0);
  const price = roundMoney(row.price || 0);
  const lineTotal = roundMoney(row.line_total ?? row.lineTotal ?? quantity * price);
  const productName = row.product_name || row.productName || (row.product_id != null ? `Product #${row.product_id}` : "Unknown Product");

  return {
    ...row,
    quantity,
    price,
    lineTotal,
    line_total: lineTotal,
    productName,
    product_name: productName
  };
}

async function fetchSaleWithMeta(db, id) {
  const sale = await db.get(
    `SELECT s.*, u.name AS cashier_name
     FROM sales s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`,
    id
  );
  return normalizeSaleRow(sale);
}

async function fetchSaleItems(db, saleId) {
  const items = await db.all(
    `SELECT si.*, COALESCE(NULLIF(si.product_name, ''), p.name) AS product_name
     FROM sale_items si
     LEFT JOIN products p ON p.id = si.product_id
     WHERE si.sale_id = ?
     ORDER BY si.id ASC`,
    saleId
  );
  return items.map(normalizeSaleItemRow);
}

export async function createSale(req, res) {
  const db = getDB();
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

  if (rawItems.length === 0) {
    return res.status(400).json({ error: "No items provided" });
  }

  const saleChannel = normalizeSaleChannel(req.body?.saleChannel || req.body?.sale_channel, req.user);
  const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod || req.body?.payment_method, saleChannel);
  const discountType = normalizeDiscountType(req.body?.discountType || req.body?.discount_type);
  const discountValue = Math.max(0, Number(req.body?.discountValue ?? req.body?.discount_value ?? 0) || 0);
  const taxRate = normalizeTaxRate(req.body?.taxRate ?? req.body?.tax_rate ?? 0);
  const requestedTendered = roundMoney(req.body?.amountTendered ?? req.body?.amount_tendered ?? 0);
  const fulfillmentType = normalizeFulfillmentType(req.body?.fulfillmentType || req.body?.fulfillment_type, saleChannel);
  const customerName = normalizeText(req.body?.customerName || req.body?.customer_name, 120);
  const customerPhone = normalizePhilippinePhone(req.body?.customerPhone || req.body?.customer_phone);
  const customerEmail = normalizeEmail(req.body?.customerEmail || req.body?.customer_email);
  const deliveryAddress = normalizeText(req.body?.deliveryAddress || req.body?.delivery_address, 240);
  const paymentReference = normalizeText(req.body?.paymentReference || req.body?.payment_reference, 80);
  const paymentLast4 = digitsOnly(req.body?.cardNumber || req.body?.card_number || req.body?.paymentLast4 || req.body?.payment_last4 || "").slice(-4);
  if (saleChannel === "pos" && (!req.user || !["admin", "cashier"].includes(req.user.role))) {
    return res.status(403).json({ error: "In-store checkout requires admin or cashier login" });
  }
  if (saleChannel === "online" && (!req.user || req.user.role !== "customer")) {
    return res.status(403).json({ error: "Online cart checkout requires a customer login" });
  }
  if (!paymentMethod) {
    return res.status(400).json({ error: "Unsupported payment method" });
  }
  if (!fulfillmentType) {
    return res.status(400).json({ error: "Unsupported fulfillment type" });
  }
  if (saleChannel !== "pos" && paymentMethod.toLowerCase() === "cash") {
    return res.status(400).json({ error: "Cash tendering is only available for in-store checkout" });
  }
  if (saleChannel === "online") {
    if (!customerName) {
      return res.status(400).json({ error: "Customer name is required" });
    }
    if (!isValidPhilippinePhone(customerPhone)) {
      return res.status(400).json({ error: "Please enter a valid Philippine mobile number" });
    }
    if (customerEmail && !isValidStandardEmail(customerEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    if (fulfillmentType === "delivery" && !deliveryAddress) {
      return res.status(400).json({ error: "Delivery address is required" });
    }
    if (paymentMethod === "Cash on Delivery" && fulfillmentType !== "delivery") {
      return res.status(400).json({ error: "Cash on Delivery is only available for delivery orders" });
    }
    if (paymentMethod === "GCash" && !paymentReference) {
      return res.status(400).json({ error: "GCash reference is required" });
    }
    if (paymentMethod === "Card" && paymentLast4.length !== 4) {
      return res.status(400).json({ error: "Card details are incomplete" });
    }
  }

  const normalizedCart = rawItems.map((item) => ({
    id: Number(item?.id),
    quantity: Number(item?.quantity)
  }));

  for (const item of normalizedCart) {
    if (!Number.isInteger(item.id) || item.id <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({ error: "Invalid item quantities" });
    }
  }

  await db.run("BEGIN IMMEDIATE TRANSACTION");

  try {
    const productIds = [...new Set(normalizedCart.map((item) => item.id))];
    const placeholders = productIds.map(() => "?").join(", ");
    const productRows = await db.all(
      `SELECT id, name, price, stock FROM products WHERE id IN (${placeholders})`,
      ...productIds
    );
    const productMap = new Map(productRows.map((product) => [Number(product.id), product]));
    const receiptItems = [];

    for (const item of normalizedCart) {
      const product = productMap.get(item.id);
      if (!product) {
        throw createHttpError(400, `Product #${item.id} not found`);
      }
      if (Number(product.stock || 0) < item.quantity) {
        throw createHttpError(400, `Insufficient stock for ${product.name}`);
      }

      const unitPrice = roundMoney(product.price);
      const lineTotal = roundMoney(unitPrice * item.quantity);
      receiptItems.push({
        productId: product.id,
        product_id: product.id,
        productName: product.name,
        product_name: product.name,
        quantity: item.quantity,
        price: unitPrice,
        lineTotal,
        line_total: lineTotal
      });
    }

    const subtotal = roundMoney(receiptItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const rawDiscountAmount = discountType === "%"
      ? subtotal * Math.min(discountValue, 100) / 100
      : discountValue;
    const discountAmount = roundMoney(Math.min(subtotal, Math.max(0, rawDiscountAmount)));
    const taxableBase = roundMoney(Math.max(0, subtotal - discountAmount));
    const taxAmount = roundMoney(taxableBase * taxRate);
    const total = roundMoney(taxableBase + taxAmount);

    let amountTendered = requestedTendered;
    let changeAmount = 0;
    if (paymentMethod.toLowerCase() === "cash" && saleChannel === "pos") {
      if (amountTendered < total) {
        throw createHttpError(400, "Insufficient cash received");
      }
      changeAmount = roundMoney(amountTendered - total);
    } else if (paymentMethod === "Cash on Delivery") {
      amountTendered = 0;
    } else {
      amountTendered = total;
    }

    const createdAt = new Date().toISOString();
    const userId = req.user ? req.user.id : null;
    const insertResult = await db.run(
      `INSERT INTO sales (
        total, subtotal, paymentMethod, receipt_number, createdAt, user_id,
        discount_type, discount_value, discount_amount,
        tax_rate, tax_amount, amount_tendered, change_amount,
        status, sale_channel, fulfillment_type,
        customer_name, customer_phone, customer_email,
        delivery_address, payment_reference, payment_last4
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      total,
      subtotal,
      paymentMethod,
      "",
      createdAt,
      userId,
      discountType,
      roundMoney(discountValue),
      discountAmount,
      taxRate,
      taxAmount,
      amountTendered,
      changeAmount,
      "completed",
      saleChannel,
      fulfillmentType,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      paymentReference,
      paymentLast4
    );
    const saleId = insertResult.lastID || (insertResult.stmt && insertResult.stmt.lastID) || null;
    const receiptNumber = makeReceiptNumber(createdAt, saleId);

    await db.run(`UPDATE sales SET receipt_number = ? WHERE id = ?`, receiptNumber, saleId);

    for (const item of receiptItems) {
      await db.run(
        `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        saleId,
        item.productId,
        item.productName,
        item.quantity,
        item.price,
        item.lineTotal
      );

      await db.run(
        `UPDATE products SET stock = stock - ? WHERE id = ?`,
        item.quantity,
        item.productId
      );
    }

    await db.run("COMMIT");

    const sale = await fetchSaleWithMeta(db, saleId);
    const items = await fetchSaleItems(db, saleId);

    return res.json({
      saleId,
      receiptNumber,
      receipt: {
        ...sale,
        items
      }
    });
  } catch (err) {
    await db.run("ROLLBACK");
    const statusCode = err.statusCode || 500;
    console.error("createSale error:", err);
    return res.status(statusCode).json({ error: err.message || "Checkout failed" });
  }
}

export async function listSales(req, res) {
  try {
    const db = getDB();
    const { start, end } = req.query;
    const params = [];
    const where = [];

    if (start && end) {
      where.push(`datetime(s.createdAt) BETWEEN datetime(?) AND datetime(?)`);
      params.push(start, end);
    } else if (start) {
      where.push(`datetime(s.createdAt) >= datetime(?)`);
      params.push(start);
    } else if (end) {
      where.push(`datetime(s.createdAt) <= datetime(?)`);
      params.push(end);
    }

    const sales = await db.all(
      `SELECT s.*, u.name AS cashier_name,
              (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS items_count
       FROM sales s
       LEFT JOIN users u ON u.id = s.user_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY s.id DESC`,
      ...params
    );

    res.json(sales.map(normalizeSaleRow));
  } catch (err) {
    console.error("listSales error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getSale(req, res) {
  try {
    const db = getDB();
    const { id } = req.params;
    const sale = await fetchSaleWithMeta(db, id);
    if (!sale) return res.status(404).json({ error: "Not found" });
    const items = await fetchSaleItems(db, id);
    res.json({ ...sale, items });
  } catch (err) {
    console.error("getSale error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function voidSale(req, res) {
  const db = getDB();
  try {
    const { id } = req.params;
    const sale = await fetchSaleWithMeta(db, id);
    if (!sale) return res.status(404).json({ error: "Not found" });
    if ((sale.status || "completed").toLowerCase() === "voided") {
      return res.status(400).json({ error: "Sale already voided" });
    }

    const items = await fetchSaleItems(db, id);
    await db.run("BEGIN IMMEDIATE TRANSACTION");
    try {
      for (const item of items) {
        await db.run(
          `UPDATE products SET stock = stock + ? WHERE id = ?`,
          item.quantity,
          item.product_id
        );
      }

      await db.run(
        `UPDATE sales SET status = ?, voidedAt = ? WHERE id = ?`,
        "voided",
        new Date().toISOString(),
        id
      );

      await db.run("COMMIT");
      const updated = await fetchSaleWithMeta(db, id);
      res.json({ success: true, sale: updated });
    } catch (e) {
      await db.run("ROLLBACK");
      throw e;
    }
  } catch (err) {
    console.error("voidSale error:", err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}
