# MermaidFlow - Free AI Diagram Generator

**MermaidFlow** is the **best free AI diagram generator** that transforms natural language descriptions into professional Mermaid diagrams instantly. Built with Google's cutting-edge Gemini AI, MermaidFlow makes diagram creation accessible to everyone, from developers to business analysts. It's the perfect free diagram maker for creating stunning diagrams without any prior design experience.

![MermaidFlow](https://img.shields.io/badge/Powered%20by-Gemini%20AI-blue)
![Free Tool](https://img.shields.io/badge/100%25-Free-brightgreen)
![No Signup](https://img.shields.io/badge/No-Signup-red)

## 🌟 Key Features of Free AI Diagram Generator

- **🤖 AI-Powered Generation**: Describe your diagram in plain English, and Gemini AI creates the perfect Mermaid code - 100% free
- **✏️ Smart Editing**: Modify existing diagrams with natural language instructions
- **✓ Auto-Validation**: AI validates and fixes syntax errors automatically
- **📊 10+ Diagram Types**: Supports flowcharts, UML diagrams, sequence diagrams, class diagrams, ER diagrams, Gantt charts, mindmaps, git graphs, and more
- **🎨 Live Preview**: Real-time diagram rendering as you type with free mermaid diagram generator
- **📤 Export Options**: Export diagrams as high-quality SVG or PNG for free
- **📋 Quick Templates**: Start with pre-built templates for common diagram types
- **🌙 Dark/Light Themes**: Comfortable viewing in any environment
- **🚀 No Registration Required**: Start creating diagrams instantly - no signup needed

## 📊 Supported Diagram Types

MermaidFlow supports a comprehensive range of diagram types:

- **Flowcharts**: Perfect for business processes, software architecture, and decision trees
- **UML Diagrams**: Class diagrams, sequence diagrams, state diagrams for object-oriented design
- **ER Diagrams**: Entity-relationship diagrams for database design
- **Gantt Charts**: Project timelines and scheduling
- **Mindmaps**: Idea visualization and brainstorming
- **Git Graphs**: Visualizing Git workflows and branching
- **Timelines**: Chronological events and historical data
- **Pie Charts**: Data visualization and proportional representation

## 🚀 Quick Start

### For Users
1. **Visit the website**: Go to [https://mermaidflow.com](https://mermaidflow.com)
2. **Describe your diagram**: Type your diagram description in natural language
3. **Generate**: Click "Generate" and let AI create your diagram
4. **Export**: Download as SVG or PNG

### For Developers
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

## 🎯 SEO & Branding Features

MermaidFlow is optimized for search engines with:

- **Comprehensive SEO Metadata**: Detailed meta tags, Open Graph, and Twitter Cards
- **Structured Data**: JSON-LD schema for better search visibility
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: Semantic HTML and ARIA labels
- **Performance Optimized**: Fast load times and efficient rendering
- **Social Sharing**: Optimized for social media platforms

## 📱 Branding Guidelines

- **Logo**: MermaidFlow logo features a modern gradient design
- **Colors**: Primary color #0f766e (teal), complementary colors for dark/light themes
- **Typography**: Space Grotesk for headings, JetBrains Mono for code
- **Iconography**: Consistent SVG icon style throughout the application

## 📄 License

MIT License
