/**
 * HelioTrack - Supabase Authentication & Database Integration
 * 
 * Silakan isi data kredensial Supabase di bawah ini.
 * Saat ini dibiarkan titik-titik ('...') sesuai instruksi.
 */

// ==============================================================================
// 1. SUPABASE CONFIGURATION
// Ganti nilai '...' di bawah ini dengan URL & Public Anon Key Supabase Anda
// ==============================================================================
const SUPABASE_URL = 'https://cnitfsuiskyxhmcpwgsa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuaXRmc3Vpc2t5eGhtY3B3Z3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3Mjk0MzAsImV4cCI6MjEwNjMwNTQzMH0.Y70BsCBB9X6fs7SFfAVfmoniHQKF9l43eoLBJ6Gss9g';

// ==============================================================================
// 2. INITIALIZATION & HELPER METHODS
// ==============================================================================
const HelioAuth = {
  client: null,

  /**
   * Memeriksa apakah kredensial Supabase sudah diisi atau masih titik-titik ('...')
   */
  isConfigured() {
    return (
      typeof SUPABASE_URL === 'string' &&
      SUPABASE_URL.trim() !== '' &&
      SUPABASE_URL.trim() !== '...' &&
      SUPABASE_URL.startsWith('http') &&
      typeof SUPABASE_ANON_KEY === 'string' &&
      SUPABASE_ANON_KEY.trim() !== '' &&
      SUPABASE_ANON_KEY.trim() !== '...'
    );
  },

  /**
   * Menginisialisasi instance Supabase JS Client
   */
  initClient() {
    if (this.client) return this.client;

    if (this.isConfigured()) {
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        try {
          this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          console.log('[HelioAuth] Supabase client berhasil diinisialisasi.');
        } catch (err) {
          console.error('[HelioAuth] Gagal menginisialisasi Supabase client:', err);
        }
      } else {
        console.warn('[HelioAuth] Supabase JS SDK belum dimuat di halaman.');
      }
    } else {
      console.info("[HelioAuth] Kredensial Supabase masih berupa placeholder ('...'). Menunggu pengisian API Key.");
    }
    return this.client;
  },

  /**
   * Algoritma Pengecekan Database Supabase
   * Mengambil metadata user atau record dari tabel database jika tersedia
   */
  async checkDatabaseUser(userId) {
    if (!this.initClient() || !userId) return null;

    try {
      // 1. Coba query ke tabel 'profiles' atau 'users' jika dibuat di Supabase
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('[HelioAuth] Pengecekan tabel profiles dilewati:', err.message);
    }
    return null;
  },

  /**
   * Algoritma Login / Sign In
   */
  async signIn(email, password) {
    if (!email || !password) {
      return { success: false, error: 'Email dan password wajib diisi.' };
    }

    // Jika Supabase belum dikonfigurasi (masih '...')
    if (!this.isConfigured()) {
      return {
        success: false,
        isConfigPending: true,
        error: "Supabase URL & Anon Key masih titik-titik ('...'). Silakan isi kredensial di auth.js untuk menghubungkan ke Supabase, atau gunakan 'Masuk Mode Demo'."
      };
    }

    const client = this.initClient();
    if (!client) {
      return { success: false, error: 'Gagal menghubungkan ke Supabase client.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Lakukan pengecekan database tambahan
      let dbProfile = null;
      if (data && data.user) {
        dbProfile = await this.checkDatabaseUser(data.user.id);
        
        // Simpan sesi lokal untuk sinkronisasi antarmuka
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: (dbProfile && (dbProfile.full_name || dbProfile.name)) || 
                (data.user.user_metadata && data.user.user_metadata.full_name) || 
                data.user.email.split('@')[0],
          isDemo: false
        };
        localStorage.setItem('heliotrack_user', JSON.stringify(userData));
      }

      return { success: true, user: data.user, session: data.session, profile: dbProfile };
    } catch (err) {
      return { success: false, error: err.message || 'Terjadi kesalahan saat masuk.' };
    }
  },

  /**
   * Algoritma Sign In with Google OAuth
   */
  async signInWithGoogle() {
    if (!this.isConfigured()) {
      return {
        success: false,
        isConfigPending: true,
        error: "Supabase URL & Anon Key masih titik-titik ('...'). Silakan isi kredensial di auth.js untuk menghubungkan ke Supabase Google Auth."
      };
    }

    if (window.location.protocol === 'file:') {
      return {
        success: false,
        error: "Google OAuth memerlukan protokol web (HTTP/HTTPS). Pastikan aplikasi diakses melalui web hosting atau server yang aktif."
      };
    }

    const client = this.initClient();
    if (!client) {
      return { success: false, error: 'Gagal menghubungkan ke Supabase client.' };
    }

    try {
      // URL redirect otomatis menyesuaikan ke homepage.html di domain deploy saat ini
      const redirectTarget = new URL('homepage.html', window.location.href).href;

      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTarget
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Terjadi kesalahan saat otentikasi Google.' };
    }
  },

  /**
   * Algoritma Registrasi / Sign Up
   */
  async signUp(email, password, fullName) {
    if (!email || !password) {
      return { success: false, error: 'Email dan password wajib diisi.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter.' };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        isConfigPending: true,
        error: "Supabase URL & Anon Key masih titik-titik ('...'). Silakan isi kredensial di auth.js untuk melakukan pendaftaran akun baru di database."
      };
    }

    const client = this.initClient();
    if (!client) {
      return { success: false, error: 'Gagal menghubungkan ke Supabase client.' };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName ? fullName.trim() : ''
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Cek apakah user otomatis mendapatkan sesi atau memerlukan konfirmasi email
      if (data && data.session) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: fullName || data.user.email.split('@')[0],
          isDemo: false
        };
        localStorage.setItem('heliotrack_user', JSON.stringify(userData));
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        needsEmailConfirmation: !data.session
      };
    } catch (err) {
      return { success: false, error: err.message || 'Terjadi kesalahan saat registrasi.' };
    }
  },

  /**
   * Mode Demo / Bypass (Untuk pengujian sebelum API Key diisi)
   */
  loginDemo(email = 'dimas@heliotrack.io', name = 'Dimas Bagus Susilo') {
    const demoUser = {
      id: 'demo-user-12345',
      email: email,
      name: name,
      isDemo: true
    };
    localStorage.setItem('heliotrack_user', JSON.stringify(demoUser));
    return { success: true, user: demoUser };
  },

  /**
   * Logout / Sign Out
   */
  async signOut() {
    const client = this.initClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('[HelioAuth] Supabase signOut error:', e);
      }
    }
    localStorage.removeItem('heliotrack_user');
    window.location.href = 'index.html';
  },

  /**
   * Mendapatkan sesi user saat ini (Supabase session atau demo session)
   */
  async getSession() {
    const client = this.initClient();
    if (client) {
      try {
        const { data, error } = await client.auth.getSession();
        if (!error && data && data.session) {
          return { active: true, session: data.session, user: data.session.user };
        }
      } catch (e) {
        console.warn('[HelioAuth] getSession error:', e);
      }
    }

    // Cek fallback localStorage jika ada sesi demo atau data tersimpan
    const localUser = localStorage.getItem('heliotrack_user');
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        return { active: true, session: null, user: parsed };
      } catch (e) {
        localStorage.removeItem('heliotrack_user');
      }
    }

    return { active: false, session: null, user: null };
  },

  /**
   * Route Guard untuk Halaman Dashboard (homepage.html & settings.html)
   * Jika tidak ada sesi aktif, alihkan ke index.html
   */
  async protectPage() {
    // Sinkronkan tema dari localStorage
    const savedTheme = localStorage.getItem('heliotrack_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const { active, user } = await this.getSession();

    // Jika Supabase sudah dikonfigurasi dan user belum login
    if (!active) {
      // Jika kredensial sudah aktif tapi belum login, arahkan ke login
      if (this.isConfigured()) {
        window.location.href = 'index.html';
        return;
      }
      // Jika kredensial masih titik-titik dan belum login demo, kita tetap perbolehkan
      // atau arahkan ke index.html agar user bisa melihat form login
    }

    // Perbarui nama profil di antarmuka jika elemen tersedia
    this.hydrateUserInterface(user);
    this.bindLogoutButtons();
  },

  /**
   * Mengisi elemen nama user di UI
   */
  hydrateUserInterface(user) {
    if (!user) return;
    const displayName = user.name || (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || (user.email ? user.email.split('@')[0] : 'User');
    const displayEmail = user.email || 'user@heliotrack.io';

    const nameEl = document.getElementById('user-display-name');
    if (nameEl) nameEl.textContent = displayName;

    const emailEl = document.getElementById('user-display-email');
    if (emailEl) emailEl.textContent = displayEmail;

    const avatarPill = document.getElementById('account-avatar-pill');
    if (avatarPill) {
      const avatarUrl = (user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture)) || user.avatar;
      if (avatarUrl) {
        avatarPill.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
      } else if (displayName) {
        const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        avatarPill.textContent = initials || 'HT';
      }
    }
  },

  /**
   * Memasang listener ke tombol logout di header atau halaman settings
   */
  bindLogoutButtons() {
    const logoutBtnHeader = document.getElementById('btn-logout-header');
    if (logoutBtnHeader) {
      logoutBtnHeader.addEventListener('click', (e) => {
        e.preventDefault();
        this.signOut();
      });
    }

    const logoutBtnSettings = document.getElementById('btn-logout');
    if (logoutBtnSettings) {
      logoutBtnSettings.addEventListener('click', (e) => {
        e.preventDefault();
        this.signOut();
      });
    }
  },

  /**
   * Route Guard untuk Halaman Login (index.html)
   * Jika sudah login, langsung alihkan ke homepage.html
   */
  async checkLoginRedirect() {
    // Sinkronkan tema
    const savedTheme = localStorage.getItem('heliotrack_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const { active } = await this.getSession();
    if (active) {
      // Jika sudah memiliki sesi aktif, alihkan ke dashboard
      window.location.href = 'homepage.html';
    }
  }
};

// Jalankan auto-init saat DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  if (currentPath.endsWith('homepage.html') || currentPath.endsWith('settings.html')) {
    HelioAuth.protectPage();
  }
});
