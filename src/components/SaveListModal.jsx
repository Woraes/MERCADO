import { useState, useMemo } from 'react'
import { saveListAsTemplate } from '../services/database'
import './SaveListModal.css'

function SaveListModal({ listId, total, itemsCount, items = [], listName = 'WillCompras', onSave, onDiscard }) {
  const [templateName, setTemplateName] = useState(() => `${listName} - template`)
  const [isSaving, setIsSaving] = useState(false)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const purchasedItems = useMemo(() => {
    const completed = items.filter((item) => item.is_completed)
    return completed.length > 0 ? completed : items
  }, [items])

  const handleSave = async () => {
    if (templateName.trim()) {
      setIsSaving(true)
      try {
        const result = saveListAsTemplate(listId, templateName.trim())
        if (result.success) {
          onSave()
        } else {
          alert('Erro ao salvar lista: ' + result.error)
          setIsSaving(false)
        }
      } catch (error) {
        console.error('Erro ao salvar template:', error)
        alert('Erro ao salvar template: ' + error.message)
        setIsSaving(false)
      }
    } else {
      alert('Por favor, digite um nome para a lista')
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text(`WillCompras - ${listName}`, 105, 20, { align: 'center' })
      doc.setFontSize(12)
      const date = new Date()
      doc.text(`Data: ${date.toLocaleString('pt-BR')}`, 20, 32)

      doc.setFontSize(11)
      let y = 42
      purchasedItems.forEach((item, index) => {
        doc.text(
          `${index + 1}. ${item.name} (${item.quantity || 1}x)`,
          20,
          y
        )
        doc.text(
          formatPrice((item.price || 0) * (item.quantity || 1)),
          190,
          y,
          { align: 'right' }
        )
        y += 8
        if (y > 270) {
          doc.addPage()
          y = 20
        }
      })

      doc.setFontSize(14)
      doc.text('Total', 20, y + 6)
      doc.text(formatPrice(total), 190, y + 6, { align: 'right' })
      doc.save(`willcompras-${date.toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Não foi possível gerar o PDF agora. Tente imprimir.')
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const date = new Date()
    const listHtml = purchasedItems
      .map(
        (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity || 1}x</td>
          <td>${formatPrice(item.price || 0)}</td>
          <td>${formatPrice((item.price || 0) * (item.quantity || 1))}</td>
        </tr>
      `
      )
      .join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WillCompras - ${listName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { color: #ff7a1f; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { padding: 8px; border-bottom: 1px solid #f0e0d1; text-align: left; }
          th { background: #fff3e1; }
          .total { text-align: right; font-size: 18px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <h1>WillCompras • ${listName}</h1>
        <p>${date.toLocaleString('pt-BR')}</p>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qtd</th>
              <th>Unitário</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${listHtml}
          </tbody>
        </table>
        <div class="total"><strong>Total:</strong> ${formatPrice(total)}</div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="save-list-overlay">
      <div className="save-list-modal">
        <h2>✅ Compra finalizada com sucesso!</h2>
        
        <div className="purchase-summary">
          <div className="summary-item">
            <span className="summary-label">Total da compra:</span>
            <span className="summary-value">{formatPrice(total)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Itens comprados:</span>
            <span className="summary-value">{itemsCount}</span>
          </div>
        </div>

        <div className="purchased-list">
          <h3>Itens marcados</h3>
          <div className="purchased-scroll">
            {purchasedItems.length === 0 ? (
              <p>Nenhum item marcado como comprado.</p>
            ) : (
              purchasedItems.map((item) => (
                <div key={item.id} className="purchased-item">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.quantity || 1}x</span>
                  </div>
                  <span>{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="export-actions">
          <button onClick={handleDownloadPdf} className="btn btn-outline">
            📄 Baixar PDF
          </button>
          <button onClick={handlePrint} className="btn btn-outline">
            🖨️ Imprimir
          </button>
        </div>

        <div className="save-list-question">
          <p>Deseja salvar esta lista como modelo para reutilizar nas próximas compras?</p>
        </div>

        <div className="save-list-form">
          <input
            type="text"
            placeholder="Nome do modelo (ex: Feira da Semana)"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="input"
            autoFocus
          />
        </div>

        <div className="save-list-actions">
          <button
            onClick={handleSave}
            className="btn btn-save-template"
            disabled={isSaving || !templateName.trim()}
          >
            {isSaving ? 'Salvando...' : '💾 Salvar modelo'}
          </button>
          <button
            onClick={onDiscard}
            className="btn btn-discard"
            disabled={isSaving}
          >
            Finalizar sem salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default SaveListModal

