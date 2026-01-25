import React, { useState } from 'react';

export function LocationInput({ onLocationChange }) {
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!zipCode.trim()) {
      setError('Please enter a zip code');
      return;
    }

    if (!/^\d{5}$/.test(zipCode.trim())) {
      setError('Please enter a valid 5-digit zip code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use free Nominatim geocoding service (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=US&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'AM-Radio-DXing-Map'
          }
        }
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name,
        };
        onLocationChange(location);
      } else {
        setError('Zip code not found. Please try again.');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Failed to find location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setZipCode('');
    setError('');
    onLocationChange(null);
  };

  return (
    <div className="location-input-container">
      <form onSubmit={handleSubmit} className="location-form">
        <input
          type="text"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          placeholder="Zip code (optional - for distance calc)"
          maxLength="5"
          className="zip-input"
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Finding...' : 'Set Location'}
        </button>
        {zipCode && (
          <button type="button" onClick={handleClear} className="btn-secondary">
            Clear
          </button>
        )}
      </form>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
