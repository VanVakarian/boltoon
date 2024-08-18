export const MODELS = {
  'gpt-4o-2024-08-06': {
    shortName: 'ChatGPT-4o',
    buttonText: '💡 ChatGPT-4o: мощная и дорогая',
    prices: { input: 0.005, output: 0.015 },
  },
  'gpt-4o-mini-2024-07-18': {
    shortName: 'ChatGPT-4o-mini',
    buttonText: '⚡️ ChatGPT-4o-mini: простая и быстрая',
    prices: { input: 0.00015, output: 0.0006 },
  },
  'claude-3-5-sonnet-20240620': {
    shortName: 'Claude-3-5-sonnet',
    buttonText: '🧠 Claude-3-5-sonnet: мощная и дорогая',
    prices: { input: 0.003, output: 0.015 },
  },
  'claude-3-haiku-20240307': {
    shortName: 'Claude-3-haiku',
    buttonText: '🚀 Claude-3-haiku: простая и быстрая',
    prices: { input: 0.00025, output: 0.00125 },
  },
};

export const MODEL_LIST = Object.keys(MODELS);
