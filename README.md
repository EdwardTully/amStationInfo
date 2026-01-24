# AM Radio DXing Map

A React application for AM radio DXing enthusiasts that displays radio station locations on an interactive Google Maps interface with distance calculations from your location.

## Features

- 📍 Interactive Google Maps showing all AM radio stations across the US
- 🎯 Hover tooltips with station details (call sign, frequency, power, location)
- 📏 Distance calculations from your zip code location
- 🎨 Color-coded markers based on broadcast power:
  - Red: High power (≥ 10 kW)
  - Orange: Medium power (≥ 1 kW)
  - Yellow: Low power (< 1 kW)
- 🗺️ Non-aerial terrain view for better geographic context
- 📱 Responsive design for desktop and mobile

## Prerequisites

- Node.js (v16 or higher)
- Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Geocoding API

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Maps JavaScript API and Geocoding API
   - Create credentials (API Key)
   - Restrict your API key (optional but recommended)

3. **Configure environment variables:**
   ```bash
   # Copy the example file
   copy .env.example .env
   
   # Edit .env and add your API key
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

1. **View Stations:** The map will load showing all AM radio stations from the data file
2. **Set Your Location:** Enter your 5-digit zip code and click "Set Location"
3. **Explore Stations:** 
   - Hover over markers to see station information
   - Click markers for a persistent info window
   - Distances from your location are shown when you've set a zip code
4. **Navigate:** Use standard Google Maps controls to zoom and pan

## Project Structure

```
amStationInfo/
├── src/
│   ├── components/
│   │   ├── StationMarker.jsx    # Individual station marker with hover info
│   │   └── LocationInput.jsx    # Zip code input component
│   ├── utils/
│   │   └── stationParser.js     # Parse station data and calculate distances
│   ├── App.jsx                  # Main application component
│   ├── App.css                  # Application styles
│   └── main.jsx                 # React entry point
├── amRadioSta.txt              # Station data file
├── index.html                  # HTML template
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies and scripts
└── .env                        # Environment variables (create this)
```

## Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` folder.

## Data Format

The application reads station data from `amRadioSta.txt`, which contains information about AM radio stations including call signs, frequencies, coordinates, broadcast power, and location details.

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **@vis.gl/react-google-maps** - Google Maps React components
- **Google Maps JavaScript API** - Map display and geocoding

## Troubleshooting

**Map not loading:**
- Verify your Google Maps API key is correct in `.env`
- Check that Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for errors

**Geocoding not working:**
- Ensure Geocoding API is enabled in Google Cloud Console
- Verify API key has permission for Geocoding API

**Stations not displaying:**
- Ensure `amRadioSta.txt` is in the root directory
- Check browser console for parsing errors

## License

MIT

## Credits

Station data sourced from FCC AM radio station database.
