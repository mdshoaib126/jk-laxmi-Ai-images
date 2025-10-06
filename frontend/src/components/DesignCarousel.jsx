import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Loading Component with animated gears and rotating messages
const LoadingComponent = () => {
  const [currentMessage, setCurrentMessage] = useState(0)
  const progress = 75 // Fixed at 75%

  const messages = [
    "🧠 AI is analyzing your shopfront architecture...",
    "🎨 Generating modern premium facade designs...", 
    "🏗️ Creating trust & heritage style variations...",
    "🌿 Designing eco-smart sustainable elements...",
    "🎉 Adding festive decorative touches...",
    "✨ Finalizing your beautiful designs..."
  ]

  useEffect(() => {
    // Rotate messages every 3 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length)
    }, 3000)

    return () => {
      clearInterval(messageInterval)
    }
  }, [])

  return (
    <div className="card p-8">
      <div className="text-center max-w-md mx-auto">
        {/* Animated Gears */}
        <div className="relative flex justify-center items-center mb-6">
          {/* Large Center Gear */}
          <div className="relative">
            <svg 
              className="w-16 h-16 text-blue-500 animate-spin-slow" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              style={{ animationDuration: '3s' }}
            >
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
            </svg>
          </div>
          
          {/* Small Top-Right Gear */}
          <div className="absolute -top-2 -right-2">
            <svg 
              className="w-8 h-8 text-green-500 animate-spin" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              style={{ animationDuration: '2s', animationDirection: 'reverse' }}
            >
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
            </svg>
          </div>

          {/* Small Bottom-Left Gear */}
          <div className="absolute -bottom-2 -left-2">
            <svg 
              className="w-6 h-6 text-purple-500 animate-spin" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              style={{ animationDuration: '1.5s' }}
            >
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
            </svg>
          </div>
        </div>

        {/* Setup GIF */}
        <div className="mb-6">
          <img 
            src="/Setup.gif" 
            alt="AI Design Process" 
            className="w-32 h-32 mx-auto rounded-lg shadow-lg"
          />
        </div>

        {/* Main Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Facade Designer at Work
        </h3>

        {/* Rotating Messages */}
        <div className="h-16 flex items-center justify-center mb-6">
          <p 
            key={currentMessage}
            className="text-lg text-gray-700 font-medium animate-fade-in px-4"
          >
            {messages[currentMessage]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full relative animate-pulse"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            This may take a few moments
          </p>
        </div>
      </div>
    </div>
  )
}

// Custom styles for pagination dots and loading animations
const paginationStyle = `
  .swiper-pagination-custom {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .swiper-pagination-custom .swiper-pagination-bullet {
    width: 10px;
    height: 10px;
    background: #d1d5db;
    opacity: 1;
    margin: 0 3px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .swiper-pagination-custom .swiper-pagination-bullet-active {
    background: #ef4444;
    transform: scale(1.2);
  }

  /* Loading Animations */
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }

  @keyframes fade-in {
    0% { 
      opacity: 0; 
      transform: translateY(10px); 
    }
    100% { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-in-out;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`

const DesignCarousel = ({ 
  designs = [], 
  selectedDesign, 
  onSelectDesign,
  loading = false,
  originalImage
}) => {
  const [loadingImages, setLoadingImages] = useState({})

  const designTypes = {
    modern_premium: {
      name: 'Modern Premium',
      description: 'Sleek contemporary design with premium materials',
      icon: '🏢',
      color: 'from-blue-500 to-blue-600'
    },
    trust_heritage: {
      name: 'Trust & Heritage',
      description: 'Classic traditional architecture with warmth',
      icon: '🏛️',
      color: 'from-amber-500 to-amber-600'
    },
    eco_smart: {
      name: 'Eco Smart',
      description: 'Sustainable green building elements',
      icon: '🌿',
      color: 'from-green-500 to-green-600'
    },
    festive: {
      name: 'Festive',
      description: 'Vibrant celebrations and decorations',
      icon: '🎉',
      color: 'from-purple-500 to-purple-600'
    }
  }

  const handleImageLoad = (designId) => {
    setLoadingImages(prev => ({
      ...prev,
      [designId]: false
    }))
  }

  const handleImageError = (designId) => {
    setLoadingImages(prev => ({
      ...prev,
      [designId]: false
    }))
  }

  useEffect(() => {
    // Initialize loading state for all designs
    const initialLoading = {}
    designs.forEach(design => {
      initialLoading[design.designId] = true
    })
    setLoadingImages(initialLoading)
  }, [designs])

  if (loading) {
    return <LoadingComponent />
  }

  if (!designs || designs.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Designs Yet
          </h3>
          <p className="text-gray-600">
            Upload a photo of your shopfront to generate AI-powered facade designs
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <style>{paginationStyle}</style>
      {/* Header */}
      <div className="text-center mb-4">
        {/* <h2 className="text-2xl font-bold text-gray-900 mb-4">
          AI Generated Images
        </h2> */}
      </div>

      {/* Original Image */}
      {originalImage && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Original Photo</h3>
          <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={`${API_BASE_URL}${originalImage}`}
              alt="Original shopfront"
              className="w-full h-full object-cover"
            />
             
          </div>
        </div>
      )}

      {/* Design Carousel */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">AI Generated Photo</h3>
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          navigation={{
            nextEl: '.swiper-button-next-custom',
            prevEl: '.swiper-button-prev-custom',
          }}
          pagination={{ clickable: true, el: '.swiper-pagination-custom' }}
          allowTouchMove={false}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="design-swiper"
        >
          {designs.map((design) => {
            const typeInfo = designTypes[design.designType] || {
              name: design.designType,
              description: 'Custom design',
              icon: '🎨',
              color: 'from-gray-500 to-gray-600'
            }

            const isSelected = selectedDesign?.designId === design.designId
            const isLoading = loadingImages[design.designId]

            return (
              <SwiperSlide key={design.designId}>
                <div
                  className="cursor-pointer mb-4"
                  onClick={() => onSelectDesign(design)}
                >
                  {/* Design Image */}
                  <div className="relative h-64 bg-gray-100 overflow-hidden rounded-lg">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="loading-spinner"></div>
                      </div>
                    )}
                    <img
                      src={`${API_BASE_URL}${design.filePath}`}
                      alt={`${typeInfo.name} design`}
                      className={`w-full h-full object-cover transition-opacity ${
                        isLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                      onLoad={() => handleImageLoad(design.designId)}
                      onError={() => handleImageError(design.designId)}
                    />
                    
                    {/* Download Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const link = document.createElement('a')
                        link.href = `${API_BASE_URL}${design.filePath}`
                        link.download = `${typeInfo.name}_design.png`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-black bg-opacity-60 hover:bg-opacity-80 rounded-full flex items-center justify-center transition-all shadow-lg"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
        
        {/* Custom Small Navigation */}
        <div className="flex justify-center items-center mt-6 space-x-6">
          <button className="swiper-button-prev-custom w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-all shadow-sm">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="swiper-pagination-custom flex justify-center space-x-2"></div>
          <button className="swiper-button-next-custom w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-all shadow-sm">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>




    </div>
  )
}

export default DesignCarousel