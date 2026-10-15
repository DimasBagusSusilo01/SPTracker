/**
 * HelioTrack - Solar Inverter Monitor
 * Data diambil dari Supabase, bukan simulasi.
 */

const SolarApp = {
  table: "inverter_logs",
  timestampColumn: "created_at",
  client: null,
  latestData: null,
  realtimeChannel: null,
  refreshTimer: null,

  metrics: [
    { key: "pv_voltage", label: "PV Voltage", unit: "V" },
    { key: "output_voltage", label: "Output Voltage", unit: "V" },
    { key: "battery_voltage", label: "Battery Voltage", unit: "V" },
    { key: "battery_capacity", label: "Battery Capacity", unit: "%" },
    { key: "controller_temp", label: "Controller Temperature", unit: "°C" },
    { key: "inverter_temp", label: "Inverter Temperature", unit: "°C" },
    { key: "load_percentage", label: "Load Percentage", unit: "%" },
    {
      key: "controller_charging_curr",
      label: "Controller Charging Current",
      unit: "A"
    }
  ],

  init() {
    this.applyTheme(
      localStorage.getItem("heliotrack_theme") || "dark"
    );

    this.setupNavigation();
    this.prepareDashboard();
    this.bindEvents();
    this.connectSupabase();
  },

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("heliotrack_theme", theme);

    const select = document.getElementById("theme-select");
    if (select) select.value = theme;
  },

  setupNavigation() {
    const isSettings =
      window.location.pathname.endsWith("settings.html");

    const home = document.getElementById("nav-home");
    const settings = document.getElementById("nav-settings");

    if (home) home.classList.toggle("active", !isSettings);
    if (settings) settings.classList.toggle("active", isSettings);
  },

  prepareDashboard() {
    const grid = document.querySelector(".summary-grid");
    if (!grid) {
      console.error("Elemen .summary-grid tidak ditemukan.");
      return;
    }

    grid.classList.add("telemetry-grid");

    // Hilangkan informasi simulasi yang tidak berasal dari database.
    document.querySelectorAll(
      ".health-system-card, .weather-card, .production-card"
    ).forEach(element => element.remove());

    // Buat area status inverter.
    let panel = document.getElementById("inverter-status-panel");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "inverter-status-panel";
      panel.className = "inverter-status-panel";

      panel.innerHTML = `
        <div class="status-heading">
          <span>Status Operasi Sistem</span>
          <span id="inverter-updated">Menunggu data</span>
        </div>

        <div id="inverter-operating-status">
          Menghubungkan ke Supabase...
        </div>

        <div id="inverter-timestamp"></div>

        <details id="inverter-raw-details" hidden>
          <summary>Lihat data mentah</summary>
          <pre id="inverter-raw-text"></pre>
        </details>
      `;

      grid.parentElement.appendChild(panel);
    }

    this.addStyles();
    this.renderEmpty();
  },

  addStyles() {
    if (document.getElementById("inverter-styles")) return;

    const style = document.createElement("style");
    style.id = "inverter-styles";

    style.textContent = `
      .telemetry-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .telemetry-grid .summary-card {
        min-width: 0;
      }

      .telemetry-grid .metric-label {
        white-space: normal;
        line-height: 1.4;
      }

      .telemetry-grid .metric-val {
        overflow-wrap: anywhere;
        font-variant-numeric: tabular-nums;
      }

      .inverter-status-panel {
        margin-top: 16px;
        padding: 16px;
        border: 1px solid var(--border-color, #2d493c);
        border-radius: 14px;
        background: var(--card-bg, #15251d);
      }

      .status-heading {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: var(--text-dim, #a0afa6);
        font-size: .85rem;
        margin-bottom: 10px;
      }

      #inverter-operating-status {
        font-size: 1.1rem;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      #inverter-timestamp,
      #inverter-updated {
        font-size: .8rem;
        color: var(--text-dim, #a0afa6);
      }

      #inverter-timestamp {
        margin-top: 8px;
      }

      #inverter-raw-details {
        margin-top: 14px;
        font-size: .85rem;
      }

      #inverter-raw-text {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        max-height: 250px;
        overflow: auto;
      }

      @media (min-width: 720px) {
        .telemetry-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
      }

      @media (max-width: 360px) {
        .telemetry-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  },

  renderEmpty(message = "Menunggu data...") {
    const grid = document.querySelector(".summary-grid");
    if (!grid) return;

    grid.innerHTML = "";

    this.metrics.forEach(metric => {
      const card = document.createElement("div");
      card.className = "summary-card";

      const label = document.createElement("div");
      label.className = "metric-label";
      label.textContent = metric.label;

      const value = document.createElement("div");
      value.className = "metric-val";
      value.textContent = "—";

      const unit = document.createElement("span");
      unit.textContent = ` ${metric.unit}`;

      const sub = document.createElement("div");
      sub.className = "metric-sub";
      sub.textContent = "Data Supabase";

      card.append(label, value, unit, sub);
      grid.appendChild(card);
    });

    const status = document.getElementById("inverter-operating-status");
    if (status) status.textContent = message;
  },

  formatValue(value) {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number.toLocaleString("id-ID", {
          maximumFractionDigits: 2
        })
      : String(value);
  },

  renderData(data) {
    if (!data) {
      this.renderEmpty("Belum ada data inverter.");
      return;
    }

    this.latestData = data;

    const grid = document.querySelector(".summary-grid");
    if (!grid) return;

    grid.innerHTML = "";

    this.metrics.forEach(metric => {
      const card = document.createElement("div");
      card.className = "summary-card";

      const label = document.createElement("div");
      label.className = "metric-label";
      label.textContent = metric.label;

      const valueRow = document.createElement("div");
      valueRow.className = "metric-value-row";

      const value = document.createElement("span");
      value.className = "metric-val";
      value.textContent = this.formatValue(data[metric.key]);

      const unit = document.createElement("span");
      unit.className = "metric-unit";
      unit.textContent = ` ${metric.unit}`;

      const sub = document.createElement("div");
      sub.className = "metric-sub";
      sub.textContent = "Data Supabase";

      valueRow.append(value, unit);
      card.append(label, valueRow, sub);
      grid.appendChild(card);
    });

    const status = document.getElementById(
      "inverter-operating-status"
    );

    if (status) {
      status.textContent =
        data.operating_status ?? "Status tidak tersedia";
    }

    const timestamp = data[this.timestampColumn];

    const timestampElement = document.getElementById(
      "inverter-timestamp"
    );

    if (timestampElement) {
      if (timestamp) {
        const date = new Date(timestamp);

        timestampElement.textContent =
          "Waktu data: " +
          (Number.isNaN(date.getTime())
            ? timestamp
            : date.toLocaleString("id-ID"));
      } else {
        timestampElement.textContent =
          "Kolom waktu tidak tersedia.";
      }
    }

    const updated = document.getElementById("inverter-updated");

    if (updated) {
      updated.textContent =
        "Diperbarui " +
        new Date().toLocaleTimeString("id-ID");
    }

    const rawDetails = document.getElementById(
      "inverter-raw-details"
    );

    const rawText = document.getElementById("inverter-raw-text");

    if (rawDetails && rawText && data.raw_text) {
      rawDetails.hidden = false;
      rawText.textContent = data.raw_text;
    } else if (rawDetails) {
      rawDetails.hidden = true;
    }
  },

  async connectSupabase() {
    // Memakai client yang sudah dibuat auth.js.
    //this.client = window.HelioAuth?.initClient?.();
    
    this.client = typeof HelioAuth !== "undefined" ? HelioAuth.initClient() : null;

    if (!this.client) {
      this.showError(
        "Client Supabase tidak tersedia. Periksa auth.js."
      );
      return;
    }

    // Ambil data awal.
    await this.fetchLatest();

    // Dengarkan perubahan database secara realtime.
    this.realtimeChannel = this.client
      .channel("inverter-logs-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: this.table
        },
        () => this.fetchLatest()
      )
      .subscribe(status => {
        console.log("Status Supabase Realtime:", status);
      });

    // Cadangan: cek ulang setiap 30 detik.
    // Berguna ketika Realtime belum diaktifkan.
    this.refreshTimer = setInterval(
      () => this.fetchLatest(),
      30000
    );
  },

  async fetchLatest() {
    if (!this.client) return;

    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .order(this.timestampColumn, { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        this.renderEmpty("Belum ada record di tabel database.");
        return;
      }

      this.renderData(data[0]);
    } catch (error) {
      console.error("Gagal mengambil telemetry:", error);

      this.showError(
        "Gagal membaca data Supabase: " + error.message
      );
    }
  },

  showError(message) {
    const status = document.getElementById(
      "inverter-operating-status"
    );

    if (status) {
      status.textContent = message;
      status.style.color = "#ef4444";
    }

    console.error("[SolarApp]", message);
  },

  downloadJSON() {
    if (!this.latestData) {
      alert("Belum ada data untuk diekspor.");
      return;
    }

    this.downloadFile(
      JSON.stringify(this.latestData, null, 2),
      "inverter-data.json",
      "application/json"
    );
  },

  downloadCSV() {
    if (!this.latestData) {
      alert("Belum ada data untuk diekspor.");
      return;
    }

    const data = this.latestData;
    const columns = Object.keys(data);

    const escapeCSV = value =>
      '"' +
      String(value ?? "").replace(/"/g, '""') +
      '"';

    const csv = [
      columns.map(escapeCSV).join(","),
      columns.map(key => escapeCSV(data[key])).join(",")
    ].join("\r\n");

    this.downloadFile(
      csv,
      "inverter-data.csv",
      "text/csv;charset=utf-8"
    );
  },

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  bindEvents() {
    const themeSelect = document.getElementById("theme-select");

    if (themeSelect) {
      themeSelect.value =
        localStorage.getItem("heliotrack_theme") || "dark";

      themeSelect.addEventListener("change", event => {
        this.applyTheme(event.target.value);
      });
    }

    const csvButton = document.getElementById("btn-export-csv");
    if (csvButton) {
      csvButton.addEventListener("click", () => {
        this.downloadCSV();
      });
    }

    const jsonButton = document.getElementById("btn-export-json");
    if (jsonButton) {
      jsonButton.addEventListener("click", () => {
        this.downloadJSON();
      });
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  SolarApp.init();
});
