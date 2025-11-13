import { useState } from 'react'
import { saveListAsTemplate, getListById, getListItems } from '../services/database'
import './SaveListModal.css'

function SaveListModal({ listId, total, itemsCount, onSave, onDiscard }) {
  const [templateName, setTemplateName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

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

  return (
    <div className="save-list-overlay">
      <div className="save-list-modal">
        <h2>✅ Compra Finalizada!</h2>
        
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

        <div className="save-list-question">
          <p>Deseja salvar esta lista como template para reutilizar nas próximas compras?</p>
        </div>

        <div className="save-list-form">
          <input
            type="text"
            placeholder="Nome do template (ex: Lista Semanal)"
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
            {isSaving ? 'Salvando...' : '💾 Salvar Template'}
          </button>
          <button
            onClick={onDiscard}
            className="btn btn-discard"
            disabled={isSaving}
          >
            ❌ Não Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default SaveListModal

