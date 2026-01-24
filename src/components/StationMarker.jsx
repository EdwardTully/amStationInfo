import React, { useState } from 'react';
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

export function StationMarker({ station, userLocation }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowShown, setInfoWindowShown] = useState(false);

  // Calculate distance from user location if available
  let distance = null;
  if (userLocation) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(station.lat - userLocation.lat);
    const dLon = toRad(station.lon - userLocation.lng);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLocation.lat)) *
      Math.cos(toRad(station.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distance = R * c;
  }

  // Determine marker color based on power
  const getMarkerColor = (power) => {
    if (power >= 10) return '#ff0000'; // Red for high power (>= 10kW)
    if (power >= 1) return '#ff9900'; // Orange for medium power (>= 1kW)
    return '#ffcc00'; // Yellow for low power (< 1kW)
  };

  const markerColor = getMarkerColor(station.power);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: station.lat, lng: station.lon }}
        onMouseEnter={() => setInfoWindowShown(true)}
        onMouseLeave={() => setInfoWindowShown(false)}
        onClick={() => setInfoWindowShown(!infoWindowShown)}
        title={`${station.callSign} - ${station.frequency}`}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: markerColor,
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            cursor: 'pointer',
          }}
        />
      </AdvancedMarker>

      {infoWindowShown && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setInfoWindowShown(false)}
          headerContent={
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              {station.callSign}
            </h3>
          }
        >
          <div style={{ padding: '8px 0', minWidth: '200px' }}>
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
        </InfoWindow>
      )}
    </>
  );
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
