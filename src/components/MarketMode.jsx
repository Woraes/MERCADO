import { useState, useEffect } from 'react'
import { getListItems, updateListItem, markListItemComplete, finishPurchase } from '../services/database'
import SaveListModal from './SaveListModal'
import './MarketMode.css'

function MarketMode({ listId, userId, onComplete, onCancel }) {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [purchaseTotal, setPurchaseTotal] = useState(0)
  const [completedItemsCount, setCompletedItemsCount] = useState(0)

  useEffect(() => {
    loadItems()
  }, [listId])

  const loadItems = () => {
    const listItems = getListItems(listId)
    setItems(listItems)
  }

  const handleStartEdit = (item) => {
    setEditingId(item.id)
    setEditPrice(item.price.toString())
  }

  const handleSavePrice = (itemId) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      updateListItem(itemId, item.name, parseFloat(editPrice) || 0)
      loadItems()
      setEditingId(null)
      setEditPrice('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditPrice('')
  }

  const handleToggleComplete = (itemId, isCompleted) => {
    markListItemComplete(itemId, !isCompleted)
    loadItems()
  }

  const handleSelectAll = () => {
    items.forEach(item => {
      if (!item.is_completed) {
        markListItemComplete(item.id, true)
      }
    })
    loadItems()
  }

  const handleDeselectAll = () => {
    items.forEach(item => {
      if (item.is_completed) {
        markListItemComplete(item.id, false)
      }
    })
    loadItems()
  }

  const handleFinish = () => {
    const total = calculateTotal()
    const completedItems = items.filter(item => item.is_completed)
    finishPurchase(userId, listId)
    setPurchaseTotal(total)
    setCompletedItemsCount(completedItems.length)
    setShowSaveModal(true)
  }

  const handleSaveTemplate = () => {
    setShowSaveModal(false)
    onComplete()
  }

  const handleDiscardTemplate = () => {
    setShowSaveModal(false)
    onComplete()
  }

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      if (item.is_completed) {
        return total + (parseFloat(item.price) || 0)
      }
      return total
    }, 0)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const completedCount = items.filter(item => item.is_completed).length
  const totalItems = items.length

  return (
    <div className="market-mode-overlay">
      <div className="market-mode-container">
        <div className="market-header">
          <h2>🛒 No Mercado</h2>
          <button onClick={onCancel} className="btn-close" aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="market-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${totalItems > 0 ? (completedCount / totalItems) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="progress-info">
            <p className="progress-text">
              {completedCount} de {totalItems} itens
            </p>
            <div className="select-all-actions">
              {completedCount < totalItems && (
                <button
                  onClick={handleSelectAll}
                  className="btn-select-all"
                  title="Selecionar todos"
                >
                  ✓ Selecionar Todos
                </button>
              )}
              {completedCount > 0 && (
                <button
                  onClick={handleDeselectAll}
                  className="btn-deselect-all"
                  title="Desselecionar todos"
                >
                  ✗ Desmarcar Todos
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="market-items">
          {items.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum item na lista</p>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id} 
                className={`market-item ${item.is_completed ? 'completed' : ''}`}
              >
                {editingId === item.id ? (
                  <div className="edit-price-form">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Valor"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="input input-price"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => handleSavePrice(item.id)}
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
                    <div className="item-content">
                      <button
                        onClick={() => handleToggleComplete(item.id, item.is_completed)}
                        className={`check-button ${item.is_completed ? 'checked' : ''}`}
                      >
                        {item.is_completed ? '✓' : ''}
                      </button>
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        {item.price > 0 ? (
                          <span className="item-price">{formatPrice(item.price)}</span>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="btn-add-price"
                          >
                            Adicionar valor
                          </button>
                        )}
                      </div>
                    </div>
                    {item.price > 0 && (
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="btn-edit-price"
                        aria-label="Editar preço"
                      >
                        ✏️
                      </button>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="market-footer">
            <div className="market-total">
              <span className="total-label">Total:</span>
              <span className="total-value">{formatPrice(calculateTotal())}</span>
            </div>
            <button
              onClick={handleFinish}
              className="btn btn-finish"
              disabled={completedCount === 0}
            >
              ✅ Finalizar Compra
            </button>
          </div>
        )}
      </div>

      {showSaveModal && (
        <SaveListModal
          listId={listId}
          total={purchaseTotal}
          itemsCount={completedItemsCount}
          onSave={handleSaveTemplate}
          onDiscard={handleDiscardTemplate}
        />
      )}
    </div>
  )
}

export default MarketMode

