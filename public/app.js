// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
    }
});

// DOM Elements
const elements = {
    promptInput: document.getElementById('promptInput'),
    diagramType: document.getElementById('diagramType'),
    codeEditor: document.getElementById('codeEditor'),
    mermaidOutput: document.getElementById('mermaidOutput'),
    previewContainer: document.getElementById('previewContainer'),
    statusMessage: document.getElementById('statusMessage'),
    diagramInfo: document.getElementById('diagramInfo'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer'),
    fullscreenOverlay: document.getElementById('fullscreenOverlay'),

    // Buttons
    generateBtn: document.getElementById('generateBtn'),
    editBtn: document.getElementById('editBtn'),
    validateBtn: document.getElementById('validateBtn'),
    renderBtn: document.getElementById('renderBtn'),
    copyBtn: document.getElementById('copyBtn'),
    clearBtn: document.getElementById('clearBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    exitFullscreenBtn: document.getElementById('exitFullscreenBtn'),
    exportSvgBtn: document.getElementById('exportSvgBtn'),
    exportPngBtn: document.getElementById('exportPngBtn')
};

// State
let currentZoom = 1;
let diagramCounter = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;

// Templates
const templates = {
    flowchart: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E`,
    
    sequence: `sequenceDiagram
    participant User
    participant System
    participant Database
    
    User->>System: Request
    System->>Database: Query
    Database-->>System: Response
    System-->>User: Result`,
    
    class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
    
    state: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Start
    Processing --> Completed : Success
    Processing --> Failed : Error
    Completed --> [*]
    Failed --> Idle : Retry`,
    
    er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : includes
    CUSTOMER {
        int id PK
        string name
        string email
    }
    ORDER {
        int id PK
        date created
        string status
    }`,
    
    gantt: `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Research           :a1, 2024-01-01, 7d
    Design             :a2, after a1, 5d
    section Development
    Implementation     :a3, after a2, 14d
    Testing            :a4, after a3, 7d
    section Deployment
    Launch             :a5, after a4, 3d`
};

// Utility Functions
function showLoading(show = true) {
    elements.loadingOverlay.classList.toggle('hidden', !show);
}

function setStatus(message, type = '') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = 'status-message';
    if (type) {
        elements.statusMessage.classList.add(type);
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// API Functions
async function generateDiagram() {
    const prompt = elements.promptInput.value.trim();
    
    if (!prompt) {
        showToast('Please enter a description for your diagram', 'warning');
        return;
    }
    
    showLoading(true);
    setStatus('Generating diagram with AI...');
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                diagramType: elements.diagramType.value,
                existingCode: elements.codeEditor.value.trim() || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            elements.codeEditor.value = data.code;
            setStatus('Diagram generated successfully!', 'success');
            showToast('Diagram generated successfully!');
            renderDiagram();
        } else {
            throw new Error(data.error || 'Failed to generate diagram');
        }
    } catch (error) {
        setStatus(`Error: ${error.message}`, 'error');
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function editDiagram() {
    const code = elements.codeEditor.value.trim();
    const instruction = elements.promptInput.value.trim();
    
    if (!code) {
        showToast('No diagram code to edit', 'warning');
        return;
    }
    
    if (!instruction) {
        showToast('Please enter edit instructions', 'warning');
        return;
    }
    
    showLoading(true);
    setStatus('Editing diagram with AI...');
    
    try {
        const response = await fetch('/api/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, instruction })
        });
        
        const data = await response.json();
        
        if (data.success) {
            elements.codeEditor.value = data.code;
            setStatus('Diagram edited successfully!', 'success');
            showToast('Diagram edited successfully!');
            renderDiagram();
        } else {
            throw new Error(data.error || 'Failed to edit diagram');
        }
    } catch (error) {
        setStatus(`Error: ${error.message}`, 'error');
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function validateDiagram() {
    const code = elements.codeEditor.value.trim();
    
    if (!code) {
        showToast('No diagram code to validate', 'warning');
        return;
    }
    
    showLoading(true);
    setStatus('Validating diagram...');
    
    try {
        const response = await fetch('/api/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (data.success) {
            elements.codeEditor.value = data.code;
            setStatus('Diagram validated and fixed!', 'success');
            showToast('Diagram validated successfully!');
            renderDiagram();
        } else {
            throw new Error(data.error || 'Failed to validate diagram');
        }
    } catch (error) {
        setStatus(`Error: ${error.message}`, 'error');
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Render Function
async function renderDiagram() {
    const code = elements.codeEditor.value.trim();
    
    if (!code) {
        elements.mermaidOutput.innerHTML = '<p class="placeholder-text">Your diagram will appear here</p>';
        elements.diagramInfo.textContent = '';
        elements.mermaidOutput.style.cursor = 'default';
        return;
    }
    
    setStatus('Rendering diagram...');
    
    try {
        // Generate unique ID for this render
        const id = `mermaid-${++diagramCounter}`;
        
        // Clear previous diagram
        elements.mermaidOutput.innerHTML = '';
        
        // Render new diagram
        const { svg } = await mermaid.render(id, code);
        elements.mermaidOutput.innerHTML = svg;
        
        // Update status
        const lines = code.split('\n').length;
        elements.diagramInfo.textContent = `${lines} lines`;
        setStatus('Diagram rendered successfully!', 'success');
        
        // Reset zoom and position
        currentZoom = 1;
        translateX = 0;
        translateY = 0;
        elements.mermaidOutput.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
        elements.mermaidOutput.style.cursor = 'grab';
        
    } catch (error) {
        elements.mermaidOutput.innerHTML = `
            <div style="color: #ef4444; text-align: center; padding: 2rem;">
                <p style="font-weight: bold; margin-bottom: 0.5rem;">Syntax Error</p>
                <p style="font-size: 0.9rem;">${error.message}</p>
            </div>
        `;
        elements.mermaidOutput.style.cursor = 'default';
        setStatus('Render error - check syntax', 'error');
    }
}

// Export Functions
function exportSVG() {
    const svg = elements.mermaidOutput.querySelector('svg');
    if (!svg) {
        showToast('No diagram to export', 'warning');
        return;
    }
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    downloadBlob(blob, 'diagram.svg');
    showToast('SVG exported successfully!');
}

function exportPNG() {
    const svg = elements.mermaidOutput.querySelector('svg');
    if (!svg) {
        showToast('No diagram to export', 'warning');
        return;
    }
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(blob => {
            downloadBlob(blob, 'diagram.png');
            showToast('PNG exported successfully!');
        }, 'image/png');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Copy to clipboard
function copyCode() {
    const code = elements.codeEditor.value.trim();
    if (!code) {
        showToast('No code to copy', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(code).then(() => {
        showToast('Code copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy code', 'error');
    });
}

// Download code
function downloadCode() {
    const code = elements.codeEditor.value.trim();
    if (!code) {
        showToast('No code to download', 'warning');
        return;
    }
    
    const blob = new Blob([code], { type: 'text/plain' });
    downloadBlob(blob, 'diagram.mmd');
    showToast('Code downloaded!');
}

// Zoom functions
function zoomIn() {
    currentZoom = Math.min(currentZoom + 0.1, 3);
    elements.mermaidOutput.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
}

function zoomOut() {
    currentZoom = Math.max(currentZoom - 0.1, 0.3);
    elements.mermaidOutput.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
}

// Drag functions
function startDrag(e) {
    if (!elements.mermaidOutput.querySelector('svg')) return;

    isDragging = true;
    const rect = elements.previewContainer.getBoundingClientRect();

    if (e.type === 'touchstart') {
        startX = e.touches[0].clientX - rect.left - translateX;
        startY = e.touches[0].clientY - rect.top - translateY;
    } else {
        startX = e.clientX - rect.left - translateX;
        startY = e.clientY - rect.top - translateY;
    }

    elements.mermaidOutput.classList.add('dragging');
    elements.previewContainer.style.userSelect = 'none';
}

function drag(e) {
    if (!isDragging) return;
    
    const rect = elements.previewContainer.getBoundingClientRect();
    
    if (e.type === 'touchmove') {
        translateX = e.touches[0].clientX - rect.left - startX;
        translateY = e.touches[0].clientY - rect.top - startY;
    } else {
        translateX = e.clientX - rect.left - startX;
        translateY = e.clientY - rect.top - startY;
    }
    
    elements.mermaidOutput.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
}

function endDrag() {
    isDragging = false;
    elements.mermaidOutput.classList.remove('dragging');
    elements.previewContainer.style.userSelect = 'auto';
}

// Fullscreen view function
function toggleFullscreen() {
    if (!elements.mermaidOutput.querySelector('svg')) {
        showToast('No diagram to view in fullscreen', 'warning');
        return;
    }
    
    const isFullscreen = document.fullscreenElement;
    
    if (!isFullscreen) {
        elements.previewContainer.requestFullscreen().catch(err => {
            showToast(`Error entering fullscreen: ${err.message}`, 'error');
        });
    } else {
        document.exitFullscreen();
    }
}

// Event Listeners
elements.generateBtn.addEventListener('click', generateDiagram);
elements.editBtn.addEventListener('click', editDiagram);
elements.validateBtn.addEventListener('click', validateDiagram);
elements.renderBtn.addEventListener('click', renderDiagram);
elements.copyBtn.addEventListener('click', copyCode);
elements.clearBtn.addEventListener('click', () => {
    elements.codeEditor.value = '';
    elements.mermaidOutput.innerHTML = '<p class="placeholder-text">Your diagram will appear here</p>';
    elements.diagramInfo.textContent = '';
    elements.mermaidOutput.style.cursor = 'default';
    setStatus('Cleared');
});
elements.downloadBtn.addEventListener('click', downloadCode);
elements.zoomInBtn.addEventListener('click', zoomIn);
elements.zoomOutBtn.addEventListener('click', zoomOut);
elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
elements.exitFullscreenBtn.addEventListener('click', toggleFullscreen);
elements.exportSvgBtn.addEventListener('click', exportSVG);
elements.exportPngBtn.addEventListener('click', exportPNG);

// Drag event listeners
elements.mermaidOutput.addEventListener('mousedown', startDrag);
elements.mermaidOutput.addEventListener('mousemove', drag);
elements.mermaidOutput.addEventListener('mouseup', endDrag);
elements.mermaidOutput.addEventListener('mouseleave', endDrag);
elements.mermaidOutput.addEventListener('touchstart', startDrag);
elements.mermaidOutput.addEventListener('touchmove', drag);
elements.mermaidOutput.addEventListener('touchend', endDrag);

// Fullscreen change listener
document.addEventListener('fullscreenchange', () => {
    const isFullscreen = document.fullscreenElement;
    if (isFullscreen) {
        elements.fullscreenBtn.textContent = '⏹';
        elements.fullscreenBtn.title = 'Exit Fullscreen';
        elements.fullscreenOverlay.classList.remove('hidden');
    } else {
        elements.fullscreenBtn.textContent = '⛶';
        elements.fullscreenBtn.title = 'Full Page View';
        elements.fullscreenOverlay.classList.add('hidden');
    }
});

// Template buttons
document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const template = btn.dataset.template;
        if (templates[template]) {
            elements.codeEditor.value = templates[template];
            elements.diagramType.value = template === 'er' ? 'er' : template;
            renderDiagram();
            showToast(`${template.charAt(0).toUpperCase() + template.slice(1)} template loaded!`);
        }
    });
});

// Auto-render on code change (debounced)
let renderTimeout;
elements.codeEditor.addEventListener('input', () => {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(renderDiagram, 1000);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Exit fullscreen with Escape key
    if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
        return;
    }

    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (e.shiftKey) {
                    generateDiagram();
                } else {
                    renderDiagram();
                }
                break;
            case 's':
                e.preventDefault();
                downloadCode();
                break;
        }
    }
});

// Initialize with welcome message
setStatus('Ready - Enter a description and click Generate, or use a template');
