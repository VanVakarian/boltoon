import { dbGetUser } from '../db/users.js';
import { dbGetUserStatistics } from '../db/token_history.js';
import { getCurrentRate } from './currency.js';

export async function handleStatistics(ctx) {
  const user = await dbGetUser(ctx.from.id);

  if (!user || !user.is_activated) {
    return ctx.reply('Вы не авторизованы для просмотра статистики.');
  }

  const statistics = await dbGetUserStatistics(user.id);

  if (!statistics) {
    return ctx.reply('Не удалось получить статистику. Пожалуйста, попробуйте позже.');
  }

  const currentRate = await getCurrentRate();
  const message = formatStatisticsMessage(statistics, currentRate);
  await ctx.reply(message, { parse_mode: 'HTML' });
}

function formatStatisticsMessage(statistics, rate) {
  const { totalRequests, totalCost, averageCost } = statistics;

  const safeTotal = totalRequests ?? 0;
  const safeTotalCost = totalCost ?? 0;
  const safeAverageCost = averageCost ?? 0;

  let message = `
    <b>Ваша статистика:</b>

    Всего запросов: ${safeTotal}
    Общая стоимость: $${safeTotalCost.toFixed(4)}
    Средняя стоимость запроса: $${safeAverageCost.toFixed(4)}
  `;

  if (rate !== null) {
    const totalCostRub = safeTotalCost * rate;
    const averageCostRub = safeAverageCost * rate;
    message += `
    Общая стоимость (RUB): ${totalCostRub.toFixed(2)} ₽
    Средняя стоимость запроса (RUB): ${averageCostRub.toFixed(2)} ₽
    Текущий курс: 1 USD = ${rate.toFixed(2)} ₽
    `;
  } else {
    message += `
    
    Не удалось получить текущий курс валюты. 
    Стоимость в рублях недоступна.
    `;
  }

  return message.trim();
}
