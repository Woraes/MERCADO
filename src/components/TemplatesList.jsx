import { useState, useEffect } from 'react'
import { getTemplatesByUser, createListFromTemplate, getListItems, deleteList } from '../services/database'
import './TemplatesList.css'

function TemplatesList({ userId, onSelectTemplate, onClose }) {
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    loadTemplates()
  }, [userId])

  const loadTemplates = () => {
    try {
      const userTemplates = getTemplatesByUser(userId)
      setTemplates(userTemplates)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      setTemplates([])
    }
  }

  const handleUseTemplate = (templateId) => {
    try {
      console.log('Usando template ID:', templateId, 'User ID:', userId)
      const newListId = createListFromTemplate(userId, templateId)
      console.log('Nova lista criada com ID:', newListId)
      if (newListId) {
        onSelectTemplate(newListId)
        onClose()
      } else {
        alert('Erro ao criar lista a partir do template. Tente novamente.')
        console.error('createListFromTemplate retornou null ou undefined')
      }
    } catch (error) {
      console.error('Erro ao usar template:', error)
      alert('Erro ao usar template: ' + error.message)
    }
  }

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Tem certeza que deseja apagar este template?')) {
      deleteList(templateId)
      loadTemplates()
    }
  }

  return (
    <div className="templates-overlay">
      <div className="templates-container">
        <div className="templates-header">
          <h2>📋 Listas Salvas</h2>
          <button onClick={onClose} className="btn-close" aria-label="Fechar">
            ✕
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="templates-empty">
            <p>Nenhuma lista salva ainda</p>
            <p className="empty-hint">Salve uma lista após finalizar uma compra para reutilizá-la!</p>
          </div>
        ) : (
          <div className="templates-list">
            {templates.map(template => {
              const items = getListItems(template.id)
              return (
                <div key={template.id} className="template-card">
                  <div className="template-info">
                    <h3 className="template-name">{template.name}</h3>
                    <span className="template-count">{items.length} item(ns)</span>
                  </div>
                  <div className="template-items-preview">
                    {items.slice(0, 3).map((item, index) => (
                      <span key={index} className="preview-item">{item.name}</span>
                    ))}
                    {items.length > 3 && (
                      <span className="preview-more">+{items.length - 3} mais</span>
                    )}
                  </div>
                  <div className="template-actions">
                    <button
                      onClick={() => handleUseTemplate(template.id)}
                      className="btn btn-use-template"
                    >
                      ➕ Usar Esta Lista
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="btn-delete-template"
                      aria-label="Deletar template"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TemplatesList

