
import fs from 'fs'
import { parse } from 'flatted'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export async function migrateData() {
  const jsonPath = './app1/data.json'
  if (!fs.existsSync(jsonPath)) {
    console.log('data.json not found, skipping migration.')
    return
  }

  const db = await open({
    filename: './app1/data.db',
    driver: sqlite3.Database
  })

  const jsonData = fs.readFileSync(jsonPath, 'utf-8')
  const data = parse(jsonData)

  // Migrate users
  if (data.users && data.users.length > 0) {
    const userStmt = await db.prepare('INSERT OR REPLACE INTO users (jid, lid, name, limit_, money, premium, banned, lastseen, hit, spam, afk, afkReason, afkObj) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    for (const user of data.users) {
      await userStmt.run(
        user.jid,
        user.lid,
        user.name,
        user.limit,
        user.money || 0,
        user.premium || false,
        user.banned || false,
        user.lastseen,
        user.hit,
        user.spam,
        user.afk,
        user.afkReason,
        JSON.stringify(user.afkObj)
      )
    }
    await userStmt.finalize()
    console.log(`Migrated ${data.users.length} users.`)
  }

  // Migrate groups
  if (data.groups && data.groups.length > 0) {
    const groupStmt = await db.prepare('INSERT OR REPLACE INTO groups (jid, activity, mute, localonly, member) VALUES (?, ?, ?, ?, ?)')
    for (const group of data.groups) {
      await groupStmt.run(
        group.jid,
        group.activity,
        group.mute || false,
        group.localonly || false,
        JSON.stringify(group.member)
      )
    }
    await groupStmt.finalize()
    console.log(`Migrated ${data.groups.length} groups.`)
  }

  // Migrate chats
  if (data.chats && data.chats.length > 0) {
    const chatStmt = await db.prepare('INSERT OR REPLACE INTO chats (jid, chat, lastchat, lastseen) VALUES (?, ?, ?, ?)')
    for (const chat of data.chats) {
      await chatStmt.run(
        chat.jid,
        chat.chat,
        chat.lastchat,
        chat.lastseen
      )
    }
    await chatStmt.finalize()
    console.log(`Migrated ${data.chats.length} chats.`)
  }

  // Migrate settings
  if (data.setting) {
    const settings = data.setting
    await db.run(
      `INSERT OR REPLACE INTO settings (key, autobackup, online, multiprefix, noprefix, onlyprefix, prefix, owners, pluginDisable, error, paidc, toxic, antispam, debug, groupmode, self, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      'default',
      settings.autobackup || false,
      settings.online !== false,
      settings.multiprefix !== false,
      settings.noprefix || false,
      settings.onlyprefix || '.',
      settings.prefix || '.',
      JSON.stringify(settings.owners || []),
      JSON.stringify(settings.pluginDisable || []),
      JSON.stringify(settings.error || []),
      JSON.stringify(settings.paidc || {}),
      JSON.stringify(settings.toxic || []),
      settings.antispam !== false,
      settings.debug || false,
      settings.groupmode || false,
      settings.self || false,
      settings.link
    )
    console.log('Migrated settings.')
  }

  await db.close()

  // Rename old database file to prevent re-migration
  fs.renameSync(jsonPath, jsonPath + '.migrated')
  console.log('Migration complete. Renamed data.json to data.json.migrated.')
}
