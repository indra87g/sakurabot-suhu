export const run = {
   usage: ['me'],
   category: 'user info',
   async: async (m, {
      client,
      blockList,
      Config,
      Utils
   }) => {
      let user = global.db.users.find(v => v.jid == m.sender)
      let _own = [...new Set([Config.owner, ...global.db.setting.owners])]
      const avatar = await client.profilePicture(m.sender)
      let blocked = blockList.includes(m.sender) ? true : false
      let now = new Date() * 1
      let lastseen = (user.lastseen == 0) ? 'Never' : Utils.toDate(now - user.lastseen)
      let usebot = (user.usebot == 0) ? 'Never' : Utils.toDate(now - user.usebot)
      let caption = `✦  *U S E R - P R O F I L E*\n\n`
      caption += `	◦  *Name* : ${m.pushName}\n`
      caption += `	◦  *Money* : ${Utils.formatNumber(user.money)}\n`
      caption += `	◦  *Limit* : ${Utils.formatNumber(user.limit)}\n`
      caption += `	◦  *Hitstat* : ${Utils.formatNumber(user.hit)}\n`
      caption += `	◦  *Warning* : ${((m.isGroup) ? (typeof global.db.groups.find(v => v.jid == m.chat).member[m.sender] != 'undefined' ? global.db.groups.find(v => v.jid == m.chat).member[m.sender].warning : 0) + ' / 5' : user.warning + ' / 5')}\n\n`
      let inventory = Object.entries(user.inventory).filter(([, value]) => value > 0)
      if (inventory.length > 0) {
         caption += `✦  *I N V E N T O R Y*\n\n`
         inventory.forEach(([item, amount]) => {
            caption += `	◦  *${item.charAt(0).toUpperCase() + item.slice(1)}* : ${Utils.formatNumber(amount)}\n`
         })
         caption += `\n`
      }
      caption += `✦  *U S E R - S T A T U S*\n\n`
      caption += `	◦  *Blocked* : ${(blocked ? '√' : '×')}\n`
      caption += `	◦  *Banned* : ${(new Date - user.ban_temporary < Config.timer) ? Utils.toTime(new Date(user.ban_temporary + Config.timeout) - new Date()) + ' (' + ((Config.timeout / 1000) / 60) + ' min)' : user.banned ? '√' : '×'}\n`
      caption += `	◦  *Use In Private* : ${(global.db.chats.map(v => v.jid).includes(m.sender) ? '√' : '×')}\n`
      caption += `	◦  *Premium* : ${(user.premium ? '√' : '×')}\n`
      caption += `	◦  *Expired* : ${user.expired == 0 ? '-' : Utils.timeReverse(user.expired - new Date() * 1)}\n\n`
      caption += global.footer
      client.sendMessageModify(m.chat, caption, m, {
         largeThumb: true,
         thumbnail: avatar
      })
   },
   error: false

}
