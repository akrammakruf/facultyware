const bcrypt = require('bcryptjs');
const db = require('../lib/db');

async function createAdmin() {

  const password =
    await bcrypt.hash('admin123', 10);

  await db.query(
    `
    INSERT INTO users
    (name,email,password)
    VALUES
    (?,?,?)
    `,
    [
      'Administrator',
      'admin@admin.com',
      password
    ]
  );

  console.log('Admin berhasil dibuat');

  process.exit();
}

createAdmin();