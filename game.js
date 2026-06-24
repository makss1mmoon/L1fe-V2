/**
 * L1fe V2 - Stalker Edition
 * Логика игры (Этап 4: Единый ACTIVITY_REGISTRY)
 */

// --- НАЧАЛЬНЫЕ ДАННЫЕ ИГРОКА (перенесено в data.js) ---
// ACTIVITY_REGISTRY: тип 'daily'|'special'|'habit' (перенесено в data.js)


const INITIAL_BOOKS = [
    { id: "b1", title: "Краткий курс по микроэкономике", author: "Не указан", pages: 120, currentProgress: 0 }
];

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ ---
let playerData = {};
let activities = [];   // единственная глобальная переменная вместо трёх (dailyQuests, specialQuests, habits)
let books = [];
let oneTimeQuests = [];
let lastResetDate = "";
let lastWeeklyReset = "";
let firstLaunchDate = "";
let noClassesToday = false;
let noClassesDate = "";
let habitResetDate = "";
let unlockedAchievements = {};

// --- INDEXED DB WRAPPER ---
const DB_NAME = 'L1feV2DB';
const DB_VERSION = 1;
const STORE_NAME = 'gameState';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function saveToDB(key, data) {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(data, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    });
}

function loadFromDB(key) {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

// --- ВСПОМОГАТЕЛЬНЫЕ ГЕТТЕРЫ (фильтры по type) ---
const getDailyQuests   = () => activities.filter(a => a.type === 'daily');
const getSpecialQuests = () => activities.filter(a => a.type === 'special');
const getHabits        = () => activities.filter(a => a.type === 'habit');


// --- СИСТЕМА СОХРАНЕНИЙ ---
async function loadGameData() {
    const today = new Date().toISOString().split('T')[0];

    let fullSave = await loadFromDB('main_save');

    // Миграция из localStorage
    if (!fullSave && localStorage.getItem('playerData')) {
        console.log('Миграция данных: переносим из localStorage в IndexedDB...');
        
        const m_playerData = JSON.parse(localStorage.getItem('playerData')) || { ...PLAYER_DEFAULTS };
        const m_books      = JSON.parse(localStorage.getItem('books'))      || JSON.parse(JSON.stringify(INITIAL_BOOKS));
        const m_oneTime    = JSON.parse(localStorage.getItem('oneTimeQuests')) || [];
        const m_ach        = JSON.parse(localStorage.getItem('achievements') || '{}');
        const m_lastReset  = localStorage.getItem('lastResetDate') || today;
        const m_lastWeek   = localStorage.getItem('lastWeeklyReset') || today;
        const m_habReset   = localStorage.getItem('habitResetDate') || today;
        const m_noClassesD = localStorage.getItem('noClassesDate') || '';
        const m_noClassesT = localStorage.getItem('noClassesToday') === 'true';
        const m_firstL     = localStorage.getItem('firstLaunchDate') || today;

        let m_activities = [];
        const hasOldActivities = localStorage.getItem('dailyQuests') !== null
                              || localStorage.getItem('specialQuests') !== null
                              || localStorage.getItem('habits') !== null;

        if (hasOldActivities && localStorage.getItem('activities') === null) {
            const oldDaily   = JSON.parse(localStorage.getItem('dailyQuests'))   || [];
            const oldSpecial = JSON.parse(localStorage.getItem('specialQuests')) || [];
            const oldHabits  = JSON.parse(localStorage.getItem('habits'))        || [];
            oldDaily.forEach(q   => { q.type = 'daily';   });
            oldSpecial.forEach(q => { q.type = 'special'; });
            oldHabits.forEach(h  => { h.type = 'habit';   });
            m_activities = [...oldDaily, ...oldSpecial, ...oldHabits];
        } else {
            m_activities = JSON.parse(localStorage.getItem('activities')) || JSON.parse(JSON.stringify(ACTIVITY_REGISTRY));
        }

        fullSave = {
            playerData: m_playerData,
            activities: m_activities,
            books: m_books,
            oneTimeQuests: m_oneTime,
            unlockedAchievements: m_ach,
            lastResetDate: m_lastReset,
            lastWeeklyReset: m_lastWeek,
            habitResetDate: m_habReset,
            noClassesDate: m_noClassesD,
            noClassesToday: m_noClassesT,
            firstLaunchDate: m_firstL
        };

        await saveToDB('main_save', fullSave);
        
        console.log('Очистка старых данных из localStorage...');
        const keysToRemove = ['playerData', 'activities', 'books', 'oneTimeQuests', 'achievements', 'lastResetDate', 'lastWeeklyReset', 'habitResetDate', 'noClassesDate', 'noClassesToday', 'firstLaunchDate', 'dailyQuests', 'specialQuests', 'habits', 'purchasedItems'];
        keysToRemove.forEach(k => localStorage.removeItem(k));
    }

    if (fullSave) {
        playerData = fullSave.playerData || { ...PLAYER_DEFAULTS };
        activities = fullSave.activities || JSON.parse(JSON.stringify(ACTIVITY_REGISTRY));
        books      = fullSave.books      || JSON.parse(JSON.stringify(INITIAL_BOOKS));
        oneTimeQuests = fullSave.oneTimeQuests || [];
        unlockedAchievements = fullSave.unlockedAchievements || {};
        
        lastResetDate = fullSave.lastResetDate || today;
        lastWeeklyReset = fullSave.lastWeeklyReset || today;
        
        habitResetDate = fullSave.habitResetDate || today;
        noClassesDate = fullSave.noClassesDate || '';
        noClassesToday = (noClassesDate === today) && fullSave.noClassesToday;
        
        firstLaunchDate = fullSave.firstLaunchDate || today;
    } else {
        // Первый запуск
        playerData = { ...PLAYER_DEFAULTS };
        activities = JSON.parse(JSON.stringify(ACTIVITY_REGISTRY));
        books = JSON.parse(JSON.stringify(INITIAL_BOOKS));
        oneTimeQuests = [];
        unlockedAchievements = {};
        lastResetDate = today;
        lastWeeklyReset = today;
        habitResetDate = today;
        noClassesDate = '';
        firstLaunchDate = today;
        noClassesToday = false;
    }

    // Сброс счётчика привычек если прошли сутки
    if (habitResetDate !== today) {
        getHabits().forEach(h => { h.countToday = 0; });
        habitResetDate = today;
        saveGameData();
    }

    // Синхронизация активности с реестром
    activities.forEach(a => {
        const ref = ACTIVITY_REGISTRY.find(r => r.id === a.id);
        if (ref) {
            a.title = ref.title;
            if (a.type === 'daily' || a.type === 'special') {
                a.deadline  = ref.deadline;
                a.hpReward  = ref.hpReward  || 0;
                a.hpPenalty = ref.hpPenalty || 0;
            }
            a.type = ref.type;
        }
        if ((a.type === 'daily' || a.type === 'special') && !a.history) {
            a.history = {};
        }
    });

    ACTIVITY_REGISTRY.forEach(ref => {
        if (!activities.find(a => a.id === ref.id)) {
            activities.push(JSON.parse(JSON.stringify(ref)));
        }
    });
}

function saveGameData() {
    const fullSave = {
        playerData,
        activities,
        books,
        oneTimeQuests,
        unlockedAchievements,
        lastResetDate,
        lastWeeklyReset,
        habitResetDate,
        noClassesDate,
        noClassesToday,
        firstLaunchDate
    };
    // Сохраняем асинхронно без блокировки UI
    saveToDB('main_save', fullSave).catch(e => console.error('Ошибка сохранения IndexedDB:', e));
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

        getDailyQuests().forEach(q => {
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
        if (playerData.food < 0)  { playerData.hp -= 10; playerData.food  = 0; }

        lastResetDate = todayStr;
    }

    // 2. Еженедельный сброс (В воскресенье)
    if (dayOfWeek === 0 && lastWeeklyReset !== todayStr) {
        console.log("Выполняется еженедельный сброс (Воскресенье)...");
        getSpecialQuests().forEach(q => {
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
    getDailyQuests().forEach(quest => {
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
    getSpecialQuests().forEach(quest => {
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
async function initGame() {
    await loadGameData();
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
    renderAchievements();
    initNotifications();
    setupSaveSystem();
    setupProfileTab();

    checkAchievements();

    // Штрафы и уведомления каждую минуту
    setInterval(() => {
        applyPenalties();
        updateUI();
        checkNotifications();
    }, 60000);

    console.log("Система квестов загружена. Текущий статус:", { playerData, activities });
}

window.onload = initGame;

// --- СИСТЕМА ФАЙЛОВОГО БЭКАПА ---
function setupSaveSystem() {
    const btnExport = document.getElementById('btn-export-data');
    const importInput = document.getElementById('import-data-file');

    if (btnExport) {
        btnExport.addEventListener('click', async () => {
            const allData = await loadFromDB('main_save');
            const dataToExport = allData || {
                playerData, activities, books, oneTimeQuests, unlockedAchievements,
                lastResetDate, lastWeeklyReset, habitResetDate,
                noClassesDate, noClassesToday, firstLaunchDate
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href",     dataStr);
            dlAnchorElem.setAttribute("download", `l1fe_v2_save_${new Date().toISOString().split('T')[0]}.json`);
            dlAnchorElem.click();
        });
    }

    if (importInput) {
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);

                    if (!importedData.playerData) {
                        throw new Error("Неверный формат сохранения.");
                    }

                    // Поддержка старого формата сохранения
                    if (!importedData.activities && (importedData.dailyQuests || importedData.specialQuests || importedData.habits)) {
                        const oldDaily   = importedData.dailyQuests   || [];
                        const oldSpecial = importedData.specialQuests || [];
                        const oldHabits  = importedData.habits        || [];
                        oldDaily.forEach(q   => { q.type = 'daily';   });
                        oldSpecial.forEach(q => { q.type = 'special'; });
                        oldHabits.forEach(h  => { h.type = 'habit';   });
                        importedData.activities = [...oldDaily, ...oldSpecial, ...oldHabits];
                        delete importedData.dailyQuests;
                        delete importedData.specialQuests;
                        delete importedData.habits;
                    }

                    await saveToDB('main_save', importedData);
                    alert("Сохранение успешно загружено! Страница будет перезагружена.");
                    location.reload();
                } catch (error) {
                    console.error("Ошибка импорта:", error);
                    alert("Ошибка при чтении файла сохранения. Возможно, файл повреждён.");
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

    getHabits().forEach(habit => {
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
        const maxStr = habit.maxCount ? ` / ${habit.maxCount}` : '';
        countSpan.textContent = habit.countToday > 0 ? `✔ Сегодня: ${habit.countToday}${maxStr}` : '';

        detailsDiv.appendChild(titleSpan);
        detailsDiv.appendChild(rewardsSpan);
        detailsDiv.appendChild(countSpan);

        const btn = document.createElement('button');
        btn.className = 'pixel-btn complete-btn';
        if (habit.maxCount && habit.countToday >= habit.maxCount) {
            btn.textContent = 'МАКСИМУМ';
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.addEventListener('click', (e) => showFloatingText('❌ Лимит исчерпан!', e.clientX, e.clientY, true));
        } else {
            btn.textContent = 'ОТМЕТИТЬ';
            btn.addEventListener('click', (e) => completeHabit(habit, e));
        }

        el.appendChild(detailsDiv);
        el.appendChild(btn);
        container.appendChild(el);
    });
}

function completeHabit(habit, event) {
    if (habit.maxCount && habit.countToday >= habit.maxCount) {
        if (event) showFloatingText('❌ Лимит на сегодня исчерпан!', event.clientX, event.clientY, true);
        return;
    }

    habit.countToday = (habit.countToday || 0) + 1;
    playerData.xp += habit.xp;
    playerData.water = Math.min(100, playerData.water + habit.water);
    playerData.food  = Math.min(100, playerData.food  + habit.food);

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
    checkAchievements();
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
    el.style.top  = y + 'px';
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
    getDailyQuests().forEach(q => createQuestHTML(q, false));

    const headerS = document.createElement('h3');
    headerS.className = 'handwritten-subtitle';
    headerS.textContent = 'Особые задачи (Еженедельные):';
    headerS.style.marginTop = '15px';
    container.appendChild(headerS);
    getSpecialQuests().forEach(q => createQuestHTML(q, true));
}

// --- ПЕРЕКЛЮЧАТЕЛЬ «НЕТ ПАР СЕГОДНЯ» ---
function toggleNoClasses() {
    const today = new Date().toISOString().split('T')[0];
    noClassesToday = !noClassesToday;
    noClassesDate = today;

    // Сбрасываем статус квестов учёбы при включении
    if (noClassesToday) {
        CLASS_QUEST_IDS.forEach(id => {
            const q = getDailyQuests().find(q => q.id === id);
            if (q) {
                q.completed = false;
                q.penaltyApplied = false;
                q.history[today] = 'inactive';
            }
        });
    }

    saveGameData();
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
    playerData.xp    += quest.xp;
    playerData.water  = Math.min(100, playerData.water + quest.water);
    playerData.food   = Math.min(100, playerData.food  + quest.food);

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
    checkAchievements();
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
    const year  = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    document.getElementById('cal-month-label').textContent = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('calendar-grid-days');
    grid.innerHTML = '';

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Понедельник = 0

    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-cell empty';
        grid.appendChild(empty);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 1; i <= daysInMonth; i++) {
        const cellDate    = new Date(year, month, i, 12);
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
    const date  = document.getElementById('ot-date').value;
    const xp    = parseInt(document.getElementById('ot-xp').value) || 0;
    const res   = parseInt(document.getElementById('ot-resources').value) || 0;

    if (!title || !date) return alert("Введите название и дату.");

    oneTimeQuests.push({
        id: 'ot_' + Date.now(),
        title, date, xp, resources: res, completed: false, result: ''
    });

    saveGameData();
    renderOneTimeGoals();
    document.getElementById('ot-title').value = '';
    document.getElementById('ot-date').value  = '';
    document.getElementById('ot-xp').value    = '';
    document.getElementById('ot-resources').value = '';
});

function renderOneTimeGoals() {
    const activeList  = document.getElementById('onetime-active-list');
    const archiveList = document.getElementById('onetime-archive-list');
    if (!activeList || !archiveList) return;

    activeList.innerHTML  = '';
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

                playerData.xp    += q.xp;
                playerData.water  = Math.min(100, playerData.water + q.resources);
                playerData.food   = Math.min(100, playerData.food  + q.resources);

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
            if (q.history[todayStr] === 'missed')    skipToday++;
        });
    };
    countStats(getDailyQuests());
    countStats(getSpecialQuests());

    const compEl = document.getElementById('stats-completed-today');
    const skipEl = document.getElementById('stats-skipped-today');
    if (compEl) compEl.textContent = compToday;
    if (skipEl) skipEl.textContent = skipToday;

    const ctx = document.getElementById('historyChart');
    if (!ctx) return;

    const labels        = [];
    const completedData = [];
    const missedData    = [];

    const allTrackedQuests = getDailyQuests().concat(getSpecialQuests());

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        labels.push(d.getDate() + '.' + (d.getMonth() + 1));

        let c = 0; let m = 0;
        allTrackedQuests.forEach(q => {
            if (q.history[dStr] === 'completed') c++;
            if (q.history[dStr] === 'missed')    m++;
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
                    { label: 'Пропущено', data: missedData,    backgroundColor: '#e74c3c' }
                ]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }
}

document.getElementById('btn-go-stats')?.addEventListener('click', () => {
    document.getElementById('tab-stats').click();
});

// --- МАГАЗИН НАГРАД (перенесено в data.js) ---

function renderShop() {
    const container = document.getElementById('shop-list-container');
    if (!container) return;
    container.innerHTML = '';
    SHOP_DATA.forEach(function(reward) {
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
    const reward = SHOP_DATA.find(function(r) { return r.id === rewardId; });
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
    const now     = new Date();
    const hours   = now.getHours();
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
    // Ищем первую недочитанную книгу, иначе показываем самую последнюю добавленную
    const book = books.find(b => b.currentProgress < b.pages) || books[books.length - 1];
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
    var book = books.find(b => b.currentProgress < b.pages) || books[books.length - 1];
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
    checkAchievements();
    renderBooks();
    updateUI();
});

document.getElementById('btn-add-book')?.addEventListener('click', function() {
    var titleInp  = document.getElementById('add-book-title');
    var authorInp = document.getElementById('add-book-author');
    var pagesInp  = document.getElementById('add-book-pages');
    var title  = titleInp  ? titleInp.value.trim()                     : '';
    var author = authorInp ? (authorInp.value.trim() || 'Не указан')   : 'Не указан';
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

// --- АНГЛИЙСКИЙ (ПЕСНИ) ---
document.getElementById('btn-complete-song-achievement')?.addEventListener('click', function(e) {
    var titleInp = document.getElementById('english-song-title');
    var title = titleInp ? titleInp.value.trim() : '';
    
    if (!title) {
        showFloatingText('❌ Введи название песни!', e.clientX, e.clientY, true);
        return;
    }
    
    playerData.xp += 30;
    playerData.water = Math.min(100, playerData.water + 5);
    
    // Проверка повышения уровня
    if (playerData.xp >= playerData.xpToNextLevel) {
        playerData.level++;
        playerData.xp -= playerData.xpToNextLevel;
        playerData.xpToNextLevel = playerData.level * 100;
        playerData.maxHp += 20;
        playerData.hp = playerData.maxHp;
    }
    
    if (titleInp) titleInp.value = '';
    saveGameData();
    updateUI();
    
    showFloatingText('🎵 Песня выучена! +30 XP, +5 💧', e.clientX, e.clientY);
    console.log('🎵 Выучена песня: "' + title + '". Награда получена.');
});

// --- \u041f\u0420\u041e\u0424\u0418\u041b\u042c: \u0421\u041b\u041e\u0422\u042b \u0421\u041e\u0425\u0420\u0410\u041d\u0415\u041d\u0418\u042f ---
const PROFILE_SLOTS = 3;

function renderProfileSlots() {
    const container = document.getElementById('profile-slots-container');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 1; i <= PROFILE_SLOTS; i++) {
        const slotKey = `profile_slot_${i}`;
        const el = document.createElement('div');
        el.className = 'profile-slot pixel-border';

        loadFromDB(slotKey).then(slotData => {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'profile-slot-info';

            if (slotData) {
                const d = slotData.savedAt ? new Date(slotData.savedAt) : null;
                const dateStr = d ? d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '?';
                const lvl = slotData.playerData?.level ?? '?';
                const xp  = slotData.playerData?.xp ?? '?';

                infoDiv.innerHTML = `
                    <span class="profile-slot-name">\ud83d\udcbe \u0421\u043b\u043e\u0442 ${i}</span>
                    <span class="profile-slot-meta">\u0423\u0420. ${lvl} | XP: ${xp} | ${dateStr}</span>`;

                const btnLoad = document.createElement('button');
                btnLoad.className = 'pixel-btn slot-btn';
                btnLoad.textContent = '\u0417\u0410\u0413\u0420\u0423\u0417\u0418\u0422\u042c';
                btnLoad.addEventListener('click', () => loadFromSlot(slotKey));

                const btnDel = document.createElement('button');
                btnDel.className = 'pixel-btn slot-btn slot-btn-danger';
                btnDel.textContent = '\u0423\u0414\u0410\u041b\u0418\u0422\u042c';
                btnDel.addEventListener('click', () => deleteSlot(slotKey));

                el.appendChild(infoDiv);
                el.appendChild(btnLoad);
                el.appendChild(btnDel);
            } else {
                infoDiv.innerHTML = `
                    <span class="profile-slot-name">\ud83d\udcbe \u0421\u043b\u043e\u0442 ${i}</span>
                    <span class="profile-slot-empty">— \u041f\u0443\u0441\u0442\u043e —</span>`;

                const btnSave = document.createElement('button');
                btnSave.className = 'pixel-btn slot-btn';
                btnSave.textContent = '\u0421\u041e\u0425\u0420\u0410\u041d\u0418\u0422\u042c';
                btnSave.addEventListener('click', () => saveToSlot(slotKey));

                el.appendChild(infoDiv);
                el.appendChild(btnSave);
            }

            container.appendChild(el);
        });
    }
}

async function saveToSlot(slotKey) {
    const snapshot = await loadFromDB('main_save');
    if (!snapshot) {
        showFloatingText('\u274c \u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445 \u0434\u043b\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u044f!', window.innerWidth / 2, 200, true);
        return;
    }
    const toSave = Object.assign({}, snapshot, { savedAt: new Date().toISOString() });
    await saveToDB(slotKey, toSave);
    showFloatingText('\u2705 \u041f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d \u0432 \u0441\u043b\u043e\u0442!', window.innerWidth / 2, 200);
    renderProfileSlots();
}

async function loadFromSlot(slotKey) {
    const slotData = await loadFromDB(slotKey);
    if (!slotData) return;
    if (!confirm('\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u044d\u0442\u043e\u0442 \u0441\u043b\u043e\u0442? \u0422\u0435\u043a\u0443\u0449\u0438\u0439 \u043f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u0431\u0443\u0434\u0435\u0442 \u043f\u0435\u0440\u0435\u0437\u0430\u043f\u0438\u0441\u0430\u043d.')) return;
    const { savedAt, ...gameData } = slotData;
    await saveToDB('main_save', gameData);
    location.reload();
}

async function deleteSlot(slotKey) {
    if (!confirm('\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435 \u0432 \u044d\u0442\u043e\u043c \u0441\u043b\u043e\u0442\u0435?')) return;
    const db = await initDB();
    await new Promise((res, rej) => {
        const tx = db.transaction('gameState', 'readwrite');
        const req = tx.objectStore('gameState').delete(slotKey);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
    });
    renderProfileSlots();
}

async function fullReset() {
    if (!confirm('\u041f\u043e\u043b\u043d\u044b\u0439 \u0441\u0431\u0440\u043e\u0441? \u0412\u0435\u0441\u044c \u043f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u0431\u0443\u0434\u0435\u0442 \u0443\u0434\u0430\u043b\u0451\u043d \u0431\u0435\u0437\u0432\u043e\u0437\u0432\u0440\u0430\u0442\u043d\u043e!')) return;
    if (!confirm('\u0422\u043e\u0447\u043d\u043e \u0443\u0432\u0435\u0440\u0435\u043d? \u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043d\u0435\u043e\u0431\u0440\u0430\u0442\u0438\u043c\u043e.')) return;

    const today = new Date().toISOString().split('T')[0];
    const freshSave = {
        playerData: { ...PLAYER_DEFAULTS },
        activities: JSON.parse(JSON.stringify(ACTIVITY_REGISTRY)),
        books: JSON.parse(JSON.stringify(INITIAL_BOOKS)),
        oneTimeQuests: [],
        unlockedAchievements: {},
        lastResetDate: today,
        lastWeeklyReset: today,
        habitResetDate: today,
        noClassesDate: '',
        noClassesToday: false,
        firstLaunchDate: today
    };
    await saveToDB('main_save', freshSave);
    alert('\u0421\u0431\u0440\u043e\u0441 \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d. \u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430 \u0431\u0443\u0434\u0435\u0442 \u043f\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u0430.');
    location.reload();
}

function setupProfileTab() {
    // \u041a\u043d\u043e\u043f\u043a\u0430 \u043f\u043e\u043b\u043d\u043e\u0433\u043e \u0441\u0431\u0440\u043e\u0441\u0430
    document.getElementById('btn-full-reset')
        ?.addEventListener('click', fullReset);

    // \u0420\u0435\u0437\u0435\u0440\u0432\u043d\u0430\u044f \u043a\u043e\u043f\u0438\u044f — \u044d\u043a\u0441\u043f\u043e\u0440\u0442
    document.getElementById('profile-btn-export')
        ?.addEventListener('click', async () => {
            const allData = await loadFromDB('main_save');
            const dataToExport = allData || { playerData, activities, books, oneTimeQuests, unlockedAchievements };
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
            const a = document.createElement('a');
            a.href = dataStr;
            a.download = `l1fe_v2_save_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        });

    // \u0420\u0435\u0437\u0435\u0440\u0432\u043d\u0430\u044f \u043a\u043e\u043f\u0438\u044f — \u0438\u043c\u043f\u043e\u0440\u0442
    const profileImportFile = document.getElementById('profile-import-file');
    if (profileImportFile) {
        profileImportFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const importedData = JSON.parse(ev.target.result);
                    if (!importedData.playerData) throw new Error('\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0444\u043e\u0440\u043c\u0430\u0442.');
                    await saveToDB('main_save', importedData);
                    alert('\u0421\u0435\u0439\u0432 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d! \u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430 \u043f\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0441\u044f.');
                    location.reload();
                } catch (err) {
                    alert('\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438 \u0447\u0442\u0435\u043d\u0438\u0438 \u0444\u0430\u0439\u043b\u0430. \u0412\u043e\u0437\u043c\u043e\u0436\u043d\u043e, \u0444\u0430\u0439\u043b \u043f\u043e\u0432\u0440\u0435\u0436\u0434\u0451\u043d.');
                }
            };
            reader.readAsText(file);
        });
    }

    // \u041e\u0442\u0440\u0438\u0441\u043e\u0432\u043a\u0430 \u0441\u043b\u043e\u0442\u043e\u0432 \u043f\u0440\u0438 \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0435 \u043d\u0430 \u0432\u043a\u043b\u0430\u0434\u043a\u0443
    document.getElementById('tab-profile')
        ?.addEventListener('click', renderProfileSlots);

    renderProfileSlots();
}

// --- \u0421\u0418\u0421\u0422\u0415\u041c\u0410 \u0414\u041e\u0421\u0422\u0418\u0416\u0415\u041d\u0418\u0419 (\u043f\u0435\u0440\u0435\u043d\u0435\u0441\u0435\u043d\u043e \u0432 data.js) ---

function getQuestCompletedCount(questId, history) {
  const quest = activities.find(a => a.id === questId);
  if (!quest || !quest.history) return 0;
  return Object.values(quest.history).filter(v => v === 'completed').length;
}

function getQuestStreak(questId, history) {
  const quest = activities.find(a => a.id === questId);
  if (!quest || !quest.history) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (quest.history[dateStr] === 'completed') streak++;
    else break;
  }
  return streak;
}

function getZeroMissedStreak(history, days) {
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const anyMissed = activities.some(a => a.history && a.history[dateStr] === 'missed');
    if (anyMissed) return false;
  }
  return true;
}

function checkAchievements() {
  const state = {
    playerData,
    books,
    totalCompleted: activities
      .flatMap(a => Object.values(a.history || {}))
      .filter(v => v === 'completed').length,
    history: null // не используется напрямую
  };

  ACHIEVEMENTS_DATA.forEach(ach => {
    if (!unlockedAchievements[ach.id] && ach.condition(state)) {
      unlockedAchievements[ach.id] = true;
      playerData.xp += ach.xpReward;
      
      // Проверка повышения уровня
      if (playerData.xp >= playerData.xpToNextLevel) {
          playerData.level++;
          playerData.xp -= playerData.xpToNextLevel;
          playerData.xpToNextLevel = playerData.level * 100;
          playerData.maxHp += 20;
          playerData.hp = playerData.maxHp;
          console.log(`Новый уровень! УР. ${playerData.level}`);
      }
      
      saveGameData();
      showAchievementToast(ach);
      renderAchievements();
      updateUI();
      console.log(`🏆 Достижение разблокировано: "${ach.name}"`);
    }
  });
}

function showAchievementToast(ach) {
  const toast     = document.getElementById('achievement-toast');
  const nameEl    = document.getElementById('toast-achievement-name');
  const descEl    = document.getElementById('toast-achievement-desc');
  const rewardEl  = document.getElementById('toast-achievement-reward');

  if (!toast) return;
  nameEl.textContent   = `${ach.icon} ${ach.name}`;
  descEl.textContent   = ach.desc;
  rewardEl.textContent = `+${ach.xpReward} XP`;

  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 4000);
}

function renderAchievements() {
  const container = document.getElementById('achievements-list-container');
  if (!container) return;
  container.innerHTML = '';

  ACHIEVEMENTS_DATA.forEach(ach => {
    const unlocked = !!unlockedAchievements[ach.id];
    const el = document.createElement('div');
    el.className = 'achievement-item pixel-border' + (unlocked ? ' unlocked' : ' locked');
    el.innerHTML = `
      <span class="ach-icon">${unlocked ? ach.icon : '🔒'}</span>
      <div class="ach-details">
        <span class="ach-name">${unlocked ? ach.name : '???'}</span>
        <span class="ach-desc">${unlocked ? ach.desc : 'Условие не раскрыто'}</span>
        <span class="ach-reward">+${ach.xpReward} XP</span>
      </div>
    `;
    container.appendChild(el);
  });
}
