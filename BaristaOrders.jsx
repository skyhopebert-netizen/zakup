
// Glass effect constants
const GLASS_SM = { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' };
const GLASS_MD = { backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' };
const GLASS_LG = { backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' };
const GLASS_NAV = { backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' };

const { useState, useEffect, useCallback } = React;
const { Search, Plus, Minus, Send, Check, X, Package, ShoppingCart, ChevronLeft, Flag, RotateCcw, Copy } = LucideReact;

const UNITS = ['кг', 'г', 'л', 'мл', 'шт'];

const STEP_BY_UNIT = {
  'кг': 0.5,
  'г': 50,
  'л': 0.5,
  'мл': 50,
  'шт': 1,
};

function getStep(product) {
  return product.minOrder ?? STEP_BY_UNIT[product.unit] ?? 1;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Расписание доставки по поставщикам: days — рабочие дни недели (1=Пн...7=Вс, null = каждый день),
// excludeDay — день недели, когда поставщик НЕ работает (для "каждый день кроме вторника"), deadline — крайний час приёма заказа
const SUPPLIERS = {
  'Метро':       { days: [1,2,3,4,5], excludeDay: null, deadline: 20 },
  'Винокуров':   { days: [1,2,3,4,5], excludeDay: null, deadline: 16 },
  'Трэс Кома':   { days: [1,2,3,4,5], excludeDay: null, deadline: 16 },
  'Титан Групп': { days: [1,2,3,4,5], excludeDay: null, deadline: 16 },
  'Чернова':     { days: [1,2,3,4,5,6,7], excludeDay: 2, deadline: 20 },
  'Agrobar':     { days: [1,2,3,4,5], excludeDay: null, deadline: 16 },
  'Озон':        { days: [1,2,3,4,5,6,7], excludeDay: null, deadline: 23 },
  'Herbarista':  { days: [1,2,3,4,5], excludeDay: null, deadline: 16 },
  'Новиков (чай)':     { days: [1,2,3,4,5], excludeDay: null, deadline: 19 },
  'Макеев (кофе)':      { days: [1,2,3,4,5], excludeDay: null, deadline: 16 },
};

const WEEKDAY_NAMES = ['', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

function getJsWeekday(date) {
  // JS: 0=Вс..6=Сб -> переводим в 1=Пн..7=Вс
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

function formatSupplierSchedule(supplierName) {
  const sched = SUPPLIERS[supplierName];
  if (!sched) return null;
  let daysLabel;
  if (sched.excludeDay) {
    daysLabel = `каждый день, кроме ${WEEKDAY_NAMES[sched.excludeDay]}`;
  } else if (sched.days.length === 7) {
    daysLabel = 'каждый день';
  } else if (sched.days.length === 5 && sched.days.every(d => d <= 5)) {
    daysLabel = 'будни';
  } else {
    daysLabel = sched.days.map(d => WEEKDAY_NAMES[d]).join(', ');
  }
  return `${daysLabel} до ${sched.deadline}:00`;
}

// Возвращает { ok: true } если сейчас ещё успеть отправить заказ, иначе { ok: false, reason }
function getSupplierDeadlineStatus(supplierName, now) {
  const sched = SUPPLIERS[supplierName];
  if (!sched) return { ok: true };
  const weekday = getJsWeekday(now);
  const isWorkingDay = sched.excludeDay ? weekday !== sched.excludeDay : sched.days.includes(weekday);
  if (!isWorkingDay) return { ok: false, reason: 'Сегодня поставщик не работает' };
  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour >= sched.deadline) return { ok: false, reason: `Приём закрыт — был до ${sched.deadline}:00` };
  return { ok: true };
}

const INITIAL_CATALOG = [
  { id: 'p001', name: 'Молоко 3,2% Ekoniva', unit: 'шт', minOrder: 12, category: 'Молоко и сливки', supplier: 'Метро' },
  { id: 'p002', name: 'Молоко безлактозное 1,8% Parmalat', unit: 'шт', minOrder: 12, category: 'Молоко и сливки', supplier: 'Метро' },
  { id: 'p003', name: 'Молоко 5yes кокосовое', unit: 'шт', minOrder: 6, category: 'Молоко и сливки', supplier: 'Винокуров' },
  { id: 'p004', name: 'Молоко 5yes банановое', unit: 'шт', minOrder: 6, category: 'Молоко и сливки', supplier: 'Винокуров' },
  { id: 'p005', name: 'Молоко 5yes овсяное', unit: 'шт', minOrder: 6, category: 'Молоко и сливки', supplier: 'Винокуров' },
  { id: 'p006', name: 'Молоко 5yes миндальное', unit: 'шт', minOrder: 6, category: 'Молоко и сливки', supplier: 'Винокуров' },
  { id: 'p007', name: 'Сливки 10% Ekoniva', unit: 'шт', minOrder: 12, category: 'Молоко и сливки', supplier: 'Метро' },
  { id: 'p008', name: 'Сливки 33% Петмол', unit: 'шт', minOrder: 12, category: 'Молоко и сливки', supplier: 'Метро' },
  { id: 'p009', name: 'Вода 0,5 газированная Святой источник', unit: 'шт', minOrder: 12, category: 'Напитки', supplier: 'Чернова' },
  { id: 'p010', name: 'Пюре Клубника Agrobar', unit: 'кг', minOrder: 1, category: 'Пюре', supplier: 'Agrobar' },
  { id: 'p011', name: 'Пюре Малина Agrobar', unit: 'кг', minOrder: 1, category: 'Пюре', supplier: 'Agrobar' },
  { id: 'p012', name: 'Пюре Брусника Agrobar', unit: 'кг', minOrder: 1, category: 'Пюре', supplier: 'Agrobar' },
  { id: 'p013', name: 'Пюре Манго Agrobar', unit: 'кг', minOrder: 1, category: 'Пюре', supplier: 'Agrobar' },
  { id: 'p014', name: 'Пюре Маракуйя (без семечек) Agrobar', unit: 'кг', minOrder: 1, category: 'Пюре', supplier: 'Agrobar' },
  { id: 'p015', name: 'Пюре Лайм Agrobar', unit: 'кг', minOrder: 1, category: 'Пюре', supplier: 'Agrobar' },
  { id: 'p016', name: 'Пюре Черная смородина Agrobar', unit: 'кг', minOrder: 1, category: 'Пюре', supplier: 'Agrobar' },
  { id: 'p017', name: 'Пюре Черника Agrobar', unit: 'кг', minOrder: 1, category: 'Пюре', supplier: 'Agrobar' },
  { id: 'p018', name: 'Сахар песок белый', unit: 'кг', minOrder: 1, category: 'Сахар', supplier: 'Чернова' },
  { id: 'p019', name: 'Сахар коричневый (Демерара)', unit: 'кг', minOrder: 1, category: 'Сахар', supplier: 'Чернова' },
  { id: 'p020', name: 'Сахарная пудра', unit: 'кг', minOrder: 1, category: 'Сахар', supplier: 'Чернова' },
  { id: 'p021', name: 'Сироп Herbarista карамель', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Herbarista' },
  { id: 'p022', name: 'Сироп Herbarista соленая карамель', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Herbarista' },
  { id: 'p023', name: 'Сироп Herbarista ваниль бурбон', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Herbarista' },
  { id: 'p024', name: 'Сироп Herbarista персик', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Herbarista' },
  { id: 'p025', name: 'Сироп Herbarista кокос', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Herbarista' },
  { id: 'p026', name: 'Сироп Herbarista шоколад', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Herbarista' },
  { id: 'p027', name: 'Сироп Herbarista ежевика с листьями', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Herbarista' },
  { id: 'p028', name: 'Сироп Herbarista лесной орех', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Herbarista' },
  { id: 'p029', name: 'Сироп Herbarista миндаль', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Herbarista' },
  { id: 'p030', name: 'Сироп Herbarista попкорн', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Herbarista' },
  { id: 'p031', name: 'Чай Байховый', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p032', name: 'Чай Золотой бергамот', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p033', name: 'Чай Кавказский', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p034', name: 'Чай Сливочный улун с османтусом', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p035', name: 'Чай Габа янтарная', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p036', name: 'Чай Садовые ягоды', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p037', name: 'Чай Алтайский сбор', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p038', name: 'Чай Весенний', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p039', name: 'Чай Шен Пуэр', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p040', name: 'Чай Шу Пуэр', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p041', name: 'Чай Мята сушёная', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p042', name: 'Чай Липа сушёная', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p043', name: 'Чай Чабрец сушёный', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p044', name: 'Чай Гречишный (ку цяо)', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p045', name: 'Чай Жасминовый (моли хуа ча)', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p046', name: 'Концентрат груша-пюре Spoom', unit: 'шт', minOrder: 1, category: 'Пюре', supplier: 'Озон' },
  { id: 'p047', name: 'Концентрат гранат', unit: 'шт', minOrder: 1, category: 'Пюре', supplier: 'Озон' },
  { id: 'p048', name: 'Концентрат черная смородина', unit: 'шт', minOrder: 1, category: 'Пюре', supplier: 'Озон' },
  { id: 'p049', name: 'Урбеч миндальный', unit: 'шт', minOrder: 1, category: 'Другое', supplier: 'Кавказ' },
  { id: 'p050', name: 'Цикорий Баноффи', unit: 'кг', minOrder: 1, category: 'Другое', supplier: 'Озон' },
  { id: 'p051', name: 'Матча премиальная (Лун Цзин)', unit: 'кг', minOrder: 0.25, category: 'Чай', supplier: 'Новиков (чай)' },
  { id: 'p052', name: 'Какао порошок Barry', unit: 'кг', minOrder: 1, category: 'Другое', supplier: 'Озон' },
  { id: 'p053', name: 'Молочный шоколад Sicao', unit: 'кг', minOrder: 1, category: 'Другое', supplier: 'Чернова' },
  { id: 'p054', name: 'Темный шоколад Sicao', unit: 'кг', minOrder: 1, category: 'Другое', supplier: 'Чернова' },
  { id: 'p055', name: 'Нутелла 3 кг', unit: 'шт', minOrder: 1, category: 'Другое', supplier: 'Чернова' },
  { id: 'p056', name: 'Мороженое сливочное 2,5 кг', unit: 'шт', minOrder: 1, category: 'Заморозка и десерты', supplier: 'Метро' },
  { id: 'p057', name: 'Апельсины для сока', unit: 'кг', minOrder: 10, category: 'Фрукты и ягоды', supplier: 'Чернова' },
  { id: 'p058', name: 'Лайм свежий', unit: 'кг', minOrder: 0.5, category: 'Фрукты и ягоды', supplier: 'Чернова' },
  { id: 'p059', name: 'Лимоны свежие', unit: 'кг', minOrder: 0.5, category: 'Фрукты и ягоды', supplier: 'Чернова' },
  { id: 'p060', name: 'Клубника свежая', unit: 'кг', minOrder: 0.5, category: 'Фрукты и ягоды', supplier: 'Чернова' },
  { id: 'p061', name: 'Ароматизатор Дюшес', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Озон' },
  { id: 'p062', name: 'Ароматизатор Карамель', unit: 'шт', minOrder: 1, category: 'Сиропы и ароматизаторы', supplier: 'Озон' },
  { id: 'p063', name: 'Сгущённое молоко в мягкой упаковке Рогачевъ', unit: 'шт', minOrder: 1, category: 'Другое', supplier: 'Метро' },
  { id: 'p064', name: 'Печенье Любятово шоколадное', unit: 'шт', minOrder: 1, category: 'Снеки', supplier: 'Чернова' },
  { id: 'p065', name: 'Баллоны для сифона', unit: 'шт', minOrder: 1, category: 'Расходники', supplier: 'Озон' },
  { id: 'p066', name: 'Халва Алматинская подсолнечная', unit: 'шт', minOrder: 1, category: 'Снеки', supplier: 'Чернова' },
  { id: 'p067', name: 'Вода Petroglyph с газом 0,375', unit: 'шт', minOrder: 12, category: 'Напитки', supplier: 'Трэс Кома' },
  { id: 'p068', name: 'Вода Petroglyph без газа 0,375', unit: 'шт', minOrder: 12, category: 'Напитки', supplier: 'Трэс Кома' },
  { id: 'p069', name: 'Вода Petroglyph без газа 0,750', unit: 'шт', minOrder: 12, category: 'Напитки', supplier: 'Трэс Кома' },
  { id: 'p070', name: 'Кинза Кола', unit: 'шт', minOrder: 24, category: 'Напитки', supplier: 'Титан Групп' },
  { id: 'p071', name: 'Кинза Гранат', unit: 'шт', minOrder: 24, category: 'Напитки', supplier: 'Титан Групп' },
  { id: 'p072', name: 'Кинза Цитрус', unit: 'шт', minOrder: 24, category: 'Напитки', supplier: 'Титан Групп' },
  { id: 'p073', name: 'Кинза Смородина', unit: 'шт', minOrder: 24, category: 'Напитки', supplier: 'Титан Групп' },
  { id: 'p074', name: 'Кинза Апельсин', unit: 'шт', minOrder: 24, category: 'Напитки', supplier: 'Титан Групп' },
  { id: 'p075', name: 'Кинза Лимон', unit: 'шт', minOrder: 24, category: 'Напитки', supplier: 'Титан Групп' },
  { id: 'p076', name: 'Мёд цветочный', unit: 'шт', minOrder: 1, category: 'Другое', supplier: 'Метро' },
  { id: 'p077', name: 'Твикс батончик экстра', unit: 'шт', minOrder: 1, category: 'Снеки', supplier: 'Чернова' },
  { id: 'p078', name: 'Сникерс батончик экстра', unit: 'шт', minOrder: 1, category: 'Снеки', supplier: 'Чернова' },
  { id: 'p079', name: 'Тоник Rich', unit: 'шт', minOrder: 1, category: 'Напитки', supplier: 'Метро' },
  { id: 'p080', name: 'Тоник Chillout', unit: 'шт', minOrder: 1, category: 'Напитки', supplier: 'Метро' },
  { id: 'p081', name: 'Мармелад для лимонадов', unit: 'кг', minOrder: 1, category: 'Другое', supplier: 'Озон' },
  { id: 'p082', name: 'Кинза Кола без сахара', unit: 'шт', minOrder: 24, category: 'Напитки', supplier: 'Титан Групп' },
  { id: 'p083', name: 'Кофе Макеев', unit: 'кг', minOrder: 1, category: 'Другое', supplier: 'Макеев (кофе)' },
  { id: 'p084', name: 'Зерно эспрессо Колумбия Хайро Арсила', unit: 'кг', minOrder: 1, category: 'Другое', supplier: 'Макеев (кофе)' },
  { id: 'p085', name: 'Зерно эспрессо под молочко Эфиопия Сидамо', unit: 'кг', minOrder: 1, category: 'Другое', supplier: 'Макеев (кофе)' },
  { id: 'p086', name: 'Декаф', unit: 'кг', minOrder: 0.25, category: 'Другое', supplier: 'Макеев (кофе)' },
  { id: 'p087', name: 'Фильтр кофе', unit: 'кг', minOrder: 0.25, category: 'Другое', supplier: 'Макеев (кофе)' },
].sort((a, b) => a.name.localeCompare(b.name, 'ru'));

const CATEGORY_ORDER = ['Молоко и сливки', 'Напитки', 'Фрукты и ягоды', 'Пюре', 'Сахар', 'Сиропы и ароматизаторы', 'Чай', 'Заморозка и десерты', 'Снеки', 'Расходники', 'Другое'];

// Каждой категории — номер раздела, акцентный цвет и иконка, дерзкая неоновая тема
const CATEGORY_META = {
  'Молоко и сливки':        { num: '01', accent: '#CCFF00', icon: '🥛' },
  'Напитки':                 { num: '02', accent: '#00D9FF', icon: '🥤' },
  'Фрукты и ягоды':           { num: '03', accent: '#FF3D81', icon: '🍓' },
  'Пюре':                     { num: '04', accent: '#FF6B35', icon: '🍑' },
  'Сахар':                    { num: '05', accent: '#FFE600', icon: '🍬' },
  'Сиропы и ароматизаторы':   { num: '06', accent: '#B967FF', icon: '🍯' },
  'Чай':                      { num: '07', accent: '#00E5A0', icon: '🍵' },
  'Заморозка и десерты':      { num: '08', accent: '#00D9FF', icon: '🍨' },
  'Снеки':                    { num: '09', accent: '#FFB800', icon: '🍪' },
  'Расходники':               { num: '10', accent: '#8A8A9A', icon: '📦' },
  'Другое':                   { num: '11', accent: '#B967FF', icon: '✦' },
};

function formatDate(iso) {
  const d = new Date(iso);
  const str = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  // Делаем первую букву заглавной, остальное — как есть (месяц уже строчной в ru-RU)
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTimeOnly(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

const GREETINGS = [
  { main: 'Привет, бариста!', sub: 'Кофе уже ждёт — и ты точно справишься ☕' },
  { main: 'Рады тебя видеть!', sub: 'Ты — лучшая часть визита для наших гостей' },
  { main: 'Снова в деле!', sub: 'Стойка сама себя не откроет — но ты справишься' },
  { main: 'Привет, мастер!', sub: 'Руки к работе, сердце к людям ☕' },
  { main: 'Бариста онлайн!', sub: 'Всё пройдёт вкусно и без ошибок' },
  { main: 'Добро пожаловать!', sub: 'Загружаем твои суперспособности...' },
  { main: 'Привет, звезда!', sub: 'Гости уже соскучились по твоему кофе' },
  { main: 'Начнём?', sub: 'Скоро тут будет вкусно — и всё благодаря тебе 🌟' },
  { main: 'Ты сегодня огонь!', sub: 'Даже кофемашина это чувствует ☕' },
  { main: 'Привет!', sub: 'Каждая чашка — это маленький шедевр' },
];

const SPLASH = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

function BaristaOrders() {
  const [catalog, setCatalog] = useState([]);
  const [cart, setCart] = useState({});
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [supplierBannerDismissed, setSupplierBannerDismissed] = useState(false);
  const [view, setView] = useState('order');
  const [baristaName, setBaristaName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [askingName, setAskingName] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [savedPin, setSavedPin] = useState('2222');
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('кг');
  const [newCategory, setNewCategory] = useState('Другое');
  const [newSupplier, setNewSupplier] = useState('Основной поставщик');
  const [activeCategory, setActiveCategory] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastSentOrder, setLastSentOrder] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY || document.documentElement.scrollTop || 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const c = await window.storage.get('catalog', true);
        if (c) {
          const saved = JSON.parse(c.value);
          const savedIds = new Set(saved.map(p => p.id));
          const newItems = INITIAL_CATALOG.filter(p => !savedIds.has(p.id));
          if (newItems.length > 0) {
            const merged = [...saved, ...newItems].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
            setCatalog(merged);
            try { await window.storage.set('catalog', JSON.stringify(merged), true); } catch (e) {}
          } else {
            setCatalog(saved);
          }
        } else {
          setCatalog(INITIAL_CATALOG);
          try { await window.storage.set('catalog', JSON.stringify(INITIAL_CATALOG), true); } catch (e) {}
        }
      } catch (e) {
        setCatalog(INITIAL_CATALOG);
        try { await window.storage.set('catalog', JSON.stringify(INITIAL_CATALOG), true); } catch (e2) {}
      }
      try {
        const o = await window.storage.get('orders', true);
        setOrders(o ? JSON.parse(o.value) : []);
      } catch (e) {
        setOrders([]);
      }
      try {
        const n = await window.storage.get('baristaName', false);
        if (n && n.value) setBaristaName(n.value);
        else setAskingName(true);
      } catch (e) {
        setAskingName(true);
      }
      try {
        const p = await window.storage.get('statsPin', true);
        if (p && p.value) setSavedPin(p.value);
      } catch (e) {}
      try {
        const draft = await window.storage.get('cartDraft', true);
        if (draft && draft.value) {
          const parsed = JSON.parse(draft.value);
          if (Object.keys(parsed).length > 0) {
            setCart(parsed);
          }
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 2000));
      setLoading(false);
    })();
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      window.storage.set('cartDraft', JSON.stringify(cart), true);
    } catch (e) {}
  }, [cart, loading]);

  const saveName = async () => {
    const name = nameInput.trim();
    if (!name) return;
    setBaristaName(name);
    setAskingName(false);
    try { await window.storage.set('baristaName', name, false); } catch (e) {}
    showToast(`Привет, ${name}! 👋`);
  };

  const handlePinDigit = (digit) => {
    vibrate(6);
    const next = pinInput + digit;
    setPinInput(next);
    setPinError(false);
    if (next.length === 4) {
      if (next === savedPin) {
        setPinUnlocked(true);
        setPinInput('');
        vibrate([10, 60, 20]);
      } else {
        setPinError(true);
        vibrate([20, 60, 20, 60, 20]);
        setTimeout(() => { setPinInput(''); setPinError(false); }, 600);
      }
    }
  };

  const handlePinDelete = () => {
    vibrate(4);
    setPinInput(prev => prev.slice(0, -1));
    setPinError(false);
  };

  const saveNewPin = async () => {
    const pin = newPinInput.trim();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      showToast('Введите ровно 4 цифры');
      return;
    }
    setSavedPin(pin);
    setNewPinInput('');
    setShowChangePinModal(false);
    try { await window.storage.set('statsPin', pin, true); } catch (e) {}
    showToast('Пин-код изменён');
  };

  const saveCatalog = async (next) => {
    setCatalog(next);
    try { await window.storage.set('catalog', JSON.stringify(next), true); }
    catch (e) { showToast('Не удалось сохранить список товаров'); }
  };

  const saveOrders = async (next) => {
    setOrders(next);
    try { await window.storage.set('orders', JSON.stringify(next), true); }
    catch (e) { showToast('Не удалось сохранить заявку'); }
  };

  const filtered = catalog.filter(p =>
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const exactMatch = catalog.some(
    p => p.name.toLowerCase() === query.trim().toLowerCase()
  );

  const categoriesMap = catalog.reduce((acc, p) => {
    const cat = p.category || 'Другое';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categoryList = Object.keys(categoriesMap).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const activeCategoryItems = activeCategory ? categoriesMap[activeCategory] || [] : [];

  const addProductToCatalog = async () => {
    const name = newName.trim();
    if (!name) return;
    if (catalog.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      showToast('Такой товар уже есть');
      return;
    }
    const product = { id: uid(), name, unit: newUnit, minOrder: 1, category: newCategory, supplier: newSupplier.trim() || 'Основной поставщик' };
    const next = [...catalog, product].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    await saveCatalog(next);
    setNewName('');
    setAddingNew(false);
    addToCart(product);
    showToast(`«${name}» добавлен в список`);
  };

  const vibrate = (pattern = 10) => {
    try { navigator.vibrate?.(pattern); } catch (e) {}
  };

  const addToCart = (product) => {
    setCart(prev => {
      if (prev[product.id]) return prev;
      const step = getStep(product);
      vibrate(12);
      return { ...prev, [product.id]: { ...product, amount: step } };
    });
  };

  const changeAmount = (id, delta) => {
    setCart(prev => {
      const item = prev[id];
      if (!item) return prev;
      const step = getStep(item);
      const next = Math.max(step, Math.round((item.amount + delta * step) * 100) / 100);
      vibrate(6);
      return { ...prev, [id]: { ...item, amount: next } };
    });
  };

  const setAmount = (id, value) => {
    const num = parseFloat(value.replace(',', '.'));
    setCart(prev => {
      const item = prev[id];
      if (!item) return prev;
      return { ...prev, [id]: { ...item, amount: isNaN(num) ? 0 : num } };
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const toggleUrgent = (id) => {
    setCart(prev => {
      const item = prev[id];
      if (!item) return prev;
      const nowUrgent = !item.urgent;
      vibrate(nowUrgent ? [10, 60, 20] : 8);
      return { ...prev, [id]: { ...item, urgent: nowUrgent } };
    });
  };

  const repeatOrder = (order) => {
    setCart(prev => {
      const next = { ...prev };
      order.items.forEach(item => {
        if (!next[item.id]) {
          next[item.id] = { ...item, urgent: false };
        }
      });
      return next;
    });
    setView('cart');
    showToast(`${order.items.length} позиций добавлено в корзину`);
  };

  const [copied, setCopied] = useState(false);

  const exportOrderText = (order) => {
    if (!order) return;
    const bySupplier = order.items.reduce((acc, it) => {
      const sup = it.supplier || 'Основной поставщик';
      if (!acc[sup]) acc[sup] = [];
      acc[sup].push(it);
      return acc;
    }, {});
    const supplierList = Object.keys(bySupplier).sort((a, b) => a.localeCompare(b, 'ru'));
    const sched = SUPPLIERS;
    const date = formatDate(order.createdAt);
    const time = formatTimeOnly(order.createdAt);
    let text = `📋 *Заказ* — ${date}, ${time}\n`;
    supplierList.forEach(sup => {
      text += `\n*${sup.toUpperCase()}*\n`;
      bySupplier[sup].forEach((it, i) => {
        const urgent = it.urgent ? ' 🚩' : '';
        text += `${i + 1}. ${it.name} — *${it.amount} ${it.unit}*${urgent}\n`;
      });
    });
    return text;
  };

  const copyToClipboard = async () => {
    const text = exportOrderText(lastSentOrder);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Скопировано!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      showToast('Не удалось скопировать');
    }
  };

  const cartItems = Object.values(cart);

  const nowForBanner = new Date();
  const todayWeekday = getJsWeekday(nowForBanner);
  const todayHour = nowForBanner.getHours() + nowForBanner.getMinutes() / 60;
  const WEEKDAY_FULL = ['', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
  const todayName = WEEKDAY_FULL[todayWeekday];

  const supplierAlerts = Object.entries(SUPPLIERS).map(([name, sched]) => {
    const isWorkingDay = sched.excludeDay
      ? todayWeekday !== sched.excludeDay
      : sched.days.includes(todayWeekday);
    if (!isWorkingDay) return { name, status: 'off', msg: 'не работает сегодня' };
    if (todayHour >= sched.deadline) return { name, status: 'closed', msg: `приём закрыт (был до ${sched.deadline}:00)` };
    if (todayHour >= sched.deadline - 1) return { name, status: 'soon', msg: `приём закроется в ${sched.deadline}:00` };
    return null;
  }).filter(Boolean);

  const criticalAlerts = supplierAlerts.filter(a => a.status === 'off' || a.status === 'closed');
  const warnAlerts = supplierAlerts.filter(a => a.status === 'soon');

  const cartBySupplier = cartItems.reduce((acc, item) => {
    const sup = item.supplier || 'Основной поставщик';
    if (!acc[sup]) acc[sup] = [];
    acc[sup].push(item);
    return acc;
  }, {});
  const cartSupplierList = Object.keys(cartBySupplier).sort((a, b) => a.localeCompare(b, 'ru'));
  const now = new Date();

  const sentBySupplier = lastSentOrder ? lastSentOrder.items.reduce((acc, item) => {
    const sup = item.supplier || 'Основной поставщик';
    if (!acc[sup]) acc[sup] = [];
    acc[sup].push(item);
    return acc;
  }, {}) : {};
  const sentSupplierList = Object.keys(sentBySupplier).sort((a, b) => a.localeCompare(b, 'ru'));

  const renderProductRow = (p) => {
    const inCart = cart[p.id];
    if (inCart) {
      return (
        <div key={p.id} style={{ ...styles.resultRowActive, ...(inCart.urgent ? styles.resultRowUrgent : {}) }}>
          <div style={styles.resultActiveTop}>
            <span style={styles.resultName}>{p.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => toggleUrgent(p.id)}
                style={{ ...styles.flagBtn, ...(inCart.urgent ? styles.flagBtnActive : {}) }}
                aria-label="Срочно"
              >
                <Flag size={13} color={inCart.urgent ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} fill={inCart.urgent ? '#FFFFFF' : 'none'} />
              </button>
              <button onClick={() => removeFromCart(p.id)} style={styles.removeBtn}>
                <X size={15} color="#6B6B7A" />
              </button>
            </div>
          </div>
          <div style={styles.resultActiveBottom}>
            <button onClick={() => changeAmount(p.id, -1)} style={styles.stepBtn}>
              <Minus size={15} color="#CCFF00" />
            </button>
            <input
              value={inCart.amount}
              onChange={e => setAmount(p.id, e.target.value)}
              style={styles.amountInput}
              inputMode="decimal"
            />
            <span style={styles.unitLabel}>{p.unit}</span>
            <button onClick={() => changeAmount(p.id, 1)} style={styles.stepBtn}>
              <Plus size={15} color="#CCFF00" />
            </button>
          </div>
        </div>
      );
    }
    return (
      <button key={p.id} onClick={() => { addToCart(p); }} style={styles.resultRow}>
        <span style={styles.resultName}>{p.name}</span>
        <span style={styles.resultMeta}>
          <span style={styles.unitTag}>
            {p.minOrder && p.minOrder > 1 ? `от ${p.minOrder} ${p.unit}` : p.unit}
          </span>
          <Plus size={16} color="#A0907A" />
        </span>
      </button>
    );
  };

  const playApplePaySound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.35, ctx.currentTime);
      master.connect(ctx.destination);
      const playTone = (freq, startTime, duration, vol = 1) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(master);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration + 0.05);
      };
      // Apple Pay: два коротких высоких тона — ре и фа#
      playTone(1318, 0, 0.18);       // E6 — первый удар
      playTone(1568, 0.16, 0.28);    // G6 — второй удар выше
      playTone(2093, 0.3, 0.22, 0.4); // C7 — лёгкий финальный обертон
      setTimeout(() => ctx.close(), 1200);
    } catch (e) {}
  };

  const sendOrder = async () => {
    if (cartItems.length === 0) return;
    const order = {
      id: uid(),
      createdAt: new Date().toISOString(),
      items: cartItems.map(({ id, name, unit, amount, urgent, supplier }) => ({ id, name, unit, amount, urgent: !!urgent, supplier: supplier || 'Основной поставщик' })),
    };
    const next = [order, ...orders];
    await saveOrders(next);
    vibrate([15, 80, 15, 80, 30]);
    playApplePaySound();
    setCart({});
    setQuery('');
    setLastSentOrder(order);
    setView('receipt');
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 30% 60%, rgba(204,255,0,0.06) 0%, #060608 60%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        padding: '0 32px',
        textAlign: 'center',
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
          @keyframes logoGlow {
            0%,100%{filter:drop-shadow(0 0 18px rgba(204,255,0,0.5))}
            50%{filter:drop-shadow(0 0 40px rgba(204,255,0,0.9))}
          }
          @keyframes greetFadeIn {
            from{opacity:0;transform:translateY(20px)}
            to{opacity:1;transform:translateY(0)}
          }
          @keyframes subFadeIn {
            from{opacity:0;transform:translateY(12px)}
            to{opacity:0.6;transform:translateY(0)}
          }
          @keyframes dotPulse {
            0%,80%,100%{transform:scale(0.6);opacity:0.3}
            40%{transform:scale(1);opacity:1}
          }
        `}</style>
        <svg viewBox="0 0 64 64" style={{ width: 72, height: 72, marginBottom: 36, animation: 'logoGlow 2.5s ease-in-out infinite' }}>
          <circle cx="32" cy="32" r="30" fill="rgba(204,255,0,0.08)" stroke="rgba(204,255,0,0.4)" strokeWidth="1.5"/>
          <text x="32" y="44" textAnchor="middle" fontSize="30">☕</text>
        </svg>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 34,
          fontWeight: 700,
          color: '#CCFF00',
          lineHeight: 1.2,
          marginBottom: 16,
          animation: 'greetFadeIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
          textShadow: '0 0 40px rgba(204,255,0,0.6), 0 2px 8px rgba(0,0,0,0.8)',
          letterSpacing: '-0.5px',
        }}>
          {baristaName ? `Привет, ${baristaName}!` : SPLASH.main}
        </div>

        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 17,
          fontWeight: 500,
          color: '#FFFFFF',
          lineHeight: 1.55,
          maxWidth: 290,
          animation: 'subFadeIn 0.8s ease 0.6s both',
          textShadow: '0 1px 6px rgba(0,0,0,0.9)',
        }}>
          {SPLASH.sub}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 52 }}>
          {[0, 0.2, 0.4].map((delay, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#CCFF00',
              animation: `dotPulse 1.4s ease-in-out ${delay}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (askingName) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 60% 30%, rgba(204,255,0,0.07) 0%, #060608 60%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '0 28px',
      }}>
        <style>{`
          @keyframes nameIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        <div style={{ fontSize: 48, marginBottom: 20 }}>☕</div>

        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 26, fontWeight: 700,
          color: '#CCFF00', textAlign: 'center',
          marginBottom: 8,
          animation: 'nameIn 0.6s ease both',
        }}>
          Как тебя зовут?
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 14, color: 'rgba(245,247,250,0.5)',
          textAlign: 'center', marginBottom: 32,
          animation: 'nameIn 0.6s ease 0.15s both',
        }}>
          Напишем имя один раз — и будем обращаться лично
        </div>

        <input
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && saveName()}
          placeholder="Твоё имя"
          autoFocus
          style={{
            width: '100%', maxWidth: 320,
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(204,255,0,0.4)',
            borderRadius: 20, padding: '16px 20px',
            fontSize: 18, fontFamily: "'Inter', sans-serif",
            fontWeight: 500, color: '#F5F7FA',
            outline: 'none', textAlign: 'center',
            marginBottom: 16,
            animation: 'nameIn 0.6s ease 0.25s both',
          }}
        />
        <button
          onClick={saveName}
          disabled={!nameInput.trim()}
          style={{
            width: '100%', maxWidth: 320,
            border: 'none',
            background: nameInput.trim() ? '#CCFF00' : 'rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '15px',
            fontSize: 15, fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, color: nameInput.trim() ? '#0A0A0F' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.2s',
            boxShadow: nameInput.trim() ? '0 0 24px rgba(204,255,0,0.35)' : 'none',
            animation: 'nameIn 0.6s ease 0.35s both',
          }}
        >
          Начать работу →
        </button>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes slideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes popIn { from{transform:scale(.94);opacity:0} to{transform:scale(1);opacity:1} }
        * { box-sizing: border-box; }
        input::placeholder { color: #6B6B7A; }
        button { font-family: inherit; cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #D9C2F5; border-radius: 3px; }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 520,
            height: 520,
            borderRadius: '50%',
            left: '50%',
            top: `${-260 + (scrollY * 0.35) % 900}px`,
            transform: `translateX(calc(-50% + ${Math.sin(scrollY / 180) * 90}px))`,
            background: 'radial-gradient(circle, rgba(204,255,0,0.32) 0%, rgba(204,255,0,0.12) 45%, rgba(204,255,0,0) 70%)',
            filter: 'blur(10px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 420,
            height: 420,
            borderRadius: '50%',
            right: '8%',
            top: `${120 + (scrollY * 0.55) % 1200}px`,
            transform: `translateX(${Math.cos(scrollY / 160) * 70}px)`,
            background: 'radial-gradient(circle, rgba(204,255,0,0.22) 0%, rgba(204,255,0,0.08) 50%, rgba(204,255,0,0) 72%)',
            filter: 'blur(14px)',
          }}
        />
      </div>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={styles.headerLabel}>Заявка на закупку</p>
              <h1 style={styles.headerTitle}>стойка</h1>
            </div>
            {baristaName && (
              <button
                onClick={() => { setNameInput(baristaName); setAskingName(true); }}
                style={styles.nameChip}
              >
                <span style={styles.nameChipText}>{baristaName}</span>
                <span style={styles.nameChipEdit}>✎</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <button
            onClick={() => { setView('order'); setPinUnlocked(false); setPinInput(''); }}
            style={{ ...styles.navBtn, ...(view === 'order' ? styles.navBtnActive : {}) }}
          >
            Поиск
          </button>
          <button
            onClick={() => { setView('history'); setPinUnlocked(false); setPinInput(''); }}
            style={{ ...styles.navBtn, ...(view === 'history' ? styles.navBtnActive : {}) }}
          >
            История
          </button>
          <button
            onClick={() => setView('stats')}
            style={{ ...styles.navBtn, ...(view === 'stats' ? styles.navBtnActive : {}) }}
          >
            Статистика
          </button>
          <button
            onClick={() => { setView('suppliers'); setPinUnlocked(false); setPinInput(''); }}
            style={{ ...styles.navBtn, ...(view === 'suppliers' ? styles.navBtnActive : {}) }}
          >
            График
          </button>
          <button
            onClick={() => { setView('cart'); setPinUnlocked(false); setPinInput(''); }}
            style={{ ...styles.navBtn, ...styles.navBtnCart, ...(view === 'cart' ? styles.navBtnActive : {}) }}
          >
            Корзина
            {cartItems.length > 0 && (
              <span style={{ ...styles.navCartBadge, ...(cartItems.some(i => i.urgent) ? styles.navCartBadgeUrgent : {}) }}>
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </nav>
      {!supplierBannerDismissed && supplierAlerts.length > 0 && (
        <div style={{
          ...styles.supplierBanner,
          background: criticalAlerts.length > 0
            ? 'rgba(255,61,90,0.12)'
            : 'rgba(255,184,0,0.1)',
          borderColor: criticalAlerts.length > 0
            ? 'rgba(255,61,90,0.4)'
            : 'rgba(255,184,0,0.4)',
        }}>
          <div style={styles.supplierBannerTop}>
            <span style={{
              ...styles.supplierBannerTitle,
              color: criticalAlerts.length > 0 ? '#FF3D5A' : '#FFB800',
            }}>
              {criticalAlerts.length > 0 ? '⚠️ Сегодня ' + todayName : '⏰ Скоро закроется приём'}
            </span>
            <button
              onClick={() => setSupplierBannerDismissed(true)}
              style={styles.supplierBannerClose}
            >
              <X size={14} color="#8A8A9A" />
            </button>
          </div>
          <div style={styles.supplierBannerList}>
            {[...criticalAlerts, ...warnAlerts].map(a => (
              <div key={a.name} style={styles.supplierBannerRow}>
                <span style={{
                  ...styles.supplierBannerName,
                  color: a.status === 'soon' ? '#FFB800' : '#FF3D5A',
                }}>
                  {a.status === 'off' ? '✕' : a.status === 'closed' ? '✕' : '!'}
                </span>
                <span style={styles.supplierBannerText}>
                  <span style={styles.supplierBannerSupName}>{a.name}</span>
                  {' — '}{a.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'receipt' && lastSentOrder ? (
        <main style={styles.main}>
          <button onClick={() => setView('order')} style={styles.backRow}>
            <ChevronLeft size={16} color="#CCFF00" />
            <span>К поиску</span>
          </button>

          <div style={styles.confirmBanner}>
            <Check size={16} color="#FFFFFF" />
            <span>Заказ отправлен</span>
          </div>

          <div style={styles.sheet}>
            <h2 style={styles.sheetTitle}>Лист заказа</h2>
            <div style={styles.sheetMeta}>
              {formatDate(lastSentOrder.createdAt)} · {formatTimeOnly(lastSentOrder.createdAt)}
            </div>

            {sentSupplierList.map((sup, supIdx) => (
              <div key={sup} style={styles.sheetSupplierBlock}>
                <div style={styles.sheetSupplierName}>{sup}</div>
                {formatSupplierSchedule(sup) && (
                  <div style={styles.sheetSupplierSchedule}>{formatSupplierSchedule(sup)}</div>
                )}
                <div style={styles.sheetItemsList}>
                  {sentBySupplier[sup].map((item, idx) => (
                    <div key={item.id} style={styles.sheetItemRow}>
                      <span style={styles.sheetItemIndex}>{idx + 1}.</span>
                      <span style={{ ...styles.sheetItemName, ...(item.urgent ? styles.sheetItemNameUrgent : {}) }}>
                        {item.urgent && <Flag size={15} color="#FF3D5A" fill="#FF3D5A" style={{ marginRight: 6, verticalAlign: -2, flexShrink: 0 }} />}
                        {item.name}
                      </span>
                      <span style={styles.sheetItemAmount}>{item.amount} {item.unit}</span>
                    </div>
                  ))}
                </div>
                {supIdx < sentSupplierList.length - 1 && <div style={styles.sheetDivider} />}
              </div>
            ))}
          </div>

          <button onClick={copyToClipboard} style={{ ...styles.copyBtn, ...(copied ? styles.copyBtnDone : {}) }}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Скопировано!' : 'Скопировать для Telegram'}
          </button>

          <button onClick={() => setView('order')} style={styles.newOrderBtn}>
            Начать новый заказ
          </button>
        </main>
      ) : view === 'cart' ? (
        <main style={styles.main}>
          <button onClick={() => setView('order')} style={styles.backRow}>
            <ChevronLeft size={16} color="#CCFF00" />
            <span>Назад к поиску</span>
          </button>

          <p style={styles.eyebrowSection}>Заказ</p>
          <h2 style={styles.sectionTitle}>
            {cartItems.length === 0 ? 'Пока пусто' : `${cartItems.length} ${cartItems.length === 1 ? 'позиция' : 'позиций'}`}
          </h2>
          {cartItems.length > 0 && (
            <div style={styles.draftBadge}>
              💾 Черновик сохранён
            </div>
          )}

          {cartItems.length === 0 ? (
            <div style={styles.emptyState}>
              <Package size={28} color="#D9C2F5" />
              <p style={styles.emptyText}>Найдите товар через поиск — то, что заканчивается</p>
            </div>
          ) : (
            <>
              <div style={styles.receipt}>
                <div style={styles.receiptHead}>
                  <span style={styles.receiptHeadDate}>{formatDate(now.toISOString())}</span>
                  <span style={styles.receiptHeadTime}>{formatTimeOnly(now.toISOString())}</span>
                </div>
                <div style={styles.receiptDashes} />

                {cartSupplierList.map(sup => {
                  const schedule = formatSupplierSchedule(sup);
                  const deadlineStatus = getSupplierDeadlineStatus(sup, now);
                  return (
                    <div key={sup} style={styles.receiptSupplierBlock}>
                      <div style={styles.receiptSupplierLabelRow}>
                        <div style={styles.receiptSupplierLabel}>
                          <span>{sup}</span>
                          <span style={styles.receiptSupplierCount}>
                            {cartBySupplier[sup].length} поз.
                          </span>
                        </div>
                        {schedule && (
                          <div style={styles.supplierSchedule}>Заказы принимаются: {schedule}</div>
                        )}
                        {schedule && !deadlineStatus.ok && (
                          <div style={styles.supplierScheduleLate}>{deadlineStatus.reason}</div>
                        )}
                      </div>
                      {cartBySupplier[sup].map(item => (
                        <div key={item.id} style={{ ...styles.cartRow, ...(item.urgent ? styles.cartRowUrgent : {}) }}>
                          <div style={styles.cartRowTop}>
                            <span style={styles.cartName}>{item.name}</span>
                          <div style={styles.cartRowTopActions}>
                            <button
                              onClick={() => toggleUrgent(item.id)}
                              style={{ ...styles.flagBtn, ...(item.urgent ? styles.flagBtnActive : {}) }}
                              aria-label="Срочно"
                            >
                              <Flag size={14} color={item.urgent ? '#FFFFFF' : 'rgba(255,255,255,0.8)'} fill={item.urgent ? '#FFFFFF' : 'none'} />
                            </button>
                            <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>
                              <X size={15} color="#6B6B7A" />
                            </button>
                          </div>
                        </div>
                        {item.urgent && <div style={styles.urgentLabel}>Срочно — нужно немедленно</div>}
                        <div style={styles.cartRowBottom}>
                          <span style={styles.cartAmountDisplay}>{item.amount} {item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  );
                })}
              </div>

              <button onClick={sendOrder} style={styles.sendBtnInline}>
                <Send size={18} />
                Отправить заказ
              </button>
            </>
          )}
        </main>
      ) : view === 'order' ? (
        <main style={styles.main}>
          <div style={styles.searchWrap}>
            <Search size={18} color="#CCFF00" style={{ flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); if (e.target.value.trim()) setActiveCategory(null); }}
              placeholder=""
              style={styles.searchInput}
            />
            {query && (
              <button onClick={() => setQuery('')} style={styles.clearBtn}>
                <X size={16} color="#CCFF00" />
              </button>
            )}
          </div>

          {query.trim() && (
            <div style={styles.resultsList}>
              {filtered.slice(0, 8).map(renderProductRow)}

              {!exactMatch && !addingNew && (
                <button onClick={() => { setNewName(query.trim()); setAddingNew(true); }} style={styles.newRow}>
                  <Plus size={16} color="#7C3AB5" />
                  <span>Добавить «{query.trim()}» как новый товар</span>
                </button>
              )}

              {filtered.length === 0 && !addingNew && exactMatch === false && (
                <div style={styles.emptyHint}>Товар не найден в списке</div>
              )}
            </div>
          )}

          {addingNew && (
            <div style={styles.newCard}>
              <div style={styles.newCardTitle}>Новый товар</div>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Точное название"
                style={styles.newCardInput}
                autoFocus
              />
              <div style={styles.newCardTitle}>Единица измерения</div>
              <div style={styles.unitRow}>
                {UNITS.map(u => (
                  <button
                    key={u}
                    onClick={() => setNewUnit(u)}
                    style={{ ...styles.unitChip, ...(newUnit === u ? styles.unitChipActive : {}) }}
                  >
                    {u}
                  </button>
                ))}
              </div>
              <div style={styles.newCardTitle}>Раздел</div>
              <div style={styles.unitRow}>
                {CATEGORY_ORDER.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewCategory(c)}
                    style={{ ...styles.unitChip, ...(newCategory === c ? styles.unitChipActive : {}) }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div style={styles.newCardTitle}>Поставщик</div>
              <input
                value={newSupplier}
                onChange={e => setNewSupplier(e.target.value)}
                placeholder="Например: Agrobar"
                style={styles.newCardInput}
              />
              <div style={styles.newCardActions}>
                <button onClick={() => setAddingNew(false)} style={styles.cancelBtn}>Отмена</button>
                <button onClick={addProductToCatalog} style={styles.confirmBtn}>Добавить в корзину</button>
              </div>
            </div>
          )}

          {!query.trim() && !addingNew && (
            activeCategory ? (
              <div style={styles.categoryDetail}>
                <button onClick={() => setActiveCategory(null)} style={styles.backRow}>
                  <ChevronLeft size={16} color="#CCFF00" />
                  <span>Все разделы</span>
                </button>
                <p style={styles.eyebrowSection}>Раздел</p>
                <h2 style={styles.sectionTitle}>{activeCategory}</h2>
                <div style={styles.resultsList}>
                  {activeCategoryItems.map(renderProductRow)}
                </div>
              </div>
            ) : (
              <>
                <h2 style={styles.sectionTitle}>Разделы</h2>
                <div style={styles.categoryGrid}>
                  {categoryList.map(cat => {
                    const items = categoriesMap[cat];
                    const inCartCount = items.filter(p => cart[p.id]).length;
                    const meta = CATEGORY_META[cat] || { num: '—', accent: '#B967FF', icon: '✦' };
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{ ...styles.categoryTile, background: `linear-gradient(135deg, ${meta.accent}26 0%, rgba(255,255,255,0.05) 60%)` }}
                      >
                        <div style={{ ...styles.categoryTileMedal, background: `${meta.accent}22`, color: meta.accent }}>
                          <span style={styles.categoryTileIcon}>{meta.icon}</span>
                        </div>
                        <div style={styles.categoryTileBody}>
                          <span style={styles.categoryTileName}>{cat}</span>
                          <span style={styles.categoryTileCount}>
                            {items.length}
                          </span>
                        </div>
                        {inCartCount > 0 && (
                          <span style={styles.categoryTileCartBadge}>{inCartCount}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )
          )}
        </main>
      ) : (
        <main style={styles.main}>
          <p style={styles.eyebrowSection}>Архив</p>
          <h2 style={styles.sectionTitle}>История заказов</h2>

          {orders.length === 0 ? (
            <div style={styles.emptyState}>
              <Package size={28} color="#D9C2F5" />
              <p style={styles.emptyText}>Отправленных заявок пока нет</p>
            </div>
          ) : (
            <div style={styles.historyList}>
              {orders.map(o => (
                <div key={o.id} style={styles.historyCard}>
                  <div style={styles.historyDateRow}>
                    <span style={styles.historyDate}>
                      {formatDate(o.createdAt)}
                      {o.items.some(it => it.urgent) && (
                        <span style={styles.urgentBadge}>
                          <Flag size={11} color="#FFFFFF" fill="#FFFFFF" />
                          Срочно
                        </span>
                      )}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={styles.historyTime}>{formatTimeOnly(o.createdAt)}</span>
                      <div style={styles.historyActions}>
                        <button onClick={() => repeatOrder(o)} style={styles.repeatBtn}>
                          <RotateCcw size={13} color="#CCFF00" />
                          <span>Повторить</span>
                        </button>
                        <button onClick={async () => {
                          const text = exportOrderText(o);
                          try {
                            await navigator.clipboard.writeText(text);
                            showToast('Скопировано!');
                          } catch (e) { showToast('Не удалось скопировать'); }
                        }} style={styles.histCopyBtn}>
                          <Copy size={13} color="#8A8A9A" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div style={styles.historyItems}>
                    {Object.entries(
                      o.items.reduce((acc, it) => {
                        const sup = it.supplier || 'Основной поставщик';
                        if (!acc[sup]) acc[sup] = [];
                        acc[sup].push(it);
                        return acc;
                      }, {})
                    ).sort((a, b) => a[0].localeCompare(b[0], 'ru')).map(([sup, items]) => (
                      <div key={sup} style={styles.historySupplierBlock}>
                        <div style={styles.historySupplierLabel}>{sup}</div>
                        {items.map(it => (
                          <div key={it.id} style={{ ...styles.historyItem, ...(it.urgent ? styles.historyItemUrgent : {}) }}>
                            <span style={styles.historyItemName}>
                              {it.urgent && <Flag size={12} color="#7C3AB5" fill="#7C3AB5" style={{ marginRight: 5, flexShrink: 0 }} />}
                              {it.name}
                            </span>
                            <span style={styles.historyAmount}>{it.amount} {it.unit}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {view === 'stats' && !pinUnlocked && (
        <main style={styles.main}>
          <p style={styles.eyebrowSection}>Доступ</p>
          <h2 style={styles.sectionTitle}>Статистика</h2>
          <div style={styles.pinWrap}>
            <div style={styles.pinSubtitle}>Введите пин-код шеф-бариста</div>
            <div style={styles.pinDots}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  ...styles.pinDot,
                  background: pinError
                    ? '#FF3D5A'
                    : i < pinInput.length
                      ? '#CCFF00'
                      : 'rgba(255,255,255,0.12)',
                  boxShadow: i < pinInput.length && !pinError
                    ? '0 0 12px rgba(204,255,0,0.6)'
                    : pinError
                      ? '0 0 12px rgba(255,61,90,0.6)'
                      : 'none',
                  transform: pinError ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s',
                }} />
              ))}
            </div>
            <div style={styles.pinGrid}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
                d === '' ? <div key={i} /> :
                <button
                  key={i}
                  onClick={() => d === '⌫' ? handlePinDelete() : handlePinDigit(d)}
                  style={{
                    ...styles.pinKey,
                    ...(d === '⌫' ? styles.pinKeyDel : {}),
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </main>
      )}

      {view === 'stats' && (() => {
        if (!pinUnlocked) return null;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthName = now.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

        // Заказы за текущий месяц
        const monthOrders = orders.filter(o => new Date(o.createdAt) >= monthStart);

        // Статистика по поставщикам
        const supplierStats = {};
        monthOrders.forEach(o => {
          o.items.forEach(it => {
            const sup = it.supplier || 'Основной поставщик';
            if (!supplierStats[sup]) supplierStats[sup] = { orders: 0, items: 0, lastDate: null, history: [] };
            supplierStats[sup].items += 1;
          });
          // Считаем уникальных поставщиков в заказе
          const sups = [...new Set(o.items.map(it => it.supplier || 'Основной поставщик'))];
          sups.forEach(sup => {
            if (!supplierStats[sup]) supplierStats[sup] = { orders: 0, items: 0, lastDate: null, history: [] };
            supplierStats[sup].orders += 1;
            supplierStats[sup].history.push(o.createdAt);
            if (!supplierStats[sup].lastDate || new Date(o.createdAt) > new Date(supplierStats[sup].lastDate)) {
              supplierStats[sup].lastDate = o.createdAt;
            }
          });
        });

        const supList = Object.entries(supplierStats)
          .sort((a, b) => b[1].orders - a[1].orders);

        // Активность по дням месяца
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dayActivity = Array(daysInMonth).fill(0);
        monthOrders.forEach(o => {
          const d = new Date(o.createdAt).getDate() - 1;
          dayActivity[d] += 1;
        });
        const maxActivity = Math.max(...dayActivity, 1);

        return (
          <main style={styles.main}>
            <p style={styles.eyebrowSection}>Дашборд</p>
            <h2 style={styles.sectionTitle}>{monthName}</h2>
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <span style={styles.statNum}>{monthOrders.length}</span>
                <span style={styles.statLabel}>заказов</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statNum}>{supList.length}</span>
                <span style={styles.statLabel}>поставщиков</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statNum}>{monthOrders.reduce((s, o) => s + o.items.length, 0)}</span>
                <span style={styles.statLabel}>позиций</span>
              </div>
            </div>
            {monthOrders.length > 0 && (
              <div style={styles.activityBlock}>
                <div style={styles.activityLabel}>Активность по дням</div>
                <div style={styles.activityChart}>
                  {dayActivity.map((count, i) => (
                    <div key={i} style={styles.activityBarWrap}>
                      <div
                        style={{
                          ...styles.activityBar,
                          height: `${Math.max(count > 0 ? 14 : 3, (count / maxActivity) * 52)}px`,
                          background: count > 0
                            ? `rgba(204,255,0,${0.35 + (count / maxActivity) * 0.65})`
                            : 'rgba(255,255,255,0.08)',
                          boxShadow: count > 0 ? `0 0 8px rgba(204,255,0,${count/maxActivity * 0.6})` : 'none',
                        }}
                      />
                      {(i + 1) % 5 === 0 && (
                        <span style={styles.activityDay}>{i + 1}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {supList.length === 0 ? (
              <div style={styles.emptyState}>
                <Package size={28} color="#2A2A35" />
                <p style={styles.emptyText}>Заказов в этом месяце ещё не было</p>
              </div>
            ) : (
              <>
                <div style={styles.activityLabel}>По поставщикам</div>
                {supList.map(([sup, stat]) => (
                  <div key={sup} style={styles.supStatCard}>
                    <div style={styles.supStatTop}>
                      <span style={styles.supStatName}>{sup}</span>
                      <span style={styles.supStatOrders}>{stat.orders} {stat.orders === 1 ? 'заказ' : stat.orders < 5 ? 'заказа' : 'заказов'}</span>
                    </div>
                    <div style={styles.supStatBarBg}>
                      <div style={{
                        ...styles.supStatBar,
                        width: `${(stat.orders / (supList[0]?.[1].orders || 1)) * 100}%`,
                      }} />
                    </div>
                    <div style={styles.supStatMeta}>
                      <span style={styles.supStatItems}>{stat.items} позиций</span>
                      {stat.lastDate && (
                        <span style={styles.supStatLast}>
                          последний: {new Date(stat.lastDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <div style={styles.supStatDates}>
                      {stat.history.map((d, i) => (
                        <span key={i} style={styles.supStatDateChip}>
                          {new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                          {' '}
                          {new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
            <button
              onClick={() => { setShowChangePinModal(true); setNewPinInput(''); }}
              style={styles.changePinBtn}
            >
              Сменить пин-код
            </button>
          </main>
        );
      })()}
      {showChangePinModal && (
        <div style={styles.pinModal}>
          <div style={styles.pinModalBox}>
            <div style={styles.pinModalTitle}>Новый пин-код</div>
            <input
              value={newPinInput}
              onChange={e => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4 цифры"
              inputMode="numeric"
              maxLength={4}
              style={styles.pinModalInput}
              autoFocus
            />
            <div style={styles.pinModalActions}>
              <button onClick={() => setShowChangePinModal(false)} style={styles.cancelBtn}>Отмена</button>
              <button onClick={saveNewPin} style={styles.confirmBtn}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {view === 'suppliers' && (() => {
        const now = new Date();
        const todayWd = getJsWeekday(now);
        const todayH = now.getHours() + now.getMinutes() / 60;
        const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
        const dayNums = [1,2,3,4,5,6,7];

        const getStatus = (sched) => {
          const works = sched.excludeDay
            ? todayWd !== sched.excludeDay
            : sched.days.includes(todayWd);
          if (!works) return 'off';
          if (todayH >= sched.deadline) return 'closed';
          if (todayH >= sched.deadline - 1) return 'soon';
          return 'open';
        };

        const statusColor = { open: '#00E5A0', soon: '#FFB800', closed: '#FF3D5A', off: '#3A3A46' };
        const statusLabel = { open: 'Принимает', soon: 'Скоро закроется', closed: 'Закрыт', off: 'Не работает' };
        const statusDot = { open: '●', soon: '◑', closed: '●', off: '○' };

        return (
          <main style={styles.main}>
            <p style={styles.eyebrowSection}>График</p>
            <h2 style={styles.sectionTitle}>Поставщики</h2>
            <div style={styles.suppDayRow}>
              {days.map((d, i) => (
                <div key={d} style={{
                  ...styles.suppDayChip,
                  background: dayNums[i] === todayWd ? 'rgba(204,255,0,0.2)' : 'transparent',
                  color: dayNums[i] === todayWd ? GOLD : '#6B6B7A',
                  border: dayNums[i] === todayWd ? '1px solid rgba(204,255,0,0.4)' : '1px solid transparent',
                }}>{d}</div>
              ))}
            </div>

            {Object.entries(SUPPLIERS).map(([name, sched]) => {
              const status = getStatus(sched);
              const hoursLeft = sched.days.includes(todayWd) && status !== 'off'
                ? Math.max(0, sched.deadline - todayH)
                : null;

              return (
                <div key={name} style={styles.suppCard}>
                  <div style={styles.suppCardTop}>
                    <div>
                      <span style={styles.suppCardName}>{name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ ...styles.suppStatusDot, color: statusColor[status] }}>
                          {statusDot[status]}
                        </span>
                        <span style={{ ...styles.suppStatusLabel, color: statusColor[status] }}>
                          {statusLabel[status]}
                          {status === 'open' && hoursLeft !== null && hoursLeft < 4 &&
                            ` — осталось ${Math.floor(hoursLeft)}ч ${Math.round((hoursLeft % 1) * 60)}м`
                          }
                          {status === 'soon' &&
                            ` — до ${sched.deadline}:00`
                          }
                        </span>
                      </div>
                    </div>
                    <div style={styles.suppDeadline}>
                      до {sched.deadline}:00
                    </div>
                  </div>

                  {/* Дни недели */}
                  <div style={styles.suppDaysGrid}>
                    {dayNums.map((dn, i) => {
                      const isWorkDay = sched.excludeDay
                        ? dn !== sched.excludeDay
                        : sched.days.includes(dn);
                      const isToday = dn === todayWd;
                      return (
                        <div key={dn} style={{
                          ...styles.suppDayBox,
                          background: isToday && isWorkDay
                            ? statusColor[status] + '33'
                            : isWorkDay
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(255,255,255,0.02)',
                          border: isToday
                            ? `1.5px solid ${isWorkDay ? statusColor[status] : '#3A3A46'}`
                            : '1px solid transparent',
                          color: isWorkDay
                            ? isToday ? statusColor[status] : '#F5F7FA'
                            : '#3A3A46',
                        }}>
                          <span style={styles.suppDayBoxLabel}>{days[i]}</span>
                          {isWorkDay && (
                            <span style={styles.suppDayBoxTime}>
                              {sched.deadline}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </main>
        );
      })()}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

const PURPLE_DARK = '#F5F7FA';
const PURPLE_BROWN = '#0A0A0F';
const GOLD = '#CCFF00';
const GOLD_LIGHT = '#2A2A35';
const RUST = '#CCFF00';
const SAGE = '#8A8A9A';
const BG = '#0A0A0F';
const CREAM = '#14141C';
const SURFACE = '#15151D';
const SURFACE_2 = '#1C1C26';
const NEON_2 = '#FF3D81';
const DANGER = '#FF3D5A';
const SUCCESS = '#00E5A0';

const styles = {
  app: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontWeight: 300,
    background: BG,
    minHeight: '100vh',
    color: PURPLE_DARK,
    maxWidth: 480,
    margin: '0 auto',
    position: 'relative',
    paddingBottom: 36,
  },
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: PURPLE_BROWN,
  },
  loadingMark: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 32,
    color: GOLD,
    animation: 'pulse 1s infinite',
  },
  header: {
    background: PURPLE_BROWN,
    padding: '36px 24px 28px',
    position: 'relative',
    overflow: 'hidden',
    zIndex: 2,
  },
  headerInner: { position: 'relative' },
  nameChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(204,255,0,0.12)',
    border: '1px solid rgba(204,255,0,0.35)',
    ...GLASS_SM,
    borderRadius: 20,
    padding: '7px 12px',
    marginTop: 4,
    flexShrink: 0,
  },
  nameChipText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: '#CCFF00',
    maxWidth: 100,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  nameChipEdit: {
    fontSize: 12,
    color: 'rgba(204,255,0,0.6)',
  },
  headerLabel: {
    fontSize: 10,
    letterSpacing: '4px',
    textTransform: 'uppercase',
    color: GOLD,
    marginBottom: 10,
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
  },
  headerTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 64,
    color: '#FFFFFF',
    lineHeight: 0.9,
    letterSpacing: '-2px',
    margin: 0,
    textShadow: '0 0 30px rgba(204,255,0,0.25)',
  },
  nav: {
    position: 'sticky',
    top: 12,
    zIndex: 100,
    padding: '0 16px',
    marginBottom: 8,
  },
  navInner: {
    display: 'flex',
    gap: 4,
    background: 'rgba(255,255,255,0.08)',
    ...GLASS_NAV,
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 22,
    padding: 5,
    boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  navBtn: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'rgba(245,247,250,0.55)',
    fontFamily: "'Inter', sans-serif",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    padding: '10px 4px',
    whiteSpace: 'nowrap',
    position: 'relative',
    borderRadius: 17,
    transition: 'color 0.2s, background 0.2s',
    minWidth: 0,
  },
  navBtnCart: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navBtnActive: {
    color: '#0A0A0F',
    background: GOLD,
    boxShadow: '0 2px 12px rgba(204,255,0,0.45)',
  },
  navCartBadge: {
    marginLeft: 6,
    background: PURPLE_BROWN,
    color: GOLD,
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },
  navCartBadgeUrgent: {
    background: '#FF3D5A',
    color: '#FFFFFF',
  },
  main: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '28px 20px 0',
    position: 'relative',
    zIndex: 2,
  },
  eyebrowSection: {
    fontSize: 9,
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: RUST,
    margin: '0 0 6px',
    fontWeight: 500,
  },
  sectionTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 24,
    fontWeight: 400,
    color: PURPLE_DARK,
    margin: '0 0 18px',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: SURFACE,
    border: `1.5px solid ${GOLD_LIGHT}`,
    borderRadius: 14,
    padding: '13px 14px',
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 16,
    fontFamily: "'Inter', sans-serif",
    background: 'transparent',
    color: PURPLE_DARK,
  },
  clearBtn: {
    border: 'none',
    background: 'transparent',
    padding: 2,
    display: 'flex',
  },
  resultsList: {
    marginTop: 10,
    animation: 'slideUp 0.15s ease',
  },
  resultRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: SURFACE,
    border: `1px solid rgba(255,255,255,0.25)`,
    borderRadius: 12,
    padding: '13px 14px',
    marginBottom: 8,
    fontSize: 15,
    fontFamily: "'Inter', sans-serif",
    color: PURPLE_DARK,
    textAlign: 'left',
  },
  resultName: { fontWeight: 500 },
  resultMeta: { display: 'flex', alignItems: 'center', gap: 10 },
  unitTag: {
    fontSize: 10,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: RUST,
    background: '#1C1C26',
    padding: '3px 9px',
    borderRadius: 20,
    fontWeight: 500,
  },
  resultRowActive: {
    width: '100%',
    background: '#1C1C26',
    border: `1.5px solid ${GOLD}`,
    borderRadius: 12,
    padding: '12px 14px',
    marginBottom: 8,
  },
  resultRowUrgent: {
    background: '#1F1418',
    borderColor: '#FF3D5A',
  },
  resultActiveTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultActiveBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  newRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#1C1C26',
    border: `1px dashed ${RUST}`,
    borderRadius: 12,
    padding: '13px 14px',
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    color: RUST,
    fontWeight: 500,
  },
  emptyHint: {
    fontSize: 13,
    color: '#8A8A9A',
    padding: '8px 4px',
  },
  newCard: {
    marginTop: 10,
    background: SURFACE,
    border: `1.5px solid ${GOLD_LIGHT}`,
    borderRadius: 14,
    padding: 16,
    animation: 'popIn 0.15s ease',
  },
  newCardTitle: {
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: RUST,
    marginBottom: 10,
    marginTop: 14,
  },
  newCardInput: {
    width: '100%',
    border: `1px solid ${GOLD_LIGHT}`,
    background: '#1C1C26',
    borderRadius: 10,
    padding: '11px 12px',
    fontSize: 15,
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    marginBottom: 4,
    color: PURPLE_DARK,
  },
  unitRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  unitChip: {
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.06)',
    ...GLASS_MD,
    borderRadius: 20,
    padding: '6px 13px',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
    color: SAGE,
  },
  unitChipActive: {
    background: GOLD,
    borderColor: GOLD,
    color: '#0A0A0F',
    boxShadow: '0 2px 12px rgba(204,255,0,0.4)',
  },
  newCardActions: {
    display: 'flex',
    gap: 8,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.06)',
    ...GLASS_MD,
    borderRadius: 17,
    padding: '11px',
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    color: SAGE,
  },
  confirmBtn: {
    flex: 2,
    border: '1px solid rgba(204,255,0,0.5)',
    background: 'rgba(204,255,0,0.18)',
    ...GLASS_MD,
    borderRadius: 17,
    padding: '11px',
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    color: GOLD,
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  categoryTile: {
    position: 'relative',
    background: 'rgba(255,255,255,0.06)',
    ...GLASS_LG,
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 20,
    padding: '16px 14px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    minHeight: 108,
  },
  categoryTileMedal: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryTileIcon: {
    fontSize: 19,
    lineHeight: 1,
  },
  categoryTileBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    width: '100%',
    minWidth: 0,
  },
  categoryTileName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: PURPLE_DARK,
    lineHeight: 1.25,
  },
  categoryTileCount: {
    fontSize: 10,
    letterSpacing: '0.3px',
    color: '#8A8A9A',
    fontWeight: 500,
    marginTop: 1,
  },
  categoryTileCartBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    fontSize: 11,
    fontWeight: 700,
    color: '#0A0A0F',
    background: RUST,
    borderRadius: '50%',
    minWidth: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 0 10px rgba(204,255,0,0.5)',
  },
  categoryDetail: { marginTop: 2 },
  backRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    border: 'none',
    background: 'transparent',
    color: '#CCFF00',
    fontSize: 12,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
    padding: '4px 0 16px',
  },
  draftBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    color: '#8A8A9A',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '4px 10px',
    marginBottom: 14,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    color: '#8A8A9A',
    margin: 0,
    lineHeight: 1.5,
  },
  cartList: {},
  receipt: {
    background: SURFACE,
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 16,
    padding: '18px 16px 12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
  receiptHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  receiptHeadDate: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: PURPLE_DARK,
  },
  receiptHeadTime: {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.5px',
    color: RUST,
    fontVariantNumeric: 'tabular-nums',
  },
  receiptDashes: {
    height: 0,
    borderTop: '1.5px dashed #D9C2F5',
    marginBottom: 16,
  },
  receiptSupplierBlock: {
    marginBottom: 18,
  },
  receiptSupplierLabelRow: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: `1px solid ${GOLD_LIGHT}`,
  },
  receiptSupplierLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: RUST,
  },
  receiptSupplierCount: {
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.5px',
    textTransform: 'none',
    color: '#8A8A9A',
  },
  supplierSchedule: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.2px',
    color: '#00E5A0',
    marginTop: 4,
  },
  supplierScheduleLate: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.2px',
    color: '#FF3D5A',
    marginTop: 3,
  },
  cartRow: {
    background: SURFACE,
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 12,
    padding: '12px 14px',
    marginBottom: 8,
    transition: 'border-color 0.15s, background 0.15s',
  },
  cartRowUrgent: {
    background: '#1F1418',
    border: '1.5px solid #FF3D5A',
  },
  cartRowTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cartRowTopActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  cartName: {
    fontSize: 15,
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
    color: PURPLE_DARK,
  },
  flagBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: '1.5px solid rgba(255,255,255,0.35)',
    background: 'rgba(255,255,255,0.12)',
    ...GLASS_MD,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  flagBtnActive: {
    background: 'rgba(255,61,90,0.5)',
    borderColor: '#FF3D5A',
    boxShadow: '0 0 10px rgba(255,61,90,0.5)',
  },
  urgentLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '1px',
    color: '#FF3D5A',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: -4,
  },
  removeBtn: {
    border: 'none',
    background: 'transparent',
    padding: 2,
  },
  cartRowBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  cartAmountDisplay: {
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    color: RUST,
    background: 'rgba(204,255,0,0.12)',
    border: '1px solid rgba(204,255,0,0.3)',
    padding: '6px 12px',
    borderRadius: 20,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    border: '1.5px solid rgba(204,255,0,0.5)',
    background: 'rgba(204,255,0,0.12)',
    ...GLASS_MD,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 0 8px rgba(204,255,0,0.2)',
  },
  amountInput: {
    flex: 1,
    textAlign: 'center',
    border: `1px solid ${GOLD_LIGHT}`,
    background: '#1C1C26',
    borderRadius: 8,
    padding: '7px 4px',
    fontSize: 15,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    color: PURPLE_DARK,
    outline: 'none',
  },
  unitLabel: {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: RUST,
    width: 26,
    flexShrink: 0,
  },
  historyList: { paddingBottom: 10 },
  pinWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  pinSubtitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    color: 'rgba(245,247,250,0.5)',
    marginBottom: 36,
    textAlign: 'center',
  },
  pinDots: {
    display: 'flex',
    gap: 18,
    marginBottom: 44,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    transition: 'all 0.15s',
  },
  pinGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 14,
    width: '100%',
    maxWidth: 280,
  },
  pinKey: {
    background: 'rgba(255,255,255,0.07)',
    ...GLASS_SM,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: '20px 0',
    fontSize: 22,
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    color: '#F5F7FA',
    textAlign: 'center',
  },
  pinKeyDel: {
    fontSize: 18,
    color: '#8A8A9A',
  },
  changePinBtn: {
    marginTop: 36,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    borderRadius: 20,
    padding: '10px 20px',
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    color: '#8A8A9A',
    letterSpacing: '0.5px',
  },
  pinModal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
    padding: '0 24px',
  },
  pinModalBox: {
    background: '#15151D',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: '28px 24px',
    width: '100%',
    maxWidth: 320,
  },
  pinModalTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#F5F7FA',
    marginBottom: 18,
    textAlign: 'center',
  },
  pinModalInput: {
    width: '100%',
    background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(204,255,0,0.35)',
    borderRadius: 14,
    padding: '14px',
    fontSize: 20,
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    color: '#CCFF00',
    textAlign: 'center',
    letterSpacing: '8px',
    outline: 'none',
    marginBottom: 18,
  },
  pinModalActions: {
    display: 'flex',
    gap: 10,
  },
  supplierBanner: {
    margin: '8px 16px 0',
    borderRadius: 16,
    border: '1px solid',
    padding: '12px 14px',
    ...GLASS_SM,
    animation: 'slideUp 0.3s ease',
  },
  supplierBannerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplierBannerTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.2px',
    textTransform: 'capitalize',
  },
  supplierBannerClose: {
    border: 'none',
    background: 'transparent',
    padding: 2,
    display: 'flex',
    flexShrink: 0,
  },
  supplierBannerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  supplierBannerRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 7,
  },
  supplierBannerName: {
    fontSize: 12,
    fontWeight: 800,
    fontFamily: "'Space Grotesk', sans-serif",
    flexShrink: 0,
    width: 12,
    textAlign: 'center',
  },
  supplierBannerText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    color: 'rgba(245,247,250,0.75)',
    lineHeight: 1.4,
  },
  supplierBannerSupName: {
    fontWeight: 600,
    color: '#F5F7FA',
  },
  suppDayRow: {
    display: 'flex',
    gap: 4,
    marginBottom: 16,
  },
  suppDayChip: {
    flex: 1,
    textAlign: 'center',
    padding: '5px 2px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
  },
  suppCard: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: '14px 16px',
    marginBottom: 10,
  },
  suppCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  suppCardName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 17,
    fontWeight: 600,
    color: PURPLE_DARK,
  },
  suppStatusDot: {
    fontSize: 10,
    lineHeight: 1,
  },
  suppStatusLabel: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.2px',
  },
  suppDeadline: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: '#8A8A9A',
    marginTop: 2,
  },
  suppDaysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
  },
  suppDayBox: {
    borderRadius: 8,
    padding: '6px 2px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  suppDayBoxLabel: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 10,
    fontWeight: 600,
  },
  suppDayBoxTime: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 9,
    fontWeight: 500,
    color: '#8A8A9A',
    letterSpacing: '-0.3px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    marginBottom: 22,
  },
  statCard: {
    background: 'rgba(255,255,255,0.06)',
    ...GLASS_SM,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: '16px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    color: GOLD,
    lineHeight: 1,
  },
  statLabel: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 500,
    color: '#8A8A9A',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textAlign: 'center',
  },
  activityBlock: {
    marginBottom: 24,
  },
  activityLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: '#8A8A9A',
    marginBottom: 10,
  },
  activityChart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 3,
    height: 68,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: '10px 10px 18px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  activityBarWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    position: 'relative',
  },
  activityBar: {
    width: '100%',
    borderRadius: 3,
    transition: 'height 0.3s ease',
    minHeight: 3,
  },
  activityDay: {
    position: 'absolute',
    bottom: -16,
    fontSize: 8,
    color: '#6B6B7A',
    fontFamily: "'Inter', sans-serif",
  },
  supStatCard: {
    background: 'rgba(255,255,255,0.06)',
    ...GLASS_SM,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: '14px 16px',
    marginBottom: 10,
  },
  supStatTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  supStatName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    color: PURPLE_DARK,
  },
  supStatOrders: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: GOLD,
    background: 'rgba(204,255,0,0.12)',
    border: '1px solid rgba(204,255,0,0.25)',
    padding: '3px 10px',
    borderRadius: 20,
  },
  supStatBarBg: {
    height: 4,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  supStatBar: {
    height: '100%',
    background: `linear-gradient(90deg, rgba(204,255,0,0.6), rgba(204,255,0,1))`,
    borderRadius: 4,
    transition: 'width 0.5s ease',
  },
  supStatMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  supStatItems: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    color: '#8A8A9A',
  },
  supStatLast: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    color: '#8A8A9A',
  },
  supStatDates: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
  },
  supStatDateChip: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 10,
    fontWeight: 500,
    color: '#6B6B7A',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '3px 8px',
  },
  historyCard: {
    background: SURFACE,
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  historyDateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },
  historyDate: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: PURPLE_DARK,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  urgentBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    background: '#FF3D5A',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderRadius: 20,
    padding: '2px 8px 2px 6px',
    fontFamily: "'Inter', sans-serif",
  },
  historyTime: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.5px',
    color: RUST,
    fontVariantNumeric: 'tabular-nums',
  },
  repeatBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    border: '1px solid rgba(204,255,0,0.4)',
    background: 'rgba(204,255,0,0.1)',
    ...GLASS_SM,
    borderRadius: 20,
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    color: GOLD,
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
  },
  historyActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  histCopyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    ...GLASS_SM,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copyBtn: {
    width: '100%',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    ...GLASS_LG,
    color: '#F5F7FA',
    borderRadius: 20,
    padding: '14px',
    fontSize: 13,
    letterSpacing: '0.5px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  copyBtnDone: {
    border: '1px solid rgba(0,229,160,0.5)',
    background: 'rgba(0,229,160,0.12)',
    color: '#00E5A0',
  },
  historyItems: {},
  historySupplierBlock: {
    marginBottom: 14,
  },
  historySupplierLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: RUST,
    marginBottom: 6,
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    padding: '5px 0',
    color: PURPLE_DARK,
  },
  historyItemUrgent: { color: '#FF3D5A', fontWeight: 500 },
  historyItemName: { display: 'flex', alignItems: 'center' },
  historyAmount: { fontWeight: 600, color: RUST },
  sendBtnInline: {
    width: '100%',
    border: '1px solid rgba(204,255,0,0.5)',
    background: 'rgba(204,255,0,0.16)',
    ...GLASS_LG,
    color: GOLD,
    borderRadius: 20,
    padding: '16px',
    fontSize: 13,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    boxShadow: '0 0 24px rgba(204,255,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  confirmBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: '#00E5A0',
    color: '#FFFFFF',
    borderRadius: 12,
    padding: '11px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
    marginBottom: 18,
  },
  sheet: {
    background: SURFACE,
    padding: '4px 2px 8px',
  },
  sheetTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 26,
    fontWeight: 700,
    color: PURPLE_DARK,
    margin: '0 0 6px',
  },
  sheetMeta: {
    fontSize: 14,
    fontWeight: 500,
    color: '#8A8A9A',
    marginBottom: 26,
    fontFamily: "'Inter', sans-serif",
  },
  sheetSupplierBlock: {
    marginBottom: 22,
  },
  sheetSupplierName: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: PURPLE_DARK,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 2,
  },
  sheetSupplierSchedule: {
    fontSize: 13,
    fontWeight: 500,
    color: '#00E5A0',
    marginBottom: 12,
  },
  sheetItemsList: {},
  sheetItemRow: {
    display: 'flex',
    alignItems: 'baseline',
    padding: '7px 0',
    gap: 8,
  },
  sheetItemIndex: {
    fontSize: 15,
    fontWeight: 600,
    color: '#6B6B7A',
    flexShrink: 0,
    width: 20,
  },
  sheetItemName: {
    fontSize: 17,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    color: PURPLE_DARK,
    lineHeight: 1.35,
    flex: 1,
  },
  sheetItemNameUrgent: {
    color: '#FF3D5A',
  },
  sheetItemAmount: {
    fontSize: 17,
    fontWeight: 800,
    fontFamily: "'Inter', sans-serif",
    color: RUST,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  sheetDivider: {
    height: 0,
    borderTop: '1px solid rgba(255,255,255,0.1)',
    marginTop: 18,
  },
  newOrderBtn: {
    width: '100%',
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.06)',
    ...GLASS_LG,
    color: GOLD,
    borderRadius: 20,
    padding: '14px',
    fontSize: 13,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    marginTop: 16,
    marginBottom: 8,
  },
  toast: {
    position: 'fixed',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    background: PURPLE_BROWN,
    border: `1px solid ${GOLD}`,
    color: GOLD,
    padding: '10px 18px',
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    animation: 'slideUp 0.2s ease',
    zIndex: 50,
    maxWidth: '90%',
    textAlign: 'center',
    boxShadow: '0 0 20px rgba(204,255,0,0.2)',
  },
};
