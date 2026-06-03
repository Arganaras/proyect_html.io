/**
 * ==========================================================================
 * VISUAL PAGE BUILDER PRO V2 - LÓGICA PRINCIPAL (APP CORE)
 * ==========================================================================
 */

// 1. ESTADO GLOBAL DE LA APLICACIÓN (STATE MANAGEMENT)
const AppState = {
    project: {
        name: "Landing Page Principal",
        device: "desktop", // desktop | laptop | tablet | mobile
        canvasWidth: 1440,
        zoom: 100,
        theme: "dark"
    },
    canvas: {
        elements: [], // Array de objetos con la data de cada elemento
        selectedId: null, // ID del elemento actualmente seleccionado
        hoveredId: null,
        counter: 0 // Para generar IDs únicos
    },
    history: {
        past: [], // Pila de Undo
        future: [] // Pila de Redo
    },
    drag: {
        isDragging: false,
        element: null,
        startX: 0,
        startY: 0,
        initialLeft: 0,
        initialTop: 0,
        isResizing: false,
        handle: null
    },
    config: {
        snapGrid: 20, // Snapping a grilla de 20px
        snapTolerance: 10
    }
};

// 2. INICIALIZACIÓN Y CARGA
document.addEventListener("DOMContentLoaded", () => {
    // Renderizar iconos de Lucide (SVG Inyección)
    lucide.createIcons();

    // Simular carga de módulos
    simulateAppLoading();
    
    // Inicializar Módulos Principales
    initUIEvents();
    initDragAndDrop();
    initCanvasInteractions();
    initPropertiesPanel();
    initKeyboardShortcuts();
    initContextMenu();
    
    // Guardar estado inicial en el historial
    saveHistoryState();
});

function simulateAppLoading() {
    const loader = document.getElementById('loadingScreen');
    const progress = document.getElementById('loadProgress');
    const text = document.getElementById('loadText');
    
    let percent = 0;
    const interval = setInterval(() => {
        percent += Math.floor(Math.random() * 15) + 5;
        if (percent > 100) percent = 100;
        
        progress.style.width = `${percent}%`;
        
        if (percent < 30) text.innerText = "Cargando motor de renderizado...";
        else if (percent < 60) text.innerText = "Inicializando eventos del DOM...";
        else if (percent < 90) text.innerText = "Configurando panel de propiedades...";
        else text.innerText = "¡Listo!";
        
        if (percent === 100) {
            clearInterval(interval);
            setTimeout(() => {
                loader.classList.add('hidden');
                document.body.classList.remove('editor-loading');
                showToast("Entorno de trabajo cargado correctamente", "success");
            }, 500);
        }
    }, 150);
}

// 3. EVENTOS DE INTERFAZ GENERAL (UI)
function initUIEvents() {
    // Cambio de Tema (Oscuro/Claro)
    document.getElementById('btnThemeToggle').addEventListener('click', () => {
        document.body.classList.toggle('theme-light');
        AppState.project.theme = document.body.classList.contains('theme-light') ? 'light' : 'dark';
        showToast(`Tema cambiado a ${AppState.project.theme === 'light' ? 'Claro' : 'Oscuro'}`);
    });

    // Pestañas del Sidebar Izquierdo
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.panel-section').forEach(p => p.classList.remove('active'));
            
            const targetId = e.currentTarget.getAttribute('data-target');
            e.currentTarget.classList.add('active');
            document.getElementById(targetId).classList.add('active');
            
            if (targetId === 'panel-layers') updateLayersPanel();
        });
    });

    // Acordeones del Panel de Elementos
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            item.classList.toggle('active');
        });
    });

    // Pestañas del Panel de Propiedades
    document.querySelectorAll('.prop-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.prop-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.prop-pane').forEach(p => p.classList.remove('active'));
            
            const targetId = e.currentTarget.getAttribute('data-tab');
            e.currentTarget.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Cambio de Dispositivo (Resolución del Canvas)
    document.querySelectorAll('.device-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
            const targetBtn = e.currentTarget;
            targetBtn.classList.add('active');
            
            const device = targetBtn.getAttribute('data-device');
            AppState.project.device = device;
            
            const canvas = document.getElementById('mainCanvas');
            const display = document.getElementById('canvasDimensionsDisplay');
            
            switch(device) {
                case 'desktop': canvas.style.width = '1440px'; display.innerText = '1440 x 900 px'; break;
                case 'laptop': canvas.style.width = '1024px'; display.innerText = '1024 x 768 px'; break;
                case 'tablet': canvas.style.width = '768px'; display.innerText = '768 x 1024 px'; break;
                case 'mobile': canvas.style.width = '390px'; display.innerText = '390 x 844 px'; break;
            }
            
            showToast(`Resolución adaptada para ${device}`);
        });
    });

    // Controles de Zoom
    document.getElementById('btnZoomIn').addEventListener('click', () => setZoom(AppState.project.zoom + 10));
    document.getElementById('btnZoomOut').addEventListener('click', () => setZoom(AppState.project.zoom - 10));
    document.getElementById('btnZoomReset').addEventListener('click', () => setZoom(100));

    // Exportación Modal
    document.getElementById('btnExportCode').addEventListener('click', generateExportCode);
    document.getElementById('btnCloseExport').addEventListener('click', () => document.getElementById('modalExport').style.display = 'none');
    document.getElementById('btnCancelExport').addEventListener('click', () => document.getElementById('modalExport').style.display = 'none');
    document.getElementById('btnDownloadZip').addEventListener('click', () => {
        showToast("Generando archivo ZIP simulado...", "success");
        setTimeout(() => document.getElementById('modalExport').style.display = 'none', 1000);
    });

    // Guardado (Simulado)
    document.getElementById('btnSaveSimulated').addEventListener('click', () => {
        const btn = document.getElementById('btnSaveSimulated');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader-2" class="spin-icon" style="width:16px; height:16px; color:white;"></i> Guardando...`;
        lucide.createIcons();
        
        // Simular llamada a API
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            showToast("Proyecto guardado correctamente en la base de datos", "success");
            const d = new Date();
            document.getElementById('projectStatus').innerHTML = `<i data-lucide="check-circle-2"></i> Guardado ${d.getHours()}:${d.getMinutes()}`;
            lucide.createIcons();
        }, 1500);
    });

    // Deshacer / Rehacer botones globales
    document.getElementById('btnUndoGlobal').addEventListener('click', undo);
    document.getElementById('btnRedoGlobal').addEventListener('click', redo);
}

function setZoom(level) {
    if (level < 20) level = 20;
    if (level > 200) level = 200;
    AppState.project.zoom = level;
    
    document.getElementById('zoomLevelDisplay').innerText = `${level}%`;
    const canvas = document.getElementById('mainCanvas');
    canvas.style.transform = `scale(${level / 100})`;
    
    // Reposicionar menús si es necesario
}

// 4. DRAG AND DROP DESDE SIDEBAR AL CANVAS
function initDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-el, .draggable-block');
    const canvas = document.getElementById('mainCanvas');
    const canvasArea = document.getElementById('canvasScrollArea');

    draggables.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('element_type', item.getAttribute('data-type'));
            e.dataTransfer.effectAllowed = 'copy';
        });
    });

    canvasArea.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necesario para permitir el drop
        e.dataTransfer.dropEffect = 'copy';
    });

    canvasArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('element_type');
        if (!type) return;

        // Calcular posición relativa al canvas considerando el zoom y scroll
        const rect = canvas.getBoundingClientRect();
        const scale = AppState.project.zoom / 100;
        
        let x = (e.clientX - rect.left) / scale;
        let y = (e.clientY - rect.top) / scale;

        // Snapping a grilla inicial
        x = Math.round(x / AppState.config.snapGrid) * AppState.config.snapGrid;
        y = Math.round(y / AppState.config.snapGrid) * AppState.config.snapGrid;

        createElementOnCanvas(type, x, y);
    });
}

// 5. CREACIÓN DE ELEMENTOS
function createElementOnCanvas(type, x, y) {
    // Ocultar estado vacío
    const emptyState = document.getElementById('canvasEmptyState');
    if (emptyState) emptyState.style.display = 'none';

    AppState.canvas.counter++;
    const id = `el_${type.replace('-', '_')}_${AppState.canvas.counter}`;
    
    // Crear objeto de datos (Virtual DOM)
    const elementData = {
        id: id,
        type: type,
        name: `${type} ${AppState.canvas.counter}`,
        locked: false,
        style: {
            left: `${x}px`,
            top: `${y}px`,
            width: getDefaultWidth(type),
            height: getDefaultHeight(type),
            backgroundColor: getDefaultColor(type),
            color: type.includes('text') || type.includes('button') ? '#0f172a' : '',
            fontSize: type.includes('heading') ? '32px' : '16px',
            fontWeight: '400',
            borderRadius: type.includes('button') ? '6px' : '0px',
            borderWidth: '0px',
            borderColor: '#000000',
            borderStyle: 'none',
            paddingTop: '0px', paddingRight: '0px', paddingBottom: '0px', paddingLeft: '0px',
            opacity: '1',
            zIndex: AppState.canvas.elements.length + 1
        },
        content: getDefaultContent(type),
        attributes: {
            customClasses: '',
            href: type === 'text-link' ? '#' : '',
            src: type === 'media-image' ? 'https://via.placeholder.com/300x200' : ''
        }
    };

    AppState.canvas.elements.push(elementData);
    
    // Crear nodo DOM real
    renderElementToCanvas(elementData);
    
    // Guardar estado y seleccionar
    saveHistoryState();
    selectElement(id);
    updateLayersPanel();
    updateFooterStats();
}

// Funciones Auxiliares para valores por defecto según tipo
function getDefaultWidth(type) {
    if (type.includes('section') || type.includes('block')) return '100%';
    if (type.includes('button')) return '120px';
    if (type.includes('image')) return '300px';
    return '250px';
}
function getDefaultHeight(type) {
    if (type.includes('section')) return '300px';
    if (type.includes('button')) return '45px';
    if (type.includes('image')) return '200px';
    return 'auto';
}
function getDefaultColor(type) {
    if (type.includes('button')) return '#3b82f6'; // Primary blue
    if (type.includes('section') || type.includes('container')) return '#f8fafc';
    return 'transparent';
}
function getDefaultContent(type) {
    if (type === 'text-heading') return 'Doble click para editar título';
    if (type === 'text-paragraph') return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.';
    if (type === 'form-button') return 'Enviar';
    if (type.includes('block-hero')) return '<h1 style="font-size:48px; margin-bottom:20px;">Hero Section</h1><p>Subtítulo de la sección principal.</p><button style="padding:12px 24px; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer; margin-top:20px;">Llamada a la acción</button>';
    return '';
}

function renderElementToCanvas(data) {
    const canvas = document.getElementById('mainCanvas');
    
    const el = document.createElement('div');
    el.id = data.id;
    el.className = `vpb-element type-${data.type} ${data.attributes.customClasses}`;
    
    // Aplicar estilos
    applyStylesToNode(el, data.style);
    
    // Aplicar contenido especial según tipo
    if (data.type === 'media-image') {
        el.innerHTML = `<img src="${data.attributes.src}" style="width:100%; height:100%; object-fit:cover; pointer-events:none;" />`;
    } else {
        el.innerHTML = data.content;
    }

    // Añadir Handles de resize (8 puntos)
    const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
    handles.forEach(pos => {
        const h = document.createElement('div');
        h.className = `resize-handle ${pos}`;
        h.setAttribute('data-handle', pos);
        el.appendChild(h);
    });

    canvas.appendChild(el);
}

function applyStylesToNode(node, styles) {
    for (const [key, value] of Object.entries(styles)) {
        node.style[key] = value;
    }
}

// 6. INTERACCIÓN EN EL CANVAS (SELECCIÓN, DRAG, RESIZE)
function initCanvasInteractions() {
    const canvas = document.getElementById('mainCanvas');
    const wrapper = document.getElementById('canvasScrollArea');

    // Mousedown Global (Delegación de eventos)
    wrapper.addEventListener('mousedown', (e) => {
        // Ignorar si es click derecho (eso abre el context menu)
        if (e.button !== 0) return;

        const target = e.target;
        
        // Clic en el canvas vacío deselecciona
        if (target.id === 'mainCanvas' || target.id === 'canvasScrollArea') {
            deselectAll();
            return;
        }

        // Clic en un elemento del canvas
        const elementNode = target.closest('.vpb-element');
        if (elementNode) {
            e.stopPropagation(); // Evitar que burbujee al canvas vacío
            const id = elementNode.id;
            
            // Si el elemento está bloqueado, no hacer nada a menos que se fuerce desde capas
            const data = AppState.canvas.elements.find(el => el.id === id);
            if (data && data.locked) return;

            selectElement(id);

            // Determinar si es drag o resize
            if (target.classList.contains('resize-handle')) {
                startResize(e, elementNode, target.getAttribute('data-handle'));
            } else {
                startDrag(e, elementNode);
            }
        }
    });

    // Menú Contextual
    wrapper.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const elementNode = e.target.closest('.vpb-element');
        if (elementNode) {
            selectElement(elementNode.id);
            showContextMenu(e.clientX, e.clientY);
        } else {
            deselectAll();
            hideContextMenu();
        }
    });
}

function selectElement(id) {
    if (AppState.canvas.selectedId === id) return; // Ya seleccionado
    
    // Limpiar selección previa UI
    document.querySelectorAll('.vpb-element').forEach(el => el.classList.remove('selected'));
    
    AppState.canvas.selectedId = id;
    
    if (id) {
        const node = document.getElementById(id);
        if (node) node.classList.add('selected');
        
        // Actualizar UI
        const data = AppState.canvas.elements.find(el => el.id === id);
        if (data) {
            document.getElementById('selectedElementType').innerText = data.type.toUpperCase();
            document.getElementById('propsEmptyState').style.display = 'none';
            document.getElementById('propsContent').style.display = 'block';
            
            // Actualizar breadcrumbs
            document.getElementById('elementBreadcrumbs').innerHTML = `
                <span>Body</span> <i data-lucide="chevron-right"></i>
                <span class="active-crumb">${data.name}</span>
            `;
            lucide.createIcons();

            populatePropertiesPanel(data);
        }
    }
}

function deselectAll() {
    AppState.canvas.selectedId = null;
    document.querySelectorAll('.vpb-element').forEach(el => el.classList.remove('selected'));
    
    document.getElementById('selectedElementType').innerText = 'Ninguno';
    document.getElementById('propsEmptyState').style.display = 'block';
    document.getElementById('propsContent').style.display = 'none';
    
    document.getElementById('elementBreadcrumbs').innerHTML = `
        <span>Body</span> <i data-lucide="chevron-right"></i>
        <span class="active-crumb">Selecciona un elemento</span>
    `;
    lucide.createIcons();
    hideContextMenu();
}

// Lógica de Movimiento (Arrastre) en Canvas
function startDrag(e, node) {
    AppState.drag.isDragging = true;
    AppState.drag.element = node;
    AppState.drag.startX = e.clientX;
    AppState.drag.startY = e.clientY;
    
    // Parsear posiciones actuales
    AppState.drag.initialLeft = parseFloat(node.style.left) || 0;
    AppState.drag.initialTop = parseFloat(node.style.top) || 0;

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
}

function handleDrag(e) {
    if (!AppState.drag.isDragging) return;

    const scale = AppState.project.zoom / 100;
    const dx = (e.clientX - AppState.drag.startX) / scale;
    const dy = (e.clientY - AppState.drag.startY) / scale;

    let newLeft = AppState.drag.initialLeft + dx;
    let newTop = AppState.drag.initialTop + dy;

    // Lógica de Snapping a Grid
    const snap = AppState.config.snapGrid;
    const tol = AppState.config.snapTolerance;
    
    const modLeft = newLeft % snap;
    const modTop = newTop % snap;

    const guideV = document.getElementById('guideV');
    const guideH = document.getElementById('guideH');

    if (Math.abs(modLeft) < tol || Math.abs(modLeft - snap) < tol) {
        newLeft = Math.round(newLeft / snap) * snap;
        guideV.style.display = 'block';
        guideV.style.left = `${newLeft}px`;
    } else {
        guideV.style.display = 'none';
    }

    if (Math.abs(modTop) < tol || Math.abs(modTop - snap) < tol) {
        newTop = Math.round(newTop / snap) * snap;
        guideH.style.display = 'block';
        guideH.style.top = `${newTop}px`;
    } else {
        guideH.style.display = 'none';
    }

    AppState.drag.element.style.left = `${newLeft}px`;
    AppState.drag.element.style.top = `${newTop}px`;

    // Actualizar Panel de propiedades en vivo
    document.getElementById('propX').value = Math.round(newLeft);
    document.getElementById('propY').value = Math.round(newTop);
}

function stopDrag() {
    if (!AppState.drag.isDragging) return;
    
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
    
    document.getElementById('guideV').style.display = 'none';
    document.getElementById('guideH').style.display = 'none';
    
    // Guardar en el state Virtual DOM
    const id = AppState.drag.element.id;
    const data = AppState.canvas.elements.find(el => el.id === id);
    if (data) {
        data.style.left = AppState.drag.element.style.left;
        data.style.top = AppState.drag.element.style.top;
        saveHistoryState();
    }

    AppState.drag.isDragging = false;
    AppState.drag.element = null;
}

// Lógica de Redimensionamiento
function startResize(e, node, handle) {
    AppState.drag.isResizing = true;
    AppState.drag.element = node;
    AppState.drag.handle = handle;
    AppState.drag.startX = e.clientX;
    AppState.drag.startY = e.clientY;
    
    const rect = node.getBoundingClientRect();
    AppState.drag.initialWidth = node.offsetWidth;
    AppState.drag.initialHeight = node.offsetHeight;
    AppState.drag.initialLeft = parseFloat(node.style.left) || 0;
    AppState.drag.initialTop = parseFloat(node.style.top) || 0;

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
}

function handleResize(e) {
    if (!AppState.drag.isResizing) return;
    
    const scale = AppState.project.zoom / 100;
    const dx = (e.clientX - AppState.drag.startX) / scale;
    const dy = (e.clientY - AppState.drag.startY) / scale;
    
    const node = AppState.drag.element;
    const handle = AppState.drag.handle;
    
    let newWidth = AppState.drag.initialWidth;
    let newHeight = AppState.drag.initialHeight;
    let newLeft = AppState.drag.initialLeft;
    let newTop = AppState.drag.initialTop;

    if (handle.includes('e')) newWidth += dx;
    if (handle.includes('s')) newHeight += dy;
    if (handle.includes('w')) {
        newWidth -= dx;
        newLeft += dx;
    }
    if (handle.includes('n')) {
        newHeight -= dy;
        newTop += dy;
    }

    // Límites mínimos
    if (newWidth < 20) { newWidth = 20; if (handle.includes('w')) newLeft = AppState.drag.initialLeft + (AppState.drag.initialWidth - 20); }
    if (newHeight < 20) { newHeight = 20; if (handle.includes('n')) newTop = AppState.drag.initialTop + (AppState.drag.initialHeight - 20); }

    node.style.width = `${newWidth}px`;
    node.style.height = `${newHeight}px`;
    node.style.left = `${newLeft}px`;
    node.style.top = `${newTop}px`;

    // Actualizar Panel
    document.getElementById('propW').value = Math.round(newWidth);
    document.getElementById('propH').value = Math.round(newHeight);
    document.getElementById('propX').value = Math.round(newLeft);
    document.getElementById('propY').value = Math.round(newTop);
}

function stopResize() {
    if (!AppState.drag.isResizing) return;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    const id = AppState.drag.element.id;
    const data = AppState.canvas.elements.find(el => el.id === id);
    if (data) {
        data.style.width = AppState.drag.element.style.width;
        data.style.height = AppState.drag.element.style.height;
        data.style.left = AppState.drag.element.style.left;
        data.style.top = AppState.drag.element.style.top;
        saveHistoryState();
    }
    
    AppState.drag.isResizing = false;
    AppState.drag.element = null;
    AppState.drag.handle = null;
}

// 7. PANEL DE PROPIEDADES (BINDING DE DATOS)
function initPropertiesPanel() {
    // Vincular todos los inputs con atributo data-css a la actualización del elemento
    const inputs = document.querySelectorAll('#propsContent input, #propsContent select');
    
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            if (!AppState.canvas.selectedId) return;
            
            const prop = e.target.getAttribute('data-css');
            if (!prop) return;

            let val = e.target.value;
            // Si es un input numérico y necesita 'px' (ancho, alto, bordes, padding)
            if (e.target.type === 'number' && !['opacity', 'fontWeight', 'zIndex'].includes(prop)) {
                val = val + 'px';
            }

            updateActiveElementStyle(prop, val);
            
            // Sincronizar Hex text con Color Picker
            if (e.target.type === 'color') {
                const hexInput = document.getElementById(`${e.target.id}Hex`);
                if(hexInput) hexInput.value = val.toUpperCase();
            }
        });
        
        // Guardar estado al soltar slider o dejar input (change event)
        input.addEventListener('change', () => {
            saveHistoryState();
        });
    });

    // Content Editor (Textarea HTML)
    const contentArea = document.getElementById('propInnerHTML');
    contentArea.addEventListener('input', (e) => {
        if (!AppState.canvas.selectedId) return;
        const data = AppState.canvas.elements.find(el => el.id === AppState.canvas.selectedId);
        if (data) {
            data.content = e.target.value;
            // Actualizar DOM real manteniendo handles
            const node = document.getElementById(data.id);
            const handlesHTML = Array.from(node.querySelectorAll('.resize-handle')).map(h => h.outerHTML).join('');
            node.innerHTML = data.content + handlesHTML;
        }
    });
    contentArea.addEventListener('change', saveHistoryState);

    // Botones de Alineación
    document.querySelectorAll('.align-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const align = e.currentTarget.getAttribute('data-align');
            updateActiveElementStyle('textAlign', align);
            saveHistoryState();
        });
    });

    // Botón Eliminar
    document.getElementById('btnDeleteSelectedElement').addEventListener('click', deleteSelectedElement);
    // Botón Duplicar
    document.getElementById('btnDuplicateSelectedElement').addEventListener('click', duplicateSelectedElement);
}

function populatePropertiesPanel(data) {
    const s = data.style;
    
    // Dimensiones
    document.getElementById('propW').value = parseInt(s.width) || '';
    document.getElementById('propH').value = parseInt(s.height) || '';
    document.getElementById('propX').value = parseInt(s.left) || '';
    document.getElementById('propY').value = parseInt(s.top) || '';
    
    // Colores
    document.getElementById('propBgColor').value = rgb2hex(s.backgroundColor) || '#ffffff';
    document.getElementById('propBgColorHex').value = rgb2hex(s.backgroundColor) || '#ffffff';
    document.getElementById('propTextColor').value = rgb2hex(s.color) || '#000000';
    document.getElementById('propTextColorHex').value = rgb2hex(s.color) || '#000000';
    document.getElementById('propOpacity').value = s.opacity || '1';

    // Tipografía
    document.getElementById('propFontSize').value = parseInt(s.fontSize) || '16';
    document.getElementById('propFontWeight').value = s.fontWeight || '400';
    
    // Bordes
    document.getElementById('propBorderRadius').value = parseInt(s.borderRadius) || '0';
    document.getElementById('propBorderWidth').value = parseInt(s.borderWidth) || '0';
    document.getElementById('propBorderColor').value = rgb2hex(s.borderColor) || '#000000';
    document.getElementById('propBorderStyle').value = s.borderStyle || 'none';

    // Padding
    document.getElementById('padTop').value = parseInt(s.paddingTop) || '0';
    document.getElementById('padRight').value = parseInt(s.paddingRight) || '0';
    document.getElementById('padBottom').value = parseInt(s.paddingBottom) || '0';
    document.getElementById('padLeft').value = parseInt(s.paddingLeft) || '0';

    // Contenido
    document.getElementById('propInnerHTML').value = data.content;

    // Mostrar/Ocultar campos específicos según tipo
    if (data.type === 'media-image') {
        document.getElementById('imgSrcControl').style.display = 'block';
        document.getElementById('propImageSrc').value = data.attributes.src;
    } else {
        document.getElementById('imgSrcControl').style.display = 'none';
    }
}

function updateActiveElementStyle(prop, value) {
    const id = AppState.canvas.selectedId;
    if (!id) return;
    
    const data = AppState.canvas.elements.find(el => el.id === id);
    const node = document.getElementById(id);
    
    if (data && node) {
        data.style[prop] = value;
        node.style[prop] = value;
    }
}

// Utilidad color
function rgb2hex(rgb) {
    if (!rgb) return null;
    if (rgb.startsWith('#')) return rgb;
    let rgbArr = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgbArr && rgbArr.length === 4) ? "#" +
        ("0" + parseInt(rgbArr[1],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgbArr[2],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgbArr[3],10).toString(16)).slice(-2) : '';
}

// 8. PANEL DE CAPAS Y ÁRBOL DOM
function updateLayersPanel() {
    const container = document.getElementById('layersTreeContainer');
    container.innerHTML = '';
    
    if (AppState.canvas.elements.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="layers" class="empty-icon"></i>
                <p>El lienzo está vacío.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // Renderizar inverso para que el z-index más alto esté arriba en la lista
    const sortedEls = [...AppState.canvas.elements].sort((a,b) => b.style.zIndex - a.style.zIndex);

    sortedEls.forEach(el => {
        const node = document.createElement('div');
        node.className = `layer-node ${AppState.canvas.selectedId === el.id ? 'active' : ''}`;
        node.onclick = () => selectElement(el.id);
        
        let icon = 'box';
        if(el.type.includes('text')) icon = 'type';
        if(el.type.includes('image')) icon = 'image';
        if(el.type.includes('button')) icon = 'mouse-pointer';

        node.innerHTML = `
            <div class="layer-left">
                <i data-lucide="${icon}"></i>
                <span>${el.name}</span>
            </div>
            <div class="layer-actions">
                <i data-lucide="${el.locked ? 'lock' : 'unlock'}" onclick="toggleLock('${el.id}', event)" style="cursor:pointer;"></i>
                <i data-lucide="eye" style="cursor:pointer;"></i>
            </div>
        `;
        container.appendChild(node);
    });
    
    lucide.createIcons();
}

window.toggleLock = function(id, e) {
    e.stopPropagation();
    const data = AppState.canvas.elements.find(el => el.id === id);
    if(data) {
        data.locked = !data.locked;
        updateLayersPanel();
        showToast(data.locked ? "Elemento bloqueado" : "Elemento desbloqueado");
    }
}

function updateFooterStats() {
    document.getElementById('elementCountDisplay').innerText = `${AppState.canvas.elements.length} Elementos`;
}

// 9. ACCIONES COMPLEJAS (Eliminar, Duplicar, Z-Index)
function deleteSelectedElement() {
    const id = AppState.canvas.selectedId;
    if (!id) return;
    
    // Remover del DOM
    const node = document.getElementById(id);
    if (node) node.remove();
    
    // Remover del State
    AppState.canvas.elements = AppState.canvas.elements.filter(el => el.id !== id);
    
    deselectAll();
    updateLayersPanel();
    updateFooterStats();
    saveHistoryState();
    showToast("Elemento eliminado", "error");
}

function duplicateSelectedElement() {
    const id = AppState.canvas.selectedId;
    if (!id) return;
    
    const originalData = AppState.canvas.elements.find(el => el.id === id);
    if (!originalData) return;
    
    // Clon profundo manual
    const cloneData = JSON.parse(JSON.stringify(originalData));
    
    AppState.canvas.counter++;
    cloneData.id = `el_${cloneData.type.replace('-', '_')}_${AppState.canvas.counter}`;
    cloneData.name = `${originalData.name} (Copia)`;
    
    // Desplazar copia ligeramente
    let currentLeft = parseInt(cloneData.style.left);
    let currentTop = parseInt(cloneData.style.top);
    cloneData.style.left = `${currentLeft + 20}px`;
    cloneData.style.top = `${currentTop + 20}px`;
    cloneData.style.zIndex = AppState.canvas.elements.length + 1;
    
    AppState.canvas.elements.push(cloneData);
    renderElementToCanvas(cloneData);
    
    selectElement(cloneData.id);
    updateLayersPanel();
    updateFooterStats();
    saveHistoryState();
    showToast("Elemento duplicado", "success");
}

// 10. MENÚ CONTEXTUAL Y ATAJOS DE TECLADO
function initContextMenu() {
    const menu = document.getElementById('contextMenu');
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) {
            hideContextMenu();
        }
    });

    document.getElementById('ctxDelete').addEventListener('click', () => { deleteSelectedElement(); hideContextMenu(); });
    document.getElementById('ctxDuplicate').addEventListener('click', () => { duplicateSelectedElement(); hideContextMenu(); });
}

function showContextMenu(x, y) {
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'block';
    // Ajustar posición para que no se salga de la pantalla
    const rect = menu.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 10;
    if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 10;
    
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
}

function hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
}

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // No ejecutar atajos si el usuario está escribiendo en un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            deleteSelectedElement();
        }
        
        if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            duplicateSelectedElement();
        }

        if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            undo();
        }

        if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            redo();
        }
    });
}

// 11. SISTEMA DE HISTORIAL (UNDO/REDO STATE)
function saveHistoryState() {
    // Evitar guardar si no hubo cambios reales comparando JSON
    const currentStateStr = JSON.stringify(AppState.canvas.elements);
    if (AppState.history.past.length > 0) {
        if (AppState.history.past[AppState.history.past.length - 1] === currentStateStr) return;
    }
    
    AppState.history.past.push(currentStateStr);
    // Limitar historial a 30 pasos
    if (AppState.history.past.length > 30) AppState.history.past.shift();
    
    // Limpiar future al hacer un nuevo cambio
    AppState.history.future = [];
}

function undo() {
    if (AppState.history.past.length <= 1) {
        showToast("No hay más acciones para deshacer");
        return;
    }
    
    // Mover estado actual al futuro
    const currentState = AppState.history.past.pop();
    AppState.history.future.push(currentState);
    
    // Restaurar estado anterior
    const previousStateStr = AppState.history.past[AppState.history.past.length - 1];
    restoreState(previousStateStr);
    showToast("Deshacer");
}

function redo() {
    if (AppState.history.future.length === 0) {
        showToast("No hay acciones para rehacer");
        return;
    }
    
    // Obtener estado del futuro y mover al pasado
    const nextStateStr = AppState.history.future.pop();
    AppState.history.past.push(nextStateStr);
    
    restoreState(nextStateStr);
    showToast("Rehacer");
}

function restoreState(stateStr) {
    const elementsData = JSON.parse(stateStr);
    AppState.canvas.elements = elementsData;
    
    // Limpiar canvas actual
    const canvas = document.getElementById('mainCanvas');
    canvas.querySelectorAll('.vpb-element').forEach(el => el.remove());
    
    // Renderizar todos los elementos del estado restaurado
    elementsData.forEach(data => renderElementToCanvas(data));
    
    deselectAll();
    updateLayersPanel();
    updateFooterStats();
}

// 12. GENERADOR DE EXPORTACIÓN (CODE ENGINE)
function generateExportCode() {
    const title = document.getElementById('seoTitle').value || "Página Exportada - VPB";
    const desc = document.getElementById('seoDescription').value || "Construido con Visual Page Builder Pro";
    
    let htmlContent = '';
    let cssContent = '';

    // Iterar sobre los elementos ordenados por zIndex
    const sortedEls = [...AppState.canvas.elements].sort((a,b) => a.style.zIndex - b.style.zIndex);

    sortedEls.forEach(el => {
        const id = el.id;
        const classes = el.attributes.customClasses ? ` ${el.attributes.customClasses}` : '';
        
        // Determinar Tag HTML semántico
        let tag = 'div';
        if (el.type.includes('heading')) tag = 'h2';
        if (el.type.includes('paragraph')) tag = 'p';
        if (el.type === 'form-button') tag = 'button';
        if (el.type === 'text-link') tag = 'a';
        if (el.type === 'media-image') tag = 'img';

        // Generar HTML String
        let attrs = `id="${id}" class="vpb-item${classes}"`;
        if (tag === 'a') attrs += ` href="${el.attributes.href}"`;
        
        if (tag === 'img') {
            attrs += ` src="${el.attributes.src}" alt="${el.name}"`;
            htmlContent += `    <${tag} ${attrs} />\n`;
        } else {
            htmlContent += `    <${tag} ${attrs}>\n        ${el.content.replace(/\n/g, '\n        ')}\n    </${tag}>\n`;
        }

        // Generar CSS String
        cssContent += `#${id} {\n`;
        cssContent += `    position: absolute;\n`;
        for (const [key, value] of Object.entries(el.style)) {
            if (value && value !== '0px' && value !== 'none' && value !== 'transparent') {
                // Convertir camelCase a kebab-case
                const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
                cssContent += `    ${kebabKey}: ${value};\n`;
            }
        }
        cssContent += `}\n\n`;
    });

    const finalHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${desc}">
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        /* Base Boilerplate */
        body, html { margin: 0; padding: 0; font-family: 'Inter', sans-serif; min-height: 100vh; overflow-x: hidden; position: relative; }
        * { box-sizing: border-box; }
        .vpb-item { display: block; }
    </style>
</head>
<body>
    <div class="vpb-canvas-wrapper" style="position: relative; width: 100%; min-height: 100vh;">
${htmlContent}
    </div>
    </body>
</html>`;

    // Combinar o mostrar en UI (En este caso lo mostramos unificado en el preview para copiar rápido)
    const combinedPreview = `\n${finalHtml}\n\n/* ====== STYLES.CSS ====== */\n${cssContent}`;

    document.getElementById('exportCodeViewer').textContent = combinedPreview;
    document.getElementById('modalExport').style.display = 'flex';
}

// 13. TOAST NOTIFICATIONS UTILITY
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if(type === 'success') icon = 'check-circle';
    if(type === 'error') icon = 'alert-triangle';

    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
        <i data-lucide="x" class="toast-close" onclick="this.parentElement.remove()"></i>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
