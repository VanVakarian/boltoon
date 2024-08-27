import { dbGetUser, dbGetAllUsers } from '../db/users.js';
import { dbGetUserStatistics } from '../db/token_history.js';
import { getCurrentRate } from './currency.js';

export async function handleStatistics(ctx) {
  const user = await dbGetUser(ctx.from.id);

  if (!user) {
    return ctx.reply('Вы не авторизованы для просмотра статистики.');
  }

  const now = new Date();
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0, 0));
  const currentRate = await getCurrentRate();

  if (user.is_admin) {
    await sendAdminStatistics(ctx, user, startDate, endDate, currentRate);
  } else {
    await sendUserStatistics(ctx, user, startDate, endDate, currentRate);
  }
}

async function sendUserStatistics(ctx, user, startDate, endDate, currentRate) {
  const statistics = await dbGetUserStatistics(user.id, startDate, endDate);

  if (!statistics || statistics.length === 0) {
    return ctx.reply('Не удалось получить статистику. Пожалуйста, попробуйте позже.');
  }

  const processedStats = processStatistics(statistics, startDate, endDate);
  const message = formatStatisticsMessage(processedStats, currentRate);
  await ctx.replyWithMarkdown(message);
}

async function sendAdminStatistics(ctx, admin, startDate, endDate, currentRate) {
  const allUsers = await dbGetAllUsers();
  let fullMessage = '*Статистика всех пользователей за последние 7 дней:*\n\n';
  const maxLength = 4000;

  const adminStats = await dbGetUserStatistics(admin.id, startDate, endDate);
  const processedAdminStats = processStatistics(adminStats, startDate, endDate);
  fullMessage += formatStatisticsMessage(processedAdminStats, currentRate, admin) + '\n';

  for (const user of allUsers) {
    if (user.id !== admin.id) {
      const statistics = await dbGetUserStatistics(user.id, startDate, endDate);
      const processedStats = processStatistics(statistics, startDate, endDate);
      const totalStats = calculateTotalStats(processedStats);
      const userMessage = formatTotalStatisticsMessage(totalStats, currentRate, user);

      if (fullMessage.length + userMessage.length > maxLength) {
        await ctx.replyWithMarkdown(fullMessage);
        fullMessage = '*Продолжение статистики:*\n\n' + userMessage;
      } else {
        fullMessage += userMessage;
      }
    }
  }

  if (fullMessage.length > 0) {
    await ctx.replyWithMarkdown(fullMessage);
  }
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

function formatStatisticsMessage(statistics, rate, user = null) {
  const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  let userInfo = user ? `*${formatUserInfo(user)}*\n` : '*Ваша статистика за последние 7 дней:*\n\n';
  let message = userInfo;

  let totalRequests = 0;
  let totalCost = 0;

  statistics.forEach((day) => {
    const dayOfWeek = daysOfWeek[day.date.getUTCDay()];
    const dayOfMonth = day.date.getUTCDate().toString().padStart(2, '0');
    const month = months[day.date.getUTCMonth()];
    const costRUB = (day.totalCost * rate).toFixed(2);
    message += `📆 \`${dayOfWeek}, ${dayOfMonth} ${month}\`        `;
    message += `💬 \`${day.totalRequests.toString().padStart(2, ' ')}\`        `;
    message += `💸 \`${costRUB.padStart(5, ' ')} ₽\`\n`;

    totalRequests += day.totalRequests;
    totalCost += day.totalCost;
  });

  const totalCostRUB = (totalCost * rate).toFixed(2);
  message += `\nИтого: 💬 ${totalRequests},  💸 ${totalCostRUB} ₽\n`;

  return message + '\n';
}

function formatTotalStatisticsMessage(totalStats, rate, user) {
  const userInfo = formatUserInfo(user);
  const totalCostRUB = (totalStats.totalCost * rate).toFixed(2);
  return `*${userInfo}*:\n💬 ${totalStats.totalRequests},  💸 ${totalCostRUB} ₽\n\n`;
}

function formatUserInfo(user) {
  let userInfo = user.tg_firstname;
  if (user.tg_lastname) userInfo += ` ${user.tg_lastname}`;
  if (user.tg_username) userInfo += ` (@${user.tg_username})`;
  return userInfo;
}

function calculateTotalStats(processedStats) {
  const totals = { totalRequests: 0, totalCost: 0 };
  processedStats.forEach((day) => {
    totals.totalRequests += day.totalRequests;
    totals.totalCost += day.totalCost;
  });
  return totals;
}
