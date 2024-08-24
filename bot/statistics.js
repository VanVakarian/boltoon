import { dbGetUser } from '../db/users.js';
import { dbGetUserStatistics } from '../db/token_history.js';
import { getCurrentRate } from './currency.js';

export async function handleStatistics(ctx) {
  const user = await dbGetUser(ctx.from.id);

  if (!user || !user.is_activated) {
    return ctx.reply('Вы не авторизованы для просмотра статистики.');
  }

  const now = new Date();
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0, 0));
  const statistics = await dbGetUserStatistics(user.id, startDate, endDate);

  if (!statistics || statistics.length === 0) {
    return ctx.reply('Не удалось получить статистику. Пожалуйста, попробуйте позже.');
  }

  const currentRate = await getCurrentRate();
  const processedStats = processStatistics(statistics, startDate, endDate);
  const message = formatStatisticsMessage(processedStats, currentRate);
  await ctx.replyWithMarkdown(message);
}

function processStatistics(statistics, startDate, endDate) {
  const processedStats = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayStart = new Date(
      Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), 0, 0, 0, 0)
    );
    const dayEnd = new Date(
      Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), 23, 59, 59, 999)
    );
    const dayStats = statistics.filter((stat) => {
      const statDate = new Date(stat.req_ts * 1000);
      return statDate >= dayStart && statDate <= dayEnd;
    });
    processedStats.push({
      date: new Date(currentDate),
      totalRequests: dayStats.length,
      totalCost: dayStats.reduce((sum, stat) => sum + stat.req_cost, 0),
    });
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return processedStats;
}

function formatStatisticsMessage(statistics, rate) {
  const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  let message = '*Ваша статистика за последние 7 дней:*\n\n';

  statistics.forEach((day) => {
    const dayOfWeek = daysOfWeek[day.date.getUTCDay()];
    const dayOfMonth = day.date.getUTCDate().toString().padStart(2, '0');
    const month = months[day.date.getUTCMonth()];
    const costRUB = (day.totalCost * rate).toFixed(2);
    message += `📆 \`${dayOfWeek}, ${dayOfMonth} ${month}\`        `;
    message += `💬 \`${day.totalRequests.toString().padStart(2, ' ')}\`        `;
    message += `💸 \`${costRUB.padStart(5, ' ')} ₽\`\n`;
  });

  return message;
}
