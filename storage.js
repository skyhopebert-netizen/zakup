// Защита от встраивания сайта в чужую страницу (clickjacking).
// GitHub Pages не даёт задать заголовок X-Frame-Options, поэтому проверяем в коде.
(function () {
  try {
    if (window.top !== window.self) {
      document.documentElement.style.display = 'none';
      window.top.location = window.self.location;
    }
  } catch (e) {
    document.documentElement.style.display = 'none';
  }
})();

// ============================================
  // НАСТРОЙКИ SUPABASE
  // ============================================
  const SUPABASE_URL = 'https://whselnzhzbvxtkncausz.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_PChhLBXS8la2mQUFa6AMwQ_jlqptKdI';

  // ============================================
  // window.storage — через защищённые функции базы (RPC).
  // Прямой доступ к таблице app_storage закрыт: каждое чтение и запись
  // проверяется по сессионному ключу, который выдаётся при входе по коду
  // и лежит только на устройстве сотрудника (localStorage).
  // Публичный ключ SUPABASE_KEY сам по себе данных больше не открывает.
  //   get(key, shared)         -> {key, value, shared} | бросает 'not found'
  //   set(key, value, shared)  -> {key, value, shared} | бросает ошибку
  //   list(prefix, shared)     -> {keys, prefix, shared} | null
  // shared === false — личные данные устройства, хранятся в localStorage.
  // ============================================
  const SESSION_STORAGE_KEY = 'local_sessionToken';

  function getSessionToken() {
    try { return localStorage.getItem(SESSION_STORAGE_KEY) || ''; } catch (e) { return ''; }
  }
  window.getSessionToken = getSessionToken;

  async function sbRpc(fn, args) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });
    if (res.status === 401 || res.status === 403) {
      // Сессия истекла или недействительна — приложение вернёт на экран входа
      window.dispatchEvent(new Event('stoika-auth-expired'));
      throw new Error('unauthorized');
    }
    if (!res.ok) throw new Error('rpc failed');
    return res.json();
  }

  window.storage = {
    async get(key, shared) {
      if (shared === false) {
        const v = localStorage.getItem('local_' + key);
        if (v === null) throw new Error('not found');
        return { key, value: v, shared: false };
      }
      const value = await sbRpc('storage_get', { p_token: getSessionToken(), p_key: key });
      if (value === null || value === undefined) throw new Error('not found');
      return { key, value, shared: true };
    },

    async set(key, value, shared) {
      if (shared === false) {
        localStorage.setItem('local_' + key, value);
        return { key, value, shared: false };
      }
      await sbRpc('storage_set', { p_token: getSessionToken(), p_key: key, p_value: value });
      return { key, value, shared: true };
    },

    async delete(key, shared) {
      if (shared === false) {
        localStorage.removeItem('local_' + key);
        return { key, deleted: true, shared: false };
      }
      // Удаление общих данных из приложения отключено намеренно
      return { key, deleted: false, shared: true };
    },

    async list(prefix, shared) {
      try {
        const keys = await sbRpc('storage_list', { p_token: getSessionToken(), p_prefix: prefix || '' });
        return { keys: keys || [], prefix, shared: true };
      } catch (e) {
        return null;
      }
    },
  };
