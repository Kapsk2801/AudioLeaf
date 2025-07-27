# 🎵 AudioLeaf

A modern web application that transforms PDF files into spoken words using the browser's built-in Text-to-Speech (TTS) functionality. AudioLeaf provides an intuitive interface for uploading PDFs, extracting text, and listening to content with full playback controls.

## ✨ Features

- **📄 PDF Upload**: Drag and drop or click to upload PDF files
- **🔤 Text Extraction**: Automatically extracts text from uploaded PDFs
- **🎧 Text-to-Speech**: Converts extracted text to speech using Web Speech API
- **🎛️ Playback Controls**: Play, pause, resume, and stop functionality
- **📖 Page Navigation**: Navigate through PDF pages individually
- **🎙️ Voice Selection**: Choose from available system voices
- **⚡ Speed Control**: Adjust speech rate from 0.5x to 2x
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **♿ Accessibility**: Built with accessibility best practices
- **🌙 Modern UI**: Clean, elegant design with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AudioLeaf
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/
│   ├── PDFUploader.jsx      # PDF file upload and processing
│   ├── AudioControls.jsx    # TTS playback controls
│   └── TextDisplay.jsx      # Text content display
├── App.jsx                  # Main application component
├── App.css                  # Application styles
├── index.css               # Global styles
└── main.jsx                # Application entry point
```

## 🚀 Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Build the project:
```bash
npm run build
```

3. Deploy to Vercel:
```bash
vercel
```

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. The built files will be in the `dist/` directory
3. Upload the contents of `dist/` to your web server

## 🎯 Usage

1. **Upload PDF**: Drag and drop a PDF file onto the upload area or click to browse
2. **Wait for Processing**: The app will extract text from all pages
3. **Navigate Pages**: Use the page navigation controls to browse through content
4. **Configure Voice**: Select your preferred voice and adjust speech speed
5. **Start Listening**: Click the play button to begin text-to-speech
6. **Control Playback**: Use pause, resume, and stop controls as needed

## 🔧 Technical Details

### Technologies Used

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **PDF.js** - PDF text extraction library
- **Web Speech API** - Browser-native text-to-speech
- **CSS Custom Properties** - Modern styling with design tokens

### Browser Support

AudioLeaf works in all modern browsers that support:
- Web Speech API (Chrome, Safari, Edge, Firefox)
- File API
- ES6+ features

### Performance Features

- Lazy loading of PDF content
- Efficient text extraction
- Responsive design for all screen sizes
- Optimized bundle size

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF processing
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for text-to-speech functionality
- [Vite](https://vitejs.dev/) for the excellent build tooling

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the [Issues](https://github.com/yourusername/audioleaf/issues) page
2. Create a new issue with detailed information
3. Include browser version and steps to reproduce

---

Made with ❤️ for accessible reading experiences
