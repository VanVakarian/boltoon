import { getConnection } from './db.js';

export async function dbStoreCost(userId, requestTs, reqCost) {
  const connection = await getConnection();
  try {
    const query = `
      INSERT INTO
        token_history (user_id, req_ts, req_cost)
      VALUES
        (?, ?, ?);
    `;
    await connection.run(query, [userId, requestTs, reqCost]);
    return true;
  } catch (error) {
    console.error('Error adding request cost history:', error);
    return false;
  } finally {
    await connection.close();
  }
}
