import express from "express";
import cors from "cors";
import { initDB } from "./config/database.js";

import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import referenceRoutes from "./routes/referenceRoutes.js";

const app = express();
app.set('trust proxy', 1);

function getAllowedOrigins() {
  return String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
};

app.use(cors(corsOptions));
// Increase JSON body size to allow small image data-URLs when using the admin image upload.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

await initDB();
console.log("Database Connected");

// Routes
app.use("/products", productRoutes);
app.use("/sales", saleRoutes);
// expose auth under /auth (backwards compatible) and under /api (requested)
app.use("/auth", authRoutes);
app.use("/api", authRoutes);
app.use("/reports", reportRoutes);
app.use("/reference", referenceRoutes);

app.get("/", (req, res) => {
  res.send("Charlie PC Backend Running");
});

app.get("/health", (req, res) => {
  res.json({
    status: 'ok',
    service: 'charlie-pc-backend',
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: 'ok',
    service: 'charlie-pc-backend',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`Backend running on ${HOST}:${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set a different PORT env var or stop the process using that port.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});
