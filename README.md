# JK Lakshmi Facade Designer

A complete web-based facade design application that allows users to upload photos of buildings, generate AI-powered facade designs using Google Gemini 2.5 Flash, and share them for contest participation.

## 🏗️ Features

- **📱 Progressive Web App (PWA)** - Install on mobile/desktop
- **📸 Photo Upload** - Camera capture or file upload
- **🤖 AI-Powered Design** - Google Gemini 2.5 Flash integration
- **🎨 Multiple Design Styles** - Modern, Classical, Industrial, Eco-friendly
- ** Before/After Slider** - Compare original vs designed facades
- **📱 Social Sharing** - Contest participation features
- **⚡ Offline Support** - Service Worker caching
- **🎯 Responsive Design** - Works on all devices

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **Google Gemini 2.5 Flash API** for AI generation
- **Multer** for file uploads
- **Sharp** for image processing

### Frontend
- **React 18** with Vite
- **PWA** capabilities
- **Responsive CSS** (no framework dependencies)
- **Social Sharing APIs**

## 📁 Project Structure

```
webAR-application/
├── backend/
│   ├── app.js                 # Express server
│   ├── config/
│   │   ├── env.js            # Environment configuration
│   │   └── db.js             # Database connection
│   ├── routes/
│   │   ├── uploadRoutes.js   # File upload endpoints
│   │   ├── generateRoutes.js # AI generation endpoints
│   │   ├── designRoutes.js   # Design management
│   │   └── shareRoutes.js    # Social sharing
│   ├── services/
│   │   ├── geminiService.js  # Gemini AI integration
│   │   └── imageUtils.js     # Image processing
│   └── uploads/              # File storage
│       ├── original/         # Original uploaded images
│       └── generated/        # AI-generated designs
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React app
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context
│   │   └── styles/          # CSS files
│   ├── public/
│   │   ├── manifest.json    # PWA manifest
│   │   ├── sw.js           # Service worker
│   │   └── offline.html    # Offline page
│   └── vite.config.js      # Vite configuration
└── database/
    └── schema.sql          # Database schema
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MySQL** (v8.0 or higher)
- **Google AI Studio API Key** (Gemini 2.5 Flash)

### 1. Clone & Setup

```bash
# Clone the repository
git clone <repository-url>
cd webAR-application

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE jk_lakshmi_ar;
USE jk_lakshmi_ar;

# Import schema
source ../database/schema.sql;
```

### 3. Environment Configuration

Create `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=jk_lakshmi_ar
DB_PORT=3306

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## 📱 API Endpoints

### Upload Routes
- `POST /api/upload` - Upload building photo
- `GET /api/uploads/:id` - Get upload details

### Generation Routes
- `POST /api/generate` - Generate AI facade design
- `GET /api/generate/:id` - Get generation status

### Design Routes
- `GET /api/designs` - List all designs
- `GET /api/designs/:id` - Get specific design
- `DELETE /api/designs/:id` - Delete design

### Share Routes
- `POST /api/share` - Share design for contest
- `GET /api/shares` - Get shared designs

## 🎨 Design Styles

The AI generates facades in four distinct styles:

1. **🏢 Modern** - Clean lines, glass, metal, contemporary aesthetics
2. **🏛️ Classical** - Traditional elements, columns, ornate details
3. **🏭 Industrial** - Raw materials, exposed structure, urban feel
4. **🌱 Eco-friendly** - Green elements, sustainable materials, natural integration

## 📱 WebAR Implementation

### Three.js AR (Basic)
- Camera-based AR overlay
- 3D model positioning
- Touch controls for scaling/rotation

### MindAR (Advanced)
- Computer vision tracking
- Target image detection
- Advanced 3D rendering
- Robust tracking in various lighting

## 🔧 Configuration Options

### Image Processing
- **Supported formats:** JPG, JPEG, PNG, WebP
- **Max file size:** 10MB
- **Auto-optimization:** Sharp image processing
- **Thumbnail generation:** Multiple sizes

### PWA Features
- **Offline support** via Service Worker
- **App installation** on mobile/desktop
- **Background sync** for uploads
- **Push notifications** for generation complete

### Database Schema
- **users** - User management
- **uploads** - Original images
- **generated_designs** - AI-generated facades
- **shares** - Contest submissions

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm run test
```

### Manual Testing Checklist
- [ ] Photo upload (camera & file)
- [ ] AI generation for all styles
- [ ] AR preview functionality
- [ ] Before/after comparison
- [ ] Social sharing
- [ ] Offline functionality
- [ ] PWA installation

## 🚀 Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

### Environment Variables (Production)
```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
GEMINI_API_KEY=your_production_gemini_key
FRONTEND_URL=https://your-domain.com
```

### Docker Deployment (Optional)
```bash
# Build and run with Docker
docker-compose up --build
```

## 📊 Performance Optimization

### Backend
- **Image optimization** with Sharp
- **Database indexing** on frequently queried fields
- **API response caching** for generated designs
- **File compression** for uploads

### Frontend
- **Code splitting** with Vite
- **Image lazy loading** for design galleries
- **Service Worker caching** for offline support
- **Bundle optimization** for faster loading

## 🔐 Security Features

- **File upload validation** (type, size, content)
- **SQL injection prevention** with parameterized queries
- **XSS protection** with helmet.js
- **CORS configuration** for API security
- **Input sanitization** for user data

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check MySQL service
systemctl status mysql
# Verify credentials in .env file
```

**2. Gemini API Errors**
```bash
# Verify API key in .env
# Check API quota limits
# Ensure network connectivity
```

**3. File Upload Issues**
```bash
# Check upload directory permissions
chmod 755 backend/uploads
# Verify file size limits
```

**4. AR Not Working**
```bash
# Enable camera permissions
# Use HTTPS for production
# Check device compatibility
```

### Log Files
- **Backend logs:** `backend/logs/`
- **Frontend errors:** Browser console
- **Service Worker:** Application > Service Workers in DevTools

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for facade generation
- **MindAR** for WebAR capabilities
- **Three.js** for 3D rendering
- **JK Lakshmi Cement** for project inspiration

## 📞 Support

For technical support or questions:
- **Email:** support@jklakshmi-ar.com
- **Documentation:** [docs.jklakshmi-ar.com](https://docs.jklakshmi-ar.com)
- **Issues:** GitHub Issues section

---

**🎯 Ready to transform facades with AI-powered AR? Start building amazing designs!**