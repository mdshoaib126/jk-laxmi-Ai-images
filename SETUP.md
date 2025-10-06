# JK Lakshmi AR Facade Designer - Setup Instructions

## 🚀 Complete Setup Guide

Follow these step-by-step instructions to set up the JK Lakshmi AR Facade Designer application on your local development environment.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/)
- **Git** - [Download here](https://git-scm.com/)

### API Keys Required
- **Google AI Studio API Key** for Gemini 2.5 Flash
  - Visit: https://makersuite.google.com/app/apikey
  - Create a new API key
  - Save it securely (you'll need it later)

## 🏗️ Step-by-Step Setup

### Step 1: Clone the Repository

```bash
# Clone the project
git clone <your-repository-url>
cd webAR-application

# Verify the project structure
dir  # On Windows
ls   # On macOS/Linux
```

You should see:
```
webAR-application/
├── backend/
├── frontend/
├── database/
├── README.md
└── .gitignore
```

### Step 2: Database Setup

#### 2.1 Start MySQL Service

**Windows:**
```bash
# Start MySQL service (Run as Administrator)
net start mysql
```

**macOS/Linux:**
```bash
# Start MySQL service
sudo systemctl start mysql
# OR
brew services start mysql
```

#### 2.2 Create Database

```bash
# Connect to MySQL
mysql -u root -p
```

In MySQL console:
```sql
-- Create database
CREATE DATABASE jk_lakshmi_ar;

-- Create user (optional, for security)
CREATE USER 'jk_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON jk_lakshmi_ar.* TO 'jk_user'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE jk_lakshmi_ar;

-- Exit MySQL
EXIT;
```

#### 2.3 Import Database Schema

```bash
# Import the database schema
mysql -u root -p jk_lakshmi_ar < database/schema.sql
```

Verify tables were created:
```bash
mysql -u root -p -e "USE jk_lakshmi_ar; SHOW TABLES;"
```

You should see:
```
+---------------------------+
| Tables_in_jk_lakshmi_ar   |
+---------------------------+
| generated_designs         |
| shares                    |
| uploads                   |
| users                     |
+---------------------------+
```

### Step 3: Backend Setup

#### 3.1 Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

#### 3.2 Configure Environment Variables

Create `.env` file in the `backend` directory:

```bash
# Create .env file
copy NUL .env  # Windows
touch .env     # macOS/Linux
```

Add the following content to `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
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

# Security Configuration
JWT_SECRET=your_jwt_secret_here_make_it_long_and_secure
SESSION_SECRET=your_session_secret_here_also_long_and_secure
```

**Important:** Replace the placeholder values:
- `your_mysql_password_here` - Your MySQL root password
- `your_gemini_api_key_here` - Your Google AI Studio API key
- `your_jwt_secret_here...` - Generate a secure random string
- `your_session_secret_here...` - Generate another secure random string

#### 3.3 Test Backend Setup

```bash
# Still in backend directory
npm start
```

You should see:
```
🚀 JK Lakshmi AR Backend Server started on port 3001
✅ Database connected successfully
📁 Upload directories verified
🤖 Gemini AI service initialized
```

**If you see errors:**
- Check your `.env` file values
- Verify MySQL is running
- Confirm your Gemini API key is valid

Keep this terminal running and open a new terminal for the frontend.

### Step 4: Frontend Setup

#### 4.1 Install Frontend Dependencies

**In a new terminal:**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

#### 4.2 Start Frontend Development Server

```bash
# Start the development server
npm start
```

You should see:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Step 5: Verify Installation

#### 5.1 Open the Application

1. Open your web browser
2. Navigate to: `http://localhost:5173`
3. You should see the JK Lakshmi AR Designer homepage

#### 5.2 Test Core Functionality

**Test 1: Photo Upload**
1. Click "Upload Photo" or "Take Photo"
2. Select or capture a building image
3. Verify upload completes successfully

**Test 2: AI Generation**
1. After uploading, select a design style
2. Click "Generate Design"
3. Wait for AI processing (may take 10-30 seconds)
4. Verify generated design appears

**Test 3: Design Sharing**
1. Click "Share Design" on a generated design
2. Verify sharing options appear
3. Test social media sharing functionality

## 🔧 Development Commands

### Backend Commands
```bash
cd backend

# Start development server
npm start

# Start with auto-reload (nodemon)
npm run dev

# Run tests
npm test

# Check API status
curl http://localhost:3001/api/health
```

### Frontend Commands
```bash
cd frontend

# Start development server
npm start

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint
```

## 🌐 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production` in backend `.env`
2. Update database credentials for production
3. Configure domain in `FRONTEND_URL`
4. Build frontend: `npm run build`

### Build Commands
```bash
# Build frontend for production
cd frontend
npm run build

# Start backend in production mode
cd ../backend
NODE_ENV=production npm start
```

## 🔍 Troubleshooting

### Common Issues

#### "Database Connection Failed"
```bash
# Check MySQL service
# Windows:
net start mysql

# macOS/Linux:
sudo systemctl status mysql

# Verify credentials
mysql -u root -p -e "SELECT 1;"
```

#### "Gemini API Error"
- Verify API key in `.env` file
- Check API quota at https://console.cloud.google.com/
- Ensure internet connectivity

#### "Port Already in Use"
```bash
# Kill process on port 3001
npx kill-port 3001

# Kill process on port 5173  
npx kill-port 5173
```

#### "Social Sharing Not Working"
- Check if Web Share API is supported
- Verify social media platform URLs
- Test sharing on mobile devices

#### "Upload Failed"
- Verify upload directories exist:
```bash
# Windows:
mkdir backend\uploads\original
mkdir backend\uploads\generated

# macOS/Linux:
mkdir -p backend/uploads/original
mkdir -p backend/uploads/generated
```
- Check file permissions
- Verify file size limits

#### "MindAR Package Not Found"
If you see errors about `@mind-ar/core` not found:
```bash
# The package.json has been updated to use the correct MindAR package
# Simply retry the npm install:
cd frontend
npm install
```

#### "Frontend Dependencies Issues"
```bash
# Clear npm cache and reinstall
cd frontend
npm cache clean --force
rm -rf node_modules package-lock.json  # Windows: rmdir /s node_modules && del package-lock.json
npm install
```

### Reset Everything
```bash
# Stop all servers (Ctrl+C)
# Clear node_modules
cd backend && rmdir /s node_modules && npm install
cd ../frontend && rmdir /s node_modules && npm install

# Reset database
mysql -u root -p -e "DROP DATABASE jk_lakshmi_ar; CREATE DATABASE jk_lakshmi_ar;"
mysql -u root -p jk_lakshmi_ar < database/schema.sql

# Restart servers
cd backend && npm start
# In new terminal:
cd frontend && npm start
```

## 📊 Performance Tips

### Backend Optimization
- Use connection pooling (already configured)
- Enable gzip compression for API responses
- Implement Redis caching for frequently accessed data
- Optimize image processing with Sharp

### Frontend Optimization  
- Enable service worker caching (already included)
- Use lazy loading for images
- Implement virtual scrolling for large lists
- Optimize bundle size with tree shaking

## 🔐 Security Considerations

### Development
- Keep `.env` files secure and never commit them
- Use HTTPS in production
- Validate all user inputs
- Implement rate limiting for API endpoints

### Production
- Use environment variables for secrets
- Enable SQL injection protection
- Configure CORS properly
- Set up proper authentication

## 📞 Getting Help

If you encounter issues:

1. **Check this setup guide** for common solutions
2. **Review error messages** carefully
3. **Check browser console** for frontend issues
4. **Check server logs** for backend issues
5. **Verify environment variables** are set correctly

## ✅ Setup Checklist

Before starting development, confirm:

- [ ] Node.js 18+ installed
- [ ] MySQL 8+ running
- [ ] Database created and schema imported
- [ ] Backend `.env` file configured
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Both servers running without errors
- [ ] Application accessible at localhost:5173
- [ ] Photo upload working
- [ ] AI generation working
- [ ] Design sharing working

**🎉 Congratulations! Your JK Lakshmi AR Facade Designer is ready for development!**