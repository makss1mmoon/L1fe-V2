/**
 * L1fe V2 - Stalker Edition
 * Логика игры (Этап 3.2: Система сбросов, штрафов и хранения квестов)
 */

// --- НАЧАЛЬНЫЕ ДАННЫЕ ---
const INITIAL_PLAYER = {
    name: "Никто",
    level: 3,
    hp: 80,
    maxHp: 80,
    xp: 0,
    xpToNextLevel: 300,
    water: 100,
    food: 100
};

const INITIAL_DAILY_QUESTS = [
    { id: "d1",  title: 'Подъём в 5:00',             xp: 15, water: 5,  food: 0,  hpPenalty: 10, completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [0] },
    { id: "d2",  title: 'Зарядка / разминка',         xp: 10, water: 0,  food: 3,  hpPenalty: 5,  completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [0] },
    { id: "d3",  title: 'Контрастный душ / умывание', xp: 5,  water: 2,  food: 0,  hpPenalty: 3,  completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [0] },
    { id: "d4",  title: 'Завтрак',                    xp: 10, water: 0,  food: 5,  hpPenalty: 10, completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [0] },
    { id: "d5",  title: 'Чтение книги (15 мин утром)',xp: 15, water: 3,  food: 0,  hpPenalty: 5,  completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [0] },
    { id: "d6",  title: 'Пробежка (2 км)',             xp: 30, water: 10, food: 0,  hpPenalty: 20, completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [0] },
    { id: "d7",  title: 'Прийти на работу в 8:20',    xp: 15, water: 0,  food: 5,  hpPenalty: 10, completed: false, penaltyApplied: false, deadline: '22:00', days: [1, 2, 3, 4, 5] },
    { id: "d8",  title: 'Рабочий день',               xp: 25, water: 0,  food: 10, hpPenalty: 15, completed: false, penaltyApplied: false, deadline: '22:00', days: [1, 2, 3, 4, 5] },
    { id: "d9",  title: 'Обед',                       xp: 10, water: 0,  food: 5,  hpPenalty: 5,  completed: false, penaltyApplied: false, deadline: '22:00', days: [1, 2, 3, 4, 5] },
    { id: "d10", title: 'Прийти на пары вовремя',     xp: 15, water: 5,  food: 0,  hpPenalty: 10, completed: false, penaltyApplied: false, deadline: '22:00', days: [1, 2, 3, 4, 5] },
    { id: "d11", title: 'Пары: присутствие',          xp: 20, water: 5,  food: 0,  hpPenalty: 10, completed: false, penaltyApplied: false, deadline: '22:00', days: [1, 2, 3, 4, 5] },
    { id: "d12", title: 'Бокс (тренировка)',           xp: 35, water: 10, food: 0,  hpPenalty: 20, completed: false, penaltyApplied: false, deadline: '22:00', days: [2, 5] },
    { id: "d13", title: 'Ужин',                       xp: 10, water: 0,  food: 5,  hpPenalty: 5,  completed: false, penaltyApplied: false, deadline: '22:00' },
    { id: "d14", title: 'Дневник',                    xp: 15, water: 3,  food: 0,  hpPenalty: 5,  completed: false, penaltyApplied: false, deadline: '22:00' },
    { id: "d15", title: 'Гигиена перед сном',         xp: 5,  water: 2,  food: 0,  hpPenalty: 3,  completed: false, penaltyApplied: false, deadline: '22:00' },
    { id: "d16", title: 'Отбой в 22:00',              xp: 20, water: 5,  food: 0,  hpPenalty: 15, completed: false, penaltyApplied: false, deadline: '22:00' },
    // --- Квесты восстановления HP (без штрафов) ---
    { id: "hp1", title: '💧 Стакан воды (утром)',     xp: 2,  water: 0,  food: 0,  hpPenalty: 0, hpReward: 2,  completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [] },
    { id: "hp2", title: '🍳 Завтрак (HP)',             xp: 5,  water: 0,  food: 3,  hpPenalty: 0, hpReward: 5,  completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [] },
    { id: "hp3", title: '🥗 Обед (HP)',               xp: 5,  water: 0,  food: 3,  hpPenalty: 0, hpReward: 5,  completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [] },
    { id: "hp4", title: '🍽 Ужин (HP)',                xp: 5,  water: 0,  food: 3,  hpPenalty: 0, hpReward: 5,  completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [] },
    { id: "hp5", title: '🚿 Контрастный душ',         xp: 3,  water: 0,  food: 0,  hpPenalty: 0, hpReward: 3,  completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [] },
    { id: "hp6", title: '😴 Сон (отбой в 22:00)',     xp: 10, water: 0,  food: 0,  hpPenalty: 0, hpReward: 15, completed: false, penaltyApplied: false, deadline: '22:00', excludeDays: [] }
];

const INITIAL_SPECIAL_QUESTS = [
    { id: "s1", title: 'Приготовить еду на 3 дня', xp: 30, water: 0, food: 15, hpPenalty: 10, completed: false, penaltyApplied: false, day: 4, deadline: '23:59' }, // Чт
    { id: "s2", title: 'Доварить крупы', xp: 20, water: 0, food: 10, hpPenalty: 5, completed: false, penaltyApplied: false, day: 6, deadline: '23:59' }, // Сб
    { id: "s3", title: 'Генеральная уборка', xp: 25, water: 10, food: 0, hpPenalty: 10, completed: false, penaltyApplied: false, day: 0, deadline: '23:59' }, // Вс
    { id: "s4", title: 'Планирование недели', xp: 20, water: 5, food: 0, hpPenalty: 5, completed: false, penaltyApplied: false, day: 0, deadline: '23:59' }, // Вс
    { id: "s5", title: 'Доготовка еды на Пн', xp: 20, water: 0, food: 10, hpPenalty: 5, completed: false, penaltyApplied: false, day: 0, deadline: '23:59' } // Вс
];

const INITIAL_HABITS = [
    { id: "h1", title: '💧 Стакан воды', xp: 2, water: 1, food: 0, countToday: 0 },
    { id: "h2", title: '🧼 Вымыть лицо утром', xp: 2, water: 1, food: 0, countToday: 0 },
    { id: "h3", title: '🧼 Вымыть лицо вечером', xp: 2, water: 1, food: 0, countToday: 0 }
];

const INITIAL_BOOKS = [
    { id: "b1", title: "Краткий курс по микроэкономике", author: "Не указан", pages: 120, currentProgress: 0 }
];

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ ---
let playerData = {};
let dailyQuests = [];
let specialQuests = [];
let books = [];
let oneTimeQuests = [];
let habits = [];
let lastResetDate = "";
let lastWeeklyReset = "";
let firstLaunchDate = "";
let noClassesToday = false;


// --- СИСТЕМА СОХРАНЕНИЙ ---
function loadGameData() {
    const today = new Date().toISOString().split('T')[0];

    // Загрузка или инициализация данных
    playerData    = JSON.parse(localStorage.getItem('playerData'))    || { ...INITIAL_PLAYER };
    dailyQuests   = JSON.parse(localStorage.getItem('dailyQuests'))   || JSON.parse(JSON.stringify(INITIAL_DAILY_QUESTS));
    specialQuests = JSON.parse(localStorage.getItem('specialQuests')) || JSON.parse(JSON.stringify(INITIAL_SPECIAL_QUESTS));
    books         = JSON.parse(localStorage.getItem('books'))         || JSON.parse(JSON.stringify(INITIAL_BOOKS));
    oneTimeQuests = JSON.parse(localStorage.getItem('oneTimeQuests')) || [];
    habits        = JSON.parse(localStorage.getItem('habits'))        || JSON.parse(JSON.stringify(INITIAL_HABITS));

    // Синхронизируем дедлайны и hpReward из кода (на случай если в localStorage старые значения)
    dailyQuests.forEach(q => {
        const ref = INITIAL_DAILY_QUESTS.find(r => r.id === q.id);
        if (ref) {
            q.deadline  = ref.deadline;
            q.hpReward  = ref.hpReward  || 0;
            q.hpPenalty = ref.hpPenalty || 0;
        }
    });

    // Добавляем новые квесты из INITIAL, которых ещё нет в localStorage
    INITIAL_DAILY_QUESTS.forEach(ref => {
        if (!dailyQuests.find(q => q.id === ref.id)) {
            dailyQuests.push(JSON.parse(JSON.stringify(ref)));
        }
    });

    // Обеспечиваем наличие поля history
    dailyQuests.forEach(q   => { if (!q.history) q.history = {}; });
    specialQuests.forEach(q => { if (!q.history) q.history = {}; });

    // Сброс счётчика привычек если прошли сутки
    const habitResetDate = localStorage.getItem('habitResetDate') || today;
    if (habitResetDate !== today) {
        habits.forEach(h => { h.countToday = 0; });
        localStorage.setItem('habitResetDate', today);
    }

    lastResetDate  = localStorage.getItem('lastResetDate')  || today;
    lastWeeklyReset = localStorage.getItem('lastWeeklyReset') || today;

    // Загрузка переключателя «Нет пар сегодня» с авто-сбросом по дате
    const noClassesDate = localStorage.getItem('noClassesDate') || '';
    noClassesToday = (noClassesDate === today) && localStorage.getItem('noClassesToday') === 'true';

    firstLaunchDate = localStorage.getItem('firstLaunchDate');
    if (!firstLaunchDate) {
        firstLaunchDate = today;
        localStorage.setItem('firstLaunchDate', firstLaunchDate);
    }
}


function saveGameData() {
    localStorage.setItem('playerData', JSON.stringify(playerData));
    localStorage.setItem('dailyQuests', JSON.stringify(dailyQuests));
    localStorage.setItem('specialQuests', JSON.stringify(specialQuests));
    localStorage.setItem('books', JSON.stringify(books));
    localStorage.setItem('oneTimeQuests', JSON.stringify(oneTimeQuests));
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('lastResetDate', lastResetDate);
    localStorage.setItem('lastWeeklyReset', lastWeeklyReset);
}

// --- ФУНКЦИЯ ПРОВЕРКИ И СБРОСА ---
function checkAndResetQuests() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const dayOfWeek = now.getDay(); // 0 = Sunday

    // 1. Ежедневный сброс (в 00:00)
    if (lastResetDate !== todayStr) {
        console.log("Выполняется ежедневный сброс квестов...");
        
        const lastDateObj = new Date(lastResetDate);
        const lastDayOfWeek = lastDateObj.getDay();

        dailyQuests.forEach(q => {
            const isExcluded = q.excludeDays && q.excludeDays.includes(lastDayOfWeek);
            const isIncluded = q.days ? q.days.includes(lastDayOfWeek) : true;
            if (!isExcluded && isIncluded) {
                if (!q.completed && !q.history[lastResetDate]) {
                    q.history[lastResetDate] = 'missed';
                }
            }
            q.completed = false;
            q.penaltyApplied = false;
        });

        // Списание ресурсов выживания (-20 воды/еды) раз в день при сбросе
        playerData.water -= 20;
        playerData.food -= 20;
        if (playerData.water < 0) { playerData.hp -= 10; playerData.water = 0; }
        if (playerData.food < 0) { playerData.hp -= 10; playerData.food = 0; }

        lastResetDate = todayStr;
    }

    // 2. Еженедельный сброс (В воскресенье)
    if (dayOfWeek === 0 && lastWeeklyReset !== todayStr) {
        console.log("Выполняется еженедельный сброс (Воскресенье)...");
        specialQuests.forEach(q => {
            if (!q.completed && !q.history[lastWeeklyReset]) {
                q.history[lastWeeklyReset] = 'missed';
            }
            q.completed = false;
            q.penaltyApplied = false;
        });
        lastWeeklyReset = todayStr;
    }

    saveGameData();
}

// --- ФУНКЦИЯ ПРОВЕРКИ ШТРАФОВ ЗА ПРОПУСК ---
function applyPenalties() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    let penaltiesAppliedCount = 0;

    // Штрафы для ежедневных квестов
    const CLASS_QUEST_IDS = ['d10', 'd11'];
    dailyQuests.forEach(quest => {
        const isExcluded = quest.excludeDays && quest.excludeDays.includes(dayOfWeek);
        const isIncluded = quest.days ? quest.days.includes(dayOfWeek) : true;

        if (!isExcluded && isIncluded) {
            // Если пары отменены — пропускаем штраф, ставим 'inactive'
            if (noClassesToday && CLASS_QUEST_IDS.includes(quest.id)) {
                if (!quest.penaltyApplied) {
                    quest.penaltyApplied = true;
                    const todayStr = now.toISOString().split('T')[0];
                    quest.history[todayStr] = 'inactive';
                }
                return;
            }

            if (!quest.completed && !quest.penaltyApplied && quest.deadline) {
                const [hours, minutes] = quest.deadline.split(':').map(Number);
                const deadlineDate = new Date();
                deadlineDate.setHours(hours, minutes, 0, 0);
                if (now > deadlineDate) {
                    playerData.hp -= quest.hpPenalty;
                    quest.penaltyApplied = true;
                    const todayStr = now.toISOString().split('T')[0];
                    quest.history[todayStr] = 'missed';
                    penaltiesAppliedCount++;
                    console.log(`Штраф! Пропущен квест: "${quest.title}". -${quest.hpPenalty} HP.`);
                }
            }
        }
    });

    // Штрафы для особых (еженедельных)
    specialQuests.forEach(quest => {
        if (quest.day === dayOfWeek && !quest.completed && !quest.penaltyApplied && quest.deadline) {
            const [hours, minutes] = quest.deadline.split(':').map(Number);
            const deadlineDate = new Date();
            deadlineDate.setHours(hours, minutes, 0, 0);

            if (now > deadlineDate) {
                playerData.hp -= quest.hpPenalty;
                quest.penaltyApplied = true;
                const todayStr = now.toISOString().split('T')[0];
                quest.history[todayStr] = 'missed';
                penaltiesAppliedCount++;
                console.log(`Штраф! Пропущено особое задание: "${quest.title}". -${quest.hpPenalty} HP.`);
            }
        }
    });

    // Проверка смерти
    if (playerData.hp <= 0) {
        playerData.hp = 0;
        console.log("Сталкер потерял сознание...");
    }

    if (penaltiesAppliedCount > 0) {
        saveGameData();
    }
}

// --- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ---
function updateUI() {
    // Имя и уровень
    document.querySelector('.char-name').textContent = playerData.name.toUpperCase();
    document.getElementById('char-lvl').textContent = `УР. ${playerData.level}`;

    // Индикатор Дня
    const start = new Date(firstLaunchDate);
    const today = new Date(new Date().toISOString().split('T')[0]);
    // Вычисляем разницу в днях (+1, чтобы первый день был Днем 1)
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const dayInd = document.getElementById('day-indicator');
    if (dayInd) {
        dayInd.textContent = `День #${diffDays}`;
    }

    // HP
    const hpPercent = Math.max(0, Math.min(100, (playerData.hp / playerData.maxHp) * 100));
    document.getElementById('hp-fill').style.width = hpPercent + '%';
    document.getElementById('hp-value').textContent = `${playerData.hp}/${playerData.maxHp}`;

    // XP
    const xpPercent = Math.max(0, Math.min(100, (playerData.xp / playerData.xpToNextLevel) * 100));
    document.getElementById('xp-fill').style.width = xpPercent + '%';
    document.getElementById('xp-value').textContent = `${playerData.xp}/${playerData.xpToNextLevel}`;

    // Вода
    const waterPercent = Math.max(0, Math.min(100, (playerData.water / 100) * 100));
    document.getElementById('water-fill').style.width = waterPercent + '%';
    document.getElementById('water-value').textContent = `${playerData.water}/100`;

    // Еда
    const foodPercent = Math.max(0, Math.min(100, (playerData.food / 100) * 100));
    document.getElementById('food-fill').style.width = foodPercent + '%';
    document.getElementById('food-value').textContent = `${playerData.food}/100`;
}

// --- НАВИГАЦИЯ ПО ВКЛАДКАМ ---
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabViews = document.querySelectorAll('.tab-view');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabViews.forEach(v => v.classList.add('hidden'));

            btn.classList.add('active');
            const tabId = btn.id.replace('tab-', 'view-');
            document.getElementById(tabId).classList.remove('hidden');
        });
    });
}

// --- ИНИЦИАЛИЗАЦИЯ ---
function initGame() {
    loadGameData();
    checkAndResetQuests();
    applyPenalties();
    updateUI();
    setupTabs();
    
    renderQuests();
    renderHabits();
    renderShop();
    renderBooks();
    renderOneTimeGoals();
    renderStats();
    initNotifications();
    setupSaveSystem();
    
    // Штрафы и уведомления каждую минуту
    setInterval(() => {
        applyPenalties();
        updateUI();
        checkNotifications();
    }, 60000);

    console.log("Система квестов загружена. Текущий статус:", { playerData, dailyQuests });
}

window.onload = initGame;

// --- СИСТЕМА ФАЙЛОВОГО БЭКАПА ---
function setupSaveSystem() {
    const btnExport = document.getElementById('btn-export-data');
    const importInput = document.getElementById('import-data-file');

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const allData = {
                playerData: JSON.parse(localStorage.getItem('playerData')),
                dailyQuests: JSON.parse(localStorage.getItem('dailyQuests')),
                specialQuests: JSON.parse(localStorage.getItem('specialQuests')),
                books: JSON.parse(localStorage.getItem('books')),
                oneTimeQuests: JSON.parse(localStorage.getItem('oneTimeQuests')),
                habits: JSON.parse(localStorage.getItem('habits')),
                lastResetDate: localStorage.getItem('lastResetDate'),
                lastWeeklyReset: localStorage.getItem('lastWeeklyReset'),
                habitResetDate: localStorage.getItem('habitResetDate'),
                noClassesDate: localStorage.getItem('noClassesDate'),
                noClassesToday: localStorage.getItem('noClassesToday'),
                firstLaunchDate: localStorage.getItem('firstLaunchDate'),
                purchasedItems: JSON.parse(localStorage.getItem('purchasedItems') || '[]'),
                achievements: JSON.parse(localStorage.getItem('achievements') || '{}')
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href",     dataStr     );
            dlAnchorElem.setAttribute("download", `l1fe_v2_save_${new Date().toISOString().split('T')[0]}.json`);
            dlAnchorElem.click();
        });
    }

    if (importInput) {
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    if (!importedData.playerData) {
                        throw new Error("Неверный формат сохранения.");
                    }

                    for (const key in importedData) {
                        if (importedData[key] !== null && importedData[key] !== undefined) {
                            if (typeof importedData[key] === 'object') {
                                localStorage.setItem(key, JSON.stringify(importedData[key]));
                            } else {
                                localStorage.setItem(key, importedData[key]);
                            }
                        }
                    }

                    alert("Сохранение успешно загружено! Страница будет перезагружена.");
                    location.reload();
                } catch (error) {
                    console.error("Ошибка импорта:", error);
                    alert("Ошибка при чтении файла сохранения. Возможно, файл поврежден.");
                }
            };
            reader.readAsText(file);
        });
    }
}

// --- ПРИВЫЧКИ ---
function renderHabits() {
    const container = document.getElementById('habits-list-container');
    if (!container) return;
    container.innerHTML = '';

    habits.forEach(habit => {
        const el = document.createElement('div');
        el.className = 'habit-item pixel-border';

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'habit-details';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'habit-title';
        titleSpan.textContent = habit.title;

        const rewardsSpan = document.createElement('span');
        rewardsSpan.className = 'habit-rewards';
        rewardsSpan.textContent = `+${habit.xp} XP | +${habit.water} 💧`;

        const countSpan = document.createElement('span');
        countSpan.className = 'habit-rewards';
        countSpan.style.color = '#a8d8a8';
        countSpan.textContent = habit.countToday > 0 ? `✔ Сегодня: ${habit.countToday}×` : '';

        detailsDiv.appendChild(titleSpan);
        detailsDiv.appendChild(rewardsSpan);
        detailsDiv.appendChild(countSpan);

        const btn = document.createElement('button');
        btn.className = 'pixel-btn complete-btn';
        btn.textContent = 'ОТМЕТИТЬ';
        btn.addEventListener('click', (e) => completeHabit(habit, e));

        el.appendChild(detailsDiv);
        el.appendChild(btn);
        container.appendChild(el);
    });
}

function completeHabit(habit, event) {
    habit.countToday = (habit.countToday || 0) + 1;
    playerData.xp += habit.xp;
    playerData.water = Math.min(100, playerData.water + habit.water);
    playerData.food = Math.min(100, playerData.food + habit.food);

    // Проверка повышения уровня
    if (playerData.xp >= playerData.xpToNextLevel) {
        playerData.level++;
        playerData.xp -= playerData.xpToNextLevel;
        playerData.xpToNextLevel = playerData.level * 100;
        playerData.maxHp += 20;
        playerData.hp = playerData.maxHp;
    }

    // Всплывающий текст у курсора
    if (event) {
        showFloatingText(`+${habit.xp} XP  +${habit.water} 💧`, event.clientX, event.clientY);
    }

    saveGameData();
    renderHabits();
    updateUI();
    console.log(`✔ Привычка: "${habit.title}". +${habit.xp} XP. Вода: ${playerData.water}`);
}

// Всплывающий текст с наградой
function showFloatingText(text, x, y, isNegative = false) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    if (isNegative) el.style.color = '#e74c3c';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
}

// --- ОТРИСОВКА ДНЕВНИКА КВЕСТОВ ---
const CLASS_QUEST_IDS = ['d10', 'd11'];

function renderQuests() {
    const container = document.getElementById('quest-list-container');
    if (!container) return;
    container.innerHTML = '';

    // Кнопка переключателя «Нет пар сегодня»
    const toggleRow = document.createElement('div');
    toggleRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:6px 8px;background:rgba(0,0,0,0.05);border-radius:4px;border:1px dashed rgba(0,0,0,0.15);';
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'pixel-btn' + (noClassesToday ? ' complete-btn' : '');
    toggleBtn.style.cssText = 'font-size:7px;padding:4px 8px;';
    toggleBtn.textContent = noClassesToday ? '🎓 Пары отменены' : '🎓 Нет пар сегодня';
    toggleBtn.addEventListener('click', toggleNoClasses);
    const toggleHint = document.createElement('span');
    toggleHint.style.cssText = 'font-size:7px;color:#777;font-family:monospace;';
    toggleHint.textContent = noClassesToday ? 'Квесты учёбы отменены на сегодня' : 'Отменить квесты учёбы';
    toggleRow.appendChild(toggleBtn);
    toggleRow.appendChild(toggleHint);
    container.appendChild(toggleRow);

    const dayOfWeek = new Date().getDay();

    const createQuestHTML = (quest, isSpecial) => {
        const isExcluded = quest.excludeDays && quest.excludeDays.includes(dayOfWeek);
        const isIncluded = quest.days ? quest.days.includes(dayOfWeek) : true;
        const isForToday = isSpecial ? (quest.day === dayOfWeek) : (!isExcluded && isIncluded);
        const isClassQuest = CLASS_QUEST_IDS.includes(quest.id);

        const el = document.createElement('div');
        el.className = 'notebook-quest-item';

        // --- ЛЕВАЯ ЧАСТЬ (текст квеста + клик на календарь) ---
        const textDiv = document.createElement('div');
        textDiv.style.cursor = 'pointer';
        textDiv.style.flexGrow = '1';

        // Серый вид для отменённых пар
        if (noClassesToday && isClassQuest) {
            el.style.opacity = '0.5';
            textDiv.innerHTML = `
                <div class="nq-title" style="text-decoration:line-through;color:#999;">🎓 ${quest.title}</div>
                <div class="nq-info" style="color:#bbb;">Сегодня пар нет</div>
            `;
            textDiv.addEventListener('click', () => openCalendarModal(quest));
            const badge = document.createElement('span');
            badge.style.cssText = 'font-family:monospace;font-size:10px;color:#999;white-space:nowrap;';
            badge.textContent = '— отменено';
            el.appendChild(textDiv);
            el.appendChild(badge);
            container.appendChild(el);
            return;
        }

        textDiv.innerHTML = `
            <div class="nq-title">${isForToday ? '' : '<span style="color:#aaa;font-size:14px;">(не сегодня)</span> '}${quest.title}</div>
            <div class="nq-info">+${quest.xp} XP | +${quest.water} 💧 | +${quest.food} 🍖 | Дедлайн: ${quest.deadline || '23:59'}${quest.hpReward ? ' | +' + quest.hpReward + ' ❤️' : ''}</div>
        `;
        textDiv.addEventListener('click', () => openCalendarModal(quest));

        // --- ПРАВАЯ ЧАСТЬ (кнопки или статус) ---
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'nq-actions';

        if (quest.completed) {
            actionsDiv.innerHTML = '<span class="nq-status-icon completed">✔ Выполнено</span>';
        } else if (quest.penaltyApplied) {
            actionsDiv.innerHTML = '<span class="nq-status-icon missed">✘ Пропущено</span>';
        } else {
            // Кнопка ВЫПОЛНИТЬ
            const doneBtn = document.createElement('button');
            doneBtn.className = 'pixel-btn complete-btn';
            doneBtn.style.cssText = 'padding:5px 8px; font-size:6px; margin-right:4px;';
            doneBtn.textContent = 'ВЫПОЛНИТЬ';
            doneBtn.addEventListener('click', () => completeQuest(quest, isSpecial));

            // Кнопка ПРОПУСТИТЬ
            const skipBtn = document.createElement('button');
            skipBtn.className = 'pixel-btn skip-btn';
            skipBtn.style.cssText = 'padding:5px 8px; font-size:6px;';
            skipBtn.textContent = 'ПРОПУСТИТЬ';
            skipBtn.addEventListener('click', () => skipQuest(quest, isSpecial));

            actionsDiv.appendChild(doneBtn);
            actionsDiv.appendChild(skipBtn);
        }

        el.appendChild(textDiv);
        el.appendChild(actionsDiv);
        container.appendChild(el);
    };

    const headerD = document.createElement('h3');
    headerD.className = 'handwritten-subtitle';
    headerD.textContent = 'Ежедневные задачи:';
    container.appendChild(headerD);
    dailyQuests.forEach(q => createQuestHTML(q, false));

    const headerS = document.createElement('h3');
    headerS.className = 'handwritten-subtitle';
    headerS.textContent = 'Особые задачи (Еженедельные):';
    headerS.style.marginTop = '15px';
    container.appendChild(headerS);
    specialQuests.forEach(q => createQuestHTML(q, true));
}

// --- ПЕРЕКЛЮЧАТЕЛЬ «НЕТ ПАР СЕГОДНЯ» ---
function toggleNoClasses() {
    const today = new Date().toISOString().split('T')[0];
    noClassesToday = !noClassesToday;
    localStorage.setItem('noClassesToday', noClassesToday ? 'true' : 'false');
    localStorage.setItem('noClassesDate', today);

    // Сбрасываем статус квестов учёбы при включении
    if (noClassesToday) {
        CLASS_QUEST_IDS.forEach(id => {
            const q = dailyQuests.find(q => q.id === id);
            if (q) {
                q.completed = false;
                q.penaltyApplied = false;
                q.history[today] = 'inactive';
            }
        });
        saveGameData();
    }

    renderQuests();
    console.log('🎓 Переключатель «Нет пар»:', noClassesToday ? 'ВКЛ' : 'ВЫКЛ');
}

// --- ВЫПОЛНИТЬ КВЕСТ ---
function completeQuest(quest, isSpecial) {
    if (quest.completed || quest.penaltyApplied) {
        console.warn('Квест уже обработан:', quest.title);
        return;
    }

    quest.completed = true;
    playerData.xp += quest.xp;
    playerData.water = Math.min(100, playerData.water + quest.water);
    playerData.food = Math.min(100, playerData.food + quest.food);

    // Восстановление HP (для квестов с полем hpReward)
    if (quest.hpReward && quest.hpReward > 0) {
        playerData.hp = Math.min(playerData.maxHp, playerData.hp + quest.hpReward);
        console.log(`❤️ +${quest.hpReward} HP от: "${quest.title}". Текущий HP: ${playerData.hp}`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (!quest.history) quest.history = {};
    quest.history[todayStr] = 'completed';

    // Проверка повышения уровня
    if (playerData.xp >= playerData.xpToNextLevel) {
        playerData.level++;
        playerData.xp -= playerData.xpToNextLevel;
        playerData.xpToNextLevel = playerData.level * 100;
        playerData.maxHp += 20;
        playerData.hp = playerData.maxHp;
        console.log(`Новый уровень! УР. ${playerData.level}`);
    }

    console.log(`✔ Выполнен: "${quest.title}". +${quest.xp} XP. HP: ${playerData.hp}. XP: ${playerData.xp}`);

    saveGameData();
    renderQuests();
    updateUI();
    renderStats();
}

// --- ПРОПУСТИТЬ КВЕСТ (вручную) ---
function skipQuest(quest, isSpecial) {
    if (quest.completed || quest.penaltyApplied) {
        console.warn('Квест уже обработан:', quest.title);
        return;
    }

    quest.penaltyApplied = true;
    playerData.hp = Math.max(0, playerData.hp - quest.hpPenalty);

    const todayStr = new Date().toISOString().split('T')[0];
    if (!quest.history) quest.history = {};
    quest.history[todayStr] = 'missed';

    console.log(`✘ Пропущен: "${quest.title}". -${quest.hpPenalty} HP. Текущий HP: ${playerData.hp}`);

    saveGameData();
    renderQuests();
    updateUI();
    renderStats();
}


// --- КАЛЕНДАРЬ ---
let currentCalendarDate = new Date();
let currentViewQuest = null;

function openCalendarModal(quest) {
    currentViewQuest = quest;
    document.getElementById('modal-quest-title').textContent = quest.title;
    document.getElementById('calendar-modal').classList.remove('hidden');
    renderCalendar();
}

document.getElementById('close-calendar-btn')?.addEventListener('click', () => {
    document.getElementById('calendar-modal').classList.add('hidden');
    currentViewQuest = null;
});

function renderCalendar() {
    if (!currentViewQuest) return;
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    document.getElementById('cal-month-label').textContent = `${monthNames[month]} ${year}`;
    
    const grid = document.getElementById('calendar-grid-days');
    grid.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Понедельник = 0
    
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-cell empty';
        grid.appendChild(empty);
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    for (let i = 1; i <= daysInMonth; i++) {
        const cellDate = new Date(year, month, i, 12);
        const cellDateStr = cellDate.toISOString().split('T')[0];
        
        const cell = document.createElement('div');
        cell.className = 'cal-cell';
        cell.textContent = i;
        
        if (cellDateStr === todayStr) cell.classList.add('today');
        
        if (cellDate > new Date()) {
            cell.classList.add('future');
        } else {
            const status = currentViewQuest.history[cellDateStr];
            if (status === 'completed') cell.classList.add('completed');
            else if (status === 'missed')   cell.classList.add('missed');
            else if (status === 'inactive') cell.classList.add('inactive');
        }
        
        grid.appendChild(cell);
    }
}

document.getElementById('cal-prev-month')?.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
});
document.getElementById('cal-next-month')?.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
});

// --- РАЗОВЫЕ ЦЕЛИ ---
document.getElementById('btn-add-onetime')?.addEventListener('click', () => {
    const title = document.getElementById('ot-title').value;
    const date = document.getElementById('ot-date').value;
    const xp = parseInt(document.getElementById('ot-xp').value) || 0;
    const res = parseInt(document.getElementById('ot-resources').value) || 0;
    
    if (!title || !date) return alert("Введите название и дату.");
    
    oneTimeQuests.push({
        id: 'ot_' + Date.now(),
        title, date, xp, resources: res, completed: false, result: ''
    });
    
    saveGameData();
    renderOneTimeGoals();
    document.getElementById('ot-title').value = '';
    document.getElementById('ot-date').value = '';
    document.getElementById('ot-xp').value = '';
    document.getElementById('ot-resources').value = '';
});

function renderOneTimeGoals() {
    const activeList = document.getElementById('onetime-active-list');
    const archiveList = document.getElementById('onetime-archive-list');
    if (!activeList || !archiveList) return;
    
    activeList.innerHTML = '';
    archiveList.innerHTML = '';
    
    oneTimeQuests.forEach(q => {
        const el = document.createElement('div');
        el.className = 'onetime-item';
        el.innerHTML = `
            <div class="onetime-details">
                <span class="ot-title">${q.title}</span>
                <span class="ot-meta">Дата: ${q.date} | +${q.xp} XP | +${q.resources} Ресурсов ${q.result ? `| Рез: ${q.result}` : ''}</span>
            </div>
            <div>
                ${q.completed ? '<span class="nq-status-icon completed">✔</span>' : '<button class="pixel-btn complete-btn mini-btn" style="padding:4px; font-size:6px;">ВЫПОЛНИТЬ</button>'}
            </div>
        `;
        
        if (!q.completed) {
            const btn = el.querySelector('.complete-btn');
            btn.addEventListener('click', () => {
                const result = prompt("Введите результат (время, счет и т.д.), если есть:", q.result || "");
                q.completed = true;
                if (result) q.result = result;
                
                playerData.xp += q.xp;
                playerData.water = Math.min(100, playerData.water + q.resources);
                playerData.food = Math.min(100, playerData.food + q.resources);
                
                saveGameData();
                updateUI();
                renderOneTimeGoals();
            });
            activeList.appendChild(el);
        } else {
            archiveList.appendChild(el);
        }
    });
}

// --- СТАТИСТИКА (Chart.js) ---
let statsChart = null;

function renderStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    let compToday = 0;
    let skipToday = 0;
    
    const countStats = (quests) => {
        quests.forEach(q => {
            if (q.history[todayStr] === 'completed') compToday++;
            if (q.history[todayStr] === 'missed') skipToday++;
        });
    };
    countStats(dailyQuests);
    countStats(specialQuests);
    
    const compEl = document.getElementById('stats-completed-today');
    const skipEl = document.getElementById('stats-skipped-today');
    if (compEl) compEl.textContent = compToday;
    if (skipEl) skipEl.textContent = skipToday;
    
    const ctx = document.getElementById('historyChart');
    if (!ctx) return;
    
    const labels = [];
    const completedData = [];
    const missedData = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        labels.push(d.getDate() + '.' + (d.getMonth() + 1));
        
        let c = 0; let m = 0;
        dailyQuests.concat(specialQuests).forEach(q => {
            if (q.history[dStr] === 'completed') c++;
            if (q.history[dStr] === 'missed') m++;
        });
        completedData.push(c);
        missedData.push(m);
    }
    
    if (statsChart) statsChart.destroy();
    if (typeof Chart !== 'undefined') {
        statsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Выполнено', data: completedData, backgroundColor: '#2ecc71' },
                    { label: 'Пропущено', data: missedData, backgroundColor: '#e74c3c' }
                ]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }
}

document.getElementById('btn-go-stats')?.addEventListener('click', () => {
    document.getElementById('tab-stats').click();
});

// --- МАГАЗИН НАГРАД ---
const REWARDS = [
    { id: 'r1', name: '📺 1 час сериала/фильма',     costWater: 50,  costFood: 50  },
    { id: 'r2', name: '🍰 Десерт в субботу',          costWater: 30,  costFood: 20  },
    { id: 'r3', name: '😴 Доп. час сна',           costWater: 40,  costFood: 40  },
    { id: 'r4', name: '📖 Новая книга (электронная)', costWater: 60,  costFood: 60  },
    { id: 'r5', name: '☕ Поход в кафе',              costWater: 100, costFood: 100 }
];

function renderShop() {
    const container = document.getElementById('shop-list-container');
    if (!container) return;
    container.innerHTML = '';
    REWARDS.forEach(function(reward) {
        const el = document.createElement('div');
        el.className = 'shop-item pixel-border';
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'shop-details';
        const titleSpan = document.createElement('span');
        titleSpan.className = 'shop-title';
        titleSpan.textContent = reward.name;
        const costSpan = document.createElement('span');
        costSpan.className = 'shop-cost';
        costSpan.textContent = 'Цена: ' + reward.costWater + ' 💧 + ' + reward.costFood + ' 🍖';
        detailsDiv.appendChild(titleSpan);
        detailsDiv.appendChild(costSpan);
        const btn = document.createElement('button');
        btn.className = 'pixel-btn buy-btn';
        btn.textContent = 'КУПИТЬ';
        btn.addEventListener('click', function(e) { buyReward(reward.id, e); });
        el.appendChild(detailsDiv);
        el.appendChild(btn);
        container.appendChild(el);
    });
}

function buyReward(rewardId, event) {
    const reward = REWARDS.find(function(r) { return r.id === rewardId; });
    if (!reward) return;
    if (playerData.water < reward.costWater || playerData.food < reward.costFood) {
        if (event) showFloatingText('❌ Мало ресурсов!', event.clientX, event.clientY, true);
        return;
    }
    playerData.water -= reward.costWater;
    playerData.food  -= reward.costFood;
    if (event) showFloatingText('🎉 ' + reward.name, event.clientX, event.clientY);
    saveGameData();
    updateUI();
    console.log('🛒 Куплено: "' + reward.name + '".');
}

// --- УВЕДОМЛЕНИЯ ---
function initNotifications() {
    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }
}

function checkNotifications() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if ((hours === 13 || hours === 21) && minutes === 0) {
        new Notification("Сталкер, проверка связи!", {
            body: "Не забудь отметить выполненные задания в дневнике.",
            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='1em' font-size='80'>☢️</text></svg>"
        });
    }
}

// --- КНИГИ ---
function renderBooks() {
    const book = books[0];
    if (!book) return;

    const titleEl  = document.getElementById('book-current-title');
    const authorEl = document.getElementById('book-current-author');
    const fillEl   = document.getElementById('book-progress-fill');
    const valEl    = document.getElementById('book-progress-value');

    if (titleEl)  titleEl.textContent  = book.title;
    if (authorEl) authorEl.textContent = 'Автор: ' + book.author;

    const pct = book.pages > 0
        ? Math.min(100, Math.round((book.currentProgress / book.pages) * 100))
        : 0;
    if (fillEl) fillEl.style.width = pct + '%';
    if (valEl)  valEl.textContent  = book.currentProgress + '/' + book.pages + ' стр (' + pct + '%)';

    const warning = document.getElementById('book-sunday-warning');
    if (warning) warning.style.display = new Date().getDay() === 0 ? 'block' : 'none';

    renderCabinet();
}

function renderCabinet() {
    const list = document.getElementById('cabinet-list-container');
    if (!list) return;
    const finished = books.filter(function(b) { return b.currentProgress >= b.pages && b.pages > 0; });
    if (finished.length === 0) {
        list.innerHTML = '<span class="no-books">Тумбочка пуста. Прочитайте свою первую книгу!</span>';
        return;
    }
    list.innerHTML = '';
    finished.forEach(function(b) {
        var el = document.createElement('div');
        el.className = 'cabinet-item';
        el.innerHTML = '<span>📕 ' + b.title + '</span><span style="color:#2ecc71;">✔ ' + b.pages + ' стр.</span>';
        list.appendChild(el);
    });
}

document.getElementById('btn-update-book')?.addEventListener('click', function() {
    var book = books[0];
    if (!book) return;
    var input   = document.getElementById('book-page-input');
    var newPage = parseInt(input ? input.value : '');
    if (isNaN(newPage) || newPage < 0) {
        showFloatingText('❌ Введи номер страницы!', window.innerWidth / 2, 300, true);
        return;
    }
    var clamped      = Math.min(newPage, book.pages);
    var prevProgress = book.currentProgress;
    book.currentProgress = clamped;

    // +10 еды за каждые 10 новых страниц
    var prevTens   = Math.floor(prevProgress / 10);
    var newTens    = Math.floor(clamped / 10);
    var tensGained = newTens - prevTens;
    if (tensGained > 0) {
        var foodGain = tensGained * 10;
        playerData.food = Math.min(100, playerData.food + foodGain);
        var btn  = document.getElementById('btn-update-book');
        var rect = btn ? btn.getBoundingClientRect() : null;
        var fx   = rect ? rect.left + rect.width / 2 : 300;
        var fy   = rect ? rect.top  - 15             : 250;
        showFloatingText('+' + foodGain + ' 🍖 за чтение!', fx, fy);
    }

    // Бонус за 100% прочтение
    if (clamped >= book.pages && prevProgress < book.pages) {
        var xpBonus   = Math.floor(book.pages / 10) * 10;
        var foodBonus = Math.floor(book.pages / 10) * 10;
        playerData.xp   += xpBonus;
        playerData.food  = Math.min(100, playerData.food + foodBonus);
        showFloatingText('🏆 Книга прочитана! +' + xpBonus + ' XP +' + foodBonus + ' 🍖', window.innerWidth / 2, 160);
        console.log('🏆 "' + book.title + '" прочитана! +' + xpBonus + ' XP, +' + foodBonus + ' еды.');
    }

    if (input) input.value = '';
    saveGameData();
    renderBooks();
    updateUI();
});

document.getElementById('btn-add-book')?.addEventListener('click', function() {
    var titleInp  = document.getElementById('add-book-title');
    var authorInp = document.getElementById('add-book-author');
    var pagesInp  = document.getElementById('add-book-pages');
    var title  = titleInp  ? titleInp.value.trim()                    : '';
    var author = authorInp ? (authorInp.value.trim() || 'Не указан') : 'Не указан';
    var pages  = parseInt(pagesInp ? pagesInp.value : '');
    if (!title || !pages || pages <= 0) {
        showFloatingText('❌ Укажи название и страницы!', window.innerWidth / 2, window.innerHeight / 2, true);
        return;
    }
    books.push({ id: 'b' + Date.now(), title: title, author: author, pages: pages, currentProgress: 0 });
    if (titleInp)  titleInp.value  = '';
    if (authorInp) authorInp.value = '';
    if (pagesInp)  pagesInp.value  = '';
    saveGameData();
    renderBooks();
    console.log('📚 Добавлена: "' + title + '" (' + pages + ' стр.)');
});
