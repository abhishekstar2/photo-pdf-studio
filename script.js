// टैब बदलने का फंक्शन
function switchTool(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// नीचे के क्विक कार्ड्स से सीधे साइज और टूल सेट करने के लिए
function quickAction(tabId, kbValue) {
    switchTool(tabId);
    if (kbValue) {
        document.getElementById('target-kb').value = kbValue;
    }
}

// ==========================================
// 1. MB to KB / KB to MB & RESIZE TOOL
// ==========================================
let originalImage = new Image();
let selectedFormat = 'image/jpeg';

function selectFormat(fmt, btn) {
    selectedFormat = fmt;
    document.querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function updateQualityLabel(val) {
    document.getElementById('qual-val').innerText = val + "%";
}

function setPresetKB(kb) {
    document.getElementById('target-kb').value = kb;
}

document.getElementById('comp-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('selected-file-name').innerText = file.name;
    document.getElementById('orig-size').innerText = (file.size / 1024).toFixed(2) + " KB";
    
    const reader = new FileReader();
    reader.onload = function(event) {
        originalImage.src = event.target.result;
        originalImage.onload = function() {
            document.getElementById('orig-dim').innerText = `${originalImage.width} x ${originalImage.height} px`;
            document.getElementById('comp-controls').classList.remove('hidden');
        }
    };
    reader.readAsDataURL(file);
});

function processCompressResize() {
    if (!originalImage.src) {
        alert("कृपया पहले कोई फोटो अपलोड करें!");
        return;
    }

    const targetKB = parseFloat(document.getElementById('target-kb').value);
    const sliderQuality = parseInt(document.getElementById('quality-slider').value) / 100;
    let width = parseInt(document.getElementById('resize-w').value) || originalImage.width;
    let height = parseInt(document.getElementById('resize-h').value) || originalImage.height;

    // अगर KB से MB बढ़ाना हो और टारगेट साइज बड़ा दिया हो
    if (targetKB && targetKB > 600 && !document.getElementById('resize-w').value) {
        width = Math.max(width, 2200);
        height = Math.round((originalImage.height / originalImage.width) * width);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(originalImage, 0, 0, width, height);

    let dataUrl = canvas.toDataURL(selectedFormat, sliderQuality);
    let sizeKB = Math.round((dataUrl.length * 3 / 4) / 1024);

    if (targetKB) {
        if (sizeKB > targetKB) {
            let minQ = 0.05, maxQ = 0.95;
            for (let i = 0; i < 9; i++) {
                let midQ = (minQ + maxQ) / 2;
                dataUrl = canvas.toDataURL('image/jpeg', midQ);
                sizeKB = Math.round((dataUrl.length * 3 / 4) / 1024);
                if (sizeKB > targetKB) maxQ = midQ;
                else minQ = midQ;
            }
        } else if (sizeKB < targetKB) {
            dataUrl = canvas.toDataURL('image/png');
            sizeKB = Math.round((dataUrl.length * 3 / 4) / 1024);
        }
    }

    const ext = selectedFormat === 'image/png' ? 'png' : (selectedFormat === 'image/webp' ? 'webp' : 'jpg');
    document.getElementById('new-size').innerText = `${sizeKB} KB (${(sizeKB/1024).toFixed(2)} MB)`;
    document.getElementById('comp-preview').src = dataUrl;
    
    const dlLink = document.getElementById('comp-download');
    dlLink.href = dataUrl;
    dlLink.download = `smart-photo-${sizeKB}kb.${ext}`;
    document.getElementById('comp-result').classList.remove('hidden');
}

// ==========================================
// 2. CROP TOOL
// ==========================================
let cropper;
document.getElementById('crop-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = document.getElementById('crop-image');
        img.src = event.target.result;
        document.getElementById('crop-area').classList.remove('hidden');
        
        if (cropper) cropper.destroy();
        cropper = new Cropper(img, { viewMode: 1, autoCropArea: 0.85 });
    };
    reader.readAsDataURL(file);
});

function setAspectRatio(ratio) {
    if (cropper) cropper.setAspectRatio(ratio);
}

function cropAndDownload() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas();
    const link = document.createElement('a');
    link.download = 'cropped-photo.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
}

// ==========================================
// 3. PASSPORT SIZE PHOTO MAKER
// ==========================================
let passImg = new Image();
document.getElementById('pass-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        passImg.src = ev.target.result;
        passImg.onload = () => document.getElementById('pass-controls').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

function generatePassportSheet() {
    const count = parseInt(document.getElementById('pass-count').value);
    const borderColor = document.getElementById('pass-border').value;
    
    const canvas = document.getElementById('pass-canvas');
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pW = 180, pH = 230, gap = 20, margin = 30;
    let drawn = 0;

    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            if (drawn >= count) break;
            const x = margin + col * (pW + gap);
            const y = margin + row * (pH + gap);

            ctx.drawImage(passImg, x, y, pW, pH);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, pW, pH);
            drawn++;
        }
    }

    const dl = document.getElementById('pass-download');
    dl.href = canvas.toDataURL('image/jpeg', 0.95);
    document.getElementById('pass-result').classList.remove('hidden');
}

// ==========================================
// 4. SIGNATURE MAKER & CLEANER
// ==========================================
const signCanvas = document.getElementById('sign-pad');
const signaturePad = new SignaturePad(signCanvas, {
    backgroundColor: 'rgb(255, 255, 255)',
    penColor: 'rgb(0, 0, 128)'
});

function clearSignPad() {
    signaturePad.clear();
}

function downloadDrawnSign() {
    if (signaturePad.isEmpty()) {
        alert("कृपया पहले बॉक्स में हस्ताक्षर करें!");
        return;
    }
    const link = document.createElement('a');
    link.download = 'digital-signature.jpg';
    link.href = signaturePad.toDataURL('image/jpeg');
    link.click();
}

document.getElementById('sign-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(ev) {
        const img = new Image();
        img.src = ev.target.result;
        img.onload = function() {
            const canvas = document.getElementById('sign-clean-canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            ctx.filter = 'grayscale(100%) contrast(220%) brightness(120%)';
            ctx.drawImage(img, 0, 0);

            const dl = document.getElementById('sign-clean-dl');
            dl.href = canvas.toDataURL('image/jpeg', 0.95);
            document.getElementById('sign-clean-box').classList.remove('hidden');
        };
    };
    reader.readAsDataURL(file);
});

// ==========================================
// 5. IMAGE TO PDF
// ==========================================
document.getElementById('pdf-input').addEventListener('change', function(e) {
    const count = e.target.files.length;
    document.getElementById('pdf-count-text').innerText = `✅ ${count} फोटो चुनी गई हैं।`;
});

async function createPDF() {
    const files = document.getElementById('pdf-input').files;
    if (files.length === 0) {
        alert("कृपया कम से कम एक फोटो चुनें!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    for (let i = 0; i < files.length; i++) {
        const imgData = await readFileAsDataURL(files[i]);
        const img = await loadImage(imgData);

        if (i > 0) pdf.addPage();

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min((pageWidth - 20) / img.width, (pageHeight - 20) / img.height);
        
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (pageWidth - w) / 2;
        const y = (pageHeight - h) / 2;

        pdf.addImage(imgData, 'JPEG', x, y, w, h);
    }

    pdf.save('smart-documents.pdf');
}

function readFileAsDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}
// ==========================================
// 6. NAME & DATE ON PHOTO (SSC/RRB Helper)
// ==========================================
function generateNameDatePhoto() {
    const fileInput = document.getElementById('nd-input');
    const nameText = document.getElementById('nd-name').value.trim().toUpperCase();
    const dateText = document.getElementById('nd-date').value.trim().toUpperCase();

    if (!fileInput.files[0]) {
        alert("कृपया पहले अपनी फोटो चुनें!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            const canvas = document.getElementById('nd-canvas');
            const ctx = canvas.getContext('2d');

            const w = 400;
            const h = 500;
            const stripHeight = 85;

            canvas.width = w;
            canvas.height = h;

            // फोटो ड्रॉ करें
            ctx.drawImage(img, 0, 0, w, h - stripHeight);

            // नीचे सफेद पट्टी
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, h - stripHeight, w, stripHeight);

            // ऊपर काली बॉर्डर लाइन
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, h - stripHeight);
            ctx.lineTo(w, h - stripHeight);
            ctx.stroke();

            // नाम और तारीख लिखें
            ctx.fillStyle = "#000000";
            ctx.textAlign = "center";
            ctx.font = "bold 22px Arial";
            ctx.fillText(nameText || "YOUR NAME", w / 2, h - 50);

            ctx.font = "bold 19px Arial";
            ctx.fillText(dateText || "DOP: DD-MM-YYYY", w / 2, h - 18);

            const dl = document.getElementById('nd-download');
            dl.href = canvas.toDataURL('image/jpeg', 0.92);
            document.getElementById('nd-result').classList.remove('hidden');
        };
    };
    reader.readAsDataURL(fileInput.files[0]);
}