import { initDB } from '../config/database.js';
import { authenticateUser } from '../models/userModel.js';

try {
  await initDB();
  const user = await authenticateUser('admin@charliepc.ph', 'admin123');
  console.log('auth result:', user);
} catch (err) {
  console.error('test error:', err);
} finally {
  process.exit(0);
}
