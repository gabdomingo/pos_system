import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const LEGACY_ACCOUNT_MAPPINGS = [
  {
    legacyEmail: 'admin@local',
    email: 'admin@charliepc.ph',
    name: 'Admin',
    role: 'admin'
  },
  {
    legacyEmail: 'cashier@local',
    email: 'cashier@charliepc.ph',
    name: 'Cashier',
    role: 'cashier'
  },
  {
    legacyEmail: 'customer@local',
    email: 'customer@charliepc.ph',
    name: 'Customer',
    role: 'customer'
  }
];

export async function reconcileLegacyAccountEmails(db, mappings = LEGACY_ACCOUNT_MAPPINGS) {
  const actions = [];

  for (const mapping of mappings) {
    const legacy = await db.get(
      'SELECT id, name, role FROM users WHERE LOWER(email) = LOWER(?)',
      mapping.legacyEmail
    );
    if (!legacy) continue;

    const canonical = await db.get(
      'SELECT id, name, role FROM users WHERE LOWER(email) = LOWER(?)',
      mapping.email
    );

    if (canonical) {
      await db.run('UPDATE sales SET user_id = ? WHERE user_id = ?', canonical.id, legacy.id);
      await db.run('UPDATE users SET name = ?, role = ? WHERE id = ?', mapping.name, mapping.role, canonical.id);
      await db.run('DELETE FROM users WHERE id = ?', legacy.id);
      actions.push(`merged ${mapping.legacyEmail} into ${mapping.email}`);
      continue;
    }

    await db.run(
      'UPDATE users SET email = ?, name = ?, role = ? WHERE id = ?',
      mapping.email,
      mapping.name,
      mapping.role,
      legacy.id
    );
    actions.push(`renamed ${mapping.legacyEmail} to ${mapping.email}`);
  }

  return actions;
}

export async function upsertAccount(db, account) {
  const hashedPassword = await bcrypt.hash(account.password, SALT_ROUNDS);
  const existing = await db.get(
    'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
    account.email
  );

  if (existing) {
    await db.run(
      'UPDATE users SET name = ?, role = ?, password = ? WHERE id = ?',
      account.name,
      account.role,
      hashedPassword,
      existing.id
    );
    return `updated: ${account.email}`;
  }

  await db.run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    account.name,
    account.email,
    hashedPassword,
    account.role
  );
  return `created: ${account.email}`;
}

export async function upsertAccounts(db, accounts) {
  const results = [];
  for (const account of accounts) {
    results.push(await upsertAccount(db, account));
  }
  return results;
}
