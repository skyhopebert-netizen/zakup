// Glass effect constants
const GLASS_SM = { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' };
const GLASS_MD = { backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' };
const GLASS_LG = { backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' };
const GLASS_NAV = { backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' };

const { useState, useEffect, useCallback } = React;
// Простые SVG-иконки (замена lucide-react, чтобы не тянуть внешнюю UMD-сборку,
// несовместимую с React при подключении напрямую через <script> теги)
const Icon = ({ children, size = 18, color = 'currentColor', fill = 'none', style, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} {...rest}>
    {children}
  </svg>
);
const Search = (props) => <Icon {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>;
const Plus = (props) => <Icon {...props}><path d="M5 12h14" /><path d="M12 5v14" /></Icon>;
const Minus = (props) => <Icon {...props}><path d="M5 12h14" /></Icon>;
const Send = (props) => <Icon {...props}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Icon>;
const Check = (props) => <Icon {...props}><path d="M20 6 9 17l-5-5" /></Icon>;
const X = (props) => <Icon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
const Package = (props) => <Icon {...props}><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></Icon>;
const ShoppingCart = (props) => <Icon {...props}><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></Icon>;
const ChevronLeft = (props) => <Icon {...props}><path d="m15 18-6-6 6-6" /></Icon>;
const Flag = (props) => <Icon {...props}><path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 8 2a6 6 0 0 0 3.6-1.2A1 1 0 0 1 21 3.7v10.6a1 1 0 0 1-.4.8A6 6 0 0 1 17 16c-3 0-5-2-8-2a6 6 0 0 0-5 1.5" /></Icon>;
const RotateCcw = (props) => <Icon {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></Icon>;
const Copy = (props) => <Icon {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></Icon>;

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
// Имена сотрудников — не секрет, нужны только чтобы проверить сохранённый
// локально вход на этом устройстве. Настоящая проверка пароля происходит
// в базе через verify_staff_login (пароли нигде в этом файле не хранятся).
const STAFF_NAMES = ['Вика', 'Илья', 'Амир', 'Артём'];

// SUPABASE_URL и SUPABASE_KEY уже объявлены в index.html (в скрипте window.storage)
// и доступны здесь как глобальные переменные страницы — заново их объявлять нельзя,
// это и вызывало "Can't create duplicate variable".
async function supabaseRpc(fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error('rpc failed');
  return res.json();
}

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

const CL_ALL = [1,2,3,4,5,6,7];
const CL_DAYS_FULL = ['', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];

const CL_SECTIONS = [
  { id:'open', title:'Открытие смены', icon:'🌅', accent:'#FF6B35', tasks:[
    { g:'9:30', t:'Включить свет в зале — чтоб не было лишнего света и не темно' },
    { g:'9:30', t:'Включить кофемолки' },
    { g:'9:30', t:'Включить бойлер' },
    { g:'9:45', t:'Включить пение птичек — под кассой, блютуз с рабочего телефона' },
    { g:'9:45', t:'Приготовить фильтр' },
    { g:'9:50', t:'Привести внешний вид в порядок' },
    { g:'9:50', t:'Переодеться — быть в форме' },
    { g:'9:55', t:'Открыть кассовую смену' },
    { g:'9:55', t:'Настроить помол и прислать данные о настройке в чат' },
    { g:'10:10', t:'Отписать в группу с официантами, какое зерно под фильтр сегодня, и дескрипторы' }
  ]},
  { id:'day', title:'Чек-лист дня', icon:'📋', accent:'#CCFF00', tasks:[
    { g:'Утренняя смена', t:'Заказ молока', at:'будни — до 16:00' },
    { g:'Утренняя смена', t:'Заказ воды Petroglyph', at:'будни — до 16:00' },
    { g:'Утренняя смена', t:'Пополнить все хозы' },
    { g:'Утренняя смена', t:'Проверить маркировки и количество заготовок, при необходимости заготовить' },
    { g:'Утренняя смена', t:'Нарезка фруктов и очистка мяты' },
    { g:'Утренняя смена', t:'Заготовить п/ф какао и матчи' },
    { g:'Утренняя смена', t:'Бракераж апельсинов при отжиме фреша — скинуть в чат вход апельсинов и выход фреша' },
    { g:'Утренняя смена', t:'Настроить эспрессо после 16:00', at:'16:00' },
    { g:'Утренняя смена', t:'Заказ расходников' },
    { g:'Вечерняя смена', t:'Пополнение молока', at:'12:00–17:00' },
    { g:'Вечерняя смена', t:'Списание в течение дня' },
    { g:'Вечерняя смена', t:'Заказ продуктов' },
    { g:'Вечерняя смена', t:'Максимально затарить и натереть посуду на утро', at:'21:20' }
  ]},
  { id:'weekly', title:'Уборка по графику', icon:'🗓️', accent:'#00D9FF', weekly:true, tasks:[
    { t:'Замывка групп кофемашины химией, со снятием сеток', days:[1,5] },
    { t:'Чистка кофемолок Mahlkonig (эспрессо)', days:[1] },
    { t:'Протереть витрину на баре маленькую, внутри и снаружи', days:[1,4] },
    { t:'Разморозка морозилки', days:[2] },
    { t:'Спустить хозы со склада и проконтролировать наличие', days:[2,5] },
    { t:'Протереть полки в зоне мусорных баков', days:[2] },
    { t:'Пополнить чаи и сыпучие', days:[3,6] },
    { t:'Вымыть холодильники, резинки на дверцах и под холодильниками', days:[3,6] },
    { t:'Убрать в выдвижных ящиках', days:[7] },
    { t:'Промыть ледогенератор', days:[7] },
    { t:'Протереть все поверхности со средством p-504', days:CL_ALL },
    { t:'Почистить резиновые коврики', days:CL_ALL },
    { t:'Протереть полки', days:CL_ALL }
  ]},
  { id:'close', title:'Закрытие смены', icon:'🌙', accent:'#B967FF', tasks:[
    { g:'20:30', t:'Помыть пит-стопы (резиновые коврики) щёткой и гелем' },
    { g:'20:30', t:'Протереть поверхность под пит-стопами' },
    { g:'20:40', t:'Развести химию: одна крышка раствора на 800 мл кипятка' },
    { g:'20:40', t:'Замочить холдеры на 15 минут в горячей воде с химией' },
    { g:'20:40', t:'Промыть носики форсунок паровых трубок' },
    { g:'20:40', t:'Промыть форсунки этим раствором' },
    { g:'20:40', t:'Промыть Изи-Милк тем же раствором, что и форсунки' },
    { g:'20:40', t:'Пропустить всю жидкость и повторить процедуру уже чистой горячей водой' },
    { g:'20:50', t:'Протереть поверхности рядом с кофемолками' },
    { g:'20:50', t:'Убрать гранулы кофе с поверхности мульти-пылесосом' },
    { g:'21:00', t:'Помыть питчеры и ёмкости для ложек и молотого кофе' },
    { g:'21:00', t:'Протереть поверхности' },
    { g:'21:10', t:'Разложить все принадлежности в холодной зоне по местам' },
    { g:'21:10', t:'Натереть посуду и разложить обратно после того, как пит-стопы полностью высохнут, посуду для следующей смены' },
    { g:'21:20', t:'Выбросить мусор' },
    { g:'21:20', t:'Протереть полки для баков, если нужно' },
    { g:'21:20', t:'Поменять пакеты на новые' },
    { g:'21:30', t:'Замыть кофемашину: химия 1–1,5 гр через слепой холдер, 5 раз' },
    { g:'21:30', t:'Пропустить чистую воду через слепой холдер, 5 раз' },
    { g:'21:30', t:'Помыть поддон и решётки' },
    { g:'21:30', t:'Протереть кофемашину без разводов' },
    { g:'21:45', t:'Расставить весь инвентарь по местам' },
    { g:'21:45', t:'Финально протереть весь бар' },
    { g:'21:45', t:'Замочить тряпки' },
    { g:'21:55', t:'Пересчитать кассу' },
    { g:'21:55', t:'Начать готовить отчёты' },
    { g:'22:00', t:'Снять остатки всех десертов с витрины и прислать в группу со списаниями' },
    { g:'22:00', t:'Полностью закрыть кассу' },
    { g:'22:00', t:'Отчёты и наличные в конверте подписать и положить в сейф' },
    { g:'22:00', t:'Написать в чат, что спустить со склада и что заканчивается' },
    { g:'22:05', t:'Выключить бойлер' },
    { g:'22:05', t:'Выключить свет в витринах' },
    { g:'22:05', t:'Отключить телевизоры и выключить музыку' },
    { g:'22:05', t:'Поставить на зарядку всё, что нужно' }
  ]}
];

function clDayNum(d = new Date()) { const n = d.getDay(); return n === 0 ? 7 : n; }
function clDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function clTaskId(sectionId, i) { return `${sectionId}:${i}`; }
function clTime(iso) { return new Date(iso).toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' }); }

function schMondayOf(d) {
  const day = clDayNum(d); // 1..7, Пн=1
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ─── Табель: учёт времени и зарплата ─────────────────────
const HOURLY_RATE = 450; // рублей в час, одна ставка на всех

function tlDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function tlHoursBetween(inStr, outStr) {
  if (!inStr || !outStr) return null;
  const [ih, im] = inStr.split(':').map(Number);
  const [oh, om] = outStr.split(':').map(Number);
  if ([ih, im, oh, om].some(Number.isNaN)) return null;
  let minutes = (oh * 60 + om) - (ih * 60 + im);
  if (minutes < 0) minutes += 24 * 60; // на случай ночной смены через полночь
  return minutes / 60;
}
function tlFormatHours(hrs) {
  const h = Math.floor(hrs);
  const m = Math.round((hrs - h) * 60);
  return `${h}ч ${m}м`;
}
function tlPay(hrs) {
  return Math.round(hrs * HOURLY_RATE);
}
function tlFormatMoney(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

const DRINKS = [
  { cat:'Чаи', name:'Байховый', tmin:'', tmax:'', method:'Заваривание', out:'600 мл', ware:'Чайник', gar:'',
    ing:[['Чайный лист «Байховый»','по стандарту заведения']],
    steps:['Заварить чайный лист в чайнике, залить горячей водой 600 мл', 'Настоять и подать'] },
  { cat:'Чаи', name:'Золотой Бергамот', tmin:'', tmax:'', method:'Заваривание', out:'600 мл', ware:'Чайник', gar:'',
    ing:[['Чайный лист «Золотой Бергамот»','по стандарту заведения']],
    steps:['Заварить чайный лист в чайнике, залить горячей водой 600 мл', 'Настоять и подать'] },
  { cat:'Чаи', name:'Кавказский высокогорный', tmin:'', tmax:'', method:'Заваривание', out:'600 мл', ware:'Чайник', gar:'',
    ing:[['Чайный лист «Кавказский высокогорный»','по стандарту заведения']],
    steps:['Заварить чайный лист в чайнике, залить горячей водой 600 мл', 'Настоять и подать'] },
  { cat:'Чаи', name:'Габа янтарная', tmin:'', tmax:'', method:'Заваривание', out:'600 мл', ware:'Чайник', gar:'',
    ing:[['Чайный лист «Габа янтарная»','по стандарту заведения']],
    steps:['Заварить чайный лист в чайнике, залить горячей водой 600 мл', 'Настоять и подать'] },
  { cat:'Чаи', name:'Весенний Мао Фэн', tmin:'', tmax:'', method:'Заваривание', out:'600 мл', ware:'Чайник', gar:'',
    ing:[['Чайный лист «Весенний Мао Фэн»','по стандарту заведения']],
    steps:['Заварить чайный лист в чайнике, залить горячей водой 600 мл', 'Настоять и подать'] },
  { cat:'Чаи', name:'Алтайский сбор', tmin:'', tmax:'', method:'Заваривание', out:'600 мл', ware:'Чайник', gar:'',
    ing:[['Чайный сбор «Алтайский»','по стандарту заведения']],
    steps:['Заварить чайный сбор в чайнике, залить горячей водой 600 мл', 'Настоять и подать'] },
  { cat:'Чаи', name:'Сливочный улун с османтусом', tmin:'', tmax:'', method:'Заваривание', out:'600 мл', ware:'Чайник', gar:'',
    ing:[['Улун «Сливочный с османтусом»','по стандарту заведения']],
    steps:['Заварить улун в чайнике, залить горячей водой 600 мл', 'Настоять и подать'] },
  { cat:'Чаи', name:'Мята / Ромашка / Липа / Чабрец', tmin:'', tmax:'', method:'Заваривание', out:'600 мл', ware:'Чайник', gar:'',
    ing:[['Травяной сбор на выбор гостя','по стандарту заведения']],
    steps:['Уточнить у гостя, какую траву заваривать — мяту, ромашку, липу или чабрец', 'Заварить в чайнике, залить горячей водой 600 мл', 'Настоять и подать'] },

  { cat:'Чёрный кофе', name:'Аэропресс', tmin:'2:20', tmax:'3:30', method:'Аэропресс (перевёрнутый метод)', out:'180 мл', ware:'Чайник', gar:'',
    ing:[['Кофе, помол 5,7 на кофемолке','17 гр'], ['Вода 92–94°C','220 мл']],
    steps:['Взвесить 17 г кофе на весах, смолоть и высыпать в поршень, установленный в перевёрнутом положении', 'Взвесить 220 г горячей воды на весах, залить, перемешать и смочить бумажный фильтр', 'Включить таймер и настаивать 1 минуту', 'Перевернуть аэропресс на чашку и продавливать поршнем, ориентируясь по таймеру'] },
  { cat:'Чёрный кофе', name:'Пуровер', tmin:'3:00', tmax:'3:40', method:'Пуровер (V60)', out:'210 мл', ware:'Чайник', gar:'',
    ing:[['Кофе, помол 6,5 на кофемолке','19 гр'], ['Вода 92°C','300 мл']],
    steps:['Прогреть воронку и фильтр горячей водой', 'Взвесить и смолоть кофе, помол 6,5', 'Засыпать молотый кофе в фильтр, разровнять поверхность', 'Вода 92°C — сделать 5 проливов по 10 секунд каждый, с интервалом 30 секунд между проливами'] },
  { cat:'Чёрный кофе', name:'Cold brew', tmin:'', tmax:'', method:'Билд', out:'1000 мл', ware:'-', gar:'',
    ing:[['Cold brew концентрат','847 мл'], ['Концентрат в асс. гранат/смородина','153 мл']],
    steps:['Влить Cold brew концентрат', 'Добавить концентрат в асс. гранат/смородина', 'Перемешать и подать'] },
  { cat:'Авторские', name:'Раф ваниль', tmin:'2', tmax:'4', method:'Раф', out:'300 мл', ware:'Чашка/To go', gar:'Рисуем веточку', photo:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHCAkIBgoJCAkMCwoMDxoRDw4ODx8WGBMaJSEnJiQhJCMpLjsyKSw4LCMkM0Y0OD0/QkNCKDFITUhATTtBQj//2wBDAQsMDA8NDx4RER4/KiQqPz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAHgAUADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDMpwplKDWpkOzRSA06gBKCKWigBuKaV5p5NJ1oAYRxSVJSYpAREGipCKaaAGGkU0p5ptACk5NSA1FinKeaAJKKQUtAAelMHBqQ9KiPWgB1FIDQaAClpKM0AFBpaKAExSGnZFNbrQBGRzThRS0AJnmjNKRTaAFzS9abSigBRSUtIaAENFBpM0DCkpaSgRbpDS0hpgJ0pQaQ0lAD91Lnio80oNIBxpaaDQTQA7NFNzRmmA6mkUZozQAwimkVKTUbUgGA80o60hFKBQA8Uopo4pwoAXtUbVL/AA1GaAGindqbS0AFFB4puaAH5wKYTmlooAQUGg0hoAKM0lLQAZoBpDSAYoAeKdTRS0AFITQTTTQApNNNFJ3oGFBFLRQBbozTSaAaYgpDS0GkA3FJS0lABk0ZoxSUALupd1NNJQA/NGaYTSZoAkzTT1pM0ZoAU0gOTTc5py8GgBWNKDTW60CgCQnim0A0lACGjdSmkx3oGJ1pTxS0hoAAaKQUpoELSGkpccUANoooxQA3vS0UEUDFozSUGgBab1pc0g60AFKBzRThQAhFJT6aaBEzU3NOamUDHg0tNFLQIKQ0ppp5oAO1JQKKAE70tFFADGNFDDmk6UAGaWm0tAAaQHmg0ooAeaTNBpDQAoNLmm0tAxTQTxSHpSHpQAoNLTKdQAtIaM0UCEpSeKQmigAxS0dqKAExSkcUUp6UANoNFBoAaaFFJTxQMaetLmlxRigQuaSlpKBkpNNzSmm0AOzRmkFFAhc5oozRmgANJSGgUDHUUlBNAhG60w0pooGJ0pKKMUABpOaWkoAeDRTCcUAmgB9KDTM0A0AOJo7UnenUAMOSaMGnUZoAbzSjNLSUAFLTelL1oAdSUCigQUZpDRQAUhNBooAUUvekpRQMWiikzQAUGikNAh4NLSUZoGLSE0tIaAAGikozQAuaKaaKAHUZpKQ0AKaSiigBKKSloAQnmgDNHWlFACEUUtJQAUYpaDQAd6WkAoNABSUE0lADqCaSigApwGKQUtAC0hoooEJS0lJmgYpptLSUAOHSjNJnigmgQuaM03NFAxc0maKKAJaKSjNADqSjNNJoAU0lJmlpAGKMUppM0wCgniik7UAGaDSHijNAC9qTNLTc0AL0ozTc0A0AOozRSGgAzSg02lAoAfmmnrSE0ZoAWikooAWikoFADhS0lFAC0lFJQIWkNBppoGGaM0UlADs0hoooABRmkooAXNJmkoNAE1Jmg0lACg0GkpaAG04GkoNIBc0hNNzS0wFzSg02kBoAU0mcUuaQ0ALmkzQRSAUgFxQBS0UwEJozRijFACilpMgUm6gANFFFAAaTNBNJQAuaWm0tADs0ZpKSgB2aWmCnCgApKdSUAJRRS0AJRS4ooAbikIp1FADelJmlNN6UAT03NONMoAWlptLQAtIaM0UAIRSCnUlABRSdDS0gEozR3pO9MBwNBNJQRQAtFJRmgB1FJQDQAYpMDNOzxTO9ADqQ0hozxQAUUCloASik70tAC0UlLQAU6mgc06gAooooAKBRRQAtIaKDQAUlFFACUhFOppoAlPApmeac5qMdaAHUtIKM0ABoopKAFpCaKKAENKKTFFIBaTvS0EUwEFKTTaM0AOpBSZooAdmkzSUZpAOFFIKU9KBiGjFN706gAxRS0YpiG0A0hFA4pALSg0maSmBIKWmqadQAUUUUAFFIKWgApKWkoAKKKSgAooooADSV1Z8Mw95H/OkHhmD++/50gOWorqv+Eag/vv8AnSjw1b/32/OgDlKK6weGrb+83/fVH/CN2v8Aeb/vqgZydJmut/4Ry0x1b/vqk/4R60/2vzoA5TNNNdcPD1mPX86d/wAI9ZHsfzoA5AGgmuw/4R6y/u/rR/YFiP4f1NAHG0Gu0/sCxx9wfnQdCsMf6sUAcWKK7UaHYZ/1Ypf7EsP+eQouFjis0ldwNFsP+eK/lS/2NYf88l/Ki4HDg0uRXcf2PYf88V/Kl/smx/54r+VFwscLxS8V3P8AZNj/AM8V/Kmf2VZZ4hX8qVx2OJpc13KabZdDCv5U46dZD/liv5U7iscHkUnFd79gsv8Aniv5UosbPtCv5UrhY4ClxXfixtAf9Sv5UfY7XP8Aql/Ki4WOCXilzXd/Y7X/AJ5L+VH2O2x/ql/KncLHCfhRz6Gu8FpbY4iX8qX7Lb/88l/Ki4WOB59D+VLz6H8q777Jb/8APNfyo+x2/wDzzX8qLiscFg+h/Kgq390/lXfC1t/+ea/lR9ngH/LNfyouBwGx/wC435Uvlyf3G/Ku/wDJhH/LIflSrHD/AM81/Ki4Hn/lSf8APN/++aPKl/55v/3zXoBih/55r+VJ5Uf/ADzX8qLgWCOKMVIRSYoGIRxUTZ7VMajYUAR804dKBS80gGmkIp2KQjigBpHFFOxRigYnakNOxSY5oAQ5xQelOxS4GKAI8Glp2KMUgGil70uKCKAEopcUYoAQim45p+KbjmgBrcDNNLkrTpQdnFMX7vNIYnWnAdwaUL1pV4NACjNLRijFABSY4pfSl7UwGLwcdqkApmOtPU8UCEPFGaHo9KYgopTikxTEAPFJSiloASilooAskUgHFOIwKD0pDGkUxqeaY1ADccUUc4phbB6UAPo7UopDQAlBpcUUhiYoxzRS96AExRjinlQgzKwQe/Wq8t9BH91dx9WobS3DfYlAJ6An6U7ymHXC/U1myanK/CZx7cCovMnkPLYrJ1Y9NTRU5GviMfelH4Ck8y3HViazkgkblmNWEth3pe1fRD5F3LImt/Qn8aXzoP7v61EtugOABUojReOAaXtJByIcJID/AAU4fZyfu0wsiHDHn6U5HjfhGBx1o9o72uh+zQ7yrdvUfjQbOI/dkIpvmxBsbxmpR0pqo2JwsRmxb+CRT9ajNpMvVM/SrQOBUiyEfxVXP3RPKZpVlOGUj6ik71r+aMfOARSG2tphnGw+1UpJi5WjI70tX5dNkXmNgw96pOjxnDqVPvVCGilWkHWlFAgIpuKkPSm0xCgUEGgHilpgNIoFOIoAoEJS0lFAFwikIp5pjGkMY3WmEU4mkJx1oGI3SmbakOB3pMd6QCdqbin45pCKAEpKWlVS7hF5YnAoAEQucDt1J7VBdX8dsCsPLd2NLql0ttF5MZ6fePqa58bp3yenYVnUny6LcuEebV7E8t1LOxIJ+pojt2fk8n3qxBbccirhgYKPL61zvvLU2VtkQw2nHNOWWJGChS30FSp5qhsuwx680xWjJbkAn0GM1lKp20NIw7izEMQDleOQKFL7MK+Rn1pyIrfxnr6U9IgSQpJ9wKztKTuXolYSMLG+8ZB9OtJKNzllxg9mqysC/wAQp/lr7D8K1VNtWI51e5SG4jHOP5fjStuJVv416Njr9aubVFNManqT+dP2TF7RFWUl1xtx3HHQ0pfdENxIIXHB71Y8pPf86Y0APRiPrzS9nLcOeIy3kkW3G7LMTwD2qSC5MhbcAAO4qJonXoMj2qPsF6AHJHrSUpRsh2Url5bhGfbk59CKmV8dKzV/dnI+Zsdf6CpImcAyNJx9eBVxqX0ZLh2NRJ2U8NVhXinXbKo579qyLecyKSR07+tWA9bQnpdGUo9GPu9NZMvDyP7tZ2cHBGCO1bVtdbcJIcp6+lR6lZgjzYx83863jJSMmrGXnK03k0oI2k9B71C15axn5p0z6A5/lVpN7ENpbk3SlzxVX+0rHODcKPqCKsRyRyjdE6uvqpzTcWt0Cknsx+aWm96cBmkMDSYpaKALZqN6k6VG3WkAzFL0NKab2NIY0gE80pIApWxt4ph7ZoAcGB70hYYpQFz0pGPZV5oAYct0FW7BAZZH/iRCfxqvhsVb0rH2l0b/AJaIRTA5jViXutp7tUttD7VY120aKfft+6c0W+CoIOQa55L3maxfukjFEXaytz6U3Cfwq2PSraAEcgGniGP+6KxlTcmbRmkiqvTOMfjQCTzzgd8Vb8mPOSM/Whogx+Y/L2UVHspFc6IIojJ14U1aVQowBilGAMDgUVrCCiZyk5BSGlpKsgSiiigBKSlpKACoJYwPmAb86npCAeoqZR5kUnZlMjIPvSjDH5/uqOB/9apJFVWAClfftULcdq5ZLlZundDlkIcFpNqj+Ed6tRyrJnbnjrVUMSMBVx6kcUsZYuu0lueg4FVGbixSimXga0LSXzLdo25KdPpWaKtWeV8xv4duPxrrj8SOaXwnH+L/ADba/gcSN9nbOY88Z9agjuInhDRgZq54s/0mSKIdiSfaubjnWzlMJYEj8a9bDysrHmYiN3cnv7vbkbRWOL+SGQvE5jYcgqcVozX9oT+8TcfcgVCbnT2X/jyRj7SGuxyi1axyKDTvzGzofihZnWC+YZPAk6fn/jXWrXl08VpI2Yo2ib0zXV+FdWaQDTrpsyKMwuf419PqK4a1Gy5onbRrXfLI6jFGKXGadt4rkOsmppFLnikzzSGNPFN/i6VJ1NAHekBGRg00nINSYy1Crg5NAEagnHGKceF460pBFKvXNMBm0/nTocpKGB5FOPWlUfNTjuJ7F6WKLUoNpwJQPzrnZLaWwmKOp8vPB9K02don3KauLdwXSeVdrk9A3cVdSlfVEQqW0ZkxsMZB4qdWqSfSXQGSzcSJ1wP88VU3MjbZFKH3rkcWtzpTTLNFMVqcDmpGLRRRQAUlLRQAlFFFACUUUUAFNJwKdRigZVd8k5PHYVGcHuKuNGrfeUGm/Z48/drnlTk2aqcUVsj1DH6ZqxAJAMt07DFSKoBwoqQoEG6ZhGvv1q4UmmTKaaCNC7YUf/WpL67jtYPLQ5IGfr7mqt1qiRoY7cbR/ePeua1S7ZwsYJzIfmPtXdSpNs5KlRJEN47z61CzMdvkmR8+hPFVtM0R9Wne4lYxWm7AK/ekPt7e9WNQBbVLsR9VijiH411kEC29vHDGMLGoUV1yn7OPunMoc71KMGhaVCgVbGJvdxuJ/E1WvvDOl3cZCQC3k7PFxj8OlbWOtAFc6qTTvc3cI2tY8yuLG4069a2uBvUHg9iPWh0ltnjngYgowZT/AHSK7DxPaiSETAfPGN31HcVhrGJLf2xXdCtzLU4p0bPQ7TT7lbyxhuU4Eig49D3FWcnmsDwk5FnNbE/6psr9DXQgVwzjyyaO2D5opkhHFGMGngUVmWMxijFOIpcUwI8HNLj1qTFNNAhuKAtKetKOlADCnNOUYIpSOKUDkU1uDI5BxVSQY6HmrcnWq8mOa60crI4r2a3bKsR9KuLq0Uw23Eatnvjms2QVTlBzxTcIyEpuJvbLKXmKQxn0pDbOPuSI/wCOK53e6ngmlF5Mn8RxWEsOnsbRrvqb5jlX70Z/Dmm7sdQR9RWOuqTL/EalGsSgctn61k8OzVVkam6lzWaNYz1RD+FKNWQ9YlrN0ZF+1Ro0lUP7Wi/55D86P7Wi7RD86XspD9oi/S1nHV0H/LJRTTrB7Io/Cj2Uhe0Rp04IxH3TWM2sSn7rAVXk1ORurmqVFidVHQEBfvOi/jUT3dtH1YufQcVzcl6zdyfqahaeRu+K0jh+5DrHQTavtBESrGPXvWTc6gzsTksfeqGS3XJpDx2reNKKMXUbJTI8h5qvdgG7tV9WA/WpgeahkO7WrJP9ta1Rm9izEom1qXvvvVX8FA/wrqzg55rldF/eajC/9+aaX+YFdRXNV3SN6W1xM8GlX3pD6ULWRqZ+rkFlQ/xRnNcrp7fIYz2JH5VualdLLfvtOUQbQa57TWLMzdixP611QVonPN+8b/ho7dSmXsY/6104rmPDYzqcxHaP+tdOOlZ1fiLp/CTg8UpHFGKU1iaDcUp6UUUAIelNPNOJpKAEpe3FJmlzxQAUd6QHijPFADJeuarPVmXpVZ+ldkTlkV5eaqS1af3qrJ1rREMrv1qJ6lJzUbelMRERTGqRs9qYakZE2expoJHc09utNNIoTJ9aMt60YAowBSGG5vWky2etGRR3oAUZ70e1Ge3pRzmgAozikNBIxTAXPemk0hPWmkinYRMnUVVkk2a3Cx6Ic/kKsxnJBrL1fcLskZ6Hn8KIq7sTJ2Vzd8OJ/pNuD1W0LfmRXSE964+O9Gm6tbO52x+SImI7ZAwfzFRy+M5IpZIjDDJtJAdScN71hOnKTujaFSMVZnZE56VzviDxBHaRPbWbhrgjDMDwn/165nUfFGo3qmNHEMZ4IjGM/j1rEDFZRvb6mqhQs7yInXvpE27bUfJsJVOS3SMnqWNXbBPLtlz1xzWPZQtcTieRdsa8ItbeHKpFGN0khwoHvWzWpMXodB4VjJiuJz/EwUfhXQLVPT7ZbOyigXnaOT6nvVwda4py5pNnVBWjYtYpO9LSd6koBQRS9KTtQA08fjSGnUEUANUUtKOKO1ADenFHeh2RF3OQAO5rHvddgtwViwzepq4U5T+FESqRgveZryDK1Uk4pmj339oacsx+9uKt+dSyr1roScdGYNqSuinKaqydauSDrVWQVojNldzURqVxzUR6mmIjPHrUbZzxUjZqJutIY0mm0pptIoD9aTNGabnnGfwpWHcUnj19qM4NJQDn6UAO78UmeaPpQRzxQAueemKQ0tNxzyaAEY4ppJ7DNOPTmmE5HFUInhPIrM1YO1xIqKWIwTgdF4ya0YTzV+1iSG6a7HzSMmzaRxjv+dJPXQH8Opy1xdLc3Bwcjt71DJpQuyTb4D/3TWnqmg5mNxphAycmAnGD/sn+lU0kmhIFxDLEw7lSP1ra9loY7y1MptMuEbDDaR61at9NVcPJ8x9K1Pt7yfLvlkPoF3H+VXLTTdRusFYDCh/jm4/TrUOdlqWoXempSiQIAWHsqjqa6nQ9LMDfa7tf37D5EP8AAP8AGptN0i3siJWbzrj++w6fQdq0xg8gVyVKt9EdUKdtWKKcD0pn8qdnisDUuUlOFHemISjtSig0ANNITR2pp5NAC5J6VRv9Shs1IJDP6VT1jWFtUMcLc92riry+knkPzHmu2jhnLWRx18SoaR3NHVNcluGIVjg9MVkZkmbLMadb2zSsMVt2emcDcOa9D3aasjzrTqu7LvhKYw+bA/3XIYfWukmXjNY1tarEQV6jvWrHNlAr9RXDU1ldHoU9I8rK8q1VkFX5BVaValMpoouKiarEi1A4waskhYYAqJxUzA1GwpAQnpTcU8jmmnIPTj1oGNK55PNJgU7GB60mOaQxKMUuOOKUDFIY3twKM/LTiDkZakGM8UAJ+NJjA55xTsc0nWmIaelMPant7U1iAM0ALG6oCzHAHWrljOXgMpHDn5QewFYV1IZMRIfvHFbMbokKRqRhRgVcUk7szm29EWHwfumiK8mt2+VuPQ1UaYA8NUMlyMEMRWrSkrMxTcXdHT2mpwz4Vgscnt0NXGPJFcBJeiFsg1taTrqygRTt9GPauKtQ5fejsdtKupe7Lc6QMMUuetV1kzTw1cp1EpORmlB4qINxilDUCNXFN704nim4piFpCRig5xSHFAxpOelZWtX4tIGjRvmP3jWsxEcLynoo4+tef67dNJM3PU104anzyuzlxNTkjZGZe3DTynJJ5pbO1Mz8jio4YTIwyOtdNptoERRivUlJRWh5cIOcrsfY2IQD5RxWokaoOBSooVcUMa43JyZ3RiooRj2qWNg6bT94VWLUwOVbcKOW4c1i00jJweQKazBgcU0yBxmoHB7GpsVcdIOKrt1NOaQ9+frUbODRYLjGFRMvrUhYetNOCaBkJXim4yKmOM0hA+lK4yHb6Um31qQjtTT0OKQxNtIUyCPWnijPrQAwLigjin5HamMwo1ATgCmscU1n9KjZ/WnYVxXcDnvVSWQnqaWVwFOTWfc3HG0VaRDYjzYlyOoqRLt/WqQpwOKARe+0sRwarTysQaYGpSMimpWE43RSeQk0QzNHIGBpJ02tkVGmCDk1pzXRgo8rO60bU2lttrHJUfpWxFcq/Q1wOhXRiuFGeM10shMU/wApwrDcK8ytHkkepSlzxOgD56GnBqx4Lw9Gq+kobFZGljpT1ptLn5vakGC2e9UIX600AGl7ClUUgK+qsY9MHq2Sa84v8tdkdga9N1aPzNNQjsCK821BCt0eO9elhGrHn4tak2nW4MgOK6W3jCqKxNLHTmt6IYRa0qvUzpLQcx44qJuQc1K/AqM8CskashbpTO9PbkGo84xWqM2KN2eOlMZyDg09CM9ap3LGLUY97EQycNVKPM7ESnyK5Y3g1GcHkH8Kmu7KW2IY/NGwyrr0IqmWIrPlvsac1txXHp0qE5yO1O8w00vmiw7oXe3rSbz0z1pm+jd7UuUfMOZj1phf1xS7hTGI70WHcduPak3Ejk0wuB0qNpR0o5RXJGbmmF8jg4qB5QPeoHnHc/hT5RORZaQA+1QSz8HmqctyADz39ah/ezo0n3Ih1Y/0p8ttyea+iHT3JYkKcmq/uacAojAH1qMk9qlu5SVtWOpc8VHnmlzkUrDuSA+9SKagXkVMgpMaZFcJkVnuME1pz9KzpBl8U0yZLUm09ytwuPWu1mG61t374IrjNPj3XKgetdxIu2ygXvya5cT0OrDdSop5qeKYqMZqDGADSjhq5EdR6CckcUgHHFO7/hRkAVZAzknHpUijFMFSL1oGWAnnWTxnqORXn/iCzMUxYCvQIn8tgfwNUNd01biIugyCK3oVOSWphWp88ThNMkwwGa6KBtyCublt5LS5IIPBzWxY3IdR713zV9UcUHZ2ZovytQHuDU6nNRuMc1kjVlZvemE+1SsM845qPGeK0TMmhBw1MuYRcxFOh7GpTgdelIDgdKtO2qIaurMn0nUF8v7DffKw4Rj0qO/slgcsykxsciRO31HcVHLFHOuJB9GHUUR3V3aJsI+0Qeh6ik43d4jjKy5ZaruZ80ewBtwKnow6Gq5IxnIIrRc2VwzGCU20p+8jdD+BrNu7GVcsIM/7cDY/Sne2kkHLfWLELelMLgVnyebHnMzr7Sx/1qs1xPziSF/o2Kr3e5LU+xrmXHeo3m561kNcXWP9WpHs1Rma67og+rUe73D3+xqtOOhODUElyAOtZjSS/wAUsK/8CzSqpfo8sh9I0wPzqXKCKUJstS3J7fnVd3YpvkbYnr6/T1qaOzm+8ESAf35Dub/Cl3WVu+5ma6m9TUc7fwor2aXxMhtLSWdjJL+7hHr1xT7u5STEEPESdT61Fc3c1xw52R9kWqxPYDFCT3YnJLRD2k+YFeg6UoO7k1DSrkGm0SpE2RinDgYpAMjPanKCee1QaIcoqVBgU1VNSn5V96llognb1qgwLMSBwOtW5cscD8T6VNb2xmZYoxxnJNNLS5Ld3ZFjQbNpbhWxXVXZHmLGOiDH403TLNbK181xz/CD601jkljyT1rz60+aWh6FKHLEhI56U0j2qQ8mmnrWKNTvfWg8jigDpS1oZgo4p68GmDr9KUdM+lAEy1PHIACsgyh6iqyHiph92kMy9a0RZk82H8CB0+tchJBNZzEFSMdR2NeipK0J45Q9Qar3um2uoRkxgBz/AA/4V1Uq7jo9jnqUVLVbnJ2t2rgc4NXfvrxVK/0a4s5C0akge3NRQXjIdsowa6dJaxOfWOki7JHzmm7Dj3qaOVJBwRUhjBHFLmsPluUyvHSmEYq2UxxTDGPSqUiHErYx0P4UEkH3qVkz70wpzV3JsV54IplxIit796oyWTR829xJH7ZyK1SvJyKaycc1Sk0Q4J6mG4v0/jjlH+0KqTGY8SWETn2roJLcNyADVaS3OelO6fQLNdTnXWMfe0wD6VCfJXppw/Guge3qs9qOuKLR7DvLuZHnOv8Aq7OJPrTHubxh/rFjH+yK03tPaoJLXHPbuMUrIHKRlSBnP7x3c+5qPGOgxWobYnkjFMa2OMAUyNTNKk9qTb/kVom19c0gtT6fpQFmZ/lnHSniPgGtAWxxzUi22egzUtlKLKMcZ6Gp0iOauLbY9qd5YUcCs2axVits21FJzVwQvIcIpOa0bPRXdg0nJpNqOrKSctEYttZPOwwuBXVaZpcdtH5kowBzz3q7BZw2ibmAyKr3Nw03C8LXFWr30R10qHLqwuJfNcY4UdBVZx1p5PFRseK5Dp2IzmkI5p3tS4zVIR3o6UDOfwoJ5oHU1qZgeBQOFFJ1NKelACqcCpQ3AqGnhsEUhk45xmq8m6JsjOPUU9W5z6U4kHg96QALpZECzqHXse9U7vR7S8BMeNx/A0txCyEvEceo7Gq4ugpxKDGfXtVRm47CcU9zLuNFu7VswncB2PWolu5YTtuI2Q+uK6RLt9oyRIp/GkdraYESJj8Mit1X/mMHRX2TFjuIpBw1S7Q3INWZtHtJTmM7D/snFVzpV1F/qptw9GrRTg9mQ4SXQYY6a0dOaO8iHzRE+45pn2jbxJGy/UVab6EtLqMMee1NMZ9DUwnibjcPxpwKHoQafM0TZMq7Dj/GmmIH0q5geopNnvT5hcpmvb8/WoGgwcY5rYMYPpTTEPQVXOLkMTyD3WozB/s1uNAD6VG0AHpT5xchhtak/wANN+x56j862XSMdSKjLRj3o5mHKjI+x+1KLPNanzPxHCzH2FOWxu5OkYQerHFJy7jS7GT9lVTzTSir0Wt1NIJOZZfwUVYj062i527j6nms5VYLdmipTfQ5pLaSY/KhP8quQaM7EGXp6Ct/EUY+UAVBNdxxLlmCj3rCWJ/lRtHD9yOGwhgXkAU6a5jhXC4FUJb55SRGCB/eNQDJbLEk+prjlUctzqjBIkmmeZjngelRg9KQmmk+lQWOB4x6U080dWPvTlXNUkSxgHzfSpAlSCPmpAnFUkSdhQO9JnmgfdrQzFHWjNNzjJoyeKBjs80Z5pueaM80APBpwbmolPy/jQTzSAnJyMVXnt1cHgU/PNLupDMeS2lhctC7IfbpUX26aPieLcPVeD+VbbgMMGqk9qrAnFTYZUj1C3c4EmxvRuKsrcOBlWyKz5bEOvK4PXFUXspYmzDI8f8Aumi7QWR0IvHHXml+2K330BrmvtOoRfxLIP8AaX/Cj+15UBMtr07q1HOHKdEz2j/fhX8qjMFg3/LPH0OKxF1q3Iy6Sp9VzTxq1k3/AC3A/wB4EVaqtbMl00+hrm0sz0dx9GpPsdv2nkH41mjULVulzF/32KeLqE/dmQ/RhVe2l3J9lHsXvsUP/Py/6Un2ODvcv+lU/tCf89F/OkNzGOsi/nT9tMPZR7Fw2tr3mkP40ot7IdQ7fVqzzewL1mQfVhUTapaL1uY/++hS9tPuNUo9jV2Wa9IFP15pRLEv3IkX8Kw21qzX/ltu/wB0E1C2uRH/AFcUr/hiodVvqUqa7HRNcntx9Kia4965x9Wun/1duFz3Zs1E01/MPmmCD0QYrNzLUDo5LpUGWYAe5rPm1eFSQhMh9EH9ayltdzZlZnPqxzU6QqvQVPMyuVD5L26m+4BEv5moghJLOSzep5qYjijFLVj0QnTHpQTzRgkiniImmkK5AzYboeacqse3GatCDvjpUqw8HiqSFcrJH69qsLFz9amEfI46ipFTj6VaJIBHTlTip9lG32piN09zQM7aG+6aAeKogQ80qngetHYmkz6GgYo+8aM4o70metAApz0ozyKahwPwoJ5oAkLc/SjPNMJ7+9LSAcD19QaM54Pemk9SKTPSgYMgb2YDA9qjaEMAcCpSeaAaVgKD2o7iqslkp7VsdaaUU0rDuc8+nruJxxVZ9NB6gZrpHiHaomh9qnlQ7nLyaWhH3B19KhOkx/3R+VdS0Ax0phgGelLkK5jljpKen6U3+yY8fdFdQ1uM9O9MNsKXIHMc0NKjH8I/KpF06MZ+UVvm29BSG256UuQfMYq2SBfu9KlFsAOFrVW25NAtvanyi5jN8kDHFKE44FaQtu1KLb2p8ocxmBDkGnCM54rS+ygHkd6esAHbpT5RXMwQEg8VItseMjtWn5IHalWMAinyiuUFtqmWAfnVvZgUbOKdgKxi4P0oCYzVkqMUzGBk+lAEYX5AaXbz9akA4xRjGD3FADSvOaTbyKkIyaMcimI0z0oFIelGaogWkNJ2FHpQA4dab/hRnv7UlAxR19sUnBJ780o4BpOp/HmgBSePpjNHX8KTdxx0pKAHHpSZ9+9Jn5aBSAdnmjvimj71HU0AOoJ603oRSnvQMaf6UCkNFABgGk2g9qUdaUUgGtGPSozEAan7U00AQmIcU3yf5VOTQO1AyHyuc0CGpx0xS/wiiwEAhwaBFzU9FAEPlfMKBGKlPUGk70AN2AdqNtPHSigCMr0+lNIxyelSkU0jIoAj2/KMUzb6VOBwR6Go2GD+tAEWOfpS7c08gZ/CjHP0oAYRQRzUmM/WjFAFon0ozzSHuaQnPA61RA4ng/lQeeKQ9Mego7igA9aTPOfUUZ6mkoGOB4NJ3o7UdM0AHuKTp+dL2NN70ALnrSg9Pem+ppR2oAARS96aOv40vc0gHZpCaDxSGgAJ559KQ9RSMeaWgYd6Xt+NJnAFKO9AC96YelOHWm+tACc4/CndqQ9aB/SgB1A6EUg6UKaAHdqD0NJ0pf60AIfu/jSUdjmk6jpSAUdDil/rSCg/d4oAM8/WkzxS/wAX40n8VAwOMn6U18Zz7U4jikagBvGenSk6/XHelBzg0o4zQAgoIzmnDoKMc0ASE8GlHWjtSZ5/GqIBqTPzUE5NN/GgY7Py0nU/hSHp+FJ3NADutGaTtScYoAfnk03OT70p6H6U3uDQA4dAaPSmjpS5xQAZ5pxpo60uaAF70HFJnihugoAa2c0pPSkYDdQOlIYvb8aO5pM5FGQOtADvpTf4qMjNJkZoAU9KBR1oX1oAUdcUDrQPWl70AKaKT+GloASkFL2pD1oAUd6PWk70p9DSATrQetIPu/SigAJ4obr+FJjilboPagY3oBSrSHp7Uqj8eaAEJ+U0oPYmgdcGgKvpQB//2Q==',
    ing:[['Сливки 10%','250 гр'], ['Эспрессо','1 шот'], ['Ванильный сироп','10 гр']],
    steps:['В питчер добавляем сливки, ванильный сироп и эспрессо, все взбиваем до однородной массы и переливаем в чашку.'] },
  { cat:'Авторские', name:'Раф соленая карамель', tmin:'2', tmax:'4', method:'Раф', out:'300 мл', ware:'Чашка/To go', gar:'Шарики Callebaut', photo:'data:image/jpeg;base64,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',
    ing:[['Сливки 10%','250 гр'], ['Эспрессо','1 шот'], ['Соленая карамель п/ф','35 гр'], ['Шарики Callebaut','3 гр']],
    steps:['В питчер добавляем сливки,заготовку соленая карамель п/ф и эспрессо, все взбиваем до однородной массы и переливаем в чашку', 'Посыпаем шариками Callebaut и рисуем веточку на кофе'] },
  { cat:'Авторские', name:'Раф урбеч', tmin:'2', tmax:'4', method:'Раф', out:'300 мл', ware:'Чашка/To go', gar:'Посыпка какао', photo:'data:image/jpeg;base64,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',
    ing:[['Урбеч','35 гр'], ['Сливки 10%','250 гр'], ['Эспрессо','1 шот']],
    steps:['В питчер добавляем сливки, урбеч и эспрессо, всё взбиваем в питчере до однородной массы', 'Переливаем в чашку посыпаем какао'] },
  { cat:'Авторские', name:'Брусника лайм фильтр', tmin:'1', tmax:'3', method:'-', out:'300 мл', ware:'Олд фэшн To go', gar:'Лайм колесо', photo:'data:image/jpeg;base64,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',
    ing:[['Кордиал брусника лайм','50 гр'], ['Фильтр кофе','250 гр'], ['Лайм','5 гр']],
    steps:['Наливаем фильтр и добавляем кордиал брусника лайм и хорошо перемешиваем ложкой украшаем лаймом и отдаем'] },
  { cat:'Не кофе', name:'Какао Berry', tmin:'3', tmax:'6', method:'Билд', out:'300 мл', ware:'Хайбол', gar:'Сливочный крем', photo:'data:image/jpeg;base64,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',
    ing:[['Какао п/ф','30 гр'], ['Молоко','200 гр'], ['Крем сливочный п/ф','70 гр'], ['Лед','6 шт ( 100 гр)'], ['Кордиал малина гранат','20 гр']],
    steps:['Берем стакан добавляем лед и кордиал малина гранат добавляем холодное молоко и после добавляем пф какао и вливаем в хайбол и покрываем сливочным кремом п/ф.'] },
  { cat:'Не кофе', name:'Какао молочный', tmin:'3', tmax:'5', method:'Капучино', out:'300 мл', ware:'Чашка/To go', gar:'Рисунок тюльпан, розетта', photo:'data:image/jpeg;base64,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',
    ing:[['Какао','10 гр'], ['Молоко','250 гр'], ['Вода +50°','40 гр']],
    steps:['Какао разводим вместе с горячей водой в тяван(чашка) ,хорошо взбиваем и пропускаем через сито в гостевую чашку , взбиваем молоко как на латте и вливаем рисунком.'] },
  { cat:'Не кофе', name:'Какао Creamy', tmin:'3', tmax:'6', method:'Раф', out:'350 мл', ware:'Олд фэшн/To go', gar:'Какао', photo:'data:image/jpeg;base64,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',
    ing:[['Шоколад 53%','30 гр'], ['Молоко','200 гр'], ['Крем сливочный п/ф','70 гр']],
    steps:['В питчер добавляем молоко 1/2 часть и сильно греем его до 95° всё греем в питчере без пенки!! После прогрева молока с шоколадом , добавляем холодное молоко и вливаем в олд фэшн рокс и покрываем сливочным кремом п/ф, посыпаем какао.'] },
  { cat:'Не кофе', name:'Матча латте', tmin:'3', tmax:'5', method:'Капучино', out:'300 мл', ware:'Чайник', gar:'Рисунок тюльпан розетта', photo:'data:image/jpeg;base64,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',
    ing:[['Матча китай longjong','2 гр'], ['Вода ( не выше 65°)','20 гр'], ['Молоко','250 гр']],
    steps:['Матчу разводим в тавян(чашка) с водой 65° , хорошо взбиваем без комочков', 'Переливаем в гостевую чашку через сито , взбиваем молоко и вливаем рисунком'] },
  { cat:'Не кофе', name:'Матча Soft', tmin:'2', tmax:'4', method:'Билд', out:'300 мл', ware:'Чашка/To go', gar:'Крем из матчи и матча', photo:'data:image/jpeg;base64,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',
    ing:[['Сливочный крем матча','60 гр'], ['Кордиал клубника','40 гр'], ['Лед','100 гр ( 6 кубиков)'], ['Молоко классика 3,2%','150 гр'], ['Матча','0,3 гр']],
    steps:['Берем стакан, добавляем клубничный кордиал и лед.', 'Заливаем молоком, после чего аккуратно вливаем сливочный крем из матчи.', 'Сверху посыпаем напиток матчей.'] },
  { cat:'Не кофе', name:'Матча sunrise', tmin:'2', tmax:'4', method:'Билд', out:'350 мл', ware:'Чашка/To go', gar:'Крем из матчи и сублим малина', photo:'data:image/jpeg;base64,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',
    ing:[['Сливочный крем матча','60 гр'], ['Апельсиновый фреш','180 гр'], ['Лёд','100 гр ( 6 кубиков)'], ['Сироп персик','150 гр'], ['Малина сублимированная','2 гр']],
    steps:['Берем стакан,апельсиновый фреш сироп персик и лед.', 'после чего аккуратно вливаем сливочный крем из матчи.', 'Сверху посыпаем напиток сублимированной малиной.'] },
  { cat:'Холодный кофе', name:'Эспрессо тоник классический', tmin:'3', tmax:'5', method:'Билд', out:'350 мл', ware:'Хайбол/ To go', gar:'Лайм', photo:'data:image/jpeg;base64,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',
    ing:[['Тоник chill out','250 гр'], ['Слайс лайма','10 гр'], ['Фреш лайма ( процеженный)','10 гр'], ['Концентрат в асс. гранат/смородина','20 гр'], ['Эспрессо','2 шота'], ['Лёд','100 гр']],
    steps:['Готовим эспрессо на натуральной обработке', 'В хайбол набираем льда , вливаем тоник Rocket и украшаем лаймом. Сверху вливаем двойной шот эспрессо'] },
  { cat:'Холодный кофе', name:'Бамбл апельсин', tmin:'4', tmax:'8', method:'Билд', out:'350 мл', ware:'Хайбол/ To go', gar:'-', photo:'data:image/jpeg;base64,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',
    ing:[['Фреш апельсин','250 гр'], ['Лёд','150 гр'], ['Эспрессо','2 шота'], ['Карамельный сироп','10 гр']],
    steps:['Готовим эспрессо на натуральной обработке', 'В хайбол набираем льда , выжимаем фреш из холодных фруктов, вливаем фреш апельсин /грейпфрут далее сверху вливаем двойной шот эспрессо'] },
  { cat:'Холодный кофе', name:'Chill brew Малина', tmin:'1', tmax:'3', method:'-', out:'300 мл', ware:'Олд фэшн To go', gar:'Крем из брусники',
    ing:[['Кордиал малина гранат','50 гр'], ['Фильтр кофе (чилл брю)','250 гр'], ['Лед','100 гр ( 6 кубиков)'], ['Пена из брусники','30 гр']],
    steps:['Берем стакан, добавляем лед.', 'Вливаем холодный фильтр и добавляем кордиал «Малина–гранат», после чего тщательно перемешиваем.', 'Украшаем напиток брусничным кремом из сифона.'] },
  { cat:'Холодный кофе', name:'Фрапучино урбеч с карамелью', tmin:'2', tmax:'4', method:'Блендинг', out:'350 мл', ware:'Чашка/To go', gar:'', photo:'data:image/jpeg;base64,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',
    ing:[['Эспрессо','1 шот'], ['Миндальный урбеч','30 гр'], ['Молоко классическое 3,2%','100 гр'], ['Пф соленая карамель','30 гр'], ['Мороженое ваниль','100 гр'], ['Лед','100 гр ( 6 кубиков)'], ['Крошка из фисташек','2 гр']],
    steps:['В чашу блендера добавляем молоко, лед, мороженое, эспрессо и пасту из миндального урбеча и пф соленая карамель.', 'Взбиваем все ингредиенты в течение 20 секунд до однородной консистенции.', 'Переливаем напиток в стакан и украшаем крошкой из фисташек.'] },
  { cat:'Холодный кофе', name:'Фрапучино брауни', tmin:'1', tmax:'3', method:'Блендинг', out:'350 мл', ware:'Чашка/To go', gar:'Шарик мороженого и посыпка какао', photo:'data:image/jpeg;base64,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',
    ing:[['Эспрессо','1 шот'], ['Молоко классическое 3,2%','100 гр'], ['Печенье любятово с крошкой шоколадной','30 гр'], ['Нутелла','15 гр'], ['Какао barry','1 гр'], ['Лед','100 гр ( 6 кубиков )'], ['Мороженое ваниль','100 гр']],
    steps:['В чашу блендера добавляем темный шоколад, эспрессо, шоколадный сироп, мороженое, лед и печенье.', 'Взбиваем все ингредиенты в течение 20 секунд до однородной консистенции.', 'Переливаем напиток в стакан, украшаем шариком мороженого и посыпаем сверху какао.'] },
  { cat:'Лимонады', name:'Лимонад Peach Bloom', tmin:'2', tmax:'4', method:'Билд', out:'350 мл', ware:'Чашка/To go', gar:'Мармеладка', photo:'data:image/jpeg;base64,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',
    ing:[['Сироп персик','25 гр'], ['Чай концентрат жасмин','35 гр'], ['Лед','120гр'], ['Газированная вода (свят ист)','150 гр'], ['Сахарный сироп','30 гр'], ['Мармеладка','6 гр'], ['Лайм фреш (процеженный)','20 гр']],
    steps:['Берем стакан, добавляем лед и сироп «Персик».', 'Далее добавляем концентрат жасмина и фреш лайма, добавялем газированную воду, все тщательно перемешиваем.', 'Украшаем напиток одной мармеладкой на шпажке.'] },
  { cat:'Лимонады', name:'Лимонад Barry Grain (cloud)', tmin:'2', tmax:'4', method:'Билд', out:'350 мл', ware:'Чашка/To go', gar:'Голубика и сублимировання малина', photo:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHCAkIBgoJCAkMCwoMDxoRDw4ODx8WGBMaJSEnJiQhJCMpLjsyKSw4LCMkM0Y0OD0/QkNCKDFITUhATTtBQj//2wBDAQsMDA8NDx4RER4/KiQqPz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAHgAWgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD2WiiigAooooAKKKKACiiigAooooAKKKSgAoopCyg4JGaAFopAQRxS0AFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUlLRQAlFFFABRRRQAUUUUAFFFFABRRRQAUUUUAOooooAKKKKACiikoAWiiigAooooASioJbkRSqr4CnvU25Su7PHrQOwjtsQtjOKx572MTMqKzv6VZ1O+it4gZJFCMcE5rOAhgX5GV2kbLMfvf/AKqTdjSCsrl3TbmV3Mci7QDwSOo9q1a5xppmci2DMYz1AJA/Gt20cyW0bt1I5oTuTNdSaiilpkBRRRQAlLRRQAlLSUtACUUUUAFFFFABRRRQAUUUUAFJS0UAJRRRQAUUUUAFFFFABRRRQAUUUUAFFFFADqKKKACiiigAooooAKKKKACoZyu3BbBxkYNSnpxWJrGoLYRPIyHIHA680m0ioq7MXUL+4uNSjhjicxg/NJ2Uiuts8PaKrOsnGDjpWFeRzXGiBE/cySAMAADg9au6MhsbN/PnDkdcdKUdDWWsSG6ktXaTd8/kyYOBkqabFbpNfJcRK2xhtaqLabqjaqskckcUczFmj9j3PrXSWcDQB1ONueMUld7kt2RPFEkKbY1AFPAwOKKKsyCilooAKSlooAKKKKACiiigBKKKKACiiigAooooAKKKKACiiigBKKKKACiiigAooooAKKKKACiiigAooooAdRRRQAUUUUAFFFJQAtJRRQAVma9AJdOZgoYpzzWnVTUpI47M+ZjDEDB780nqhrfQ41L29OlSvHAY54l2q7A4YCrOg6j5+mNLcyKr5J59Oxps2qpcag0LK2CcZ7AewrL1LS7kHzRbSJBIMMXG0J74rFSsb36M6O01OC+vInW7AUD7p6nFa39o7fMJGR1WuM0fQ2hljvLjbgchVBP0Oajm1u6XU/LkZjak7RiI9PrVqXcHFSdj0dWDKCO4payNEkzFIxfKccE9K0JblYpNrdMZrQxcbOxPS0inKg+tLQSFFJS0AFFFFABRRRQAlFLSUAFFFFABRRRQAUUUUAFFFFACUUtFABRRRQAUlLRQAlFLSUAFFFFABRRRQA6iimSyeWgYjjIB9qAH0UgII4OaKACiiqUmoIZDFaxtcyjqE+6Pq3QUrgXaazqoyzAD3NZl1BqtyoxcRW65yVQZP0zSpGlipluEj93ZyzfrRcC4buIozId+Bn5e9cl4h1TzVRH3A5JKEbfoB61uXN0Uw2Ml2A24wAKghtLa9uXS/gieR8hSpyVXtUS95WRpa2pzfhsNeTGeRQkySYGTwB6itvX9YEU7Qgo0Qj+cMud3sKZNc2Ok3aWFqA5ClvlGcH3NaEVnZaragXcC7lOd44JPfmps7WQ3smVNEvJdQijmgjMMIbGZDjNaV1NDKzwNGgB/jrE1JraHy7PTcArJiNd2Rnu1YuoPqE14YrZpGdSFJC/qKalZFaPU6KGWGASpAzO+Nx47e1CmSeJZGmPmH7qng1WzLbxxm4Qowj27QM/NSLI8sOTvErnCKPWtOhpbqdJplyJIvKJJdBzk1fqhpVsYLYFxh265HIq/TOaVr6BRRSUEi0UUUAFJS0lAC0lLRQAlFLRQAlFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFACUtFFABRRRQAtZ+toz6VMFfbxz7irhlRXKlsEetV71kk22/mAMfmIzzgdP1pPYa0ZU0FJ4bQC8cCWQ5EfcD3rUdgikscYrnRYT2lw9z9reRm5bI5/CtN4WbTiY5W3uM5kO6pjdItrW5mXOpQPI8V07CLPzKGIyPfFTR6zbRxxQwxGEscIoGARTbCDybL7VfbZSmSdq8D/GmG5F3EbmG0VZEX7xXPHce1K7Kdr7GnJPesg8mBBuHJZ8YrKSS6vZgI7cFYsguGypP171NpvmX4khuFeOHOcBvvD0zW6iJGgRFCqowABgAU7cxnJWZzzWt75xh2Qq8mXUZJx6k0sGmXsNlLHaMqOSRlutamn/AL+Wa8PSQ7I/9wf4nJq92oUUHM7WPNb/AErXUnlVyHPBBRRjb610OlrKzQwz2oGRhl3ZBHrW3AFkMlxO3yyNhFPTA4H59asCSAcgqpX5fSiMLFKWmxmzaHEJxcWMhtplXauACB+BqnYCTT7eae+neSdj+8dwAB9Paukrn/FMK3VusJnSKNcmRj2H+NNq2qFF66kOoTG6hCWrgTL8y5HDe1UdPMz6zFLeQNCqgL5ZPQ+tS20tmtkj2MhkNsAoc9/rWlG1u9szsmZmQneT3NHmbbIu3WoRxSFN+ARhT6mpbS7SQBOSw6k+tcsiQT/Z1vH/ANJiHZuvvWxp86RzKqBCWODihO5m4qxu0UUlUZC0UUUAFFFFABSUtFABRRRQAUUUUAJRS0UAJRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzGuXtzI+6zhLeWOX3cD64o0e7a8nSSGFWaRf3kjNux/hS6xqTiJDZKFzlUPQBe5pdHNnZBH3q0j5J2H5eeuKyWr3NlrEranfTm/NmGCZPGOrAdRUstxPY6YjNIZUHJwcn2FF1Yi4ury9U4kwPLNUR572yqwUJjMifxU02aKzRa02a5vYXmuVMUWDvCdxVzSo1knbdJtiyMJ3f/AOtVG21lHjhsoYg6MMuo4yM9zU95ehL0G2hIMY4CDimrCabdjphGituVQCfSqupyMtr5UZxJOwjU+mep/AZo0yV5bUM4YH1PeoZbiJ9QYnBNqvUngE/1xVPY57O9i/FGsUSRoMKgAAqK8Y+UIkOHlO0e3qfyqBdSgSDfLKv3sZrK/wCEitP7SkldZGjRdkZUZB9TSbSDlZoarNFawJHMNqYJRh/DgdKwodSe+h821ZTlsMXPIP0qbU9TTUYHTyjHEilsuRkn6VzcSyWdlPJ+8IdtwC8A/XvUc2uhvT2O5XVYo7YBZBcSjg44ANcn4mZpfMSW7InkwcRfdx9Kr6LHNaqYrmA+TM29JM5wT2rRGmTXF7dzqI5l2jG4YbA7ChvmQcqWphWUiafYywxTNcTvztVe/vW7p/2o2KLcZ2OMFgcHNQ28N1a3Tyz2iruGUCrnI/CthVjmuYVcrsb7oWnEu6sW7ax065tWgTMpUfNk8/SptP0pLeRXwVVB8oJyam07TFspXcSMxbt2xWhVpHO5dgopMilpkC0UlFAC0UUUAFFFFABRRRQAUUUUAFFFFABSUtFACUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAxoYnj2NGrJjGCO1YOuRwQzwlBGgAwRj8q2ry7hs7dppmAVRn6157d6lJf3jTq6LExzgnJPsAOfxrObS0KjuatjNe3hMRhxA/Uucc+wrUvdOS1gUrIPMcYbjjHrWRpmpXEL7/sTSTy8I7/IgqO8utWn1QR3EZCqPmaHBH0BqU0kaJ3dkbdrotpHvvA5iYphWY9OOvNZkUM1vcllvUvSV5VBjYOxz71s2Om2l9bpNcq0uBgKznH4itGOwtYV2wQRxj/ZUDNXyk8zUtTDj/tAqY7GWKEMfnMjZI+lQ61YXNtprzSXGckbljXG5v61vPpOnvJ5jWse/ruAwaq6nGLWELb7zI4O1Dl8nHHBpOOmpN7yuc3p+mvLbJFcov2pwflZycDsfatHTtDj0+IC5nEkudwZTwfrmueEOo6bczXVxBKXONhZuvsK2b/U54tPt3ktAJ5ADtJwAPWpTXU20Lmq3Mz24tbO0USZ37gMgAetcjdvqtuCkzs3mjJAGN3Pf0rqbK7V1LXLGNSfkHQAY4z60+dob+3NvFEDk8SPwB9BTfvaolabHIaTdSRGQXrspU52s2QPpXUxXmLVFmYIshA+X09axtX0C4Zvs0cavOOS4HWtO2tEltojJHiRV2yZ45FJPoa8yktTb0i4tmlMYz5qnC57Cpo9ODXQnlULhidvr6VjaVHbQzy3kM/mDdjax5z0rp7ebz4FkxjPbNaLYxno7olpCQoyTgUtUNTuY4oljbOX6betUZpXIJNRSaT92DtifDEVqRusiBkOQawbW2UW2FtxEDyXlbGf8a04FYxhEuAFUdI1x+pzSRUkraF2mNLGn35FX6sBUH2aM/fLyH/bcn9OlOWGFPuxRj6KKZOg77Xb9pkP0OaX7TCej5/4CaUe1LQIb9ph7v/46aT7Xb95kH1OKfSUAPSRH+46t9DmnVXaKJvvRofqopPJVfuFk/wB1jQBZoqvmVejhvZx/UUv2jb/rUK+45FAE9FNRlddyMGB7g06gAooooAKKKKACkpaKAEooooAKKKKACiiloASilooA4+xsRrQe5vrl5lbiNegA/vEU+38ONDexGIr5IOWOMcfSmz2d/aySxW7Kiu2FRF5f6egqzp1reC7ZLlmYNgFVYgAVil5Gi01Qam6WN4rWjrtaP94WbKqP/r1nWa2d2u6zLCfd8zEkAnPPFdaNPswgT7NHgdMrVVNIgiug0SbYxyRngmqcXcSl3Ltpbrb26oBzjk+pqeiitCBDVP7THGfOlIUOdsYPp60zVbpookhgQyTzHaqA9u59qkhtAZFnuArSqMIB0jHoP8aVwIZ7dtR3eYuyHjZn7319qz7uwtJdRRZZZbmcrkLnoB0Ht9a2b64W1tXlIJI4VR1Zj0AqHTLM20RkmO65lGZG/oPYUmrgZ9z4eW5RWM2yUDHC5AHtUMGjSWFxEkbmVF53N2A7Vu3Fwtvs39GOM+lVNSvY1jWHzfLMq5L7Sdq0WS1LUpIxk1OS61iWO2iJHXIH6mruoANZyNaKzzDG8AcnPpWPeayNGkis44Y5YnAAlX7xz3NbGgNulbzRtcjIBpR1Vma2fLcwrKxnsXlF4rqX5CnpiussDHbaYJHcKmNxJPApb+OByGkfk/KBnrWDNMby8eHpY2rbVXPDv3z7ChLlJvzqxozauZ499u3k254ErDLyf7i/1NSrG/2ZntYmWZgPvH5vxPaqKDyE+2sY3JOI3fhUXuf8KonxtpcIeC1nS8uVb955bBQD+NF0twUHLSKLQ068iZpLlkLN3UsxA+pNb0JSOFEUHgelcZd+Jb+4jDW01vErcrgbj+fNZ27Vb1y09+23/Yf/AAqXNx6M2jR9orOaPQLq/s7RN11dQwr6u4FZ3/CT6U67oJjMvZkU4P0J61w17Y2llA15cp5rA4XzTnLVzFxrJ88EOeOmOgq6bc9TGvCNJ2TueqXni6K1hMv2fKDrknIrltL+KU914nW0u9Ojh0t+PtKs2U46kngjPGK5K2191aUXH73cMcnIPtitbS9MsdR5uEGD8xB7Z/yK2cUc6kesWOsWN/bJPbTho3ztzwTg46fhVxZUbowryqKVLOMQh/MVGcuDxgkk5HoOamtNZkkD/Y7liqHDK55WsJuUNWdNGlGtonqeo7l9RRketeSat4vu9PiULcIZRIAU5JxVHR/F2r33iBofPk/fttC9NgHoPpUe1XU7I5bUavdHtWRSEenFcImoTmU5umSRR90Sc/jV6x8RXMc/l3jLJF2c8Ee1NVVexzzwlSKudJLCwYvA3ky9iPut9RS2WoCeVreZfKuU6r2PuKitNStbxtkUg391P9PWqmtw7Ylu4yRJCRkjrtz/AE6/nWlzns9mb1FU9LvBe2YkP31O1x7irlMgKKKSgApaKKACkpaSgBaKSigApaKKACiiigCC3tkgBOS8jfekbkmpsDJOOTS0UAFFV7q7gtEDTyBdxwM96SzuPPVsg5XqT3pX6DsWahurhLaBpZM4HAA6k9gKlziqEA+3Xf2lubeIkQj+8e7f0FDESWVuys1zcc3EnX/YHZRVuiqGp3Losdtbn/SLg7V/2R3b8BRsA2L/AE6/Mx5t7clY/wDafufw6fnWjWZcajYaRarG0g/drgIvLH8KhTUbyazEy2/kK3O+U4wPYdaV0gIvEbrJCqrOkTRuCWY9z0FW4bi1tLOOMuJcr8zjnd6nNZd9o7z2Es12yrL95QCT+B965Y3N5OPssQcn+EFuw9Kzcmnc0irmrJppv9WDwlRZ+Zldw5b6VoSX62CzbQcrwGPUewqSTattCkJ/1SAnnmoLGdLx5rO5scZJ+c/pVrRWNumpTsb97u6Ejl9xDbQ3Qf8A16Zd3KWmnxLM21GByo+9IzcnA/Kte+sFt7EG0i+aAhwg6nHUflmvPfGGpSWTxXiR+dBKgjiOeF9R9alppWQ6ai5XlsLe6o1xJ9juJXklHEcKg7EU9yen61z1toFpa3btcTsVznyYuO/dqqLrMhzJ5AVwckA5qveXsv2RZoHIDthlY8j3+law5VoY1nOWreh0d/rD5jjQhI0ACqB2HvVnSbu5uRI8O75Dk4rkxncsjcjGdzHitSx8RC0tpYLaNSZBgsDWjZgkP8UeIxNYLbiU+fDcbXQj2yGHrXOvdJLaEjgqe3eq17aTalqs4thvkWPftXnOMcVQtp2hlYNwOhBFRG0dEbT552lItm8lQruJ2g5zjrXaeEPENpb+aLtcKQADmuAuHSQ7lJ96vabZ3t3EzWdtJNHH98oM44zTbJVNt6I7vXb+zVDNbSEs55HbB4NVtBjv4tIubiztVbzF+QhwWOPb865O3juLq8Fs+U2nGXBFdPpX26y2N5Zih34DI6tgemM1hVl0R6uX4WUn7Rq3b1ItHuJo70XN3ZxPsY/LIQpJweoNaa4vLubUY/KSYffihJQ4HJ5HWsxLe4l1R01GdollzKHBBz+ParenQTWF/LISs1qGwzp2HfPtz9KwS6s+ghFaPrYtXN5exmyuraOSS2diC2OT04+nvW3JextbuJI8Rk9m6nFZEN7aSTmMzhY0bZGOo+lU9bia6vzawuY/JG8Mp3DGMjP1pJNu5hWhKdlJaG9E5W3SaCbbuI2lXH3vYk11llrcd3ZyWd86/aTGQpzxJx1+teO2F/eR2yGKMzBHJ5Yjr7d66fw1FeEPcy2rG4lP+jxsOdwyC/sozWsfI4sXRoum5deh6T4SlMs2pY/1ayKoPvjn+ldJWR4asP7O0pYGbfKx8yVvVjWvW6PnpWvoFJS0UyQooooAKKKKACiiigAooooAKKKKAAnAyaga6j2uY8ysv8KDJrnb3WFt2VZpDJckfKYpAyflTbK/vbx2hvGSKMAESKAD/wDWqOdXsNK5Bq2qxyy26dZmkHLDG3n7oFbmnXCLevbB97kbmPp7VhXek6fJqK+Xds82QxLHPT3pkl2mk6lJcx5mKrjy175qU7O7NLKx09+5mkWxiYhpBmRh/Cnf8T0q4iLHGqIAqqMADtXKafq08Edxe3dpNvnYEkjIUdhxUzeJXaMsqpHj++rZP0HGarmRk9Do55o7eFpZWCooySaxorSW9u21GedreJ02oqnDbPr2zWDearJqDAXS7oevkg4H4+tSW2oecphitLeLZ084k/kKnnTYF68h0y2dnsS7XK9WjO7881TOpXc84xGHhi6q7AZPvVt9F1C5Kzi7hXjAVEIAFZNzpOqWRcJIWiZuzAHP5Umn2NIGjb6kzyf6WzIVBJGScCqlrLBJrCMqkgk4ZV7+9N03TLq3vVEkrMH+8S3IHerp0cWt/HNZ7whbLHPeizNb62LsV9BZzXA8r5gNzEnrWEPEMpvS00abj/q0iOePerOoXVtcyyQ4HnA4YAdQKdNp9rb3sV4u+ZmXAjC4Ciqbd9B2Sd2ie4vJYIo7otwSMj0rJ1WwstUhkZNnkycvGx2rn1B/hPv0q/rMITTmQHlsYFcaNSlsiUXIOcOPwobswavqjnLzw9faRqwkKPJa9NxHzKO2f8RxVW60+eOVbqGPfbSnawxnYfXHpXc22rlYQLZlaM9YZBujP0H8J+nFJK+i3LmKaGbTZCc5j+dCfp2qHzc3MjaDpun7Oa6nmRtZ5reZ4Czxrncv9znH+FN02zCSIJY2lJJATkZ/rXcX3hqCe8EtreRS7cAiOQRsfUkN3qK7tm0tC0dnOSoJJKZOPr0/KrdXTbUKeCcpaPQpaNpK6dLJNI4UzDlTyUX0qtrOg20r+ZCrGV2ySnf+hqVtQW4tiBHl3+VRnJzVWC/mW5ImjYyqNqqeMH6Vzc2t+p9BTwlNU1CZiDRo2uPKExXnBLDG3610q6ZJp2meVHIU2hiJI34wRyTjnn6VTNsCrtdOFnkbjJxj3NaK2V9FaOiXcMq424JJyCDxVRlJ7jo4alTbcImMj3MkzAP0568e9X5Z3MTQmIhyVPnLlgAOpFZqPKkyx2zYz09fxrVa4eO08ksqs64OUwKnaVzaMvcaTIdaUx29tMl0ZYyCuxxgjH04xVzSL+4s7JGaLzoXJUBDkgnpmsk6ffXTqixs2BkEAnP0rW0vR5Y4mF3M1qw7Fxk/gMkVd+xEZpTd3uVTbrbWMyXajzcB/kbJBz1J7/hV3Q4xd2k0dhPNHISN4HzkgU6Sw0tH3TG9vSOPJj/dqB15Jyf5Vt6Nr0FrK6WttbaZbIudkY8yVj7n/E00kjOpXldckf6/MsWejfZY3bVfJjLtlYkBZn9Djr/T3rasL2FrnyYQEbPzAnc2P9pun4DgVg3d0ZHDW4KiYHzH3ZY/j2+gqGCVLV8QkkngnrRzJHnVoVKj/ea/oeqaNcrdfaZUOU3hV+gFadc/4NO7SZH/AL0n9BXQVvF3R4lRcs2goooqjMKKKKACikpaACiiigAooooAKKKKAMCJtME8tvbW6TuDuAjQHHrzU8dhK3zG3hjPOA3OPyq41hbs28RhH/vJwarvLc29wY5p0MJGQ2MNUWtuNXMa30zyZbmC6kEbHDI69Dz09ayNYvFI+wTWojw4Cyk4Lf41d1KItP8AaJbwpbochj97PYe9VruC51hbZZ7Z7e3jHyyup3yZ9/4RUWtoaL3TR02/ZP8ARNPj+03GOcn5Ix6k/wBK2bLS1inN3eSfabtursOF9lHanaNptvp9p5duBg9cHNaO2tEu5End3GbYx0RfyqKS3t5GDPCu4fxAYP51PtpDVEmbdG4tEaSG4JhAyyMoJA9jXJ3mpXV2+2W4CruwDjaTXZzh50ZYMYxguRkfhXJ6joMTxNJOWdkk3AjjA9Kzkm9jSGpBHez/AGwI4YrHyFTnd9auan4hZoGVcoI8ZReD+dS6JHCLoSSMoRPu7uTSa7a2d7KWXBbuy9Px9aGmlozSVlKwzw0LORnuZs+aeWB5wD710Ek5uFaFFjGOV3VhxxxwaWLSzjb5h80hUjB9qS3limEiidsJjqpBzQn0DSTuO1fTJbazlunnMgUAYPauCv4BK5kxkdzXpV/F/wAUzcEuzfKOp9xXBDBypANYVXyy0O7CwU6bT6M5pkuLeUlN3tgGtq3kW5s0Z/v5wwPrU0ltGcNgH1zVWSMwOfLJXPPIrN1LnTToJNjmt4VYmKWRWK+x/SobRh5zCO6l83Hyor4BNMe4AX515HdTikW8gQqxhQyZ6tx/SqjO+5006EV5f122FuL+8WVt8ak8qQUD4/Hmq0t2BP50ttEZVxhvJINTvdpNKQSBHngMw4poMCMcyoVJwcnrUyeuhta2i/r7rFd2glOWsIGL9fvA/wA6tQ2k0EayW9pbgtx+8mOAPpmiaCCWPC3kQQdMvzWVd2GWZhdKw7YNEWXC3X9f8y3eSR2z7o7ODzCcu7wnBJ7gmrqak8lvviEJK9QiIdoz9KoXGoTNbR2ku25242qVP880z+2b+zby5YliXqqxrgVqwnyp8trhfXtyylnuZiP7q4Ax9apwah5BB8oO/rIxbitN5bHUMSldjsozHwAT61LNpelLG7HzC4Gf3Z6n8ahNjjBrVIjS6MwCyPuDph1C8YPt/Wn2sthaW/2ea1imDgjd0JPrnGRVFZZBH5aKFUnIA/rU8Fs8sokmwcdqTmW1FR97cvJJF5P7kBASBtBJ4+pqe2jKv3NNSNACoXHHarMGRk5+UGpvdnHUa6HpPg0AaM2P+eh/kK36wfB3/IDzjH7w/wBK3q7ofCj5ut/EYUUUVRkFFFFABRRRQAUU1mCDLGoDcOSdqgD1NAFmiqjTPjqBTN7kDLMRSuBeoqiHfsxoouBcrI1EwTTOessS4wGwaia8vdR4tVNpan/lvKME/QVnuJog8aR/KW5k6mWpbvoVFXZpWUcF7cAywhkhwVz0BraJGMGqtlAIbVFC7TjJ+tT4wMk1SCTuyJ7eEtuUFG9UOKaBPGpIlEg/2xj9RUNxqdvCGEYadx/DEu79ahfZqNuhmuWhUnJjA2n6HPNFyR76jKZzDDCkrry21+n1psksjS7HPLcYTnFYl/DdafdPHA4lldflcgA4/CrdhJqKW+6fYZVHBHGfwqU9TaMdLmysbxKsQuMcYA2CqN5p8lwNpuHwevAqnZ3z3VxFvDK4bDj0NdCetVYmUXBmJFoUCcsWb6nitGK1jRQoRcD2qzQKLEXEWNQPuj8qims45VA2gc5PFWM0ZphexnazGsegXSJ0WP8ArXmLMVmOe9epayN2jXYHUxGvKbvh648Ruj2ct1jIsCTIOfSql7g7WXr35qEykUwybxgmuW56qp2dyF0zUDW6kqckYq7imOM09hczvoU2Tn1+tRPEOwAq4w4zULDmpNUrlNkAqOQE596tuKjKU0zRKxXgaW3kZkQHPvRM01wQXIUgYAHOKshM0hjxV87Dkje5Xjt/mQljgdq0Y2/c7O3vVYDFTKelTdmjJ0UZ6VaQY7VVjIqzGeen600c80WVUgA/hU8AIYZI9efyqsp46/lVq3UbwScZ4HtVo5Z7HpXhI50NSTn94efyrbrG8Jrt0CH3Zj+tbNd8fhR81V/iMKKKKozCiiigApCcCo5ZCDtTr6+lQszMMMxPrQAjku5LEcdgaTnOAOPWlHXijnGB1pDEKLye9Io55JI96Uk56ZOOT2pQCOcUAIRzmilHTnrmigDK1J0vQJILgRwocbj918dePQetJBcW0cYigjmvSuCvlocD8TxVLSLS8sIv9L00zMO6SBsj0wauXHiKO1GJbC6i/wB5ABULux3srIu+bqk5G2KG1Q93be35Dj9ajudKlukUTahOSDkhQAp/D0rKj19rxv3ZW2UHlmRnP6cVYh1q3ik8v7VJdO3TbHgCjmiyTXVrm2jAECSoo6xnafyqr9u/tC0YRowG7k7eQP8AGq2o3lw0GEUiPqSoIz7ZpGu0SKGSM7Ec7QoXHPvT5tbGkI3MXXHm06WC6YtIJHy25uVA7VcsNWGplpYVYIo5B7n2rP1b7Zc27xLE04LEMVTp7inwyxaRp5V8AMQPvY5NJaM2SNywMNoZJpFG5jxz3NbCXETyBEYM2MnFcFNet9sHlMsp8vcYQffrWtoE8k2pDlhn73GMVYTp3TkdZijFLRTOYTFLRSUAVtSGdNuR/wBMm/lXkt3kMS3fp/n8a9cvUMllOg6tGwH5V5He53MG69K5MT0PXyx/EjOdsfLUW/BHNSyrVZuuK4j6CKui2j5XNBPFVFkwR6VaXDj736UXJdNIa3I4qM1OUxUUg5yKVxxiQsue1MIqY8CmYouaWGhcUpGePSl68UnSncdhuz0o2YpwYA0vU5p3EwTIxVqIEjoKhjTPNW4VPbrTTMpslRDjPpVy2Te4UnAHpUKxYj3GrFjy/wAx+n1rWJw1Hoz03w2P+JFb8Yzn+dalUNDXbo1svovrnvV+vQjsj5qp8bCiiimQFMkfYvHJ7U+oZFzICcYA70ARc4PGDScE8c0gkV2OHB5p4+7kCkMPYCkIxSjJGaKAG9SOaXnP1pfQCjvQAn+c0UE+nSigCsZplHQH6VG9xKwKtCzA+1XQmO1KAPSgDGe1jkyRp6hj3B2n9KyZ9BuFnWW2T7pzsdzz+NdgUFNKehNJxTEchqFxrkkohW0QKo+XD5z+BrQt4zaacXu41jmkO4gHOK154S6FWAYVyOppcR3iWyh5Zd+VDkkEHv8AQVL93U1g76GnpmpLDAyStiVjuyByVq9fQWd5bqGiG3cGHFYd6gtYg8SiRo2CuQelX7C6a6XaVOMZBpraxpKPVEUtpZrdmdIFVsY+UVFpj3i3bSMu0nj6itMwnPSpoYCO1Mnn0sXYZXI5qwrGq8aEVYUUzEdmilAoxTENcZjYeqmvH74MJnJ/vH8Tk/8A1q9ixnivIdWG26mVc4DHr2rmxGyPWyx+9JGTI/dQQe4qszc89asNgHOKryDnjpXAz6OAzPenxSFGFR45pDSNLGqhEi8cn61G69fSqcNwYqke7Vugx9KCEmmKetMJFRPKSOOKZgnvSNEiVmHamYLHNPRN1SbAOtAXGKhIqVUwcVJEqg5NWI4gz5xTRlKY2GMnoDWjZ25ZjuGOeM0tvEBjv2q+CkURkOMCtIo4KtRvRFXUiIEWLjcQCfpVex3eaMc5IFVbm4a5uGkY5yeKt2LEyELjhT39qtO7JlHkhZnquhgrotoD/wA86vVW0xNml2q+kS/yq1XorY+ZnrJhRRRTJEPAyaqyShjhh8ue1WJv9U3GeKqcbV+tJjHxrGAWjUBjx0pw96jZmWDCcM3Ge4qCS7CSiIKWwOWpXAt0EflUCXEcs3lpvLZ9KnwTjOAPSmAcYpD0+lLn6c0Ee+aAGgcdc0U6igCTFJin4oxTER4op+KaRQAw1R1COIqsjIDJGcofer5WopYg6YJ/GkUnZnH3gL3KLC6xZJYq/Rmq7ocn7txsGScZFaLaPbtIXcb2JzlqtQ2kcQwigD2FBrKomrCoueoqdEAoVMVIFpmIoWnAUCnUCCilooASvJ9ej8vUbkZz+8OK9ZryvxMu3V7sdFErdT61z19kellztUZzUvEmehNV3Izx1PWrN1gZqkzc81wSPpab0FzjnNNY4FNzmkLDdg1BukBJz/hQOOvSmk89qaWoLJGcLyc09JFbp1NRiQAYIyKXcMEYFANF2HBHSnnBJ9qpwzbGGc4qw8oOCoPvgcU7GbTJgQOtWYpBkDPTGTWcZc9GH50B2yPmAH50zOULm9FdIvcUy/ummi2xHkds1kLMc9elSHCEuzhmYcAdvrVX0MPZJO45OPvda1dOAEvI4PBNZURDOOnWtbTvmuUA6bhn860gc9fY9ctF2WcKf3Y1H6VNSAYUAdhS16R8qwooooAZN/qzVUD09atyDchFVNu0NuPQ8UmMbN93A65qpc/KiOMbsc57irjKN+MVBcwh4wx5IwR7VLGgsXUSErzuWrgILFRnI68VVtkIdm9QMVHMzLIf3hAZs4zTWiAv0hqA3EccO52JGOMDNLbXMdypaHJAOORincRNxRQaKAJ6KWimISkxTsUUAMIppWpKCKAISlAWpcUYoAYFpQKdilxQA3FLilxRQAAUYpaKAExXmXitgur3QYfxnpXp1eceMFUa1cBhwcHp7Csa3wndgXaqcVP941Rk4IA79K0p8pmqE4xnP1rgaPp6ciuW5xQ5XAIOCOoowNpP86jI5PPFTY6UxxPHemhuaZvwdpNKSMcZ/KpsaIkDc5pSw6DpUQbFAPrRYol3cd6ejnB5/Wq+eaeDxTJZMHPr196AeOnNRZzT1Yn8KdiGTITxUq73PYA1AvYdverEZ9utUkYzdi1CoXGBu9sVuaLGXvoQcn94vH4isWAciul8NqDq1so5JkUfrW0FqeZiZe62epUUUV3nzIUUUUAFVJlxhTzuarR6VBMD1HakwIpCN5X2pjEbAOuCM1VkukimzMCuTye1WomR0LIQQe45pDG7lSVFxycjFQ3sTyRERNhxhgKnlIRTJtJI9KA2ZMkcFaQyCNS0O3HK9R6U21dov3OAEB4Aq2MBSc8VSmjPmJKv3kOM+2aALVrKdhDgli5HP1op/wBz5lHPUUUxF+iiiqEFJS0UAJRS0UAJRilooATFFLRQAlFFLQAUUUUAFed+NQP7bkBz91T19q9ErgfHce3VUfP34R/M1nV+E68I7VThLrls+tZ8tX5+p5qhKa4Wj6Wk9Cucc+1Rn2qRgTyoqEnrU2OtMXcMYPSmEjtSE8UDB60rFpgD2pd3tTegwKQHnpSsVcf70oPNNOD0HzfWnAEH5sZ+tFh3Hgjr1p6tUQIPQ5qQAdKZDZMhHfPFWo/SqqDjrwKtwZzmqRzzZet1O0+pNdV4UTOu2qjqDuP5Gubt0ywGOK67wYoOtqQeik/kMVtTWqPIxUvcZ6BRRRXaeAFFFFACUjDNLRQBQu7VZFORmsnyp7GUvbn5Scsh6GujIzUEkIYVLQ0zMTUoJfklPlN3D9PzqYSbQu1gVPOeoqve6cHB4rKa0urb/USOo9Oo/Kpd0PQ6NMYBzwetQsdoIBO70rOstQmV/LvYwFPG9f61rL5cw3IQ3uD3p7hsOPzREk4BFFEvyw7R17CimBoUUUVRIUUUUAFFFFACUtFFABRRRQAUUUUAFFFFABXE+Pk/f2z+qEfkf/r121cl49TNtauOxYfyqKnwm+GdqqPNLlQrGs2XgnNat2OCe9ZcgzmuNn0lN6EDkqPaoH6n1qxIPlwDVdhgjHNTY6osYeOtNzz7UpznnpTScVNjVMO9Hek68CkzRYpMfnninL160xadRYLkq88du9SDHp19ahX1qQcnOOaCWywh7VcgBIHtVOPoDV2LIGRVI56jNG3569feu18DpH/aczL/AAxYH5iuHjBAAFd/4Fh2SXDkc7AM/ia2p/EeRjHamzsaWkpa6zxAopKWgApKWigBtIRTqSgCNlB7VDJArdqs0hFIDNkswe1V1t5bdi0DEc5I7GtgimFAe1Kw7mS94UlBljYepHOKK0JbZXHSilqMv0UUVZIUUUUAFFFFABRSUtABRRRQAUUUUAFFFFABXNeN4y2lQsOqy4/MGulrE8XLu0J2x9yRSf5f1qZfCzSk7VEeU3x3SFh361ky9Sa175drEetZEvcGuNn0VJ6FZzgc1Cf0qZxxUR70jriyI80xh1NSMOeaYeKk1TGY4yKBjvn8KU03HNBSY7jtThTBT15pFXHr1qdBmoV7VOnsKCJMmjHzgVfh6gGqUQOeOtXo/mYkY7VSOaoy9ZgGXLcgdK9G8Fxlbe5c85KgH8Cf6157ZqWIIGScfhXpnhKMLpDOOkkpI/AAf0reluePjX7huUUUV0nkhS0lLQAUUUUAFJRRQAlGKWigCKaRIIjJK21F6segpwwQCDkHoRSuquhRwCrDBB7iuVtNRbQtabSb1ybNjm3kb+AHoPp2qJS5XqB1GKKfRVgLuXjkc9KWqueSM7iPwoDOhOATn1PFK4FqioDIcdcfShJflBzkHpk0wJ6KjEo7jFPBB6EGgBaKKKACiiigAooooAKKKKACs/XYfP0S7Qcnyyw/Dn+laFNdQ8bIejAg0Madnc8YvlDZrFmGHORXRatAYbmWIjBViK5+4GTg1xs9+lLQot96o2FSsAHpjL68DtUnZFkBFMIqRxyai5HWkapiHr7UnHQ0p5FAFI0TAU8AE0wDmpFHtQO49RzxUyHt1PtUSL71YQDIzRYiTJIwc5xir1vsU85OeMVVgBYgkcdq0YhlkT3yapHNNmhaeYRtQYBGPwr1TQ4Bb6LaxgY+TJ+p5/rXnulWjSzoqr95gBXpyAIgUdFGBXRSXU8TGTvZD6KTNFbHALRRSUALRVFLlodUe1nb5ZhvgY98feX8Ov41epJ3AKKKKYBSMyqMsQB70juEQs3QVm3Dl28yRsKOg9KCkrlmW4Yv+6YYH61zPiuze908yr81xDlh7r3FW7i8AJ2DA9e9ZrX+2XO4A/WhxUlZm6o3RF4Z8QyFUsrmdtyjETk5yP7p96K5rVYBbXRmjUpFIcgD+E+3t6UVzKpKn7skYNuD5ZI9YUjoMjufY0vIHX8KYyRvgN8wBzTwNoGcZroEAOfvLj0JpD/rAUj3Ed84AFPAyOSMjrilGOcUARhWAxwOfUmlHXpgjpT8jB55pB05GTQBIj/3j+NSVXIyMHoaejhUCnORxQIlpKQMGXIPBpaYBS0lFAC0UlLQAUlFIaAPP/GliLbUGmUfLcfMPr3/AMa4WdMsx7A9q9l1/T01LTzE3EindGfQ15PqFlJbzSJImMZzWE46nqYWomrdTBkGGH602VVAyp+tPnyDioxufI3dOlYnpKRCx4qI8YyM1Oy45qJuBz0osaKRGQO1KfcUH73FITz9aRqpCgjsakXtioT19B3qZAo538fSgfMSoDnnHrU0Z3HHYVEgXcMktjmpU5yUoIci2jhUDA/UVp6WhlcHu3r2rLhhZygUgh+p9K6jTLMO6lMbAPmbOAB6mqSOWtNJHTeGLU/aRKw+SMZHua65Wrn9IdfL/d/d/nW3G3FdMVZHhVZc0rlgGlzUYNOzVmQ7NLUM0yQR75M4zjgVRuNV2YEMe73aiw1FvYsarYDULPygxjlU74pB1Rh0NZ2ma4fPNhqy+ReIdu88JJ9DTLjUpLjCjKAdlNZ5Ql9wfr60cjvdGipN7nYUVyqX13aOux2dO6nkGtB/EllbxK94HhDHGQNwzQ9NWTKm46l+9YlkQcDqax7yf94UU4Apl34l0uYgRXkYwOrZBrHn1SBpMRXMLf8AAxSUovqaUrdyWdXkJC9feqE9hMfuyIxz905FWFvFI5YH6HNRz3QxkHkU7nZFtbFSJWctY3kWQwJjJOfqKKu74760EkZCzRHJ9QRRUuz3RLtJ6nd8HoME9+lKRjkmjt6Uo4/+vTPOG4z1HHqaXp70vGetGfxoAPT1ox7UDiloAKKB1pCQoJYgD1PFAATjPOAOSc8UltcLOXCHdsPUdDWdqE8NxEUQMxU8MOOaTRWCzGME4K5xSvqO2hs0UUVRIUtJRQAU006mNQBXnPBrlNf0+O5BYrz3rrJBkVmXsG9TUtXNIS5XdHlmp6JMhMkAZ0+nIrnpQyMQQQw9RXqk6yW0pdV3Ieq05bDR9WTZJbxPJ3Uja4/GsnA9COKcfiVzysMrJx+IqMr1wM16NdfDuzkYtZ3k1u3o6hx/Q1mz/D7Vo8mCS2uPcOUJ/Aj+tS4SRvHE0nszhWG6X5RUTj942M4Fdg3gjxAhJ/s4nPdXU/1qvN4N1wDfJps3HsP8amxusRDuc0CQOhqVBuGdorpbTwNrc/IsJVB7syqP1Natr8NtVeQeeYYl9TLn+Qp8rE8VTW7OLXryw/CrMEJk6A5PTivTLH4bWUXN5ePIf7sSBP1OTVy4Hhzw4NltaRz3QHC/fbPuT0p+za3OeWNi9IK5xFhpv2a28+7icQ+4wWPoK17VJbkhQoig7Iv9fWpJ3utXuluLwj5fuRrwqD2Fa9nbbFAxVRic1Wq3uX9OQRxhR2rVjNULdduKvpWqOJlhTTs1GtZV3eGd2jU4iBxwetUhRjzBeXKvMWLEgcAD0qoZQxJwcVDPMBwOgqpJdleFA/OrSOuMNC6xOM/dpjE/wnn3qj/aSbgkgK+56VInySbWc7GGUIP6VRpytbmjCyOnI5pIY1trxJZMNDu+cMMjHes5pZLa5BbmNjwf6VrtIjW29uUxzUsznG3zHXmlafeSOxs4Cp4GIwP5VzOp+G7KEsfI25+6VY11NrKM7UJKADBNF9seAiTJPUcdKjlT3RlFJPVHmtxozp88EroO1VGmv7fKmXeB/e5rvJYI2IQFce9VLiz0qJQLrDMeuOR+lS6cemhtyQ+zdPyPPpptUmvUNjcLBJ2BbaD/AI0V3S2QkeL7Lb2nkxtlGWM5+uaKmzW5LlJbu56LjjpRj060vFFWcgmO3Wl4AzRS0AJRxmjJPSqt9dfZYQRtyTjmgCy5CqWPAFZM921zujVdqdORnNRvdtO2Xf5R27A1XMoZiq8BepHrUtlJAAY05BYAcnPJq3pMmNQIx94EVUmYKhyfyqfSXxepgZzkZxSW43sdDRSZorQzFooooAQ01qdTWoAiYVXkXIq01RMKBmTdWgcHisG90vLblBDDoRwRXXumaryQq3apaLUmjkotR1ixOFl8+MfwzLu/XrV6LxeUwLvTGz/eif8Aoa1JbNG7VSl0tG/hFLUu8XuiSPxrpSn95HexfWLcP0NS/wDCcaJ/z2uD7fZ2/wAKzX0iM/wiozo0X90UXkFoGm3jrSz/AKqC7kPtEB/M1Xl8aTvxaabj3mk/oP8AGqy6TEv8NTJpyL/DRqFoLoUbnUtY1IFZrnyoj1jhG0fn1/WmWumBedtbUdsq9BVhYvalYfPbRFOC0CAcVejjx2p6pUgCqMsQB6mqsQ3cdGtWk6VEgBAI5FSblQgMcUyCPUJNlqQCQXO3IrBkk8mPbgVsaoR5cRHPzVzt8dsj1cTopLQp3V1gkk8VkXN+wB20+9lPOaw7mf5sdas9CnFE019KTw2M1Zsr+5hxmTfGDnYT/L0rDL7pBmh7hlOF3Ed8DNZylbUuVj0lpkudHeaPDEJvXPqOamR/3K/N+5nQMnscZx+VcX4Ovrm5e7tpUK2rxsEYnncOuPwP6V0k8pXRrFUOJIkB/IYpxkpK6OS19DS0yY/aHj9OlbGCsiM3Qe9c9oUonuJJU4woBHoa05G8uYszZLUPRGNVe8UNYlks7tZIkR4X52YwQe9Vm1e0WBmKRQSEd8Gr+pW630Kxvwg5bjNYF74etliAhu1jP+0u7+tczk09zmcmtLle81KOaPadRYp/dUdaKpS+HbYn99frj0jTFFLnfcftH3R7H6UdqqG5YYxggDvUUlzL8pBAHXgVvcgvkgDngetZ91qG0lYgMA9T3qCWQn5pHLA+vQVXlBY/L3qWxpF17qUp949Og4qs2ZCA38JyeaiMrblgc/MRn6gUrSKUEYUlcZyOBSuMimUORtHy54IoKhMH+LHUUjzLGDuYf0FUv7QRnO3L/wAqQy3IVEnOSa0dIjVR5jH5+ePSsiItKxY9TWpYghsA0LcHsbQNOFQocCpga1Mx1FFFABTTTqaaAGEUwipDTSKBkRFMZamIppFICuUphjzVkikK0DKhi9qYYvarhWmlKAuU/Jo8qrmykK0DuVRHTglT7aNtAXIwtVrzG5Ub7pGauOwjQu3QVSlYT43JgjoQaCob3JLcuijbgp6GpnlBxuO0VT2sqHL4x0FPs/OWYF5InhI5AOSDQzRxT1JfNRn8ox+ZFjr6Gqt5oS3OXgnKk/wuMj86vyYXJVRzRb3OTsKYI96aYrtaxOO1DwxqAHyRJKP9hh/I1zVxpE8VwyXEbw/7y4zXsYwRz19KgubWG4jKTRq6nqpGarmZrHFSW54RcxvGTkYNUheTRJJGmAX7kV6X4h8LrGjSW5zHnncfu/j6Vgz6HpUdqk1ysgZcBtso+b1IpOKmtTrVSM1oZvhCO7gFxcXMgaCPJXPUOw6flzXZXarHp0eT0jXH5Vycly91JDa6bbGOzVsHqeM8k+prb1VLjUJwz74LJSEROjSf4CqhTUFZC5bWNbw44GmNMn/LRzg/TinPMxu/LLFmBqS0WO1so4YwFjjXgDsKrW0Z3yXEn33OfoPShq5g9W2aLXbRRbBjLetYE9/CkksSWk07qSMnIUfTFa8SmaYADJJxWmbRioBOB6CspxuctVLQ4NoNTvnzFEbdf9okfzorvBaKvRQaKz5EY2LbTCNAWU8nGRSiUGMnBPtUMcjgskqguO2aSbYsWZDx3BOKooJWfZ8pC+oIqLzAMDq3pWLqmv8AlxtBZHzpiMBuqp7k96x4ItTuTm4u5Wz2BwP0pXKsddPfQW6/6RKqse3f8qzp9SnuRstI9g/vuP5CoLPSlXlhlvU1rwWgUdKNWGhlJYyzYad2c+5rQt7BVxxWlHAB2qdYvamoi5itFABwBWhbRbaakfNWo1xVJE3JFFSCkApwqhC0tJS0AFJS0hoAaaQ06mmgY000041G7bQTgnHYUgA0nFV2nl3YW3YD+87AAflmq9y7uCPtLRAddgA/XrWU60YDL9FcpdWtirl57m6kY+s7DH61UdpbR0lsNUuI0ByUmfepHpzWMcVFu1hHa0mK5C48aJAdohRm/wBli2f8/Wnwa7reoLmx07Cno7jA/M1v7SPQV0dZiq891b24JmmjQf7TCsA6Tr17/wAfuprbqf4IRk1LF4R04HfdyT3Td/NkwPyFO8nshiX/AIq0dFaH7QZH7CNc0+21BLuDzYo5EXsXQqT+BqS6l0Pw9b+a0cFv6KiDe39aqm/gu7YXEBYo4yCVK8fjTV+rNaersSzSO3zK2AOasW7hh5hAVmXt3rKjdvs7uw4Y/LViwlJtdzD7hIHvVHS46GvFMHjKkncDTNxQnB6023GI93941MsW/lsge3ekzF2THrdYjAj/ABPemy3bpGrMODUc0aquEGKzGLiUoznawOAT3pcwlFM1zOk0ZDAEEdK8+137Pp+seTdMVt5BuiLDIHqPwrqoZsHaa5f4iKklrZMGxIHYAn6Cm3y6jTdN3JtN1CwjDLFtcr2TnNSCaW7ufMkXai/cX0rndBgiuoVPAdTg47Gupi09WUbmLY9TWinc2U1uTGcBTEOW7n+lPAOACetCWijG0dKtq0VsvmTFFOP4iOKHIiU0kWbG18s+a55I4HpWgornpvEllFkBzK3og/rWdc6/e3n7q2BiVuycsfxrF1EckpXZvatrMFgpRMSz/wB0dB9aKy9J0OaWQTXAx9eTRU2nLXYnU1NQvZz/AMeUfz9MyLwPwrHlsb69bN3M7j+6OB+VdsbOPOdvNIbZR0FXyl3OTttFCY+StSCwVB0rX8jFKIvanYLlOO3A7VOsVWBHT1SnYRCsdSLHUwSnBaAI1TFSqKULTwKYgApRRiloAKKKKACkpaSgBDTTSmkNAEU0ixrlzxWdPqkSdM/jV+6gWeLYxxznNZTaMoziXP8AvCuWt7Zu0dilYrTamzcqPpVCe7mcYwPqauXNklt1nQn+6ASfyFZk85XI8h/Y8Vxypz6jMu8W6kYgPgeoFZ13bRw2zPMzSzNwgJyzHsBVu8/tO6m2W+II/XGWNXtJ0gwzefLvluAPvt8zAe3pThSktW7Imxf8K+H4bawim1K3WW+PzEP8wjHYY6ZrqwcAdAKw45dQIxDbJGg/jnfr+AqOS91O3lDSNaSRD7wXcCK7I16a0QbHQlh61ga3faku6KwhWJRwbiZgAP8AdFUL3xhEh8u1jDSHgAfMSaLXRdS1fE+tTPDC3It0OGI9z2q3Pm0iK9znbCBW1xWkkm1K5LZZlUlE9yT/APWropfMEZD4yewrd+xR2Fg8VnEqRhfuqMZ/xrGkPnKWx0NaQjyo6aOiERSLBVbquf8AGp7RT5KIMYIyce9OlUGAjoM9aTTQNxRXL4PJxwPamb30uacScIo+6BVrcPpTURVQc89aHIAqTlk7jH5qjc23mcjgjpVotSFh3pNCTsZL203mbgPxrn/EV5A0AVgHkjJBUjpXV312ttAzdWPCj1NcjBoplnM053ljn5jmpmpSXKOUm1YydLW7VzLBGgDjoa6KCPVJCMMig+gq9bW0UAA21pQuoGAKajZbk7IxJNM1S4jMcs6bCc9x/IVXfw9IBiW5B9lQn+ZrrVG4c0vkgnpTcE9yHructb+G4iwJ3H3Y/wBK3bHS4bYfJGAfWtFIcVPHHTUUhCwJgdKKsxriiqAsFaaVqXFJimBEUpNlTYoxQBFspwWn4pcUANApcUtLQAmKKWigAoopaAEooooAKQ0tJQAhpppxpDQAxhUEpOMCrBqNkzSGZksHmElu9QGxQn7tazKFUnBOOwGTVZ5WHJj8qMdXcjP4D/Gs5csdWBTWwUnJ+VR1NMkvLS1BQYAB5x3PvUGoakX+SFgFFZPlGQkucnrXm1a3O/dGT6hqqyIRErs3bBwKwZBcTgtdSbYl52DhR/jV28lisoi7Iz84AXqT6U6x06fUtr6oogts5Fspyzf7x7D2qacJzegi14D0xBDPqM8WS8hFuz8kL3I+v9K7EkdqqQFFjVEAVFGAoGABVgMB0r14rlVgEZS3Wsq5s0hf5Bwxyc9jWsST0qpdwSPGSOo5FUXB2ZQldUjAJAbHUjIqnDefZmLyzrIrEBURQCPc1bCl1xKMHpzUUmmK5ypBB9KTOhNbM0zMzttVSKRhj7xqrLM1rAAuFCDG9+SfwrMfUnbODIx/3ABSMuU2WZR0qrdXkcCFmb6AdTWWbi9lOAQi/TmpIbIsd0hLN6mpE1YqsZr2fzJeB/CvoK1raD5BmnxWoXtV2KPA6U0jNsgFup7U8W+Ogq4qVII6oLlaJMVZVaUR09UoEIFqRFpVWpFXigQ5RRTgKKYE1GKWigBMUYpaKAEopaKAEpaKKACiiigAooooAKKKKAEooooAQ0hpaKAGEU0ipMUmKAIZFBQgkgeorBvFuHUKFJycKMcmuiK1UnjbeXA+YjGfauetRVS1xpmCNNWEbp5OT/Cn+NZF3bO0pSHe7erMQq/gOtdUbcufm5py2aj+GpVCK2QHL2WlbJBI4LSf3m7fT0/CtyCHaBkVoi29qkS3ANbxjYCvHGT2qykdSrGBTwtWBHsxSMmRU2KQigDOls1Ykiqz2pQ5A/KtgrTSgPalYakzn5bfcfmBJ96i+yAnpW+8CntURthSsVzGVHaj0q0kAHarghxThHTsS2VliqRUxU4SlC0CGKtSBaULTwKYhAtOC04CnAUANC08ClxS4oAQCilxRQBJRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUlLRQAlJS0UAJSUtFACU0oDT6KAIvLA7UuwVJSUAM20u2nUUANxRinUUANxRinUlADcUmKfijFAEZWk2VLikxQBFspNlTYoxQBFto21LijFAEe2nBadilxQA0CnCiloAKKKWgBKKWigD//Z',
    ing:[['Кордиал малина гранат','50 гр'], ['Чай концентрат гречиха','35 гр'], ['Лед','120 гр'], ['Газированная вода (свят ист)','150 гр'], ['Голубика ягоды свежие','5 ГР'], ['Малина сублимированная','3 гр'], ['Сироп ваниль бурбон','10 гр']],
    steps:['Берем стакан, добавляем лед и наливаем кордиал «Малина–гранат».', 'Добавляем сироп «Ваниль Бурбон» и концентрат гречишного чая так же добавялем газированную воду , после чего тщательно перемешиваем.', 'Украшаем напиток свежей голубикой и сублимированной малиной.'] },
  { cat:'Лимонады', name:'Лимонад Blue Wild', tmin:'2', tmax:'4', method:'Билд', out:'350 мл', ware:'Чашка/To go', gar:'Черника сублимированная', photo:'data:image/jpeg;base64,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',
    ing:[['Кордиал смородина лайм','50 гр'], ['Чай концентрат улун с османтусом','35 гр'], ['Лед','120 гр'], ['Газированная вода (свят ист)','150 гр'], ['Черника сублимированная','1 гр'], ['Сироп ваниль бурбон','20 гр']],
    steps:['Берем стакан, добавляем лед и кордиал «Черника–лайм».', 'Добавляем газированную воду и тщательно перемешиваем.', 'Украшаем напиток сублимированной черникой.'] },
  { cat:'Лимонады', name:'Лимонад Tropic', tmin:'2', tmax:'5', method:'Билд', out:'350 мл', ware:'Хайбол/ To go', gar:'Пена манго маракуйя', photo:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHCAkIBgoJCAkMCwoMDxoRDw4ODx8WGBMaJSEnJiQhJCMpLjsyKSw4LCMkM0Y0OD0/QkNCKDFITUhATTtBQj//2wBDAQsMDA8NDx4RER4/KiQqPz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAHgAUADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwANJiinVZAmKQilzRQAmKTpTutBFACBiKeGphFJmgCYGkJ5pimnAigBwpabmlzxQAuKay04GloAhK0g61K2KjIoAcvWpBUaipBQA7tUbdalFMbrQA0GigUpoASl6U3NBoANxzQTRikoAbS5ooIoAKULmm45qRaAALig0tIaAENNpaQUAJRTsUhFADSKbipAKaaAG0YpaM0AFKDSUCgBwopKBQAtANI1IDQA7FJilFFADaOacRRigBAacGpopetADs0uaYTikzQBIeaQ9KTNFADkpc801TzTu9AEgPFJTQadmgBvSkwTTu9JnmgBMYoFOpKAEoNFL2oAZikNPoIoAaKcKAKUCgBKDSkU3vQAYpVWjvTxQA0ikxT6Q0ANxUbdakNMagBh60UGkoAKKOlJ1oAcDS5ptGeaAHHpTaXtSA0AOFOpuaUE0ABoFLRmgAxSgUCnUARMOaKe1NxQACiil7UACjmnmmCn0AAp2KbTgaAE70h60vU0jDJ4oAWikwaMGgBT0o7UlLQAuKMUvaigBccUgozSUADUijml6mlFACbcmlC04UtADaSnGm0ANIpjVIaaRxQBFRTsU00AMzSd6KdQAUE0UnWgBQc0YpAMU6gBRRRRQAtFJmjNADxS00GloAQ0YpaDQAmKXFKKQ8mgAApMHNPHSjFACUopcUtACLSmjpRQAZopuaWgANAGaMU8DAoAQCg0tJQACg0UUAApwFNHWnUALSUmaKAFNNooNAAaaaM0UAMaozzUjUgFAENOopKACiiigBRSgU2lBoAfSHpRnimk0AOFLikBpaAFAooBooAUUCkpRQAtFFJQA4UtItLQAZpQeabjNOAxQApptBNFABQKKKAHClpop2aACikzRQAGkzQaKAAGlpBTqAEHNFFJQAuaaeaXFJQAlNJ5p1NxQA2lBpB1paAIxS4pKAaACkpM806gBDRS0lACilxSCnUAJ0oBoNN5oAeKUGkFGKAHYoFIDSg0ALSgUcUtABSYp1KKAEApTSUmOetAC0GkpM0AFApKKAHijNIKKAFzTqbmnCgAxQKWigAxRSgUtADcUhFPpKAIzxSE08imEYoAM00049KaelACDrRQop2KAIDwKAOM08jNAGKAIsEmpAOKdgUUANPtTac/ApgOaAFpc0CigBRS0lFABThyKbSigBRQKWkoAf2opM0Z4oAcKXNNBoJoAfmm96BQeKAEzzRRRigApBRTSaAHg0tNFANADwKcKaDThQAtKKbThQAoopKWgAoxRQaAEphFPprUAMxQRTqQ0ANpaKKAIqKSigB1BpBQaAGMc00dac1IKAFpe1IKcKQBRRRQAoopBS0wHCg0lFACGlFLRQAooNFFACilbpTQad1oAQClFJS5oADTCOaeaaaAEopQCTT8UAInSnUgpaAFpQabS0APFFJTu1ACUlKaKAEppNOpDQA2kpaQ0AJSUtB6UARUUUUAFIaWigBv1pvelOabQA6gUlFADqKTNGaAFopM0UAOFOFMFOFADhQaAacRQAlBoooATFKDRSYoAcTmkpORRmgB1FJnijNADhRTQaXNAC5p3amU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',
    ing:[['Кордиал манго маракуйя','50 гр'], ['Газированная вода','120 гр'], ['Лёд','100 гр'], ['Пена манго маракуйя','30 гр']],
    steps:['В хайбол набираем льда ,наливаем кордиал манго маракуйя на дно хайбола', 'Заливаем хайбол газировкой и далее выкладываем'] },
  { cat:'Смузи', name:'Смузи арбуз', tmin:'2', tmax:'4', method:'Блендинг', out:'350 мл', ware:'Чашка/To go', gar:'Украшаем надписью с пришепкой', photo:'data:image/jpeg;base64,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',
    ing:[['Арбуз свежий','300 гр'], ['Сок концентрированный смородина','20 гр'], ['Лед','100 гр (6 кубиков)'], ['Мята','5 гр'], ['Фреш лайма процеженный','10 гр']],
    steps:['В чашу блендера добавляем арбуз чищеный ,смородину мяту фреш и лед.', 'Взбиваем все ингредиенты в течение 30 секунд до однородной консистенции.', 'Переливаем напиток в стакан и украшаем карточкой на прищепке.'] },
  { cat:'Смузи', name:'Смузи черника', tmin:'2', tmax:'4', method:'Блендинг', out:'350 мл', ware:'Чашка/To go', gar:'Украшаем надписью с прищепкой', photo:'data:image/jpeg;base64,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',
    ing:[['Пюре черника','50 гр'], ['Банан','100 гр'], ['Лед','100 гр ( 6 кубиков)'], ['Сироп банановый','20 гр'], ['Вода фильтрованная','50 гр'], ['Фреш Лайма','20 гр']],
    steps:['В чашу блендера добавляем пюре из черники, очищенный банан, банановый сироп, фреш лайма, воду и лед.', 'Взбиваем все ингредиенты в течение 30 секунд до однородной консистенции.', 'Переливаем напиток в стакан и украшаем карточкой на прищепке.'] },
  { cat:'Заготовки', name:'Концентрат в асс. гранат/смородина', tmin:'', tmax:'', method:'Покупной', out:'-', ware:'-', gar:'',
    ing:[['Концентрат гранат/смородина','привозной, не готовится на баре']],
    steps:['Не готовится на баре — заказывается готовым на маркетплейсе Ozon', 'При поступлении проверить срок годности, промаркировать и убрать на хранение'] },

  { cat:'Заготовки', name:'Cold brew концентрат', tmin:'', tmax:'', method:'Холодное заваривание', out:'3800 мл', ware:'Тара для заваривания', gar:'',
    ing:[['Кофе, помол 8 на кофемолке','200 гр'], ['Вода холодная фильтрованная (кран 2, 60 ppm)','3800 мл'], ['Лёд','200 гр']],
    steps:['Смолоть зерно и засыпать в нейлоновый мешок, хорошо завязать', 'Положить мешок в тару для заваривания', 'Залить холодной фильтрованной водой из крана 2 (60 ppm)', 'Плотно обмотать тару стрейч-лентой', 'Указать на таре, какое зерно и когда заварили', 'Настаивать от 16 до 24 часов'] },

  { cat:'Заготовки', name:'Сливочный крем', tmin:'', tmax:'', method:'-', out:'600 гр', ware:'Соусник', gar:'',
    ing:[['Сливки 33%','500 гр'], ['Сахарная пудра','150 гр'], ['Соль пищевая','4 гр']],
    steps:['Сахар , соль и сливки 33% блендерим 10 секунд для разбива комочков, далее переливаем в чашу планетарного миксера и взбиваем 4 минуты на самой высокой скорости , до консистенция жидкой сметаны'] },
  { cat:'Заготовки', name:'Сливочный матча крем', tmin:'', tmax:'', method:'-', out:'550 гр', ware:'Соусник', gar:'',
    ing:[['Сливки 33%','500 гр'], ['Матча longjong','12 гр'], ['Сахарная пудра','50 гр'], ['Сироп ванильный','50 гр']],
    steps:['Матчу,сироп и сливки 33% блендерим 10 секунд для разбива комочков, далее переливаем в чашу планетарного миксера и взбиваем 4 минуты на самой высокой скорости , до консистенция жидкой сметаны'] },
  { cat:'Заготовки', name:'Кордиал черная смородина лайм', tmin:'', tmax:'', method:'-', out:'350 гр', ware:'-', gar:'',
    ing:[['Черная смородина пюре','200 гр'], ['Концентрат в асс. гранат/смородина','50 гр'], ['Сахар белый','80 гр'], ['Вода фильтрованная','20 гр'], ['Фреш лайма (процеженный)','30 гр'], ['Сироп ежевика с листьями (herbarista)','20 гр']],
    steps:['Все ингредиенты добавляем в сотейник и ставим на плиту постоянно помешивая.2 Греем содержимое до 85° и убираем с плиты.3 Накрываем сотейник фольгой и оставляем на 15 минут', 'Процеживаем через сито и переливаем в соусник'] },
  { cat:'Заготовки', name:'Кордиал Клубника', tmin:'', tmax:'', method:'-', out:'750 гр', ware:'-', gar:'',
    ing:[['Клубника пюре','300 гр'], ['Вода фильтрованная','200 гр'], ['Сахар белый','300 гр']],
    steps:['1.добавить в сотейник клубнику,сахар,сироп,воду и поставить на плиту.Помешивая каждые 4 минуты, не доводим до кипения 80° убираем с плиты и накрываем фольгой на 20 минут.Далее процеживаем через сито и переливаем в соусник.'] },
  { cat:'Заготовки', name:'Манго маракуйя кордиал', tmin:'', tmax:'', method:'-', out:'450 гр', ware:'-', gar:'',
    ing:[['Манго пюре','200 гр'], ['Маракуйя пюре (без семечек)','200 гр'], ['Топинамбур','100 гр'], ['Лимонный фреш (без мякоти)','100 гр'], ['Собрат калия','1 гр'], ['Аскорбиновая кислота','4 гр']],
    steps:['1.Манго пюре ,маракуйя пюре фреш лимона,топинамбур и аскорбиновую кислоту добавляем в сотейник и греем на плите до 80°( чтобы не закипало) хорошо перемешиваем и убираем с плиты ( под фольгу на 15 минут) далее переливаем соусник , Кордиал годов'] },
  { cat:'Заготовки', name:'Манго маракуйя пена', tmin:'', tmax:'', method:'-', out:'300 гр', ware:'-', gar:'',
    ing:[['Манго маракуйя п/ф','300 гр'], ['Ксантановая камедь','0.1 гр']],
    steps:['Манго маракуйя кордиал ксантановую камедь , все смешиваем в мернике- далее все переливаем в блендер и блендерим 1 минуту', 'Переливаем в сифон для образования пены', 'Как всё залили закручиваем насадку на баллон вставляем аккуратно газовый баллон и прокручиваем. Хорошенько взбалтываем и даем стабилизироваться в холодильнике от 20 минут'] },
  { cat:'Заготовки', name:'Брусника лайм п/ф', tmin:'', tmax:'', method:'-', out:'500 гр', ware:'-', gar:'',
    ing:[['Пюре брусники','200 гр'], ['Фреш лайма','50 гр'], ['Кожура Лайма без альбедо','5 гр'], ['Вода горячая','100 гр'], ['Сахар','200 гр'], ['Корица палка','5 гр'], ['Сычуаньский перец','1 гр']],
    steps:['1.Все ингредиенты добавить в сотейник, поставить на медленный огонь и хорошо перемешивать , примерно 85° не доводить до кепения,далее снимаем сотейник с плиты накрываем фольгой и даем остыть под фольгой 20 минут.'] },
  { cat:'Заготовки', name:'Соленая карамель п/ф', tmin:'', tmax:'', method:'-', out:'2400 гр', ware:'-', gar:'',
    ing:[['Сливки 33%','1000 гр'], ['Сахар тростниковый','1200 гр'], ['Сироп соленая карамель','400 гр'], ['Аромка карамель','4 гр'], ['Соль поваренная','8 гр']],
    steps:['1.Тростниковый сахар топим на низкой температуре на плите , после как растопили вливаем в 4 подхода , теплые сливки 33% и хорошо перемешиваем.', 'Добавляем соль и после как добавили все сливки перемешиваем и даем остыть.', 'После добавляем все в блендер и смешиваем с сиропом и аромкой.', 'Переливаем в соусник.'] },
  { cat:'Заготовки', name:'Малина гранат п/ф', tmin:'', tmax:'', method:'-', out:'450 гр', ware:'-', gar:'',
    ing:[['Малина пюре','200 гр'], ['Концентрат в асс. гранат/смородина','100 гр'], ['Сахар белый','120 гр'], ['Корица палка','1 шт'], ['Вода фильтрованная','50 гр'], ['Фреш лайма (процеженный)','30 гр']],
    steps:['Все ингредиенты добавляем в сотейник и ставим на плиту постоянно помешивая.2 Греем содержимое до 85° и убираем с плиты.3 Накрываем сотейник фольгой и оставляем на 15 минут', 'Процеживаем через сито и переливаем в соусник'] },
  { cat:'Заготовки', name:'Чай концентрат жасминовый/улун с османтусом/гречиха/ходзича', tmin:'', tmax:'', method:'-', out:'330 гр', ware:'-', gar:'',
    ing:[['Чай улун с османтусом/Жасмин/Гречиха/Ходзича','10 гр'], ['Вода горячая','400 гр']],
    steps:['Чай завариваем горячей водой и даем настояться 20 минут, далее процеживаем и переливаем в бутылку'] },
  { cat:'Заготовки', name:'Брусничная пена', tmin:'', tmax:'', method:'-', out:'250 гр', ware:'-', gar:'',
    ing:[['Кордиал брусника лайм п/ф','300 гр'], ['Ксантановая камедь','0.1 гр']],
    steps:['Брусника лайм кордиал ксантановую камедь , все смешиваем в мернике- далее все переливаем в блендер и блендерим 1 минуту', 'Переливаем в сифон для образования пены', 'Как всё залили закручиваем насадку на баллон вставляем аккуратно газовый баллон и прокручиваем. Хорошенько взбалтываем и даем стабилизироваться в холодильнике от 20 минут'] },
  { cat:'Заготовки', name:'Сахарный сироп', tmin:'', tmax:'', method:'-', out:'950 гр', ware:'-', gar:'',
    ing:[['Сахар белый песок','500 гр'], ['Вода горячая','400 гр']],
    steps:[''] },
];


const DRINK_CATS = ['Все', 'Авторские', 'Чёрный кофе', 'Не кофе', 'Холодный кофе', 'Лимонады', 'Смузи', 'Чаи'];

const ALLERGENS = [
  { id:'milk',   label:'Молоко',  color:'#5FC8F0', keys:['молоко','сливки','сливочн','мороженое','крем сливочный','шоколад','нутелла','какао п/ф'] },
  { id:'nuts',   label:'Орехи',   color:'#FF6B35', keys:['урбеч','миндал','фисташ','нутелла','фундук','орех'] },
  { id:'sesame', label:'Кунжут',  color:'#FFB020', keys:['кунжут','халва'] },
  { id:'gluten', label:'Глютен',  color:'#B967FF', keys:['печенье','любятово','вафл','пшенич'] },
  { id:'soy',    label:'Соя',     color:'#8AE05F', keys:['нутелла','шоколад','лецитин'] },
];
const ALG_SKIP = ['вода фильтрованная', 'вода', 'лед', 'лёд'];

function drNorm(s) {
  return s.toLowerCase().replace(/п\/ф|пф|кордиал|концентрат/g, '').replace(/[^а-яa-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

const PF_ALIAS = {
  'крем сливочный': 'Сливочный крем',
  'сливочный крем': 'Сливочный крем',
  'сливочный крем матча': 'Сливочный матча крем',
  'крем из матчи': 'Сливочный матча крем',
  'пена из брусники': 'Брусничная пена',
  'пена манго маракуйя': 'Манго маракуйя пена',
  'чай': 'Чай концентрат жасминовый/улун с османтусом/гречиха/ходзича',
  'ходзича чай': 'Чай концентрат жасминовый/улун с османтусом/гречиха/ходзича',
  'чай гречиха': 'Чай концентрат жасминовый/улун с османтусом/гречиха/ходзича',
  'чай жасмин': 'Чай концентрат жасминовый/улун с османтусом/гречиха/ходзича',
  'чай жасмин зеленый': 'Чай концентрат жасминовый/улун с османтусом/гречиха/ходзича',
  'чай улун с османтусом': 'Чай концентрат жасминовый/улун с османтусом/гречиха/ходзича',
};

function findPF(ingName) {
  const a = drNorm(ingName);
  if (!a) return null;
  if (PF_ALIAS[a]) return PF_ALIAS[a];
  let best = null, bestLen = 0;
  DRINKS.filter(p => p.cat === 'Заготовки').forEach(p => {
    const b = drNorm(p.name);
    if (!b) return;
    const hit = a.indexOf(b) !== -1 || b.indexOf(a) !== -1;
    if (hit && b.length > bestLen) { best = p.name; bestLen = b.length; }
  });
  return best;
}

function allergensOf(drink, depth) {
  depth = depth || 0;
  const found = {};
  drink.ing.forEach(x => {
    const n = x[0].toLowerCase().trim();
    if (ALG_SKIP.some(w => n === w || n.indexOf(w) === 0)) return;
    ALLERGENS.forEach(a => {
      if (a.keys.some(k => n.indexOf(k) !== -1)) found[a.id] = true;
    });
    if (depth < 2) {
      const pfName = findPF(x[0]);
      if (pfName) {
        const pf = DRINKS.find(p => p.name === pfName);
        if (pf) Object.keys(allergensOf(pf, depth + 1)).forEach(k => { found[k] = true; });
      }
    }
  });
  return found;
}

function BaristaOrders() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authPassInput, setAuthPassInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const [catalog, setCatalog] = useState([]);
  const [cart, setCart] = useState({});
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [supplierBannerDismissed, setSupplierBannerDismissed] = useState(false);
  const [view, setView] = useState('zakaz');
  const [baristaName, setBaristaName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [askingName, setAskingName] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [savedPin, setSavedPin] = useState(''); // больше не хранит настоящий пин, только служебное значение для смены
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('кг');
  const [newCategory, setNewCategory] = useState('Другое');
  const [newSupplier, setNewSupplier] = useState('Основной поставщик');
  const [activeCategory, setActiveCategory] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastSentOrder, setLastSentOrder] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [isChief, setIsChief] = useState(false);
  const [orderTab, setOrderTab] = useState('search'); // 'search' | 'history' | 'cart'
  const [drinkCat, setDrinkCat] = useState('Все');
  const [drinkOpen, setDrinkOpen] = useState(null); // имя раскрытой карточки (общее для Техкарт и Заготовок)

  const [clMarks, setClMarks] = useState({});
  const [clLoading, setClLoading] = useState(false);
  const [clHistory, setClHistory] = useState([]);
  const [clHistoryOpen, setClHistoryOpen] = useState(null);
  const clToday = clDayNum();
  const clDate = clDateKey();
  const clMarksKey = `checklist_${clDate}`;

  const clVisible = (s) =>
    s.tasks.map((t, i) => ({ task: t, i }))
           .filter(x => !s.weekly || x.task.days.includes(clToday));

  const loadChecklist = useCallback(async () => {
    setClLoading(true);
    try {
      const r = await window.storage.get(`checklist_${clDateKey()}`, true);
      setClMarks(r && r.value ? JSON.parse(r.value) : {});
    } catch (e) { setClMarks({}); }
    setClLoading(false);
  }, []);

  const loadClHistory = useCallback(async () => {
    try {
      const list = await window.storage.list('checklist_', true);
      const dates = ((list && list.keys) || [])
        .map(k => k.replace('checklist_', ''))
        .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort().reverse().slice(0, 30);

      const days = [];
      for (const dateStr of dates) {
        let marks = {};
        try {
          const r = await window.storage.get(`checklist_${dateStr}`, true);
          marks = r && r.value ? JSON.parse(r.value) : {};
        } catch (e) { continue; }
        const dow = clDayNum(new Date(dateStr + 'T00:00:00'));
        let total = 0, done = 0;
        const sections = CL_SECTIONS.map(s => {
          const items = s.weekly
            ? s.tasks.map((t, i) => ({ t, i })).filter(x => x.t.days.includes(dow))
            : s.tasks.map((t, i) => ({ t, i }));
          const d = items.filter(x => marks[clTaskId(s.id, x.i)]).length;
          total += items.length; done += d;
          const missed = items.filter(x => !marks[clTaskId(s.id, x.i)]).map(x => x.t.t);
          return { id: s.id, title: s.title, accent: s.accent, done: d, total: items.length, missed };
        });
        if (total > 0) days.push({ date: dateStr, dow, done, total, sections });
      }
      setClHistory(days);
    } catch (e) { setClHistory([]); }
  }, []);

  useEffect(() => {
    if (view === 'clean') loadChecklist();
  }, [view, loadChecklist]);

  useEffect(() => {
    if (view === 'stats' && pinUnlocked) loadClHistory();
  }, [view, pinUnlocked, loadClHistory]);

  const clToggle = async (id) => {
    const prev = clMarks;
    const next = { ...clMarks };
    if (next[id]) { delete next[id]; vibrate(6); }
    else { next[id] = { at: new Date().toISOString() }; vibrate([8, 40, 12]); }
    setClMarks(next);
    try {
      await window.storage.set(clMarksKey, JSON.stringify(next), true);
    } catch (e) {
      setClMarks(prev);
      showToast('Отметка не сохранилась — проверь связь');
    }
  };

  const clResetSection = async (section) => {
    const next = { ...clMarks };
    section.tasks.forEach((_, i) => { delete next[clTaskId(section.id, i)]; });
    setClMarks(next);
    try {
      await window.storage.set(clMarksKey, JSON.stringify(next), true);
      vibrate(10);
      showToast('Отметки сняты');
    } catch (e) { showToast('Не удалось снять отметки'); }
  };

  const clTotals = CL_SECTIONS.reduce((acc, s) => {
    clVisible(s).forEach(x => {
      acc.total += 1;
      if (clMarks[clTaskId(s.id, x.i)]) acc.done += 1;
    });
    return acc;
  }, { done: 0, total: 0 });

  const [schMonthOffset, setSchMonthOffset] = useState(0);
  const [schData, setSchData] = useState({});
  const [schLoading, setSchLoading] = useState(false);
  const [schPickerFor, setSchPickerFor] = useState(null); // например "14-morning"

  const schViewMonthDate = (() => {
    const d = new Date();
    d.setDate(1); // чтобы прибавление месяцев не переползало через границы (напр. 31 марта + месяц)
    d.setMonth(d.getMonth() + schMonthOffset);
    return d;
  })();
  const schMonthKey = `schedule_${schViewMonthDate.getFullYear()}-${String(schViewMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const schDaysInMonth = new Date(schViewMonthDate.getFullYear(), schViewMonthDate.getMonth() + 1, 0).getDate();

  const loadSchedule = useCallback(async (key) => {
    setSchLoading(true);
    try {
      const r = await window.storage.get(key, true);
      setSchData(r && r.value ? JSON.parse(r.value) : {});
    } catch (e) { setSchData({}); }
    setSchLoading(false);
  }, []);

  useEffect(() => {
    if (view === 'clean') loadSchedule(schMonthKey);
  }, [view, schMonthKey, loadSchedule]);

  const assignShift = async (dayOfMonth, shift, name) => {
    if (!isChief) return;
    const next = { ...schData, [dayOfMonth]: { ...(schData[dayOfMonth] || {}), [shift]: name } };
    setSchData(next);
    setSchPickerFor(null);
    try {
      await window.storage.set(schMonthKey, JSON.stringify(next), true);
      vibrate(8);
    } catch (e) {
      showToast('Не удалось сохранить график');
    }
  };

  const [tlToday, setTlToday] = useState({});
  const [tlInInput, setTlInInput] = useState('');
  const [tlOutInput, setTlOutInput] = useState('');
  const [tlWeekData, setTlWeekData] = useState({});
  const [tlLoading, setTlLoading] = useState(false);
  const [tlShowAll, setTlShowAll] = useState(false);
  const [tlTeamData, setTlTeamData] = useState({});
  const [tlTeamLoading, setTlTeamLoading] = useState(false);

  // Каждый день и каждый сотрудник — отдельный ключ в базе.
  // Так браузер обычного бариста физически не получает чужие времена и суммы —
  // ни на экране, ни в сетевых запросах, а не просто «не показывает» их в интерфейсе.
  const tlKey = (dateKey, name) => `timelog_${dateKey}_${name}`;

  const loadTimelog = useCallback(async () => {
    setTlLoading(true);
    try {
      const r = await window.storage.get(tlKey(tlDateKey(new Date()), baristaName), true);
      const mine = r && r.value ? JSON.parse(r.value) : {};
      setTlToday(mine);
      setTlInInput(mine.in || '');
      setTlOutInput(mine.out || '');
    } catch (e) {
      setTlToday({});
      setTlInInput('');
      setTlOutInput('');
    }

    const monday = schMondayOf(new Date());
    const days = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = tlDateKey(d);
      try {
        const r = await window.storage.get(tlKey(key, baristaName), true);
        days[key] = r && r.value ? JSON.parse(r.value) : null;
      } catch (e) { days[key] = null; }
    }
    setTlWeekData(days);
    setTlLoading(false);
  }, [baristaName]);

  useEffect(() => {
    if (view === 'clean' && baristaName) loadTimelog();
  }, [view, baristaName, loadTimelog]);

  const saveTimelog = async () => {
    // Меняем время — отметка «проверено» сбрасывается, чтобы шеф пересмотрел именно то,
    // что реально сохранено, а не старое подтверждение к уже изменённым цифрам.
    const entry = { in: tlInInput, out: tlOutInput, confirmed: false };
    setTlToday(entry);
    try {
      await window.storage.set(tlKey(tlDateKey(new Date()), baristaName), JSON.stringify(entry), true);
      vibrate([8, 40, 12]);
      showToast('Время сохранено');
      loadTimelog();
    } catch (e) {
      showToast('Не удалось сохранить время');
    }
  };

  // Данные всей команды подгружаются только когда шеф сам разворачивает список —
  // ни один запрос за чужим временем не уходит, пока он явно этого не попросил.
  const loadTeamTimelog = useCallback(async () => {
    setTlTeamLoading(true);
    const monday = schMondayOf(new Date());
    const result = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = tlDateKey(d);
      result[key] = {};
      for (const name of STAFF_NAMES) {
        try {
          const r = await window.storage.get(tlKey(key, name), true);
          if (r && r.value) result[key][name] = JSON.parse(r.value);
        } catch (e) {}
      }
    }
    setTlTeamData(result);
    setTlTeamLoading(false);
  }, []);

  const toggleShowAll = () => {
    const next = !tlShowAll;
    setTlShowAll(next);
    if (next && isChief) loadTeamTimelog();
  };

  const toggleConfirm = async (dateKey, name) => {
    if (!isChief) return;
    const entry = tlTeamData[dateKey]?.[name];
    if (!entry) return;
    const updated = { ...entry, confirmed: !entry.confirmed };
    const nextTeam = { ...tlTeamData, [dateKey]: { ...tlTeamData[dateKey], [name]: updated } };
    setTlTeamData(nextTeam);
    if (name === baristaName && dateKey === tlDateKey(new Date())) {
      setTlToday(updated);
    }
    try {
      await window.storage.set(tlKey(dateKey, name), JSON.stringify(updated), true);
      vibrate(8);
    } catch (e) {
      showToast('Не удалось сохранить отметку');
    }
  };

  // Проверяем, был ли вход на этом устройстве ранее (пароль сохраняется локально)
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('local_appAuthUser');
      if (savedAuth && STAFF_NAMES.includes(savedAuth)) {
        setAuthed(true);
        setIsChief(localStorage.getItem('local_isChief') === 'true');
      }
    } catch (e) {}
    setAuthChecked(true);
  }, []);

  const handleAuthDigit = (digit) => {
    vibrate(6);
    const next = authPassInput + digit;
    setAuthPassInput(next);
    setAuthError(false);
    if (next.length === 4) {
      verifyLogin(next);
    }
  };

  const verifyLogin = async (attempt) => {
    try {
      const data = await supabaseRpc('verify_staff_login', { attempt });
      if (data && data.length > 0) {
        const found = data[0];
        setAuthed(true);
        setIsChief(!!found.out_is_chief);
        try {
          localStorage.setItem('local_appAuthUser', found.out_name);
          localStorage.setItem('local_baristaName', found.out_name);
          localStorage.setItem('local_isChief', found.out_is_chief ? 'true' : 'false');
        } catch (e) {}
        setBaristaName(found.out_name);
        setAskingName(false);
        vibrate([10, 60, 20]);
      } else {
        setAuthError(true);
        vibrate([20, 60, 20, 60, 20]);
        setTimeout(() => { setAuthPassInput(''); setAuthError(false); }, 600);
      }
    } catch (e) {
      setAuthError(true);
      vibrate([20, 60, 20, 60, 20]);
      setTimeout(() => { setAuthPassInput(''); setAuthError(false); }, 600);
    }
  };

  const handleAuthDelete = () => {
    vibrate(4);
    setAuthPassInput(prev => prev.slice(0, -1));
    setAuthError(false);
  };

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

  const handlePinDigit = (digit) => {
    vibrate(6);
    const next = pinInput + digit;
    setPinInput(next);
    setPinError(false);
    if (next.length === 4) {
      verifyStatsPin(next);
    }
  };

  const verifyStatsPin = async (attempt) => {
    try {
      const ok = await supabaseRpc('verify_stats_pin', { attempt });
      if (ok === true) {
        setPinUnlocked(true);
        setSavedPin(attempt); // временно держим в памяти для смены пина в этой сессии
        setPinInput('');
        vibrate([10, 60, 20]);
      } else {
        setPinError(true);
        vibrate([20, 60, 20, 60, 20]);
        setTimeout(() => { setPinInput(''); setPinError(false); }, 600);
      }
    } catch (e) {
      setPinError(true);
      setTimeout(() => { setPinInput(''); setPinError(false); }, 600);
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
    try {
      const ok = await supabaseRpc('update_stats_pin', { old_attempt: savedPin, new_pin: pin });
      if (ok) {
        setSavedPin(pin);
        setNewPinInput('');
        setShowChangePinModal(false);
        showToast('Пин-код изменён');
      } else {
        showToast('Не удалось сменить пин-код — проверь текущий доступ');
      }
    } catch (e) {
      showToast('Не удалось сменить пин-код');
    }
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
    setView('zakaz');
    setOrderTab('cart');
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
    fetch('https://zakup-push.onrender.com/order-sent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baristaName, itemsCount: cartItems.length }),
    }).catch(() => {});
    vibrate([15, 80, 15, 80, 30]);
    playApplePaySound();
    setCart({});
    setQuery('');
    setLastSentOrder(order);
    setView('receipt');
  };

  if (!authChecked) {
    return <div style={{ position: 'fixed', inset: 0, background: '#0A0A0F' }} />;
  }

  if (!authed) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 60% 30%, rgba(204,255,0,0.07) 0%, #060608 60%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '0 24px',
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 22, fontWeight: 700,
          color: '#CCFF00', textAlign: 'center',
          marginBottom: 28,
        }}>
          Вход в приложение
        </div>

        <div style={{ ...styles.pinWrap, paddingTop: 0 }}>
          <div style={styles.pinSubtitle}>Введите ваш личный код</div>
          <div style={styles.pinDots}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                ...styles.pinDot,
                background: authError
                  ? '#FF3D5A'
                  : i < authPassInput.length
                    ? '#CCFF00'
                    : 'rgba(255,255,255,0.12)',
                boxShadow: i < authPassInput.length && !authError
                  ? '0 0 12px rgba(204,255,0,0.6)'
                  : authError
                    ? '0 0 12px rgba(255,61,90,0.6)'
                    : 'none',
                transform: authError ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s',
              }} />
            ))}
          </div>
          <div style={styles.pinGrid}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
              d === '' ? <div key={i} /> :
              <button
                key={i}
                onClick={() => d === '⌫' ? handleAuthDelete() : handleAuthDigit(d)}
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
      </div>
    );
  }

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={styles.nameChip}>
                  <span style={styles.nameChipText}>{baristaName}</span>
                </div>
                <button
                  onClick={async () => {
                    if (window.setupPush) {
                      await window.setupPush();
                      showToast('Уведомления настроены ✓');
                    }
                  }}
                  style={styles.bellBtn}
                  title="Включить уведомления"
                >
                  <span style={{ fontSize: 14 }}>🔔</span>
                </button>
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem('local_appAuthUser');
                      localStorage.removeItem('local_baristaName');
                    } catch (e) {}
                    setAuthed(false);
                    setAuthPassInput('');
                    setAuthError(false);
                    setBaristaName('');
                  }}
                  style={styles.logoutBtn}
                  title="Выйти"
                >
                  <X size={13} color="#8A8A9A" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <button
            onClick={() => { setView('zakaz'); setPinUnlocked(false); setPinInput(''); }}
            style={{ ...styles.navBtn, ...styles.navBtnCart, ...(view === 'zakaz' ? styles.navBtnActive : {}) }}
          >
            Заказ
            {cartItems.length > 0 && (
              <span style={{ ...styles.navCartBadge, ...(cartItems.some(i => i.urgent) ? styles.navCartBadgeUrgent : {}) }}>
                {cartItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setView('drinks'); setPinUnlocked(false); setPinInput(''); }}
            style={{ ...styles.navBtn, ...(view === 'drinks' ? styles.navBtnActive : {}) }}
          >
            Техкарты
          </button>
          <button
            onClick={() => { setView('pf'); setPinUnlocked(false); setPinInput(''); }}
            style={{ ...styles.navBtn, ...(view === 'pf' ? styles.navBtnActive : {}) }}
          >
            Заготовки
          </button>
          {isChief && (
            <button
              onClick={() => setView('stats')}
              style={{ ...styles.navBtn, ...(view === 'stats' ? styles.navBtnActive : {}) }}
            >
              Статистика
            </button>
          )}
          <button
            onClick={() => { setView('suppliers'); setPinUnlocked(false); setPinInput(''); }}
            style={{ ...styles.navBtn, ...(view === 'suppliers' ? styles.navBtnActive : {}) }}
          >
            График
          </button>
          <button
            onClick={() => { setView('clean'); setPinUnlocked(false); setPinInput(''); }}
            style={{ ...styles.navBtn, ...(view === 'clean' ? styles.navBtnActive : {}) }}
          >
            Чек-лист
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
          <button onClick={() => { setView('zakaz'); setOrderTab('search'); }} style={styles.backRow}>
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

          <button onClick={() => { setView('zakaz'); setOrderTab('search'); }} style={styles.newOrderBtn}>
            Начать новый заказ
          </button>
        </main>
      ) : view === 'zakaz' ? (
        <main style={styles.main}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 4 }}>
            <button
              onClick={() => setOrderTab('search')}
              style={{ flex: 1, padding: '9px 4px', borderRadius: 13, fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif", border: 'none', background: orderTab === 'search' ? '#CCFF00' : 'transparent', color: orderTab === 'search' ? '#0A0A0F' : 'rgba(245,247,250,0.55)' }}
            >
              Поиск
            </button>
            <button
              onClick={() => setOrderTab('history')}
              style={{ flex: 1, padding: '9px 4px', borderRadius: 13, fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif", border: 'none', background: orderTab === 'history' ? '#CCFF00' : 'transparent', color: orderTab === 'history' ? '#0A0A0F' : 'rgba(245,247,250,0.55)' }}
            >
              История
            </button>
            <button
              onClick={() => setOrderTab('cart')}
              style={{ flex: 1, padding: '9px 4px', borderRadius: 13, fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif", border: 'none', background: orderTab === 'cart' ? '#CCFF00' : 'transparent', color: orderTab === 'cart' ? '#0A0A0F' : 'rgba(245,247,250,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              Корзина
              {cartItems.length > 0 && (
                <span style={{ ...styles.navCartBadge, background: orderTab === 'cart' ? '#0A0A0F' : '#0A0A0F', color: orderTab === 'cart' ? '#CCFF00' : '#CCFF00', ...(cartItems.some(i => i.urgent) ? styles.navCartBadgeUrgent : {}) }}>
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>

          {orderTab === 'search' ? (
            <>
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
            </>
          ) : orderTab === 'history' ? (
            <>
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
            </>
          ) : (
            <>
          <button onClick={() => setOrderTab('search')} style={styles.backRow}>
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
            </>
          )}
        </main>
      ) : view === 'clean' ? (
        <main style={styles.main}>
          <p style={styles.eyebrowSection}>Смена</p>
          <h2 style={styles.sectionTitle}>Чек-лист — {CL_DAYS_FULL[clToday]}</h2>

          <div style={{ ...styles.suppCard, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🗓️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: '#F5F7FA' }}>График смен</div>
                <div style={{ fontSize: 10, color: '#8A8A9A', textTransform: 'capitalize' }}>
                  {schViewMonthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button onClick={() => setSchMonthOffset(o => o - 1)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, width: 26, height: 26, color: '#8A8A9A' }}>‹</button>
              <button onClick={() => setSchMonthOffset(o => o + 1)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, width: 26, height: 26, color: '#8A8A9A', marginLeft: 4 }}>›</button>
            </div>

            {schLoading && <div style={{ fontSize: 12, color: '#8A8A9A', marginBottom: 8 }}>Загружаем…</div>}

            {Array.from({ length: schDaysInMonth }, (_, i) => i + 1).map(dayOfMonth => {
              const d = new Date(schViewMonthDate.getFullYear(), schViewMonthDate.getMonth(), dayOfMonth);
              const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
              const isPast = d < todayMidnight;
              const isToday = d.getTime() === todayMidnight.getTime();
              const weekdayLabel = d.toLocaleDateString('ru-RU', { weekday: 'short' });
              const morning = schData[dayOfMonth]?.morning;
              const evening = schData[dayOfMonth]?.evening;
              return (
                <div
                  key={dayOfMonth}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
                    borderBottom: dayOfMonth < schDaysInMonth ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    opacity: isPast ? 0.5 : 1,
                  }}
                >
                  <div style={{ width: 46, flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#CCFF00' : '#F5F7FA' }}>{dayOfMonth}</div>
                    <div style={{ fontSize: 9, color: '#8A8A9A', textTransform: 'uppercase' }}>{weekdayLabel}</div>
                  </div>
                  <button
                    onClick={() => isChief && setSchPickerFor(`${dayOfMonth}-morning`)}
                    style={{
                      flex: 1, textAlign: 'left', padding: '7px 10px', borderRadius: 9,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: morning ? 'rgba(204,255,0,0.08)' : 'rgba(255,255,255,0.03)',
                      fontSize: 12, color: morning ? '#CCFF00' : '#6B6B7A',
                    }}
                  >
                    ☀️ {morning || 'не назначено'}
                  </button>
                  <button
                    onClick={() => isChief && setSchPickerFor(`${dayOfMonth}-evening`)}
                    style={{
                      flex: 1, textAlign: 'left', padding: '7px 10px', borderRadius: 9,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: evening ? 'rgba(185,103,255,0.1)' : 'rgba(255,255,255,0.03)',
                      fontSize: 12, color: evening ? '#B967FF' : '#6B6B7A',
                    }}
                  >
                    🌙 {evening || 'не назначено'}
                  </button>
                </div>
              );
            })}

            {!isChief && (
              <div style={{ fontSize: 11, color: '#6B6B7A', marginTop: 10 }}>Назначать смены может только шеф-бариста.</div>
            )}
          </div>

          <div style={{ ...styles.suppCard, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>⏱️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: '#F5F7FA' }}>Табель — сегодня</div>
                <div style={{ fontSize: 10, color: '#8A8A9A' }}>Ставка {HOURLY_RATE} ₽/час</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#8A8A9A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Пришёл</div>
                <input
                  type="time"
                  value={tlInInput}
                  onChange={e => setTlInInput(e.target.value)}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#F5F7FA', fontSize: 14, outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#8A8A9A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ушёл</div>
                <input
                  type="time"
                  value={tlOutInput}
                  onChange={e => setTlOutInput(e.target.value)}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#F5F7FA', fontSize: 14, outline: 'none' }}
                />
              </div>
            </div>

            {(() => {
              const hrs = tlHoursBetween(tlInInput, tlOutInput);
              return hrs !== null ? (
                <div style={{ fontSize: 13, color: '#CCFF00', fontWeight: 600, marginBottom: 10 }}>
                  {tlFormatHours(hrs)} · {tlFormatMoney(tlPay(hrs))}
                </div>
              ) : null;
            })()}

            <button
              onClick={saveTimelog}
              style={{ width: '100%', padding: '11px', borderRadius: 12, border: '1px solid rgba(204,255,0,0.4)', background: 'rgba(204,255,0,0.12)', color: '#CCFF00', fontSize: 14, fontWeight: 600 }}
            >
              Сохранить время
            </button>

            {(() => {
              const weekKeys = Object.keys(tlWeekData).sort();
              const myDays = weekKeys
                .map(key => ({ key, entry: tlWeekData[key] }))
                .filter(x => x.entry && x.entry.in && x.entry.out);
              const myTotal = myDays.reduce((sum, x) => sum + (tlHoursBetween(x.entry.in, x.entry.out) || 0), 0);
              if (!myDays.length) return null;
              return (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 10, color: '#8A8A9A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Эта неделя</div>
                  {myDays.map(({ key, entry }) => {
                    const h = tlHoursBetween(entry.in, entry.out);
                    const dLabel = new Date(key + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13 }}>
                        <span style={{ color: '#F5F7FA' }}>{dLabel} · {entry.in}–{entry.out}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#8A8A9A' }}>{tlFormatHours(h)} · {tlFormatMoney(tlPay(h))}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase',
                            padding: '2px 7px', borderRadius: 6,
                            color: entry.confirmed ? '#CCFF00' : '#8A8A9A',
                            background: entry.confirmed ? 'rgba(204,255,0,0.12)' : 'rgba(255,255,255,0.06)',
                          }}>
                            {entry.confirmed ? 'Проверено' : 'Ожидает'}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 14, fontWeight: 700 }}>
                    <span style={{ color: '#F5F7FA' }}>Итого</span>
                    <span style={{ color: '#CCFF00' }}>{tlFormatHours(myTotal)} · {tlFormatMoney(tlPay(myTotal))}</span>
                  </div>
                </div>
              );
            })()}

            {isChief && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={toggleShowAll}
                  style={{ fontSize: 12, color: '#8A8A9A', background: 'none', border: 'none', padding: 0 }}
                >
                  {tlShowAll ? '▾' : '▸'} Табель всей команды за неделю
                </button>
                {tlShowAll && tlTeamLoading && (
                  <div style={{ fontSize: 12, color: '#8A8A9A', marginTop: 8 }}>Загружаем…</div>
                )}
                {tlShowAll && !tlTeamLoading && (() => {
                  const weekKeys = Object.keys(tlTeamData).sort();
                  const rows = [];
                  weekKeys.forEach(key => {
                    const day = tlTeamData[key] || {};
                    Object.entries(day).forEach(([name, entry]) => {
                      if (!entry.in || !entry.out) return;
                      rows.push({ key, name, entry });
                    });
                  });
                  const grandTotal = rows.reduce((s, r) => s + (tlHoursBetween(r.entry.in, r.entry.out) || 0), 0);
                  if (!rows.length) {
                    return <div style={{ fontSize: 12, color: '#6B6B7A', marginTop: 8 }}>Пока никто не отметил время на этой неделе</div>;
                  }
                  return (
                    <div style={{ marginTop: 10 }}>
                      {rows.map(({ key, name, entry }) => {
                        const h = tlHoursBetween(entry.in, entry.out);
                        const dLabel = new Date(key + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
                        return (
                          <button
                            key={key + name}
                            onClick={() => toggleConfirm(key, name)}
                            style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 10,
                              marginBottom: 5, border: '1px solid',
                              borderColor: entry.confirmed ? 'rgba(204,255,0,0.35)' : 'rgba(255,255,255,0.08)',
                              background: entry.confirmed ? 'rgba(204,255,0,0.08)' : 'rgba(255,255,255,0.03)',
                            }}
                          >
                            <span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#F5F7FA' }}>{name}</span>
                              <span style={{ fontSize: 11, color: '#8A8A9A', marginLeft: 8 }}>{dLabel} · {entry.in}–{entry.out}</span>
                            </span>
                            <span style={{ fontSize: 12, color: entry.confirmed ? '#CCFF00' : '#8A8A9A' }}>
                              {tlFormatHours(h)} · {tlFormatMoney(tlPay(h))}
                            </span>
                          </button>
                        );
                      })}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 700 }}>
                        <span style={{ color: '#F5F7FA' }}>Всего команде</span>
                        <span style={{ color: '#CCFF00' }}>{tlFormatMoney(tlPay(grandTotal))}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#6B6B7A', marginTop: 8 }}>Тапни по строке, чтобы отметить день как проверенный</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {clLoading && <div style={{ color: '#8A8A9A', fontSize: 13 }}>Загружаем…</div>}

          {CL_SECTIONS.map(section => {
            const items = clVisible(section);
            if (!items.length) return null;
            const done = items.filter(x => clMarks[clTaskId(section.id, x.i)]).length;
            const pct = Math.round(done / items.length * 100);
            let lastG = null;

            return (
              <div key={section.id} style={{ ...styles.suppCard, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{section.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: '#F5F7FA' }}>{section.title}</div>
                    <div style={{ fontSize: 10, color: '#8A8A9A' }}>{section.weekly ? CL_DAYS_FULL[clToday] : 'каждый день'}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: done === items.length ? section.accent : '#8A8A9A' }}>{done}/{items.length}</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 10 }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: section.accent }} />
                </div>

                {items.map(({ task, i }) => {
                  const id = clTaskId(section.id, i);
                  const mark = clMarks[id];
                  const showG = task.g && task.g !== lastG;
                  if (task.g) lastG = task.g;
                  const isTime = task.g && /^\d{1,2}:\d{2}$/.test(task.g);
                  return (
                    <React.Fragment key={id}>
                      {showG && (
                        <div style={{ fontSize: isTime ? 13 : 10, fontWeight: isTime ? 700 : 600, color: isTime ? '#fff' : '#8A8A9A', textTransform: isTime ? 'none' : 'uppercase', letterSpacing: isTime ? 0 : '1px', margin: '10px 0 4px' }}>
                          {task.g}
                        </div>
                      )}
                      <button
                        onClick={() => clToggle(id)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 9, width: '100%', textAlign: 'left',
                          padding: '9px 10px', borderRadius: 10, marginBottom: 5, border: '1px solid',
                          borderColor: mark ? section.accent + '55' : 'rgba(255,255,255,0.08)',
                          background: mark ? section.accent + '14' : 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <span style={{
                          width: 17, height: 17, borderRadius: 5, flexShrink: 0, marginTop: 1,
                          border: `1.5px solid ${mark ? section.accent : 'rgba(255,255,255,0.25)'}`,
                          background: mark ? section.accent : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {mark && <Check size={11} color="#0A0A0F" />}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13, color: mark ? '#8A8A9A' : '#F5F7FA', textDecoration: mark ? 'line-through' : 'none' }}>{task.t}</span>
                          {task.at && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: section.accent }}>{task.at}</span>}
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })}

                {done > 0 && (
                  <button onClick={() => clResetSection(section)} style={{ ...styles.changePinBtn, marginTop: 8, padding: '6px 14px' }}>
                    Снять отметки
                  </button>
                )}
              </div>
            );
          })}
        </main>
      ) : view === 'drinks' ? (
        <main style={styles.main}>
          <p style={styles.eyebrowSection}>Меню</p>
          <h2 style={styles.sectionTitle}>Техкарты</h2>

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
            {DRINK_CATS.map(c => (
              <button
                key={c}
                onClick={() => { setDrinkCat(c); setDrinkOpen(null); }}
                style={{
                  flexShrink: 0, padding: '7px 13px', borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, fontWeight: 500,
                  color: drinkCat === c ? '#0A0A0F' : '#8A8A9A',
                  background: drinkCat === c ? '#CCFF00' : 'transparent',
                  borderColor: drinkCat === c ? '#CCFF00' : 'rgba(255,255,255,0.1)',
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {(() => {
            const list = DRINKS.filter(d => (drinkCat === 'Все' ? d.cat !== 'Заготовки' : d.cat === drinkCat));
            if (!list.length) return <div style={styles.emptyHint}>Ничего не нашлось</div>;
            return list.map(d => {
              const open = drinkOpen === d.name;
              return (
                <section
                  key={d.name}
                  style={{
                    borderRadius: 18, border: '1px solid', marginBottom: 8, overflow: 'hidden',
                    borderColor: open ? 'rgba(204,255,0,0.22)' : 'rgba(255,255,255,0.08)',
                    background: open ? 'rgba(204,255,0,0.04)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <button
                    onClick={() => setDrinkOpen(open ? null : d.name)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 15px', textAlign: 'left' }}
                  >
                    {d.photo && <img src={d.photo} alt="" style={{ width: 44, height: 44, borderRadius: 11, objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: '#fff' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: '#8A8A9A', marginTop: 2 }}>{d.out}{d.ware && d.ware !== '-' ? ` · ${d.ware}` : ''}</div>
                    </div>
                    {d.tmin && (
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#CCFF00', border: '1px solid rgba(204,255,0,0.3)', borderRadius: 7, padding: '3px 7px' }}>
                        {d.tmin}–{d.tmax}{String(d.tmin).indexOf(':') === -1 ? ' мин' : ''}
                      </span>
                    )}
                  </button>

                  {open && (
                    <div style={{ padding: '0 15px 15px' }}>
                      <div style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#8A8A9A', margin: '12px 0 7px' }}>Состав</div>
                      {d.ing.map(([nm, qty]) => {
                        const link = findPF(nm);
                        return (
                          <div key={nm} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {link ? (
                              <button
                                onClick={() => { setView('pf'); setDrinkOpen(link); }}
                                style={{ fontSize: 14, color: '#CCFF00', textAlign: 'left', padding: 0, borderBottom: '1px dashed rgba(204,255,0,0.35)' }}
                              >
                                {nm} <span style={{ opacity: 0.7 }}>›</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: 14, color: '#EDEDF2' }}>{nm}</span>
                            )}
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#CCFF00', whiteSpace: 'nowrap' }}>{qty}</span>
                          </div>
                        );
                      })}

                      <div style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#8A8A9A', margin: '12px 0 7px' }}>Приготовление</div>
                      {d.steps.map((st, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                          <span style={{ flexShrink: 0, width: 19, height: 19, borderRadius: 6, background: 'rgba(204,255,0,0.14)', color: '#CCFF00', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
                          <span style={{ fontSize: 13, lineHeight: 1.5, color: '#C8C8D2' }}>{st}</span>
                        </div>
                      ))}

                      {(() => {
                        const found = allergensOf(d);
                        const list2 = ALLERGENS.filter(a => found[a.id]);
                        if (!list2.length) return null;
                        return (
                          <>
                            <div style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#8A8A9A', margin: '12px 0 7px' }}>Аллергены</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                              {list2.map(a => (
                                <span key={a.id} style={{ fontSize: 11, fontWeight: 600, color: a.color, border: `1px solid ${a.color}55`, background: `${a.color}14`, borderRadius: 7, padding: '4px 8px' }}>
                                  {a.label}
                                </span>
                              ))}
                            </div>
                          </>
                        );
                      })()}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {d.method && d.method !== '-' && <span style={{ fontSize: 11, color: '#8A8A9A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '4px 8px' }}>Метод: {d.method}</span>}
                        {d.gar && <span style={{ fontSize: 11, color: '#8A8A9A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '4px 8px' }}>Гарниш: {d.gar}</span>}
                      </div>
                    </div>
                  )}
                </section>
              );
            });
          })()}
        </main>
      ) : view === 'pf' ? (
        <main style={styles.main}>
          <p style={styles.eyebrowSection}>Меню</p>
          <h2 style={styles.sectionTitle}>Заготовки</h2>

          {(() => {
            const list = DRINKS.filter(d => d.cat === 'Заготовки');
            if (!list.length) return <div style={styles.emptyHint}>Заготовок пока нет</div>;
            return list.map(d => {
              const open = drinkOpen === d.name;
              return (
                <section
                  key={d.name}
                  style={{
                    borderRadius: 18, border: '1px solid', marginBottom: 8, overflow: 'hidden',
                    borderColor: open ? 'rgba(204,255,0,0.22)' : 'rgba(255,255,255,0.08)',
                    background: open ? 'rgba(204,255,0,0.04)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <button
                    onClick={() => setDrinkOpen(open ? null : d.name)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 15px', textAlign: 'left' }}
                  >
                    {d.photo && <img src={d.photo} alt="" style={{ width: 44, height: 44, borderRadius: 11, objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: '#fff' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: '#8A8A9A', marginTop: 2 }}>{d.out}{d.ware && d.ware !== '-' ? ` · ${d.ware}` : ''}</div>
                    </div>
                  </button>

                  {open && (
                    <div style={{ padding: '0 15px 15px' }}>
                      <div style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#8A8A9A', margin: '12px 0 7px' }}>Состав</div>
                      {d.ing.map(([nm, qty]) => (
                        <div key={nm} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: 14, color: '#EDEDF2' }}>{nm}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#CCFF00', whiteSpace: 'nowrap' }}>{qty}</span>
                        </div>
                      ))}

                      <div style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#8A8A9A', margin: '12px 0 7px' }}>Приготовление</div>
                      {d.steps.map((st, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                          <span style={{ flexShrink: 0, width: 19, height: 19, borderRadius: 6, background: 'rgba(204,255,0,0.14)', color: '#CCFF00', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
                          <span style={{ fontSize: 13, lineHeight: 1.5, color: '#C8C8D2' }}>{st}</span>
                        </div>
                      ))}

                      {d.method && d.method !== '-' && (
                        <div style={{ marginTop: 10 }}>
                          <span style={{ fontSize: 11, color: '#8A8A9A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '4px 8px' }}>Метод: {d.method}</span>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            });
          })()}
        </main>
      ) : null}

      {schPickerFor && (
        <div style={styles.pinModal}>
          <div style={styles.pinModalBox}>
            <div style={styles.pinModalTitle}>Кто работает?</div>
            {STAFF_NAMES.map(name => (
              <button
                key={name}
                onClick={() => {
                  const [dayNum, shift] = schPickerFor.split('-');
                  assignShift(+dayNum, shift, name);
                }}
                style={{ width: '100%', textAlign: 'left', padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#F5F7FA', fontSize: 14, marginBottom: 8 }}
              >
                {name}
              </button>
            ))}
            <button
              onClick={() => {
                const [dayNum, shift] = schPickerFor.split('-');
                assignShift(+dayNum, shift, '');
              }}
              style={{ width: '100%', textAlign: 'center', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,61,90,0.3)', background: 'rgba(255,61,90,0.08)', color: '#FF6B7A', fontSize: 13, marginBottom: 8 }}
            >
              Очистить
            </button>
            <button onClick={() => setSchPickerFor(null)} style={{ width: '100%', textAlign: 'center', padding: '10px', color: '#8A8A9A', fontSize: 13, background: 'none', border: 'none' }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {view === 'stats' && isChief && !pinUnlocked && (
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

      {view === 'stats' && isChief && (() => {
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

            <div style={{ ...styles.activityLabel, marginTop: 24 }}>История чек-листа</div>
            {clHistory.length === 0 && (
              <div style={{ fontSize: 12, color: '#8A8A9A', padding: '10px 0' }}>Пока нет отметок ни по одному дню</div>
            )}
            {clHistory.map(day => {
              const pct = Math.round(day.done / day.total * 100);
              const open = clHistoryOpen === day.date;
              const label = `${CL_DAYS_FULL[day.dow]}, ${new Date(day.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' })}`;
              return (
                <div key={day.date} style={styles.supStatCard}>
                  <button
                    onClick={() => setClHistoryOpen(open ? null : day.date)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', textAlign: 'left', padding: 0 }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={styles.supStatName}>{label}</div>
                      <div style={{ fontSize: 11, color: '#8A8A9A', marginTop: 2 }}>{day.done} из {day.total} пунктов</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? '#CCFF00' : '#8A8A9A' }}>{pct}%</span>
                  </button>
                  {open && (
                    <div style={{ marginTop: 10 }}>
                      {day.sections.filter(s => s.total > 0).map(sec => (
                        <div key={sec.id} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, color: '#8A8A9A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            {sec.title} — {sec.done}/{sec.total}
                          </div>
                          {sec.missed.map((m, i) => (
                            <div key={i} style={{ fontSize: 12, color: '#FF3D5A', padding: '2px 0' }}>{m}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

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
  bellBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    border: '1px solid rgba(204,255,0,0.3)',
    background: 'rgba(204,255,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 4,
  },
  logoutBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 4,
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
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
  },
  navBtn: {
    flex: '1 0 auto',
    background: 'transparent',
    border: 'none',
    color: 'rgba(245,247,250,0.55)',
    fontFamily: "'Inter', sans-serif",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    padding: '10px 8px',
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
    width: '100%',
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
    gap: 22,
    marginBottom: 44,
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    transition: 'all 0.15s',
  },
  pinGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 80px)',
    gridTemplateRows: 'repeat(4, 80px)',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  pinKey: {
    background: 'rgba(255,255,255,0.07)',
    ...GLASS_SM,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    width: '80px',
    height: '80px',
    fontSize: 24,
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    color: '#F5F7FA',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinKeyDel: {
    fontSize: 20,
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
