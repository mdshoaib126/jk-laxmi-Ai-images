import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Trophy, CheckCircle, ArrowLeft } from 'lucide-react'
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
                src={`${storefrontDesign.filePath}`}
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
                src={`${interiorDesign.filePath}`}
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
              src={`${storefrontDesign?.filePath}`}
              alt="Selected storefront design"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center space-y-2">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${designTypes[storefrontDesign?.designType]?.color || 'from-gray-500 to-gray-600'} text-white text-sm font-medium`}>
              <span>{designTypes[storefrontDesign?.designType]?.icon || '🎨'}</span>
              <span>{designTypes[storefrontDesign?.designType]?.name || storefrontDesign?.designType}</span>
            </div>
             
          </div>
        </div>

        {/* Interior Design */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">
            🏠 Selected Interior Design
          </h3>
          <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={`${interiorDesign?.filePath}`}
              alt="Selected interior design"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center space-y-2">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${designTypes[interiorDesign?.designType]?.color || 'from-gray-500 to-gray-600'} text-white text-sm font-medium`}>
              <span>{designTypes[interiorDesign?.designType]?.icon || '🎨'}</span>
              <span>{designTypes[interiorDesign?.designType]?.name || interiorDesign?.designType}</span>
            </div>
            
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
 
    </div>
  )
}

export default FinalSubmissionPage