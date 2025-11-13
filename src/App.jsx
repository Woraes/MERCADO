import { useState, useEffect } from 'react'
import ConfirmCard from './components/ConfirmCard'
import History from './components/History'
import './App.css'

function App() {
  const [items, setItems] = useState([])
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [purchases, setPurchases] = useState([])

  // Carregar lista e histórico do localStorage ao iniciar
  useEffect(() => {
    const savedItems = localStorage.getItem('groceryList')
    if (savedItems) {
      setItems(JSON.parse(savedItems))
    }
    
    const savedPurchases = localStorage.getItem('groceryHistory')
    if (savedPurchases) {
      setPurchases(JSON.parse(savedPurchases))
    }
  }, [])

  // Salvar lista no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem('groceryList', JSON.stringify(items))
  }, [items])

  // Salvar histórico no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem('groceryHistory', JSON.stringify(purchases))
  }, [purchases])

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (parseFloat(item.price) || 0), 0)
  }

  const handleAddItem = (e) => {
    e.preventDefault()
    if (productName.trim() && productPrice.trim()) {
      const newItem = {
        id: Date.now(),
        name: productName.trim(),
        price: parseFloat(productPrice) || 0
      }
      setItems([...items, newItem])
      setProductName('')
      setProductPrice('')
    }
  }

  const handleDeleteItem = (id) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleStartEdit = (item) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditPrice(item.price.toString())
  }

  const handleSaveEdit = (id) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, name: editName.trim(), price: parseFloat(editPrice) || 0 }
        : item
    ))
    setEditingId(null)
    setEditName('')
    setEditPrice('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditPrice('')
  }

  const handleClearList = () => {
    if (items.length > 0) {
      setShowConfirm(true)
    }
  }

  const confirmClearList = () => {
    setItems([])
    setShowConfirm(false)
  }

  const cancelClearList = () => {
    setShowConfirm(false)
  }

  const handleFinishPurchase = () => {
    if (items.length > 0) {
      const total = calculateTotal()
      const newPurchase = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: [...items],
        total: total
      }
      setPurchases([newPurchase, ...purchases])
      setItems([])
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>🛒 Lista de Compras</h1>
            <p className="subtitle">Organize suas compras de forma inteligente</p>
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="btn btn-history"
            aria-label="Ver histórico"
          >
            📊 Histórico
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {/* Formulário de adicionar produto */}
          <div className="card add-product-card">
            <h2>Adicionar Produto</h2>
            <form onSubmit={handleAddItem} className="add-product-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Nome do produto"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Valor (R$)"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Adicionar
              </button>
            </form>
          </div>

          {/* Lista de produtos */}
          <div className="card products-card">
            <div className="card-header">
              <h2>Produtos ({items.length})</h2>
              {items.length > 0 && (
                <button 
                  onClick={handleClearList}
                  className="btn btn-clear"
                >
                  Limpar Lista
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="empty-state">
                <p>Sua lista está vazia</p>
                <p className="empty-hint">Adicione produtos para começar!</p>
              </div>
            ) : (
              <div className="products-list">
                {items.map((item) => (
                  <div key={item.id} className="product-item">
                    {editingId === item.id ? (
                      <div className="edit-form">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input input-edit"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
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
                          <span className="product-price">{formatPrice(item.price)}</span>
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
            )}

            {/* Total e Finalizar */}
            {items.length > 0 && (
              <div className="total-section">
                <div className="total-card">
                  <span className="total-label">Total:</span>
                  <span className="total-value">{formatPrice(calculateTotal())}</span>
                </div>
                <button 
                  onClick={handleFinishPurchase}
                  className="btn btn-finish"
                >
                  ✅ Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {showConfirm && (
        <ConfirmCard
          message="Tem certeza que deseja limpar toda a lista?"
          onConfirm={confirmClearList}
          onCancel={cancelClearList}
        />
      )}

      {showHistory && (
        <History 
          purchases={purchases}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

export default App

