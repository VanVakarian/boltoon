import { getConnection } from './db.js';
import { EXCHANGE_API_ID } from '../const.js';

export async function dbGetLastRequestTime() {
  const connection = await getConnection();
  try {
    const query = `
      SELECT last_request_time
      FROM currency_requests_timeout
      WHERE api_id = ?;
    `;
    const result = await connection.get(query, [EXCHANGE_API_ID]);
    return result ? result.last_request_time : null;
  } catch (error) {
    console.error('Error getting last request time:', error);
    return null;
  } finally {
    await connection.close();
  }
}

export async function dbUpdateLastRequestTime(timestamp) {
  const connection = await getConnection();
  try {
    const query = `
      INSERT INTO currency_requests_timeout (api_id, last_request_time)
      VALUES (?, ?)
      ON CONFLICT(api_id) DO UPDATE SET last_request_time = excluded.last_request_time;
    `;
    await connection.run(query, [EXCHANGE_API_ID, timestamp]);
    return true;
  } catch (error) {
    console.error('Error updating last request time:', error);
    return false;
  } finally {
    await connection.close();
  }
}
