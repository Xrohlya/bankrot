const tg = window.Telegram?.WebApp;
const el = id => document.getElementById(id);
const preview = document.body.dataset.mode === 'demo' ||
  (new URLSearchParams(location.search).get('preview') === '1' && !tg?.initData);

tg?.ready();
tg?.expand();

function render(data) {
  const greeting = el('greeting');
  greeting.replaceChildren();
  greeting.append(document.createTextNode(data.name ? 'Здравствуйте,' : 'Здравствуйте!'));
  if (data.name) {
    greeting.append(document.createElement('br'), document.createTextNode(`${data.name}.`));
  }
  el('intro').textContent = data.name
    ? 'Это ваш личный кабинет. Здесь вы всегда сможете узнать, кто занимается вашей заявкой.'
    : 'Заполните анкету в чате — здесь появятся ваше имя и назначенный юрист.';
  const lawyer = data.lawyer;
  el('lawyer-heading').textContent = lawyer?.name || 'Юрист ещё не назначен';
  el('lawyer-role').textContent = lawyer ? 'Ваш ответственный юрист' : 'Ожидаем рассмотрения заявки';
  el('avatar').textContent = lawyer?.name
    ? lawyer.name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase()
    : '—';
  el('lawyer-note').textContent = lawyer
    ? 'Этот юрист назначен ответственным за вашу заявку.'
    : 'После назначения здесь появится имя вашего юриста.';
  el('lawyer-link').hidden = !lawyer?.profile_url;
  if (lawyer?.profile_url) el('lawyer-link').href = lawyer.profile_url;
}

async function load() {
  el('error').hidden = true;
  el('retry').hidden = true;
  if (preview) {
    el('preview-banner').hidden = false;
    render({name: 'Анна', lawyer: {name: 'Мария Тихогло', profile_url: 'https://vk.ru/id1104344150'}});
    return;
  }
  if (!tg?.initData) {
    render({});
    el('intro').textContent = 'Чтобы увидеть свои данные, откройте кабинет кнопкой «Мой кабинет» в Telegram-боте.';
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch('/api/me', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({init_data: tg.initData}), signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось открыть кабинет.');
    render(data);
  } catch (error) {
    el('greeting').textContent = 'Не удалось загрузить кабинет';
    el('intro').textContent = 'Ваши данные сейчас недоступны. Попробуйте снова или вернитесь в чат.';
    el('lawyer-heading').textContent = 'Информация недоступна';
    el('lawyer-role').textContent = 'Не удалось проверить назначение';
    el('lawyer-link').hidden = true;
    el('error').textContent = error.name === 'AbortError' ? 'Сервер не ответил вовремя.' : error.message;
    el('error').hidden = false;
    el('retry').hidden = false;
  } finally {
    clearTimeout(timeout);
  }
}

el('retry').addEventListener('click', load);
el('back').addEventListener('click', () => {
  if (tg?.initData) tg.close();
  else location.href = 'https://t.me/bankroti_bot';
});
load();
