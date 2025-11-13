import { useState, useEffect } from 'react'
import { initDatabase, getUsers, createUser, deleteUser } from '../services/database'
import ConfirmCard from './ConfirmCard'
import './UserSelector.css'

function UserSelector({ onSelectUser, currentUserId }) {
  const [users, setUsers] = useState([])
  const [newUserName, setNewUserName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      await initDatabase()
      const userList = getUsers()
      setUsers(userList)
      setIsLoading(false)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setError('Erro ao carregar usuários: ' + error.message)
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (newUserName.trim()) {
      try {
        await initDatabase()
        const result = createUser(newUserName.trim())
        if (result.success) {
          setNewUserName('')
          await loadUsers()
          setError('')
          // Selecionar automaticamente o usuário recém-criado
          if (result.id) {
            onSelectUser(result.id)
          }
        } else {
          setError(result.error || 'Erro ao criar usuário')
        }
      } catch (error) {
        setError('Erro ao criar usuário: ' + error.message)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="user-selector-overlay">
        <div className="user-selector-card">
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-selector-overlay">
      <div className="user-selector-card">
        <h2>Selecione ou Crie um Usuário</h2>
        
        {error && <div className="error-message">{error}</div>}

        <div className="users-list">
          {users.map(user => (
            <div key={user.id} className="user-item-wrapper">
              <button
                onClick={() => {
                  const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
                  onSelectUser(userId)
                }}
                className={`user-button ${currentUserId === user.id ? 'active' : ''}`}
                type="button"
              >
                <span className="user-icon">👤</span>
                <span className="user-name">{user.name}</span>
                {currentUserId === user.id && <span className="check">✓</span>}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setUserToDelete(user)
                  setShowDeleteConfirm(true)
                }}
                className="btn-delete-user"
                aria-label="Deletar usuário"
                type="button"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleCreateUser} className="create-user-form">
          <input
            type="text"
            placeholder="Nome do novo usuário"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="input"
            required
          />
          <button type="submit" className="btn btn-primary">
            Criar Usuário
          </button>
        </form>
      </div>

      {showDeleteConfirm && userToDelete && (
        <ConfirmCard
          message={`Tem certeza que deseja apagar o usuário "${userToDelete.name}"? Esta ação não pode ser desfeita e apagará todas as listas e compras deste usuário.`}
          onConfirm={async () => {
            const result = deleteUser(userToDelete.id)
            if (result.success) {
              await loadUsers()
              setShowDeleteConfirm(false)
              setUserToDelete(null)
              // Se o usuário deletado era o atual, limpar
              if (currentUserId === userToDelete.id) {
                localStorage.removeItem('currentUserId')
              }
            } else {
              setError(result.error || 'Erro ao deletar usuário')
            }
          }}
          onCancel={() => {
            setShowDeleteConfirm(false)
            setUserToDelete(null)
          }}
        />
      )}
    </div>
  )
}

export default UserSelector

