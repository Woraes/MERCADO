let db = null
let SQL = null

// Inicializar SQLite
export async function initDatabase() {
  if (!SQL) {
    const initSqlJs = (await import('sql.js')).default
    SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`
    })
  }
  
  // Carregar banco existente do IndexedDB ou criar novo
  const savedDb = localStorage.getItem('grocery_db')
  
  if (savedDb) {
    const uint8Array = new Uint8Array(JSON.parse(savedDb))
    db = new SQL.Database(uint8Array)
  } else {
    db = new SQL.Database()
    createTables()
  }
  
  return db
}

// Criar tabelas
function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      FOREIGN KEY (list_id) REFERENCES lists(id)
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      list_id INTEGER,
      total REAL NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (list_id) REFERENCES lists(id)
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id)
    )
  `)
  
  saveDatabase()
}

// Salvar banco no localStorage
function saveDatabase() {
  if (db) {
    const data = db.export()
    const buffer = Array.from(data)
    localStorage.setItem('grocery_db', JSON.stringify(buffer))
  }
}

// Usuários
export function createUser(name) {
  try {
    const stmt = db.prepare('INSERT INTO users (name) VALUES (?)')
    stmt.run([name])
    stmt.free()
    const result = db.exec('SELECT last_insert_rowid() as id')
    const userId = result[0].values[0][0]
    saveDatabase()
    return { success: true, id: userId }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export function getUsers() {
  const result = db.exec('SELECT * FROM users ORDER BY name')
  if (result.length === 0) return []
  
  return result[0].values.map(row => ({
    id: row[0],
    name: row[1],
    created_at: row[2]
  }))
}

export function getUserById(id) {
  try {
    const userId = typeof id === 'string' ? parseInt(id) : id
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
    stmt.bind([userId])
    const result = stmt.getAsObject()
    stmt.free()
    if (result.id) {
      return {
        id: result.id,
        name: result.name,
        created_at: result.created_at
      }
    }
    return null
  } catch (error) {
    console.error('Erro em getUserById:', error)
    return null
  }
}

// Listas
export function createList(userId, listName = 'Nova Lista') {
  const stmt = db.prepare('INSERT INTO lists (user_id, name, status) VALUES (?, ?, ?)')
  stmt.run([userId, listName, 'draft'])
  stmt.free()
  saveDatabase()
  const result = db.exec('SELECT last_insert_rowid()')
  return result[0].values[0][0]
}

export function getListsByUser(userId, status = null) {
  let query = 'SELECT * FROM lists WHERE user_id = ?'
  const params = [userId]
  
  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }
  
  query += ' ORDER BY created_at DESC'
  
  const stmt = db.prepare(query)
  stmt.bind(params)
  const result = []
  
  while (stmt.step()) {
    result.push(stmt.getAsObject())
  }
  stmt.free()
  
  return result
}

export function getListById(listId) {
  const stmt = db.prepare('SELECT * FROM lists WHERE id = ?')
  stmt.bind([listId])
  const result = stmt.getAsObject()
  stmt.free()
  return result.id ? result : null
}

export function updateListStatus(listId, status) {
  const stmt = db.prepare('UPDATE lists SET status = ?, completed_at = ? WHERE id = ?')
  const completedAt = status === 'completed' ? new Date().toISOString() : null
  stmt.run([status, completedAt, listId])
  stmt.free()
  saveDatabase()
}

export function deleteList(listId) {
  // Deletar itens primeiro
  const stmtItems = db.prepare('DELETE FROM list_items WHERE list_id = ?')
  stmtItems.run([listId])
  stmtItems.free()
  
  // Deletar lista
  const stmt = db.prepare('DELETE FROM lists WHERE id = ?')
  stmt.run([listId])
  stmt.free()
  saveDatabase()
}

// Itens da lista
export function addListItem(listId, itemName, price = 0) {
  const stmt = db.prepare('INSERT INTO list_items (list_id, name, price) VALUES (?, ?, ?)')
  stmt.run([listId, itemName, price])
  stmt.free()
  saveDatabase()
  const result = db.exec('SELECT last_insert_rowid()')
  return result[0].values[0][0]
}

export function getListItems(listId) {
  const stmt = db.prepare('SELECT * FROM list_items WHERE list_id = ? ORDER BY id')
  stmt.bind([listId])
  const result = []
  
  while (stmt.step()) {
    result.push(stmt.getAsObject())
  }
  stmt.free()
  
  return result
}

export function updateListItem(itemId, name, price) {
  const stmt = db.prepare('UPDATE list_items SET name = ?, price = ? WHERE id = ?')
  stmt.run([name, price, itemId])
  stmt.free()
  saveDatabase()
}

export function deleteListItem(itemId) {
  const stmt = db.prepare('DELETE FROM list_items WHERE id = ?')
  stmt.run([itemId])
  stmt.free()
  saveDatabase()
}

export function markListItemComplete(itemId, isCompleted) {
  const stmt = db.prepare('UPDATE list_items SET is_completed = ? WHERE id = ?')
  stmt.run([isCompleted ? 1 : 0, itemId])
  stmt.free()
  saveDatabase()
}

// Finalizar compra
export function finishPurchase(userId, listId) {
  // Buscar itens da lista
  const items = getListItems(listId)
  const total = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
  
  // Criar compra
  const stmtPurchase = db.prepare('INSERT INTO purchases (user_id, list_id, total) VALUES (?, ?, ?)')
  stmtPurchase.run([userId, listId, total])
  stmtPurchase.free()
  const purchaseId = db.exec('SELECT last_insert_rowid()')[0].values[0][0]
  
  // Adicionar itens da compra
  const stmtItem = db.prepare('INSERT INTO purchase_items (purchase_id, name, price) VALUES (?, ?, ?)')
  items.forEach(item => {
    stmtItem.run([purchaseId, item.name, item.price])
  })
  stmtItem.free()
  
  // Atualizar status da lista
  updateListStatus(listId, 'completed')
  
  saveDatabase()
  return purchaseId
}

// Histórico de compras
export function getPurchasesByUser(userId) {
  const stmt = db.prepare(`
    SELECT p.*, l.name as list_name 
    FROM purchases p 
    LEFT JOIN lists l ON p.list_id = l.id 
    WHERE p.user_id = ? 
    ORDER BY p.date DESC
  `)
  stmt.bind([userId])
  const result = []
  
  while (stmt.step()) {
    result.push(stmt.getAsObject())
  }
  stmt.free()
  
  return result
}

export function getPurchaseItems(purchaseId) {
  const stmt = db.prepare('SELECT * FROM purchase_items WHERE purchase_id = ?')
  stmt.bind([purchaseId])
  const result = []
  
  while (stmt.step()) {
    result.push(stmt.getAsObject())
  }
  stmt.free()
  
  return result
}

// Exportar banco para backup
export function exportDatabase() {
  if (db) {
    const data = db.export()
    const buffer = Array.from(data)
    return JSON.stringify(buffer)
  }
  return null
}

// Importar banco de backup
export function importDatabase(jsonData) {
  try {
    const buffer = JSON.parse(jsonData)
    const uint8Array = new Uint8Array(buffer)
    db = new SQL.Database(uint8Array)
    saveDatabase()
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

