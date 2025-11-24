import './BottomNavigation.css'

function BottomNavigation({ activeTab, onTabChange }) {
    return (
        <nav className="bottom-nav">
            <button
                className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => onTabChange('home')}
            >
                <span className="nav-icon">🏠</span>
                <span className="nav-label">Início</span>
            </button>

            <button
                className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => onTabChange('history')}
            >
                <span className="nav-icon">📊</span>
                <span className="nav-label">Histórico</span>
            </button>

            <button
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => onTabChange('profile')}
            >
                <span className="nav-icon">👤</span>
                <span className="nav-label">Perfil</span>
            </button>
        </nav>
    )
}

export default BottomNavigation
