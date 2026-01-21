require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

// System prompt for Mermaid diagram generation
const SYSTEM_PROMPT = `You are an expert Mermaid diagram generator. Your task is to generate or modify Mermaid diagram code based on user requests.

CRITICAL REQUIREMENTS:
1. NEVER produce syntax errors - all generated code MUST be 100% syntactically correct and renderable
2. Return ONLY valid Mermaid syntax code - no markdown fences, explanations, or extra text
3. Ensure diagrams are clean, readable, well-structured, and visually appealing
4. Use meaningful labels, proper indentation, and logical flow
5. Support all Mermaid diagram types: flowchart, sequence, class, state, ER, gantt, pie, mindmap, timeline, gitgraph, etc.

QUALITY GUIDELINES:
- Use descriptive node names and labels that clearly convey meaning
- Apply consistent styling and formatting throughout the diagram
- Leverage advanced Mermaid features (subgraphs, styling, icons) when appropriate for clarity
- Optimize layout for readability - avoid overly complex or cluttered diagrams
- Ensure proper connections and relationships between elements
- Use appropriate diagram types for the content (e.g., don't force a flowchart when a sequence diagram is better)

DIAGRAM TYPE EXAMPLES:
- Flowchart: flowchart TD or flowchart LR with clear decision points
- Sequence: sequenceDiagram with proper participant ordering
- Class: classDiagram with accurate relationships and methods
- State: stateDiagram-v2 with complete state transitions
- ER: erDiagram with correct cardinalities and keys
- Gantt: gantt with realistic timelines and dependencies
- Pie: pie with meaningful data segments
- Mindmap: mindmap with hierarchical structure
- Timeline: timeline with chronological events
- Gitgraph: gitgraph with proper branching and commits

Always prioritize accuracy, clarity, and professional presentation in your output.`;

// Generate diagram endpoint
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, diagramType, existingCode } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        let fullPrompt = SYSTEM_PROMPT + '\n\n';
        
        if (diagramType) {
            fullPrompt += `Diagram Type: ${diagramType}\n`;
        }
        
        if (existingCode) {
            fullPrompt += `\nExisting Mermaid Code:\n${existingCode}\n\n`;
            fullPrompt += `User Request (modify the existing diagram): ${prompt}`;
        } else {
            fullPrompt += `User Request: ${prompt}`;
        }

        const result = await generateWithFallback(fullPrompt);
        const response = await result.response;
        let mermaidCode = response.text();

        // Clean up the response - remove markdown fences if present
        mermaidCode = mermaidCode
            .replace(/```mermaid\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();

        res.json({ 
            success: true, 
            code: mermaidCode 
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

// Edit diagram endpoint
app.post('/api/edit', async (req, res) => {
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
        let mermaidCode = response.text();

        // Clean up the response
        mermaidCode = mermaidCode
            .replace(/```mermaid\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();

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

// Validate Mermaid code endpoint
app.post('/api/validate', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        const fullPrompt = `Analyze this Mermaid diagram code for syntax errors. If there are errors, fix them and return the corrected code. If the code is valid, return it as-is.

Code:
${code}

Return ONLY the valid Mermaid code, no explanations.`;

        const result = await generateWithFallback(fullPrompt);
        const response = await result.response;
        let mermaidCode = response.text();

        mermaidCode = mermaidCode
            .replace(/```mermaid\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();

        res.json({ 
            success: true, 
            code: mermaidCode 
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
