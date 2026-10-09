# HelioTrack - Smart Solar Panel Tracker Web App

A modern, responsive green-themed web application for monitoring and configuring dual-axis solar panel tracking systems. Designed with a mobile-first UI tailored for smartphone displays while adapting seamlessly to tablets and desktop screens.

## Project Structure

- **[index.html](file:///home/dimas/solar-panel-tracker/index.html)**: The Home dashboard page.
  - **Title & Live Tracker Header**: Displays active array identification and live telemetry tracking status.
  - **Summary**: Real-time cards for **Power** (kW), **Voltage** (V), **Current** (A), and **Irradiance** (W/m²).
  - **Solar Panel Health System**: Visual health score (98.4%), live dual-axis compass/needle visualizer for Azimuth and Tilt angles, cell temperature, and inverter efficiency.
  - **Weather**: Real-time ambient solar conditions (UV index, cloud cover, wind speed) and daylight sun-arc progression.
  - **Today's Productions**: Daily yield metric (kWh), carbon offset impact (CO2 saved & tree equivalent), and interactive SVG hourly production curve chart.
  - **Bottom Navigation**: Fast phone-friendly navigation between Home and Settings.

- **[settings.html](file:///home/dimas/solar-panel-tracker/settings.html)**: The System Configuration page.
  - **Account**: User profile, tier, and interactive profile editor modal.
  - **Language**: Language switcher (English, Bahasa Indonesia, Español).
  - **Panel Tracking**: Tracking modes (Dual-Axis Auto, Single-Axis, Storm Stow 0°), Night Return toggle, and manual jog motor controls.
  - **Device**: ESP32-S3 MCU and Sungrow inverter status, with interactive Controller Reboot simulator.
  - **Notifications**: Fault alerts and daily yield digest switches.
  - **Data & Storage**: Telemetry cache gauge, with functional CSV and JSON log export buttons.
  - **Interface**: Eco Dark Forest vs. Mint Crisp Light theme toggle, and temperature unit selection (°C/°F).
  - **About Us**: System version, mission statement, and clean-tech specifications.

- **[style.css](file:///home/dimas/solar-panel-tracker/style.css)**: Emerald & Forest Green color scheme, responsive flex/grid layouts, card components, animations, and dark/light mode CSS variables.
- **[app.js](file:///home/dimas/solar-panel-tracker/app.js)**: Live sensor telemetry fluctuations, interactive chart plotting, export generation, and settings event handlers.

## How to Run

### Method 1: Direct in Browser
Open `index.html` or `settings.html` directly in your web browser:
```bash
xdg-open /home/dimas/solar-panel-tracker/index.html
```

### Method 2: Local Web Server
Run Python's built-in HTTP server:
```bash
python3 -m http.server 8080 --directory /home/dimas/solar-panel-tracker
```
Then visit: `http://localhost:8080`
