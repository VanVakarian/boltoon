import { getConnection } from './db.js';
import { INIT_USERS } from '../env.js';

async function createTables(connection, tables) {
  let tablesCreated = 0;
  let tablesExisted = 0;

  for (const table of tables) {
    try {
      const existingTable = await connection.get('SELECT name FROM sqlite_master WHERE type="table" AND name=?', table.name);

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

async function insertInitialUsers(connection) {
  let usersInserted = 0;

  try {
    const insertQuery = `
      INSERT OR IGNORE INTO users (
        tg_id, tg_username, tg_firstname, tg_lastname, selected_model_key, is_activated, is_admin
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    for (const user of INIT_USERS) {
      const result = await connection.run(insertQuery, [
        user.tgId,
        user.tgUsername ?? null,
        user.tgFirstname ?? null,
        user.tgLastname ?? null,
        user.selectedModelKey,
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

export async function initDatabase() {
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
          is_activated BOOLEAN,
          is_admin BOOLEAN
        );
      `,
    },
  ];

  try {
    const { tablesCreated, tablesExisted } = await createTables(connection, tables);
    const usersInserted = await insertInitialUsers(connection);

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
