'use client'

import { useState, useEffect, useRef } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'

interface QrScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (result: string) => void
  title?: string
}

export function QrScannerModal({ 
  isOpen, 
  onClose, 
  onScan, 
  title = 'Scan QR Code' 
}: QrScannerModalProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserQRCodeReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isOpen) {
      initializeScanner()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedDevice && scanning) {
      startScanning(selectedDevice)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice, scanning])

  const initializeScanner = async () => {
    try {
      setError(null)
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop()) // Stop the test stream
      
      // Get available video devices
      const videoDevices = await BrowserQRCodeReader.listVideoInputDevices()
      setDevices(videoDevices)
      
      if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId)
        setScanning(true)
      } else {
        setError('No camera devices found')
      }
    } catch (err) {
      console.error('Scanner initialization error:', err)
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access and try again.')
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Failed to access camera. Please check permissions.')
      }
    }
  }

  const startScanning = async (deviceId: string) => {
    if (!videoRef.current) return

    try {
      setError(null)
      readerRef.current = new BrowserQRCodeReader()
      
      const result = await readerRef.current.decodeOnceFromVideoDevice(
        deviceId,
        videoRef.current
      )

      if (result) {
        onScan(result.getText())
        handleClose()
      }
    } catch (err) {
      console.error('Scanning error:', err)
      if (err instanceof Error && !err.message.includes('No MultiFormat Readers')) {
        setError(`Scanning failed: ${err.message}`)
      }
      // Continue scanning even if one attempt fails
      setTimeout(() => {
        if (scanning && videoRef.current) {
          startScanning(deviceId)
        }
      }, 1000)
    }
  }

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const handleClose = () => {
    stopScanning()
    setError(null)
    onClose()
  }

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close scanner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 text-red-500">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={initializeScanner}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {devices.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camera
                  </label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${devices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Position the QR code within the frame to scan
                </p>
                {scanning && (
                  <div className="flex items-center justify-center mt-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    <span className="text-sm text-blue-600">Scanning...</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}