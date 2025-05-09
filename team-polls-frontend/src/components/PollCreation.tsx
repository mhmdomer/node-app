import { useState } from 'react';
import axios from 'axios';
import './PollCreation.css';

interface PollCreationProps {
  onPollCreated: (pollId: string) => void;
}

const PollCreation = ({ onPollCreated }: PollCreationProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [expiresIn, setExpiresIn] = useState('1h');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle adding a new option
  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  // Handle removing an option
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  // Handle option change
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Calculate expiration date based on selected time
  const calculateExpiresAt = () => {
    const now = new Date();
    
    switch (expiresIn) {
      case '15m':
        return new Date(now.getTime() + 15 * 60000).toISOString();
      case '30m':
        return new Date(now.getTime() + 30 * 60000).toISOString();
      case '1h':
        return new Date(now.getTime() + 60 * 60000).toISOString();
      case '4h':
        return new Date(now.getTime() + 4 * 60 * 60000).toISOString();
      case '12h':
        return new Date(now.getTime() + 12 * 60 * 60000).toISOString();
      case '1d':
        return new Date(now.getTime() + 24 * 60 * 60000).toISOString();
      default:
        return new Date(now.getTime() + 60 * 60000).toISOString();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }
    
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/poll', {
        question: question.trim(),
        options: validOptions,
        expiresAt: calculateExpiresAt()
      });
      
      // Call onPollCreated with the new poll ID
      onPollCreated(response.data.id);
    } catch (err: any) {
      console.error('Error creating poll:', err);
      setError(err.response?.data?.error || 'Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="poll-creation-container">
      <h2>Create a New Poll</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="question">Question</label>
          <input
            id="question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question"
            maxLength={200}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Options</label>
          {options.map((option, index) => (
            <div key={index} className="option-row">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                maxLength={100}
                required
              />
              {options.length > 2 && (
                <button 
                  type="button" 
                  onClick={() => removeOption(index)}
                  className="remove-option-btn"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          {options.length < 10 && (
            <button 
              type="button" 
              onClick={addOption}
              className="add-option-btn"
            >
              + Add Option
            </button>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="expires">Poll Duration</label>
          <select 
            id="expires" 
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
          >
            <option value="15m">15 minutes</option>
            <option value="30m">30 minutes</option>
            <option value="1h">1 hour</option>
            <option value="4h">4 hours</option>
            <option value="12h">12 hours</option>
            <option value="1d">1 day</option>
          </select>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit"
          className="create-poll-btn"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
};

export default PollCreation;