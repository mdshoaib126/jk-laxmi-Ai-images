import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Share2, Download, Trophy, CheckCircle, ArrowLeft } from 'lucide-react'
import { UserContext } from '../App'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jk-lakshmi-api.expm.in'

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
  }, [storefrontDesignId, interiorDesignId, user?.id])

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch both designs
      const [storefrontResponse, interiorResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/designs/${storefrontDesignId}`),
        axios.get(`${API_BASE_URL}/api/designs/${interiorDesignId}`)
      ])

      if (storefrontResponse.data.success && interiorResponse.data.success) {
        setStorefrontDesign(storefrontResponse.data.data)
        setInteriorDesign(interiorResponse.data.data)
      } else {
        throw new Error('Failed to load designs')
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

  const handleShare = (designType) => {
    const design = designType === 'storefront' ? storefrontDesign : interiorDesign
    if (design) {
      navigate(`/share/${design.designId}`)
    }
  }

  const handleDownloadBoth = () => {
    if (storefrontDesign && interiorDesign) {
      // Download storefront design
      const storefrontLink = document.createElement('a')
      storefrontLink.href = `${API_BASE_URL}${storefrontDesign.filePath}`
      storefrontLink.download = `${user.dealershipName}_Storefront_Design.png`
      document.body.appendChild(storefrontLink)
      storefrontLink.click()
      document.body.removeChild(storefrontLink)

      // Download interior design after a short delay
      setTimeout(() => {
        const interiorLink = document.createElement('a')
        interiorLink.href = `${API_BASE_URL}${interiorDesign.filePath}`
        interiorLink.download = `${user.dealershipName}_Interior_Design.png`
        document.body.appendChild(interiorLink)
        interiorLink.click()
        document.body.removeChild(interiorLink)
      }, 500)
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Success Header */}
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

        {/* Submission Details */}
        <div className="card p-6 bg-green-50 border-green-200">
          <div className="text-center">
            <h3 className="font-semibold text-green-900 mb-2">
              Submission ID: {submissionData.submissionId}
            </h3>
            <p className="text-sm text-green-700 mb-4">
              Save this ID for your records and tracking
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Dealership:</span>
                <br />
                {user.dealershipName}
              </div>
              <div>
                <span className="font-medium">SAP Code:</span>
                <br />
                {user.sapCode}
              </div>
              <div>
                <span className="font-medium">Submitted:</span>
                <br />
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Design Preview */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">Storefront Design</h3>
            <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden mb-3">
              <img
                src={`${API_BASE_URL}${storefrontDesign.filePath}`}
                alt="Selected storefront design"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${designTypes[storefrontDesign.designType]?.color || 'from-gray-500 to-gray-600'} text-white text-sm font-medium`}>
                <span>{designTypes[storefrontDesign.designType]?.icon || '🎨'}</span>
                <span>{designTypes[storefrontDesign.designType]?.name || storefrontDesign.designType}</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">Interior Design</h3>
            <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden mb-3">
              <img
                src={`${API_BASE_URL}${interiorDesign.filePath}`}
                alt="Selected interior design"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${designTypes[interiorDesign.designType]?.color || 'from-gray-500 to-gray-600'} text-white text-sm font-medium`}>
                <span>{designTypes[interiorDesign.designType]?.icon || '🎨'}</span>
                <span>{designTypes[interiorDesign.designType]?.name || interiorDesign.designType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-gray-900 mb-1">
                Ready to Share Your Designs?
              </h3>
              <p className="text-sm text-gray-600">
                Download and share your designs to maximize your contest chances
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleDownloadBoth}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all"
              >
                <Download className="w-5 h-5" />
                <span>Download Both Designs</span>
              </button>
              
              <button
                onClick={() => handleShare('storefront')}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
              >
                <Share2 className="w-5 h-5" />
                <span>Share Designs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="card p-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            What Happens Next?
          </h3>
          <div className="text-sm text-yellow-800 space-y-2">
            <p>• Your entry is now part of the JK Lakshmi Digital Branding Contest</p>
            <p>• Share your designs on social media to increase visibility</p>
            <p>• Contest winners will be announced based on design quality and social engagement</p>
            <p>• Keep an eye on our official channels for updates and results</p>
          </div>
        </div>

        {/* New Entry Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center space-x-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all mx-auto"
          >
            <span>Create New Entry</span>
          </button>
        </div>
      </div>
    )
  }

  // Main submission page
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Complete Your Contest Entry
        </h1>
        <p className="text-gray-600">
          Review your selected designs and submit your entry to the JK Lakshmi Contest
        </p>
      </div>

      {/* Navigation Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <button onClick={() => navigate('/upload')} className="hover:text-gray-700">
          Upload
        </button>
        <span>›</span>
        <span className="text-gray-500">Select Storefront</span>
        <span>›</span>
        <span className="text-gray-500">Interior Upload</span>
        <span>›</span>
        <span className="text-gray-500">Interior Design</span>
        <span>›</span>
        <span className="text-gray-900 font-medium">Contest Entry</span>
      </div>

      {/* User Info */}
      <div className="card p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">
          📋 Contest Entry Details
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <span className="font-medium">Dealership Name:</span>
            <br />
            {user.dealershipName}
          </div>
          <div>
            <span className="font-medium">SAP Code:</span>
            <br />
            {user.sapCode}
          </div>
          <div>
            <span className="font-medium">Mobile Number:</span>
            <br />
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
              src={`${API_BASE_URL}${storefrontDesign?.filePath}`}
              alt="Selected storefront design"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center space-y-2">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${designTypes[storefrontDesign?.designType]?.color || 'from-gray-500 to-gray-600'} text-white text-sm font-medium`}>
              <span>{designTypes[storefrontDesign?.designType]?.icon || '🎨'}</span>
              <span>{designTypes[storefrontDesign?.designType]?.name || storefrontDesign?.designType}</span>
            </div>
            <button
              onClick={() => handleShare('storefront')}
              className="block w-full mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              Preview & Share
            </button>
          </div>
        </div>

        {/* Interior Design */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">
            🏠 Selected Interior Design
          </h3>
          <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={`${API_BASE_URL}${interiorDesign?.filePath}`}
              alt="Selected interior design"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center space-y-2">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${designTypes[interiorDesign?.designType]?.color || 'from-gray-500 to-gray-600'} text-white text-sm font-medium`}>
              <span>{designTypes[interiorDesign?.designType]?.icon || '🎨'}</span>
              <span>{designTypes[interiorDesign?.designType]?.name || interiorDesign?.designType}</span>
            </div>
            <button
              onClick={() => handleShare('interior')}
              className="block w-full mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              Preview & Share
            </button>
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
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>
            
            <button
              onClick={handleSubmitEntry}
              disabled={submitting}
              className="flex items-center space-x-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50"
            >
              <Trophy className="w-5 h-5" />
              <span>
                {submitting ? 'Submitting...' : 'Submit Contest Entry'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Contest Terms */}
      <div className="card p-6 bg-gray-50 border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">📜 Contest Terms</h3>
        <div className="text-xs text-gray-600 space-y-2">
          <p>• This contest is organized by JK Lakshmi Cement for dealers and their customers</p>
          <p>• Submitted designs may be used by JK Lakshmi for promotional purposes</p>
          <p>• Winners will be selected based on design quality, creativity, and social media engagement</p>
          <p>• Contest results and prizes will be announced on official JK Lakshmi channels</p>
          <p>• Participants must ensure they have rights to the uploaded images</p>
        </div>
      </div>
    </div>
  )
}

export default FinalSubmissionPage