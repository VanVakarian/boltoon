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
  }
}

export async function createUser(tgId, tgUsername, tgFirstname, tgLastname, selectedModel) {
  console.log(tgId, tgUsername, tgFirstname, tgLastname, selectedModel);
  const connection = await getConnection();
  try {
    const query = `
      INSERT INTO
        users (tg_id, tg_username, tg_firstname, tg_lastname, selected_model, is_activated, is_admin)
      VALUES
        (?, ?, ?, ?, ?, ?, ?)
      `;
    const result = await connection.run(query, [tgId, tgUsername, tgFirstname, tgLastname, selectedModel, false, false]);
    return result.lastID;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function updateUserModel(tgId, selectedModel) {
  const connection = await getConnection();
  try {
    const query = 'UPDATE users SET selected_model = ? WHERE tg_id = ?';
    await connection.run(query, [selectedModel, tgId]);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
