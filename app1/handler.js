import { Utils, Scraper, Cooldown, Spam, Config } from '@neoxr/wb'
import cron from 'node-cron'
import path from 'path'
const cooldown = new Cooldown(Config.cooldown)
const spam = new Spam({
   RESET_TIMER: Config.cooldown,
   HOLD_TIMER: Config.timeout,
   PERMANENT_THRESHOLD: Config.permanent_threshold,
   NOTIFY_THRESHOLD: Config.notify_threshold,
   BANNED_THRESHOLD: Config.banned_threshold
})

export default async (client, ctx) => {
   let { store, m, body, prefix, plugins, commands, args, command, text, prefixes, core, system } = ctx
   try {
      if (m.sender && m.sender.endsWith('lid')) m.sender = client.getRealJid(m.sender) || m.sender
      const [groupMetadata, blockList] = await Promise.all([
         m.isGroup ? client.resolveGroupMetadata(m.chat) : Promise.resolve({}),
         client.fetchBlocklist().catch(() => [])
      ])

      let users = await global.db.get('SELECT * FROM users WHERE jid = ?', m.sender)
      if (!users) {
         await global.db.run('INSERT INTO users (jid, lid) VALUES (?, ?)', m.sender, m.sender.endsWith('lid') ? m.sender : null)
         users = await global.db.get('SELECT * FROM users WHERE jid = ?', m.sender)
      }

      let chats = m.isGroup ? await global.db.get('SELECT * FROM chats WHERE jid = ?', m.chat) : null
      if (m.isGroup && !chats) {
         await global.db.run('INSERT INTO chats (jid) VALUES (?)', m.chat)
         chats = await global.db.get('SELECT * FROM chats WHERE jid = ?', m.chat)
      }

      let groupSet = m.isGroup ? await global.db.get('SELECT * FROM groups WHERE jid = ?', m.chat) : {}
      if (m.isGroup && !groupSet) {
          await global.db.run('INSERT INTO groups (jid, member) VALUES (?, ?)', m.chat, '{}');
          groupSet = await global.db.get('SELECT * FROM groups WHERE jid = ?', m.chat);
      }

      let setting = global.setting
      if (setting) {
         setting.owners = JSON.parse(setting.owners || '[]')
         setting.pluginDisable = JSON.parse(setting.pluginDisable || '[]')
         setting.error = JSON.parse(setting.error || '[]')
         setting.paidc = JSON.parse(setting.paidc || '{}')
         setting.toxic = JSON.parse(setting.toxic || '[]')
      } else {
         // Fallback if global.setting is not loaded
         setting = { owners: [], pluginDisable: [], error: [], paidc: {}, toxic: [] }
      }

      let isOwner = [client.decodeJid(client.user.id).replace(/@.+/, ''), Config.owner, ...setting.owners].map(v => v + '@s.whatsapp.net').includes(m.sender)
      let isPrem = users && users.premium || isOwner
      let participants = m.isGroup ? groupMetadata ? client.lidParser(groupMetadata.participants) : [] : [] || []
      const admins = m.isGroup ? client.getAdmin(participants) : []
      const isAdmin = m.isGroup ? admins.includes(m.sender) : false
      const isBotAdmin = m.isGroup ? admins.includes((client.user.id.split`:`[0]) + '@s.whatsapp.net') : false

      const isSpam = spam.detection(client, m, {
         prefix, command, commands, users, cooldown,
         show: 'all', // options: 'all' | 'command-only' | 'message-only' | 'spam-only'| 'none'
         banned_times: users?.ban_times,
         exception: isOwner || isPrem
      })

      plugins = Object.fromEntries(Object.entries(plugins).filter(([dir, _]) => !setting.pluginDisable.includes(path.basename(dir, '.js'))))

      if (!setting.online) client.sendPresenceUpdate('unavailable', m.chat)
      if (setting.online) {
         client.sendPresenceUpdate('available', m.chat)
         client.readMessages([m.key])
      }
      if (m.isGroup && !isBotAdmin && groupSet) {
         await global.db.run('UPDATE groups SET localonly = ? WHERE jid = ?', false, m.chat)
      }
      if (!setting.multiprefix) await global.db.run('UPDATE settings SET noprefix = ? WHERE key = ?', false, 'default')
      if (setting.debug && !m.fromMe && isOwner) client.reply(m.chat, Utils.jsonFormat(m), m)

      if (m.isGroup) await global.db.run('UPDATE groups SET activity = ? WHERE jid = ?', new Date() * 1, m.chat)
      if (users) {
         if (!users.lid) {
            const { lid } = await client.getUserId(m.sender)
            if (lid) await global.db.run('UPDATE users SET lid = ? WHERE jid = ?', lid, m.sender)
         }
         await global.db.run('UPDATE users SET name = ?, lastseen = ? WHERE jid = ?', m.pushName, new Date() * 1, m.sender)
      }

      if (chats) {
         await global.db.run('UPDATE chats SET chat = chat + 1, lastseen = ? WHERE jid = ?', new Date() * 1, m.chat)
      }

      if (m.isGroup && !m.isBot && users && users.afk > -1) {
         client.reply(m.chat, `You are back online after being offline for : ${Utils.texted('bold', Utils.toTime(new Date - users.afk))}\n\n• ${Utils.texted('bold', 'Reason')}: ${users.afkReason ? users.afkReason : '-'}`, m)
         await global.db.run('UPDATE users SET afk = ?, afkReason = ?, afkObj = ? WHERE jid = ?', -1, '', '{}', m.sender)
      }

      if (m.isGroup && !m.fromMe && groupSet) {
         let member = JSON.parse(groupSet.member || '{}')
         let now = new Date() * 1
         if (!member[m.sender]) {
            member[m.sender] = {
               lastseen: now,
               warning: 0
            }
         } else {
            member[m.sender].lastseen = now
         }
         await global.db.run('UPDATE groups SET member = ? WHERE jid = ?', JSON.stringify(member), m.chat)
      }

      if (body && !setting.self && core.prefix != setting.onlyprefix && commands.includes(core.command) && !setting.multiprefix && !Config.evaluate_chars.includes(core.command)) return client.reply(m.chat, `🚩 *Incorrect prefix!*, this bot uses prefix : *[ ${setting.onlyprefix} ]*\n\n➠ ${setting.onlyprefix + core.command} ${text || ''}`, m)
      const matcher = Utils.matcher(command, commands).filter(v => v.accuracy >= 60)
      if (prefix && !commands.includes(command) && matcher.length > 0 && !setting.self) {
         if (!m.isGroup || (m.isGroup && !groupSet.mute)) return client.reply(m.chat, `🚩 Command you are using is wrong, try the following recommendations :\n\n${matcher.map(v => '➠ *' + (prefix ? prefix : '') + v.string + '* (' + v.accuracy + '%)').join('\n')}`, m)
      }

      if (
         body && prefix && commands.includes(command) && setting.multiprefix && (setting.prefix || '.').includes(prefix) ||
         body && !prefix && commands.includes(command) && setting.noprefix ||
         body && prefix && commands.includes(command) && !setting.multiprefix && setting.onlyprefix === prefix ||
         body && !prefix && commands.includes(command) && Config.evaluate_chars.includes(command)
      ) {
         if (setting.error.includes(command)) return client.reply(m.chat, Utils.texted('bold', `🚩 Command _${(prefix ? prefix : '') + command}_ disabled.`), m)
         if (!m.isGroup && Config.blocks.some(no => m.sender?.startsWith(no))) return client.updateBlockStatus(m.sender, 'block')
         if (commands.includes(command)) {
            await global.db.run('UPDATE users SET hit = hit + 1, usebot = ? WHERE jid = ?', new Date() * 1, m.sender)
            Utils.hitstat(command, m.sender)
         }
         const is_commands = Object.fromEntries(Object.entries(plugins).filter(([name, prop]) => prop.run.usage))
         for (const [pluginPath, pluginData] of Object.entries(is_commands)) {
            const name = path.basename(pluginPath, '.js')
            const cmd = pluginData.run
            const turn = cmd.usage instanceof Array ? cmd.usage.includes(command) : cmd.usage instanceof String ? cmd.usage == command : false
            const turn_hidden = cmd.hidden instanceof Array ? cmd.hidden.includes(command) : cmd.hidden instanceof String ? cmd.hidden == command : false
            if (!turn && !turn_hidden) continue
            if (m.isBot || m.chat.endsWith('broadcast') || /edit/.test(m.mtype)) continue
            if (setting.self && !isOwner && !m.fromMe) continue
            if (!m.isGroup && !['owner'].includes(name) && chats && !isPrem && !users.banned && new Date() * 1 - chats.lastchat < Config.timeout) continue
            if (!m.isGroup && !['owner', 'menfess', 'scan', 'verify', 'payment', 'premium'].includes(name) && chats && !isPrem && !users.banned && setting.groupmode) {
               client.sendMessageModify(m.chat, `⚠️ Using bot in private chat only for premium user, want to upgrade to premium plan ? send *${prefixes[0]}premium* to see benefit and prices.`, m, {
                  largeThumb: true,
                  thumbnail: 'https://telegra.ph/file/0b32e0a0bb3b81fef9838.jpg',
                  url: setting.link
               }).then(async () => await global.db.run('UPDATE chats SET lastchat = ? WHERE jid = ?', new Date() * 1, m.chat))
               continue
            }
            if (!['me', 'owner', 'exec'].includes(name) && users && (users.banned || new Date - users.ban_temporary < Config.timeout)) continue
            if (m.isGroup && !['activation', 'groupinfo'].includes(name) && groupSet.mute) continue
            if (setting.paidc && command in setting.paidc && !isOwner) {
               let price = setting.paidc[command]
               if (users.money < price) {
                  client.reply(m.chat, `You don't have enough money to use this command. You need ${Utils.formatNumber(price)}.`, m)
                  continue
               }
               await global.db.run('UPDATE users SET money = money - ? WHERE jid = ?', price, m.sender)
            }
            if (cmd.owner && !isOwner) {
               client.reply(m.chat, global.status.owner, m)
               continue
            }
            if (cmd.restrict && !isPrem && !isOwner && text && new RegExp('\\b' + setting.toxic.join('\\b|\\b') + '\\b').test(text.toLowerCase())) {
               client.reply(m.chat, `⚠️ You violated the *Terms & Conditions* of using bots by using blacklisted keywords, as a penalty for your violation being blocked and banned.`, m).then(async () => {
                  await global.db.run('UPDATE users SET banned = ? WHERE jid = ?', true, m.sender)
                  client.updateBlockStatus(m.sender, 'block')
               })
               continue
            }
            if (setting.antispam && isSpam && /(BANNED|NOTIFY|TEMPORARY)/.test(isSpam.state)) {
               client.reply(m.chat, Utils.texted('bold', `🚩 ${isSpam.msg}`), m)
               continue
            }
            if (setting.antispam && isSpam && /HOLD/.test(isSpam.state)) continue
            if (cmd.premium && !isPrem) {
               client.reply(m.chat, global.status.premium, m)
               continue
            }
            if (cmd.limit && users.limit_ < 1) {
               client.reply(m.chat, `⚠️ You reached the limit and will be reset at 00.00\n\nTo get more limits upgrade to premium plans.`, m).then(async () => await global.db.run('UPDATE users SET premium = ? WHERE jid = ?', false, m.sender))
               continue
            }
            if (cmd.limit && users.limit_ > 0) {
               const limit = cmd.limit.constructor.name == 'Boolean' ? 1 : cmd.limit
               if (users.limit_ >= limit) {
                  await global.db.run('UPDATE users SET limit_ = limit_ - ? WHERE jid = ?', limit, m.sender)
               } else {
                  client.reply(m.chat, Utils.texted('bold', `⚠️ Your limit is not enough to use this feature.`), m)
                  continue
               }
            }
            if (cmd.group && !m.isGroup) {
               client.reply(m.chat, global.status.group, m)
               continue
            } else if (cmd.botAdmin && !isBotAdmin) {
               client.reply(m.chat, global.status.botAdmin, m)
               continue
            } else if (cmd.admin && !isAdmin) {
               client.reply(m.chat, global.status.admin, m)
               continue
            }
            if (cmd.private && m.isGroup) {
               client.reply(m.chat, global.status.private, m)
               continue
            }
            cmd.async(m, { client, args, text, isPrefix: prefix, prefixes, command, groupMetadata, participants, users, chats, groupSet, setting, isOwner, isAdmin, isBotAdmin, plugins: Object.fromEntries(Object.entries(plugins).filter(([name, _]) => !setting.pluginDisable.includes(name))), blockList, Config, ctx, store, system, Utils, Scraper })
            break
         }
      } else {
         const is_events = Object.fromEntries(Object.entries(plugins).filter(([name, prop]) => !prop.run.usage))
         for (const [pluginPath, pluginData] of Object.entries(is_events)) {
            const name = path.basename(pluginPath, '.js')
            const event = pluginData.run
            if ((m.fromMe && m.isBot) || m.chat.endsWith('broadcast') || /pollUpdate/.test(m.mtype)) continue
            if (!m.isGroup && Config.blocks.some(no => m.sender.startsWith(no))) return client.updateBlockStatus(m.sender, 'block')
            if (setting.self && !['menfess_ev', 'anti_link', 'anti_tagall', 'anti_virtex', 'filter'].includes(event.pluginName) && !isOwner && !m.fromMe) continue
            if (!['anti_link', 'anti_tagall', 'anti_virtex', 'filter'].includes(name) && users && (users.banned || new Date - users.ban_temporary < Config.timeout)) continue
            if (!['anti_link', 'anti_tagall', 'anti_virtex', 'filter'].includes(name) && groupSet && groupSet.mute) continue
            if (!m.isGroup && !['menfess_ev', 'chatbot', 'auto_download'].includes(name) && chats && !isPrem && !users.banned && new Date() * 1 - chats.lastchat < Config.timeout) continue
            if (!m.isGroup && setting.groupmode && !['system_ev', 'menfess_ev', 'chatbot', 'auto_download'].includes(name) && !isPrem) return client.sendMessageModify(m.chat, `⚠️ Using bot in private chat only for premium user, want to upgrade to premium plan ? send *${prefixes[0]}premium* to see benefit and prices.`, m, {
               largeThumb: true,
               thumbnail: await Utils.fetchAsBuffer('https://telegra.ph/file/0b32e0a0bb3b81fef9838.jpg'),
               url: setting.link
            }).then(async () => await global.db.run('UPDATE chats SET lastchat = ? WHERE jid = ?', new Date() * 1, m.chat))
            if (event.error) continue
            if (event.owner && !isOwner) continue
            if (event.group && !m.isGroup) continue
            if (event.limit && !event.game && users.limit_ < 1 && body && Utils.generateLink(body) && Utils.generateLink(body).some(v => Utils.socmed(v))) return client.reply(m.chat, `⚠️ You reached the limit and will be reset at 00.00\n\nTo get more limits upgrade to premium plan.`, m).then(async () => {
               await global.db.run('UPDATE users SET premium = ?, expired = ? WHERE jid = ?', false, 0, m.sender)
            })
            if (event.botAdmin && !isBotAdmin) continue
            if (event.admin && !isAdmin) continue
            if (event.private && m.isGroup) continue
            if (event.download && body && Utils.socmed(body) && !setting.autodownload && Utils.generateLink(body) && Utils.generateLink(body).some(v => Utils.socmed(v))) continue
            event.async(m, { client, body, prefixes, groupMetadata, participants, users, chats, groupSet, setting, isOwner, isAdmin, isBotAdmin, plugins: Object.fromEntries(Object.entries(plugins).filter(([name, _]) => !setting.pluginDisable.includes(name))), blockList, Config, ctx, store, system, Utils, Scraper })
         }
      }
   } catch (e) {
      Utils.printError(e)
   }
}