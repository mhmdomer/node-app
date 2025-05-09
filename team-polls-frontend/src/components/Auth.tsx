import { useState } from 'react';
import axios from 'axios';
import './Auth.css';

interface AuthProps {
  onAuth: (token: string) => void;
}

const Auth = ({ onAuth }: AuthProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnonymousAuth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/auth/anon');
      onAuth(response.data.token);
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Welcome to Team Polls</h2>
      <p>Create and vote on polls in real-time</p>
      
      <button 
        onClick={handleAnonymousAuth} 
        disabled={loading}
        className="auth-button"
      >
        {loading ? 'Authenticating...' : 'Continue as Anonymous User'}
      </button>
      
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
};

export default Auth;