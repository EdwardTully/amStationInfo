import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationInput } from './components/LocationInput';
import { parseStationData } from './utils/stationParser';
import './App.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to update map view when user location changes
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

function App() {
  const [stations, setStations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Center of US [lat, lng]
  const [mapZoom, setMapZoom] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedStation, setHighlightedStation] = useState(null);

  // Load station data on mount
  useEffect(() => {
    loadStationData();
  }, []);

  const loadStationData = async () => {
    try {
      setLoading(true);
      console.log('Fetching station data...');
      const response = await fetch('/amRadioSta.txt');
      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Data length:', text.length);
      const parsedStations = parseStationData(text);
      console.log('Parsed stations:', parsedStations.length);
      setStations(parsedStations);
      setError(null);
    } catch (err) {
      console.error('Error loading station data:', err);
      setError('Failed to load station data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (location) => {
    setUserLocation(location);
    if (location) {
      setMapCenter([location.lat, location.lng]);
      setMapZoom(8);
    } else {
      setMapCenter([39.8283, -98.5795]);
      setMapZoom(4);
    }
  };

  const handleStationSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setHighlightedStation(null);
      return;
    }

    const found = stations.find(s => 
      s.callSign.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (found) {
      setHighlightedStation(found.callSign);
      setMapCenter([found.lat, found.lon]);
      setMapZoom(10);
    } else {
      alert(`Station "${searchQuery}" not found`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setHighlightedStation(null);
  };

  // Create custom icons for different power levels
  const createStationIcon = (power) => {
    let color = '#ffcc00'; // Yellow for low power
    if (power >= 10) color = '#ff0000'; // Red for high power
    else if (power >= 1) color = '#ff9900'; // Orange for medium power

    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color}; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (degrees) => degrees * (Math.PI / 180);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>AM Radio DXing Map</h1>
          <p className="subtitle">Explore AM radio stations across the United States</p>
        </div>
        <div className="header-controls">
          <LocationInput onLocationChange={handleLocationChange} />
          <div className="station-search-container">
            <form onSubmit={handleStationSearch} className="station-search">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search station (e.g., WABC)"
                className="search-input"
              />
              <button type="submit" className="btn-primary">
                Search
              </button>
              {highlightedStation && (
                <button type="button" onClick={clearSearch} className="btn-secondary">
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>
      </header>

      <div className="legend">
        <h3>Power Levels:</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-marker" style={{ backgroundColor: '#ff0000' }}></div>
            <span>High (&gt;= 10 kW)</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker" style={{ backgroundColor: '#ff9900' }}></div>
            <span>Medium (&gt;= 1 kW)</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker" style={{ backgroundColor: '#ffcc00' }}></div>
            <span>Low (&lt; 1 kW)</span>
          </div>
        </div>
        <p className="station-count">{stations.length} stations loaded</p>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-message">Loading station data...</div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Station markers */}
          {stations.map((station) => {
            const distance = userLocation
              ? calculateDistance(userLocation.lat, userLocation.lng, station.lat, station.lon)
              : null;

            const isHighPower = station.power >= 10;
            const isHighlighted = highlightedStation === station.callSign;

            return (
              <Marker
                key={station.id}
                position={[station.lat, station.lon]}
                icon={isHighlighted
                  ? L.divIcon({
                      className: 'custom-marker-highlighted',
                      html: `
                        <div style="display: flex; flex-direction: column; align-items: center;">
                          <div style="
                            width: 20px;
                            height: 20px;
                            border-radius: 50%;
                            background-color: #00ff00;
                            border: 3px solid #ffff00;
                            box-shadow: 0 0 10px rgba(255,255,0,0.8);
                            animation: pulse 1s infinite;
                          "></div>
                          <div style="
                            font-size: 11px;
                            font-weight: bold;
                            color: #000;
                            background: #ffff00;
                            padding: 2px 6px;
                            border-radius: 3px;
                            margin-top: 3px;
                            white-space: nowrap;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                          ">${station.callSign}</div>
                        </div>
                      `,
                      iconSize: [60, 40],
                      iconAnchor: [30, 10],
                    })
                  : isHighPower 
                  ? L.divIcon({
                      className: 'custom-marker-labeled',
                      html: `
                        <div style="display: flex; flex-direction: column; align-items: center;">
                          <div style="
                            width: 12px;
                            height: 12px;
                            border-radius: 50%;
                            background-color: #ff0000;
                            border: 2px solid white;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                          "></div>
                          <div style="
                            font-size: 9px;
                            font-weight: bold;
                            color: #333;
                            background: rgba(255,255,255,0.9);
                            padding: 1px 3px;
                            border-radius: 2px;
                            margin-top: 2px;
                            white-space: nowrap;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                          ">${station.callSign}</div>
                        </div>
                      `,
                      iconSize: [50, 30],
                      iconAnchor: [25, 6],
                    })
                  : createStationIcon(station.power)
                }
                eventHandlers={!isHighPower && !isHighlighted ? {
                  mouseover: (e) => {
                    e.target.bindTooltip(station.callSign, {
                      permanent: false,
                      direction: 'top',
                      className: 'station-tooltip'
                    }).openTooltip();
                  },
                  mouseout: (e) => {
                    e.target.closeTooltip();
                  }
                } : {}}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                      {station.callSign}
                    </h3>
                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                      <strong>Frequency:</strong> {station.frequency}
                    </p>
                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                      <strong>Power:</strong> {station.power} kW
                    </p>
                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                      <strong>Location:</strong> {station.city}, {station.state}
                    </p>
                    {distance !== null && (
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#0066cc' }}>
                        <strong>Distance:</strong> {distance.toFixed(1)} miles
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <footer className="app-footer">
        <p>
          Click on station markers to view details. 
          {userLocation && ' Distances calculated from your location.'}
        </p>
      </footer>
    </div>
  );
}

export default App;
