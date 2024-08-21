import { getConnection } from './db.js';
import { INIT_USERS } from '../env.js';

async function dbCreateTables(connection, tables) {
  let tablesCreated = 0;
  let tablesExisted = 0;

  for (const table of tables) {
    try {
      const existingTable = await connection.get(
        `
        SELECT name
        FROM sqlite_master
        WHERE type="table" AND name=?;
        `,
        table.name
      );

      if (!existingTable) {
        await connection.exec(table.query);
        tablesCreated++;
        console.log(`Таблица '${table.name}' успешно создана.`);
      } else {
        tablesExisted++;
        console.log(`Таблица '${table.name}' уже существует.`);
      }
    } catch (error) {
      console.error(`Ошибка при создании таблицы '${table.name}':`, error);
    }
  }

  return { tablesCreated, tablesExisted };
}

async function dbInsertInitialUsers(connection) {
  let usersInserted = 0;

  try {
    const insertQuery = `
      INSERT OR IGNORE INTO users (tg_id, tg_username, tg_firstname, tg_lastname, selected_model_key, tz_offset, is_activated, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    for (const user of INIT_USERS) {
      const result = await connection.run(insertQuery, [
        user.tgId,
        user.tgUsername ?? null,
        user.tgFirstname ?? null,
        user.tgLastname ?? null,
        user.selectedModelKey,
        user.tzOffset,
        user.isActivated ? 1 : 0,
        user.isAdmin ? 1 : 0,
      ]);

      if (result.changes > 0) {
        usersInserted++;
      }
    }
  } catch (error) {
    console.error('Ошибка при добавлении начальных пользователей:', error);
  }

  return usersInserted;
}

export async function dbInit() {
  const connection = await getConnection();

  const tables = [
    {
      name: 'users',
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          tg_id INTEGER UNIQUE,
          tg_username TEXT,
          tg_firstname TEXT,
          tg_lastname TEXT,
          selected_model_key TEXT,
          tz_offset INTEGER,
          is_activated BOOLEAN,
          is_admin BOOLEAN
        );
      `,
    },
    {
      name: 'token_history',
      query: `
        CREATE TABLE IF NOT EXISTS token_history (
          id INTEGER PRIMARY KEY,
          req_ts INTEGER,
          req_cost REAL,
          user_id INTEGER
        );
      `,
    },
    {
      name: 'currency_rates',
      query: `
        CREATE TABLE IF NOT EXISTS currency_rates (
          id INTEGER PRIMARY KEY,
          date_iso TEXT,
          rate REAL,
          UNIQUE(date_iso)
        );
      `,
    },
    {
      name: 'currency_requests_timeout',
      query: `
        CREATE TABLE IF NOT EXISTS currency_requests_timeout (
          id INTEGER PRIMARY KEY,
          api_id INTEGER UNIQUE,
          last_request_time INTEGER
        );
      `,
    },
  ];

  try {
    const { tablesCreated, tablesExisted } = await dbCreateTables(connection, tables);
    const usersInserted = await dbInsertInitialUsers(connection);

    const messages = [
      'Инициализация базы данных завершена.',
      tablesCreated > 0 ? `Создано новых таблиц: ${tablesCreated}.` : null,
      tablesExisted > 0 ? `Таблиц уже в базе: ${tablesExisted}.` : null,
      `Добавлено новых пользователей: ${usersInserted}.`,
    ].filter(Boolean);

    console.log(messages.join(' '));
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
  } finally {
    await connection.close();
  }
}
