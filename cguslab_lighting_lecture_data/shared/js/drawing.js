// drawing.js - 그리기 로직, 도구 제어, 슬라이드 간 그리기 내용 저장/복원 

(function() { // IIFE to encapsulate the drawing logic
    // DOM Elements
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const drawingToolbar = document.getElementById('drawing-toolbar');
    const toggleDrawModeBtn = document.getElementById('toggle-draw-mode');
    const closeDrawingToolbarBtn = document.getElementById('close-drawing-toolbar');
    const penToolBtn = document.getElementById('pen-tool');
    const eraserToolBtn = document.getElementById('eraser-tool');
    const colorPicker = document.getElementById('color-picker');
    const lineWidthRange = document.getElementById('line-width');
    const clearCanvasBtn = document.getElementById('clear-canvas');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    if (!drawingToolbar || !toggleDrawModeBtn || !closeDrawingToolbarBtn || !penToolBtn || !eraserToolBtn || !colorPicker || !lineWidthRange || !clearCanvasBtn || !undoBtn || !redoBtn) {
        console.warn('[drawing.js] Required toolbar elements not found. Drawing functionality may be limited.');
        return;
    }

    // Drawing state
    let isDrawingModeActive = false;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentTool = 'pen';
    let currentColor = '#FF0000';
    let currentLineWidth = 5;
    let penLineWidth = 5;
    const eraserLineWidth = 20;

    const slideDrawings = new Map();
    let history = [];
    let historyIndex = -1;
    let isRestoringHistory = false;

    // --- History Management (Undo/Redo) ---
    function saveState() {
        if (isRestoringHistory) return;
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        const currentDataUrl = canvas.toDataURL();
        if (history.length > 0 && history[historyIndex] === currentDataUrl) {
            return;
        }
        history.push(currentDataUrl);
        historyIndex = history.length - 1;
        updateUndoRedoButtons();
    }

    function restoreState(index) {
        if (index < 0 || index >= history.length) return;
        isRestoringHistory = true;
        const dataUrl = history[index];
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            isRestoringHistory = false;
        };
        img.src = dataUrl;
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            restoreState(historyIndex);
        } else if (historyIndex === 0) {
            historyIndex--;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        updateUndoRedoButtons();
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            restoreState(historyIndex);
        }
        updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() {
        undoBtn.disabled = historyIndex <= 0;
        redoBtn.disabled = historyIndex >= history.length - 1;
        undoBtn.style.opacity = undoBtn.disabled ? 0.5 : 1;
        redoBtn.style.opacity = redoBtn.disabled ? 0.5 : 1;
    }

    function initHistory() {
        history = [canvas.toDataURL()];
        historyIndex = 0;
        updateUndoRedoButtons();
    }

    // --- Canvas Setup and Resizing ---
    function setupCanvas(slideDimensions) {
        if (!slideDimensions) return;

        // Canvas를 원본 슬라이드 크기로 설정 (이때 2D context가 리셋됨!)
        canvas.width = slideDimensions.width;
        canvas.height = slideDimensions.height;
        canvas.style.width = `${slideDimensions.width}px`;
        canvas.style.height = `${slideDimensions.height}px`;

        // Canvas 크기 변경으로 리셋된 2D context 속성들을 모두 다시 설정
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // 현재 도구에 맞는 속성 재설정
        if (currentTool === 'pen') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = penLineWidth;
        } else if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = eraserLineWidth;
        }
        
        console.log(`[drawing.js] Canvas setup complete: ${slideDimensions.width}x${slideDimensions.height}`);
        console.log(`[drawing.js] Applied styles - color: ${currentColor}, strokeStyle: ${ctx.strokeStyle}, tool: ${currentTool}`);
    }

    // --- Drawing Mode Toggle ---
    function toggleDrawMode(forceState) {
        isDrawingModeActive = (typeof forceState === 'boolean') ? forceState : !isDrawingModeActive;
        canvas.style.display = isDrawingModeActive ? 'block' : 'none';
        canvas.classList.toggle('active', isDrawingModeActive);
        drawingToolbar.style.display = isDrawingModeActive ? 'flex' : 'none';
        toggleDrawModeBtn.classList.toggle('active', isDrawingModeActive);
        
        console.log(`[drawing.js] Drawing mode: ${isDrawingModeActive ? 'ON' : 'OFF'}`);
    }

    // --- Drawing Event Handlers ---
    function getEventPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // Canvas의 실제 크기와 표시 크기 간의 비율 계산
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // 좌표 변환
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        
        if (window.DEBUG_MODE) {
            console.groupCollapsed('[Draw] getEventPos');
            console.log(`- Mouse/Touch: clientX=${clientX.toFixed(2)}, clientY=${clientY.toFixed(2)}`);
            console.log(`- Canvas Rect: left=${rect.left.toFixed(2)}, top=${rect.top.toFixed(2)}, width=${rect.width.toFixed(2)}, height=${rect.height.toFixed(2)}`);
            console.log(`- Canvas Size: width=${canvas.width}, height=${canvas.height}`);
            console.log(`- Scale: scaleX=${scaleX.toFixed(4)}, scaleY=${scaleY.toFixed(4)}`);
            console.log(`- Final Coords: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
            console.groupEnd();
        }

        return { x, y };
    }

    function startDrawing(e) {
        if (e.touches && e.touches.length > 1) return;
        isDrawing = true;
        const pos = getEventPos(e);
        lastX = pos.x;
        lastY = pos.y;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
        if (!isDrawing) return;
        if (e.touches && e.touches.length > 1) return;
        e.preventDefault();
        const pos = getEventPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        // 점찍기와 선그리기를 구분하기 위해, draw가 한 번이라도 호출되면 lastX를 초기화
        lastX = -1;
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        
        // start와 stop 사이에서 draw가 호출되지 않았다면(클릭), 점을 찍는다.
        if (lastX !== -1) {
            ctx.lineTo(lastX, lastY);
            ctx.stroke();
        }

        ctx.closePath();
        saveState();
    }

    // --- Tool Implementation ---
    function setActiveTool(tool) {
        currentTool = tool;
        penToolBtn.classList.toggle('active', tool === 'pen');
        eraserToolBtn.classList.toggle('active', tool === 'eraser');
        if (tool === 'pen') {
            ctx.globalCompositeOperation = 'source-over';
            currentLineWidth = penLineWidth;
            ctx.strokeStyle = currentColor;
            console.log(`[drawing.js] Pen tool activated with color: ${currentColor}`);
        } else if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            currentLineWidth = eraserLineWidth;
        }
        lineWidthRange.value = currentLineWidth;
        ctx.lineWidth = currentLineWidth;
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveState();
    }

    // --- Slide Drawing Storage ---
    function saveDrawingForSlide(slideId) {
        if (!slideId) return;
        const blankCanvas = document.createElement('canvas');
        blankCanvas.width = canvas.width;
        blankCanvas.height = canvas.height;
        if (canvas.toDataURL() === blankCanvas.toDataURL()) {
            slideDrawings.delete(slideId);
        } else {
            slideDrawings.set(slideId, { history: [...history], historyIndex });
        }
        updateUndoRedoButtons();
    }

    function loadDrawingForSlide(slideId) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const drawingData = slideDrawings.get(slideId);
        if (drawingData) {
            history = [...drawingData.history];
            historyIndex = drawingData.historyIndex;
            restoreState(historyIndex);
        } else {
            initHistory();
        }
        updateUndoRedoButtons();
        
        // 그림 복원 후 현재 도구 스타일 재적용 (중요!)
        setActiveTool(currentTool);
        console.log(`[drawing.js] Drawing loaded for slide: ${slideId}, reapplied tool: ${currentTool}, color: ${currentColor}`);
    }

    function clearDrawingForSlide(slideId) {
        // 1. Clear the visual canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        // 2. Reset the local history for undo/redo
        initHistory();
    
        // 3. Delete the stored data for this slide
        if (slideId) {
            slideDrawings.delete(slideId);
        }
    }

    // --- Public API ---
    window.drawingUtils = {
        setupCanvas,
        toggleDrawMode,
        isDrawingModeActive: () => isDrawingModeActive,
        saveDrawingForSlide,
        loadDrawingForSlide,
        clearDrawingForSlide
    };

    // --- Event Listeners ---
    penToolBtn.addEventListener('click', () => setActiveTool('pen'));
    eraserToolBtn.addEventListener('click', () => setActiveTool('eraser'));
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    colorPicker.addEventListener('input', (e) => {
        currentColor = e.target.value;
        if (currentTool === 'pen') ctx.strokeStyle = currentColor;
    });

    lineWidthRange.addEventListener('input', (e) => {
        const newWidth = e.target.value;
        currentLineWidth = newWidth;
        if (currentTool === 'pen') penLineWidth = newWidth;
        ctx.lineWidth = currentLineWidth;
    });

    ['mousedown', 'touchstart'].forEach(evt => canvas.addEventListener(evt, startDrawing, { passive: false }));
    ['mousemove', 'touchmove'].forEach(evt => canvas.addEventListener(evt, draw, { passive: false }));
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(evt => canvas.addEventListener(evt, stopDrawing));

    document.addEventListener('keydown', (e) => {
        if (!isDrawingModeActive) return;
        const isInputFocused = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable;
        if (isInputFocused) return;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
        }
    });

    // Initial setup - 색상 피커를 먼저 동기화한 후 펜 툴 설정
    // 색상 피커의 초기값과 동기화
    if (colorPicker.value) {
        currentColor = colorPicker.value;
        console.log(`[drawing.js] Initial color set to: ${currentColor}`);
    }
    
    setActiveTool('pen'); // 이때 currentColor가 올바르게 적용됨
    updateUndoRedoButtons();
})();

    // Placeholder for resize handling - canvas needs to be re-setup
    // This should be triggered by the same events that trigger adaptIframeScale in index.html
    // For now, we call setupCanvas() when draw mode is activated.
    // A more robust solution would observe the iframe or slide-container for resize.
    // window.addEventListener('resize', () => { if (isDrawingModeActive) setupCanvas(); });
    // Or better, integrate with the ResizeObserver in index.html

    // TODO: Implement drawing save/restore on slide change
