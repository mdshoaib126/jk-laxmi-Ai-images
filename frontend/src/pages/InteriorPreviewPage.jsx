import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react'
import { UserContext } from '../App'
import DesignCarousel from '../components/DesignCarousel'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const InteriorPreviewPage = () => {
  const { uploadId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(UserContext)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [interiorDesigns, setInteriorDesigns] = useState([])
  const [selectedInteriorDesign, setSelectedInteriorDesign] = useState(null)
  const [interiorImage, setInteriorImage] = useState(null)
  const [storefrontDesign, setStorefrontDesign] = useState(null)
  const [error, setError] = useState(null)
  const [generationProgress, setGenerationProgress] = useState(0)

  useEffect(() => {
    if (!uploadId || !user?.id) {
      navigate('/upload')
      return
    }

    fetchInteriorDesigns()
  }, [uploadId, user?.id])

  const fetchInteriorDesigns = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get interior designs for this upload
      const response = await axios.get(
        `${API_BASE_URL}/api/designs/interior/${user.id}?uploadId=${uploadId}`
      )

      if (response.data.success && response.data.data.length > 0) {
        const uploadData = response.data.data[0]
        setInteriorImage(uploadData.originalImage.filePath)
        setInteriorDesigns(uploadData.designs)
        setStorefrontDesign(uploadData.storefrontDesign)
        
        // Auto-select first design if none selected
        if (uploadData.designs.length > 0 && !selectedInteriorDesign) {
          setSelectedInteriorDesign(uploadData.designs.find(d => d.isSelected) || uploadData.designs[0])
        }
      } else {
        // No designs exist, trigger generation
        await generateInteriorDesigns()
      }
    } catch (error) {
      console.error('Fetch interior designs error:', error)
      setError('Failed to load interior designs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateInteriorDesigns = async () => {
    try {
      setGenerating(true)
      setGenerationProgress(0)
      setError(null)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await axios.post(`${API_BASE_URL}/api/generate/interior`, {
        uploadId,
        userId: user.id,
        designTypes: ['modern_premium', 'trust_heritage', 'eco_smart', 'festive'] // Interior versions
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      if (response.data.success) {
        setInteriorDesigns(response.data.data.generatedDesigns)
        setInteriorImage(response.data.data.originalImage)
        setStorefrontDesign(response.data.data.storefrontDesign)
        
        // Auto-select first design
        if (response.data.data.generatedDesigns.length > 0) {
          setSelectedInteriorDesign(response.data.data.generatedDesigns[0])
        }
      } else {
        throw new Error(response.data.message || 'Interior generation failed')
      }
    } catch (error) {
      console.error('Interior generation error:', error)
      setError(error.response?.data?.message || error.message || 'Failed to generate interior designs')
    } finally {
      setGenerating(false)
      setGenerationProgress(0)
    }
  }

  const handleSelectInteriorDesign = async (design) => {
    try {
      setSelectedInteriorDesign(design)
      
      // Update selection on backend
      await axios.put(`${API_BASE_URL}/api/designs/interior/${design.designId}/select`, {
        userId: user.id
      })
    } catch (error) {
      console.error('Select interior design error:', error)
      // Still update UI even if backend call fails
    }
  }

  const handleRegenerateDesigns = async () => {
    if (window.confirm('This will generate new interior designs. Continue?')) {
      await generateInteriorDesigns()
    }
  }

  const handleFinalSubmission = () => {
    if (selectedInteriorDesign && storefrontDesign) {
      navigate(`/final-submission/${storefrontDesign.designId}/${selectedInteriorDesign.designId}`)
    }
  }

  const handleBack = () => {
    navigate(-1) // Go back to interior upload
  }

  if (loading && !generating) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Your Interior Designs...
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch your interior designs
          </p>
        </div>
      </div>
    )
  }

  if (error && !generating) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something Went Wrong
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button onClick={fetchInteriorDesigns} className="btn-primary">
              Try Again
            </button>
            <button onClick={handleBack} className="btn-secondary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

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

       

      {/* Design Carousel */}
      <DesignCarousel
        designs={interiorDesigns}
        selectedDesign={selectedInteriorDesign}
        onSelectDesign={handleSelectInteriorDesign}
        loading={generating}
        originalImage={interiorImage}
      />

      {/* Action Buttons */}
      {interiorDesigns.length > 0 && (
        <div className="card p-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-gray-900 mb-1">
                Ready to Complete Your Contest?
              </h3>
              <p className="text-sm text-gray-600">
                Select your interior design and submit your complete entry
              </p>
            </div>
            
            <div className="flex flex-row space-x-4 justify-center">
              {/* <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Interior Upload</span>
              </button>
              
              <button
                onClick={handleRegenerateDesigns}
                disabled={generating}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                <span>Generate New Designs</span>
              </button> */}
              
              {selectedInteriorDesign && (
                <button
                  onClick={handleFinalSubmission}
                  className="btn-primary flex items-center space-x-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg"
                >
                  <span>Continue to Final Submit </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
 
    </div>
  )
}

export default InteriorPreviewPage