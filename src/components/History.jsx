import { useState, useEffect } from 'react'
import './History.css'

function History({ purchases, onClose }) {
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [selectedPurchase, setSelectedPurchase] = useState(null)

  // Agrupar compras por mês
  const purchasesByMonth = purchases.reduce((acc, purchase) => {
    const date = new Date(purchase.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        purchases: [],
        total: 0
      }
    }
    
    acc[monthKey].purchases.push(purchase)
    acc[monthKey].total += purchase.total
    
    return acc
  }, {})

  const months = Object.entries(purchasesByMonth).sort((a, b) => b[0].localeCompare(a[0]))

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleMonthClick = (monthKey) => {
    setSelectedMonth(selectedMonth === monthKey ? null : monthKey)
    setSelectedPurchase(null)
  }

  const handlePurchaseClick = (purchase) => {
    setSelectedPurchase(selectedPurchase?.id === purchase.id ? null : purchase)
  }

  const totalAllTime = purchases.reduce((sum, p) => sum + p.total, 0)
  const totalThisMonth = months.length > 0 ? months[0][1].total : 0

  return (
    <div className="history-overlay">
      <div className="history-container">
        <div className="history-header">
          <h2>Histórico de Compras</h2>
          <button onClick={onClose} className="btn-close" aria-label="Fechar">
            ✕
          </button>
        </div>

        {purchases.length === 0 ? (
          <div className="history-empty">
            <p>Nenhuma compra registrada ainda</p>
            <p className="empty-hint">Finalize uma compra para começar o histórico!</p>
          </div>
        ) : (
          <>
            {/* Estatísticas gerais */}
            <div className="history-stats">
              <div className="stat-card">
                <span className="stat-label">Total Geral</span>
                <span className="stat-value">{formatPrice(totalAllTime)}</span>
              </div>
              <div className="stat-card stat-card-primary">
                <span className="stat-label">Este Mês</span>
                <span className="stat-value">{formatPrice(totalThisMonth)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total de Compras</span>
                <span className="stat-value">{purchases.length}</span>
              </div>
            </div>

            {/* Lista de meses */}
            <div className="months-list">
              {months.map(([monthKey, monthData]) => (
                <div key={monthKey} className="month-card">
                  <div 
                    className="month-header"
                    onClick={() => handleMonthClick(monthKey)}
                  >
                    <div className="month-info">
                      <span className="month-name">{monthData.monthName}</span>
                      <span className="month-count">{monthData.purchases.length} compra(s)</span>
                    </div>
                    <div className="month-total">
                      {formatPrice(monthData.total)}
                      <span className="month-arrow">
                        {selectedMonth === monthKey ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {selectedMonth === monthKey && (
                    <div className="purchases-list">
                      {monthData.purchases
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((purchase) => (
                          <div 
                            key={purchase.id} 
                            className={`purchase-item ${selectedPurchase?.id === purchase.id ? 'expanded' : ''}`}
                            onClick={() => handlePurchaseClick(purchase)}
                          >
                            <div className="purchase-header">
                              <div className="purchase-info">
                                <span className="purchase-date">{formatDate(purchase.date)}</span>
                                <span className="purchase-items-count">
                                  {purchase.items.length} item(ns)
                                </span>
                              </div>
                              <span className="purchase-total">{formatPrice(purchase.total)}</span>
                            </div>
                            
                            {selectedPurchase?.id === purchase.id && (
                              <div className="purchase-details">
                                <div className="purchase-items">
                                  {purchase.items.map((item, index) => (
                                    <div key={index} className="purchase-item-detail">
                                      <span className="item-name">{item.name}</span>
                                      <span className="item-price">{formatPrice(item.price)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default History

