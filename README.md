Of course. Here is the complete `README.md` file with your details integrated.

-----

# 🎨 ChromaGen - AI Color Palette Generator

> **Transform ideas into perfect color palettes using advanced AI**

ChromaGen is an intelligent color palette generator that leverages Google's Gemini AI to understand the emotional nuance behind your prompts and create contextually perfect, accessible color schemes.

## ✨ **Features**

### 🧠 **AI-Powered Intelligence**

  - **Emotional Understanding**: AI comprehends prompts like "love and fun colors for a playful brand"
  - **Visual Analysis**: Gemini Vision API analyzes uploaded images for color extraction
  - **Color Psychology**: Considers mood, brand personality, and cultural associations
  - **Context Awareness**: Understands industry-specific color requirements

### 🎨 **Advanced Color Generation**

  - **Text-to-Palette**: Generate palettes from natural language descriptions
  - **Image-to-Palette**: Extract and enhance colors from uploaded images
  - **Color Harmony**: Applies complementary, triadic, analogous color theory
  - **Smart Naming**: AI generates descriptive, meaningful color names

### ♿ **Accessibility First**

  - **WCAG Compliance**: Automatic AA/AAA accessibility checking
  - **Contrast Ratios**: Real-time contrast calculations
  - **Color Blindness**: Simulation and compatibility testing
  - **Recommendations**: Smart suggestions for accessibility improvements

### 💾 **Palette Management**

  - **Save to History**: Persistent palette storage per user
  - **Export Options**: CSS, SCSS, JSON, Adobe ASE formats
  - **Usage Guidelines**: AI-generated recommendations for each color
  - **Categorization**: Primary, secondary, accent, neutral classifications

## 🚀 **Live Demo**

[🌐 **Try ChromaGen Live**](https://your-deployment-url.com) *(Coming Soon)*

## 📸 **Screenshots**
<img width="803" height="2952" alt="image" src="https://github.com/user-attachments/assets/d50d397a-d75a-4d39-9658-74166513f3ec" />
<img width="803" height="7505" alt="image" src="https://github.com/user-attachments/assets/88136856-72b9-4a34-b4bd-5d04bdde4df1" />
<img width="1755" height="6080" alt="image" src="https://github.com/user-attachments/assets/4a68541a-4e1a-40cb-bf0a-47aea9809c31" />

*Screenshots will be added after deployment*

## 🛠️ **Technology Stack**

### **Frontend**

  - **React 18** with TypeScript
  - **Tailwind CSS** for styling
  - **Framer Motion** for animations
  - **Vite** for build tooling

### **Backend**

  - **Node.js** with Express.js
  - **Google Gemini AI** for color generation
  - **Gemini Vision** for image analysis
  - **TypeScript** for type safety

### **AI Integration**

  - **Gemini 1.5 Flash** for text understanding
  - **Gemini Vision** for image analysis
  - **Advanced prompt engineering** for optimal results
  - **Fallback systems** for reliability

## 🔧 **Installation & Setup**

### **Prerequisites**

  - Node.js 18+
  - npm or yarn
  - Google Gemini API key

### **1. Clone Repository**

```bash
git clone https://github.com/shahmoksheet/chromagen-ai-palette-generator.git
cd chromagen-ai-palette-generator
```

### **2. Install Dependencies**

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### **3. Environment Setup**

Create `backend/.env` file:

```env
# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3333
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### **4. Get Gemini API Key**

1.  Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2.  Create a new API key
3.  Add it to your `.env` file

### **5. Start Development Servers**

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### **6. Open Application**

  - Frontend: http://localhost:3000
  - Backend API: http://localhost:3333

## 🧪 **Testing**

### **Run AI Integration Tests**

```bash
# Make sure backend is running first
node test-ai-integration.js
```

### **Test Save Functionality**

```bash
node test-save-functionality.js
```

### **Run Full Test Suite**

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📚 **API Documentation**

### **Generate Palette from Text**

```http
POST /api/generate/text
Content-Type: application/json

{
  "prompt": "love and fun colors for a playful brand",
  "userId": "user123"
}
```

### **Generate Palette from Image**

```http
POST /api/generate/image
Content-Type: multipart/form-data

image: [file upload]
```

### **Save Palette**

```http
POST /api/palettes/save
Content-Type: application/json

{
  "name": "My Awesome Palette",
  "prompt": "original prompt",
  "colors": [...],
  "userId": "user123"
}
```

### **Get Palette History**

```http
GET /api/palettes/history/user123?page=1&limit=12
```

## 🎯 **Example Prompts**

### **Emotional Prompts**

  - "love and fun colors for a children's toy brand"
  - "calming and serene colors for a meditation app"
  - "energetic and bold colors for a fitness startup"

### **Industry-Specific**

  - "trustworthy colors for a financial services company"
  - "innovative colors for a tech startup"
  - "warm and welcoming colors for a restaurant"

### **Mood-Based**

  - "nostalgic colors that evoke childhood memories"
  - "sophisticated colors for luxury fashion"
  - "playful colors for a gaming platform"

## 🤝 **Contributing**

We welcome contributions\! Please see our [Contributing Guidelines](https://www.google.com/search?q=CONTRIBUTING.md) for details.

### **Development Workflow**

1.  Fork the repository
2.  Create a feature branch
3.  Make your changes
4.  Add tests if applicable
5.  Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

## 🙏 **Acknowledgments**

  - **Google Gemini AI** for powerful language and vision models
  - **Color Theory** research and accessibility guidelines
  - **Open Source Community** for amazing tools and libraries

## 📞 **Support**

  - 🐛 **Bug Reports**: [GitHub Issues](https://www.google.com/search?q=https://github.com/shahmoksheet/chromagen-ai-palette-generator/issues)
  - 💡 **Feature Requests**: [GitHub Discussions](https://www.google.com/search?q=https://github.com/shahmoksheet/chromagen-ai-palette-generator/discussions)
  - 📧 **Contact**: moksheetshah@gmail.com

## 🌟 **Star History**

If you find ChromaGen useful, please consider giving it a star\! ⭐

-----

**Built with ❤️ and AI by Moksheet Shah**

*ChromaGen - Where AI meets color theory to create perfect palettes*
