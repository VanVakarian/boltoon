import { getConnection } from './db.js';

export async function dbGetLatestRate() {
  const connection = await getConnection();
  try {
    const result = await connection.get(`
      SELECT rate
      FROM currency_rates
      ORDER BY date_iso DESC
      LIMIT 1;
    `);
    return result ? result.rate : null;
  } catch (error) {
    console.error('Error getting latest rate from DB:', error);
    return null;
  } finally {
    await connection.close();
  }
}

export async function dbInsertOrUpdateRate(rate) {
  const connection = await getConnection();
  try {
    const today = new Date().toISOString().split('T')[0]; // Получаем дату в формате "YYYY-MM-DD"
    await connection.run(
      `
      INSERT INTO currency_rates (date_iso, rate) 
      VALUES (?, ?) 
      ON CONFLICT(date_iso) DO UPDATE SET rate = excluded.rate
    `,
      [today, rate]
    );
    return true;
  } catch (error) {
    console.error('Error inserting or updating rate in DB:', error);
    return false;
  } finally {
    await connection.close();
  }
}

export async function dbGetRateForDate(date) {
  const connection = await getConnection();
  try {
    const result = await connection.get(
      `
      SELECT rate
      FROM currency_rates
      WHERE date_iso = ?
      LIMIT 1;
      `,
      [date]
    );
    return result ? result.rate : null;
  } catch (error) {
    console.error('Error getting rate for date from DB:', error);
    return null;
  } finally {
    await connection.close();
  }
}
