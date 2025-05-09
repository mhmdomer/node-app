import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import './PollView.css';

interface PollOption {
  id: string;
  option_text: string;
  vote_count: number;
  percentage: number;
}

interface PollResult {
  id: string;
  question: string;
  expiresAt: string;
  closed: boolean;
  totalVotes: number;
  options: PollOption[];
}

interface PollViewProps {
  pollId: string;
  token: string | null;
  onBackToCreate: () => void;
}

const PollView = ({ pollId, token, onBackToCreate }: PollViewProps) => {
  const [poll, setPoll] = useState<PollResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pollLink, setPollLink] = useState('');

  // Connect to server and fetch poll data
  useEffect(() => {
    const socketURL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3000';
    const newSocket = io(socketURL);
    setSocket(newSocket);

    // Create shareable link
    const baseURL = window.location.origin + window.location.pathname;
    setPollLink(`${baseURL}?poll=${pollId}`);

    // Join poll room to receive updates
    newSocket.emit('join-poll', pollId);

    // Listen for poll updates
    newSocket.on('poll-update', (data) => {
      if (data.pollId === pollId) {
        fetchPollData();
      }
    });

    // Fetch initial poll data
    fetchPollData();

    // Cleanup function
    return () => {
      newSocket.emit('leave-poll', pollId);
      newSocket.disconnect();
    };
  }, [pollId]);

  // Fetch poll data from API
  const fetchPollData = async () => {
    try {
      const response = await axios.get(`/poll/${pollId}`);
      setPoll(response.data);
    } catch (err) {
      console.error('Error fetching poll:', err);
      setError('Failed to load poll data');
    } finally {
      setLoading(false);
    }
  };

  // Handle vote submission
  const handleVote = async () => {
    if (!selectedOption || !token || voting) return;
    
    setVoting(true);
    setError(null);
    
    try {
      await axios.post(`/poll/${pollId}/vote`, {
        optionId: selectedOption
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVoteSuccess(true);
      // No need to fetch poll data as we'll get update via WebSocket
    } catch (err: any) {
      console.error('Error voting:', err);
      setError(err.response?.data?.error || 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  // Copy poll link to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(pollLink);
    alert('Link copied to clipboard!');
  };

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Check if poll has ended
  const isPollEnded = () => {
    if (!poll) return false;
    return poll.closed || new Date(poll.expiresAt) <= new Date();
  };

  // Render loading state
  if (loading) {
    return (
      <div className="poll-view-container loading">
        <div className="loader"></div>
        <p>Loading poll...</p>
      </div>
    );
  }

  // Render error state
  if (error || !poll) {
    return (
      <div className="poll-view-container error">
        <h2>Error</h2>
        <p>{error || 'Could not load poll'}</p>
        <button onClick={onBackToCreate} className="back-button">
          Back to Create Poll
        </button>
      </div>
    );
  }

  return (
    <div className="poll-view-container">
      <div className="poll-header">
        <h2>{poll.question}</h2>
        <div className="poll-meta">
          <span className={`poll-status ${isPollEnded() ? 'ended' : 'active'}`}>
            {isPollEnded() ? 'Closed' : 'Active'}
          </span>
          <span className="poll-expires">
            {isPollEnded() ? 'Ended' : 'Ends'} at: {formatDate(poll.expiresAt)}
          </span>
        </div>
      </div>

      <div className="poll-options">
        {poll.options.map((option) => (
          <div 
            key={option.id} 
            className={`poll-option ${selectedOption === option.id ? 'selected' : ''}`}
            onClick={() => !isPollEnded() && !voteSuccess && setSelectedOption(option.id)}
          >
            <div className="option-header">
              <span className="option-text">{option.option_text}</span>
              <span className="option-percentage">{option.percentage}%</span>
            </div>
            <div className="option-bar-container">
              <div 
                className="option-bar" 
                style={{ width: `${option.percentage}%` }}
              ></div>
            </div>
            <div className="option-votes">
              {option.vote_count} {option.vote_count === 1 ? 'vote' : 'votes'}
            </div>
          </div>
        ))}
      </div>

      <div className="poll-footer">
        <div className="poll-total">
          Total votes: {poll.totalVotes}
        </div>
        
        {!isPollEnded() && token && !voteSuccess && (
          <button 
            onClick={handleVote} 
            disabled={!selectedOption || voting}
            className="vote-button"
          >
            {voting ? 'Voting...' : 'Submit Vote'}
          </button>
        )}
        
        {voteSuccess && (
          <div className="vote-success">
            Your vote has been recorded!
          </div>
        )}
        
        <div className="poll-actions">
          <button onClick={copyLink} className="share-button">
            Copy Link
          </button>
          <button onClick={onBackToCreate} className="back-button">
            Create New Poll
          </button>
        </div>
      </div>
    </div>
  );
};

export default PollView;