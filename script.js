/**
 * ============================================================
 * 🛠️ CONFIGURATION
 * ============================================================
 */

// รวมศูนย์การจัดการสถานะ เพื่อให้ง่ายต่อการเปลี่ยนสีหรือข้อความในที่เดียว
const STATUS_MAP = {
	pending: { label: '🟡 รอล้าง', bg: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-400' },
	processing: { label: '🔵 กำลังล้าง', bg: 'bg-blue-100 text-blue-700', border: 'border-blue-400' },
	completed: { label: '🟢 เสร็จสิ้น', bg: 'bg-green-100 text-green-700', border: 'border-green-400' },
	default: { label: '⚪ ไม่ระบุ', bg: 'bg-gray-100 text-gray-700', border: 'border-gray-200' }
  };
  
  /**
   * ============================================================
   * 📱 1. UI CONTROLS (การควบคุมหน้าจอ)
   * ============================================================
   */
  
  // ฟังก์ชัน เปิด/ปิด หน้าต่าง Modal จองคิว
  function toggleModal(show) {
	const modal = document.getElementById('bookingModal');
	if (!modal) return console.error("หา Element ID 'bookingModal' ไม่เจอ");
  
	if (show) {
	  modal.classList.remove('hidden');
	  document.body.style.overflow = 'hidden'; // [UX] กันหน้าเว็บหลักเลื่อนขณะเปิด Modal
	} else {
	  modal.classList.add('hidden');
	  document.body.style.overflow = 'auto';   // คืนค่าการเลื่อนหน้าเว็บ
	}
  }
  
  // [UX] ปิด Modal เมื่อผู้ใช้คลิกพื้นที่ว่างสีดำ (Overlay)
  window.onclick = (event) => {
	const modal = document.getElementById('bookingModal');
	if (event.target === modal) toggleModal(false);
  };
  
  // ฟังก์ชันแสดงการแจ้งเตือนมุมจอ (Toast Notification)
  function showToast(msg) {
    // 1. สร้าง Element
    const toast = document.createElement('div');
    
    // 2. ใส่ Class (เพิ่ม z-[9999] และเปลี่ยนตำแหน่งให้เด่นขึ้น)
    // ผมเพิ่ม transition เพื่อให้ดูนุ่มนวลขึ้นด้วยครับ
    toast.className = "fixed bottom-10 right-10 bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-[9999] text-base font-medium flex items-center gap-2 animate-bounce";
    
    // 3. ใส่เนื้อหา
    toast.innerHTML = `<span>✅</span> <span>${msg}</span>`;
    
    // 4. แสดงบนหน้าจอ
    document.body.appendChild(toast);
    
    // 5. ตั้งเวลาลบ (เพิ่มการจางออกก่อนลบจริงเพื่อให้ดูเนียน)
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
  
  /**
   * ============================================================
   * 🔢 2. CALCULATION & LOGIC (การคำนวณ)
   * ============================================================
   */
 // ฟังก์ชันคำนวณราคาสุทธิแบบ Real-time
function calculate() {
    // 1. ดึงค่าจาก Package และค่าที่ User พิมพ์ในช่องราคาหน้างาน
    const packagePrice = Number(document.getElementById('package').value) || 0;
    const customPrice = Number(document.getElementById('basePrice').value);
    
    // 2. LOGIC: ถ้าช่องราคาหน้างานมีค่า (มากกว่า 0) ให้ใช้ราคานั้น 
    // ถ้าไม่มีค่า ให้ใช้ราคาจาก Package
    let currentPrice = customPrice > 0 ? customPrice : packagePrice;

    // 3. ดึงค่าส่วนลด
    const discountValue = Number(document.getElementById('discountValue').value) || 0;
    const discountType = document.getElementById('discountType').value;
    
    let total = currentPrice;

    // 4. คำนวณส่วนลดตามประเภท
    if (discountType === 'baht') {
        total = currentPrice - discountValue;
    } else if (discountType === 'percent') {
        total = currentPrice - (currentPrice * (discountValue / 100));
    }

    // 5. ป้องกันราคาติดลบ และแสดงผลที่ช่องยอดรวมสุทธิ
    total = Math.max(0, total);
    document.getElementById('netTotal').innerText = total.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/** * ============================================================
 * ⚡ เพิ่ม Event Listeners (ใส่ไว้ในส่วน Initial Load หรือต่อท้าย)
 * ============================================================
 */

// เมื่อเลือก Package -> ให้เอาราคา Package ไปใส่ในช่อง "ราคาหน้างาน" โดยอัตโนมัติ
document.getElementById('package').addEventListener('change', function() {
    const selectedPrice = this.value;
    document.getElementById('basePrice').value = selectedPrice; // Sync ค่าไปที่ช่องราคาหน้างาน
    calculate();
});

// เมื่อพิมพ์ที่ช่อง "ราคาหน้างาน" -> ให้คำนวณใหม่ทันที
document.getElementById('basePrice').addEventListener('input', calculate);

// เมื่อพิมพ์ส่วนลด หรือเปลี่ยนประเภทส่วนลด -> ให้คำนวณใหม่ทันที
document.getElementById('discountValue').addEventListener('input', calculate);
document.getElementById('discountType').addEventListener('change', calculate);
  
/**
 * ============================================================
 * 📍 NEW: LOCATION SELECTOR (ระบบเลือกพื้นที่)
 * ============================================================
 */
 let provinces = [];
 let amphures = [];
 let tumbons = [];
 
 async function loadLocationData() {
	 try {
		 // เปลี่ยนชื่อไฟล์ให้ตรงกับที่คุณมีจริง
		 const [pRes, aRes, tRes] = await Promise.all([
			 fetch('province.json'),
			 fetch('amphor.json'),
			 fetch('tumbon.json')
		 ]);
		 provinces = await pRes.json();
		 amphures = await aRes.json();
		 tumbons = await tRes.json();
		 renderProvinces();
	 } catch (err) {
		 console.error("ไม่สามารถโหลดข้อมูลพื้นที่ได้:", err);
	 }
 }
 
 function renderProvinces() {
	 const provinceSelect = document.getElementById('province');
	 if(!provinceSelect) return;
	 provinceSelect.innerHTML = '<option value="">เลือกจังหวัด</option>';
	 provinces.forEach(pv => {
		 const option = document.createElement('option');
		 option.value = pv.id; 
		 option.textContent = pv.name_th;
		 provinceSelect.appendChild(option);
	 });
 }
 
 // Event Listeners สำหรับการเลือกพื้นที่
 document.getElementById('province').addEventListener('change', function() {
	 const provinceId = this.value;
	 const amphureSelect = document.getElementById('amphure');
	 const tumbonSelect = document.getElementById('tambon');
	 amphureSelect.innerHTML = '<option value="">เลือกอำเภอ/เขต</option>';
	 tumbonSelect.innerHTML = '<option value="">เลือกตำบล/แขวง</option>';
	 if (provinceId) {
		 amphures.filter(am => am.province_id == provinceId).forEach(am => {
			 const option = document.createElement('option');
			 option.value = am.id;
			 option.textContent = am.name_th;
			 amphureSelect.appendChild(option);
		 });
		 amphureSelect.disabled = false;
	 } else {
		 amphureSelect.disabled = true;
	 }
 });
 
 document.getElementById('amphure').addEventListener('change', function() {
	 const amphureId = this.value;
	 const tumbonSelect = document.getElementById('tambon');
	 tumbonSelect.innerHTML = '<option value="">เลือกตำบล/แขวง</option>';
	 if (amphureId) {
		 tumbons.filter(tb => tb.amphure_id == amphureId).forEach(tb => {
			 const option = document.createElement('option');
			 option.value = tb.id;
			 option.dataset.zipcode = tb.zip_code;
			 option.textContent = tb.name_th;
			 tumbonSelect.appendChild(option);
		 });
		 tumbonSelect.disabled = false;
	 } else {
		 tumbonSelect.disabled = true;
	 }
 });
 
 document.getElementById('tambon').addEventListener('change', function() {
	 const selectedOption = this.options[this.selectedIndex];
	 document.getElementById('zipcode').value = selectedOption.dataset.zipcode || '';
 });

 /**
 * ============================================================
 * 🔍 SMART ADDRESS SEARCH (ระบบค้นหาที่อยู่ด่วน)
 * ============================================================
 */
const searchInput = document.getElementById('addressSearch');
const resultBox = document.getElementById('searchResult');

searchInput.addEventListener('input', function() {
    const keyword = this.value.trim();
    if (keyword.length < 2) {
        resultBox.classList.add('hidden');
        return;
    }

    // รวมข้อมูลเพื่อใช้ค้นหา (ทำเป็น Flat Data)
    const results = [];
    tumbons.forEach(tb => {
        const am = amphures.find(a => a.id == tb.amphure_id);
        const pv = provinces.find(p => p.id == (am ? am.province_id : null));
        
        if (am && pv) {
            const fullText = `${tb.name_th} ${am.name_th} ${pv.name_th} ${tb.zip_code}`;
            if (fullText.includes(keyword)) {
                results.push({
                    text: `ต.${tb.name_th} > อ.${am.name_th} > จ.${pv.name_th} (${tb.zip_code})`,
                    pvId: pv.id,
                    amId: am.id,
                    tbId: tb.id,
                    zip: tb.zip_code
                });
            }
        }
    });

    renderSearchResults(results.slice(0, 10)); // แสดงแค่ 10 อันดับแรกเพื่อความเร็ว
});

function renderSearchResults(items) {
    if (items.length === 0) {
        resultBox.innerHTML = '<div class="p-2 text-xs text-gray-400">ไม่พบข้อมูล...</div>';
    } else {
        resultBox.innerHTML = items.map(item => `
            <div class="p-3 border-b hover:bg-blue-50 cursor-pointer text-sm" 
                 onclick="selectAddress('${item.pvId}', '${item.amId}', '${item.tbId}', '${item.zip}')">
                ${item.text}
            </div>
        `).join('');
    }
    resultBox.classList.remove('hidden');
}

// เมื่อ User คลิกเลือกที่อยู่จากรายการ
function selectAddress(pvId, amId, tbId, zip) {
    // 1. เลือกจังหวัด
    const pvSelect = document.getElementById('province');
    pvSelect.value = pvId;
    pvSelect.dispatchEvent(new Event('change')); // กระตุ้นให้โหลดอำเภอ

    // 2. เลือกอำเภอ
    const amSelect = document.getElementById('amphure');
    amSelect.value = amId;
    amSelect.dispatchEvent(new Event('change')); // กระตุ้นให้โหลดตำบล

    // 3. เลือกตำบล
    const tbSelect = document.getElementById('tambon');
    tbSelect.value = tbId;
    
    // 4. ใส่รหัสไปรษณีย์
    document.getElementById('zipcode').value = zip;

    // ล้างค่าช่องค้นหา
    resultBox.classList.add('hidden');
    searchInput.value = '';
}

 /**
 * ============================================================
 * 📞 2.5 PHONE VALIDATION (ฉบับสมบูรณ์: ขึ้นต้นด้วย 0 และมี 10 หลัก)
 * ============================================================
 */
const phoneInput = document.getElementById('phone');

if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        // 1. ลบทุกอย่างที่ไม่ใช่ตัวเลข
        let value = this.value.replace(/\D/g, '');
        
        // 2. ตรวจสอบตัวแรก: ถ้าตัวแรกที่พิมพ์มาไม่ใช่ '0' ให้ตัดทิ้ง
        if (value.length > 0 && value[0] !== '0') {
            value = ''; 
        }

        // 3. จำกัดความยาวไม่เกิน 10 หลัก
        if (value.length > 10) {
            value = value.slice(0, 10);
        }
        
        this.value = value;

        // 4. แสดงสถานะสี (UX Feedback)
        // ต้องมีเลขครบ 10 หลัก และตัวแรกต้องเป็น 0 เท่านั้นถึงจะเขียว
        // if (value.length === 10 && value.startsWith('0')) {
        //     this.classList.remove('border-red-500');
        //     this.classList.add('border-green-500', 'ring-1', 'ring-green-500');
        // } else if (value.length > 0) {
        //     this.classList.remove('border-green-500', 'ring-1', 'ring-green-500');
        //     this.classList.add('border-red-500');
        // } else {
        //     this.classList.remove('border-red-500', 'border-green-500', 'ring-1', 'ring-green-500');
        // }
    });
}

// ส่วนสำหรับแสดงรายการที่อยู่เก่า
const historyBox = document.createElement('div');
historyBox.id = 'addressHistory';
historyBox.className = 'hidden mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm';
phoneInput.parentNode.appendChild(historyBox);

phoneInput.addEventListener('input', async function() {
    let phone = this.value;
    if (phone.length === 10) {
        try {
            const response = await fetch(`${WEB_APP_URL}?action=getCustomer&phone=${phone}`);
            const history = await response.json();
            showCustomerHistory(history);
        } catch (err) {
            console.error("ไม่พบข้อมูลประวัติ:", err);
        }
    } else {
        historyBox.classList.add('hidden');
    }
});
function showCustomerHistory(history) {
    if (!history || history.length === 0) return;

    // ถ้ามีประวัติเดิม ให้แสดงชื่อ และที่อยู่ที่เคยจอง
    document.getElementById('customerName').value = history[0].name; // ดึงชื่อล่าสุด
    
    let html = `<p class="text-xs font-bold text-blue-600 mb-2">📍 พบประวัติที่อยู่เดิม (คลิกเพื่อเลือก):</p>`;
    history.forEach((item, index) => {
        html += `
            <div class="p-2 mb-1 bg-white border rounded cursor-pointer hover:bg-blue-100 text-xs shadow-sm"
                 onclick="fillOldAddress('${encodeURIComponent(JSON.stringify(item))}')">
                ${index + 1}. ${item.address} (ต.${item.tambon} จ.${item.province})
            </div>`;
    });
    
    historyBox.innerHTML = html;
    historyBox.classList.remove('hidden');
}

// ฟังก์ชันเติมข้อมูลเก่าลงฟอร์ม
function fillOldAddress(encodedData) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    
    document.getElementById('address').value = data.address;
    document.getElementById('province').value = data.province_id;
    document.getElementById('province').dispatchEvent(new Event('change'));
    
    // ตั้ง Delay เล็กน้อยเพื่อให้ Dropdown โหลดข้อมูลเสร็จก่อนเลือกค่าถัดไป
    setTimeout(() => {
        document.getElementById('amphure').value = data.amphure_id;
        document.getElementById('amphure').dispatchEvent(new Event('change'));
        
        setTimeout(() => {
            document.getElementById('tambon').value = data.tambon_id;
            document.getElementById('zipcode').value = data.zip_code;
        }, 100);
    }, 100);

    historyBox.classList.add('hidden'); // เลือกแล้วปิดแถบประวัติ
}

  /**
   * ============================================================
   * 📊 3. DATA RENDERING (ส่วนแสดงผลข้อมูล)
   * ============================================================
   */
  
  // ฟังก์ชันดึงข้อมูลใหม่จาก Server (Google Apps Script)
  async function refreshDashboard() {
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getDashboard`);
        const data = await response.json();
        renderTable(data);
    } catch (err) {
        console.error("ไม่สามารถดึงข้อมูล Dashboard ได้:", err);
    }
}
  
  // ฟังก์ชันสร้าง HTML เพื่อแสดงข้อมูลในตารางและมือถือ
  // --- แก้ไขฟังก์ชัน renderTable ใน Section 3 ---
function renderTable(data) {
    const tbody = document.getElementById('queueTableBody');
    const mobileView = document.getElementById('mobileView');
    if (!tbody || !mobileView) return;

    let desktopContent = '';
    let mobileContent = '';

    data.forEach(item => {
        const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.default;

        // Desktop View: เพิ่มการแสดงหมายเหตุเล็กๆ ใต้ที่อยู่
        desktopContent += `
        <tr class="border-b hover:bg-gray-50 transition-colors">
          <td class="p-4">
            <div class="font-bold text-gray-800">${item.name}</div>
            <div class="text-xs text-gray-500">${item.phone}</div>
          </td>
          <td class="p-4 text-sm text-gray-600">
            <div>${item.address || '-'}</div>
            <div class="text-[10px] text-red-500 mt-1">${item.note ? '📝 ' + item.note : ''}</div>
          </td>
          <td class="p-4 text-center font-bold text-brand">฿${item.price}</td>
          <td class="p-4 text-center">
            <select onchange="changeStatus('${item.id}', this.value)" 
                    class="text-xs font-bold p-2 rounded-lg outline-none ${statusInfo.bg}">
              ${generateOptions(item.status)}
            </select>
          </td>
        </tr>`;

        // Mobile View: เพิ่มหมายเหตุ
        mobileContent += `
        <div class="bg-white border rounded-xl p-4 shadow-sm border-l-4 ${statusInfo.border} mb-3">
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="font-bold text-gray-800">${item.name}</div>
              <div class="text-[10px] text-gray-400">${item.id}</div>
            </div>
            <span class="text-brand font-bold">฿${item.price}</span>
          </div>
          <div class="text-xs text-gray-500 mb-1 italic text-wrap">📍 ${item.address || '-'}</div>
          ${item.note ? `<div class="text-[10px] text-red-500 mb-3 font-medium">📝 หมายเหตุ: ${item.note}</div>` : '<div class="mb-3"></div>'}
          <select onchange="changeStatus('${item.id}', this.value)" 
                  class="w-full text-xs p-2 rounded-lg font-bold bg-gray-50">
            ${generateOptions(item.status, true)}
          </select>
        </div>`;
    });

    tbody.innerHTML = desktopContent;
    mobileView.innerHTML = mobileContent;
}
  
  // ฟังก์ชันเสริมสำหรับสร้างรายการสถานะใน Select
  function generateOptions(selectedStatus, isMobile = false) {
	return Object.entries(STATUS_MAP)
	  .filter(([key]) => key !== 'default')
	  .map(([key, val]) => `
		<option value="${key}" ${selectedStatus === key ? 'selected' : ''}>
		  ${isMobile ? val.label.replace(/^[^\s]+\s/, '') : val.label}
		</option>
	  `).join('');
  }
  
  // ฟังก์ชันส่งการอัปเดตสถานะไปที่ Server
  async function changeStatus(id, newStatus) {
    try {
        // ส่งแบบ GET พร้อม action updateStatus
        const url = `${WEB_APP_URL}?action=updateStatus&id=${id}&status=${newStatus}`;
        
        // หมายเหตุ: การอัปเดตสถานะ ถ้าใช้ POST จะติด CORS ง่ายกว่า 
        // ดังนั้นผมแนะนำให้ใช้ fetch แบบ GET หรือเปลี่ยนใน Backend ให้รองรับครับ
        await fetch(url, { mode: 'no-cors' }); 
        
        showToast("อัปเดตสถานะสำเร็จ");
        // หน่วงเวลาเล็กน้อยให้ Google บันทึกเสร็จก่อนดึงใหม่
        setTimeout(refreshDashboard, 1000); 
    } catch (err) {
        console.error("ไม่สามารถอัปเดตสถานะได้:", err);
    }
}
  
  /**
   * ============================================================
   * 📝 4. FORM SUBMISSION (ส่วนส่งข้อมูล)
   * ============================================================
   */
  
   const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxNDjVbVBWDDGtBwL0kZxaDhXl90f2JRJUWIzYgZFS6QKIRG3wjcJ46u6WpsWSQiV0E/exec";

   // ฟังก์ชันส่งฟอร์มจอง
   document.getElementById('bookingForm').addEventListener('submit', function(e) {
	   e.preventDefault();
	   const btn = document.getElementById('submitBtn');
	   btn.disabled = true;
	   btn.innerHTML = "⌛ กำลังบันทึก...";
   
	   const formData = {
		phone: document.getElementById('phone').value,
		customerName: document.getElementById('customerName').value,
		address: document.getElementById('address').value,
		note: document.getElementById('note')?.value || '', 
		package: document.getElementById('package').options[document.getElementById('package').selectedIndex].text,
		netTotal: document.getElementById('netTotal').innerText,
		bookDate: document.getElementById('bookDate').value,
		bookTime: document.getElementById('bookTime').value,
		
		// --- จุดที่ต้องแก้: เปลี่ยนจาก .value เป็นดึงชื่อข้อความ ---
		province: document.getElementById('province').options[document.getElementById('province').selectedIndex].text,
		amphure: document.getElementById('amphure').options[document.getElementById('amphure').selectedIndex].text,
		tambon: document.getElementById('tambon').options[document.getElementById('tambon').selectedIndex].text,
		
		// เก็บ ID ไว้ด้วยเผื่อต้องใช้ค้นหาประวัติ (ชื่อฟิลด์ต้องตรงกับที่ส่งไป GAS)
		provinceId: document.getElementById('province').value,
		amphureId: document.getElementById('amphure').value,
		tambonId: document.getElementById('tambon').value,
		zipcode: document.getElementById('zipcode').value
	};
   
	   fetch(WEB_APP_URL, {
		   method: 'POST',
		   mode: 'no-cors', // สำคัญมากสำหรับความง่าย
		   body: JSON.stringify(formData)
	   })
	   .then(() => {
		   alert("บันทึกคิวสำเร็จ!");
		   this.reset();
		   if (typeof refreshDashboard === 'function') refreshDashboard();
	   })
	   .catch(err => alert("เกิดข้อผิดพลาด: " + err))
	   .finally(() => {
		   btn.disabled = false;
		   btn.innerHTML = "ยืนยันการจองคิว";
	   });
   });
  
  /**
   * ============================================================
   * 🚀 5. INITIAL LOAD (เริ่มทำงานทันทีที่เปิดเว็บ)
   * ============================================================
   */
  

   window.onload = () => {
    // 1. ตั้งค่าวันที่เริ่มต้น
    document.getElementById('bookDate').value = new Date().toISOString().split('T')[0];
    
    // 2. โหลดข้อมูลจังหวัด อำเภอ ตำบล (เพิ่มบรรทัดนี้)
    loadLocationData();
    
    // 3. เริ่มทำงานระบบ Dashboard
    refreshDashboard();
    setInterval(refreshDashboard, 60000); 
};