export const run = {
   usage: ['mcserverinfo'],
   category: 'miscs',
   async: async (m, { client }) => {
      try {
         await client.reply(m.chat, 'Sedang mengambil data server, mohon tunggu...', m)
         const response = await fetch('http://veda.hidencloud.com:25234/server')
         const json = await response.json()
         let text = `✦  *S A K U R A - U N I V E R S E*\n\n`
         text += `◦  *MOTD* : ${json.motd}\n`
         text += `◦  *Time* : ${json.serverTime}\n`
         text += `◦  *Players* : ${json.players}\n\n`
         text += `✦  *S Y S T E M*\n\n`
         text += `◦  *CPU* : ${json.cpu.processCpuLoad.toFixed(2)}% / 100%\n`
         text += `◦  *RAM* : ${json.ram.used} / ${json.ram.total}\n`
         text += `◦  *Storage* : ${json.storage.used} / ${json.storage.total}\n`
         client.reply(m.chat, text, m)
      } catch (e) {
         console.error(e)
         client.reply(m.chat, 'Maaf, terjadi kesalahan saat mengambil data server.', m)
      }
   }
}
