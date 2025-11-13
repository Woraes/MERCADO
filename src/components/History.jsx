import { useState, useEffect } from 'react'
import './History.css'

// Função para gerar PDF
const generatePDF = (purchase) => {
  import('jspdf').then(({ default: jsPDF }) => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text('Comprovante de Compra', 105, 20, { align: 'center' })
    
    // Data
    doc.setFontSize(12)
    const date = new Date(purchase.date)
    const dateStr = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    doc.text(`Data: ${dateStr}`, 20, 35)
    
    // Itens
    doc.setFontSize(14)
    doc.text('Itens:', 20, 50)
    
    let y = 60
    doc.setFontSize(11)
    purchase.items.forEach((item, index) => {
      const itemName = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name
      const price = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(item.price)
      
      doc.text(`${index + 1}. ${itemName}`, 25, y)
      doc.text(price, 170, y, { align: 'right' })
      y += 8
      
      if (y > 270) {
        doc.addPage()
        y = 20
      }
    })
    
    // Total
    y += 10
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    const total = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(purchase.total)
    doc.text('Total:', 20, y)
    doc.text(total, 170, y, { align: 'right' })
    
    // Salvar
    doc.save(`compra-${date.toISOString().split('T')[0]}.pdf`)
  }).catch(error => {
    console.error('Erro ao gerar PDF:', error)
    alert('Erro ao gerar PDF. Tente usar a opção de imprimir.')
  })
}

// Função para imprimir
const printPurchase = (purchase) => {
  const printWindow = window.open('', '_blank')
  const date = new Date(purchase.date)
  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const total = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(purchase.total)
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comprovante de Compra</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        h1 {
          text-align: center;
          color: #22c55e;
        }
        .date {
          margin-bottom: 20px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #22c55e;
          color: white;
        }
        .total {
          text-align: right;
          font-size: 18px;
          font-weight: bold;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 2px solid #22c55e;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <h1>🛒 Comprovante de Compra</h1>
      <div class="date"><strong>Data:</strong> ${dateStr}</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${purchase.items.map((item, index) => {
            const price = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(item.price)
            return `<tr>
              <td>${item.name}</td>
              <td style="text-align: right;">${price}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
      <div class="total">Total: ${total}</div>
    </body>
    </html>
  `)
  
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

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
                                      <span className="item-number">{index + 1}.</span>
                                      <span className="item-name">{item.name}</span>
                                      <span className="item-price">{formatPrice(item.price)}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="purchase-actions">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      generatePDF(purchase)
                                    }}
                                    className="btn btn-pdf"
                                  >
                                    📄 Baixar PDF
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      printPurchase(purchase)
                                    }}
                                    className="btn btn-print"
                                  >
                                    🖨️ Imprimir
                                  </button>
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

