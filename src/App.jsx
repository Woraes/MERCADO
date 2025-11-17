import { useState, useEffect } from 'react'
import { initDatabase, getUsers, getUserById, getListsByUser, createList, deleteList, addListItem, getListItems, updateListItem, deleteListItem, getPurchasesByUser, getPurchaseItems, createListFromTemplate } from './services/database'
import UserSelector from './components/UserSelector'
import MarketMode from './components/MarketMode'
import History from './components/History'
import TemplatesList from './components/TemplatesList'
import ConfirmCard from './components/ConfirmCard'
import TutorialOverlay from './components/TutorialOverlay'
import './App.css'

function App() {
  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [showUserSelector, setShowUserSelector] = useState(true)
  const [lists, setLists] = useState([])
  const [currentListId, setCurrentListId] = useState(null)
  const [listItems, setListItems] = useState([])
  const [productName, setProductName] = useState('')
  const [productQuantity, setProductQuantity] = useState(1)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editQuantity, setEditQuantity] = useState(1)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showMarketMode, setShowMarketMode] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [purchases, setPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)

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

  useEffect(() => {
    if (!showUserSelector) {
      const hasSeen = localStorage.getItem('willcompras_tutorial_seen')
      if (!hasSeen) {
        setShowTutorial(true)
      }
    }
  }, [showUserSelector])

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

  const handleSelectTemplate = (newListId) => {
    if (currentUserId && newListId) {
      console.log('Criando lista a partir do template, novo ID:', newListId)
      // Recarregar listas para incluir a nova
      loadLists(currentUserId)
      // Aguardar um pouco para garantir que a lista foi criada
      setTimeout(() => {
        setCurrentListId(newListId)
        loadListItems(newListId)
      }, 100)
    } else {
      console.error('Erro: currentUserId ou newListId não definido', { currentUserId, newListId })
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
    const name = productName.trim()
    if (!name || !currentUserId) return
    
    const quantityValue = Number(productQuantity)
    const safeQuantity = Number.isNaN(quantityValue) || quantityValue <= 0 ? 1 : Math.floor(quantityValue)
    
    if (currentListId) {
      addListItem(currentListId, name, 0, safeQuantity)
      loadListItems(currentListId)
    } else {
      const listId = createList(currentUserId)
      setCurrentListId(listId)
      addListItem(listId, name, 0, safeQuantity)
      loadLists(currentUserId)
      loadListItems(listId)
    }
    
    setProductName('')
    setProductQuantity(1)
  }

  const handleDeleteItem = (itemId) => {
    deleteListItem(itemId)
    loadListItems(currentListId)
  }

  const handleStartEdit = (item) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditQuantity(item.quantity || 1)
  }

  const handleSaveEdit = (itemId) => {
    const item = listItems.find(i => i.id === itemId)
    if (item) {
      const quantityValue = Number(editQuantity)
      const safeQuantity = Number.isNaN(quantityValue) || quantityValue <= 0 ? 1 : Math.floor(quantityValue)
      updateListItem(itemId, editName.trim(), item.price, safeQuantity)
      loadListItems(currentListId)
      setEditingId(null)
      setEditName('')
      setEditQuantity(1)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditQuantity(1)
  }

  const handleClearList = () => {
    if (listItems.length > 0) {
      setShowConfirm(true)
    }
  }

  const confirmClearList = () => {
    if (currentListId) {
      for (const item of listItems) {
        deleteListItem(item.id)
      }
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

  const handleCloseTutorial = () => {
    localStorage.setItem('willcompras_tutorial_seen', 'true')
    setShowTutorial(false)
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

  const activeList = lists.find((list) => list.id === currentListId)
  const friendlyName = currentUser?.name?.split(' ')[0] || 'comprador(a)'

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
          <div className="hero-copy">
            <span className="badge">WillCompras</span>
            <h1>Olá, {friendlyName}! Pronto para a feira de hoje?</h1>
            <p>Monte sua lista, vá ao mercado e finalize tudo no mesmo fluxo, pensado para quem cuida da casa.</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleChangeUser}
              className="btn btn-secondary"
              aria-label="Trocar usuário"
            >
              👤 Trocar usuário
            </button>
            <button 
              onClick={() => setShowHistory(true)}
              className="btn btn-secondary"
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
              <h2>Minhas listas rápidas</h2>
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
                  + Lista rápida
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
              <h2>Adicionar item</h2>
              <form onSubmit={handleAddItem} className="add-product-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Produto</label>
                    <input
                      type="text"
                      placeholder="Ex.: Café, Arroz, Tomate..."
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">
                  Adicionar à lista
                </button>
              </form>
              <p className="hint-text">
                💡 Adicione todos os itens em casa. No mercado você registra valores, quantidades e imprime o comprovante.
              </p>
            </div>
          )}

          {/* Lista de produtos */}
          {currentListId && (
            <div className="card products-card">
              <div className="card-header">
                <h2>{activeList?.name} ({listItems.length})</h2>
                {listItems.length > 0 && (
                  <button onClick={handleClearList} className="btn btn-clear btn-small">
                    Limpar lista
                  </button>
                )}
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
                            <div className="form-group">
                              <label className="form-label">Produto</label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="input input-edit"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Quantidade</label>
                              <input
                                type="number"
                                min="1"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                className="input input-edit"
                              />
                            </div>
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
                              <div className="product-meta">
                                <span>Qtd: {item.quantity || 1}x</span>
                                <span className="product-price">
                                  Previsto: {formatPrice(item.price || 0)}
                                </span>
                              </div>
                            </div>
                            <div className="product-actions">
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="btn-icon edit"
                                aria-label="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="btn-icon delete"
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
              <p>Crie sua primeira lista WillCompras para começar a organizar o mercado 😄</p>
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
          listName={activeList?.name || 'Lista WillCompras'}
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

      {showTutorial && (
        <TutorialOverlay onClose={handleCloseTutorial} />
      )}
    </div>
  )
}

export default App

