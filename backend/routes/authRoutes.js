import express from "express";
import jwt from "jsonwebtoken";
import { authenticateUser, registerUser, getUserById } from "../models/userModel.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authenticateUser(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role, user });
  } catch (e) {
    // return 400 for known validation errors (like duplicate user), otherwise 500
    if (e && e.message && e.message.toLowerCase().includes('user already exists')) {
      return res.status(400).json({ error: e.message });
    }
    res.status(500).json({ error: e.message });
  }
}); 

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await registerUser(name, email, password, role);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer\s+(.*)$/i);
    if (!m) return res.status(401).json({ error: 'Missing token' });
    const token = m[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(payload.id);
    res.json({ user });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
