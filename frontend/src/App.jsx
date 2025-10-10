import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Edit2 } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Pages
import UploadPage from './pages/UploadPage'
import PreviewPage from './pages/PreviewPage'
import SharePage from './pages/SharePage'
import InteriorUploadPage from './pages/InteriorUploadPage'
import InteriorPreviewPage from './pages/InteriorPreviewPage'
import FinalSubmissionPage from './pages/FinalSubmissionPage'

// Context for user data
export const UserContext = React.createContext()

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditForm, setShowEditForm] = useState(false)
  const [hasSubmission, setHasSubmission] = useState(false)

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
      
      console.log('Creating new user:', newUser)
      setUser(newUser)
      localStorage.setItem('jk_ar_user', JSON.stringify(newUser))
    }

    initializeUser()
  }, [])

  // Check submission status when user changes
  useEffect(() => {
    if (user?.id) {
      checkUserSubmissionStatus()
    }
  }, [user?.id])

  const checkUserSubmissionStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contest/user-submissions/${user.id}`)
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        setHasSubmission(true)
      } else {
        setHasSubmission(false)
      }
    } catch (error) {
      console.log('No submissions found for user:', error.message)
      setHasSubmission(false)
    }
  }

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
    console.log('Updating user:', { current: user, updates, result: updatedUser })
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

  const triggerEditForm = () => {
    setShowEditForm(true)
  }

  return (
    <UserContext.Provider value={{ user, updateUser, triggerEditForm, showEditForm, setShowEditForm, hasSubmission, setHasSubmission }}>
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
                  {!hasSubmission && (
                    <Edit2 
                      onClick={triggerEditForm}
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                      style={{ marginLeft: '15px' }}
                      title="Edit Details"
                    />
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
            <Route path="/interior-upload/:storefrontDesignId" element={<InteriorUploadPage />} />
            <Route path="/interior-preview/:uploadId" element={<InteriorPreviewPage />} />
            <Route path="/final-submission/:storefrontDesignId/:interiorDesignId" element={<FinalSubmissionPage />} />
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