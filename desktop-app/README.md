# PDF Auto Filler

An automated PDF form filling desktop application built with Electron, React, and TypeScript.

## Features

- 🚀 One-click installation and execution
- 🎨 Beautiful, intuitive UI
- 📄 Automatic PDF field detection
- 🤖 AI-powered field mapping with Google Gemini
- 📊 Support for multiple client data formats (JSON, CSV, Excel)
- 🔒 Secure local data processing
- 💾 Batch export capabilities

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Build without packaging (for testing)
npm run build:dir
```

### Project Structure

```
desktop-app/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React UI
│   └── shared/         # Shared types and utilities
├── dist/               # Vite build output
├── dist-electron/      # Electron build output
└── release/            # Final packaged apps
```

## Tech Stack

- **Desktop Framework**: Electron
- **UI Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **PDF Processing**: pdf-lib, PDF.js
- **AI Integration**: Google Gemini API
- **Build Tool**: Vite
- **Testing**: Vitest

## License

MIT
