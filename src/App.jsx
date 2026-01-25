import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { LocationInput } from './components/LocationInput';
import { parseStationData } from './utils/stationParser';
import { parseCanadianStationData } from './utils/canadianParser';
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
  const [mapZoom, setMapZoom] = useState(4.5);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('callsign'); // 'callsign' or 'frequency'
  const [highlightedStations, setHighlightedStations] = useState([]);

  // Load station data on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Fetching station data...');
        
        // Load US stations
        const usResponse = await fetch('/amRadioSta.txt');
        console.log('US Response status:', usResponse.status);
        const usText = await usResponse.text();
        console.log('US Data length:', usText.length);
        const usStations = parseStationData(usText) || [];
        console.log('US Parsed stations:', usStations.length);
        
        // Load Canadian stations
        const caResponse = await fetch('/canadianStations.csv');
        console.log('CA Response status:', caResponse.status);
        const caText = await caResponse.text();
        const caStations = parseCanadianStationData(caText) || [];
        console.log('Canadian Parsed stations:', caStations.length);
        
        // Combine both datasets
        const allStations = [...usStations, ...caStations];
        console.log('Total stations:', allStations.length);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setStations(allStations);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading station data:', err);
        if (isMounted) {
          setError('Failed to load station data. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);



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
      setHighlightedStations([]);
      return;
    }

    if (searchType === 'callsign') {
      const found = stations.find(s => 
        s && s.callSign && s.callSign.toLowerCase() === searchQuery.trim().toLowerCase()
      );

      if (found) {
        setHighlightedStations([found.callSign]);
        setMapCenter([found.lat, found.lon]);
        setMapZoom(10);
      } else {
        alert(`Station "${searchQuery}" not found`);
      }
    } else if (searchType === 'frequency') {
      // Search by frequency - round to nearest 10 kHz
      const inputFreq = parseFloat(searchQuery.trim());
      
      if (isNaN(inputFreq)) {
        alert('Please enter a valid frequency number');
        return;
      }
      
      // Round to nearest 10 kHz
      const roundedFreq = Math.round(inputFreq / 10) * 10;
      
      // Search for stations with this frequency (format: "XXX   kHz")
      const foundStations = stations.filter(s => {
        if (!s || !s.frequency) return false;
        const stationFreq = parseInt(s.frequency.trim());
        return !isNaN(stationFreq) && stationFreq === roundedFreq;
      });

      if (foundStations.length > 0) {
        setHighlightedStations(foundStations.map(s => s.callSign));
        
        // Show feedback if we rounded
        if (inputFreq !== roundedFreq) {
          console.log(`Rounded ${inputFreq} kHz to ${roundedFreq} kHz`);
        }
      } else {
        alert(`No stations found on frequency ${roundedFreq} kHz`);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setHighlightedStations([]);
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
        <div className="header-layout">
          <div className="header-content">
            <h1>AM Radio DXing Map</h1>
            <p className="subtitle">Explore AM radio stations across North America</p>
          </div>
          <div className="header-controls">
            <LocationInput onLocationChange={handleLocationChange} />
            <div className="station-search-container">
              <form onSubmit={handleStationSearch} className="station-search">
                <select 
                  value={searchType} 
                  onChange={(e) => setSearchType(e.target.value)}
                  className="search-type-select"
                >
                  <option value="callsign">Call Sign</option>
                  <option value="frequency">Frequency</option>
                </select>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchType === 'callsign' ? 'e.g., WABC' : 'e.g., 540 or 1010'}
                  className="search-input"
                />
                <button type="submit" className="btn-primary">
                  Search
                </button>
                {highlightedStations.length > 0 && (
                  <button type="button" onClick={clearSearch} className="btn-secondary">
                    Clear
                  </button>
                )}
              </form>
            </div>
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
          {!loading && stations && stations.length > 0 && (
          <MarkerClusterGroup
            key={`cluster-${stations.length}`}
            chunkedLoading
            maxClusterRadius={80}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {stations.map((station, index) => {
            if (!station || !station.lat || !station.lon) return null;
            const distance = userLocation
              ? calculateDistance(userLocation.lat, userLocation.lng, station.lat, station.lon)
              : null;

            const isHighPower = station.power >= 10;
            const isHighlighted = highlightedStations.includes(station.callSign);

            return (
              <Marker
                key={station.id || `station-${index}`}
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
                    {station.operator && (
                      <p style={{ margin: '4px 0', fontSize: '14px' }}>
                        <strong>Operator:</strong> {station.operator}
                      </p>
                    )}
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
          </MarkerClusterGroup>
          )}
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
