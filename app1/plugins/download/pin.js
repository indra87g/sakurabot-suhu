export const run = {
   usage: ['pin'],
   hidden: ['pinterest'],
   use: 'link / query',
   category: 'downloader',
   async: async (m, {
      client,
      text,
      isPrefix,
      command,
      Utils
   }) => {
      try {
         if (!text) return client.reply(m.chat, Utils.example(isPrefix, command, 'https://pin.it/5fXaAWE'), m)
         client.sendReact(m.chat, '🕒', m.key)
         if (Utils.isUrl(text.trim())) {
            if (!text.match(/pin(?:terest)?(?:\.it|\.com)/)) return m.reply(global.status.invalid)
            const json = await Api.neoxr('/pin', {
               url: text.trim()
            })
            if (!json.status) return client.reply(m.chat, Utils.jsonFormat(json), m)
            if (/jpg|mp4/.test(json.data.type)) return client.sendFile(m.chat, json.data.url, '', '', m)
            if (json.data.type == 'gif') return client.sendFile(m.chat, json.data.url, '', ``, m, {
               gif: true
            })
         } else {
            const json = await (await fetch('https://api.ownblox.my.id/api/pinterest?q=' + encodeURIComponent(text.trim()))).json()
            if (json.status !== 200 || !json.results || json.results.length === 0) {
               return client.reply(m.chat, global.status.fail, m)
            }
            const album = json.results.slice(0, 5).map(result => ({
              url: result.image,
              caption: `Caption: ${result.caption || '-'}\nAuthor: ${result.upload_by}`,
              type: 'image'
            }));
            client.sendAlbumMessage(m.chat, album, m);
         }
      } catch (e) {
         client.reply(m.chat, Utils.jsonFormat(e), m)
      }
   },
   error: false,
   limit: true
}