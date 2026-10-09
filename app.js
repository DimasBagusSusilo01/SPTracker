/**
 * HelioTrack - Solar Panel Tracker Client Application
 */

// State Management
const SolarApp = {
  state: {
    power: 4.82,       // kW
    voltage: 385.4,    // V
    current: 12.5,     // A
    irradiance: 895,   // W/m²
    azimuth: 142.0,    // deg
    elevation: 34.5,   // deg
    healthScore: 98,   // %
    cellTemp: 41.2,    // °C
    inverterEff: 97.8, // %
    totalProduced: 34.8, // kWh
    co2Offset: 24.6,   // kg
    mode: 'auto',      // auto | single | manual | stow
    theme: localStorage.getItem('heliotrack_theme') || 'dark',
    lang: localStorage.getItem('heliotrack_lang') || 'en',
    units: 'kw',
  },

  // Translations dictionary
  i18n: {
    en: {
      title: "HelioTrack",
      subtitle: "Dual-Axis Solar Tracker",
      liveActive: "TRACKING ACTIVE",
      home: "Home",
      settings: "Settings",
      power: "Power",
      voltage: "Voltage",
      current: "Current",
      irradiance: "Irradiance",
      healthSystem: "Solar Health System",
      overallHealth: "Overall Array Health",
      optimal: "Optimal Performance",
      azimuth: "Azimuth Angle",
      elevation: "Tilt / Elevation",
      weatherTitle: "Solar Weather & Sky",
      todayProd: "Today's Productions",
      co2Saved: "CO2 Offset",
      treesEquiv: "Trees Planted",
      toastMode: "Tracking mode changed to",
      toastExportCSV: "Exported telemetry CSV log",
      toastExportJSON: "Exported telemetry JSON log",
      toastReboot: "Controller reboot initiated...",
      toastSaved: "Settings saved successfully"
    },
    id: {
      title: "HelioTrack",
      subtitle: "Pelacak Panel Surya Dual-Axis",
      liveActive: "PELACAK AKTIF",
      home: "Beranda",
      settings: "Pengaturan",
      power: "Daya",
      voltage: "Tegangan",
      current: "Arus",
      irradiance: "Iradiasi",
      healthSystem: "Sistem Kesehatan Panel",
      overallHealth: "Kondisi Panel Keseluruhan",
      optimal: "Performa Optimal",
      azimuth: "Sudut Azimuth",
      elevation: "Sudut Kemiringan / Elevasi",
      weatherTitle: "Cuaca & Kondisi Langit",
      todayProd: "Produksi Energi Hari Ini",
      co2Saved: "Emisi CO2 Berkurang",
      treesEquiv: "Setara Pohon Ditanam",
      toastMode: "Mode pelacakan diubah ke",
      toastExportCSV: "Berhasil mengunduh log CSV telemetri",
      toastExportJSON: "Berhasil mengunduh log JSON telemetri",
      toastReboot: "Memulai restart controller...",
      toastSaved: "Pengaturan berhasil disimpan"
    },
    es: {
      title: "HelioTrack",
      subtitle: "Seguidor Solar de Doble Eje",
      liveActive: "SEGUIMIENTO ACTIVO",
      home: "Inicio",
      settings: "Ajustes",
      power: "Potencia",
      voltage: "Voltaje",
      current: "Corriente",
      irradiance: "Irradiancia",
      healthSystem: "Salud del Sistema Solar",
      overallHealth: "Estado General del Módulo",
      optimal: "Rendimiento Óptimo",
      azimuth: "Ángulo de Azimut",
      elevation: "Elevación / Inclinación",
      weatherTitle: "Clima y Cielo Solar",
      todayProd: "Producción de Hoy",
      co2Saved: "CO2 Ahorrado",
      treesEquiv: "Árboles Equivalentes",
      toastMode: "Modo de seguimiento cambiado a",
      toastExportCSV: "Registro CSV exportado",
      toastExportJSON: "Registro JSON exportado",
      toastReboot: "Reinicio del controlador iniciado...",
      toastSaved: "Ajustes guardados con éxito"
    }
  },

  init() {
    this.applyTheme(this.state.theme);
    this.setupNavigation();
    this.setupChart();
    this.startSimulation();
    this.bindEvents();
    this.updateUI();
  },

  applyTheme(theme) {
    this.state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('heliotrack_theme', theme);
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) themeSelect.value = theme;
  },

  showToast(message, icon = '✓') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="color: var(--green-accent); font-weight: bold;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  setupNavigation() {
    // Detect current page from URL
    const isSettings = window.location.pathname.endsWith('settings.html') || window.location.hash === '#settings';
    const navHome = document.getElementById('nav-home');
    const navSettings = document.getElementById('nav-settings');
    
    if (navHome && navSettings) {
      if (isSettings) {
        navHome.classList.remove('active');
        navSettings.classList.add('active');
      } else {
        navHome.classList.add('active');
        navSettings.classList.remove('active');
      }
    }
  },

  // Fluctuate telemetry smoothly to simulate live tracking & generation
  startSimulation() {
    setInterval(() => {
      // Small realistic fluctuations
      const deltaPower = (Math.random() - 0.48) * 0.06;
      this.state.power = Math.max(3.2, Math.min(5.6, this.state.power + deltaPower));
      
      const deltaVoltage = (Math.random() - 0.5) * 0.8;
      this.state.voltage = Math.max(370, Math.min(410, this.state.voltage + deltaVoltage));
      
      this.state.current = (this.state.power * 1000) / this.state.voltage;

      const deltaIrradiance = (Math.random() - 0.48) * 4;
      this.state.irradiance = Math.round(Math.max(750, Math.min(980, this.state.irradiance + deltaIrradiance)));

      // Slight angle tracking adjustment (0.05 deg per tick in auto mode)
      if (this.state.mode === 'auto') {
        this.state.azimuth = +(this.state.azimuth + 0.02).toFixed(1);
        if (this.state.azimuth > 260) this.state.azimuth = 95.0; // cycle day
      }

      this.updateUI();
    }, 2800);
  },

  updateUI() {
    // Elements on Home
    const elPower = document.getElementById('val-power');
    const elVoltage = document.getElementById('val-voltage');
    const elCurrent = document.getElementById('val-current');
    const elIrradiance = document.getElementById('val-irradiance');
    const elAzimuth = document.getElementById('val-azimuth');
    const elElevation = document.getElementById('val-elevation');
    const elNeedle = document.getElementById('azimuth-needle');
    const elElevationNeedle = document.getElementById('elevation-needle');
    const elCellTemp = document.getElementById('val-cell-temp');

    if (elPower) elPower.textContent = this.state.power.toFixed(2);
    if (elVoltage) elVoltage.textContent = this.state.voltage.toFixed(1);
    if (elCurrent) elCurrent.textContent = this.state.current.toFixed(2);
    if (elIrradiance) elIrradiance.textContent = Math.round(this.state.irradiance);
    if (elAzimuth) elAzimuth.textContent = `${this.state.azimuth.toFixed(1)}° SE`;
    if (elElevation) elElevation.textContent = `${this.state.elevation.toFixed(1)}°`;
    if (elCellTemp) elCellTemp.textContent = `${this.state.cellTemp.toFixed(1)}°C`;

    if (elNeedle) {
      elNeedle.style.transform = `rotate(${this.state.azimuth}deg)`;
    }
    if (elElevationNeedle) {
      elElevationNeedle.style.transform = `rotate(${this.state.elevation}deg)`;
    }
  },

  setupChart() {
    const svg = document.getElementById('production-curve-svg');
    if (!svg) return;

    // Hourly generation curve points (06:00 to 18:00)
    const points = [
      { time: '06:00', kw: 0.1 },
      { time: '07:00', kw: 0.6 },
      { time: '08:00', kw: 1.8 },
      { time: '09:00', kw: 2.9 },
      { time: '10:00', kw: 3.8 },
      { time: '11:00', kw: 4.5 },
      { time: '12:00', kw: 5.1 },
      { time: '13:00', kw: 5.2 }, // Peak
      { time: '14:00', kw: 4.7 },
      { time: '15:00', kw: 3.9 },
      { time: '16:00', kw: 2.4 },
      { time: '17:00', kw: 1.1 },
      { time: '18:00', kw: 0.2 },
    ];

    const width = 360;
    const height = 140;
    const paddingX = 15;
    const paddingY = 20;

    const maxKw = 6.0;

    const getX = (index) => paddingX + (index / (points.length - 1)) * (width - 2 * paddingX);
    const getY = (val) => height - paddingY - (val / maxKw) * (height - 2 * paddingY);

    // Build smooth SVG path
    let pathD = `M ${getX(0)},${getY(points[0].kw)}`;
    for (let i = 1; i < points.length; i++) {
      const prevX = getX(i - 1);
      const prevY = getY(points[i - 1].kw);
      const curX = getX(i);
      const curY = getY(points[i].kw);
      const cpX1 = prevX + (curX - prevX) / 2;
      const cpY1 = prevY;
      const cpX2 = cpX1;
      const cpY2 = curY;
      pathD += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${curX},${curY}`;
    }

    const areaD = `${pathD} L ${getX(points.length - 1)},${height - paddingY} L ${getX(0)},${height - paddingY} Z`;

    const areaPath = document.getElementById('chart-area-path');
    const linePath = document.getElementById('chart-line-path');
    const dotsContainer = document.getElementById('chart-dots-group');

    if (areaPath) areaPath.setAttribute('d', areaD);
    if (linePath) linePath.setAttribute('d', pathD);

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      points.forEach((p, idx) => {
        const cx = getX(idx);
        const cy = getY(p.kw);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', '3.5');
        circle.setAttribute('fill', '#10b981');
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '1.5');
        circle.setAttribute('class', 'chart-dot');
        circle.style.cursor = 'pointer';

        circle.addEventListener('mouseenter', () => {
          circle.setAttribute('r', '6');
          SolarApp.showToast(`${p.time}: ${p.kw} kW produced`, '☀️');
        });
        circle.addEventListener('mouseleave', () => {
          circle.setAttribute('r', '3.5');
        });

        dotsContainer.appendChild(circle);
      });
    }
  },

  bindEvents() {
    // Theme select change
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.applyTheme(e.target.value);
        this.showToast(`Theme changed to ${e.target.value}`, '🎨');
      });
    }

    // Language select change
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.value = this.state.lang;
      langSelect.addEventListener('change', (e) => {
        this.state.lang = e.target.value;
        localStorage.setItem('heliotrack_lang', this.state.lang);
        const t = this.i18n[this.state.lang] || this.i18n.en;
        this.showToast(`${t.toastSaved} (${e.target.value.toUpperCase()})`, '🌐');
      });
    }

    // Tracking mode buttons
    const modeButtons = document.querySelectorAll('[data-track-mode]');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('btn-primary'));
        modeButtons.forEach(b => b.classList.add('btn-outline'));
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');

        const mode = btn.getAttribute('data-track-mode');
        this.state.mode = mode;
        const t = this.i18n[this.state.lang] || this.i18n.en;
        this.showToast(`${t.toastMode} ${btn.textContent.trim()}`, '🔄');
      });
    });

    // Manual jog controls
    const btnJogLeft = document.getElementById('jog-left');
    const btnJogRight = document.getElementById('jog-right');
    const btnJogUp = document.getElementById('jog-up');
    const btnJogDown = document.getElementById('jog-down');

    if (btnJogLeft) {
      btnJogLeft.addEventListener('click', () => {
        this.state.azimuth = Math.max(0, this.state.azimuth - 2.5);
        this.updateUI();
        this.showToast(`Azimuth set to ${this.state.azimuth.toFixed(1)}°`, '🧭');
      });
    }
    if (btnJogRight) {
      btnJogRight.addEventListener('click', () => {
        this.state.azimuth = Math.min(360, this.state.azimuth + 2.5);
        this.updateUI();
        this.showToast(`Azimuth set to ${this.state.azimuth.toFixed(1)}°`, '🧭');
      });
    }
    if (btnJogUp) {
      btnJogUp.addEventListener('click', () => {
        this.state.elevation = Math.min(90, this.state.elevation + 2.0);
        this.updateUI();
        this.showToast(`Tilt set to ${this.state.elevation.toFixed(1)}°`, '📐');
      });
    }
    if (btnJogDown) {
      btnJogDown.addEventListener('click', () => {
        this.state.elevation = Math.max(0, this.state.elevation - 2.0);
        this.updateUI();
        this.showToast(`Tilt set to ${this.state.elevation.toFixed(1)}°`, '📐');
      });
    }

    // Export CSV
    const btnExportCSV = document.getElementById('btn-export-csv');
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => {
        this.downloadCSV();
      });
    }

    // Export JSON
    const btnExportJSON = document.getElementById('btn-export-json');
    if (btnExportJSON) {
      btnExportJSON.addEventListener('click', () => {
        this.downloadJSON();
      });
    }

    // Reboot MCU
    const btnReboot = document.getElementById('btn-reboot-device');
    if (btnReboot) {
      btnReboot.addEventListener('click', () => {
        const t = this.i18n[this.state.lang] || this.i18n.en;
        this.showToast(t.toastReboot, '⚡');
        btnReboot.disabled = true;
        btnReboot.textContent = 'Rebooting...';
        setTimeout(() => {
          btnReboot.disabled = false;
          btnReboot.textContent = 'Reboot Controller';
          this.showToast('ESP32 Controller Online (0 errors)', '✅');
        }, 3000);
      });
    }

    // Calibrate Self-test button
    const btnSelfTest = document.getElementById('btn-self-test');
    if (btnSelfTest) {
      btnSelfTest.addEventListener('click', () => {
        this.showToast('Running dual-axis optical sensor & motor test...', '⚙️');
        setTimeout(() => {
          this.showToast('Test complete: 100% alignment accuracy', '✅');
        }, 2000);
      });
    }

    // Edit Profile Modal
    const btnEditProfile = document.getElementById('btn-edit-profile');
    const modalProfile = document.getElementById('profile-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSaveProfile = document.getElementById('btn-save-profile');

    if (btnEditProfile && modalProfile) {
      btnEditProfile.addEventListener('click', () => {
        modalProfile.classList.add('active');
      });
    }

    if (btnCloseModal && modalProfile) {
      btnCloseModal.addEventListener('click', () => {
        modalProfile.classList.remove('active');
      });
    }

    if (btnSaveProfile && modalProfile) {
      btnSaveProfile.addEventListener('click', () => {
        const inputName = document.getElementById('edit-profile-name');
        const displayName = document.getElementById('user-display-name');
        if (inputName && displayName && inputName.value.trim() !== '') {
          displayName.textContent = inputName.value.trim();
        }
        modalProfile.classList.remove('active');
        this.showToast('Profile updated successfully!', '👤');
      });
    }
  },

  downloadCSV() {
    const timestamp = new Date().toISOString();
    const rows = [
      ["Timestamp", "Power (kW)", "Voltage (V)", "Current (A)", "Irradiance (W/m2)", "Azimuth (deg)", "Elevation (deg)", "Cell Temp (C)"],
      [timestamp, this.state.power.toFixed(2), this.state.voltage.toFixed(1), this.state.current.toFixed(2), this.state.irradiance, this.state.azimuth.toFixed(1), this.state.elevation.toFixed(1), this.state.cellTemp.toFixed(1)],
      [new Date(Date.now() - 3600000).toISOString(), "4.21", "382.1", "11.01", "840", "138.2", "32.0", "39.8"],
      [new Date(Date.now() - 7200000).toISOString(), "3.65", "378.4", "9.64", "760", "125.4", "28.5", "37.5"]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `heliotrack_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    const t = this.i18n[this.state.lang] || this.i18n.en;
    this.showToast(t.toastExportCSV, '📊');
  },

  downloadJSON() {
    const data = {
      device: "HelioTrack Dual-Axis Tracker v2.4",
      exportedAt: new Date().toISOString(),
      currentState: this.state,
      arrayHealth: {
        score: this.state.healthScore,
        inverterEfficiency: this.state.inverterEff,
        cellTemperature: this.state.cellTemp,
        trackingMotors: "Calibrated & Active"
      }
    };

    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `heliotrack_config_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    const t = this.i18n[this.state.lang] || this.i18n.en;
    this.showToast(t.toastExportJSON, '📦');
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  SolarApp.init();
});
