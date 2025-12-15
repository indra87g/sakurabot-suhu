export const run = {
   usage: ['shop'],
   category: 'miscs',
   async: async (m, {
      client,
      args,
      isPrefix,
      command,
      users,
      isOwner,
      Utils
   }) => {
      try {
         if (!global.db.setting.shop) global.db.setting.shop = {
            limit: 5000,
            premium: 15000,
            kayu: 100,
            batu: 200,
            besi: 300,
            emas: 500,
            berlian: 1000,
            adamantium: 2000
         }

         let [subcommand, item, amount] = args
         if (!subcommand) {
            let shop = global.db.setting.shop
            let text = `*S H O P*\n\n`
            text += `*B U Y*\n`
            text += `◦  *Limit* : ${Utils.formatNumber(shop.limit)} / 1\n`
            text += `◦  *Premium* : ${Utils.formatNumber(shop.premium)} / day\n\n`
            text += `*S E L L*\n`
            let sellableItems = Object.entries(users.inventory).filter(([, amount]) => amount > 0)
            if (sellableItems.length > 0) {
                sellableItems.forEach(([item]) => {
                    if (shop[item]) {
                        text += `◦  *${item.charAt(0).toUpperCase() + item.slice(1)}* : ${Utils.formatNumber(shop[item])} / 1\n`
                    }
                })
            } else {
                text += `You have no items to sell.\n`
            }
            text += `\n`
            text += `To buy, use *${isPrefix + command} buy <item> <amount>*\n`
            text += `To sell, use *${isPrefix + command} sell <item> <amount>*\n`
            return client.reply(m.chat, text, m)
         }

         if (subcommand === 'buy') {
            if (!item || !amount) return client.reply(m.chat, `• *Example* : ${isPrefix + command} buy limit 10`, m)
            let parsedAmount = parseInt(amount)
            if (isNaN(parsedAmount) || parsedAmount < 1) return client.reply(m.chat, 'Invalid amount.', m)

            if (item === 'limit') {
               let price = global.db.setting.shop.limit * parsedAmount
               if (users.money < price) return client.reply(m.chat, `You don't have enough money. You need ${Utils.formatNumber(price)}.`, m)
               users.money -= price
               users.limit += parsedAmount
               return client.reply(m.chat, `Successfully bought ${parsedAmount} limit for ${Utils.formatNumber(price)}.`, m)
            } else if (item === 'premium') {
               let price = global.db.setting.shop.premium * parsedAmount
               if (users.money < price) return client.reply(m.chat, `You don't have enough money. You need ${Utils.formatNumber(price)}.`, m)
               users.money -= price
               users.premium = true
               users.expired = (users.expired > 0 ? users.expired : new Date() * 1) + (86400000 * parsedAmount)
               return client.reply(m.chat, `Successfully bought ${parsedAmount} days of premium for ${Utils.formatNumber(price)}.`, m)
            } else {
               return client.reply(m.chat, 'Invalid item.', m)
            }
         } else if (subcommand === 'sell') {
            if (!item || !amount) return client.reply(m.chat, `• *Example* : ${isPrefix + command} sell kayu 10`, m)
            let parsedAmount = parseInt(amount)
            if (isNaN(parsedAmount) || parsedAmount < 1) return client.reply(m.chat, 'Invalid amount.', m)
            item = item.toLowerCase()
            if (!Object.keys(users.inventory).includes(item)) return client.reply(m.chat, 'Invalid item.', m)
            if (users.inventory[item] < parsedAmount) return client.reply(m.chat, `You don't have enough ${item}.`, m)

            if (!global.db.setting.shop[item]) return client.reply(m.chat, `This item cannot be sold.`, m)
            let price = global.db.setting.shop[item] * parsedAmount
            if (isNaN(price)) return client.reply(m.chat, 'Price is not a number.', m)
            users.inventory[item] -= parsedAmount
            users.money += price
            return client.reply(m.chat, `Successfully sold ${parsedAmount} ${item} for ${Utils.formatNumber(price)}.`, m)
         } else if (subcommand === 'setprice') {
            if (!isOwner) return client.reply(m.chat, global.status.owner, m)
            if (!item || !amount) return client.reply(m.chat, `• *Example* : ${isPrefix + command} setprice premium 20000`, m)
            let parsedPrice = parseInt(amount)
            if (isNaN(parsedPrice) || parsedPrice < 1) return client.reply(m.chat, 'Invalid price.', m)

            global.db.setting.shop[item] = parsedPrice
            return client.reply(m.chat, `Successfully set the price of ${item} to ${Utils.formatNumber(parsedPrice)}.`, m)
         } else {
            return client.reply(m.chat, 'Invalid subcommand.', m)
         }
      } catch (e) {
         console.error(e)
         return client.reply(m.chat, global.status.error, m)
      }
   },
   error: false,
   limit: true
}