'use client'

import { useState } from 'react'
import { QRCodeComponent } from '@/lib/qr'
import { copyToClipboard, printElement } from '@/lib/print'
import { Network } from '@/lib/shamir'

interface ShareCardProps {
  share: string
  index: number
  threshold: number
  total: number
  network: Network
  onPrintClick?: (index: number) => void
}

export function ShareCard({ 
  share, 
  index, 
  threshold, 
  total, 
  network: _network, 
  onPrintClick 
}: ShareCardProps) {
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await copyToClipboard(share)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = share
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }



  const handlePrint = () => {
    if (onPrintClick) {
      onPrintClick(index)
    } else {
      // Fallback: print the QR element directly
      const qrElement = document.getElementById(`qr-${index}`)
      if (qrElement) {
        printElement(qrElement)
      }
    }
  }

  const truncatedShare = share.length > 60 
    ? `${share.substring(0, 30)}...${share.substring(share.length - 30)}` 
    : share

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Share #{index + 1}
          </h3>
          <p className="text-sm text-gray-500">
            {threshold} of {total} required
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowQR(!showQR)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={showQR ? 'Hide QR code' : 'Show QR code'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showQR ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464a1.001 1.001 0 00-1.414 1.414L9.878 9.878zM12 3c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-.84 1.917m-1.425-.834a3.001 3.001 0 01-4.245-4.245m0 0L9.88 9.878" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {showQR && (
        <div className="mb-4 flex justify-center">
          <QRCodeComponent 
            value={share} 
            size={200}
            className="border shadow-sm"
            id={`qr-${index}`}
          />
        </div>
      )}

      <div className="mb-4">
        <label htmlFor={`share-data-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
          Share Data
        </label>
        <div id={`share-data-${index}`} className="bg-gray-50 p-3 rounded-lg border">
          <code className="text-xs font-mono text-gray-800 break-all">
            {showQR ? share : truncatedShare}
          </code>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          disabled={copied}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
            copied
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>



        <button
          onClick={handlePrint}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>
    </div>
  )
}