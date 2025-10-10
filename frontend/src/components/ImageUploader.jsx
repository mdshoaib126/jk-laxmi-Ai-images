import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Upload, RotateCcw, X } from 'lucide-react'

const ImageUploader = ({ onUpload, loading = false, userId }) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploadMethod, setUploadMethod] = useState('file') // 'file' or 'camera'
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [stream, setStream] = useState(null)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Start camera when showCamera becomes true
  useEffect(() => {
    if (showCamera && !capturedImage) {
      startCamera()
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [showCamera, capturedImage])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP)')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    // Create form data
    const formData = new FormData()
    formData.append('image', file)
    if (userId) {
      formData.append('userId', userId)
    }

    try {
      await onUpload(formData)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    }
  }, [onUpload, userId])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileSelect = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Camera access error:', error)
      alert('Camera access denied. Please allow camera permissions.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageSrc = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageSrc)
      stopCamera()
    }
  }, [stopCamera])

  const uploadCapturedImage = useCallback(async () => {
    if (!capturedImage) return

    // Convert base64 to blob
    const response = await fetch(capturedImage)
    const blob = await response.blob()
    
    // Create file from blob
    const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
      type: 'image/jpeg'
    })

    const formData = new FormData()
    formData.append('image', file)
    if (userId) {
      formData.append('userId', userId)
    }

    try {
      await onUpload(formData)
      setCapturedImage(null)
      setShowCamera(false)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload captured image. Please try again.')
    }
  }, [capturedImage, onUpload, userId])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    startCamera()
  }, [startCamera])

  if (showCamera) {
    return (
      <div className="card p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Capture Your Shopfront
          </h3>
          <p className="text-sm text-gray-600">
            Position your shop facade in the frame and take a photo
          </p>
        </div>

        {!capturedImage ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover rounded-lg"
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={capture}
                disabled={loading}
                className="btn-primary"
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Capture Photo
              </button>
              <button
                onClick={() => {
                  stopCamera()
                  setShowCamera(false)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={uploadCapturedImage}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  '✓ Use This Photo'
                )}
              </button>
              <button
                onClick={retakePhoto}
                disabled={loading}
                className="btn-secondary flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card p-4">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Upload Your Shopfront Photo
        </h2>
        <p className="text-gray-600">
          Choose how you'd like to add your shop's current facade image
        </p>
      </div>

      <div className="mt-2 mb-4 p-1 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📋 Photo Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>Capture the full front view of your shop</li>
          <li>Ensure good lighting (avoid shadows)</li>
          <li>Keep the camera steady and level</li>
          <li>Include any existing signage or branding</li>
        </ul>
      </div>

      {/* Upload Method Selection */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setUploadMethod('file')}
          className={`px-4 py-2 rounded-lg border-2 transition-all ${
            uploadMethod === 'file'
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Upload File
        </button>
        <button
          onClick={() => setUploadMethod('camera')}
          className={`px-4 py-2 rounded-lg border-2 transition-all ${
            uploadMethod === 'camera'
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
          }`}
        >
          <Camera className="w-4 h-4 inline mr-2" />
          Take Photo
        </button>
      </div>

      {uploadMethod === 'file' ? (
        <div
          className={`upload-area ${dragActive ? 'dragover' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={loading}
          />
          
          <div className="space-y-4">
            <div className="text-6xl">🏪</div>
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your image here, or click to browse
              </p>
              <p className="text-sm text-gray-600">
                Supports JPEG, PNG, and WebP (max 10MB)
              </p>
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <div className="loading-spinner mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="text-6xl mb-4">📱</div>
          <p className="text-lg font-medium text-gray-900 mb-4">
            Use Your Device Camera
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Take a photo of your shopfront directly with your device camera
          </p>
          <button
            onClick={() => setShowCamera(true)}
            disabled={loading}
            className="btn-primary"
          >
            📸 Open Camera
          </button>
        </div>
      )}

      
    </div>
  )
}

export default ImageUploader