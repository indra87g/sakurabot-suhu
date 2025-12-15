import fs from 'fs'

export const run = {
   usage: ['button1', 'button2'],
   category: 'miscs',
   async: async (m, {
      client,
      isPrefix,
      command,
      setting,
      Utils
   }) => {
      try {
         switch (command) {
            case 'button1':
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
                        rows: [{
                           title: 'Dummy 1',
                           // description: `X`,
                           id: `${isPrefix}run`
                        }, {
                           title: 'Dummy 2',
                           // description: `Y`,
                           id: `${isPrefix}run`
                        }]
                     }]
                  })
               }]
               client.sendIAMessage(m.chat, buttons, m, {
                  header: global.header,
                  content: 'Hi! @0',
                  v2: true,
                  footer: global.footer,
                  media: Utils.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64'),
               })
               break

            case 'button2':
               const cards = [{
                  header: {
                     imageMessage: global.db.setting.cover,
                     hasMediaAttachment: true,
                  },
                  body: {
                     text: "P"
                  },
                  nativeFlowMessage: {
                     buttons: [{
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                           display_text: 'Community',
                           url: global.db.setting.link,
                           webview_presentation: null
                        })
                     }]
                  }
               }, {
                  header: {
                     imageMessage: Utils.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64'),
                     hasMediaAttachment: true,
                  },
                  body: {
                     text: "P"
                  },
                  nativeFlowMessage: {
                     buttons: [{
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                           display_text: 'Neoxr API',
                           url: 'https://api.neoxr.eu',
                           webview_presentation: null
                        })
                     }]
                  }
               }]

               client.sendCarousel(m.chat, cards, m, {
                  content: 'Hi!'
               })
               break
         }
      } catch (e) {
         client.reply(m.chat, Utils.jsonFormat(e), m)
      }
   },
   error: false

}

