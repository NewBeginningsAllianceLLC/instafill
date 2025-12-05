# PDF Auto Filler

An automated PDF form filling desktop application built with Electron, React, and TypeScript.

## Features

- 🚀 One-click installation and execution
- 🎨 Beautiful, intuitive UI
- 📄 Automatic PDF field detection
- 🤖 AI-powered field mapping with Google Gemini
- 📊 Support for multiple client data formats (JSON, CSV, Excel)
- 🔒 Secure local data processing
- 💾 Automatic form filling and export

## Quick Start

### For Users

1. **Download the app** (once built)
2. **Run the installer**
3. **Launch PDF Auto Filler**

### How to Use

1. **Import Client Data**
   - Click "Select File" in the "Import Client Data" section
   - Choose a JSON, CSV, or Excel file with client information
   - Sample files are provided in `sample-data/` folder

2. **Upload PDF Template**
   - Click "Upload PDF Template"
   - Select a PDF form you want to fill
   - The app will automatically detect form fields

3. **Fill the Form**
   - Select a client from the dropdown
   - Select a PDF template
   - (Optional) Enable AI-powered mapping for better accuracy
   - Click "Fill PDF Form"
   - Choose where to save the completed PDF

### Sample Data

Sample client data files are included in the `sample-data/` folder:
- `clients.json` - JSON format
- `clients.csv` - CSV format

Use these to test the application.

### AI Configuration (Optional)

To enable AI-powered field mapping:

1. Get a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. The app will use the key stored in `.env` file or you can configure it in settings
3. Enable "Use AI-powered field mapping" when filling forms

## Development

### Prerequisites

- Node.js 20+ (recommended) or 18+
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
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Main entry point
│   │   └── preload.ts     # Preload script for IPC
│   ├── renderer/          # React UI
│   │   ├── components/    # React components
│   │   ├── services/      # Business logic services
│   │   └── styles/        # CSS styles
│   └── shared/            # Shared types and utilities
│       ├── schemas/       # Zod validation schemas
│       ├── types/         # TypeScript types
│       └── utils/         # Utility functions
├── sample-data/           # Sample client data files
├── dist/                  # Vite build output
├── dist-electron/         # Electron build output
└── release/               # Final packaged apps
```

## Tech Stack

- **Desktop Framework**: Electron
- **UI Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **PDF Processing**: pdf-lib, PDF.js
- **Data Parsing**: PapaParse (CSV), xlsx (Excel)
- **Validation**: Zod
- **AI Integration**: Google Gemini API
- **Build Tool**: Vite
- **Testing**: Vitest

## Supported File Formats

### Client Data
- JSON (`.json`)
- CSV (`.csv`)
- Excel (`.xlsx`, `.xls`)

### PDF Templates
- PDF forms with fillable fields (`.pdf`)

## Client Data Format

Your client data files should include these fields (all optional except firstName and lastName):

```json
{
  "id": "unique_id",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1985-06-15",
  "email": "john@example.com",
  "phone": "5551234567",
  "street": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zipCode": "62701",
  "country": "USA"
}
```

Additional custom fields are supported and will be available for mapping.

## Troubleshooting

### App won't start
- Make sure you have Node.js 18+ installed
- Try deleting `node_modules` and running `npm install` again

### PDF won't load
- Ensure the PDF has fillable form fields
- Check that the file isn't corrupted

### Client data won't import
- Verify the file format is correct (JSON, CSV, or Excel)
- Check that required fields (firstName, lastName) are present

### AI mapping not working
- Verify your Gemini API key is configured
- Check your internet connection
- The app will fall back to rule-based mapping if AI fails

## License

MIT
