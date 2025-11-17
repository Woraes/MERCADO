import './TutorialOverlay.css'

const steps = [
  {
    title: '1. Crie ou escolha o usuário',
    description: 'Cada membro da família pode ter suas próprias listas e histórico.'
  },
  {
    title: '2. Monte a lista em casa',
    description: 'Adicione produtos e quantidades. Você pode editar tudo depois.'
  },
  {
    title: '3. Use o modo mercado',
    description: 'Lá você registra valores, marca o que comprou e imprime ou salva a lista.'
  }
]

function TutorialOverlay({ onClose }) {
  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <span className="tutorial-badge">Bem-vindo ao WillCompras</span>
        <h2>Veja como é simples usar o app</h2>
        <p className="tutorial-subtitle">
          Preparamos um passo a passo rápido para você ou para alguém da família.
        </p>

        <div className="tutorial-steps">
          {steps.map((step) => (
            <div key={step.title} className="tutorial-step">
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </div>
          ))}
        </div>

        <div className="tutorial-actions">
          <button onClick={onClose} className="btn tutorial-primary">
            Começar agora
          </button>
          <button
            onClick={onClose}
            className="btn tutorial-secondary"
            aria-label="Fechar tutorial"
          >
            Já entendi
          </button>
        </div>
      </div>
    </div>
  )
}

export default TutorialOverlay


