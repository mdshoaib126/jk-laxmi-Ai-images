import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Pages
import UploadPage from './pages/UploadPage'
import PreviewPage from './pages/PreviewPage'
import SharePage from './pages/SharePage'

// Context for user data
export const UserContext = React.createContext()

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize user from localStorage or create new user
    const initializeUser = () => {
      let savedUser = localStorage.getItem('jk_ar_user')
      
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          console.error('Error parsing saved user:', error)
          createNewUser()
        }
      } else {
        createNewUser()
      }
      
      setLoading(false)
    }

    const createNewUser = () => {
      const newUser = {
        id: null, // Will be set by backend after upload
        dealershipName: '',
        sapCode: '',
        mobileNumber: '',
        createdAt: new Date().toISOString(),
        uploads: [],
        designs: []
      }
      
      setUser(newUser)
      localStorage.setItem('jk_ar_user', JSON.stringify(newUser))
    }

    initializeUser()
  }, [])

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('jk_ar_user', JSON.stringify(updatedUser))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading JK Lakshmi Facade Designer...</p>
        </div>
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        {/* Header */}
        <header className="bg-white  shadow-sm border-b-2 border-red-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
            <div className="flex flex-col justify-between items-center h-16">
              <div className="flex items-center">
                <img 
                  src="/jk-logo.png" 
                  alt="JK Lakshmi Cement" 
                  className="h-8 w-auto mr-3"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iI2U3NGMzYyIvPgo8dGV4dCB4PSI1IiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPkpLPC90ZXh0Pgo8L3N2Zz4K'
                  }}
                />
                
              </div>
              
              {user && user.dealershipName && (
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-2">Hello, {user.dealershipName}</span>
                  {user.sapCode && (
                    <span className="text-xs text-gray-500">({user.sapCode})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/upload" replace />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/preview/:uploadId" element={<PreviewPage />} />
            <Route path="/share/:designId" element={<SharePage />} />
            <Route path="/contest/:shareId" element={<SharePage />} />
            <Route path="*" element={<Navigate to="/upload" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Powered by JK Lakshmi Cement
              </p>
              <p className="text-xs text-gray-500">
                Transform your shopfront with AI-powered facade designs
              </p>
            </div>
          </div>
        </footer>
      </div>
    </UserContext.Provider>
  )
}

export default App