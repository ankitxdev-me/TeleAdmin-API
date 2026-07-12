require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function link(admin) {
  // Use @username href when available — always works in Telegram
  // Fall back to tg://user?id= for users without a username
  const href = admin.username
    ? `https://t.me/${admin.username}`
    : `tg://user?id=${admin.id}`;
  return `<a href="${href}">${esc(admin.display_name)}</a>`;
}

function getTitle(admin) {
  return admin.is_bot ? 'Bot' : admin.custom_title;
}

function formatLine(admin) {
  const t = getTitle(admin);
  return t ? `• ${link(admin)} ............. ${esc(t)}` : `• ${link(admin)}`;
}

// /start command
bot.start((ctx) => {
  ctx.reply(
    '👋 Welcome to TeleAdmin Bot\n\n' +
    'Send a Telegram group username or public group link.\n\n' +
    'Examples:\n' +
    '@bluffarena\n' +
    'or\n' +
    'https://t.me/bluffarena\n\n' +
    'Only Telegram Groups and Supergroups are supported.'
  );
});

// Any text message — treat as target
bot.on('text', async (ctx) => {
  const target = ctx.message.text.trim();

  await ctx.reply('🔍 Fetching administrators...');

  let data;

  try {
    const response = await axios.get(`${process.env.API_URL}/api/admins`, {
      params: { target },
      headers: { Authorization: `Bearer ${process.env.API_KEY}` },
    });
    data = response.data;
  } catch (err) {
    const errorPayload = err.response?.data ?? err.message;
    await ctx.reply(
      typeof errorPayload === 'string'
        ? errorPayload
        : JSON.stringify(errorPayload, null, 2)
    );
    return;
  }

  if (!data.success) {
    await ctx.reply(JSON.stringify(data, null, 2));
    return;
  }

  const g = data.group;
  const owner  = data.admins.find((a) => a.role === 'owner');
  const admins = data.admins.filter((a) => a.role !== 'owner');

  let message =
    `📌 <b>${esc(g.title)}</b>\n` +
    `${capitalize(g.type)} · ${g.member_count !== null ? g.member_count.toLocaleString() : '?'} members · ${g.admins_count} admins\n\n`;

  if (owner) {
    message += `👑 <b>Owner</b>\n• ${link(owner)}\n\n`;
  }

  if (admins.length > 0) {
    message += `🛡 <b>Admins</b>\n`;
    message += admins.map(formatLine).join('\n');
  }

  await ctx.reply(message, { parse_mode: 'HTML' });
});

bot.launch();
console.log('Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));