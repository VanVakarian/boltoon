import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { TG_BOT_TOKEN } from './env.js';
import { dbInit } from './db/init.js';
import { handleTextMessage } from './bot/messageHandler.js';
import {
  handleStart,
  handleChooseModel,
  handleSetTimezone,
  handleModelSelection,
  handleTimezoneSelection,
} from './bot/settings.js';
import { handleStatistics, handleStatisticsSelection } from './bot/statistics.js';

await dbInit();

const bot = new Telegraf(TG_BOT_TOKEN);

bot.telegram.setMyCommands([
  { command: 'start', description: 'Инструкция' },
  { command: 'choosemodel', description: 'Choose a model' },
  { command: 'settz', description: 'Set timezone' },
  { command: 'statistics', description: 'View statistics' },
]);

bot.command('start', handleStart);
bot.command('choosemodel', handleChooseModel);
bot.command('settz', handleSetTimezone);
bot.command('statistics', handleStatistics);

bot.action(/^select_model:(.+)$/, handleModelSelection);
bot.action(/^set_tz:(-?\d+)$/, handleTimezoneSelection);
bot.action(/^stats:(.+)$/, handleStatisticsSelection);

bot.on(message('text'), handleTextMessage);

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
