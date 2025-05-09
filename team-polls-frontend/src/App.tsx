import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import PollCreation from './components/PollCreation'
import PollView from './components/PollView'
import Auth from './components/Auth'

// Setup axios defaults for our API
axios.defaults.baseURL = import.meta.env.PROD ? '/api' : 'http://localhost:3000'

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [currentPollId, setCurrentPollId] = useState<string | null>(null)
  const [view, setView] = useState<'auth' | 'create' | 'view'>(!token ? 'auth' : 'create')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pollIdFromUrl = urlParams.get('poll');
  
    if (pollIdFromUrl) {
      setCurrentPollId(pollIdFromUrl);
    }
  }, []);
  
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setView(currentPollId ? 'view' : 'create');
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setView('auth');
    }
  }, [token]);
  
  useEffect(() => {
    // If currentPollId changes and we have a token, show 'view'
    if (token && currentPollId) {
      setView('view');
    }
  }, [currentPollId]);
  

  // Handle authentication
  const handleAuth = (newToken: string) => {
    setToken(newToken)
  }

  // Handle logout
  const handleLogout = () => {
    setToken(null)
    setCurrentPollId(null)
    // Clear URL parameters when logging out
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Handle poll creation
  const handlePollCreated = (pollId: string) => {
    setCurrentPollId(pollId)
    setView('view')
  }

  // Handle returning to create poll view
  const handleBackToCreate = () => {
    setCurrentPollId(null)
    setView('create')
    // Clear URL parameters when going back to create
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  return (
    <div className="app-container">
      <header>
        <h1>Team Polls</h1>
        {token && (
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        )}
      </header>

      <main>
        {view === 'auth' && <Auth onAuth={handleAuth} />}
        
        {view === 'create' && token && (
          <PollCreation onPollCreated={handlePollCreated} />
        )}
        
        {view === 'view' && currentPollId && (
          <PollView 
            pollId={currentPollId} 
            token={token} 
            onBackToCreate={handleBackToCreate} 
          />
        )}
      </main>

      <footer>
        <p>Team Polls - A real-time polling application</p>
      </footer>
    </div>
  )
}

export default App
