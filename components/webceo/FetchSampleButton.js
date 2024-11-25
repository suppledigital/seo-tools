// components/FetchSampleButton.js
import React, { useState } from 'react';
import axios from 'axios';

const FetchSampleButton = ({ onFetchSample }) => {
  const [loading, setLoading] = useState(false);

  const handleFetchSample = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/webceo-keywords/fetchSample');
      onFetchSample(response.data.columns);
      alert('Sample columns fetched successfully.');
    } catch (error) {
      console.error('Error fetching sample columns:', error);
      alert('Failed to fetch sample columns.');
    }
    setLoading(false);
  };

  return (
    <button onClick={handleFetchSample} disabled={loading}>
      {loading ? 'Fetching Sample...' : 'Fetch Sample Columns'}
    </button>
  );
};

export default FetchSampleButton;
