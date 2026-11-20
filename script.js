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
// 6. AI BACKGROUND REMOVER & COLOR CHANGER
// ==========================================
let selectedBgColor = '#FFFFFF';

function setBgColor(color) {
    selectedBgColor = color;
    if (color !== 'transparent') {
        document.getElementById('bg-custom-color').value = color;
    }
}

document.getElementById('bg-custom-color').addEventListener('input', function(e) {
    selectedBgColor = e.target.value;
});

async function processBackgroundRemoval() {
    const fileInput = document.getElementById('bg-input');
    const statusText = document.getElementById('bg-status');

    if (!fileInput.files[0]) {
        alert("कृपया पहले अपनी फोटो चुनें!");
        return;
    }

    statusText.innerText = "⏳ AI मॉडल लोड हो रहा है और बैकग्राउंड हटाया जा रहा है... कृपया 3-5 सेकंड रुकें।";

    const img = await loadImage(await readFileAsDataURL(fileInput.files[0]));
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    const selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });

    selfieSegmentation.setOptions({ modelSelection: 1 });

    selfieSegmentation.onResults((results) => {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (selectedBgColor !== 'transparent') {
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = selectedBgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.restore();

        const dl = document.getElementById('bg-download');
        dl.href = canvas.toDataURL('image/png');
        document.getElementById('bg-result').classList.remove('hidden');
        statusText.innerText = "✅ बैकग्राउंड सफलतापूर्वक बदल दिया गया है!";
    });

    await selfieSegmentation.send({ image: img });
}

// ==========================================
// 7. MERGE PHOTO & SIGNATURE
// ==========================================
async function mergePhotoAndSign() {
    const photoFile = document.getElementById('ps-photo-input').files[0];
    const signFile = document.getElementById('ps-sign-input').files[0];

    if (!photoFile || !signFile) {
        alert("कृपया फोटो और सिग्नेचर दोनों अपलोड करें!");
        return;
    }

    const photoImg = await loadImage(await readFileAsDataURL(photoFile));
    const signImg = await loadImage(await readFileAsDataURL(signFile));

    const canvas = document.getElementById('ps-canvas');
    const ctx = canvas.getContext('2d');

    const w = 400;
    const photoH = 450;
    const signH = 130;

    canvas.width = w;
    canvas.height = photoH + signH;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(photoImg, 0, 0, w, photoH);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, photoH);
    ctx.lineTo(w, photoH);
    ctx.stroke();

    ctx.drawImage(signImg, 10, photoH + 10, w - 20, signH - 20);
    ctx.strokeRect(1, 1, w - 2, canvas.height - 2);

    const dl = document.getElementById('ps-download');
    dl.href = canvas.toDataURL('image/jpeg', 0.95);
    document.getElementById('ps-result').classList.remove('hidden');
}

// ==========================================
// 8. ADD DATE & NAME ON PHOTO
// ==========================================
document.getElementById('nd-date-picker').valueAsDate = new Date();

function generateNameDatePhoto() {
    const fileInput = document.getElementById('nd-input');
    const rawDate = document.getElementById('nd-date-picker').value;
    const prefix = document.getElementById('nd-date-prefix').value;
    const nameText = document.getElementById('nd-name').value.trim().toUpperCase();

    if (!fileInput.files[0]) {
        alert("कृपया पहले अपनी फोटो चुनें!");
        return;
    }

    let formattedDate = "";
    if (rawDate) {
        const parts = rawDate.split('-');
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const finalDateLine = prefix + formattedDate;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            const canvas = document.getElementById('nd-canvas');
            const ctx = canvas.getContext('2d');

            const w = 400;
            const h = 500;
            const stripHeight = nameText ? 85 : 55;

            canvas.width = w;
            canvas.height = h;

            ctx.drawImage(img, 0, 0, w, h - stripHeight);

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, h - stripHeight, w, stripHeight);

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, h - stripHeight);
            ctx.lineTo(w, h - stripHeight);
            ctx.stroke();

            ctx.fillStyle = "#000000";
            ctx.textAlign = "center";

            if (nameText) {
                ctx.font = "bold 21px Arial";
                ctx.fillText(nameText, w / 2, h - 50);
                ctx.font = "bold 19px Arial";
                ctx.fillText(finalDateLine, w / 2, h - 18);
            } else {
                ctx.font = "bold 22px Arial";
                ctx.fillText(finalDateLine, w / 2, h - 20);
            }

            const dl = document.getElementById('nd-download');
            dl.href = canvas.toDataURL('image/jpeg', 0.94);
            document.getElementById('nd-result').classList.remove('hidden');
        };
    };
    reader.readAsDataURL(fileInput.files[0]);
}