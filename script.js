const canvas = document.getElementById('canvas');
const workspace = document.getElementById('workspace');
const heightSlider = document.getElementById('heightSlider');
const heightLabel = document.getElementById('heightLabel');
const outputContainer = document.getElementById('output-container');
const codeOutput = document.getElementById('codeOutput');
const canvasResizer = document.getElementById('canvas-resizer');

const editSidebar = document.getElementById('edit-sidebar');
const closeEditBtn = document.getElementById('close-edit-sidebar');
const hoverEditBtn = document.getElementById('hover-edit-btn');
const measureTooltip = document.getElementById('measure-tooltip');

const mainEditTrigger = document.getElementById('mainEditTrigger');
const fastDuplicateTrigger = document.getElementById('fastDuplicateTrigger');
const fastDeleteTrigger = document.getElementById('fastDeleteTrigger');

const textEditSection = document.getElementById('text-edit-section');
const boxEditSection = document.getElementById('box-edit-section');
const floatColor = document.getElementById('floatColor');
const floatFont = document.getElementById('floatFont');
const floatSize = document.getElementById('floatSize');
const floatBgColor = document.getElementById('floatBgColor');
const floatRadius = document.getElementById('floatRadius');
const floatBorder = document.getElementById('floatBorder');
const floatBorderColor = document.getElementById('floatBorderColor');
const floatShadow = document.getElementById('floatShadow');
const floatRotate = document.getElementById('floatRotate');
const floatOpacity = document.getElementById('floatOpacity');
const floatDelete = document.getElementById('floatDelete');
const floatDuplicate = document.getElementById('floatDuplicate');

// Estado global de la aplicación
let selectedElements = []; 
let copiedElementsData = []; 
let isDragging = false;
let currentResizerDot = null; 

let dragPositions = []; 
let initW, initH, initL, initT, initX, initY;

const PX_TO_CM = 37.8;

// --- CAMBIO DE TEMA (MODO DÍA / NOCHE HACKER) ---
function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('themeToggleBtn');
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        btn.innerText = '🌙';
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        btn.innerText = '☀️';
    }
}

// Atajos del teclado (Ctrl+C / Ctrl+V)
let isCtrlPressed = false;
window.addEventListener('keydown', (e) => {
    if (e.key === 'Control' || e.key === 'Meta') isCtrlPressed = true;
    if (document.activeElement && document.activeElement.getAttribute('contenteditable') === 'true') return;

    if (isCtrlPressed && e.key.toLowerCase() === 'c') copySelected();
    if (isCtrlPressed && e.key.toLowerCase() === 'v') pasteSelected();
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'Control' || e.key === 'Meta') isCtrlPressed = false;
});

// --- ARRASTRE LIBRE SIN MÁRGENES Y REDIMENSIONAMIENTO (8 PUNTOS) ---
canvas.addEventListener('mousedown', (e) => {
    const dot = e.target.closest('.resize-dot');
    const targetEl = e.target.closest('.generated-element');

    if (dot) {
        currentResizerDot = dot;
        const activeEl = dot.parentElement;
        if (!selectedElements.includes(activeEl)) selectElement(activeEl);
        
        initW = activeEl.offsetWidth;
        initH = activeEl.offsetHeight;
        initL = parseFloat(activeEl.style.left || 0);
        initT = parseFloat(activeEl.style.top || 0);
        
        initX = e.clientX;
        initY = e.clientY;
        
        e.preventDefault();
        e.stopPropagation();
        showTooltipMedidas(activeEl);
    } 
    else if (targetEl) {
        selectElement(targetEl);
        targetEl.classList.remove('smooth-move'); 

        isDragging = true;
        dragPositions = selectedElements.map(el => ({
            element: el,
            offsetX: e.clientX - parseFloat(el.style.left || 0),
            offsetY: e.clientY - parseFloat(el.style.top || 0)
        }));
        showTooltipMedidas(targetEl);
    } 
    else if (e.target === canvas) {
        unselectAll();
    }
});

window.addEventListener('mousemove', (e) => {
    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;

    // 1. Lógica de Arrastre Líquido (Mover libremente por todo el lienzo)
    if (isDragging && selectedElements.length > 0) {
        selectedElements.forEach(target => {
            const dragData = dragPositions.find(d => d.element === target);
            if (dragData) {
                let nLeft = e.clientX - dragData.offsetX;
                let nTop = e.clientY - dragData.offsetY;

                const elW = target.offsetWidth;
                const elH = target.offsetHeight;

                // Restricción perimetral estricta (0 a ancho/alto total del lienzo)
                if (nLeft < 0) nLeft = 0;
                if (nTop < 0) nTop = 0;
                if (nLeft + elW > canvasW) nLeft = canvasW - elW;
                if (nTop + elH > canvasH) nTop = canvasH - elH;

                target.style.left = nLeft + "px";
                target.style.top = nTop + "px";
                
                showTooltipMedidas(target);
            }
        });
        updateEditButtonPosition();
    } 
    // 2. Lógica de Redimensionamiento de 8 Puntos (Estilo Canva)
    else if (currentResizerDot && selectedElements.length > 0) {
        const activeEl = selectedElements[selectedElements.length - 1];
        const inner = activeEl.querySelector('.inner-content');
        const dotType = currentResizerDot.classList[1]; 

        let diffX = e.clientX - initX;
        let diffY = e.clientY - initY;

        let finalW = initW;
        let finalH = initH;
        let finalL = initL;
        let finalT = initT;

        if (dotType.includes('r')) finalW = initW + diffX;
        if (dotType.includes('b')) finalH = initH + diffY;
        
        if (dotType.includes('l')) {
            finalW = initW - diffX;
            finalL = initL + diffX;
        }
        if (dotType.includes('t')) {
            finalH = initH - diffY;
            finalT = initT + diffY;
        }

        // Evitar desbordamientos externos durante el redimensionamiento
        if (finalL < 0) { finalW += finalL; finalL = 0; }
        if (finalT < 0) { finalH += finalT; finalT = 0; }
        if (finalL + finalW > canvasW) finalW = canvasW - finalL;
        if (currentResizerDot.classList.contains('rd-bc') || dotType.includes('b')) {
            if (finalT + finalH > canvasH) finalH = canvasH - finalT;
        }

        // Límites mínimos del objeto para no romperse
        if (finalW > 25 && (dotType.includes('l') || dotType.includes('r') || dotType.includes('c'))) {
            activeEl.style.left = finalL + "px";
            inner.style.width = finalW + "px";
        }
        if (finalH > 20 && (dotType.includes('t') || dotType.includes('b') || dotType.includes('c'))) {
            activeEl.style.top = finalT + "px";
            inner.style.height = finalH + "px";
        }

        showTooltipMedidas(activeEl);
        updateEditButtonPosition();
    }
});

window.addEventListener('mouseup', () => {
    if (isDragging) {
        selectedElements.forEach(el => el.classList.add('smooth-move'));
    }
    isDragging = false;
    currentResizerDot = null;
    measureTooltip.classList.remove('show');
});

// --- MENÚ FLOTANTE INTELIGENTE (VIEWPORT SAFE) ---
function updateEditButtonPosition() {
    if (selectedElements.length === 0) {
        hoverEditBtn.classList.remove('show');
        return;
    }
    const activeEl = selectedElements[selectedElements.length - 1];
    const rect = activeEl.getBoundingClientRect();
    const workspaceRect = workspace.getBoundingClientRect();
    
    hoverEditBtn.classList.add('show');
    
    let topPos = rect.top + window.scrollY - 38;
    let leftPos = rect.left + window.scrollX + (rect.width / 2) - 60;

    // Si choca arriba en la pantalla, se despliega abajo automáticamente
    if (topPos < workspaceRect.top + 5) {
        topPos = rect.bottom + window.scrollY + 10;
    }

    hoverEditBtn.style.left = leftPos + 'px';
    hoverEditBtn.style.top = topPos + 'px';
}

// --- INDICADOR MULTI-MÉTRICA EN TIEMPO REAL (PX / CM) ---
function showTooltipMedidas(el) {
    const rect = el.getBoundingClientRect();
    const wPx = el.offsetWidth;
    const hPx = el.offsetHeight;

    const wCm = (wPx / PX_TO_CM).toFixed(1);
    const hCm = (hPx / PX_TO_CM).toFixed(1);

    measureTooltip.innerText = `${wPx}x${hPx}px | ${wCm}x${hCm}cm`;
    measureTooltip.classList.add('show');

    measureTooltip.style.left = (rect.right + window.scrollX + 12) + 'px';
    measureTooltip.style.top = (rect.bottom + window.scrollY + 12) + 'px';
}

// Manejadores de los disparadores rápidos de la barra flotante
mainEditTrigger.addEventListener('click', openEditSidebar);
fastDuplicateTrigger.addEventListener('click', () => { copySelected(); pasteSelected(); });
fastDeleteTrigger.addEventListener('click', () => { applyToGroup(el => el.remove()); unselectAll(); });
closeEditBtn.addEventListener('click', closeEditSidebar);

function openEditSidebar() { editSidebar.classList.add('active'); updateInspectorValues(); }
function closeEditSidebar() { editSidebar.classList.remove('active'); }

function selectElement(el) {
    unselectAll();
    el.classList.add('smooth-move');
    el.classList.add('selected');
    selectedElements.push(el);
    updateEditButtonPosition();
    if (editSidebar.classList.contains('active')) updateInspectorValues();
}

function unselectAll() {
    document.querySelectorAll('.generated-element').forEach(el => {
        el.classList.remove('selected');
        el.classList.add('smooth-move');
    });
    selectedElements = [];
    hoverEditBtn.classList.remove('show');
    measureTooltip.classList.remove('show');
    closeEditSidebar(); 
}

function updateInspectorValues() {
    if (selectedElements.length === 0) return;
    const referenceEl = selectedElements[selectedElements.length - 1];
    const type = referenceEl.dataset.type;
    const inner = referenceEl.querySelector('.inner-content');
    const computed = window.getComputedStyle(inner);

    if (type === 'button') {
        textEditSection.style.display = 'flex';
        boxEditSection.style.display = 'flex';
    } else if (['title', 'paragraph', 'list', 'link'].includes(type)) {
        textEditSection.style.display = 'flex';
        boxEditSection.style.display = 'none';
    } else {
        textEditSection.style.display = 'none';
        boxEditSection.style.display = 'flex';
    }

    floatColor.value = rgbToHex(computed.color);
    floatSize.value = parseInt(computed.fontSize) || 16;
    floatBgColor.value = rgbToHex(computed.backgroundColor);
    floatRadius.value = parseInt(computed.borderRadius) || 0;
    floatBorder.value = parseInt(computed.borderWidth) || 0;
    floatBorderColor.value = rgbToHex(computed.borderColor);
    
    const currentTransform = referenceEl.style.transform;
    const matchRot = currentTransform.match(/rotate\((\d+)deg\)/);
    floatRotate.value = matchRot ? matchRot[1] : 0;
    floatOpacity.value = (window.getComputedStyle(referenceEl).opacity || 1) * 100;
}

function applyToGroup(callback) { selectedElements.forEach(callback); }

floatColor.addEventListener('input', (e) => { applyToGroup(el => el.querySelector('.inner-content').style.color = e.target.value); });
floatSize.addEventListener('input', (e) => { applyToGroup(el => el.querySelector('.inner-content').style.fontSize = e.target.value + "px"); });
floatFont.addEventListener('change', (e) => { applyToGroup(el => el.querySelector('.inner-content').style.fontFamily = e.target.value); });
floatBgColor.addEventListener('input', (e) => { applyToGroup(el => el.querySelector('.inner-content').style.backgroundColor = e.target.value); });
floatRadius.addEventListener('input', (e) => { applyToGroup(el => el.querySelector('.inner-content').style.borderRadius = e.target.value + "px"); });
floatBorder.addEventListener('input', (e) => { applyToGroup(el => { const i = el.querySelector('.inner-content'); i.style.borderStyle = 'solid'; i.style.borderWidth = e.target.value + "px"; }); });
floatBorderColor.addEventListener('input', (e) => { applyToGroup(el => el.querySelector('.inner-content').style.borderColor = e.target.value); });
floatShadow.addEventListener('input', (e) => { applyToGroup(el => el.querySelector('.inner-content').style.boxShadow = `0px ${e.target.value/2}px ${e.target.value}px rgba(0,0,0,0.25)`); });
floatRotate.addEventListener('input', (e) => { applyToGroup(el => el.style.transform = `rotate(${e.target.value}deg)`); });
floatOpacity.addEventListener('input', (e) => { applyToGroup(el => el.style.opacity = e.target.value / 100); });

floatDelete.addEventListener('click', () => { applyToGroup(el => el.remove()); unselectAll(); });
floatDuplicate.addEventListener('click', () => { copySelected(); pasteSelected(); });

function applyInlineFormat(cmd) { document.execCommand(cmd, false, null); }

// --- PORTAPAPELES INTERNO ---
function copySelected() {
    if (selectedElements.length === 0) return;
    copiedElementsData = selectedElements.map(el => ({
        type: el.dataset.type,
        htmlContent: el.innerHTML,
        left: parseFloat(el.style.left || 0),
        top: parseFloat(el.style.top || 0),
        transform: el.style.transform || 'none',
        opacity: el.style.opacity || '1'
    }));
}

function pasteSelected() {
    if (copiedElementsData.length === 0) return;
    const newClones = [];
    copiedElementsData.forEach(data => {
        const clone = document.createElement('div');
        clone.classList.add('generated-element', 'smooth-move');
        clone.dataset.type = data.type;
        clone.innerHTML = data.htmlContent;
        
        clone.style.left = (data.left + 30) + "px";
        clone.style.top = (data.top + 30) + "px";
        clone.style.transform = data.transform;
        clone.style.opacity = data.opacity;

        canvas.appendChild(clone);
        newClones.push(clone);

        data.left += 30;
        data.top += 30;
    });
    if(newClones.length > 0) selectElement(newClones[newClones.length - 1]);
}

// --- FÁBRICA DE COMPONENTES INTERACTIVOS ---
function addElement(type) {
    const newEl = document.createElement('div');
    newEl.classList.add('generated-element', 'smooth-move');
    newEl.dataset.type = type;

    let html = '';
    switch(type) {
        case 'header':
            html = `<header class="inner-content" style="background:#00f2fe; color:#000; width:850px; height:70px; padding:15px; font-weight:bold; font-size:1.3rem;" contenteditable="true">MAIN_HEADER // CONTROL PANEL</header>`;
            break;
        case 'footer':
            html = `<footer class="inner-content" style="background:#131419; color:#666; width:850px; height:50px; padding:15px; font-size:0.75rem; text-align:center;" contenteditable="true">SYS_FOOTER // DATA DISCLOSURE 2026</footer>`;
            break;
        case 'title':
            html = `<h1 class="inner-content" style="color:#222; font-size:2rem; font-weight:bold;" contenteditable="true">>> PROTOCOLO_TITULO</h1>`;
            break;
        case 'paragraph':
            html = `<p class="inner-content" style="color:#444; font-size:0.9rem; width:250px;" contenteditable="true">Contenido descriptivo procesado en nodo de terminal libre...</p>`;
            break;
        case 'square':
            html = `<div class="inner-content" style="background-color:#e4e7eb; width:120px; height:120px; border:1px solid #999;" contenteditable="true"></div>`;
            break;
        case 'list':
            html = `<ol class="inner-content" style="color:#333; padding-left:20px;" contenteditable="true"><li>Elemento_01</li><li>Elemento_02</li></ol>`;
            break;
        case 'link':
            html = `<a href="#" class="inner-content" style="color:#00ffcc; text-decoration:underline;" contenteditable="true" onclick="event.preventDefault()">HYPERLINK_NODAL</a>`;
            break;
        case 'button':
            html = `<button class="inner-content" style="background-color:#000; color:#00ffcc; border:1px solid #00ffcc; padding:10px 20px; font-size:0.8rem; font-weight:bold; cursor:pointer;" contenteditable="true">EJECUTAR_ACCION</button>`;
            break;
        case 'input':
            html = `<input type="text" class="inner-content" placeholder="Awaiting entry..." value="INPUT_NODE">`;
            break;
        case 'image':
            html = `<img class="inner-content" src="https://picsum.photos/200/150" style="width:200px; height:150px; object-fit:cover;" alt="Img">`;
            break;
        case 'audio':
            html = `<audio class="inner-content" controls style="width:250px;"><source src="#" type="audio/mpeg"></audio>`;
            break;
        case 'video':
            html = `<video class="inner-content" controls style="width:300px; height:170px; background:black;"><source src="#" type="video/mp4"></video>`;
            break;
        case 'table':
            html = `<table class="inner-content" style="border-collapse:collapse; width:240px; text-align:left;" border="1"><thead style="background:#eee;"><tr><th>SYS_ID</th><th>VAL</th></tr></thead><tbody contenteditable="true"><tr><td>0x01</td><td>FF</td></tr></tbody></table>`;
            break;
    }

    // Estructuración simétrica de los 8 tiradores perimetrales estilo Canva
    const dotsHtml = `
        <div class="resize-dot rd-tl"></div><div class="resize-dot rd-tc"></div><div class="resize-dot rd-tr"></div>
        <div class="resize-dot rd-lc"></div>                                  <div class="resize-dot rd-rc"></div>
        <div class="resize-dot rd-bl"></div><div class="resize-dot rd-bc"></div><div class="resize-dot rd-br"></div>
    `;

    newEl.innerHTML = html + dotsHtml;
    canvas.appendChild(newEl);
    selectElement(newEl);
}

// --- CONFIGURACIÓN DINÁMICA DEL LIENZO ---
function updateCanvasBg(color) { canvas.style.backgroundColor = color; }
function resizeCanvas(h) { canvas.style.height = h+"px"; heightLabel.innerText = `Alto Lienzo: ${h}px`; heightSlider.value = h; }

let isResizingCanvas = false;
canvasResizer.addEventListener('mousedown', () => { isResizingCanvas = true; document.body.style.cursor = 'ns-resize'; });
window.addEventListener('mousemove', (e) => {
    if (!isResizingCanvas) return;
    let nH = e.clientY - canvas.getBoundingClientRect().top;
    if (nH >= 300 && nH <= 3000) resizeCanvas(nH);
});
window.addEventListener('mouseup', () => { if(isResizingCanvas) { isResizingCanvas = false; document.body.style.cursor='default'; } });

// --- MOTOR DE EXPORTACIÓN INTELIGENTE (RESPONSIVE FULL WINDOW 100VW) ---
function generateCode() {
    const elements = canvas.querySelectorAll('.generated-element');
    let htmlContent = '';
    const canvasBg = canvas.style.backgroundColor || '#ffffff';
    const canvasHeight = canvas.style.height || '600px';

    elements.forEach((el) => {
        const inner = el.querySelector('.inner-content');
        const cleanInner = inner.cloneNode(true);
        cleanInner.removeAttribute('contenteditable');
        
        const currentWidth = el.offsetWidth;
        const leftPercent = (parseFloat(el.style.left || 0) / 850) * 100;
        
        let widthStyle = inner.style.width || `${inner.offsetWidth}px`;
        let leftStyle = `${leftPercent}%`;
        let elementAlignStyles = "";

        // Si el objeto cubre todo o casi todo el ancho del lienzo, se expande al 100% real
        if (currentWidth >= 840) {
            widthStyle = "100%";
            leftStyle = "0";
            cleanInner.style.width = "100%";
            elementAlignStyles = "right: 0; box-sizing: border-box;";
        }

        const wrapperStyles = `position: absolute; left: ${leftStyle}; top: ${el.style.top}; width: ${widthStyle}; transform: ${el.style.transform || 'none'}; opacity: ${el.style.opacity || '1'}; ${elementAlignStyles}`;
        htmlContent += `  <div style="${wrapperStyles}">\n    ${cleanInner.outerHTML}\n  </div>\n`;
    });

    const fullPageCode = 
`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sitio Web Adaptable Full-Width</title>
  <style>
    /* CSS RESET: Mata márgenes indeseados del navegador en los extremos */
    html, body { 
      margin: 0; 
      padding: 0; 
      width: 100%;
      overflow-x: hidden;
    }
    body { 
      background-color: ${canvasBg}; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
    }
    
    /* El contenedor maestro fluye libremente al ancho completo del Viewport */
    .web-container {
      position: relative;
      width: 100vw; 
      height: ${canvasHeight};
      margin: 0;
      padding: 0;
    }
    
    @media (max-width: 768px) {
      .web-container { height: auto; min-height: 100vh; }
    }
  </style>
</head>
<body>

  <div class="web-container">
${htmlContent}  </div>

</body>
</html>`;

    codeOutput.value = fullPageCode;
    outputContainer.style.display = 'block';
    outputContainer.scrollIntoView({ behavior: 'smooth' });
}

// --- TRANSMISIÓN DIRECTA AL PORTAPAPELES (COPIAR CÓDIGO) ---
function copyToClipboard() {
    const codeArea = document.getElementById('codeOutput');
    const copyBtn = document.getElementById('btnCopyClipboard');
    
    codeArea.select();
    codeArea.setSelectionRange(0, 99999); 
    
    navigator.clipboard.writeText(codeArea.value).then(() => {
        // Alerta visual de ejecución exitosa
        copyBtn.innerText = "[ ¡COPIADO CON ÉXITO! ]";
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.innerText = "[ COPIAR CÓDIGO ]";
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Error del sistema al copiar: ', err);
    });
}

// Transformador de formatos RGB
function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith("#")) return rgb || "#000000";
    if (rgb === "rgba(0, 0, 0, 0)" || rgb === "transparent") return "#ffffff";
    const values = rgb.match(/\d+/g);
    if (!values) return "#000000";
    return "#" + values.slice(0, 3).map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}