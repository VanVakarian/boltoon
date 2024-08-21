import { getConnection } from './db.js';

export async function dbStoreCost(userId, requestTs, reqCost) {
  const connection = await getConnection();
  try {
    const query = `
      INSERT INTO token_history (user_id, req_ts, req_cost)
      VALUES (?, ?, ?);
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

export async function dbGetUserStatistics(userId, startDate, endDate) {
  const connection = await getConnection();
  try {
    const query = `
      SELECT req_ts, req_cost
      FROM token_history
      WHERE user_id = ? AND req_ts BETWEEN ? AND ?
      ORDER BY req_ts;
    `;
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    const results = await connection.all(query, [userId, startTimestamp, endTimestamp]);
    return results;
  } catch (error) {
    console.error('Error getting user statistics:', error);
    return [];
  } finally {
    await connection.close();
  }
}
