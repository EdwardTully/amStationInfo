/**
 * Parse Canadian AM radio station data from CSV
 * Returns array of station objects with parsed coordinates and metadata
 */

export function parseCanadianStationData(csvContent) {
  const lines = csvContent.trim().split('\n');
  const stationMap = new Map(); // Use Map to keep highest power version

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      // Simple CSV split - assumes proper CSV format
      const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
      
      // Skip header row only (not data rows)
      if (columns[3] === 'Call sign') continue;
      
      // New format: Channel Type, Frequency, Power, Call sign, Lat, Lon, Licensee
      if (columns.length < 7) {
        continue;
      }
      
      const frequencyMHz = parseFloat(columns[1]);
      const powerW = parseFloat(columns[2]);
      const callSign = columns[3];
      const lat = parseFloat(columns[4]);
      const lon = parseFloat(columns[5]);
      const licensee = columns[6] || 'Canadian Broadcaster';
      
      const frequency = `${Math.round(frequencyMHz * 1000)}   kHz`; // Convert MHz to kHz
      const power = powerW / 1000; // Convert Watts to kW

      // Validate coordinates and data (skip 0,0 coordinates)
      if (isNaN(lat) || isNaN(lon) || isNaN(power) || !callSign || (lat === 0 && lon === 0)) {
        continue;
      }

      // Use base call sign (remove -AX1, -AX2 suffixes)
      const baseCallSign = callSign.split('-')[0];
      const uniqueKey = `${baseCallSign}-${frequency}`;

      // Keep the entry with highest power for each unique station
      const existing = stationMap.get(uniqueKey);
      if (!existing || power > existing.power) {
        const station = {
          callSign: baseCallSign,
          frequency,
          power,
          city: 'Canada', // Location not in new format
          state: 'CA',
          lat,
          lon,
          operator: licensee,
          id: uniqueKey,
        };
        stationMap.set(uniqueKey, station);
      }
    } catch (error) {
      // Skip parsing errors
    }
  }

  // Convert Map to array
  const stations = Array.from(stationMap.values());
  console.log('Canadian stations parsed:', stations.length);
  return stations;
}
