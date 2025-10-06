import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserContext } from '../App'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const SharePage = () => {
  const { designId, shareId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(UserContext)
  const [loading, setLoading] = useState(true)
  const [design, setDesign] = useState(null)
  const [shareData, setShareData] = useState(null)
  const [error, setError] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [contestEntry, setContestEntry] = useState(null)

  useEffect(() => {
    if (shareId) {
      // Viewing a contest entry
      fetchContestEntry()
    } else if (designId && user?.id) {
      // Sharing a design
      fetchDesignForSharing()
    } else {
      navigate('/upload')
    }
  }, [designId, shareId, user?.id])

  const fetchDesignForSharing = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(
        `${API_BASE_URL}/api/designs/detail/${designId}?userId=${user.id}`
      )

      if (response.data.success) {
        setDesign(response.data.data)
      } else {
        throw new Error(response.data.message || 'Design not found')
      }
    } catch (error) {
      console.error('Fetch design error:', error)
      setError(error.response?.data?.message || error.message || 'Failed to load design')
    } finally {
      setLoading(false)
    }
  }

  const fetchContestEntry = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(`${API_BASE_URL}/api/share/contest/${shareId}`)

      if (response.data.success) {
        setContestEntry(response.data.data)
      } else {
        throw new Error(response.data.message || 'Contest entry not found')
      }
    } catch (error) {
      console.error('Fetch contest entry error:', error)
      setError(error.response?.data?.message || error.message || 'Failed to load contest entry')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async (platform) => {
    if (!design || !user?.id) return

    try {
      setSharing(true)

      const response = await axios.post(`${API_BASE_URL}/api/share`, {
        userId: user.id,
        designId: design.designId,
        platform
      })

      if (response.data.success) {
        setShareData(response.data.data)
        setShareSuccess(true)

        // Use Web Share API if available
        if (navigator.share && platform === 'native') {
          try {
            await navigator.share({
              title: response.data.data.shareContent.title,
              text: response.data.data.shareContent.text,
              url: response.data.data.contestUrl
            })
          } catch (shareError) {
            console.log('Native share cancelled or failed:', shareError)
          }
        } else {
          // Open platform-specific share URL
          const shareUrl = response.data.data.sharingUrls[platform]
          if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400')
          }
        }
      } else {
        throw new Error(response.data.message || 'Share failed')
      }
    } catch (error) {
      console.error('Share error:', error)
      alert(error.response?.data?.message || error.message || 'Failed to share design')
    } finally {
      setSharing(false)
    }
  }

  const copyContestLink = async () => {
    if (shareData?.contestUrl) {
      try {
        await navigator.clipboard.writeText(shareData.contestUrl)
        alert('Contest link copied to clipboard!')
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = shareData.contestUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Contest link copied to clipboard!')
      }
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {shareId ? 'Loading Contest Entry...' : 'Preparing Share...'}
          </h2>
          <p className="text-gray-600">
            Please wait while we load the details
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {shareId ? 'Contest Entry Not Found' : 'Design Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button onClick={() => navigate('/upload')} className="btn-primary">
              Upload New Photo
            </button>
            <button onClick={() => navigate(-1)} className="btn-secondary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Contest Entry View
  if (contestEntry) {
    const designTypes = {
      modern_premium: { name: 'Modern Premium', icon: '🏢' },
      trust_heritage: { name: 'Trust & Heritage', icon: '🏛️' },
      eco_smart: { name: 'Eco Smart', icon: '🌿' },
      festive: { name: 'Festive', icon: '🎉' }
    }

    const designInfo = designTypes[contestEntry.design.designType] || {
      name: 'Custom Design',
      icon: '🎨'
    }

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contest Entry
          </h1>
          <p className="text-gray-600">
            Facade design transformation by JK Lakshmi Cement
          </p>
        </div>

        {/* Contest Entry Details */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-xl">
                {designInfo.icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {designInfo.name}
                </h2>
                <p className="text-sm text-gray-600">
                  Shared on {new Date(contestEntry.sharedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                🏆 Contest Entry
              </div>
            </div>
          </div>

          {/* Participant Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Participant</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-600">
                  {contestEntry.participant.name || 'Anonymous'}
                </span>
              </div>
              {contestEntry.participant.shopName && (
                <div>
                  <span className="font-medium text-gray-700">Shop:</span>
                  <span className="ml-2 text-gray-600">
                    {contestEntry.participant.shopName}
                  </span>
                </div>
              )}
              {contestEntry.participant.location && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Location:</span>
                  <span className="ml-2 text-gray-600">
                    {contestEntry.participant.location}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Before/After Images */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Before</h3>
              <div className="relative">
                <img
                  src={`${API_BASE_URL}${contestEntry.originalImage.filePath}`}
                  alt="Original shopfront"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute top-2 left-2 bg-gray-700 text-white px-2 py-1 rounded text-xs">
                  Original
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">After</h3>
              <div className="relative">
                <img
                  src={`${API_BASE_URL}${contestEntry.design.filePath}`}
                  alt="Transformed facade"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                  JK Lakshmi Design
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="card p-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Create Your Own Design
          </h3>
          <p className="text-gray-600 mb-4">
            Transform your shopfront with JK Lakshmi Cement's AI-powered facade designer
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="btn-primary"
          >
            🚀 Start Your Transformation
          </button>
        </div>
      </div>
    )
  }

  // Design Sharing View
  const designTypes = {
    modern_premium: { name: 'Modern Premium', icon: '🏢' },
    trust_heritage: { name: 'Trust & Heritage', icon: '🏛️' },
    eco_smart: { name: 'Eco Smart', icon: '🌿' },
    festive: { name: 'Festive', icon: '🎉' }
  }

  const designInfo = designTypes[design?.designType] || { name: 'Custom Design', icon: '🎨' }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Share Your Design
        </h1>
        <p className="text-gray-600">
          Show off your transformation and participate in the contest
        </p>
      </div>

      {/* Success Message */}
      {shareSuccess && shareData && (
        <div className="card p-6 bg-green-50 border-green-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">
              ✓
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Successfully Shared!</h3>
              <p className="text-sm text-green-700">Your design has been entered in the contest</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Your Contest Link:</h4>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareData.contestUrl}
                readOnly
                className="flex-1 form-input text-sm"
              />
              <button
                onClick={copyContestLink}
                className="btn-secondary px-3 py-2 text-sm"
              >
                📋 Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Design Preview */}
      {design && (
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-xl mr-3">
              {designInfo.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {designInfo.name}
              </h2>
              <p className="text-sm text-gray-600">
                Generated on {new Date(design.generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Before</h3>
              <img
                src={`${API_BASE_URL}${design.originalImage.filePath}`}
                alt="Original shopfront"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">After</h3>
              <img
                src={`${API_BASE_URL}${design.filePath}`}
                alt="Transformed facade"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          </div>

          {/* User Info */}
          {design.userInfo.name && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Your Details</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-600">{design.userInfo.name}</span>
                </div>
                {design.userInfo.shopName && (
                  <div>
                    <span className="font-medium text-gray-700">Shop:</span>
                    <span className="ml-2 text-gray-600">{design.userInfo.shopName}</span>
                  </div>
                )}
                {design.userInfo.location && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{design.userInfo.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sharing Options */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Choose How to Share
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Native Share (if available) */}
          {navigator.share && (
            <button
              onClick={() => handleShare('native')}
              disabled={sharing}
              className="flex items-center justify-center p-4 border-2 border-gray-300 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📱</div>
                <h4 className="font-medium text-gray-900">Device Share</h4>
                <p className="text-sm text-gray-600">Use your device's share menu</p>
              </div>
            </button>
          )}

          {/* Social Media Platforms */}
          <button
            onClick={() => handleShare('facebook')}
            disabled={sharing}
            className="flex items-center justify-center p-4 border-2 border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <h4 className="font-medium text-gray-900">Facebook</h4>
              <p className="text-sm text-gray-600">Share on timeline</p>
            </div>
          </button>

          <button
            onClick={() => handleShare('instagram')}
            disabled={sharing}
            className="flex items-center justify-center p-4 border-2 border-gray-300 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all"
          >
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <h4 className="font-medium text-gray-900">Instagram</h4>
              <p className="text-sm text-gray-600">Share to stories</p>
            </div>
          </button>
        </div>

        {sharing && (
          <div className="text-center py-4">
            <div className="loading-spinner mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Preparing share...</p>
          </div>
        )}
      </div>

      {/* Contest Information */}
      <div className="card p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold text-yellow-900 mb-3">🏆 Contest Rules</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-800">
          <div>
            <h4 className="font-medium mb-2">How to Participate:</h4>
            <ul className="space-y-1">
              <li>Share your design on any platform</li>
              <li>Use hashtag #JKLakshmiDesign</li>
              <li>Tag @JKLakshmiCement</li>
              <li>Complete your profile information</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Prizes:</h4>
            <ul className="space-y-1">
              <li>Weekly winners get JK Lakshmi vouchers</li>
              <li>Monthly grand prize: </li>
              <li>Feature in JK Lakshmi campaigns</li>
              <li>Professional facade consultation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col text-center sm:flex-row justify-between space-y-4 sm:space-y-0">
         
        <button
          onClick={() => navigate('/upload')}
          className="btn-primary justify-center text-center"
        >
          🚀 Create Another Design
        </button>
      </div>
    </div>
  )
}

export default SharePage