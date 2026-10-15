// ─── Push-уведомления ────────────────────────────────────
const PUSH_SERVER = 'https://zakup-push.onrender.com';

// Утилита: конвертация VAPID public key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function setupPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push не поддерживается в этом браузере');
    return;
  }

  try {
    // Регистрируем Service Worker
    const reg = await navigator.serviceWorker.register('/zakup/sw.js');
    console.log('[SW] Зарегистрирован');

    // Запрашиваем разрешение на уведомления
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Уведомления не разрешены');
      return;
    }

    // Получаем публичный VAPID-ключ с сервера
    const keyRes = await fetch(`${PUSH_SERVER}/vapid-public-key`);
    const { key } = await keyRes.json();

    // Подписываемся на push
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      console.log('[Push] Уже подписан');
      return;
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });

    // Отправляем подписку на сервер
    await fetch(`${PUSH_SERVER}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
    console.log('[Push] Подписка сохранена на сервере');

  } catch (e) {
    console.warn('[Push] Ошибка настройки:', e.message);
  }
}

// Делаем setupPush глобальной — вызывается по нажатию кнопки в приложении
window.setupPush = setupPush;

// При загрузке только регистрируем SW, без запроса разрешения
window.addEventListener('load', async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/zakup/sw.js');
      console.log('[SW] Зарегистрирован');
    } catch (e) {
      console.warn('[SW] Ошибка:', e.message);
    }
  }
});
