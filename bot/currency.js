import { EXCHANGE_RATES_API_URL, EXCHANGE_REQUEST_TIMEOUT } from '../const.js';
import { dbGetLastRequestTime, dbUpdateLastRequestTime } from '../db/currency_timeout.js';
import { dbGetLatestRate, dbInsertOrUpdateRate, dbGetRateForDate } from '../db/currency_rates.js';

export async function getCurrentRate() {
  const currentTime = Date.now();
  const lastFetchTime = await dbGetLastRequestTime();
  const today = new Date().toISOString().split('T')[0];

  if (lastFetchTime && currentTime - lastFetchTime < EXCHANGE_REQUEST_TIMEOUT) {
    const rateForToday = await dbGetRateForDate(today);
    if (rateForToday !== null) {
      return rateForToday;
    }
  }

  try {
    const response = await fetch(EXCHANGE_RATES_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const newRate = data.conversion_rates.RUB;

    await dbUpdateLastRequestTime(currentTime);
    await dbInsertOrUpdateRate(newRate);

    return newRate;
  } catch (error) {
    console.error('Error fetching currency rate:', error);
    return dbGetLatestRate();
  }
}
