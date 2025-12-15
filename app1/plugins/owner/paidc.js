export const run = {
   usage: ['paidc'],
   category: 'owner',
   owner: true,
   async: async (m, {
      client,
      args,
      isPrefix,
      command,
      Setting
   }) => {
      try {
         let [subcommand, cmd, price] = args
         if (!subcommand) return client.reply(m.chat, `• *Example* : ${isPrefix + command} new ping 1000`, m)

         if (!global.db.setting.paidc) global.db.setting.paidc = {}

         if (subcommand === 'new') {
            if (!cmd || !price) return client.reply(m.chat, `• *Example* : ${isPrefix + command} new ping 1000`, m)
            let parsedPrice = parseInt(price)
            if (isNaN(parsedPrice) || parsedPrice < 1) return client.reply(m.chat, 'Invalid price.', m)

            global.db.setting.paidc[cmd] = parsedPrice
            return client.reply(m.chat, `Successfully set ${cmd} to be a paid command with a price of ${parsedPrice}.`, m)
         } else if (subcommand === 'delete') {
            if (!cmd) return client.reply(m.chat, `• *Example* : ${isPrefix + command} delete ping`, m)
            if (!global.db.setting.paidc[cmd]) return client.reply(m.chat, `Command ${cmd} is not a paid command.`, m)

            delete global.db.setting.paidc[cmd]
            return client.reply(m.chat, `Successfully removed ${cmd} from the paid command list.`, m)
         } else if (subcommand === 'list') {
            let paidCommands = Object.entries(global.db.setting.paidc)
            if (paidCommands.length === 0) return client.reply(m.chat, 'There are no paid commands.', m)

            let list = '*P A I D  C O M M A N D S*\n\n'
            paidCommands.forEach(([cmd, price]) => {
               list += `◦  ${cmd} - ${price}\n`
            })

            return client.reply(m.chat, list, m)
         } else {
            return client.reply(m.chat, `Invalid subcommand. Use 'new', 'delete', or 'list'.`, m)
         }
      } catch (e) {
         console.error(e)
         return client.reply(m.chat, global.status.error, m)
      }
   }
}