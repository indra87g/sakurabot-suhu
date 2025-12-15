import { Version } from '@neoxr/wb'
import fs from 'node:fs'

export const run = {
   usage: ['menu', 'help'],
   async: async (m, {
      client,
      text,
      isPrefix,
      command,
      setting,
      system,
      plugins,
      Config,
      Utils
   }) => {
      try {
         const local_size = fs.existsSync('./' + Config.database + '.json') ? await Utils.formatSize(fs.statSync('./' + Config.database + '.json').size) : ''
         const library = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
         const message = setting.msg
            .replace('+tag', `@${m.sender.replace(/@.+/g, '')}`)
            .replace('+name', m.pushName).replace('+greeting', Utils.greeting())
            .replace('+db', (system.name === 'Local' ? `Local (${local_size})` : system.name))
            .replace('+module', Version).replace('^', '').replace('~', '')
            .replace('+version', (library.dependencies.bails ? library.dependencies.bails : library.dependencies['baileys'] ? library.dependencies['baileys'] : library.dependencies.baileys).replace('^', '').replace('~', ''))

         if (text) {
            let cmd = Object.entries(plugins).filter(([_, v]) => v.run.usage && v.run.category == text.trim().toLowerCase() && !setting.hidden.includes(v.run.category.toLowerCase()))
            let usage = Object.keys(Object.fromEntries(cmd))
            if (usage.length == 0) return
            let commands = []
            cmd.map(([_, v]) => {
               switch (v.run.usage.constructor.name) {
                  case 'Array':
                     v.run.usage.map(x => commands.push({
                        usage: x,
                        use: v.run.use ? Utils.texted('bold', v.run.use) : ''
                     }))
                     break
                  case 'String':
                     commands.push({
                        usage: v.run.usage,
                        use: v.run.use ? Utils.texted('bold', v.run.use) : ''
                     })
               }
            })
            let print = commands.sort((a, b) => a.usage.localeCompare(b.usage)).map((v, i) => {
               if (i == 0) {
                  return `┌  ◦  ${isPrefix + v.usage} ${v.use}`
               } else if (i == commands.sort((a, b) => a.usage.localeCompare(b.usage)).length - 1) {
                  return `└  ◦  ${isPrefix + v.usage} ${v.use}`
               } else {
                  return `│  ◦  ${isPrefix + v.usage} ${v.use}`
               }
            }).join('\n')
            m.reply(print)
         } else {
            let filter = Object.entries(plugins).filter(([_, obj]) => obj.run.usage);
            let cmd = Object.fromEntries(filter);
            let category = {};
            for (let name in cmd) {
               let obj = cmd[name].run;
               if (!obj.category || setting.hidden.includes(obj.category)) continue;
               if (!category[obj.category]) {
                  category[obj.category] = [];
               }
               category[obj.category].push(obj);
            }
            const keys = Object.keys(category).sort();
            const rows = keys.map(v => ({
               title: v.charAt(0).toUpperCase() + v.slice(1),
               id: `${isPrefix + command} ${v}`
            }));
            const buttons = [{
               name: 'quick_reply',
               buttonParamsJson: JSON.stringify({
                  display_text: 'Runtime',
                  id: `${isPrefix}run`
               })
            }, {
               name: 'single_select',
               buttonParamsJson: JSON.stringify({
                  title: 'Tap Here!',
                  sections: [{
                     rows: rows
                  }]
               })
            }];
            client.sendIAMessage(m.chat, buttons, m, {
               header: global.header,
               content: message,
               v2: true,
               footer: global.footer,
               media: Utils.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64'),
            });
         }
      } catch (e) {
         client.reply(m.chat, Utils.jsonFormat(e), m)
      }
   },
   error: false
}
