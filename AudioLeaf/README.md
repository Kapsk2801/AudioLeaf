<<<<<<< HEAD
# AudioLeaf 🌿

**Transform your PDFs into spoken words with natural voices**

AudioLeaf is a modern web application that allows you to upload PDF and Word documents, extract their text content, and have it read aloud using the browser's built-in Text-to-Speech (TTS) functionality. Additionally, it provides seamless document conversion between PDF and Word formats.

## ✨ Features

### 📖 Text-to-Speech
- **PDF Support**: Upload and process PDF documents
- **Word Document Support**: Upload and process .docx and .doc files
- **Manual Text Input**: Type or paste text directly for TTS
- **Natural Voice Quality**: Optimized for natural-sounding speech
- **Voice Selection**: Multiple Hindi voice options
- **Playback Controls**: Play, pause, resume, and stop functionality
- **Speed Control**: Adjustable speech rate
- **Page Navigation**: Navigate through multi-page documents

### 🔄 Document Conversion
- **PDF to Word**: Convert PDF documents to editable Word format
- **Word to PDF**: Convert Word documents to PDF format
- **Drag & Drop**: Easy file upload with drag and drop support
- **Progress Tracking**: Real-time conversion progress
- **File Validation**: Automatic file type and size validation
- **Download Ready**: Instant download of converted files

### 🎨 Modern UI/UX
- **Leaf-Themed Design**: Beautiful green leaf aesthetic
- **Responsive Layout**: Works perfectly on all devices
- **Falling Leaves Animation**: Engaging visual effects
- **Glass Morphism**: Modern glass-like design elements
- **Accessibility**: Screen reader friendly

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AudioLeaf
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
AudioLeaf/
├── src/
│   ├── components/
│   │   ├── UniversalPDFProcessor.jsx    # PDF/Word text extraction
│   │   ├── AudioControls.jsx            # TTS playback controls
│   │   ├── TextDisplay.jsx              # Text display component
│   │   ├── DocumentConverter.jsx        # PDF ↔ Word conversion
│   │   └── DocumentConverter.css        # Converter styling
│   ├── services/
│   │   └── conversionService.js         # Document conversion logic
│   ├── App.jsx                          # Main application component
│   ├── App.css                          # Main application styling
│   └── index.css                        # Global styles
├── public/
│   ├── index.html                       # HTML template
│   └── favicon.svg                      # Leaf favicon
└── package.json                         # Dependencies and scripts
```

## 🔧 Configuration

### Voice Settings
The application automatically filters for Hindi voices. You can modify the voice selection logic in `src/App.jsx`:

```javascript
// Filter to only Hindi voices
const filteredVoices = voices.filter(voice => {
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  
  return lang.startsWith('hi') || 
         lang.includes('hindi') ||
         name.includes('hindi') || 
         name.includes('india');
});
```

### Document Conversion
The conversion service uses a mock service by default for demonstration. To enable real API conversion:

1. **Get an API key** from [Cloudmersive](https://www.cloudmersive.com/) or similar service
2. **Update the API key** in `src/components/DocumentConverter.jsx`:
   ```javascript
   const API_KEY = 'your-api-key-here';
   ```
3. **Disable mock service** in `src/services/conversionService.js`:
   ```javascript
   this.useMockService = false;
   ```

## 📚 Usage

### Text-to-Speech

1. **Upload a Document**
   - Drag and drop a PDF or Word file onto the upload area
   - Or click to browse and select a file

2. **Manual Text Input**
   - Type or paste text directly into the text area
   - Click "Process Text" to start TTS

3. **Control Playback**
   - Use play/pause/resume/stop buttons
   - Adjust speech rate with the slider
   - Select different voices from the dropdown

### Document Conversion

1. **Navigate to Converter**
   - Click "Convert PDF ↔ Word" button on the main page

2. **Choose Conversion Type**
   - Select "PDF to Word" or "Word to PDF"

3. **Upload File**
   - Drag and drop or browse for a file
   - Supported formats: .pdf, .docx, .doc

4. **Convert and Download**
   - Click "Convert Now" to start conversion
   - Wait for progress to complete
   - Download the converted file

## 🛠️ Technologies Used

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Web Speech API**: Browser TTS functionality
- **Mammoth.js**: Word document text extraction
- **CSS3**: Modern styling with animations
- **JavaScript ES6+**: Modern JavaScript features

## 🔒 Privacy & Security

- **Client-Side Processing**: Text extraction happens in your browser
- **No Server Storage**: Files are not stored on any server
- **Secure Conversion**: Document conversion uses trusted APIs
- **Local TTS**: Speech synthesis uses your device's capabilities

## 🚀 Deployment

### Vercel (Recommended)
1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

### Other Platforms
The app can be deployed to any static hosting service:
- Netlify
- GitHub Pages
- AWS S3
- Firebase Hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Web Speech API**: For browser-based text-to-speech
- **Mammoth.js**: For Word document processing
- **Cloudmersive**: For document conversion APIs
- **React Community**: For the amazing React ecosystem

## 📞 Support

If you encounter any issues or have questions:

1. Check the browser console for error messages
2. Ensure your browser supports the Web Speech API
3. Try using a different browser (Chrome/Edge recommended)
4. Open an issue on GitHub

---

**Made with ❤️ for accessible reading**
=======
# AudioLeaf

AudioLeaf is a modern web application that lets you upload PDF files and listen to them using your browser’s built-in Text-to-Speech (TTS) engine.

---

## Features

- Upload PDF files  
- Extract and display text  
- Listen using TTS (Web Speech API)  
- Playback controls: Play, Pause, Stop  
- Page navigation  
- Voice and speed selection  
- Fully responsive design  
- Built with accessibility in mind  

---

## Tech Stack

- **React 19 + Vite**  
- **PDF.js** for text extraction  
- **Web Speech API** for TTS  
- **Tailwind CSS** (optional)  

---
>>>>>>> 26173b936fb891c2253eb1e89e47ed8ddcff087d
