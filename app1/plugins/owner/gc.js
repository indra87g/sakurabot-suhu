export const run = {
   usage: ['gcopt', 'gc'],
   async: async (m, {
      client,
      args,
      isPrefix,
      command,
      setting,
      Utils
   }) => {
      try {
         client.groupsJid = client.groupsJid || []
         const areArraysEqual = (a, b) => a.length === b.length && JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
         const fetchedGroups = Object.values(await client.groupFetchAllParticipating()).map(v => v.id)
         if (fetchedGroups.length > 0 && !areArraysEqual(fetchedGroups, client.groupsJid)) {
            client.groupsJid = fetchedGroups
         }

         const [no, option, ...text] = args
         if (!no || isNaN(no)) return client.reply(m.chat, explain(isPrefix, command), m)
         let group = global.db.groups?.find(v => v.jid === client.groupsJid[no - 1])
         if (!group) return client.reply(m.chat, Utils.texted('bold', `🚩 Group not found.`), m)

         const { id, subject, participants } = await client.resolveGroupMetadata(group.jid)
         const picture = await client.profilePicture(id)
         const admins = client.getAdmin(client.lidParser(participants))
         const isBotAdmin = admins.includes(client.decodeJid(client.user.id))

         switch (true) {
            case option?.includes('-'): {
               const texts = text?.join(' ')
               const color = `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase()}`
               const q = m.quoted ? m.quoted : m
               const mime = (q.msg || q).mimetype || ''
               if (/video|image\/(jpe?g|png)/.test(mime)) {
                  await client.sendReact(m.chat, '🕒', m.key)
                  client.groupStatus(id, {
                     message: { [q.mtype]: { ...q, caption: texts || q.text || '' } },
                     caption: texts || q.text || ''
                  }).then(async () => {
                     await client.sendReact(m.chat, '✅', m.key)
                  })
               } else if (/audio/.test(mime)) {
                  await client.sendReact(m.chat, '🕒', m.key)
                  client.groupStatus(id, {
                     message: { [q.mtype]: q },
                     background: color
                  }).then(async () => {
                     await client.sendReact(m.chat, '✅', m.key)
                  })
               } else {
                  if (!texts) return client.reply(m.chat, Utils.texted('bold', `🚩 Text is required!`), m)
                  await client.sendReact(m.chat, '🕒', m.key)
                  client.groupStatus(id, {
                     text: texts,
                     background: color
                  }).then(async () => {
                     await client.sendReact(m.chat, '✅', m.key)
                  })
               }
               break
            }

            case option === 'open': {
               if (!isBotAdmin) return client.reply(m.chat, Utils.texted('bold', `🚩 Can't open ${subject} group link because the bot is not an admin.`), m)
               client.groupSettingUpdate(id, 'not_announcement').then(() => {
                  client.reply(id, Utils.texted('bold', `🚩 Group has been opened.`)).then(() => {
                     client.reply(m.chat, Utils.texted('bold', `🚩 Successfully open ${subject} group.`), m)
                  })
               })
               break
            }

            case option === 'close': {
               if (!isBotAdmin) return client.reply(m.chat, Utils.texted('bold', `🚩 Can't close ${subject} group link because the bot is not an admin.`), m)
               client.groupSettingUpdate(id, 'announcement').then(() => {
                  client.reply(id, Utils.texted('bold', `🚩 Group has been closed.`)).then(() => {
                     client.reply(m.chat, Utils.texted('bold', `🚩 Successfully close ${subject} group.`), m)
                  })
               })
               break
            }

            case option === 'mute': {
               group.mute = true
               client.reply(m.chat, Utils.texted('bold', `🚩 Bot successfully muted in ${subject} group.`), m)
               break
            }

            case option === 'unmute': {
               group.mute = false
               client.reply(m.chat, Utils.texted('bold', `🚩 Bot successfully unmuted in ${subject} group.`), m)
               break
            }

            case option === 'link': {
               if (!isBotAdmin) return client.reply(m.chat, Utils.texted('bold', `🚩 Can't get ${subject} group link because the bot is not an admin.`), m)
               client.reply(m.chat, 'https://chat.whatsapp.com/' + (await client.groupInviteCode(id)), m)
               break
            }

            case option === 'leave': {
               client.reply(id, `🚩 Good Bye! (${setting.link})`, null, {
                  mentions: participants.map(v => v.id)
               }).then(async () => {
                  await client.groupLeave(id).then(() => {
                     Utils.removeItem(global.db.groups, group)
                     return client.reply(m.chat, Utils.texted('bold', `🚩 Successfully leave from ${subject} group.`), m)
                  })
               })
               break
            }

            case option === 'reset': {
               group.expired = 0
               group.stay = false
               client.reply(m.chat, Utils.texted('bold', `🚩 Configuration of bot in the ${subject} group has been successfully reseted to default.`), m)
               break
            }

            case option === 'forever': {
               group.expired = 0
               group.stay = true
               client.reply(m.chat, Utils.texted('bold', `🚩 Successfully set bot to stay forever in ${subject} group.`), m)
               break
            }

            case option?.endsWith('d'): {
               const now = new Date() * 1
               const day = 86400000 * parseInt(option.replace('d', ''))
               group.expired += (group.expired == 0) ? (now + day) : day
               group.stay = false
               client.reply(m.chat, Utils.texted('bold', `🚩 Bot duration is successfully set to stay for ${option.replace('d', ' days')} in ${subject} group.`), m)
               break
            }

            default: {
               client.sendMessageModify(m.chat, steal(Utils, {
                  name: subject,
                  member: participants.length,
                  time: group.stay ? 'FOREVER' : (group.expired == 0 ? 'NOT SET' : Utils.timeReverse(group.expired - new Date() * 1)),
                  admin: isBotAdmin,
                  group
               }) + '\n\n' + global.footer, m, {
                  largeThumb: true,
                  thumbnail: picture
               })
            }
         }
      } catch (e) {
         console.log(e)
         m.reply(Utils.jsonFormat(e))
      }
   },
   owner: true
}

const steal = (Utils, data) => {
   return `✦  *S T E A L E R*

	◦  *Name* : ${data.name}
	◦  *Member* : ${data.member}
	◦  *Expired* : ${data.time}
	◦  *Status* : ${Utils.switcher(data.group.mute, 'OFF', 'ON')}
	◦  *Bot Admin* : ${Utils.switcher(data.admin, '√', '×')}`
}

const explain = (prefix, cmd) => {
   return `✦  *M O D E R A T I O N*

*1.* ${prefix + cmd} <no>
- to steal / get group info

*2.* ${prefix + cmd} <no> open
- to open the group allow all members to send messages

*3.* ${prefix + cmd} <no> close
- to close the group only admins can send messages

*4.* ${prefix + cmd} <no> mute
- to mute / turn off in the group

*5.* ${prefix + cmd} <no> unmute
- to unmute / turn on in the group

*6.* ${prefix + cmd} <no> link
- to get the group invite link, make sure the bot is an admin

*7.* ${prefix + cmd} <no> leave
- to leave the group

*8.* ${prefix + cmd} <no> reset
- to reset group configuration to default

*9.* ${prefix + cmd} <no> forever
- to make bots stay forever in the group

*10.* ${prefix + cmd} <no> 30d
- to set the duration of the bot in the group
Example : ${prefix + cmd} 2 1d

*11.* ${prefix + cmd} <no> - text or reply media (video, image, audio)
- to create a group status / story
Example : ${prefix + cmd} 2 - Hello World!

*NB* : Make sure you reply to messages containing group list to use this moderation options, send _${prefix}groups_ to show all group list.`
}