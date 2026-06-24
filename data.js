/*
 * ┌─────────────────────────────────────────────────┐
 * │            L1FE V2 — CONTENT CONFIG              │
 * │                                                   │
 * │  КВЕСТ (type: 'daily' | 'special'):              │
 * │    id, type, title, xp, water, food,             │
 * │    hpPenalty, hpReward*, deadline,               │
 * │    days*[], excludeDays*[], day* (только special)│
 * │    tags*[] — например ['class'] для пар          │
 * │                                                   │
 * │  ПРИВЫЧКА (type: 'habit'):                        │
 * │    id, type, title, xp, water, food, countToday  │
 * │                                                   │
 * │  МАГАЗИН (SHOP_DATA):                            │
 * │    id, name, costWater, costFood                 │
 * │                                                   │
 * │  ДОСТИЖЕНИЕ (ACHIEVEMENTS_DATA):                 │
 * │    id, name, desc, icon, xpReward, condition     │
 * │    condition = (state) => boolean                │
 * │                                                   │
 * │  * — необязательное поле                         │
 * └─────────────────────────────────────────────────┘
 */

// ============================================================
//  DATA.JS — L1FE V2 CONTENT CONFIGURATION
//  Единственный файл для редактирования игрового контента.
//  Добавить квест  → ACTIVITY_REGISTRY
//  Добавить награду → SHOP_DATA
//  Добавить достижение → ACHIEVEMENTS_DATA
//  Изменить старт игрока → PLAYER_DEFAULTS
// ============================================================

const PLAYER_DEFAULTS = {
    name: "Никто",
    level: 3,
    hp: 80,
    maxHp: 80,
    xp: 0,
    xpToNextLevel: 300,
    water: 100,
    food: 100
};

const ACTIVITY_REGISTRY = [
    // --- Ежедневные квесты ---
    { type: 'daily', id: "d1",  title: 'Подъём в 5:00',              xp: 15, water: 5,  food: 0,  hpPenalty: 10, completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [0] },
    { type: 'daily', id: "d2",  title: 'Зарядка / разминка',          xp: 10, water: 0,  food: 3,  hpPenalty: 5,  completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [0] },
    { type: 'daily', id: "d3",  title: 'Контрастный душ / умывание',  xp: 5,  water: 2,  food: 0,  hpPenalty: 3,  completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [0] },
    { type: 'daily', id: "d4",  title: 'Завтрак',                     xp: 10, water: 0,  food: 5,  hpPenalty: 10, completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [0] },
    { type: 'daily', id: "d5",  title: 'Чтение книги (15 мин утром)', xp: 15, water: 3,  food: 0,  hpPenalty: 5,  completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [0] },
    { type: 'daily', id: "d6",  title: 'Пробежка (2 км)',              xp: 30, water: 10, food: 0,  hpPenalty: 20, completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [0] },
    { type: 'daily', id: "d7",  title: 'Прийти на работу в 8:20',     xp: 15, water: 0,  food: 5,  hpPenalty: 10, completed: false, penaltyApplied: false, deadline: '22:30', days: [1, 2, 3, 4, 5] },
    { type: 'daily', id: "d8",  title: 'Рабочий день',                xp: 25, water: 0,  food: 10, hpPenalty: 15, completed: false, penaltyApplied: false, deadline: '22:30', days: [1, 2, 3, 4, 5] },
    { type: 'daily', id: "d9",  title: 'Обед',                        xp: 10, water: 0,  food: 5,  hpPenalty: 5,  completed: false, penaltyApplied: false, deadline: '22:30', days: [1, 2, 3, 4, 5] },
    { type: 'daily', id: "d10", title: 'Прийти на пары вовремя',      xp: 15, water: 5,  food: 0,  hpPenalty: 10, completed: false, penaltyApplied: false, deadline: '22:30', days: [1, 2, 3, 4, 5] },
    { type: 'daily', id: "d11", title: 'Пары: присутствие',           xp: 20, water: 5,  food: 0,  hpPenalty: 10, completed: false, penaltyApplied: false, deadline: '22:30', days: [1, 2, 3, 4, 5] },
    { type: 'daily', id: "d12", title: 'Бокс (тренировка)',            xp: 35, water: 10, food: 0,  hpPenalty: 20, completed: false, penaltyApplied: false, deadline: '22:30', days: [2, 5] },
    { type: 'daily', id: "d13", title: 'Ужин',                        xp: 10, water: 0,  food: 5,  hpPenalty: 5,  completed: false, penaltyApplied: false, deadline: '22:30' },
    { type: 'daily', id: "d14", title: 'Дневник',                     xp: 15, water: 3,  food: 0,  hpPenalty: 5,  completed: false, penaltyApplied: false, deadline: '22:30' },
    { type: 'daily', id: "d15", title: 'Гигиена перед сном',          xp: 5,  water: 2,  food: 0,  hpPenalty: 3,  completed: false, penaltyApplied: false, deadline: '22:30' },
    { type: 'daily', id: "d16", title: 'Отбой в 22:30',               xp: 20, water: 5,  food: 0,  hpPenalty: 15, completed: false, penaltyApplied: false, deadline: '22:30' },
    // --- Квесты восстановления HP (без штрафов) ---
    { type: 'daily', id: "hp1", title: '💧 Стакан воды (утром)',      xp: 2,  water: 0,  food: 0,  hpPenalty: 0, hpReward: 2,  completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [] },
    { type: 'daily', id: "hp2", title: '🍳 Завтрак (HP)',              xp: 5,  water: 0,  food: 3,  hpPenalty: 0, hpReward: 5,  completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [] },
    { type: 'daily', id: "hp3", title: '🥗 Обед (HP)',                xp: 5,  water: 0,  food: 3,  hpPenalty: 0, hpReward: 5,  completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [] },
    { type: 'daily', id: "hp4", title: '🍽 Ужин (HP)',                 xp: 5,  water: 0,  food: 3,  hpPenalty: 0, hpReward: 5,  completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [] },
    { type: 'daily', id: "hp5", title: '🚿 Контрастный душ',          xp: 3,  water: 0,  food: 0,  hpPenalty: 0, hpReward: 3,  completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [] },
    { type: 'daily', id: "hp6", title: '😴 Сон (отбой в 22:30)',      xp: 10, water: 0,  food: 0,  hpPenalty: 0, hpReward: 15, completed: false, penaltyApplied: false, deadline: '22:30', excludeDays: [] },

    // --- Особые (еженедельные) задания ---
    { type: 'special', id: "s1", title: 'Приготовить еду на 3 дня', xp: 30, water: 0,  food: 15, hpPenalty: 10, completed: false, penaltyApplied: false, day: 4, deadline: '23:59' }, // Чт
    { type: 'special', id: "s2", title: 'Доварить крупы',           xp: 20, water: 0,  food: 10, hpPenalty: 5,  completed: false, penaltyApplied: false, day: 6, deadline: '23:59' }, // Сб
    { type: 'special', id: "s3", title: 'Генеральная уборка',       xp: 25, water: 10, food: 0,  hpPenalty: 10, completed: false, penaltyApplied: false, day: 0, deadline: '23:59' }, // Вс
    { type: 'special', id: "s4", title: 'Планирование недели',      xp: 20, water: 5,  food: 0,  hpPenalty: 5,  completed: false, penaltyApplied: false, day: 0, deadline: '23:59' }, // Вс
    { type: 'special', id: "s5", title: 'Доготовка еды на Пн',      xp: 20, water: 0,  food: 10, hpPenalty: 5,  completed: false, penaltyApplied: false, day: 0, deadline: '23:59' }, // Вс

    // --- Привычки ---
    { type: 'habit', id: "h1", title: '💧 Стакан воды',        xp: 2, water: 1, food: 0, countToday: 0, maxCount: 5 },
    { type: 'habit', id: "h2", title: '🧼 Вымыть лицо утром',  xp: 2, water: 1, food: 0, countToday: 0, maxCount: 1 },
    { type: 'habit', id: "h3", title: '🧼 Вымыть лицо вечером', xp: 2, water: 1, food: 0, countToday: 0, maxCount: 1 }
];

const SHOP_DATA = [
    { id: 'r1', name: '📺 1 час сериала/фильма',     costWater: 50,  costFood: 50  },
    { id: 'r2', name: '🍰 Десерт в субботу',          costWater: 30,  costFood: 20  },
    { id: 'r3', name: '😴 Доп. час сна',              costWater: 40,  costFood: 40  },
    { id: 'r4', name: '📖 Новая книга (электронная)', costWater: 60,  costFood: 60  },
    { id: 'r5', name: '☕ Поход в кафе',              costWater: 100, costFood: 100 }
];

const ACHIEVEMENTS_DATA = [
  {
    id: 'first_blood',
    name: 'Первая кровь',
    desc: 'Выполнить первый квест',
    icon: '🗡️',
    xpReward: 10,
    condition: (state) => state.totalCompleted >= 1
  },
  {
    id: 'stalker_morning',
    name: 'Ранний сталкер',
    desc: 'Выполнить подъём в 5:00 семь раз',
    icon: '🌅',
    xpReward: 50,
    condition: (state) => getQuestCompletedCount('d1', state.history) >= 7
  },
  {
    id: 'marathon_runner',
    name: 'Марафонец',
    desc: 'Пробежать 7 дней подряд',
    icon: '🏃',
    xpReward: 75,
    condition: (state) => getQuestStreak('d6', state.history) >= 7
  },
  {
    id: 'boxer',
    name: 'Боец Зоны',
    desc: 'Посетить бокс 10 раз',
    icon: '🥊',
    xpReward: 60,
    condition: (state) => getQuestCompletedCount('d12', state.history) >= 10
  },
  {
    id: 'bookworm',
    name: 'Книжный червь',
    desc: 'Прочитать первую книгу до конца',
    icon: '📚',
    xpReward: 80,
    condition: (state) => state.books.some(b => b.currentProgress >= b.pages && b.pages > 0)
  },
  {
    id: 'level_5',
    name: 'Ветеран Зоны',
    desc: 'Достигнуть 5-го уровня',
    icon: '⭐',
    xpReward: 100,
    condition: (state) => state.playerData.level >= 5
  },
  {
    id: 'iron_week',
    name: 'Железная неделя',
    desc: 'Не пропустить ни одного квеста за 7 дней',
    icon: '🛡️',
    xpReward: 150,
    condition: (state) => getZeroMissedStreak(state.history, 7)
  },
  {
    id: 'diary_habit',
    name: 'Летописец',
    desc: 'Заполнить дневник 14 раз',
    icon: '📓',
    xpReward: 60,
    condition: (state) => getQuestCompletedCount('d14', state.history) >= 14
  }
];
