import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { TG_BOT_TOKEN } from './env.js';
import { dbInit } from './db/init.js';
import { handleTextMessage } from './bot/message_handler.js';
import { handleStart, handleChooseModel, handleModelSelection } from './bot/settings.js';
import { handleStatistics } from './bot/statistics.js';

await dbInit();

const bot = new Telegraf(TG_BOT_TOKEN);

bot.telegram.setMyCommands([
  { command: 'start', description: 'Инструкция' },
  { command: 'choosemodel', description: 'Выбрать модель' },
  { command: 'statistics', description: 'Просмотреть статистику' },
]);

bot.command('start', handleStart);
bot.command('choosemodel', handleChooseModel);
bot.command('statistics', handleStatistics);

bot.action(/^select_model:(.+)$/, handleModelSelection);

bot.on(message('text'), handleTextMessage);

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
