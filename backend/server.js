import express from "express";
import cors from "cors";
import { initDB } from "./config/database.js";

import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();
app.use(cors());
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

app.get("/", (req, res) => {
  res.send("POS Backend Running");
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set a different PORT env var or stop the process using that port.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});
