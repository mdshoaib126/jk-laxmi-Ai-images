import React, { useState, useContext, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Home } from 'lucide-react'
import { UserContext } from '../App'
import ImageUploader from '../components/ImageUploader'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

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
      alert('Session error. Please complete storefront selection first.')
      navigate('/upload')
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
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          JK Lakshmi SKY - DIGITAL BRANDING CONTEST 
        </h1>
        <p className="text-l text-gray-600 mb-6">
          अब सजाइए अपनी दुकान – इस दिवाली सप्ताह पर डिजिटल स्टाइल में! और पाएं इनाम!

        </p>
      </div>

       

       

       

      {/* Image Uploader */}
      <ImageUploader
          onUpload={handleInteriorUpload}
          uploading={uploading}
          acceptedFileTypes="image/*"
          maxFileSize={10}
          uploadButtonText="Generate Interior Designs"
          uploadingText="Uploading Interior Photo..."
          uploadheadingText="Upload Your Interior Photo"
          uploadDescriptionText="Choose how you'd like to add your interior space image"
          photoTips={[
            "Capture a clear view of your interior space",
            "Include multiple angles for best results",
            "Ensure good natural or artificial lighting",
            "Show the room layout and key features",
            "Avoid cluttered or messy areas"
          ]}
        />
       
    </div>
  )
}

export default InteriorUploadPage