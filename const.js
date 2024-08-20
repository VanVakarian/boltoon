import { EXCHANGE_RATE_API_KEY } from './env.js';

export const MODELS = {
  'ChatGPT-4o': {
    modelName: 'gpt-4o-2024-08-06',
    buttonText: '💡 ChatGPT-4o: мощная и дорогая',
    prices: { input: 2.5, output: 10 },
  },
  'ChatGPT-4o-mini': {
    modelName: 'gpt-4o-mini-2024-07-18',
    buttonText: '⚡️ ChatGPT-4o-mini: простая',
    prices: { input: 0.15, output: 0.6 },
  },
  'Claude-3.5-sonnet': {
    modelName: 'claude-3-5-sonnet-20240620',
    buttonText: '🧠 Claude-3.5-sonnet: мощная и дорогая',
    prices: { input: 3, output: 15 },
  },
  'Claude-3-haiku': {
    modelName: 'claude-3-haiku-20240307',
    buttonText: '🚀 Claude-3-haiku: простая',
    prices: { input: 0.25, output: 1.25 },
  },
};

export const DEFAULT_MODEL_KEY = 'ChatGPT-4o-mini';

export const EXCHANGE_RATES_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/USD`;

export const EXCHANGE_REQUEST_TIMEOUT = 60 * 60 * 1000; // 1 hour

export const EXCHANGE_API_ID = 1; // in case there will be more than one exchange api
