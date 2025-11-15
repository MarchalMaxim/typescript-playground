# TypeScript Playground

A browser-based playground for testing and experimenting with TypeScript code.

## Features

- ✨ **Live TypeScript Editor** - Write TypeScript code with Monaco Editor (the same editor that powers VS Code)
- 🎯 **Syntax Highlighting** - Full TypeScript syntax highlighting and IntelliSense
- ⚡ **Real-time Compilation** - See your TypeScript compiled to JavaScript instantly
- 🔍 **Type Checking** - Get real-time type checking and error detection
- 📤 **Console Output** - View console.log output directly in the browser
- 🎨 **Beautiful UI** - Modern, responsive design that works on all devices

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MarchalMaxim/typescript-playground.git
cd typescript-playground
```

2. Install dependencies:
```bash
npm install
```

### Running the Playground

Start the development server:
```bash
npm start
```

This will:
- Start a local HTTP server on port 8080
- Automatically open the playground in your default browser
- You can access it at `http://localhost:8080`

## Usage

1. **Write TypeScript Code**: Use the left panel to write your TypeScript code
2. **Run Code**: Click the "▶ Run Code" button or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
3. **View Output**: See the console output in the top right panel
4. **View Compiled JavaScript**: See the compiled JavaScript code in the bottom right panel
5. **Clear Output**: Click the "Clear" button to clear the output panel

## Project Structure

```
typescript-playground/
├── index.html          # Main HTML file
├── app.js             # Application logic and Monaco Editor setup
├── styles.css         # Styling for the playground
├── tsconfig.json      # TypeScript configuration
├── package.json       # NPM dependencies and scripts
└── README.md          # This file
```

## Technology Stack

- **Monaco Editor** - The code editor that powers Visual Studio Code
- **TypeScript** - For type checking and compilation
- **http-server** - Simple HTTP server for local development

## Keyboard Shortcuts

- `Ctrl+Enter` (or `Cmd+Enter` on Mac) - Run the code

## License

ISC
