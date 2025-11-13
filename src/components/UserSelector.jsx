import { useState, useEffect } from 'react'
import { initDatabase, getUsers, createUser } from '../services/database'
import './UserSelector.css'

function UserSelector({ onSelectUser, currentUserId }) {
  const [users, setUsers] = useState([])
  const [newUserName, setNewUserName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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
            <button
              key={user.id}
              onClick={async () => {
                try {
                  await initDatabase()
                  onSelectUser(user.id)
                } catch (error) {
                  setError('Erro ao selecionar usuário: ' + error.message)
                }
              }}
              className={`user-button ${currentUserId === user.id ? 'active' : ''}`}
            >
              <span className="user-icon">👤</span>
              <span className="user-name">{user.name}</span>
              {currentUserId === user.id && <span className="check">✓</span>}
            </button>
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
    </div>
  )
}

export default UserSelector

