import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Trophy, CheckCircle, ArrowLeft } from 'lucide-react'
import { UserContext } from '../App'
import { FireworksBackground } from '@/components/ui/shadcn-io/fireworks-background'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Helper function to get correct image URL
const getImageUrl = (filePath) => {
  // Return placeholder if filePath is null/undefined
  if (!filePath) {
    return '/api/placeholder/400/300' // or any placeholder image you prefer
  }
  // If filePath starts with http/https, it's an S3 URL, use directly
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }
  // Otherwise, it's a local path, prepend API_BASE_URL
  return `${API_BASE_URL}${filePath}`
}

const FinalSubmissionPage = () => {
  const { storefrontDesignId, interiorDesignId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(UserContext)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [storefrontDesign, setStorefrontDesign] = useState(null)
  const [interiorDesign, setInteriorDesign] = useState(null)
  const [submissionData, setSubmissionData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!storefrontDesignId || !interiorDesignId || !user?.id) {
      navigate('/upload')
      return
    }

    fetchDesigns()
    checkExistingSubmission()
  }, [storefrontDesignId, interiorDesignId, user?.id])

  const checkExistingSubmission = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contest/check-submission`, {
        params: {
          userId: user?.id,
          storefrontDesignId,
          interiorDesignId
        }
      })
      
      if (response.data.success && response.data.data) {
        // Submission already exists
        setSubmissionData(response.data.data)
      }
    } catch (error) {
      // No existing submission found, that's okay
      console.log('No existing submission found:', error.message)
      console.log('Check submission error details:', error.response?.data || error)
    }
  }

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch both designs
      const [storefrontResponse, interiorResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/designs/detail/${storefrontDesignId}`, {
          params: { userId: user?.id }
        }),
        axios.get(`${API_BASE_URL}/api/designs/detail/${interiorDesignId}`, {
          params: { userId: user?.id }
        })
      ])

      if (storefrontResponse.data.success && interiorResponse.data.success) {
        console.log('Storefront design data:', storefrontResponse.data.data)
        console.log('Interior design data:', interiorResponse.data.data)
        
        if (storefrontResponse.data.data && interiorResponse.data.data) {
          setStorefrontDesign(storefrontResponse.data.data)
          setInteriorDesign(interiorResponse.data.data)
        } else {
          throw new Error('Design data is empty - designs may not exist or you may not have access to them')
        }
      } else {
        throw new Error('Failed to load designs - API returned unsuccessful response')
      }
    } catch (error) {
      console.error('Fetch designs error:', error)
      setError('Failed to load your selected designs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitEntry = async () => {
    try {
      setSubmitting(true)
      setError(null)

      const response = await axios.post(`${API_BASE_URL}/api/contest/submit`, {
        userId: user.id,
        storefrontDesignId,
        interiorDesignId,
        dealershipName: user.dealershipName,
        sapCode: user.sapCode,
        mobileNumber: user.mobileNumber
      })

      if (response.data.success) {
        setSubmissionData(response.data.data)
      } else {
        throw new Error(response.data.message || 'Submission failed')
      }
    } catch (error) {
      console.error('Submit entry error:', error)
      setError(error.response?.data?.message || error.message || 'Failed to submit contest entry')
    } finally {
      setSubmitting(false)
    }
  }
 

  const designTypes = {
    modern_premium: {
      name: 'Modern Premium',
      icon: '🏢',
      color: 'from-blue-500 to-blue-600'
    },
    trust_heritage: {
      name: 'Trust & Heritage',
      icon: '🏛️',
      color: 'from-amber-500 to-amber-600'
    },
    eco_smart: {
      name: 'Eco Smart',
      icon: '🌿',
      color: 'from-green-500 to-green-600'
    },
    festive: {
      name: 'Festive',
      icon: '🎉',
      color: 'from-purple-500 to-purple-600'
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Preparing Your Contest Entry...
          </h2>
          <p className="text-gray-600">
            Loading your selected designs
          </p>
        </div>
      </div>
    )
  }

  if (error && !submissionData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something Went Wrong
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button onClick={fetchDesigns} className="btn-primary">
              Try Again
            </button>
            <button onClick={() => navigate(-1)} className="btn-secondary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success state after submission
  if (submissionData) {
    return (
      <div className="relative min-h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Fireworks Background Animation - Full Page */}
        {/* <FireworksBackground
          className="fixed inset-10 z-0 pointer-events-none"
          population={10}
          colors={['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#fd79a8', '#fdcb6e', '#6c5ce7', '#a29bfe']}
        /> */}
        
        <div className="relative z-10 min-h-screen flex flex-col">
          <div className="flex-1 max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Success Header */}
        <div className="text-center">

        <h1 className="text-xl font-bold text-gray-900 mb-4">
          JK Lakshmi SKY - DIGITAL BRANDING CONTEST 
        </h1>
        <p className="text-l text-gray-600 mb-6">
          अब सजाइए अपनी दुकान – इस दिवाली सप्ताह पर डिजिटल स्टाइल में! और पाएं इनाम!

        </p>

          
        </div>

        {/* Submission Details */}
        <div className="card p-6 bg-green-50 border-green-200">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contest Entry Submitted Successfully! 🎉
          </h1>
          <p className="text-gray-600">
            Your complete design package has been entered into the JK Lakshmi Contest
          </p>
            </div>
        </div>
          </div>
        </div>
      </div>
    )
  }

  // Main submission page
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          JK Lakshmi SKY - DIGITAL BRANDING CONTEST 
        </h1>
        <p className="text-l text-gray-600 mb-6">
          अब सजाइए अपनी दुकान – इस दिवाली सप्ताह पर डिजिटल स्टाइल में! और पाएं इनाम!

        </p>
      </div>

      {/* Navigation Breadcrumb */}
      

      {/* User Info */}
      <div className="card p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">
          📋 Your Details
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <span className="font-medium">Dealership Name: </span>
            
            {user.dealershipName}
          </div>
          <div>
            <span className="font-medium">SAP Code: </span>
            
            {user.sapCode}
          </div>
          <div>
            <span className="font-medium">Mobile Number: </span>
            
            {user.mobileNumber}
          </div>
        </div>
      </div>

      {/* Selected Designs Preview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Storefront Design */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">
            🏪 Selected Storefront Design
          </h3>
          <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={getImageUrl(storefrontDesign?.filePath)}
              alt="Selected storefront design"
              className="w-full h-full object-cover"
            />
          </div>
           
        </div>

        {/* Interior Design */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">
            🏠 Selected Interior Design
          </h3>
          <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={getImageUrl(interiorDesign?.filePath)}
              alt="Selected interior design"
              className="w-full h-full object-cover"
            />
          </div>
           
        </div>
      </div>

      {/* Submit Section */}
      <div className="card p-6 bg-red-50 border-red-200">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-red-900 mb-3">
            🏆 Submit Your Contest Entry
          </h3>
          <p className="text-sm text-red-700 mb-6">
            By submitting, you agree to participate in the JK Lakshmi Digital Branding Contest.
            Your designs will be evaluated based on creativity, appeal, and social engagement.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
             
            
            <button
              onClick={handleSubmitEntry}
              disabled={submitting}
              className="btn-primary flex items-center space-x-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50"
            >
              <Trophy className="w-5 h-5" />
              <span>
                {submitting ? 'Submitting...' : 'Final Submit'}
              </span>
            </button>
          </div>
        </div>
      </div>
 
    </div>
  )
}

export default FinalSubmissionPage