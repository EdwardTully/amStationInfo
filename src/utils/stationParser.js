/**
 * Parse AM radio station data from the fixed-width text file
 * Returns array of station objects with parsed coordinates and metadata
 */

export function parseStationData(fileContent) {
  const lines = fileContent.trim().split('\n');
  const stations = [];
  const seen = new Set();

  for (const line of lines) {
    if (!line.trim() || line.length < 250) continue;

    try {
      // Find key markers in the line
      const callSign = line.substring(1, 14).trim();
      const frequency = line.substring(14, 23).trim();
      
      // Find "Daytime" or "Nighttime" 
      if (!line.includes('Daytime')) continue;
      if (seen.has(callSign)) continue;
      seen.add(callSign);
      
      // Find state (2 letter code before "US")
      const usIndex = line.indexOf(' US ');
      if (usIndex === -1) continue;
      const state = line.substring(usIndex - 3, usIndex - 1).trim();
      
      // Find city (work backwards from state)
      const city = line.substring(usIndex - 30, usIndex - 3).trim();
      
      // Find coordinates - look for "N" and "W" markers
      const nIndex = line.indexOf(' N  ', usIndex);
      const wIndex = line.indexOf(' W  ', nIndex);
      if (nIndex === -1 || wIndex === -1) continue;
      
      // Parse latitude after "N"
      const latStr = line.substring(nIndex + 4, wIndex).trim();
      const latParts = latStr.split(/\s+/);
      if (latParts.length < 3) continue;
      const latDeg = parseInt(latParts[0]);
      const latMin = parseInt(latParts[1]);
      const latSec = parseFloat(latParts[2]);
      
      // Parse longitude after "W"
      const lonStr = line.substring(wIndex + 4, wIndex + 20).trim();
      const lonParts = lonStr.split(/\s+/);
      if (lonParts.length < 3) continue;
      const lonDeg = parseInt(lonParts[0]);
      const lonMin = parseInt(lonParts[1]);
      const lonSec = parseFloat(lonParts[2]);
      
      // Find operator - it's after the longitude coordinates
      const operatorStart = wIndex + 20;
      const operatorStr = line.substring(operatorStart, operatorStart + 80).trim();
      const operator = operatorStr.substring(0, operatorStr.search(/\s{2,}|\d{2,}/)).trim() || operatorStr.substring(0, 60).trim();
      
      // Find power (look for "kW")
      const kwIndex = line.indexOf('kW', usIndex);
      if (kwIndex > 0) {
        const powerStr = line.substring(kwIndex - 20, kwIndex).trim().split(/\s+/).pop();
        var power = parseFloat(powerStr);
      } else {
        var power = 0;
      }
      
      // Validate coordinates
      if (isNaN(latDeg) || isNaN(lonDeg) || latDeg < 0 || latDeg > 90 || lonDeg < 0 || lonDeg > 180) {
        continue;
      }

      // Convert to decimal degrees
      const lat = latDeg + latMin / 60 + latSec / 3600;
      const lon = -(lonDeg + lonMin / 60 + lonSec / 3600);

      const station = {
        callSign,
        frequency,
        power: isNaN(power) ? 0 : power,
        city,
        state,
        lat,
        lon,
        operator,
        id: `${callSign}-${frequency}`,
      };

      stations.push(station);
    } catch (error) {
      // Skip parsing errors
    }
  }

  console.log('Total lines:', lines.length, 'Stations parsed:', stations.length);
  return stations;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
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
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Geocode a US zip code to coordinates
 */
export async function geocodeZipCode(zipCode, apiKey) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: data.results[0].formatted_address,
      };
    }
    
    throw new Error('Zip code not found');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}
