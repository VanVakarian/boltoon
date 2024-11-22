# Boltoon - Telegram LLM Bot

A Telegram bot that provides access to various Large Language Models (LLMs) including ChatGPT-4 and Claude AI with usage tracking and administrative features.

## Features

- Support for multiple LLM models:
  - ChatGPT 4o
  - ChatGPT 4o mini
  - Claude 3.5 Sonnet
  - Claude 3 Haiku
- Context preservation through message replies
- Token usage tracking and cost calculation
- Real-time currency conversion (USD to RUB)
- Usage statistics for users and administrators
- Streaming responses with progress updates
- Admin monitoring and error reporting

## Prerequisites

- Node.js
- SQLite3
- Telegram Bot Token
- OpenAI API Key
- Anthropic API Key
- ExchangeRate API Key

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `env.js.example` to `env.js` and fill in your credentials:

```javascript
export const TG_BOT_TOKEN = 'your_telegram_bot_token';
export const CHATGPT_TOKEN = 'your_openai_api_key';
export const CLAUDE_TOKEN = 'your_anthropic_api_key';
export const EXCHANGE_RATE_API_KEY = 'your_exchange_rate_api_key';
```

4. Configure initial admin users in `env.js`:

```javascript
export const INIT_USERS = [
  {
    tgId: 123456789,
    tgUsername: 'AdminUser',
    tgFirstname: 'Admin',
    tgLastname: 'User',
    selectedModelKey: 'ChatGPT-4o-mini',
    isAdmin: 1,
  },
];
```

## Running the Bot

Start the bot:

```bash
node bot.js
```

## Available Commands

- `/start` - View bot instructions and available models
- `/choosemodel` - Select LLM model
- `/statistics` - View usage statistics

## Database Structure

The bot uses SQLite with the following tables:

- `users` - User information and preferences
- `token_history` - Usage tracking and costs
- `currency_rates` - Exchange rate cache
- `currency_requests_timeout` - API request management

## Error Handling

- Automatic error reporting to admin users
- Connection timeout handling
- Rate limit management
- Invalid user validation

## Cost Calculation

Costs are calculated based on token usage:

- Input tokens: Cost varies by model
- Output tokens: Cost varies by model
- All costs are tracked in USD and converted to RUB for display

## Security Features

- User authentication
- Admin-only access to sensitive commands
- Message logging for unauthorized users
- HTML escaping for error messages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
