let loggedInUser = '';

// Utility: Disable button and show loader to prevent spam clicks
function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses...`;
    btn.style.opacity = '0.75';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.disabled = false;
    if (btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
    }
    btn.style.opacity = '';
    btn.style.cursor = '';
  }
}

// ── THEME CONFIGURATION ──
function setAdminTheme(theme) {
  const body = document.body;
  
  if (theme === 'light') {
    body.classList.add('light-theme');
  } else {
    body.classList.remove('light-theme');
  }
  localStorage.setItem('admin-theme', theme);
  
  // Sync filter buttons styles and tabs if visible
  if (document.getElementById('screen-admin').classList.contains('active')) {
    let currentTab = 'settings';
    if (document.getElementById('panel-orders').style.display !== 'none') {
      currentTab = 'orders';
    } else if (document.getElementById('panel-reports').style.display !== 'none') {
      currentTab = 'reports';
    }
    switchTab(currentTab);
    
    if (typeof currentFilterType !== 'undefined') {
      const activeFilterBtn = document.getElementById('btn-filter-' + currentFilterType);
      if (activeFilterBtn) {
        activeFilterBtn.style.background = '#2a6ee0';
        activeFilterBtn.style.color = '#fff';
      }
    }
  }
}

// Interceptor global fetch untuk menangani 401 Unauthorized (sesi habis)
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  try {
    const response = await originalFetch(...args);
    if (response.status === 401) {
      handleUnauthorized();
    }
    return response;
  } catch (error) {
    throw error;
  }
};

function handleUnauthorized() {
  sessionStorage.removeItem('adminLoggedIn');
  sessionStorage.removeItem('adminUser');
  loggedInUser = '';
  
  document.getElementById('screen-admin').classList.remove('active');
  document.getElementById('screen-admin-login').classList.add('active');
  document.getElementById('admin-pass').value = '';
  
  if (!window.isUnauthorizedAlertActive) {
    window.isUnauthorizedAlertActive = true;
    Swal.fire({
      icon: 'error',
      title: 'Sesi Berakhir',
      text: 'Sesi Anda telah berakhir atau Anda belum login. Silakan login kembali.',
      confirmButtonColor: '#2a6ee0'
    }).then(() => {
      window.isUnauthorizedAlertActive = false;
    });
  }
}

// Initialize theme immediately to prevent flashing
(function initTheme() {
  const savedTheme = localStorage.getItem('admin-theme') || 'night';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  }
})();

// Cek sesi login saat halaman dimuat
window.addEventListener('DOMContentLoaded', async () => {
  const savedTheme = localStorage.getItem('admin-theme') || 'night';
  setAdminTheme(savedTheme);
  startOrderPolling(); // Mulai polling pesanan baru (D1)

  try {
    const res = await fetch('api/auth.php?action=check_session');
    const json = await res.json();
    if (json.success) {
      loggedInUser = json.username;
      sessionStorage.setItem('adminLoggedIn', 'true');
      sessionStorage.setItem('adminUser', json.username);
      
      document.getElementById('screen-admin-login').classList.remove('active');
      document.getElementById('screen-admin').classList.add('active');
      loadOrders();
    } else {
      sessionStorage.removeItem('adminLoggedIn');
      sessionStorage.removeItem('adminUser');
      document.getElementById('screen-admin').classList.remove('active');
      document.getElementById('screen-admin-login').classList.add('active');
    }
  } catch (e) {
    console.error('Gagal memeriksa sesi:', e);
  }
});

function togglePassword(inputId, iconElement) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    iconElement.classList.remove('fa-eye');
    iconElement.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    iconElement.classList.remove('fa-eye-slash');
    iconElement.classList.add('fa-eye');
  }
}

function formatRp(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }

async function adminLogin() {
  const user = document.getElementById('admin-user').value;
  const pass = document.getElementById('admin-pass').value;
  
  if (!user || !pass) {
    document.getElementById('login-err').innerText = 'Username dan password harus diisi!';
    document.getElementById('login-err').style.display = 'block';
    return;
  }

  const btn = document.querySelector('.btn-admin-login');
  setButtonLoading(btn, true);

  try {
    const res = await fetch('api/auth.php?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    const json = await res.json();
    
    if (json.success) {
      loggedInUser = user;
      sessionStorage.setItem('adminLoggedIn', 'true');
      sessionStorage.setItem('adminUser', user);
      
      document.getElementById('screen-admin-login').classList.remove('active');
      document.getElementById('screen-admin').classList.add('active');
      loadOrders();
    } else {
      if (json.cooldown) {
        startCooldownTimer(json.cooldown);
      } else {
        document.getElementById('login-err').innerText = json.message || 'Username atau password salah!';
        document.getElementById('login-err').style.display = 'block';
      }
    }
  } catch(e) {
    console.error(e);
    document.getElementById('login-err').innerText = 'Terjadi kesalahan sistem.';
    document.getElementById('login-err').style.display = 'block';
  } finally {
    setButtonLoading(btn, false);
  }
}

let cooldownInterval = null;
function startCooldownTimer(seconds) {
  const errEl = document.getElementById('login-err');
  errEl.style.display = 'block';
  
  if (cooldownInterval) clearInterval(cooldownInterval);
  
  let remaining = seconds;
  const updateMsg = () => {
    if (remaining >= 60) {
      const mins = Math.ceil(remaining / 60);
      errEl.innerText = `Terlalu banyak percobaan login. Silakan tunggu ${mins} menit lagi.`;
    } else {
      errEl.innerText = `Terlalu banyak percobaan login. Silakan tunggu ${remaining} detik lagi.`;
    }
  };
  
  updateMsg();
  
  cooldownInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(cooldownInterval);
      errEl.style.display = 'none';
      errEl.innerText = '';
    } else {
      updateMsg();
    }
  }, 1000);
}

function logout() {
  Swal.fire({
    title: 'Keluar Sesi?',
    text: 'Apakah Anda yakin ingin keluar dari panel admin?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#e05c2a',
    cancelButtonColor: '#6e7881',
    confirmButtonText: 'Ya, Keluar!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await fetch('api/auth.php?action=logout');
      } catch (e) {
        console.error('Logout error:', e);
      }
      
      sessionStorage.removeItem('adminLoggedIn');
      sessionStorage.removeItem('adminUser');
      loggedInUser = '';
      
      document.getElementById('screen-admin').classList.remove('active');
      document.getElementById('screen-admin-login').classList.add('active');
      document.getElementById('admin-pass').value = '';
      document.getElementById('login-err').style.display = 'none';
    }
  });
}

// Global state for admin table
let allOrders = [];
let filteredOrders = [];
let currentFilterType = 'all';
let searchQuery = '';
let currentPage = 1;
const pageSize = 10;

// Variabel untuk polling pesanan baru (D1)
let lastMaxOrderId = 0;

async function startOrderPolling() {
  setInterval(async () => {
    // Hanya lakukan polling jika admin sedang berada di tab "orders" dan sedang masuk dashboard
    if (document.getElementById('screen-admin').classList.contains('active') && 
        document.getElementById('panel-orders').style.display !== 'none') {
      try {
        const res = await fetch('api/get_pesanan.php');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          const sorted = json.data.sort((a, b) => Number(a.id) - Number(b.id));
          const currentMaxId = Number(sorted[sorted.length - 1].id);
          
          if (lastMaxOrderId > 0 && currentMaxId > lastMaxOrderId) {
            playNotificationSound();
            Swal.fire({
              icon: 'info',
              title: 'Pesanan Baru Masuk!',
              text: `Terdapat pesanan baru dengan nomor antrian #${currentMaxId}.`,
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 4000,
              timerProgressBar: true
            });
            allOrders = sorted;
            applyFiltersAndRender();
          }
          lastMaxOrderId = currentMaxId;
        }
      } catch (e) {
        console.error("Gagal melakukan polling pesanan:", e);
      }
    }
  }, 30000); // Polling setiap 30 detik
}

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.45);
  } catch (e) {
    console.warn('Gagal memutar notifikasi suara:', e);
  }
}

async function loadOrders() {
  const tbody = document.getElementById('orders-body');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.8rem; margin-bottom:0.5rem; display:block; color:var(--accent);"></i>Memuat data pesanan...</td></tr>`;
  }
  try {
    const res = await fetch('api/get_pesanan.php');
    const json = await res.json();
    
    if (!json.success) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#ff6b6b;">Gagal memuat: ${json.message}</td></tr>`;
      return;
    }

    // Sort strictly by ID ascending (lowest first / oldest queue first)
    allOrders = json.data.sort((a, b) => Number(a.id) - Number(b.id));
    if (allOrders.length > 0) {
      lastMaxOrderId = Number(allOrders[allOrders.length - 1].id);
    }
    applyFiltersAndRender();
    
  } catch(e) {
    console.error(e);
    document.getElementById('orders-body').innerHTML = `<tr><td colspan="8" style="text-align:center; color:#ff6b6b;">Terjadi kesalahan saat memuat data.</td></tr>`;
  }
}

function applyFiltersAndRender() {
  // 1. Filter by service type
  filteredOrders = allOrders;
  if (currentFilterType === 'offset') {
    filteredOrders = allOrders.filter(o => o.layanan.includes('Offset'));
  } else if (currentFilterType === 'pound') {
    filteredOrders = allOrders.filter(o => !o.layanan.includes('Offset'));
  }
  
  // 2. Filter by search query
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    filteredOrders = filteredOrders.filter(o => {
      return o.nama.toLowerCase().includes(q) || String(o.id).includes(q);
    });
  }

  // Calculate Stats based on allOrders (overall database status)
  const totalOrders = allOrders.length;
  const totalIncome = allOrders
    .filter(o => o.status === 'selesai')
    .reduce((sum, o) => sum + Number(o.harga), 0);
  const todayStr = new Date().toDateString();
  const ordersToday = allOrders.filter(o => {
    return new Date(o.created_at).toDateString() === todayStr;
  }).length;

  document.getElementById('stat-total-orders').textContent = totalOrders;
  document.getElementById('stat-total-income').textContent = formatRp(totalIncome);
  document.getElementById('stat-orders-today').textContent = ordersToday;

  // 3. Paginate
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  document.getElementById('page-indicator').textContent = `Hal ${currentPage} dari ${totalPages}`;

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredOrders.slice(startIndex, startIndex + pageSize);

  const tbody = document.getElementById('orders-body');
  if (paginatedData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:4rem; color:var(--text-muted);">
          <i class="fa-solid fa-folder-open" style="font-size:2.5rem; margin-bottom:0.8rem; display:block; opacity:0.4; color:var(--accent2);"></i>
          <strong>Tidak ada pesanan ditemukan</strong><br>
          <span style="font-size:0.8rem; opacity:0.8;">Coba cari dengan kata kunci lain atau filter berbeda</span>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = paginatedData.map(o => renderOrderRow(o)).join('');
}

function handleAdminSearch(val) {
  searchQuery = val;
  currentPage = 1;
  applyFiltersAndRender();
}

function changePage(dir) {
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  currentPage = Math.max(1, Math.min(totalPages, currentPage + dir));
  applyFiltersAndRender();
}

function getFileIconAndClass(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  let icon = 'fa-file';
  let cls = 'other';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
    icon = 'fa-file-image';
    cls = 'image';
  } else if (ext === 'pdf') {
    icon = 'fa-file-pdf';
    cls = 'pdf';
  } else if (['doc', 'docx'].includes(ext)) {
    icon = 'fa-file-word';
    cls = 'word';
  } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
    icon = 'fa-file-excel';
    cls = 'excel';
  }
  return { icon, cls };
}

function renderOrderRow(o) {
  const isOffset = o.layanan.includes('Offset');
  const badgeClass = isOffset ? 'offset' : 'pound';
  
  let detailHtml = `<span class="badge ${badgeClass}">${o.layanan}</span><br><br>`;
  detailHtml += `<strong>Jml:</strong> ${Number(o.jumlah).toLocaleString('id-ID')} lbr<br>`;
  if(isOffset) {
    detailHtml += `<strong>Warna:</strong> ${o.warna || '-'}<br>`;
    detailHtml += `<strong>Kertas:</strong> ${o.kertas || '-'}<br>`;
    detailHtml += `<strong>Ukuran:</strong> ${o.ukuran || '-'}<br>`;
  }
  detailHtml += `<br><strong>Catatan:</strong> ${o.catatan || '-'}`;
  
  let filesHtml = '<span style="color:var(--text-muted-dark); font-style:italic; font-size:0.8rem;">Tidak ada file</span>';
  if (o.files && o.files.length > 0) {
    filesHtml = `<div class="file-badge-container">` + 
      o.files.map(f => {
        const info = getFileIconAndClass(f.name);
        return `
          <div class="file-card" style="background:var(--card-bg); border:1px solid var(--card-border); border-radius:10px; padding:0.6rem; display:flex; flex-direction:column; gap:0.5rem; transition:all 0.2s;">
            <div style="display:flex; align-items:center; gap:8px;">
              <i class="fa-solid ${info.icon} file-icon ${info.cls}"></i>
              <span class="file-name-text" style="font-size:0.75rem; font-weight:700; color:var(--text);" title="${f.name}">${f.name}</span>
            </div>
            <div style="display:flex; gap:0.4rem; margin-top:0.2rem;">
              <button onclick="previewDesignFile('${f.path}', '${f.name}')" style="flex:1; padding:0.35rem 0.5rem; background:#2a6ee0; color:#fff; border:none; border-radius:6px; font-size:0.7rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:4px; transition:all 0.2s;"><i class="fa-solid fa-eye"></i> Preview</button>
              <a href="${f.path}" download="${f.name}" style="flex:1; padding:0.35rem 0.5rem; background:#1a9e5c; color:#fff; border:none; border-radius:6px; font-size:0.7rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:4px; text-decoration:none; transition:all 0.2s;"><i class="fa-solid fa-download"></i> Download</a>
            </div>
          </div>
        `;
      }).join('') + `</div>`;
  }

  let buktiHtml = '';
  if (o.bukti_bayar) {
    buktiHtml = `<br><br><a class="file-link" href="javascript:void(0)" onclick="showBuktiModal('${o.bukti_bayar}')" style="color:#1a9e5c; font-weight:700; display:inline-flex; align-items:center; gap:4px;"><i class="fa-solid fa-file-invoice-dollar"></i> Bukti Transfer</a>`;
  } else if (o.bayar === 'QRIS') {
    buktiHtml = `<br><br><span style="color:var(--text-muted-dark); font-size:0.75rem;">(Belum upload bukti)</span>`;
  }

  const waNotifyBtn = `
    <button onclick="sendWaNotification(${o.id}, '${o.nama}', '${o.wa}', '${o.status}')" title="Kirim Notifikasi WA" style="margin-left:0.4rem; padding:0.5rem 0.65rem; background:#1a9e5c; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:0.85rem; display:inline-flex; align-items:center;">
      <i class="fa-brands fa-whatsapp"></i>
    </button>
  `;

  const deleteBtn = `
    <button onclick="deleteOrder(${o.id})" title="Hapus Pesanan" style="margin-left:0.4rem; padding:0.5rem 0.65rem; background:#ff6b6b; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:0.85rem; display:inline-flex; align-items:center;">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;

  // Status selector dropdown
  const statusSelect = `
    <div style="display:flex; align-items:center;">
      <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)">
        <option value="menunggu" ${o.status === 'menunggu' ? 'selected' : ''}>Menunggu</option>
        <option value="diproses" ${o.status === 'diproses' ? 'selected' : ''}>Diproses</option>
        <option value="selesai" ${o.status === 'selesai' ? 'selected' : ''}>Selesai</option>
      </select>
      ${waNotifyBtn}
      ${deleteBtn}
    </div>
  `;
  
  return `
    <tr data-layanan="${isOffset ? 'offset' : 'pound'}">
      <td style="font-weight:bold; color:#e05c2a;">#${o.id}</td>
      <td>${new Date(o.created_at).toLocaleString('id-ID')}</td>
      <td>
        <strong>${o.nama}</strong><br>
        <span style="color:var(--text-muted); font-size:0.85rem;">WA: ${o.wa}</span>
      </td>
      <td>${detailHtml}</td>
      <td>
        <strong>${o.pengiriman}</strong><br>
        <span style="font-size:.8rem; color:var(--text-muted);">${o.alamat || '-'}</span>
      </td>
      <td>
        <strong>${o.bayar}</strong><br>
        <span style="color:#1a9e5c; font-weight:bold;">${formatRp(o.harga)}</span><br>
        <span class="badge-status ${o.status}" style="margin-top:0.25rem;">${o.status.toUpperCase()}</span>
        ${buktiHtml}
      </td>
      <td>${filesHtml}</td>
      <td>${statusSelect}</td>
    </tr>
  `;
}

async function updateOrderStatus(id, status) {
  const selectElements = document.querySelectorAll('.status-select');
  selectElements.forEach(sel => sel.disabled = true);

  try {
    const res = await fetch('api/update_status.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    const json = await res.json();
    if (json.success) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Status pesanan berhasil diperbarui!',
        timer: 1500,
        showConfirmButton: false
      });
      loadOrders();
    } else {
      Swal.fire('Gagal', json.message, 'error');
    }
  } catch (e) {
    Swal.fire('Error', 'Gagal menghubungi server.', 'error');
  } finally {
    selectElements.forEach(sel => sel.disabled = false);
  }
}

function sendWaNotification(id, nama, wa, status) {
  let text = '';
  const antrianText = '#' + String(id).padStart(3, '0');
  
  if (status === 'menunggu') {
    text = `Halo ${nama}, pesanan Anda dengan nomor antrian *${antrianText}* telah kami terima dan masuk daftar antrian. Mohon tunggu proses selanjutnya ya!`;
  } else if (status === 'diproses') {
    text = `Halo ${nama}, pesanan Anda dengan nomor antrian *${antrianText}* saat ini *sedang diproses* oleh operator kami.`;
  } else if (status === 'selesai') {
    text = `Halo ${nama}, pesanan Anda dengan nomor antrian *${antrianText}* telah *selesai dikerjakan* dan siap diambil/dikirim. Terima kasih!`;
  }
  
  let cleanWa = wa.replace(/[^0-9]/g, '');
  if (cleanWa.startsWith('0')) {
    cleanWa = '62' + cleanWa.substring(1);
  }
  
  const url = `https://wa.me/${cleanWa}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function deleteOrder(id) {
  Swal.fire({
    title: 'Hapus Pesanan?',
    text: `Pesanan #${id} beserta seluruh berkas desain dan bukti bayarnya akan dihapus secara permanen!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e05c2a',
    cancelButtonColor: '#6e7881',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal',
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      try {
        const res = await fetch('api/hapus_pesanan.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.message || 'Gagal menghapus pesanan');
        }
        return json;
      } catch (error) {
        Swal.showValidationMessage(`Error: ${error.message}`);
      }
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Terhapus!',
        text: 'Pesanan berhasil dihapus.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      loadOrders();
    }
  });
}

function filterAdminOrders(type) {
  currentFilterType = type;
  currentPage = 1;
  
  const btnAll = document.getElementById('btn-filter-all');
  const btnOffset = document.getElementById('btn-filter-offset');
  const btnPound = document.getElementById('btn-filter-pound');
  
  // Reset button styles
  [btnAll, btnOffset, btnPound].forEach(btn => {
    btn.style.background = 'transparent';
    btn.style.color = 'var(--btn-color)';
  });
  
  const activeBtn = document.getElementById('btn-filter-' + type);
  if (activeBtn) {
    activeBtn.style.background = '#2a6ee0';
    activeBtn.style.color = '#fff';
  }

  applyFiltersAndRender();
}

function switchTab(tab) {
  const panelOrders = document.getElementById('panel-orders');
  const panelSettings = document.getElementById('panel-settings');
  const panelReports = document.getElementById('panel-reports');

  if(tab === 'orders') {
    panelOrders.style.display = 'block';
    panelSettings.style.display = 'none';
    if (panelReports) panelReports.style.display = 'none';
    
    panelOrders.classList.add('active-tab');
    panelSettings.classList.remove('active-tab');
    if (panelReports) panelReports.classList.remove('active-tab');
    
    document.getElementById('tab-orders').style.background = '#e05c2a';
    document.getElementById('tab-orders').style.color = '#fff';
    document.getElementById('tab-orders').style.borderColor = '#e05c2a';
    
    document.getElementById('tab-settings').style.background = 'transparent';
    document.getElementById('tab-settings').style.color = 'var(--btn-color)';
    document.getElementById('tab-settings').style.borderColor = 'var(--btn-border)';
    
    if (document.getElementById('tab-reports')) {
      document.getElementById('tab-reports').style.background = 'transparent';
      document.getElementById('tab-reports').style.color = 'var(--btn-color)';
      document.getElementById('tab-reports').style.borderColor = 'var(--btn-border)';
    }
  } else if(tab === 'reports') {
    panelOrders.style.display = 'none';
    panelSettings.style.display = 'none';
    if (panelReports) panelReports.style.display = 'block';
    
    panelOrders.classList.remove('active-tab');
    panelSettings.classList.remove('active-tab');
    if (panelReports) panelReports.classList.add('active-tab');
    
    document.getElementById('tab-reports').style.background = '#e05c2a';
    document.getElementById('tab-reports').style.color = '#fff';
    document.getElementById('tab-reports').style.borderColor = '#e05c2a';
    
    document.getElementById('tab-orders').style.background = 'transparent';
    document.getElementById('tab-orders').style.color = 'var(--btn-color)';
    document.getElementById('tab-orders').style.borderColor = 'var(--btn-border)';
    
    document.getElementById('tab-settings').style.background = 'transparent';
    document.getElementById('tab-settings').style.color = 'var(--btn-color)';
    document.getElementById('tab-settings').style.borderColor = 'var(--btn-border)';
    
    initReportsPage();
  } else {
    panelOrders.style.display = 'none';
    panelSettings.style.display = 'block';
    if (panelReports) panelReports.style.display = 'none';
    
    panelOrders.classList.remove('active-tab');
    panelSettings.classList.add('active-tab');
    if (panelReports) panelReports.classList.remove('active-tab');
    
    document.getElementById('tab-settings').style.background = '#e05c2a';
    document.getElementById('tab-settings').style.color = '#fff';
    document.getElementById('tab-settings').style.borderColor = '#e05c2a';
    
    document.getElementById('tab-orders').style.background = 'transparent';
    document.getElementById('tab-orders').style.color = 'var(--btn-color)';
    document.getElementById('tab-orders').style.borderColor = 'var(--btn-border)';
    
    if (document.getElementById('tab-reports')) {
      document.getElementById('tab-reports').style.background = 'transparent';
      document.getElementById('tab-reports').style.color = 'var(--btn-color)';
      document.getElementById('tab-reports').style.borderColor = 'var(--btn-border)';
    }
    loadSettings();
  }
}

// ── LAPORAN KEUANGAN & GRAFIK ──
let filteredReportOrders = [];
let revenueChartInstance = null;

function initReportsPage() {
  const startInput = document.getElementById('rep-start-date');
  const endInput = document.getElementById('rep-end-date');

  // Default to empty to show all orders by default per user request
  startInput.value = "";
  endInput.value = "";
  
  // Register event listeners to update automatically on change (D1)
  if (!startInput.dataset.listenerAdded) {
    startInput.addEventListener('change', generateReport);
    startInput.dataset.listenerAdded = "true";
  }
  if (!endInput.dataset.listenerAdded) {
    endInput.addEventListener('change', generateReport);
    endInput.dataset.listenerAdded = "true";
  }
  
  generateReport();
}

function generateReport() {
  const startStr = document.getElementById('rep-start-date').value;
  const endStr = document.getElementById('rep-end-date').value;
  
  let startDate, endDate;
  let labelText = '';
  
  if (!startStr && !endStr) {
    // If no dates are selected, show all orders from the oldest order to today
    if (allOrders.length > 0) {
      // Since allOrders is sorted by ID ascending, allOrders[0] is the earliest order
      const oldestDate = new Date(allOrders[0].created_at);
      startDate = new Date(oldestDate);
      startDate.setHours(0,0,0,0);
      endDate = new Date();
      endDate.setHours(23,59,59,999);
      labelText = `Periode: ${oldestDate.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})} — Hari Ini (Semua data)`;
    } else {
      startDate = new Date();
      startDate.setHours(0,0,0,0);
      endDate = new Date();
      endDate.setHours(23,59,59,999);
      labelText = 'Belum ada pesanan terdaftar di sistem.';
    }
  } else {
    if (!startStr) {
      const oldestDate = allOrders.length > 0 ? new Date(allOrders[0].created_at) : new Date();
      startDate = new Date(oldestDate);
      startDate.setHours(0,0,0,0);
    } else {
      startDate = new Date(startStr);
      startDate.setHours(0,0,0,0);
    }
    
    if (!endStr) {
      endDate = new Date();
      endDate.setHours(23,59,59,999);
    } else {
      endDate = new Date(endStr);
      endDate.setHours(23,59,59,999);
    }
    
    const formattedStart = startDate.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
    const formattedEnd = endDate.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
    labelText = `Periode: ${formattedStart} — ${formattedEnd}`;
  }
  
  document.getElementById('rep-period-label').textContent = labelText;
  
  filteredReportOrders = allOrders.filter(o => {
    const orderDate = new Date(o.created_at);
    return orderDate >= startDate && orderDate <= endDate;
  });
  
  const totalOrders = filteredReportOrders.length;
  const revenue = filteredReportOrders
    .filter(o => o.status === 'selesai')
    .reduce((sum, o) => sum + Number(o.harga), 0);
    
  const offsetRevenue = filteredReportOrders
    .filter(o => o.status === 'selesai' && o.layanan.includes('Offset'))
    .reduce((sum, o) => sum + Number(o.harga), 0);

  const poundRevenue = filteredReportOrders
    .filter(o => o.status === 'selesai' && !o.layanan.includes('Offset'))
    .reduce((sum, o) => sum + Number(o.harga), 0);

  const offsetCount = filteredReportOrders.filter(o => o.layanan.includes('Offset')).length;
  const poundCount = filteredReportOrders.filter(o => !o.layanan.includes('Offset')).length;
  const completedCount = filteredReportOrders.filter(o => o.status === 'selesai').length;
  const processingCount = filteredReportOrders.filter(o => o.status === 'diproses').length;
  
  document.getElementById('rep-stat-revenue').textContent = formatRp(revenue);
  document.getElementById('rep-stat-revenue-offset').textContent = formatRp(offsetRevenue);
  document.getElementById('rep-stat-revenue-pound').textContent = formatRp(poundRevenue);
  document.getElementById('rep-stat-total').textContent = totalOrders;
  document.getElementById('rep-stat-offset').textContent = offsetCount;
  document.getElementById('rep-stat-pound').textContent = poundCount;
  document.getElementById('rep-stat-completed').textContent = completedCount;
  document.getElementById('rep-stat-processing').textContent = processingCount;
  
  const tbody = document.getElementById('rep-breakdown-body');
  if (filteredReportOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color:var(--text-muted);">Tidak ada aktivitas pesanan pada tanggal ini.</td></tr>';
  } else {
    tbody.innerHTML = filteredReportOrders.map(o => `
      <tr>
        <td style="padding: 0.5rem;">${new Date(o.created_at).toLocaleDateString('id-ID')}</td>
        <td style="padding: 0.5rem;"><strong>${o.nama}</strong></td>
        <td style="padding: 0.5rem;"><span class="badge ${o.layanan.includes('Offset') ? 'offset' : 'pound'}">${o.layanan}</span></td>
        <td style="padding: 0.5rem; text-align: right; font-weight: bold; color: ${o.status === 'selesai' ? '#1a9e5c' : 'var(--text)'};">${formatRp(o.harga)}</td>
      </tr>
    `).join('');
  }
  
  renderChart(filteredReportOrders, startDate, endDate);
}

function renderChart(orders, startDate, endDate) {
  const revenueMap = {};
  
  let current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    revenueMap[dateStr] = 0;
    current.setDate(current.getDate() + 1);
  }
  
  orders.filter(o => o.status === 'selesai').forEach(o => {
    const dateStr = new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    if (revenueMap[dateStr] !== undefined) {
      revenueMap[dateStr] += Number(o.harga);
    }
  });
  
  const labels = Object.keys(revenueMap);
  const dataValues = Object.values(revenueMap);
  
  const canvas = document.getElementById('revenueChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }
  
  const isLight = document.body.classList.contains('light-theme');
  const gridColor = isLight ? '#ede8da' : 'rgba(255,255,255,0.06)';
  const textColor = isLight ? '#0d0d0d' : '#f5f0e8';
  
  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Pendapatan Harian (Rp)',
        data: dataValues,
        borderColor: '#1a9e5c',
        backgroundColor: 'rgba(26, 158, 92, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: labels.length > 30 ? 0 : 4,
        pointBackgroundColor: '#1a9e5c'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ' ' + formatRp(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            font: {
              family: 'Plus Jakarta Sans',
              size: 10
            },
            maxTicksLimit: 12
          }
        },
        y: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            font: {
              family: 'Plus Jakarta Sans',
              size: 10
            },
            callback: function(value) {
              if (value >= 1000000) return 'Rp ' + (value/1000000) + 'jt';
              if (value >= 1000) return 'Rp ' + (value/1000) + 'rb';
              return 'Rp ' + value;
            }
          }
        }
      }
    }
  });
}

function exportReportToExcel() {
  if (filteredReportOrders.length === 0) {
    return Swal.fire('Informasi', 'Tidak ada data laporan untuk diekspor.', 'info');
  }
  
  const excelData = filteredReportOrders.map(o => ({
    'ID Pesanan': '#' + o.id,
    'Tanggal': new Date(o.created_at).toLocaleDateString('id-ID') + ' ' + new Date(o.created_at).toLocaleTimeString('id-ID'),
    'Pelanggan': o.nama,
    'No. WhatsApp': o.wa,
    'Layanan': o.layanan,
    'Jumlah (Lembar)': Number(o.jumlah),
    'Detail Cetak': o.warna || o.kertas || o.ukuran ? `${o.warna || ''} ${o.kertas || ''} ${o.ukuran || ''}` : '-',
    'Pengiriman': o.pengiriman,
    'Alamat': o.alamat || '-',
    'Metode Bayar': o.bayar,
    'Total Harga': Number(o.harga),
    'Status': o.status.toUpperCase(),
    'Catatan': o.catatan || '-'
  }));
  
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');
  
  const wscols = [
    {wch: 12}, // ID
    {wch: 20}, // Tanggal
    {wch: 18}, // Pelanggan
    {wch: 16}, // WA
    {wch: 22}, // Layanan
    {wch: 15}, // Jumlah
    {wch: 25}, // Detail
    {wch: 18}, // Pengiriman
    {wch: 25}, // Alamat
    {wch: 14}, // Metode Bayar
    {wch: 15}, // Total Harga
    {wch: 12}, // Status
    {wch: 20}  // Catatan
  ];
  ws['!cols'] = wscols;

  const startDate = document.getElementById('rep-start-date').value;
  const endDate = document.getElementById('rep-end-date').value;
  const filename = `Laporan_Keuangan_UD_Master_${startDate}_to_${endDate}.xlsx`;
  
  XLSX.writeFile(wb, filename);
  
  Swal.fire({
    icon: 'success',
    title: 'Berhasil Diekspor',
    text: `Laporan keuangan periode ${startDate} s/d ${endDate} berhasil diunduh.`,
    timer: 2000,
    showConfirmButton: false
  });
}

function handleQRISImage(input) {
  const file = input.files[0];
  if (!file) return;

  document.getElementById('lbl-qris-file').textContent = file.name;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      document.getElementById('qris-preview-box').style.display = 'block';
      document.querySelector('.qris-dropzone').style.display = 'none';
      document.getElementById('img-qris-preview').src = e.target.result;

      const statusEl = document.getElementById('qris-status-msg');
      if (code) {
        document.getElementById('inp-qris-string').value = code.data;
        statusEl.innerHTML = '<span style="color:#1a9e5c;"><i class="fa-solid fa-circle-check"></i> QR Code berhasil dibaca! String QRIS terdeteksi.</span>';
      } else {
        document.getElementById('inp-qris-string').value = '';
        statusEl.innerHTML = '<span style="color:#ffc107;"><i class="fa-solid fa-triangle-exclamation"></i> Gagal mendecode QR Code dari gambar. QRIS akan tampil as gambar statis tanpa nominal otomatis.</span>';
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function loadSettings() {
  try {
    const res = await fetch('api/settings.php');
    const json = await res.json();
    if(json.success && json.data) {
      document.getElementById('inp-wa-number').value = json.data.wa_number || '';
      document.getElementById('inp-qris-string').value = json.data.qris_string || '';

      if(json.data.qris_image) {
        document.getElementById('qris-preview-box').style.display = 'block';
        document.querySelector('.qris-dropzone').style.display = 'none';
        document.getElementById('img-qris-preview').src = json.data.qris_image + '?t=' + Date.now();
        document.getElementById('lbl-qris-file').textContent = 'Gambar saat ini aktif';
        if(json.data.qris_string) {
          document.getElementById('qris-status-msg').innerHTML = '<span style="color:#1a9e5c;"><i class="fa-solid fa-circle-check"></i> QRIS Dinamis Aktif (String terdeteksi)</span>';
        } else {
          document.getElementById('qris-status-msg').innerHTML = '<span style="color:#ffc107;"><i class="fa-solid fa-triangle-exclamation"></i> Gambar aktif tetapi QRIS gagal didecode. Nominal dinamis tidak aktif.</span>';
        }
      } else {
        document.getElementById('qris-preview-box').style.display = 'none';
        document.querySelector('.qris-dropzone').style.display = 'flex';
      }
    }
  } catch(e) { console.error('Gagal memuat pengaturan', e); }
}

async function saveSettings() {
  const wa = document.getElementById('inp-wa-number').value.trim();
  const qrisString = document.getElementById('inp-qris-string').value.trim();
  const qrisFileInput = document.getElementById('inp-qris-image');

  if(!wa) return alert('Nomor WA tidak boleh kosong!');

  const btn = document.querySelector('.btn-save-settings');
  setButtonLoading(btn, true);

  const fd = new FormData();
  fd.append('wa_number', wa);
  fd.append('qris_string', qrisString);
  if (qrisFileInput.files.length > 0) {
    fd.append('qris_image', qrisFileInput.files[0]);
  }

  try {
    const res = await fetch('api/settings.php', {
      method: 'POST',
      body: fd
    });
    const json = await res.json();
    if(json.success) {
      Swal.fire('Berhasil', json.message, 'success');
      loadSettings();
    } else {
      Swal.fire('Gagal', 'Gagal menyimpan: ' + json.message, 'error');
    }
  } catch(e) {
    Swal.fire('Error', 'Terjadi kesalahan saat menyimpan pengaturan.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function changePassword() {
  const oldPass = document.getElementById('inp-old-pass').value;
  const newPass = document.getElementById('inp-new-pass').value;
  const confirmPass = document.getElementById('inp-confirm-pass').value;
  
  if(!oldPass || !newPass || !confirmPass) {
    return Swal.fire('Peringatan', 'Semua field password harus diisi!', 'warning');
  }

  if(newPass !== confirmPass) {
    return Swal.fire('Peringatan', 'Konfirmasi password baru tidak cocok!', 'warning');
  }

  const btn = document.querySelector('.btn-change-pass');
  setButtonLoading(btn, true);

  try {
    const res = await fetch('api/auth.php?action=change_password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loggedInUser, old_password: oldPass, new_password: newPass })
    });
    const json = await res.json();
    
    if(json.success) {
      Swal.fire('Berhasil', json.message, 'success');
      document.getElementById('inp-old-pass').value = '';
      document.getElementById('inp-new-pass').value = '';
      document.getElementById('inp-confirm-pass').value = '';
    } else {
      Swal.fire('Gagal', json.message, 'error');
    }
  } catch(e) {
    Swal.fire('Error', 'Terjadi kesalahan sistem.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function previewDesignFile(path, name) {
  const modal = document.getElementById('preview-modal');
  const titleEl = document.getElementById('preview-modal-title');
  const bodyEl = document.getElementById('preview-modal-body');
  
  titleEl.textContent = name;
  bodyEl.innerHTML = '<div style="font-size:0.9rem; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Memuat pratinjau...</div>';
  modal.classList.add('show');
  
  const ext = name.split('.').pop().toLowerCase();
  const isImg = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';
  const isCsv = ext === 'csv';
  const isDocx = ['doc', 'docx'].includes(ext);
  const isXlsx = ['xls', 'xlsx'].includes(ext);
  
  try {
    if (isImg) {
      bodyEl.innerHTML = `<img src="${path}" alt="${name}" style="max-width:100%; max-height:55vh; object-fit:contain; border-radius:8px; display:block; margin:0 auto;" />`;
    } else if (isPdf) {
      bodyEl.innerHTML = `<iframe src="${path}" style="width:100%; height:55vh; border:none; border-radius:8px;"></iframe>`;
    } else if (isCsv) {
      const res = await fetch(path);
      const text = await res.text();
      
      const rows = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (rows.length === 0) {
        bodyEl.innerHTML = '<div style="color:var(--text-muted); padding: 2rem; text-align:center;">Berkas CSV ini kosong.</div>';
        return;
      }
      let html = '<div style="width:100%; max-height:55vh; overflow:auto; border:1px solid var(--card-border); border-radius:8px; background:var(--modal-bg);"><table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.82rem;">';
      
      rows.slice(0, 100).forEach((rowText, rIdx) => {
        let cols = rowText.includes(';') ? rowText.split(';') : rowText.split(',');
        html += `<tr style="${rIdx === 0 ? 'position:sticky; top:0; z-index:1;' : ''}">`;
        cols.forEach(col => {
          const tag = rIdx === 0 ? 'th' : 'td';
          const cleanText = col.trim().replace(/^["']|["']$/g, '');
          const cellStyle = rIdx === 0
            ? 'background:var(--input-bg); color:var(--text); font-weight:800; padding:0.6rem 0.8rem; border-bottom:2px solid var(--card-border); border-right:1px solid var(--card-border);'
            : 'padding:0.5rem 0.8rem; border-bottom:1px solid var(--row-border); border-right:1px solid var(--row-border); color:var(--text);';
          html += `<${tag} style="${cellStyle}">${cleanText}</${tag}>`;
        });
        html += '</tr>';
      });
      
      html += '</table></div>';
      if (rows.length > 100) {
        html += `<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; margin-top:0.6rem; font-weight:600;"><i class="fa-solid fa-circle-info"></i> Menampilkan 100 baris pertama dari total ${rows.length} baris.</div>`;
      }
      bodyEl.innerHTML = html;
    } else if (isDocx) {
      const res = await fetch(path);
      const buf = await res.arrayBuffer();
      
      bodyEl.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'width:100%; height:55vh; overflow:auto; background:#fff; border-radius:8px; border:1px solid var(--card-border); padding:1rem; box-sizing:border-box; color:#000;';
      bodyEl.appendChild(wrapper);
      
      await docx.renderAsync(buf, wrapper, null, {
        className: 'docx-render', inWrapper: true, ignoreWidth: false,
        breakPages: true, renderHeaders: true, renderFooters: true
      });
    } else if (isXlsx) {
      const res = await fetch(path);
      const buf = await res.arrayBuffer();
      
      const wb = XLSX.read(buf, { type: 'array' });
      const names = wb.SheetNames;

      const buildSheet = (idx) => {
        const data = XLSX.utils.sheet_to_json(wb.Sheets[names[idx]], { header: 1, defval: '' });
        let t = '<div style="overflow:auto; max-height:calc(55vh - 56px); border:1px solid var(--card-border); border-radius:8px;"><table style="width:100%; border-collapse:collapse; font-size:0.8rem; background:var(--modal-bg);">';
        data.slice(0, 150).forEach((row, ri) => {
          t += '<tr>';
          row.forEach(cell => {
            const tag = ri === 0 ? 'th' : 'td';
            const s = ri === 0
              ? 'background:var(--input-bg);color:var(--text);font-weight:800;padding:0.5rem 0.75rem;border-bottom:2px solid var(--card-border);border-right:1px solid var(--card-border);white-space:nowrap;'
              : 'padding:0.45rem 0.75rem;border-bottom:1px solid var(--row-border);border-right:1px solid var(--row-border);white-space:nowrap;color:var(--text);';
            t += `<${tag} style="${s}">${cell ?? ''}</${tag}>`;
          });
          t += '</tr>';
        });
        t += '</table></div>';
        if (data.length > 150) t += `<div style="font-size:0.72rem;color:var(--text-muted);text-align:center;margin-top:0.4rem;"><i class="fa-solid fa-circle-info"></i> Menampilkan 150 dari ${data.length} baris</div>`;
        return t;
      };

      const tabs = names.length > 1
        ? `<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.6rem;">` +
          names.map((n, i) => `<button id="xtab-${i}" onclick="window._xswitch(${i})" style="font-family:'Plus Jakarta Sans';font-size:0.75rem;font-weight:700;padding:0.35rem 0.8rem;border-radius:20px;border:1px solid var(--input-border);cursor:pointer;background:${i===0?'#2a6ee0':'var(--input-bg)'};color:${i===0?'#fff':'var(--text)'};">${n}</button>`).join('') +
          `</div>`
        : '';

      const wrap = document.createElement('div');
      wrap.style.cssText = 'width:100%;height:55vh;';
      wrap.innerHTML = tabs + buildSheet(0);
      bodyEl.innerHTML = '';
      bodyEl.appendChild(wrap);

      if (names.length > 1) {
        window._xswitch = (idx) => {
          names.forEach((_, btnIdx) => {
            const btn = document.getElementById(`xtab-${btnIdx}`);
            if (btn) {
              if (btnIdx === idx) {
                btn.style.background = '#2a6ee0';
                btn.style.color = '#fff';
              } else {
                btn.style.background = 'var(--input-bg)';
                btn.style.color = 'var(--text)';
              }
            }
          });
          const tableDiv = wrap.querySelector('div:last-child');
          if (tableDiv) tableDiv.outerHTML = buildSheet(idx);
        };
      }
    } else {
      bodyEl.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem;">
          <i class="fa-solid fa-file-lines" style="font-size:3rem; color:var(--text-muted); margin-bottom:1rem; display:block;"></i>
          <h4 style="margin:0 0 0.5rem; color:var(--text);">${name}</h4>
          <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.5; margin-bottom:1.5rem;">
            Format file <strong>${ext.toUpperCase()}</strong> tidak mendukung pratinjau langsung di browser. Silakan unduh berkas untuk membacanya.
          </p>
        </div>
      `;
    }
  } catch (err) {
    bodyEl.innerHTML = `<div style="padding:2rem;color:#ff6b6b;text-align:center;"><i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;display:block;margin-bottom:0.8rem;"></i>Gagal merender pratinjau berkas.<br><small style="color:var(--text-muted)">${err.message}</small></div>`;
  }
}

function closePreviewModal() {
  const modal = document.getElementById('preview-modal');
  modal.classList.remove('show');
  document.getElementById('preview-modal-body').innerHTML = '';
}

window.addEventListener('click', function(e) {
  const modal = document.getElementById('preview-modal');
  if (e.target === modal) {
    closePreviewModal();
  }
});

function showBuktiModal(filename) {
  const modal = document.getElementById('modal-bukti');
  const img = document.getElementById('img-modal-bukti');
  img.src = 'uploads/' + filename;
  modal.style.display = 'flex';
}

function closeBuktiModal() {
  document.getElementById('modal-bukti').style.display = 'none';
}
