import { getConnection } from './db.js';

export async function getUser(tgId) {
  const connection = await getConnection();
  try {
    const query = 'SELECT * FROM users WHERE tg_id = ?';
    const result = await connection.get(query, [tgId]);
    return result;
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    await connection.close();
  }
}

export async function createUser(tgId, tgUsername, tgFirstname, tgLastname, selectedModelKey) {
  console.log(tgId, tgUsername, tgFirstname, tgLastname, selectedModelKey);
  const connection = await getConnection();
  try {
    const query = `
      INSERT INTO
        users (tg_id, tg_username, tg_firstname, tg_lastname, selected_model_key, is_activated, is_admin)
      VALUES
        (?, ?, ?, ?, ?, ?, ?)
      `;
    const result = await connection.run(query, [tgId, tgUsername, tgFirstname, tgLastname, selectedModelKey, false, false]);
    return result.lastID;
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    await connection.close();
  }
}

export async function updateUserModel(tgId, selectedModelKey) {
  const connection = await getConnection();
  try {
    const query = 'UPDATE users SET selected_model_key = ? WHERE tg_id = ?';
    await connection.run(query, [selectedModelKey, tgId]);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    await connection.close();
  }
}

export async function getAdminUsers() {
  const connection = await getConnection();
  try {
    const query = 'SELECT * FROM users WHERE is_admin = 1';
    const result = await connection.all(query);
    return result;
  } catch (error) {
    console.error(error);
    return [];
  } finally {
    await connection.close();
  }
}
