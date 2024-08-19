import { Markup } from 'telegraf';
import { dbGetUser } from '../db/users.js';

export async function handleStatistics(ctx) {
  const user = await dbGetUser(ctx.from.id);

  if (!user || !user.is_activated) {
    return ctx.reply('You are not authorized to view statistics.');
  }

  await ctx.reply('Choose a time range for statistics:', getStatisticsKeyboard());
}

function getStatisticsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Last 24 Hours (Hourly)', 'stats:last24hours')],
    [Markup.button.callback('Last 30 Days (Daily)', 'stats:last30days')],
  ]);
}

export async function handleStatisticsSelection(ctx) {
  const choice = ctx.match[1];
  const user = await dbGetUser(ctx.from.id);

  if (!user || !user.is_activated) return;

  let message;
  if (choice === 'last24hours') {
    message = 'Statistics for the last 24 hours will be available here soon.';
  } else if (choice === 'last30days') {
    message = 'Statistics for the last 30 days will be available here soon.';
  } else {
    return ctx.answerCbQuery('Invalid selection.');
  }

  await ctx.answerCbQuery();
  await ctx.editMessageText(message);
}
