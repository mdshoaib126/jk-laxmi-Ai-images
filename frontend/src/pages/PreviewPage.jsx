import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { RefreshCw, ArrowRight } from 'lucide-react'
import { UserContext } from '../App'
import DesignCarousel from '../components/DesignCarousel'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jk-lakshmi-api.expm.in'

const PreviewPage = () => {
  const { uploadId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(UserContext)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [designs, setDesigns] = useState([])
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [originalImage, setOriginalImage] = useState(null)
  const [error, setError] = useState(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('storefront') // 'storefront', 'interior', 'completed'

  useEffect(() => {
    if (!uploadId || !user?.id) {
      navigate('/upload')
      return
    }

    fetchDesigns()
  }, [uploadId, user?.id])

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      setError(null)

      // First, get existing designs
      const designsResponse = await axios.get(
        `${API_BASE_URL}/api/designs/${user.id}?uploadId=${uploadId}`
      )

      if (designsResponse.data.success && designsResponse.data.data.length > 0) {
        const uploadData = designsResponse.data.data[0]
        setOriginalImage(uploadData.originalImage.filePath)
        setDesigns(uploadData.designs)
        
        // Auto-select first design if none selected
        if (uploadData.designs.length > 0 && !selectedDesign) {
          setSelectedDesign(uploadData.designs.find(d => d.isSelected) || uploadData.designs[0])
        }
      } else {
        // No designs exist, trigger generation
        await generateDesigns()
      }
    } catch (error) {
      console.error('Fetch designs error:', error)
      setError('Failed to load designs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateDesigns = async () => {
    try {
      setGenerating(true)
      setGenerationProgress(0)
      setError(null)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await axios.post(`${API_BASE_URL}/api/generate`, {
        uploadId,
        userId: user.id,
        designTypes: ['modern_premium', 'trust_heritage', 'eco_smart', 'festive']
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      if (response.data.success) {
        setDesigns(response.data.data.generatedDesigns)
        setOriginalImage(response.data.data.originalImage)
        
        // Auto-select first design
        if (response.data.data.generatedDesigns.length > 0) {
          setSelectedDesign(response.data.data.generatedDesigns[0])
        }
      } else {
        throw new Error(response.data.message || 'Generation failed')
      }
    } catch (error) {
      console.error('Generation error:', error)
      setError(error.response?.data?.message || error.message || 'Failed to generate designs')
    } finally {
      setGenerating(false)
      setGenerationProgress(0)
    }
  }

  const handleSelectDesign = async (design) => {
    try {
      setSelectedDesign(design)
      
      // Update selection on backend
      await axios.put(`${API_BASE_URL}/api/designs/${design.designId}/select`, {
        userId: user.id
      })
    } catch (error) {
      console.error('Select design error:', error)
      // Still update UI even if backend call fails
    }
  }

  const handleRegenerateDesigns = async () => {
    if (window.confirm('This will generate new designs. Continue?')) {
      await generateDesigns()
    }
  }

  const handleNext = () => {
    if (selectedDesign) {
      // Navigate to interior upload with selected storefront design
      navigate(`/interior-upload/${selectedDesign.designId}`)
    }
  }

  if (loading && !generating) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Your Designs...
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch your facade designs
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
            <button onClick={fetchDesigns} className="btn-primary">
              Try Again
            </button>
            <button onClick={() => navigate('/upload')} className="btn-secondary">
              Upload New Photo
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Storefront Design
        </h1>
        <p className="text-gray-600">
          Select your favorite storefront design to continue with interior design
        </p>
      </div>

      {/* Navigation Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <button onClick={() => navigate('/upload')} className="hover:text-gray-700">
          Upload
        </button>
        <span>›</span>
        <span className="text-gray-900 font-medium">Select Storefront</span>
        <span>›</span>
        <span className="text-gray-400">Interior Design</span>
        <span>›</span>
        <span className="text-gray-400">Contest Entry</span>
      </div>

      {/* Design Carousel */}
      <DesignCarousel
        designs={designs}
        selectedDesign={selectedDesign}
        onSelectDesign={handleSelectDesign}
        loading={generating}
        originalImage={originalImage}
      />



      {/* Action Buttons */}
      {designs.length > 0 && (
        <div className="card p-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-gray-900 mb-1">
                Selected Your Favorite Storefront?
              </h3>
              <p className="text-sm text-gray-600">
                Choose a design and proceed to interior design selection
              </p>
            </div>
            
            <div className="flex flex-row space-x-4 justify-center">
              <button
                onClick={handleRegenerateDesigns}
                disabled={generating}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                <span>Generate New Designs</span>
              </button>
              
              {selectedDesign && (
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all shadow-lg"
                >
                  <span>Continue to Interior</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Design Details */}
       

      {/* Tips for Better Results */}
      <div className="card p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">💡 Pro Tips</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
           
          <div>
            <h4 className="font-medium mb-2">Contest Tips:</h4>
            <ul className="space-y-1">
              <li>Share on multiple platforms</li>
              <li>Use relevant hashtags</li>
              <li>Tag friends and JK Lakshmi</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewPage