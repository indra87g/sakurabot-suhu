import { Client, Config, Utils } from '@neoxr/wb'
import baileys from './lib/engine.js'
import './lib/proto.js'
import './error.js'
import './lib/config.js'
import './lib/functions.js'
import { initializeDatabase, dbPath } from './lib/schema.js'
import { migrateData } from './lib/migration.js'
import { createDbProxy } from './lib/db-proxy.js'
import bytes from 'bytes'
import fs from 'node:fs'
import colors from 'colors'
import cron from 'node-cron'
import extra from './lib/listeners-extra.js'

const system = {
   session: 'local',
   name: 'Local'
}

const connect = async () => {
   try {
      // Initialize and migrate database
      try {
         const db = await initializeDatabase()
         global.db = db
         await migrateData()
      } catch (e) {
         console.error('Fatal error connecting to database, exiting...', e)
         process.exit(1)
      }

      const client = new Client({
         plugsdir: 'plugins',
         online: true,
         bypass_disappearing: true,
         bot: id => {
            // Detect message from bot by message ID, you can add another logic here
            return id && (id.startsWith('BAE') || /[-]/.test(id))
         },
         custom_id: 'neoxr', // Prefix for Custom Message ID (automatically detects isBot for itself)
         presence: true, // Set to 'true' if you want to see the bot typing or recording
         create_session: {
            type: system.session,
            session: 'session',
            config: process.env.DATABASE_URL || ''
         },
         engines: [baileys], // Init baileys as main engine
         debug: false // Set to 'true' if you want to see how this module works :v
      }, {
         // This is the Baileys connection options section
         version: [2, 3000, 1030285482], // To see the latest version : https://wppconnect.io/whatsapp-versions/
         browser: ['Mac OS', 'Chrome', '139.0.7258.164'],
         shouldIgnoreJid: jid => {
            return /(newsletter|bot)/.test(jid)
         }
      })

      client.once('connect', async res => {
         try {
            let settings = await db.get('SELECT * FROM settings WHERE key = ?', 'default')
            if (!settings) {
               await db.run('INSERT INTO settings (key) VALUES (?)', 'default')
               settings = await db.get('SELECT * FROM settings WHERE key = ?', 'default')
            }
            // Parse settings from JSON string to object once
            if (settings) {
               settings.owners = JSON.parse(settings.owners || '[]')
               settings.pluginDisable = JSON.parse(settings.pluginDisable || '[]')
               settings.error = JSON.parse(settings.error || '[]')
               settings.paidc = JSON.parse(settings.paidc || '{}')
               settings.toxic = JSON.parse(settings.toxic || '[]')
            }
            global.setting = settings
         } catch (e) {
            Utils.printError(e)
         }
         if (res && typeof res === 'object' && res.message) Utils.logFile(res.message)
      })

      client.register('error', async error => {
         console.log(colors.red(error.message))
         if (error && typeof error === 'object' && error.message) Utils.logFile(error.message)
      })

      client.once('ready', async () => {
         const ramCheck = setInterval(() => {
            var ramUsage = process.memoryUsage().rss
            if (ramUsage >= bytes(Config.ram_limit)) {
               clearInterval(ramCheck)
               process.send('reset')
            }
         }, 60 * 1000)

         cron.schedule('0 12 * * *', async () => {
            if (global.setting.autobackup) {
               if (fs.existsSync(dbPath)) {
                  await client.sock.sendFile(Config.owner + '@s.whatsapp.net', fs.readFileSync(dbPath), 'data.db', '', null)
               }
            }
         })

         cron.schedule('00 00 * * *', async () => {
            await global.db.run('UPDATE settings SET lastReset = ? WHERE key = ?', new Date() * 1, 'default')
            await global.db.run('UPDATE users SET limit_ = ? WHERE premium = ? AND limit_ < ?', Config.limit, false, Config.limit)
         }, {
            scheduled: true,
            timezone: process.env.TZ
         })

         extra(system, client)
      })
   } catch (e) {
      Utils.printError(e)
   }
}

connect().catch(() => connect())
