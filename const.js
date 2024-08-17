export const MODELS = {
  'gpt-4o-2024-08-06': {
    shortName: 'ChatGPT-4o',
    fullName: 'gpt-4o-2024-08-06',
    description: 'мощная и дорогая',
    buttonText: '💡 ChatGPT-4o: мощная и дорогая',
    prices: { input: 0.005, output: 0.015 },
  },
  'gpt-4o-mini-2024-07-18': {
    shortName: 'ChatGPT-4o-mini',
    fullName: 'gpt-4o-mini-2024-07-18',
    description: 'простая и быстрая',
    buttonText: '⚡️ ChatGPT-4o-mini: простая и быстрая',
    prices: { input: 0.00015, output: 0.0006 },
  },
  'claude-3-5-sonnet-20240620': {
    shortName: 'Claude-3-5-sonnet',
    fullName: 'claude-3-5-sonnet-20240620',
    description: 'мощная и дорогая',
    buttonText: '🧠 Claude-3-5-sonnet: мощная и дорогая',
    prices: { input: 0.003, output: 0.015 },
  },
  'claude-3-haiku-20240307': {
    shortName: 'Claude-3-haiku',
    fullName: 'claude-3-haiku-20240307',
    description: 'простая и быстрая',
    buttonText: '🚀 Claude-3-haiku: простая и быстрая',
    prices: { input: 0.00025, output: 0.00125 },
  },
};

export const MODEL_LIST = Object.keys(MODELS);
