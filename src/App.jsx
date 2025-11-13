import { useState, useEffect } from 'react'
import { initDatabase, getUsers, getUserById, getListsByUser, createList, deleteList, addListItem, getListItems, updateListItem, deleteListItem, getPurchasesByUser, getPurchaseItems, createListFromTemplate } from './services/database'
import UserSelector from './components/UserSelector'
import MarketMode from './components/MarketMode'
import History from './components/History'
import TemplatesList from './components/TemplatesList'
import ConfirmCard from './components/ConfirmCard'
import './App.css'

function App() {
  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [showUserSelector, setShowUserSelector] = useState(true)
  const [lists, setLists] = useState([])
  const [currentListId, setCurrentListId] = useState(null)
  const [listItems, setListItems] = useState([])
  const [productName, setProductName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showMarketMode, setShowMarketMode] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [purchases, setPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Inicializar banco de dados
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase()
        // Aguardar um pouco para garantir que o banco está pronto
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const savedUserId = localStorage.getItem('currentUserId')
        if (savedUserId) {
          const userId = parseInt(savedUserId)
          const user = getUserById(userId)
          if (user && user.id) {
            setCurrentUserId(userId)
            setCurrentUser(user)
            setShowUserSelector(false)
            loadLists(userId)
          } else {
            // Usuário salvo não existe mais, limpar
            localStorage.removeItem('currentUserId')
          }
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Erro ao inicializar banco:', error)
        setIsLoading(false)
      }
    }
    initialize()
  }, [])

  const loadLists = (userId) => {
    const userLists = getListsByUser(userId, 'draft')
    setLists(userLists)
    
    // Carregar primeira lista se existir
    if (userLists.length > 0 && !currentListId) {
      setCurrentListId(userLists[0].id)
      loadListItems(userLists[0].id)
    } else if (currentListId) {
      loadListItems(currentListId)
    }
  }

  const loadListItems = (listId) => {
    const items = getListItems(listId)
    setListItems(items)
  }

  const handleSelectUser = async (userId) => {
    try {
      await initDatabase()
      const user = getUserById(userId)
      if (user && user.id) {
        setCurrentUserId(userId)
        setCurrentUser(user)
        setShowUserSelector(false)
        localStorage.setItem('currentUserId', userId.toString())
        loadLists(userId)
      } else {
        console.error('Usuário não encontrado. ID:', userId)
      }
    } catch (error) {
      console.error('Erro ao selecionar usuário:', error)
    }
  }

  const handleChangeUser = () => {
    setShowUserSelector(true)
    setCurrentListId(null)
    setListItems([])
  }

  const handleCreateList = () => {
    if (currentUserId) {
      const listId = createList(currentUserId)
      loadLists(currentUserId)
      setCurrentListId(listId)
      setListItems([])
    }
  }

  const handleSelectTemplate = (templateListId) => {
    if (currentUserId) {
      loadLists(currentUserId)
      setCurrentListId(templateListId)
      loadListItems(templateListId)
    }
  }

  const handleSelectList = (listId) => {
    setCurrentListId(listId)
    loadListItems(listId)
  }

  const handleDeleteList = (listId) => {
    deleteList(listId)
    loadLists(currentUserId)
    if (currentListId === listId) {
      const remainingLists = getListsByUser(currentUserId, 'draft')
      if (remainingLists.length > 0) {
        setCurrentListId(remainingLists[0].id)
        loadListItems(remainingLists[0].id)
      } else {
        setCurrentListId(null)
        setListItems([])
      }
    }
  }

  const handleAddItem = (e) => {
    e.preventDefault()
    if (productName.trim() && currentListId) {
      addListItem(currentListId, productName.trim(), 0)
      loadListItems(currentListId)
      setProductName('')
    } else if (productName.trim() && !currentListId) {
      // Criar lista automaticamente se não existir
      const listId = createList(currentUserId)
      setCurrentListId(listId)
      addListItem(listId, productName.trim(), 0)
      loadLists(currentUserId)
      loadListItems(listId)
      setProductName('')
    }
  }

  const handleDeleteItem = (itemId) => {
    deleteListItem(itemId)
    loadListItems(currentListId)
  }

  const handleStartEdit = (item) => {
    setEditingId(item.id)
    setEditName(item.name)
  }

  const handleSaveEdit = (itemId) => {
    const item = listItems.find(i => i.id === itemId)
    if (item) {
      updateListItem(itemId, editName.trim(), item.price)
      loadListItems(currentListId)
      setEditingId(null)
      setEditName('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleClearList = () => {
    if (listItems.length > 0) {
      setShowConfirm(true)
    }
  }

  const confirmClearList = () => {
    if (currentListId) {
      listItems.forEach(item => deleteListItem(item.id))
      loadListItems(currentListId)
    }
    setShowConfirm(false)
  }

  const handleOpenMarketMode = () => {
    if (currentListId && listItems.length > 0) {
      setShowMarketMode(true)
    }
  }

  const handleMarketComplete = () => {
    setShowMarketMode(false)
    loadLists(currentUserId)
    setCurrentListId(null)
    setListItems([])
    loadPurchases()
  }

  const loadPurchases = () => {
    if (currentUserId) {
      const userPurchases = getPurchasesByUser(currentUserId)
      // Formatar para o componente History
      const formattedPurchases = userPurchases.map(purchase => {
        const items = getPurchaseItems(purchase.id)
        return {
          id: purchase.id,
          date: purchase.date,
          items: items.map(item => ({ name: item.name, price: item.price })),
          total: purchase.total
        }
      })
      setPurchases(formattedPurchases)
    }
  }

  useEffect(() => {
    if (currentUserId) {
      loadPurchases()
    }
  }, [currentUserId])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  if (showUserSelector) {
    return (
      <div className="app">
        <UserSelector 
          onSelectUser={handleSelectUser}
          currentUserId={currentUserId}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>🛒 Lista de Compras</h1>
            <p className="subtitle">
              {currentUser?.name} • Organize suas compras de forma inteligente
            </p>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleChangeUser}
              className="btn btn-user"
              aria-label="Trocar usuário"
            >
              👤 {currentUser?.name}
            </button>
            <button 
              onClick={() => setShowHistory(true)}
              className="btn btn-history"
              aria-label="Ver histórico"
            >
              📊 Histórico
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {/* Listas salvas */}
          <div className="card lists-card">
            <div className="card-header">
              <h2>Minhas Listas</h2>
              <div className="card-header-actions">
                <button 
                  onClick={() => setShowTemplates(true)}
                  className="btn btn-templates btn-small"
                >
                  📋 Listas Salvas
                </button>
                <button 
                  onClick={handleCreateList}
                  className="btn btn-primary btn-small"
                >
                  + Nova Lista
                </button>
              </div>
            </div>
            
            {lists.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma lista criada</p>
                <p className="empty-hint">Crie uma nova lista para começar!</p>
              </div>
            ) : (
              <div className="lists-grid">
                {lists.map(list => (
                  <div 
                    key={list.id} 
                    className={`list-card ${currentListId === list.id ? 'active' : ''}`}
                    onClick={() => handleSelectList(list.id)}
                  >
                    <div className="list-card-content">
                      <span className="list-name">{list.name}</span>
                      <span className="list-count">
                        {getListItems(list.id).length} item(ns)
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteList(list.id)
                      }}
                      className="btn-delete-list"
                      aria-label="Deletar lista"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adicionar produto */}
          {currentListId && (
            <div className="card add-product-card">
              <h2>Adicionar Produto</h2>
              <form onSubmit={handleAddItem} className="add-product-form">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Nome do produto (sem valor ainda)"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Adicionar
                </button>
              </form>
              <p className="hint-text">
                💡 Adicione produtos sem valores. No mercado, você preencherá os preços!
              </p>
            </div>
          )}

          {/* Lista de produtos */}
          {currentListId && (
            <div className="card products-card">
              <div className="card-header">
                <h2>Produtos ({listItems.length})</h2>
              </div>

              {listItems.length === 0 ? (
                <div className="empty-state">
                  <p>Sua lista está vazia</p>
                  <p className="empty-hint">Adicione produtos para começar!</p>
                </div>
              ) : (
                <>
                  <div className="products-list">
                    {listItems.map((item) => (
                      <div key={item.id} className="product-item">
                        {editingId === item.id ? (
                          <div className="edit-form">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="input input-edit"
                            />
                            <div className="edit-actions">
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="btn btn-save"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="btn btn-cancel"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="product-info">
                              <span className="product-name">{item.name}</span>
                            </div>
                            <div className="product-actions">
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="btn-icon btn-edit"
                                aria-label="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="btn-icon btn-delete"
                                aria-label="Remover"
                              >
                                🗑️
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="market-action">
                    <button 
                      onClick={handleOpenMarketMode}
                      className="btn btn-market"
                    >
                      🛒 Ir para o Mercado
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {!currentListId && (
            <div className="card empty-list-card">
              <p>Selecione uma lista ou crie uma nova para começar!</p>
            </div>
          )}
        </div>
      </main>

      {showConfirm && (
        <ConfirmCard
          message="Tem certeza que deseja limpar toda a lista?"
          onConfirm={confirmClearList}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showHistory && (
        <History 
          purchases={purchases}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showMarketMode && currentListId && (
        <MarketMode
          listId={currentListId}
          userId={currentUserId}
          onComplete={handleMarketComplete}
          onCancel={() => setShowMarketMode(false)}
        />
      )}

      {showTemplates && (
        <TemplatesList
          userId={currentUserId}
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  )
}

export default App

