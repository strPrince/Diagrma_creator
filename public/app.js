/**
 * MermaidFlow - AI Diagram Generator
 * Modern UI Controller with enhanced interactions
 * @version 2.0.0
 */

// ============================================
// Mermaid Initialization
// ============================================
const mermaidBaseConfig = {
    startOnLoad: false,
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        diagramPadding: 50
    },
    sequence: {
        useMaxWidth: false,
        diagramMarginX: 50,
        diagramMarginY: 50
    },
    er: {
        useMaxWidth: false,
        diagramPadding: 50
    },
    class: {
        useMaxWidth: false,
        diagramPadding: 50
    },
    state: {
        useMaxWidth: false,
        diagramPadding: 50
    },
    gantt: {
        useMaxWidth: false,
        diagramPadding: 50
    },
    pie: {
        useMaxWidth: false,
        diagramPadding: 50
    }
};

function initializeMermaid(theme) {
    mermaid.initialize({
        ...mermaidBaseConfig,
        theme: theme === 'dark' ? 'dark' : 'default'
    });
}

// ============================================
// DOM Elements Cache
// ============================================
const elements = {
    // Inputs
    promptInput: document.getElementById('promptInput'),
    diagramType: document.getElementById('diagramType'),
    codeEditor: document.getElementById('codeEditor'),

    // Output containers
    mermaidOutput: document.getElementById('mermaidOutput'),
    previewContainer: document.getElementById('previewContainer'),
    fullscreenContent: document.getElementById('fullscreenContent'),

    // Status elements
    statusMessage: document.getElementById('statusMessage'),
    diagramInfo: document.getElementById('diagramInfo'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer'),
    fullscreenOverlay: document.getElementById('fullscreenOverlay'),

    // Action buttons
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
    exportPngBtn: document.getElementById('exportPngBtn'),
    themeToggle: document.getElementById('themeToggle')
};

// ============================================
// State Management
// ============================================
const state = {
    currentZoom: 1,
    diagramCounter: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    translateX: 0,
    translateY: 0,
    isFullscreen: false,
    renderTimeout: null
};

// ============================================
// Theme Management
// ============================================
const theme = {
    storageKey: 'mermaidflow-theme',
    mediaQuery: window.matchMedia('(prefers-color-scheme: dark)'),
    current: 'light'
};

function getStoredTheme() {
    try {
        return localStorage.getItem(theme.storageKey);
    } catch (error) {
        return null;
    }
}

function setStoredTheme(value) {
    try {
        localStorage.setItem(theme.storageKey, value);
    } catch (error) {
        // Ignore storage errors
    }
}

function getPreferredTheme() {
    const stored = getStoredTheme();
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }
    return theme.mediaQuery.matches ? 'dark' : 'light';
}

function updateThemeToggle(themeName) {
    if (!elements.themeToggle) return;
    const isDark = themeName === 'dark';
    const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    elements.themeToggle.setAttribute('aria-label', label);
    elements.themeToggle.title = label;
}

function updateThemeColor(themeName) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute('content', themeName === 'dark' ? '#0b1220' : '#0f766e');
}

function applyTheme(themeName, persist = false) {
    theme.current = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    updateThemeToggle(themeName);
    updateThemeColor(themeName);
    initializeMermaid(themeName);

    if (elements.codeEditor.value.trim()) {
        renderDiagram();
    }

    if (persist) {
        setStoredTheme(themeName);
    }
}

// ============================================
// Basic Analytics (sends pageview/event to server)
// ============================================
function sendAnalyticsEvent(event, payload = {}) {
    try {
        fetch('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ event, ...payload })
        }).catch(() => {
            // Silently ignore network errors for analytics
        });
    } catch (err) {
        // ignore
    }
}

// Send initial pageview
try {
    sendAnalyticsEvent('pageview', { path: location.pathname, title: document.title, url: location.href, referrer: document.referrer });
} catch (err) {
    // ignore
}

// Try to notify Vercel's view endpoint as a compatible fallback.
function sendVercelViewPing() {
    try {
        // Use keepalive so the browser can send this before unload
        fetch('/_vercel/insights/view', { method: 'GET', keepalive: true }).catch(() => {});
    } catch (e) {
        // ignore
    }
}

// Attempt Vercel ping (harmless if not enabled).
sendVercelViewPing();

// ============================================
// Diagram Templates
// ============================================
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
    }
    PRODUCT {
        int id PK
        string name
        float price
    }
    LINE-ITEM {
        int id PK
        int quantity
        float price
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

// Template display names
const templateNames = {
    flowchart: 'Flowchart',
    sequence: 'Sequence',
    class: 'Class',
    state: 'State',
    er: 'ER',
    gantt: 'Gantt'
};

// ============================================
// UI Helper Functions
// ============================================

/**
 * Show or hide loading overlay
 * @param {boolean} show - Whether to show loading
 * @param {string} message - Optional custom message
 */
function showLoading(show = true, message = 'Generating with AI...') {
    const overlay = elements.loadingOverlay;
    const title = overlay.querySelector('.loader-text');

    if (message) {
        title.textContent = message;
    }

    overlay.classList.toggle('hidden', !show);
    overlay.setAttribute('aria-hidden', !show);

    // Prevent body scroll when loading
    document.body.style.overflow = show ? 'hidden' : '';
}

/**
 * Update status bar message
 * @param {string} message - Status message
 * @param {string} type - Message type: '', 'success', 'error', 'loading'
 */
function setStatus(message, type = '') {
    const statusEl = elements.statusMessage;
    const textSpan = statusEl.querySelector('span') || statusEl;

    textSpan.textContent = message;
    statusEl.className = 'status-message';

    if (type) {
        statusEl.classList.add(type);
    }
}

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');

    // Icon based on type
    const icons = {
        success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `${icons[type] || icons.success}<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    // Auto remove after delay
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// Rate Limit Functions
// ============================================

/**
 * Fetch rate limit information
 */
async function getRateLimitStatus() {
    try {
        const response = await fetch('/api/rate-limit');
        const data = await response.json();
        
        if (data.success) {
            return {
                limit: data.limit,
                used: data.used,
                remaining: data.remaining,
                reset: new Date(data.reset)
            };
        }
        
        console.error('Failed to get rate limit status:', data.error);
        return null;
    } catch (error) {
        console.error('Error fetching rate limit status:', error);
        return null;
    }
}

/**
 * Update rate limit display
 */
function updateRateLimitDisplay(status) {
    const rateLimitEl = document.getElementById('rateLimitIndicator');
    if (!rateLimitEl || !status) {
        return;
    }
    
    // Update the indicator
    rateLimitEl.innerHTML = `
        <span class="rate-limit-used">${status.used}</span>
        <span class="rate-limit-separator">/</span>
        <span class="rate-limit-limit">${status.limit}</span>
    `;
    
    // Add visual feedback based on remaining requests
    rateLimitEl.className = 'rate-limit-indicator';
    if (status.remaining <= 2) {
        rateLimitEl.classList.add('rate-limit-warning');
    }
    if (status.remaining === 0) {
        rateLimitEl.classList.add('rate-limit-exceeded');
    }
    
    // Update title with reset time and clear explanation
    const resetTime = status.reset.toLocaleTimeString();
    rateLimitEl.setAttribute('title', `Free AI generations today (${status.used}/${status.limit}) • Resets at ${resetTime}`);
}

// ============================================
// API Functions
// ============================================

/**
 * Generate diagram using AI
 */
async function generateDiagram() {
    const prompt = elements.promptInput.value.trim();

    if (!prompt) {
        showToast('Please enter a description for your diagram', 'warning');
        elements.promptInput.focus();
        return;
    }

    showLoading(true, 'Generating diagram with AI...');
    setStatus('Generating diagram...', 'loading');

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
            await renderDiagram();
            // Update rate limit display
            getRateLimitStatus().then(updateRateLimitDisplay);
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

/**
 * Edit existing diagram using AI
 */
async function editDiagram() {
    const code = elements.codeEditor.value.trim();
    const instruction = elements.promptInput.value.trim();

    if (!code) {
        showToast('No diagram code to edit', 'warning');
        return;
    }

    if (!instruction) {
        showToast('Please enter edit instructions', 'warning');
        elements.promptInput.focus();
        return;
    }

    showLoading(true, 'Editing diagram with AI...');
    setStatus('Editing diagram...', 'loading');

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
            await renderDiagram();
            // Update rate limit display
            getRateLimitStatus().then(updateRateLimitDisplay);
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

/**
 * Client-side syntax validation using Mermaid's parser
 */
function validateMermaidSyntax(code) {
    try {
        // Try to parse the Mermaid code for syntax errors
        // Mermaid has built-in validation
        const id = `validate-${Date.now()}`;
        const result = mermaid.parse(code);
        return { valid: true, error: null };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

/**
 * Fetch validation rate limit information
 */
async function getValidationRateLimitStatus() {
    try {
        const response = await fetch('/api/validation-rate-limit');
        const data = await response.json();
        
        if (data.success) {
            return {
                limit: data.limit,
                used: data.used,
                remaining: data.remaining,
                reset: new Date(data.reset)
            };
        }
        
        console.error('Failed to get validation rate limit status:', data.error);
        return null;
    } catch (error) {
        console.error('Error fetching validation rate limit status:', error);
        return null;
    }
}

/**
 * Update validation rate limit display
 */
function updateValidationRateLimitDisplay(status) {
    const validationRateLimitEl = document.getElementById('validationRateLimitIndicator');
    if (!validationRateLimitEl || !status) {
        return;
    }
    
    // Update the indicator
    validationRateLimitEl.innerHTML = `
        <span class="rate-limit-used">${status.used}</span>
        <span class="rate-limit-separator">/</span>
        <span class="rate-limit-limit">${status.limit}</span>
    `;
    
    // Add visual feedback based on remaining requests
    validationRateLimitEl.className = 'rate-limit-indicator';
    if (status.remaining <= 1) {
        validationRateLimitEl.classList.add('rate-limit-warning');
    }
    if (status.remaining === 0) {
        validationRateLimitEl.classList.add('rate-limit-exceeded');
    }
    
    // Update title with reset time and clear explanation
    const resetTime = status.reset.toLocaleTimeString();
    validationRateLimitEl.setAttribute('title', `Free validations today (${status.used}/${status.limit}) • Resets at ${resetTime}`);
}

/**
 * Validate and fix diagram code
 */
async function validateDiagram() {
    const code = elements.codeEditor.value.trim();

    if (!code) {
        showToast('No diagram code to validate', 'warning');
        return;
    }

    // First, check syntax client-side without API call
    const syntaxResult = validateMermaidSyntax(code);
    if (syntaxResult.valid) {
        showToast('Diagram syntax is valid!', 'success');
        setStatus('Diagram syntax is valid!', 'success');
        return;
    }

    showLoading(true, 'Validating diagram...');
    setStatus('Validating diagram...', 'loading');

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
            await renderDiagram();
            // Update validation rate limit display
            getValidationRateLimitStatus().then(updateValidationRateLimitDisplay);
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

// ============================================
// Render Functions
// ============================================

/**
 * Render Mermaid diagram
 */
async function renderDiagram() {
    const code = elements.codeEditor.value.trim();

    if (!code) {
        resetPreview();
        return;
    }

    setStatus('Rendering diagram...', 'loading');

    try {
        // Generate unique ID for this render
        const id = `mermaid-${++state.diagramCounter}`;

        // Clear previous diagram
        elements.mermaidOutput.innerHTML = '';

        // Render new diagram
        const { svg } = await mermaid.render(id, code);

        // Parse SVG and fix dimensions for complete rendering
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        // Get viewBox or calculate from content
        let viewBox = svgElement.getAttribute('viewBox');
        let width = svgElement.getAttribute('width');
        let height = svgElement.getAttribute('height');

        // If no viewBox, create one from width/height
        if (!viewBox && width && height) {
            viewBox = `0 0 ${parseFloat(width)} ${parseFloat(height)}`;
            svgElement.setAttribute('viewBox', viewBox);
        }

        // Ensure SVG has proper sizing for overflow
        svgElement.style.maxWidth = 'none';
        svgElement.style.width = 'auto';
        svgElement.style.height = 'auto';
        svgElement.style.overflow = 'visible';

        // Add padding to SVG to prevent clipping
        const originalViewBox = svgElement.getAttribute('viewBox');
        if (originalViewBox) {
            const [x, y, w, h] = originalViewBox.split(' ').map(parseFloat);
            const padding = 100; // Increased padding to 100px to ensure no clipping
            const newViewBox = `${x - padding} ${y - padding} ${w + padding * 2} ${h + padding * 2}`;
            svgElement.setAttribute('viewBox', newViewBox);
            
            // Also update width and height attributes if present
            if (width) svgElement.setAttribute('width', (w + padding * 2) + 'px');
            if (height) svgElement.setAttribute('height', (h + padding * 2) + 'px');
        }

        elements.mermaidOutput.innerHTML = svgElement.outerHTML;

        // Update status
        const lines = code.split('\n').length;
        const type = detectDiagramType(code);
        elements.diagramInfo.textContent = `${type} • ${lines} lines`;
        setStatus('Diagram rendered successfully!', 'success');

        // Reset zoom and position
        resetTransform();

        // Add animation class
        elements.mermaidOutput.style.animation = 'fadeIn 0.3s ease';

        // Setup click-to-edit on nodes
        setupNodeEditing();

    } catch (error) {
        showRenderError(error.message);
    }
}

/**
 * Detect diagram type from code
 * @param {string} code - Mermaid code
 * @returns {string} - Diagram type name
 */
function detectDiagramType(code) {
    const firstLine = code.split('\n')[0].toLowerCase();

    if (firstLine.includes('flowchart') || firstLine.includes('graph')) return 'Flowchart';
    if (firstLine.includes('sequencediagram')) return 'Sequence';
    if (firstLine.includes('classdiagram')) return 'Class';
    if (firstLine.includes('statediagram')) return 'State';
    if (firstLine.includes('erdiagram')) return 'ER';
    if (firstLine.includes('gantt')) return 'Gantt';
    if (firstLine.includes('pie')) return 'Pie';
    if (firstLine.includes('mindmap')) return 'Mindmap';
    if (firstLine.includes('timeline')) return 'Timeline';
    if (firstLine.includes('gitgraph')) return 'Git';

    return 'Diagram';
}

/**
 * Reset preview to placeholder state
 */
function resetPreview() {
    elements.mermaidOutput.innerHTML = `
        <div class="placeholder-state">
            <div class="placeholder-icon">🎨</div>
            <p>Your diagram will appear here</p>
            <span class="placeholder-hint">Generate or paste Mermaid code to see the preview</span>
        </div>
    `;
    elements.diagramInfo.textContent = 'No diagram';
    elements.mermaidOutput.style.cursor = 'default';
    resetTransform();
}

/**
 * Show render error in preview
 * @param {string} message - Error message
 */
function showRenderError(message) {
    elements.mermaidOutput.innerHTML = `
        <div style="color: var(--error-500); text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <p style="font-weight: 600; margin-bottom: 0.5rem;">Syntax Error</p>
            <p style="font-size: 0.875rem; color: var(--text-muted);">${escapeHtml(message)}</p>
        </div>
    `;
    elements.mermaidOutput.style.cursor = 'default';
    setStatus('Render error - check syntax', 'error');
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Export Functions
// ============================================

/**
 * Export diagram as SVG
 */
function exportSVG() {
    const svg = elements.mermaidOutput.querySelector('svg');
    if (!svg) {
        showToast('No diagram to export', 'warning');
        return;
    }

    // Clone and prepare SVG
    const clonedSvg = svg.cloneNode(true);
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Ensure SVG has proper dimensions and no clipping
    let viewBox = clonedSvg.getAttribute('viewBox');
    let width = clonedSvg.getAttribute('width');
    let height = clonedSvg.getAttribute('height');

    // If no viewBox, create one from width/height
    if (!viewBox && width && height) {
        viewBox = `0 0 ${parseFloat(width)} ${parseFloat(height)}`;
        clonedSvg.setAttribute('viewBox', viewBox);
    }

    // Ensure SVG has proper sizing for overflow
    clonedSvg.style.maxWidth = 'none';
    clonedSvg.style.width = 'auto';
    clonedSvg.style.height = 'auto';
    clonedSvg.style.overflow = 'visible';

    // Add padding to prevent clipping
    const originalViewBox = clonedSvg.getAttribute('viewBox');
    if (originalViewBox) {
        const [x, y, w, h] = originalViewBox.split(' ').map(parseFloat);
        const padding = 100; // Increased padding to 100px to ensure no clipping
        const newViewBox = `${x - padding} ${y - padding} ${w + padding * 2} ${h + padding * 2}`;
        clonedSvg.setAttribute('viewBox', newViewBox);
        
        // Also update width and height attributes if present
        if (width) clonedSvg.setAttribute('width', (w + padding * 2) + 'px');
        if (height) clonedSvg.setAttribute('height', (h + padding * 2) + 'px');
    }

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

    downloadBlob(blob, `diagram-${Date.now()}.svg`);
    showToast('SVG exported successfully!');
}

/**
 * Export diagram as PNG
 */
function exportPNG() {
    const svg = elements.mermaidOutput.querySelector('svg');
    if (!svg) {
        showToast('No diagram to export', 'warning');
        return;
    }

    // Clone SVG to avoid affecting original
    const clonedSvg = svg.cloneNode(true);
    
    // Get SVG dimensions from viewBox or attributes
    let width, height;
    const viewBox = clonedSvg.getAttribute('viewBox');
    
    if (viewBox) {
        const [x, y, w, h] = viewBox.split(' ').map(parseFloat);
        width = w;
        height = h;
    } else {
        width = parseFloat(clonedSvg.getAttribute('width')) || 800;
        height = parseFloat(clonedSvg.getAttribute('height')) || 600;
    }

    // Add padding to prevent clipping
    const padding = 100; // Increased padding to 100px to ensure no clipping
    width += padding * 2;
    height += padding * 2;

    // Ensure SVG has proper dimensions and viewBox
    clonedSvg.setAttribute('width', width);
    clonedSvg.setAttribute('height', height);
    
    // Update viewBox to include padding
    if (viewBox) {
        const [x, y, w, h] = viewBox.split(' ').map(parseFloat);
        const newViewBox = `${x - padding} ${y - padding} ${w + padding * 2} ${h + padding * 2}`;
        clonedSvg.setAttribute('viewBox', newViewBox);
    } else {
        clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
    
    // Remove any transform that might affect rendering
    clonedSvg.removeAttribute('style');
    clonedSvg.style.maxWidth = 'none';
    clonedSvg.style.width = 'auto';
    clonedSvg.style.height = 'auto';
    clonedSvg.style.overflow = 'visible';

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
        // High resolution export (2x)
        canvas.width = width * 2;
        canvas.height = height * 2;

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image with proper scaling
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
            downloadBlob(blob, `diagram-${Date.now()}.png`);
            showToast('PNG exported successfully!');
        }, 'image/png');
    };

    img.onerror = () => {
        showToast('Failed to export PNG', 'error');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

/**
 * Download blob as file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - File name
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// Editor Functions
// ============================================

/**
 * Copy code to clipboard
 */
async function copyCode() {
    const code = elements.codeEditor.value.trim();
    if (!code) {
        showToast('No code to copy', 'warning');
        return;
    }

    try {
        await navigator.clipboard.writeText(code);
        showToast('Code copied to clipboard!');
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Code copied to clipboard!');
    }
}

/**
 * Clear code editor
 */
function clearEditor() {
    if (elements.codeEditor.value.trim() && !confirm('Are you sure you want to clear the editor?')) {
        return;
    }

    elements.codeEditor.value = '';
    resetPreview();
    setStatus('Editor cleared');
}

/**
 * Download code as file
 */
function downloadCode() {
    const code = elements.codeEditor.value.trim();
    if (!code) {
        showToast('No code to download', 'warning');
        return;
    }

    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `diagram-${Date.now()}.mmd`);
    showToast('Code downloaded!');
}

// ============================================
// Zoom & Pan Functions
// ============================================

/**
 * Zoom in
 */
function zoomIn() {
    state.currentZoom = Math.min(state.currentZoom + 0.1, 3);
    applyTransform();
}

/**
 * Zoom out
 */
function zoomOut() {
    state.currentZoom = Math.max(state.currentZoom - 0.1, 0.3);
    applyTransform();
}

/**
 * Reset zoom and position
 */
function resetTransform() {
    state.currentZoom = 1;
    state.translateX = 0;
    state.translateY = 0;
    applyTransform();
}

/**
 * Apply current transform
 */
function applyTransform() {
    elements.mermaidOutput.style.transform =
        `translate(${state.translateX}px, ${state.translateY}px) scale(${state.currentZoom})`;
}

// ============================================
// Drag Functions
// ============================================

/**
 * Start dragging
 * @param {MouseEvent|TouchEvent} e - Event
 */
function startDrag(e) {
    if (!elements.mermaidOutput.querySelector('svg')) return;

    state.isDragging = true;
    const rect = elements.previewContainer.getBoundingClientRect();

    if (e.type === 'touchstart') {
        state.startX = e.touches[0].clientX - rect.left - state.translateX;
        state.startY = e.touches[0].clientY - rect.top - state.translateY;
    } else {
        state.startX = e.clientX - rect.left - state.translateX;
        state.startY = e.clientY - rect.top - state.translateY;
    }

    elements.mermaidOutput.classList.add('dragging');
    elements.previewContainer.style.userSelect = 'none';
}

/**
 * Drag handler
 * @param {MouseEvent|TouchEvent} e - Event
 */
function drag(e) {
    if (!state.isDragging) return;
    e.preventDefault();

    const rect = elements.previewContainer.getBoundingClientRect();

    if (e.type === 'touchmove') {
        state.translateX = e.touches[0].clientX - rect.left - state.startX;
        state.translateY = e.touches[0].clientY - rect.top - state.startY;
    } else {
        state.translateX = e.clientX - rect.left - state.startX;
        state.translateY = e.clientY - rect.top - state.startY;
    }

    applyTransform();
}

/**
 * End dragging
 */
function endDrag() {
    state.isDragging = false;
    elements.mermaidOutput.classList.remove('dragging');
    elements.previewContainer.style.userSelect = 'auto';
}

// ============================================
// Fullscreen Functions
// ============================================

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    const svg = elements.mermaidOutput.querySelector('svg');
    if (!svg) {
        showToast('No diagram to view in fullscreen', 'warning');
        return;
    }

    state.isFullscreen = !state.isFullscreen;

    if (state.isFullscreen) {
        // Clone diagram to fullscreen
        elements.fullscreenContent.innerHTML = '';
        const clonedSvg = svg.cloneNode(true);
        clonedSvg.style.maxWidth = '100%';
        clonedSvg.style.maxHeight = '100%';
        clonedSvg.style.height = 'auto';
        elements.fullscreenContent.appendChild(clonedSvg);

        elements.fullscreenOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        elements.fullscreenOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// Template Functions
// ============================================

/**
 * Load template into editor
 * @param {string} templateName - Template key
 */
function loadTemplate(templateName) {
    if (templates[templateName]) {
        elements.codeEditor.value = templates[templateName];
        elements.diagramType.value = templateName === 'er' ? 'er' : templateName;

        renderDiagram();
        showToast(`${templateNames[templateName] || templateName} template loaded!`);
    }
}

// ============================================
// Event Listeners
// ============================================

// Button click handlers
elements.generateBtn.addEventListener('click', generateDiagram);
elements.editBtn.addEventListener('click', editDiagram);
elements.validateBtn.addEventListener('click', validateDiagram);
elements.renderBtn.addEventListener('click', renderDiagram);
elements.copyBtn.addEventListener('click', copyCode);
elements.clearBtn.addEventListener('click', clearEditor);
elements.downloadBtn.addEventListener('click', downloadCode);
elements.zoomInBtn.addEventListener('click', zoomIn);
elements.zoomOutBtn.addEventListener('click', zoomOut);
elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
elements.exitFullscreenBtn.addEventListener('click', toggleFullscreen);
elements.exportSvgBtn.addEventListener('click', exportSVG);
elements.exportPngBtn.addEventListener('click', exportPNG);
if (elements.themeToggle) {
    elements.themeToggle.addEventListener('click', () => {
        const nextTheme = theme.current === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme, true);
    });
}

// Drag event listeners
elements.mermaidOutput.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', endDrag);
elements.mermaidOutput.addEventListener('touchstart', startDrag, { passive: false });
document.addEventListener('touchmove', drag, { passive: false });
document.addEventListener('touchend', endDrag);

// Prevent text selection during drag
elements.previewContainer.addEventListener('selectstart', (e) => {
    if (state.isDragging) e.preventDefault();
});

// Template buttons
document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const template = btn.dataset.template;
        loadTemplate(template);
    });
});

// Auto-render on code change (debounced)
elements.codeEditor.addEventListener('input', () => {
    clearTimeout(state.renderTimeout);
    state.renderTimeout = setTimeout(renderDiagram, 1500);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Exit fullscreen with Escape key
    if (e.key === 'Escape' && state.isFullscreen) {
        toggleFullscreen();
        return;
    }

    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'enter':
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
            case 'c':
                if (document.activeElement === elements.codeEditor) {
                    // Let default copy happen
                    return;
                }
                e.preventDefault();
                copyCode();
                break;
        }
    }
});

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Re-render if needed on resize
        if (elements.mermaidOutput.querySelector('svg')) {
            // Optional: re-render for better scaling
        }
    }, 250);
});

// Handle beforeunload
window.addEventListener('beforeunload', (e) => {
    if (elements.codeEditor.value.trim()) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ============================================
// Inline Editor Functions
// ============================================

const inlineEditor = {
    overlay: document.getElementById('inlineEditorOverlay'),
    input: document.getElementById('inlineEditorInput'),
    closeBtn: document.getElementById('inlineEditorClose'),
    cancelBtn: document.getElementById('inlineEditorCancel'),
    saveBtn: document.getElementById('inlineEditorSave'),
    editHint: document.getElementById('editHint'),

    currentNodeText: null,
    originalNodeText: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Close on button click
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());

        // Save on button click
        this.saveBtn.addEventListener('click', () => this.save());

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Save on Enter key
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.save();
            if (e.key === 'Escape') this.close();
        });
    },

    open(nodeText) {
        this.originalNodeText = nodeText;
        this.currentNodeText = nodeText;
        this.input.value = nodeText;
        this.overlay.classList.add('active');
        this.overlay.setAttribute('aria-hidden', 'false');
        this.input.focus();
        this.input.select();
    },

    close() {
        this.overlay.classList.remove('active');
        this.overlay.setAttribute('aria-hidden', 'true');
        this.currentNodeText = null;
        this.originalNodeText = null;
    },

    save() {
        const newText = this.input.value.trim();
        if (newText && newText !== this.originalNodeText) {
            updateNodeTextInCode(this.originalNodeText, newText);
        }
        this.close();
    },

    showHint(x, y) {
        this.editHint.style.left = `${x}px`;
        this.editHint.style.top = `${y - 40}px`;
        this.editHint.classList.add('visible');
    },

    hideHint() {
        this.editHint.classList.remove('visible');
    }
};

/**
 * Update node text in Mermaid code
 * @param {string} oldText - Original node text
 * @param {string} newText - New node text
 */
function updateNodeTextInCode(oldText, newText) {
    let code = elements.codeEditor.value;

    // Escape special regex characters
    const escapedOldText = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create regex to find the node text
    // Matches node definitions like: A[oldText] or A{oldText} or A(oldText) or A>oldText]
    const patterns = [
        new RegExp(`(\\[)${escapedOldText}(\\])`, 'g'),
        new RegExp(`(\\{)${escapedOldText}(\\})`, 'g'),
        new RegExp(`(\\()${escapedOldText}(\\))`, 'g'),
        new RegExp(`(>)${escapedOldText}(\\])`, 'g'),
        new RegExp(`(\\[)${escapedOldText}(\\))`, 'g'),
        new RegExp(`(\\()${escapedOldText}(\\])`, 'g'),
        new RegExp(`(["'])${escapedOldText}(["'])`, 'g')
    ];

    let updated = false;
    for (const pattern of patterns) {
        if (pattern.test(code)) {
            code = code.replace(pattern, `$1${newText}$2`);
            updated = true;
            break;
        }
    }

    // If no pattern matched, try simple text replacement
    if (!updated) {
        code = code.replace(oldText, newText);
    }

    elements.codeEditor.value = code;
    renderDiagram();
    showToast('Node updated successfully!');
}

/**
 * Extract text content from SVG element
 * @param {Element} element - SVG element
 * @returns {string} - Text content
 */
function extractNodeText(element) {
    // Try to find text within the node
    const textElement = element.querySelector('text');
    if (textElement) {
        return textElement.textContent.trim();
    }

    // Check for foreignObject (HTML labels)
    const foreignObject = element.querySelector('foreignObject');
    if (foreignObject) {
        return foreignObject.textContent.trim();
    }

    // Check for title element
    const titleElement = element.querySelector('title');
    if (titleElement) {
        return titleElement.textContent.trim();
    }

    return '';
}

/**
 * Setup click-to-edit on diagram nodes
 */
function setupNodeEditing() {
    const svg = elements.mermaidOutput.querySelector('svg');
    if (!svg) return;

    // Find all node elements
    const nodes = svg.querySelectorAll('.node');

    nodes.forEach(node => {
        // Make node clickable
        node.style.cursor = 'pointer';

        // Add click handler
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            const nodeText = extractNodeText(node);
            if (nodeText) {
                inlineEditor.open(nodeText);
            }
        });

        // Add hover effects
        node.addEventListener('mouseenter', (e) => {
            const rect = node.getBoundingClientRect();
            inlineEditor.showHint(rect.left + rect.width / 2, rect.top);
        });

        node.addEventListener('mouseleave', () => {
            inlineEditor.hideHint();
        });
    });

    // Also handle edge labels
    const edgeLabels = svg.querySelectorAll('.edgeLabel');
    edgeLabels.forEach(label => {
        label.style.cursor = 'pointer';

        label.addEventListener('click', (e) => {
            e.stopPropagation();
            const labelText = extractNodeText(label);
            if (labelText) {
                inlineEditor.open(labelText);
            }
        });

        label.addEventListener('mouseenter', (e) => {
            const rect = label.getBoundingClientRect();
            inlineEditor.showHint(rect.left + rect.width / 2, rect.top);
        });

        label.addEventListener('mouseleave', () => {
            inlineEditor.hideHint();
        });
    });
}

// ============================================
// Initialization
// ============================================

// Initialize inline editor
inlineEditor.init();

// Apply initial theme
applyTheme(getPreferredTheme());

// Sync with system theme changes if no user preference stored
theme.mediaQuery.addEventListener('change', (e) => {
    if (getStoredTheme()) return;
    applyTheme(e.matches ? 'dark' : 'light');
});

// Load and display rate limit status on page load
getRateLimitStatus().then(updateRateLimitDisplay);
getValidationRateLimitStatus().then(updateValidationRateLimitDisplay);

// Set initial status
setStatus('Ready - Enter a description and click Generate, or use a template');

// Focus prompt input on load
elements.promptInput.focus();

console.log('🎨 MermaidFlow initialized - Ready to create amazing diagrams!');
console.log('💡 Tip: Click on any diagram node to edit it directly!');
