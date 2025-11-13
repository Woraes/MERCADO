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
  
  // Carregar banco existente do localStorage ou criar novo
  const savedDb = localStorage.getItem('grocery_db')
  
  if (savedDb) {
    try {
      const uint8Array = new Uint8Array(JSON.parse(savedDb))
      db = new SQL.Database(uint8Array)
      // Verificar e migrar se necessário
      ensureTables()
      migrateDatabase()
    } catch (error) {
      console.error('Erro ao carregar banco, criando novo:', error)
      db = new SQL.Database()
      createTables()
    }
  } else {
    db = new SQL.Database()
    createTables()
  }
  
  return db
}

// Migrar banco de dados (adicionar colunas que faltam)
function migrateDatabase() {
  try {
    // Verificar se a coluna is_template existe
    const tableInfo = db.exec("PRAGMA table_info(lists)")
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map(row => row[1]) // Nome da coluna está na posição 1
      const hasIsTemplate = columns.includes('is_template')
      
      if (!hasIsTemplate) {
        console.log('Migrando banco: adicionando coluna is_template')
        db.run('ALTER TABLE lists ADD COLUMN is_template INTEGER DEFAULT 0')
        saveDatabase()
        console.log('Migração concluída: coluna is_template adicionada')
      }
    }
  } catch (error) {
    console.error('Erro na migração:', error)
    // Se a migração falhar, tentar recriar o banco
    try {
      console.log('Tentando recriar banco com estrutura atualizada...')
      const allData = exportAllData()
      db = new SQL.Database()
      createTables()
      importAllData(allData)
      saveDatabase()
    } catch (recreateError) {
      console.error('Erro ao recriar banco:', recreateError)
    }
  }
}

// Exportar todos os dados antes de recriar
function exportAllData() {
  const data = {
    users: [],
    lists: [],
    listItems: [],
    purchases: [],
    purchaseItems: []
  }
  
  try {
    // Exportar usuários
    const usersResult = db.exec('SELECT * FROM users')
    if (usersResult.length > 0) {
      data.users = usersResult[0].values.map(row => ({
        id: row[0],
        name: row[1],
        created_at: row[2]
      }))
    }
    
    // Exportar listas
    const listsResult = db.exec('SELECT * FROM lists')
    if (listsResult.length > 0) {
      data.lists = listsResult[0].values.map(row => ({
        id: row[0],
        user_id: row[1],
        name: row[2],
        status: row[3],
        created_at: row[4],
        completed_at: row[5]
      }))
    }
    
    // Exportar itens de lista
    const itemsResult = db.exec('SELECT * FROM list_items')
    if (itemsResult.length > 0) {
      data.listItems = itemsResult[0].values.map(row => ({
        id: row[0],
        list_id: row[1],
        name: row[2],
        price: row[3],
        is_completed: row[4]
      }))
    }
    
    // Exportar compras
    const purchasesResult = db.exec('SELECT * FROM purchases')
    if (purchasesResult.length > 0) {
      data.purchases = purchasesResult[0].values.map(row => ({
        id: row[0],
        user_id: row[1],
        list_id: row[2],
        total: row[3],
        date: row[4]
      }))
    }
    
    // Exportar itens de compra
    const purchaseItemsResult = db.exec('SELECT * FROM purchase_items')
    if (purchaseItemsResult.length > 0) {
      data.purchaseItems = purchaseItemsResult[0].values.map(row => ({
        id: row[0],
        purchase_id: row[1],
        name: row[2],
        price: row[3]
      }))
    }
  } catch (error) {
    console.error('Erro ao exportar dados:', error)
  }
  
  return data
}

// Importar dados após recriar banco
function importAllData(data) {
  try {
    // Importar usuários
    data.users.forEach(user => {
      const stmt = db.prepare('INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)')
      stmt.run([user.id, user.name, user.created_at])
      stmt.free()
    })
    
    // Importar listas (com is_template = 0)
    data.lists.forEach(list => {
      const stmt = db.prepare('INSERT INTO lists (id, user_id, name, status, is_template, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      stmt.run([list.id, list.user_id, list.name, list.status, 0, list.created_at, list.completed_at])
      stmt.free()
    })
    
    // Importar itens de lista
    data.listItems.forEach(item => {
      const stmt = db.prepare('INSERT INTO list_items (id, list_id, name, price, is_completed) VALUES (?, ?, ?, ?, ?)')
      stmt.run([item.id, item.list_id, item.name, item.price, item.is_completed])
      stmt.free()
    })
    
    // Importar compras
    data.purchases.forEach(purchase => {
      const stmt = db.prepare('INSERT INTO purchases (id, user_id, list_id, total, date) VALUES (?, ?, ?, ?, ?)')
      stmt.run([purchase.id, purchase.user_id, purchase.list_id, purchase.total, purchase.date])
      stmt.free()
    })
    
    // Importar itens de compra
    data.purchaseItems.forEach(item => {
      const stmt = db.prepare('INSERT INTO purchase_items (id, purchase_id, name, price) VALUES (?, ?, ?, ?)')
      stmt.run([item.id, item.purchase_id, item.name, item.price])
      stmt.free()
    })
  } catch (error) {
    console.error('Erro ao importar dados:', error)
  }
}

// Garantir que as tabelas existam
function ensureTables() {
  try {
    // Tentar buscar usuários para verificar se a tabela existe
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if (result.length === 0) {
      // Tabelas não existem, criar
      createTables()
    }
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error)
    createTables()
  }
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
      is_template INTEGER DEFAULT 0,
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
    if (!db) {
      return { success: false, error: 'Banco de dados não inicializado' }
    }
    const stmt = db.prepare('INSERT INTO users (name) VALUES (?)')
    stmt.run([name])
    stmt.free()
    const result = db.exec('SELECT last_insert_rowid() as id')
    const userId = result[0].values[0][0]
    saveDatabase()
    console.log('Usuário criado com ID:', userId)
    return { success: true, id: userId }
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return { success: false, error: error.message }
  }
}

export function getUsers() {
  try {
    if (!db) {
      console.error('Banco de dados não inicializado em getUsers')
      return []
    }
    const result = db.exec('SELECT * FROM users ORDER BY name')
    if (result.length === 0) return []
    
    const users = result[0].values.map(row => ({
      id: row[0],
      name: row[1],
      created_at: row[2]
    }))
    console.log('Usuários encontrados:', users)
    return users
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return []
  }
}

export function deleteUser(userId) {
  try {
    if (!db) {
      return { success: false, error: 'Banco de dados não inicializado' }
    }
    
    // Deletar compras do usuário primeiro
    const purchases = getPurchasesByUser(userId)
    purchases.forEach(purchase => {
      // Deletar itens da compra
      const stmtItems = db.prepare('DELETE FROM purchase_items WHERE purchase_id = ?')
      stmtItems.run([purchase.id])
      stmtItems.free()
    })
    
    // Deletar compras
    const stmtPurchases = db.prepare('DELETE FROM purchases WHERE user_id = ?')
    stmtPurchases.run([userId])
    stmtPurchases.free()
    
    // Deletar listas do usuário (incluindo templates)
    const lists = getListsByUser(userId, null, true) // Incluir templates
    lists.forEach(list => {
      // Deletar itens da lista
      const stmtListItems = db.prepare('DELETE FROM list_items WHERE list_id = ?')
      stmtListItems.run([list.id])
      stmtListItems.free()
    })
    
    // Deletar listas
    const stmtLists = db.prepare('DELETE FROM lists WHERE user_id = ?')
    stmtLists.run([userId])
    stmtLists.free()
    
    // Deletar usuário
    const stmt = db.prepare('DELETE FROM users WHERE id = ?')
    stmt.run([userId])
    stmt.free()
    
    saveDatabase()
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return { success: false, error: error.message }
  }
}

export function getUserById(id) {
  try {
    if (!db) {
      console.error('Banco de dados não inicializado em getUserById')
      return null
    }
    
    const userId = typeof id === 'string' ? parseInt(id) : id
    console.log('getUserById - Procurando ID:', userId, 'Tipo:', typeof userId)
    
    // Usar prepare/bind corretamente
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
    stmt.bind([userId])
    
    // Tentar getAsObject primeiro
    const objResult = stmt.getAsObject()
    console.log('getUserById - Resultado getAsObject:', objResult)
    
    if (objResult && objResult.id !== undefined && objResult.id !== null) {
      const user = {
        id: objResult.id,
        name: objResult.name,
        created_at: objResult.created_at
      }
      stmt.free()
      console.log('getUserById - Usuário encontrado (getAsObject):', user)
      return user
    }
    
    // Se getAsObject não funcionou, tentar step/get
    stmt.reset()
    stmt.bind([userId])
    
    if (stmt.step()) {
      const row = stmt.get()
      const user = {
        id: row[0],
        name: row[1],
        created_at: row[2]
      }
      stmt.free()
      console.log('getUserById - Usuário encontrado (step/get):', user)
      return user
    }
    
    stmt.free()
    console.log('getUserById - Usuário não encontrado para ID:', userId)
    return null
  } catch (error) {
    console.error('Erro em getUserById:', error)
    return null
  }
}

// Listas
export function createList(userId, listName = 'Nova Lista', isTemplate = false) {
  try {
    // Verificar se a coluna is_template existe
    const tableInfo = db.exec("PRAGMA table_info(lists)")
    let hasIsTemplate = false
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map(row => row[1])
      hasIsTemplate = columns.includes('is_template')
    }
    
    let stmt
    if (hasIsTemplate) {
      stmt = db.prepare('INSERT INTO lists (user_id, name, status, is_template) VALUES (?, ?, ?, ?)')
      stmt.run([userId, listName, 'draft', isTemplate ? 1 : 0])
    } else {
      // Se não tem a coluna, criar sem ela
      stmt = db.prepare('INSERT INTO lists (user_id, name, status) VALUES (?, ?, ?)')
      stmt.run([userId, listName, 'draft'])
    }
    stmt.free()
    saveDatabase()
    const result = db.exec('SELECT last_insert_rowid()')
    return result[0].values[0][0]
  } catch (error) {
    console.error('Erro ao criar lista:', error)
    throw error
  }
}

// Criar lista a partir de template
export function createListFromTemplate(userId, templateId, newListName = null) {
  const template = getListById(templateId)
  if (!template) {
    return null
  }
  
  const listName = newListName || `${template.name} (Cópia)`
  const newListId = createList(userId, listName, false)
  
  // Copiar itens do template (sem valores)
  const templateItems = getListItems(templateId)
  templateItems.forEach(item => {
    addListItem(newListId, item.name, 0)
  })
  
  return newListId
}

// Salvar lista como template
export function saveListAsTemplate(listId, templateName = null) {
  try {
    // Verificar se a coluna existe
    const tableInfo = db.exec("PRAGMA table_info(lists)")
    let hasIsTemplate = false
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map(row => row[1])
      hasIsTemplate = columns.includes('is_template')
    }
    
    if (!hasIsTemplate) {
      // Tentar adicionar a coluna
      try {
        db.run('ALTER TABLE lists ADD COLUMN is_template INTEGER DEFAULT 0')
        saveDatabase()
        hasIsTemplate = true
      } catch (alterError) {
        return { success: false, error: 'Erro ao adicionar coluna is_template. Recarregue a página.' }
      }
    }
    
    const list = getListById(listId)
    if (!list) {
      return { success: false, error: 'Lista não encontrada' }
    }
    
    const name = templateName || list.name
    const stmt = db.prepare('UPDATE lists SET is_template = 1, name = ? WHERE id = ?')
    stmt.run([name, listId])
    stmt.free()
    saveDatabase()
    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar template:', error)
    return { success: false, error: error.message }
  }
}

// Obter templates do usuário
export function getTemplatesByUser(userId) {
  try {
    // Verificar se a coluna existe antes de usar
    const tableInfo = db.exec("PRAGMA table_info(lists)")
    let hasIsTemplate = false
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map(row => row[1])
      hasIsTemplate = columns.includes('is_template')
    }
    
    if (!hasIsTemplate) {
      // Se não tem a coluna, retornar vazio (ainda não migrado)
      return []
    }
    
    const stmt = db.prepare('SELECT * FROM lists WHERE user_id = ? AND is_template = 1 ORDER BY name')
    stmt.bind([userId])
    const result = []
    
    while (stmt.step()) {
      result.push(stmt.getAsObject())
    }
    stmt.free()
    
    return result
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return []
  }
}

export function getListsByUser(userId, status = null, includeTemplates = false) {
  try {
    // Verificar se a coluna existe antes de usar
    const tableInfo = db.exec("PRAGMA table_info(lists)")
    let hasIsTemplate = false
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map(row => row[1])
      hasIsTemplate = columns.includes('is_template')
    }
    
    let query = 'SELECT * FROM lists WHERE user_id = ?'
    const params = [userId]
    
    if (hasIsTemplate && !includeTemplates) {
      query += ' AND is_template = 0'
    }
    
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
  } catch (error) {
    console.error('Erro ao buscar listas:', error)
    return []
  }
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

