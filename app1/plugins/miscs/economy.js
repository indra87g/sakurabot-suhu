export const run = {
   usage: ['money', 'leaderboard', 'daily'],
   category: 'miscs',
   async: async (m, {
      client,
      args,
      text,
      isPrefix,
      command,
      prefixes,
      users,
      isOwner,
      Utils
   }) => {
      try {
         if (command == 'money') {
            let [subcommand, user, amount] = text.split(' ')
            if (!subcommand) return client.reply(m.chat, `• *Example* : ${isPrefix + command} send 628xxxxxxxx 1000`, m)

            let target = user.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            let targetUser = global.db.users.find(v => v.jid == target)
            if (!targetUser) return client.reply(m.chat, `User with number ${target} not found.`, m)

            let parsedAmount = parseInt(amount)
            if (isNaN(parsedAmount) || parsedAmount < 1) return client.reply(m.chat, 'Invalid amount.', m)

            if (subcommand === 'send') {
               if (isOwner) {
                  targetUser.money += parsedAmount
                  return client.reply(m.chat, `Successfully sent ${Utils.formatNumber(parsedAmount)} to ${targetUser.name}.`, m)
               }

               if (users.money < parsedAmount) return client.reply(m.chat, `You don't have enough money.`, m)
               users.money -= parsedAmount
               targetUser.money += parsedAmount
               return client.reply(m.chat, `Successfully sent ${Utils.formatNumber(parsedAmount)} to ${targetUser.name}.`, m)
            } else if (subcommand === 'ask') {
               client.reply(target, `User ${m.pushName} is asking for ${Utils.formatNumber(parsedAmount)}.`, m)
               return client.reply(m.chat, `Successfully sent a request to ${targetUser.name}.`, m)
            } else {
               return client.reply(m.chat, `Invalid subcommand. Use 'send' or 'ask'.`, m)
            }
         } else if (command == 'leaderboard') {
            if (args[0] === 'money') {
               let sortedUsers = [...global.db.users].sort((a, b) => b.money - a.money)
               let topUsers = sortedUsers.slice(0, 10)

               let leaderboard = '*T O P  1 0  M O N E Y  L E A D E R B O A R D*\n\n'
               topUsers.forEach((user, index) => {
                  leaderboard += `${index + 1}. ${user.name} - ${Utils.formatNumber(user.money)}\n`
               })

               return client.reply(m.chat, leaderboard, m)
            } else {
               return client.reply(m.chat, `Invalid leaderboard type. Use 'money'.`, m)
            }
         } else if (command == 'daily') {
            let lastclaim = users.lastclaim
            let cooldown = 86400000
            if (new Date - lastclaim < cooldown) return client.reply(m.chat, `You have already claimed your daily reward. Please wait for ${Utils.toTime(new Date(lastclaim + cooldown) - new Date())}.`, m)

            let money = Math.floor(Math.random() * 99901) + 100
            users.money += money
            users.lastclaim = new Date() * 1

            let items = [
               { name: 'kayu', chance: 0.9 },
               { name: 'batu', chance: 0.8 },
               { name: 'besi', chance: 0.7 },
               { name: 'emas', chance: 0.5 },
               { name: 'berlian', chance: 0.3 },
               { name: 'adamantium', chance: 0.1 }
            ]

            let claimedItems = []
            items.forEach(item => {
               if (Math.random() < item.chance) {
                  let amount = Math.floor(Math.random() * 10) + 1
                  users.inventory[item.name] += amount
                  claimedItems.push(`${amount}x ${item.name}`)
               }
            })

            let reply = `*D A I L Y  R E W A R D*\n\n`
            reply += `You have claimed:\n`
            reply += `◦  Money: ${Utils.formatNumber(money)}\n`
            if (claimedItems.length > 0) {
               reply += `◦  Items: ${claimedItems.join(', ')}\n`
            }

            return client.reply(m.chat, reply, m)
         }
      } catch (e) {
         console.error(e)
         return client.reply(m.chat, global.status.error, m)
      }
   },
   error: false,
   limit: true
}