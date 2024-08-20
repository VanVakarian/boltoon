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

export async function dbGetUserStatistics(userId) {
  const connection = await getConnection();
  try {
    const query = `
      SELECT 
        COUNT(*) as totalRequests,
        COALESCE(SUM(req_cost), 0) as totalCost,
        COALESCE(AVG(req_cost), 0) as averageCost
      FROM token_history
      WHERE user_id = ?;
    `;
    const result = await connection.get(query, [userId]);
    return {
      totalRequests: result.totalRequests,
      totalCost: result.totalCost,
      averageCost: result.averageCost,
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    return {
      totalRequests: 0,
      totalCost: 0,
      averageCost: 0,
    };
  } finally {
    await connection.close();
  }
}
