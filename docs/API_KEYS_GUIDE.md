# BHUVISION // Complete Location & Spatial API Keys Guide
### Step-by-Step Acquisition Manual for Judges, Evaluators & Developers
**Smart India Hackathon 2026 // Problem Statement SIH26167**  
**Team:** BANKAI | **Mentorship:** ISRO | **Lead:** [@Ayushnot41](https://github.com/Ayushnot41)

---

## 🧭 Zero-Key Architecture (Runs Out-of-the-Box)

> [!NOTE]
> **No API Keys Required to Run!**  
> BHUVISION is engineered with a **Zero-Key Architecture**. If you don't enter any API keys, the system automatically uses:
> - **ESRI World Imagery (0.3m GSD):** High-resolution global satellite imagery.
> - **NASA GIBS NRT:** Daily optical true-color scans of Earth.
> - **OpenStreetMap Nominatim:** Global geocoding search across cities and coordinates.
> - **Synthetic Aperture Radar (SAR) Engine:** Physics-based polarimetric processing.
>
> However, adding the keys below unlocks **Google Photorealistic 3D Tiles, Real-Time Traffic Congestion vectors, and Copernicus live raw radar bands**.

---

## 1. Google Maps Platform (Satellite, 3D Tiles & Live Traffic)

### What it Unlocks in BHUVISION:
- **Live Traffic Layer:** Real-time road speeds, congestion heatmaps, and evacuation chokepoint bypass routing.
- **Photorealistic 3D Tiles:** Google's 3D building and terrain meshes.
- **Places Geocoding:** Auto-completing search for any landmark, street address, or village.

### Step-by-Step Guide to Get Your Free Key:
1. **Visit Google Cloud Console:**
   - Go to [https://console.cloud.google.com/](https://console.cloud.google.com/) and sign in with your Google account.
2. **Create a New Project:**
   - Click the project dropdown at the top of the page $\rightarrow$ Click **"New Project"**.
   - Project Name: `BHUVISION-Earth-Intelligence` $\rightarrow$ Click **"Create"**.
3. **Enable Required APIs:**
   - Go to **"APIs & Services"** $\rightarrow$ **"Library"**.
   - Search and enable each of these 4 free-tier APIs:
     - ✅ **Maps JavaScript API** (for interactive vector and satellite map rendering)
     - ✅ **Places API (New)** (for searching any global location or address)
     - ✅ **Routes API** or **Directions API** (for disaster evacuation routing)
     - ✅ **Elevation API** (for 3D mountain slope profiling)
4. **Generate Your API Key:**
   - Go to **"APIs & Services"** $\rightarrow$ **"Credentials"**.
   - Click **"+ CREATE CREDENTIALS"** $\rightarrow$ Select **"API key"**.
   - Copy the generated API key (it looks like `AIzaSyD...`).
5. **(Recommended) Restrict the Key:**
   - Under "API restrictions", select the 4 APIs enabled above to protect your quota.
   - Google provides **\$200 free monthly credit**, which covers over 28,000 map loads per month for free!

---

## 2. Mapbox GL Access Token (3D Terrain & Vector Overlays)

### What it Unlocks in BHUVISION:
- **Mapbox Terrain-DEM v1:** Real millimeter-scale 3D elevation mesh for terrain tilt.
- **High-contrast tactical vector styling:** Dark-matter map themes with custom military grid layers.

### Step-by-Step Guide to Get Your Free Token:
1. **Sign Up:**
   - Go to [https://account.mapbox.com/auth/signup/](https://account.mapbox.com/auth/signup/).
   - Create a free account (no credit card required).
2. **Copy Default Public Token:**
   - Navigate to your dashboard at [https://account.mapbox.com/](https://account.mapbox.com/).
   - Under **"Access Tokens"**, you will see your **Default public token** (starts with `pk.eyJ...`).
   - Click **Copy token**.
   - Free tier includes **50,000 free map loads per month**.

---

## 3. Copernicus Data Space Ecosystem (Sentinel-1 & Sentinel-2)

### What it Unlocks in BHUVISION:
- **Live Raw Sentinel-1 SAR COGs:** Unfiltered C-Band microwave radar interferometry pairs for flood analysis.
- **Live Raw Sentinel-2 Multi-Spectral Bands:** Raw NIR (Band 8) and Red (Band 4) for NDVI vegetation indices.

### Step-by-Step Guide to Get Your Free Access:
1. **Register on Copernicus Data Space:**
   - Go to [https://dataspace.copernicus.eu/](https://dataspace.copernicus.eu/).
   - Click **"Register"** at the top right and create a free account.
2. **Access Sentinel Hub API / CDSE OData API:**
   - Visit [https://shapps.dataspace.copernicus.eu/dashboard/](https://shapps.dataspace.copernicus.eu/dashboard/).
   - Go to **"User Settings"** $\rightarrow$ **"OAuth Clients"**.
   - Click **"Create Client"** $\rightarrow$ Give it name `BHUVISION`.
   - Copy your **Client ID** and **Client Secret**.

---

## 4. NASA Earthdata Login (GIBS Daily Optical & Wildfire VIIRS)

### What it Unlocks in BHUVISION:
- **Near-Real-Time Daily TrueColor:** Direct satellite feeds from NASA MODIS (Terra/Aqua) and VIIRS (Suomi NPP).
- **Active Wildfire Thermal Anomalies:** Direct infrared thermal spot detection.

### Step-by-Step Guide:
1. **Register for Free:**
   - Go to [https://urs.earthdata.nasa.gov/users/new](https://urs.earthdata.nasa.gov/users/new).
   - Enter username and password (free public access provided by NASA).
2. **Authorize GIBS Application:**
   - Under your profile, go to **"Applications"** $\rightarrow$ **"Authorized Apps"**.
   - Authorize `NASA GIBS WMTS`.

---

## 5. How to Configure Keys in BHUVISION

You have two convenient ways to enter your keys:

### Method A: Live In-App Settings Modal (Zero Restart Required)
1. Open BHUVISION at [http://localhost:8000/app](http://localhost:8000/app).
2. Click the **"API Key Settings"** button in the header.
3. Paste your **Google Maps API Key**, **Mapbox Access Token**, or **Sentinel Hub Key**.
4. Click **"Save & Apply Keys"**.
5. The status badge will instantly update to: `API Keys: Google Maps Active` without needing any server restart!

### Method B: Backend Configuration File (`backend/.env`)
Open `backend/.env` (or create it from `.env.example`) and add your keys:
```env
# Google Maps Platform
GOOGLE_MAPS_API_KEY=AIzaSyD...

# Mapbox GL Access Token
MAPBOX_ACCESS_TOKEN=pk.eyJ...

# Copernicus Sentinel Hub
COPERNICUS_CLIENT_ID=...
COPERNICUS_CLIENT_SECRET=...

# AI Gateways (FreeLLMAPI & OmniRoute)
OPENAI_BASE_URL=http://localhost:20128/v1
OPENAI_API_KEY=any_local_key
```

---

## 💡 Summary of API Limits & Costs

| Service | Free Monthly Quota | Credit Card Required? | What Happens When Limit Exceeded |
| :--- | :--- | :---: | :--- |
| **ESRI World Imagery** | Unlimited / Public | ❌ No | Never fails (Fallback) |
| **NASA GIBS NRT** | Unlimited / Public | ❌ No | Never fails (Fallback) |
| **Google Maps** | \$200 / month (~28,000 loads) | Yes (for signup verification) | Falls back to ESRI gracefully |
| **Mapbox GL** | 50,000 loads / month | ❌ No | Falls back to Leaflet ESRI |
| **Copernicus CDSE** | 10,000 requests / month | ❌ No | Uses cached BigEarthNet pairs |
