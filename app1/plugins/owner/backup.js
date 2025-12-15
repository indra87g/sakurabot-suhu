import fs from 'node:fs'
import { stringify } from 'flatted'

export const run = {
   usage: ['backup'],
   category: 'owner',
   async: async (m, {
      client,
      Config,
      system,
      Utils
   }) => {
      try {
         await m.react('🕒')
         await system.database.save(global.db)
         fs.writeFileSync(Config.database + '.json', stringify(global.db), 'utf-8')
         await client.sendFile(m.chat, fs.readFileSync('./' + Config.database + '.json'), Config.database + '.json', '', m)
      } catch (e) {
         return client.reply(m.chat, Utils.jsonFormat(e), m)
      }
   },
   owner: true
}