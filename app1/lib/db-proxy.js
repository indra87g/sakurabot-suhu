
export function createDbProxy(target, tableName, primaryKey) {
  return new Proxy(target, {
    set: (obj, prop, value) => {
      // Set the property on the object
      obj[prop] = value

      // Also save to database
      const keyColumn = Object.keys(primaryKey)[0]
      const keyValue = primaryKey[keyColumn]

      global.db.run(`UPDATE ${tableName} SET ${prop} = ? WHERE ${keyColumn} = ?`, value, keyValue)
        .catch(err => console.error(`Failed to update database for ${tableName}:`, err))

      return true // Indicate success
    }
  })
}
