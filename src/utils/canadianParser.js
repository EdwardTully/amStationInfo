/**
 * Parse Canadian AM radio station data from CSV
 * Returns array of station objects with parsed coordinates and metadata
 */

export function parseCanadianStationData(csvContent) {
  const lines = csvContent.trim().split('\n');
  const stations = [];
  const seen = new Set();

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      // Parse CSV - handle quoted fields
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!matches || matches.length < 8) continue;

      const callSign = matches[5].replace(/"/g, '').trim();
      const frequencyMHz = parseFloat(matches[1].replace(/"/g, ''));
      const frequency = `${Math.round(frequencyMHz * 1000)}   kHz`; // Convert MHz to kHz
      const powerW = parseFloat(matches[3].replace(/"/g, ''));
      const power = powerW / 1000; // Convert Watts to kW
      const location = matches[4].replace(/"/g, '').trim();
      const lat = parseFloat(matches[6].replace(/"/g, ''));
      const lon = parseFloat(matches[7].replace(/"/g, ''));

      // Validate coordinates
      if (isNaN(lat) || isNaN(lon) || isNaN(power)) {
        continue;
      }

      // Deduplicate by call sign and frequency
      const uniqueKey = `${callSign}-${frequency}`;
      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);

      const station = {
        callSign,
        frequency,
        power,
        city: location,
        state: 'CA', // Canadian provinces could be parsed if needed
        lat,
        lon,
        operator: 'Canadian Broadcaster', // Could enhance if data available
        id: uniqueKey,
      };

      stations.push(station);
    } catch (error) {
      // Skip parsing errors
      console.warn('Error parsing Canadian station line:', error);
    }
  }

  console.log('Canadian stations parsed:', stations.length);
  return stations;
}
