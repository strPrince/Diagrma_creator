# MermaidFlow - AI-Powered Mermaid Diagram Generator

MermaidFlow is a web application that uses Google's Gemini AI to help you create, edit, and update Mermaid diagrams through natural language descriptions.

![MermaidFlow](https://img.shields.io/badge/Powered%20by-Gemini%20AI-blue)

## Features

- 🤖 **AI-Powered Generation** - Describe your diagram in plain English, and Gemini AI creates the Mermaid code
- ✏️ **Smart Editing** - Modify existing diagrams with natural language instructions
- ✓ **Auto-Validation** - AI validates and fixes syntax errors automatically
- 📊 **Multiple Diagram Types** - Supports flowcharts, sequence diagrams, class diagrams, ER diagrams, Gantt charts, and more
- 🎨 **Live Preview** - Real-time diagram rendering as you type
- 📤 **Export Options** - Export diagrams as SVG or PNG
- 📋 **Quick Templates** - Start with pre-built templates for common diagram types

## Supported Diagram Types

- Flowcharts
- Sequence Diagrams
- Class Diagrams
- State Diagrams
- ER Diagrams
- Gantt Charts
- Pie Charts
- Mindmaps
- Timelines
- Git Graphs

## Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   
   Create a `.env` file in the project root:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```
   
   Get your Gemini API key from: https://makersuite.google.com/app/apikey

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   
   Navigate to `http://localhost:3000`

## Usage

### Generate a New Diagram

1. Select a diagram type (optional - AI can auto-detect)
2. Enter a description of your diagram in natural language
3. Click "Generate" button
4. The AI will create the Mermaid code and render the diagram

### Edit an Existing Diagram

1. With existing code in the editor, enter edit instructions
2. Click "Edit" button
3. The AI will modify the diagram based on your instructions

### Manual Editing

- Edit the Mermaid code directly in the code editor
- Click "Render Diagram" or wait for auto-render
- Use "Validate" to let AI fix any syntax errors

### Templates

Click any template button to load a starting point:
- Flowchart, Sequence, Class, State, ER, Gantt

### Export

- 📤 Export as SVG (vector format)
- 🖼️ Export as PNG (raster format)
- 💾 Download Mermaid code as `.mmd` file
- 📋 Copy code to clipboard

## Keyboard Shortcuts

- `Ctrl + Enter` - Render diagram
- `Ctrl + Shift + Enter` - Generate with AI
- `Ctrl + S` - Download code

## API Endpoints

### POST /api/generate
Generate a new diagram from a prompt.

```json
{
  "prompt": "Create a flowchart for user login",
  "diagramType": "flowchart",
  "existingCode": null
}
```

### POST /api/edit
Edit an existing diagram.

```json
{
  "code": "flowchart TD...",
  "instruction": "Add error handling"
}
```

### POST /api/validate
Validate and fix Mermaid syntax.

```json
{
  "code": "flowchart TD..."
}
```

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **AI**: Google Gemini 1.5 Flash
- **Diagrams**: Mermaid.js

## License

MIT License
