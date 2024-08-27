import { getConnection } from './db.js';

export async function dbGetUser(tgId) {
  const connection = await getConnection();
  try {
    const query = `
      SELECT *
      FROM users
      WHERE tg_id = ?;
    `;
    const result = await connection.get(query, [tgId]);
    return result;
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    await connection.close();
  }
}

export async function dbUpdateUserModel(tgId, selectedModelKey) {
  const connection = await getConnection();
  try {
    const query = `
      UPDATE users
      SET selected_model_key = ?
      WHERE tg_id = ?;
    `;
    await connection.run(query, [selectedModelKey, tgId]);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    await connection.close();
  }
}

export async function dbGetAdminUsers() {
  const connection = await getConnection();
  try {
    const query = `
      SELECT *
      FROM users
      WHERE is_admin = 1;
    `;
    const result = await connection.all(query);
    return result;
  } catch (error) {
    console.error(error);
    return [];
  } finally {
    await connection.close();
  }
}

export async function dbGetAllUsers() {
  const connection = await getConnection();
  try {
    const query = `
      SELECT *
      FROM users;
    `;
    const result = await connection.all(query);
    return result;
  } catch (error) {
    console.error(error);
    return [];
  } finally {
    await connection.close();
  }
}
