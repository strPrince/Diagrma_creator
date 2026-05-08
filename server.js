require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// SEO-friendly middleware
app.use((req, res, next) => {
    res.set('X-Robots-Tag', 'index, follow');
    res.set('X-Frame-Options', 'SAMEORIGIN');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Rate limiting configuration
const RATE_LIMIT = 6; // 6 free generations per IP
const VALIDATION_RATE_LIMIT = 3; // 3 free validations per IP
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// In-memory store to track IP address usage
const ipUsage = new Map();
const validationIpUsage = new Map();

// Rate limiting middleware
const rateLimiter = (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Clean up old entries
    const now = Date.now();
    for (const [ip, data] of ipUsage.entries()) {
        if (now - data.timestamp > RATE_LIMIT_WINDOW) {
            ipUsage.delete(ip);
        }
    }
    
    // Check current usage
    const usage = ipUsage.get(clientIp) || { count: 0, timestamp: now };
    
    if (usage.count >= RATE_LIMIT) {
        return res.status(429).json({ 
            error: 'Rate limit exceeded', 
            message: `You have reached the free generation limit of ${RATE_LIMIT} requests per day. Please try again tomorrow.` 
        });
    }
    
    // Update usage count
    usage.count += 1;
    usage.timestamp = now;
    ipUsage.set(clientIp, usage);
    
    // Set response headers
    res.set('X-RateLimit-Limit', RATE_LIMIT);
    res.set('X-RateLimit-Remaining', RATE_LIMIT - usage.count);
    
    next();
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple analytics collector (stores in-memory counts) for basic pageview/event tracking
const analyticsStore = {
    pageviews: 0,
    events: []
};

// Collect analytics events from the client
app.post('/api/analytics', (req, res) => {
    try {
        const { event = 'pageview', path, title, url, referrer, meta } = req.body || {};
        const record = {
            event,
            path: path || req.path,
            title: title || document?.title || '',
            url: url || req.headers.referer || '',
            referrer: referrer || req.get('Referrer') || req.get('Referer') || '',
            meta: meta || {},
            ip: req.ip || req.connection.remoteAddress,
            ts: new Date().toISOString()
        };

        if (event === 'pageview') analyticsStore.pageviews += 1;
        analyticsStore.events.push(record);

        // Keep the store bounded to avoid memory blowup in long-running processes
        if (analyticsStore.events.length > 5000) analyticsStore.events.shift();

        console.log('Analytics event:', record.event, record.path || record.url);
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to record analytics event', err);
        res.status(500).json({ success: false });
    }
});

// Simple stats endpoint for local verification
app.get('/api/analytics/stats', (req, res) => {
    res.json({
        success: true,
        pageviews: analyticsStore.pageviews,
        recent: analyticsStore.events.slice(-20)
    });
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// List of Gemini models to try (in order of preference) - Each has separate quota
const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.5-pro',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-pro-latest',
    'gemini-exp-1206'
];

// Try multiple models with retry logic
async function generateWithFallback(prompt) {
    let lastError = null;
    
    for (const modelName of GEMINI_MODELS) {
        try {
            console.log(`Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            console.log(`Success with model: ${modelName}`);
            return result;
        } catch (error) {
            console.log(`Model ${modelName} failed: ${error.status || error.message}`);
            lastError = error;
            
            // If it's not a rate limit or model not found error, throw immediately
            if (error.status && error.status !== 429 && error.status !== 404) {
                throw error;
            }
            
            // Small delay before trying next model
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // All models failed
    throw lastError;
}

// Retry helper with exponential backoff for rate limits
async function retryWithBackoff(fn, maxRetries = 5, baseDelay = 3000) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (error.status === 429 && attempt < maxRetries) {
                // Extract retry delay from error if available
                let delay = baseDelay * Math.pow(2, attempt);
                const retryMatch = error.message?.match(/retry in (\d+\.?\d*)/i);
                if (retryMatch) {
                    delay = Math.max(delay, parseFloat(retryMatch[1]) * 1000 + 1000);
                }
                console.log(`Rate limited. Waiting ${Math.round(delay/1000)}s before retry... (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
}

// ============================================
// Mermaid Documentation RAG Context
// ============================================

const MERMAID_DOCUMENTATION = `
# Mermaid Diagram Type Reference Documentation

## Flowcharts
Syntax: flowchart TD/LR/RL/BT (direction)
Key Features:
- Nodes: [Text], (Text), {Text} for different shapes
- Connections: -->, -- Text -->, ==>, == Text ==>
- Subgraphs: subgraph title ... end
- Styling: classDef, class, style
- Links: click node callback "tooltip"
- Comments: %% comment

Examples:
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D
    
    classDef start fill:#90EE90,stroke:#333,stroke-width:2px
    classDef end fill:#FF6B6B,stroke:#333,stroke-width:2px
    class A start; class D end;

## Sequence Diagrams
Syntax: sequenceDiagram
Key Features:
- Participants: participant, actor
- Messages: ->>, -->>, -x, --x
- Activations: activate, deactivate
- Notes: Note over, Note left of, Note right of
- Loops: loop condition ... end
- Alt: alt condition ... else ... end
- Opt: opt condition ... end
- Parallel: par ... and ... end

Examples:
sequenceDiagram
    participant User as U
    participant System as S
    participant Database as DB
    
    User->>System: Login Request
    activate System
    System->>Database: Query User
    activate Database
    Database-->>System: User Data
    deactivate Database
    System-->>User: Login Success
    deactivate System

## Class Diagrams
Syntax: classDiagram
Key Features:
- Classes: class Name { ... }
- Inheritance: <|--
- Association: -->
- Composition: *--
- Aggregation: o--
- Multiplicity: 1, 0..1, *
- Visibility: +public, -private, #protected, ~package
- Static: {static}
- Abstract: {abstract}
- Interfaces: interface Name { ... }

Examples:
classDiagram
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
    Animal <|-- Cat

## State Diagrams
Syntax: stateDiagram-v2
Key Features:
- States: [*] (initial/final), state name, stateName: inner state
- Transitions: -->, -->|Event|
- Composite States: state "State Name" as S ... end
- Choice Points: []
- Parallel States: --||--
- Notes: Note right of, Note left of

Examples:
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Start
    Processing --> Completed : Success
    Processing --> Failed : Error
    Completed --> [*]
    Failed --> Idle : Retry

## ER Diagrams
Syntax: erDiagram
Key Features:
- Entities: ENTITY { ... }
- Relationships: ||--o{ (1-to-many), }o--|| (many-to-many), ||--|| (1-to-1)
- Attributes: PK (primary key), FK (foreign key)
- Types: int, string, float, date, boolean

Examples:
erDiagram
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

## Gantt Charts
Syntax: gantt
Key Features:
- dateFormat: YYYY-MM-DD, HH:mm, etc.
- title: Chart title
- section: Section name
- Tasks: id, start, duration
- Dependencies: after id
- Styling: active, done, crit

Examples:
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Research           :a1, 2024-01-01, 7d
    Design             :a2, after a1, 5d
    section Development
    Implementation     :a3, after a2, 14d
    Testing            :a4, after a3, 7d

## Mindmaps
Syntax: mindmap
Key Features:
- Root: Root node (first line)
- Levels: indented nodes (2 spaces per level)
- Styling: :::class
- Links: Not directly supported

Examples:
mindmap
    Root
        Level 1
            Level 2
            Level 2
                Level 3
        Level 1
            Level 2

## Timeline Diagrams
Syntax: timeline
Key Features:
- title: Chart title
- dateFormat: YYYY-MM-DD
- sections: Periods with events

Examples:
timeline
    title History of Technology
    section 2020
    Event 1 : 2020-01-01, 2020-01-15
    section 2021
    Event 2 : 2021-03-01, 2021-04-01

## Git Graphs
Syntax: gitGraph
Key Features:
- Commit: commit
- Branch: branch name
- Checkout: checkout branch
- Merge: merge branch

Examples:
gitGraph
    commit
    branch develop
    checkout develop
    commit
    checkout main
    merge develop
    commit

## Pie Charts
Syntax: pie [title]
Key Features:
- title: Chart title
- Data: "Label" : value

Examples:
pie title Project Time Distribution
    "Planning" : 20
    "Development" : 50
    "Testing" : 20
    "Documentation" : 10

# General Mermaid Guidelines
- Use meaningful labels and avoid excessive text
- Keep diagrams simple and focused
- Use consistent styling
- Add comments for complex sections
- Test diagrams with Mermaid renderer
- Use subgraphs to organize complex diagrams
`;

const MERMAID_STARTERS = [
    'flowchart',
    'graph',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'stateDiagram-v2',
    'erDiagram',
    'gantt',
    'pie',
    'mindmap',
    'timeline',
    'gitGraph',
    'gitgraph'
];

const DIAGRAM_TYPE_HINTS = {
    flowchart: 'flowchart TD',
    sequence: 'sequenceDiagram',
    class: 'classDiagram',
    state: 'stateDiagram-v2',
    er: 'erDiagram',
    gantt: 'gantt',
    pie: 'pie',
    mindmap: 'mindmap',
    timeline: 'timeline',
    git: 'gitGraph'
};

function getDiagramTypeExamples(diagramType) {
    const examples = {
        flowchart: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E
    classDef start fill:#90EE90,stroke:#333,stroke-width:2px
    classDef end fill:#FF6B6B,stroke:#333,stroke-width:2px
    class A start; class E end;`,
        
        sequence: `sequenceDiagram
    participant User as U
    participant System as S
    participant Database as DB
    
    User->>System: Login Request
    activate System
    System->>Database: Query User
    activate Database
    Database-->>System: User Data
    deactivate Database
    System-->>User: Login Success
    deactivate System`,
        
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
    Testing            :a4, after a3, 7d`,
        
        pie: `pie title Project Time Distribution
    "Planning" : 20
    "Development" : 50
    "Testing" : 20
    "Documentation" : 10`,
        
        mindmap: `mindmap
    Root
        Level 1
            Level 2
            Level 2
                Level 3
        Level 1
            Level 2`,
        
        timeline: `timeline
    title History of Technology
    section 2020
    Event 1 : 2020-01-01, 2020-01-15
    section 2021
    Event 2 : 2021-03-01, 2021-04-01`,
        
        git: `gitGraph
    commit
    branch develop
    checkout develop
    commit
    checkout main
    merge develop
    commit`
    };
    
    return examples[diagramType];
}

function sanitizeMermaidOutput(text) {
    if (!text) return '';

    let cleaned = String(text)
        .replace(/```mermaid\\n?/gi, '')
        .replace(/```\\n?/g, '')
        .trim();

    if (!cleaned) return '';

    const lines = cleaned.split(/\\r?\\n/);
    const startIndex = lines.findIndex((line) => {
        const trimmed = line.trim();
        return MERMAID_STARTERS.some((starter) =>
            trimmed.toLowerCase().startsWith(starter.toLowerCase())
        );
    });

    if (startIndex > 0) {
        cleaned = lines.slice(startIndex).join('\\n').trim();
    }

    return cleaned;
}

function isLikelyMermaid(code) {
    if (!code) return false;
    const firstLine = code.split(/\\r?\\n/)[0].trim().toLowerCase();
    return MERMAID_STARTERS.some((starter) => firstLine.startsWith(starter.toLowerCase()));
}

function expectedStarterForType(diagramType) {
    if (!diagramType) return null;
    return DIAGRAM_TYPE_HINTS[diagramType] || null;
}

// Enhanced Mermaid syntax validation patterns
const VALIDATION_PATTERNS = {
    flowchart: {
        required: ['flowchart'],
        optional: ['[', ']', '{', '}', '(', ')', '-->', 'classDef', 'subgraph'],
        forbidden: ['participant', 'classDiagram']
    },
    sequence: {
        required: ['sequenceDiagram'],
        optional: ['participant', 'actor', '->>', '-->>', 'activate', 'deactivate'],
        forbidden: ['flowchart', 'classDiagram']
    },
    class: {
        required: ['classDiagram'],
        optional: ['class', 'interface', '<|--', '-->', '*--', 'o--'],
        forbidden: ['flowchart', 'sequenceDiagram']
    },
    state: {
        required: ['stateDiagram'],
        optional: ['[*]', '-->|', 'state', 'note'],
        forbidden: ['flowchart', 'sequenceDiagram']
    },
    er: {
        required: ['erDiagram'],
        optional: ['||--o{', '}o--||', '||--||', 'PK', 'FK'],
        forbidden: ['flowchart', 'sequenceDiagram']
    },
    gantt: {
        required: ['gantt'],
        optional: ['title', 'dateFormat', 'section', 'after'],
        forbidden: ['flowchart', 'sequenceDiagram']
    },
    pie: {
        required: ['pie'],
        optional: ['title', ':'],
        forbidden: ['flowchart', 'sequenceDiagram']
    },
    mindmap: {
        required: ['mindmap'],
        optional: ['Root', 'Level'],
        forbidden: ['flowchart', 'sequenceDiagram']
    },
    timeline: {
        required: ['timeline'],
        optional: ['title', 'section', 'dateFormat'],
        forbidden: ['flowchart', 'sequenceDiagram']
    },
    git: {
        required: ['gitGraph'],
        optional: ['commit', 'branch', 'checkout', 'merge'],
        forbidden: ['flowchart', 'sequenceDiagram']
    }
};

function validateMermaidSyntax(code, diagramType) {
    const errors = [];
    const lines = code.split(/\\r?\\n/);

    if (!code.trim()) {
        errors.push('Empty diagram code');
        return errors;
    }

    const firstLine = lines[0].trim().toLowerCase();
    if (!isLikelyMermaid(code)) {
        errors.push('First line must contain valid Mermaid diagram type');
    }

    if (diagramType && VALIDATION_PATTERNS[diagramType]) {
        const patterns = VALIDATION_PATTERNS[diagramType];
        
        // Check required patterns
        patterns.required.forEach(pattern => {
            if (!code.toLowerCase().includes(pattern.toLowerCase())) {
                errors.push(`Missing required ${diagramType} diagram syntax: ${pattern}`);
            }
        });

        // Check forbidden patterns
        patterns.forbidden.forEach(pattern => {
            if (code.toLowerCase().includes(pattern.toLowerCase())) {
                errors.push(`Forbidden syntax in ${diagramType} diagram: ${pattern}`);
            }
        });
    }

    // Common syntax checks
    if (code.includes('->') && !code.includes('-->') && !['sequenceDiagram', 'gitGraph'].some(type => code.includes(type))) {
        errors.push('Use --> for connections instead of ->');
    }

    // Check for balanced parentheses/braces
    const parentheses = (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
    const braces = (code.match(/\{/g) || []).length - (code.match(/\}/g) || []).length;
    
    if (parentheses !== 0) {
        errors.push(`Unbalanced parentheses: ${parentheses > 0 ? 'Missing closing' : 'Missing opening'} )`);
    }
    
    if (braces !== 0) {
        errors.push(`Unbalanced braces: ${braces > 0 ? 'Missing closing' : 'Missing opening'} }`);
    }

    return errors;
}

async function fixMermaidCode(code, diagramType, contextLabel = 'Fix Mermaid code') {
    const expectedStarter = expectedStarterForType(diagramType);
    const starterHint = expectedStarter
        ? `The first line MUST start with "${expectedStarter}".`
        : 'The first line MUST start with a valid Mermaid diagram type keyword.';

    const errors = validateMermaidSyntax(code, diagramType);
    const errorHint = errors.length > 0 
        ? `\nDetected errors that need fixing: ${errors.join(', ')}\n` 
        : '';

    const fixPrompt = `You are a Mermaid syntax repair engine.
${starterHint}
${errorHint}
Return ONLY Mermaid code with no explanations, markdown fences, or extra text.
If the code is already valid, return it unchanged.

${contextLabel}:
${code}`;

    const result = await generateWithFallback(fixPrompt);
    const response = await result.response;
    const fixed = sanitizeMermaidOutput(response.text());
    return fixed;
}

async function ensureValidMermaid(code, diagramType, contextLabel) {
    let current = sanitizeMermaidOutput(code);

    const expectedStarter = expectedStarterForType(diagramType);
    const shouldFixStarter =
        expectedStarter &&
        (!current || !current.toLowerCase().startsWith(expectedStarter.toLowerCase()));

    if (!current || !isLikelyMermaid(current) || shouldFixStarter) {
        current = await fixMermaidCode(current || code, diagramType, contextLabel);
    }

    if (!current || !isLikelyMermaid(current)) {
        current = await fixMermaidCode(current || code, diagramType, `${contextLabel} (strict retry)`);
    }

    // Final validation check
    const errors = validateMermaidSyntax(current, diagramType);
    if (errors.length > 0 && diagramType) {
        console.log(`Validation errors after fix for ${diagramType}:`, errors);
        current = await fixMermaidCode(current, diagramType, `${contextLabel} (validation fix)`);
    }

    return sanitizeMermaidOutput(current);
}

// Check rate limit status endpoint
app.get('/api/rate-limit', (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries
    for (const [ip, data] of ipUsage.entries()) {
        if (now - data.timestamp > RATE_LIMIT_WINDOW) {
            ipUsage.delete(ip);
        }
    }
    
    const usage = ipUsage.get(clientIp) || { count: 0, timestamp: now };
    
    res.json({
        success: true,
        limit: RATE_LIMIT,
        used: usage.count,
        remaining: RATE_LIMIT - usage.count,
        reset: new Date(usage.timestamp + RATE_LIMIT_WINDOW).toISOString()
    });
});

// Check validation rate limit status endpoint
app.get('/api/validation-rate-limit', (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries
    for (const [ip, data] of validationIpUsage.entries()) {
        if (now - data.timestamp > RATE_LIMIT_WINDOW) {
            validationIpUsage.delete(ip);
        }
    }
    
    const usage = validationIpUsage.get(clientIp) || { count: 0, timestamp: now };
    
    res.json({
        success: true,
        limit: VALIDATION_RATE_LIMIT,
        used: usage.count,
        remaining: VALIDATION_RATE_LIMIT - usage.count,
        reset: new Date(usage.timestamp + RATE_LIMIT_WINDOW).toISOString()
    });
});

// List available models endpoint
app.get('/api/models', async (req, res) => {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
        );
        const data = await response.json();
        
        if (data.models) {
            const generativeModels = data.models
                .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                .map(m => ({
                    name: m.name,
                    displayName: m.displayName,
                    description: m.description
                }));
            res.json({ success: true, models: generativeModels });
        } else {
            res.json({ success: false, error: data.error?.message || 'Failed to list models' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// System prompt for Mermaid diagram generation with RAG context
const SYSTEM_PROMPT = `You are an expert Mermaid diagram generator with comprehensive knowledge of all Mermaid diagram types and syntax. Your task is to generate or modify Mermaid diagram code based on user requests, using the detailed documentation provided below as your knowledge base.

${MERMAID_DOCUMENTATION}

CRITICAL REQUIREMENTS:
1. NEVER produce syntax errors - all generated code MUST be 100% syntactically correct and renderable
2. Return ONLY valid Mermaid syntax code - no markdown fences, explanations, or extra text
3. The FIRST line MUST be a valid Mermaid diagram type keyword (e.g., "flowchart TD", "sequenceDiagram", "classDiagram", "stateDiagram-v2", "erDiagram", "gantt", "pie", "mindmap", "timeline", "gitGraph")
4. Ensure diagrams are clean, readable, well-structured, and visually appealing
5. Use meaningful labels, proper indentation, and logical flow
6. Support all Mermaid diagram types: flowchart, sequence, class, state, ER, gantt, pie, mindmap, timeline, gitgraph, etc.

QUALITY GUIDELINES:
- Use descriptive node names and labels that clearly convey meaning
- Apply consistent styling and formatting throughout the diagram
- Leverage advanced Mermaid features (subgraphs, styling, icons) when appropriate for clarity
- Optimize layout for readability - avoid overly complex or cluttered diagrams
- Ensure proper connections and relationships between elements
- Use appropriate diagram types for the content (e.g., don't force a flowchart when a sequence diagram is better)
- Follow the syntax patterns and examples from the documentation above

Always prioritize accuracy, clarity, and professional presentation in your output.`;

// Generate diagram endpoint (rate limited)
app.post('/api/generate', rateLimiter, async (req, res) => {
    try {
        const { prompt, diagramType, existingCode } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        let fullPrompt = SYSTEM_PROMPT + '\n\n';
        
        if (diagramType) {
            fullPrompt += `Diagram Type: ${diagramType}\n`;
            // Add diagram type specific examples to prompt
            const diagramExamples = getDiagramTypeExamples(diagramType);
            if (diagramExamples) {
                fullPrompt += `\nExample ${diagramType} diagram:\n${diagramExamples}\n`;
            }
        }
        
        if (existingCode) {
            fullPrompt += `\nExisting Mermaid Code:\n${existingCode}\n\n`;
            fullPrompt += `User Request (modify the existing diagram): ${prompt}`;
        } else {
            fullPrompt += `User Request: ${prompt}`;
        }

        // Add additional guidance for better results
        fullPrompt += `\n\nIMPORTANT NOTE: 
- Make sure the generated diagram is syntactically correct and follows standard Mermaid conventions
- Use meaningful labels and proper structure
- Keep the diagram focused on the user's request
- Avoid unnecessary complexity`;

        const result = await generateWithFallback(fullPrompt);
        const response = await result.response;
        let mermaidCode = sanitizeMermaidOutput(response.text());
        mermaidCode = await ensureValidMermaid(mermaidCode, diagramType, 'Generate Mermaid diagram');

        // Additional validation and improvement
        const validationResult = validateMermaidSyntax(mermaidCode, diagramType);
        if (validationResult.length > 0) {
            console.log(`Validation issues found, attempting final fix:`, validationResult);
            mermaidCode = await fixMermaidCode(mermaidCode, diagramType, 'Final validation fix');
        }

        res.json({ 
            success: true, 
            code: mermaidCode,
            validation: validationResult.length === 0 ? 'valid' : 'fixed'
        });

    } catch (error) {
        console.error('Error generating diagram:', error);
        
        // Better error messages for common issues
        let userMessage = error.message;
        if (error.status === 429) {
            userMessage = 'API rate limit exceeded. Please wait a minute and try again, or upgrade your Gemini API plan.';
        } else if (error.status === 401 || error.status === 403) {
            userMessage = 'Invalid API key. Please check your GEMINI_API_KEY in .env file.';
        }
        
        res.status(error.status || 500).json({ 
            error: 'Failed to generate diagram', 
            message: userMessage 
        });
    }
});

// Edit diagram endpoint (rate limited)
app.post('/api/edit', rateLimiter, async (req, res) => {
    try {
        const { code, instruction } = req.body;

        if (!code || !instruction) {
            return res.status(400).json({ error: 'Code and instruction are required' });
        }

        const fullPrompt = `${SYSTEM_PROMPT}

Current Mermaid Code:
${code}

Edit Instruction: ${instruction}

Return the modified Mermaid code only.`;

        const result = await generateWithFallback(fullPrompt);
        const response = await result.response;
        let mermaidCode = sanitizeMermaidOutput(response.text());
        mermaidCode = await ensureValidMermaid(mermaidCode, null, 'Edit Mermaid diagram');

        res.json({ 
            success: true, 
            code: mermaidCode 
        });

    } catch (error) {
        console.error('Error editing diagram:', error);
        let userMessage = error.message;
        if (error.status === 429) {
            userMessage = 'API rate limit exceeded. Please wait a minute and try again.';
        }
        res.status(error.status || 500).json({ 
            error: 'Failed to edit diagram', 
            message: userMessage 
        });
    }
});

// Validation rate limiting middleware
const validationRateLimiter = (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Clean up old entries
    const now = Date.now();
    for (const [ip, data] of validationIpUsage.entries()) {
        if (now - data.timestamp > RATE_LIMIT_WINDOW) {
            validationIpUsage.delete(ip);
        }
    }
    
    // Check current usage
    const usage = validationIpUsage.get(clientIp) || { count: 0, timestamp: now };
    
    if (usage.count >= VALIDATION_RATE_LIMIT) {
        return res.status(429).json({ 
            error: 'Validation rate limit exceeded', 
            message: `You have reached the free validation limit of ${VALIDATION_RATE_LIMIT} requests per day. Please try again tomorrow.` 
        });
    }
    
    // Update usage count
    usage.count += 1;
    usage.timestamp = now;
    validationIpUsage.set(clientIp, usage);
    
    // Set response headers
    res.set('X-Validation-RateLimit-Limit', VALIDATION_RATE_LIMIT);
    res.set('X-Validation-RateLimit-Remaining', VALIDATION_RATE_LIMIT - usage.count);
    
    next();
};

// Validate Mermaid code endpoint (separate rate limit)
app.post('/api/validate', validationRateLimiter, async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        // Auto-detect diagram type
        let detectedType = null;
        const firstLine = code.split(/\r?\n/)[0].trim().toLowerCase();
        for (const type in DIAGRAM_TYPE_HINTS) {
            if (firstLine.includes(type.toLowerCase()) || firstLine.includes(DIAGRAM_TYPE_HINTS[type].toLowerCase())) {
                detectedType = type;
                break;
            }
        }

        // Get validation errors
        const validationErrors = validateMermaidSyntax(code, detectedType);
        
        let mermaidCode = sanitizeMermaidOutput(code);
        
        // If errors exist, fix them
        if (validationErrors.length > 0) {
            console.log('Validation errors found:', validationErrors);
            mermaidCode = await fixMermaidCode(mermaidCode, detectedType, 'Validation and fix');
        }

        const finalValidation = validateMermaidSyntax(mermaidCode, detectedType);

        res.json({ 
            success: true, 
            code: mermaidCode,
            originalErrors: validationErrors,
            finalErrors: finalValidation,
            isValid: finalValidation.length === 0,
            diagramType: detectedType
        });

    } catch (error) {
        console.error('Error validating diagram:', error);
        let userMessage = error.message;
        if (error.status === 429) {
            userMessage = 'API rate limit exceeded. Please wait a minute and try again.';
        }
        res.status(error.status || 500).json({ 
            error: 'Failed to validate diagram', 
            message: userMessage 
        });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`DigMaker server running at http://localhost:${PORT}`);
});
