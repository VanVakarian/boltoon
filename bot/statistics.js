import { dbGetUser } from '../db/users.js';
import { dbGetUserStatistics } from '../db/token_history.js';
import { getCurrentRate } from './currency.js';

export async function handleStatistics(ctx) {
  const user = await dbGetUser(ctx.from.id);
  if (!user || !user.is_activated) {
    return ctx.reply('Вы не авторизованы для просмотра статистики.');
  }
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6); // 7 дней назад
  const statistics = await dbGetUserStatistics(user.id, startDate, endDate);
  if (!statistics || statistics.length === 0) {
    return ctx.reply('Не удалось получить статистику. Пожалуйста, попробуйте позже.');
  }
  const currentRate = await getCurrentRate();
  const processedStats = processStatistics(statistics, startDate, endDate, user.tz_offset);
  const message = formatStatisticsMessage(processedStats, currentRate, user.tz_offset);
  await ctx.replyWithMarkdown(message);
}

function processStatistics(statistics, startDate, endDate, tzOffset) {
  const processedStats = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayStats = statistics.filter((stat) => {
      const statDate = new Date(stat.req_ts * 1000);
      statDate.setHours(statDate.getHours() + tzOffset);
      return statDate.toDateString() === currentDate.toDateString();
    });
    processedStats.push({
      date: new Date(currentDate),
      totalRequests: dayStats.length,
      totalCost: dayStats.reduce((sum, stat) => sum + stat.req_cost, 0),
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return processedStats;
}

function formatStatisticsMessage(statistics, rate, tzOffset) {
  const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  let message = '*Ваша статистика за последние 7 дней:*\n\n';
  statistics.forEach((day) => {
    const date = new Date(day.date);
    date.setHours(date.getHours() + tzOffset);
    const dayOfWeek = daysOfWeek[date.getDay()];
    const dayOfMonth = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const costRUB = (day.totalCost * rate).toFixed(2);
    message += `📆 \`${dayOfWeek}, ${dayOfMonth} ${month}\`        `;
    message += `💬 \`${day.totalRequests.toString().padStart(2, ' ')}\`        `;
    message += `💸 \`${costRUB.padStart(5, ' ')} ₽\`\n`;
  });
  return message;
}
