import React, { useState, useRef, useEffect } from 'react'

const BeforeAfterSlider = ({ 
  beforeImage, 
  afterImage, 
  beforeLabel = "Before", 
  afterLabel = "After" 
}) => {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)

  const handleMouseDown = (e) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const position = ((e.clientX - rect.left) / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, position)))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleTouchMove = (e) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const position = ((touch.clientX - rect.left) / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, position)))
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e)
    const handleGlobalMouseUp = () => handleMouseUp()
    const handleGlobalTouchMove = (e) => handleTouchMove(e)
    const handleGlobalTouchEnd = () => handleTouchEnd()

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
      document.addEventListener('touchend', handleGlobalTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [isDragging])

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Compare Your Transformation
        </h3>
        <p className="text-sm text-gray-600">
          Drag the slider to see the difference
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-64 md:h-80 overflow-hidden rounded-lg cursor-ew-resize select-none"
        style={{ 
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        {/* Before Image (Background) */}
        <div className="absolute inset-0">
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Before Label */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-medium">
            {beforeLabel}
          </div>
        </div>

        {/* After Image (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: `polygon(${sliderPosition}% 0%, 100% 0%, 100% 100%, ${sliderPosition}% 100%)`
          }}
        >
          <img
            src={afterImage}
            alt={afterLabel}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* After Label */}
          <div 
            className="absolute top-4 right-4 bg-red-500 bg-opacity-90 text-white px-3 py-1 rounded-full text-sm font-medium"
            style={{
              opacity: sliderPosition > 80 ? 1 : 0,
              transition: 'opacity 0.2s ease'
            }}
          >
            {afterLabel}
          </div>
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Slider Handle */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-red-500 cursor-ew-resize flex items-center justify-center z-20"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-4 bg-red-500 rounded"></div>
              <div className="w-0.5 h-4 bg-red-500 rounded"></div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        {sliderPosition === 50 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm animate-pulse">
            ← Drag to compare →
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-sm">
        <div className={`flex items-center space-x-2 transition-opacity ${sliderPosition < 50 ? 'opacity-100' : 'opacity-60'}`}>
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span className="text-gray-600">{beforeLabel}</span>
        </div>
        <div className="flex-1 mx-4">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-red-500 h-1 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${sliderPosition}%` }}
            ></div>
          </div>
        </div>
        <div className={`flex items-center space-x-2 transition-opacity ${sliderPosition > 50 ? 'opacity-100' : 'opacity-60'}`}>
          <span className="text-gray-600">{afterLabel}</span>
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setSliderPosition(0)}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Show {beforeLabel}
        </button>
        <button
          onClick={() => setSliderPosition(50)}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Split View
        </button>
        <button
          onClick={() => setSliderPosition(100)}
          className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Show {afterLabel}
        </button>
      </div>
    </div>
  )
}

export default BeforeAfterSlider