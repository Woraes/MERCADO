import './ConfirmCard.css'

function ConfirmCard({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-card">
        <div className="confirm-content">
          <p className="confirm-message">{message}</p>
        </div>
        <div className="confirm-actions">
          <button onClick={onCancel} className="btn btn-cancel-confirm">
            Cancelar
          </button>
          <button onClick={onConfirm} className="btn btn-confirm">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmCard

