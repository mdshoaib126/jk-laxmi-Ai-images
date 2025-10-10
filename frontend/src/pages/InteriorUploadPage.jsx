import React, { useState, useContext, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Home } from 'lucide-react'
import { UserContext } from '../App'
import ImageUploader from '../components/ImageUploader'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jk-lakshmi-api.expm.in'

const InteriorUploadPage = () => {
  const { storefrontDesignId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(UserContext)
  const [uploading, setUploading] = useState(false)
  const [storefrontDesign, setStorefrontDesign] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!storefrontDesignId || !user?.id) {
      navigate('/upload')
      return
    }
    fetchStorefrontDesign()
  }, [storefrontDesignId, user?.id])

  const fetchStorefrontDesign = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/designs/${storefrontDesignId}`)
      
      if (response.data.success) {
        setStorefrontDesign(response.data.data)
      } else {
        throw new Error('Failed to load storefront design')
      }
    } catch (error) {
      console.error('Fetch storefront design error:', error)
      alert('Failed to load storefront design')
      navigate('/upload')
    } finally {
      setLoading(false)
    }
  }

  const handleInteriorUpload = async (formData) => {
    if (!user?.id || !storefrontDesignId) {
      alert('Session error. Please try again.')
      return
    }

    try {
      setUploading(true)

      // Add storefront design ID to form data
      formData.append('storefrontDesignId', storefrontDesignId)
      formData.append('userId', user.id)
      formData.append('uploadType', 'interior')

      const response = await axios.post(`${API_BASE_URL}/api/upload/interior`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        // Navigate to interior preview page
        navigate(`/interior-preview/${response.data.data.uploadId}`)
      } else {
        throw new Error(response.data.message || 'Interior upload failed')
      }
    } catch (error) {
      console.error('Interior upload error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Interior upload failed'
      alert(`Upload failed: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const handleBack = () => {
    navigate(-1) // Go back to previous page
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600">
            Please wait while we load your storefront design
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Interior Photo
        </h1>
        <p className="text-gray-600">
          Now upload a photo of your shop interior to generate matching interior designs
        </p>
      </div>

      {/* Navigation Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <button onClick={() => navigate('/upload')} className="hover:text-gray-700">
          Upload
        </button>
        <span>›</span>
        <button onClick={handleBack} className="hover:text-gray-700">
          Select Storefront
        </button>
        <span>›</span>
        <span className="text-gray-900 font-medium">Interior Upload</span>
        <span>›</span>
        <span className="text-gray-400">Interior Design</span>
        <span>›</span>
        <span className="text-gray-400">Contest Entry</span>
      </div>

      {/* Selected Storefront Design Preview */}
      {storefrontDesign && (
        <div className="card p-6 bg-green-50 border-green-200">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={`${API_BASE_URL}${storefrontDesign.filePath}`}
                  alt="Selected storefront design"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-grow">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-green-900">Selected Storefront Design</h3>
              </div>
              <p className="text-sm text-green-700">
                Great choice! Now let's create matching interior designs for your shop.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interior Upload Instructions */}
      <div className="card p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Home className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              📸 Interior Photo Guidelines
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Upload a clear photo of your shop's interior space</li>
              <li>• Include areas like customer seating, product displays, or service counters</li>
              <li>• Ensure good lighting and avoid blurry images</li>
              <li>• The AI will generate interior designs that match your selected storefront style</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Image Uploader */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏪 Upload Your Interior Photo
        </h3>
        <ImageUploader
          onUpload={handleInteriorUpload}
          uploading={uploading}
          acceptedFileTypes="image/*"
          maxFileSize={10}
          uploadButtonText="Generate Interior Designs"
          uploadingText="Uploading Interior Photo..."
        />
      </div>

      {/* Back Button */}
      <div className="flex justify-center">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Storefront Selection</span>
        </button>
      </div>

      {/* Tips for Interior Photos */}
      <div className="card p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">💡 Pro Tips for Interior Photos</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Best Photo Angles:</h4>
            <ul className="space-y-1">
              <li>• Wide-angle shots of main areas</li>
              <li>• Include key furniture and fixtures</li>
              <li>• Natural lighting works best</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">What Gets Enhanced:</h4>
            <ul className="space-y-1">
              <li>• Wall colors and textures</li>
              <li>• Furniture arrangement</li>
              <li>• Lighting and ambiance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InteriorUploadPage