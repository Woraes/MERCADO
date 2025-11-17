import { useState, useEffect } from 'react'
import { getListItems, updateListItem, markListItemComplete, finishPurchase, addListItem } from '../services/database'
import SaveListModal from './SaveListModal'
import './MarketMode.css'

function MarketMode({ listId, userId, listName, onComplete, onCancel }) {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', price: '', quantity: 1 })
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [newItemPrice, setNewItemPrice] = useState('')
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
    setEditForm({
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price ? item.price.toString() : ''
    })
  }

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveEdit = (itemId) => {
    const current = items.find(i => i.id === itemId)
    if (!current) return

    const formattedPrice = parseFloat(
      editForm.price?.toString().replace(',', '.') || '0'
    )
    const formattedQuantity = Number(editForm.quantity)

    const safePrice = Number.isNaN(formattedPrice) ? 0 : formattedPrice
    const safeQuantity = Number.isNaN(formattedQuantity) || formattedQuantity <= 0
      ? 1
      : Math.floor(formattedQuantity)

    updateListItem(
      itemId,
      editForm.name.trim() || current.name,
      safePrice,
      safeQuantity
    )
    loadItems()
    setEditingId(null)
    setEditForm({ name: '', price: '', quantity: 1 })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ name: '', price: '', quantity: 1 })
  }

  const handleToggleComplete = (itemId, isCompleted) => {
    markListItemComplete(itemId, !isCompleted)
    loadItems()
  }

  const handleSelectAll = () => {
    for (const item of items) {
      if (!item.is_completed) {
        markListItemComplete(item.id, true)
      }
    }
    loadItems()
  }

  const handleDeselectAll = () => {
    for (const item of items) {
      if (item.is_completed) {
        markListItemComplete(item.id, false)
      }
    }
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

  const handleAddNewItem = (e) => {
    e.preventDefault()
    const name = newItemName.trim()
    if (!name) return

    const quantityValue = Number(newItemQuantity)
    const safeQuantity = Number.isNaN(quantityValue) || quantityValue <= 0 ? 1 : Math.floor(quantityValue)
    const priceValue = parseFloat(newItemPrice.toString().replace(',', '.')) || 0

    addListItem(listId, name, priceValue, safeQuantity)
    setNewItemName('')
    setNewItemQuantity(1)
    setNewItemPrice('')
    loadItems()
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
        const price = parseFloat(item.price) || 0
        const quantity = parseInt(item.quantity) || 1
        return total + (price * quantity)
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
          <div>
            <h2>🛒 Mercado • {listName}</h2>
            <p>Edite valores, quantidades ou nomes a qualquer momento.</p>
          </div>
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
                  <div className="edit-form market-edit-form">
                    <input
                      type="text"
                      placeholder="Nome do produto"
                      value={editForm.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      className="input"
                      autoFocus
                    />
                    <div className="market-edit-grid">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        value={editForm.quantity}
                        onChange={(e) => handleEditChange('quantity', e.target.value)}
                        className="input"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Valor"
                        value={editForm.price}
                        onChange={(e) => handleEditChange('price', e.target.value)}
                        className="input"
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
                    <div className="item-content">
                      <button
                        onClick={() => handleToggleComplete(item.id, item.is_completed)}
                        className={`check-button ${item.is_completed ? 'checked' : ''}`}
                      >
                        {item.is_completed ? '✓' : ''}
                      </button>
                      <div className="item-info">
                        <span className="item-name">
                          {item.name}
                          {item.quantity > 1 && (
                            <span className="item-quantity-badge">x{item.quantity}</span>
                          )}
                        </span>
                        <div className="item-details">
                          <span className="item-price">
                            {item.price > 0 ? (
                              <>
                                {formatPrice(item.price)}
                                {item.quantity > 1 && (
                                  <span className="line-total">
                                    {' '}
                                    • Total item {formatPrice(item.price * (item.quantity || 1))}
                                  </span>
                                )}
                              </>
                            ) : (
                              'Sem valor'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="item-actions">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="btn-edit-item"
                        aria-label="Editar item"
                        title="Editar item"
                      >
                        ✏️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="market-new-item">
          <h3>Adicionar item aqui mesmo</h3>
          <form onSubmit={handleAddNewItem} className="new-item-form">
            <input
              type="text"
              placeholder="Descrição do produto"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="input"
              required
            />
            <div className="new-item-grid">
              <input
                type="number"
                min="1"
                placeholder="Qtd"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                className="input"
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Preço"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="input"
              />
            </div>
            <button type="submit" className="btn btn-add-inline">
              + Adicionar
            </button>
          </form>
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
          listName={listName}
          items={items}
          onSave={handleSaveTemplate}
          onDiscard={handleDiscardTemplate}
        />
      )}
    </div>
  )
}

export default MarketMode

