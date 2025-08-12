'use client'

import QRCode from 'react-qr-code'

interface QRCodeProps {
  value: string
  size?: number
  level?: 'L' | 'M' | 'Q' | 'H'
  className?: string
  id?: string
}

export function QRCodeComponent({ 
  value, 
  size = 256, 
  level = 'M', 
  className = '',
  id
}: QRCodeProps) {
  return (
    <div className={`bg-white p-4 rounded-lg ${className}`} id={id}>
      <QRCode
        value={value}
        size={size}
        level={level}
        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
      />
    </div>
  )
}

export function PrintableQRCode({ 
  value, 
  shareIndex, 
  threshold, 
  total, 
  network,
  date 
}: {
  value: string
  shareIndex: number
  threshold: number
  total: number
  network: string
  date?: string
}) {
  return (
    <div className="print-qr-container bg-white p-8 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Backup Share #{shareIndex + 1}</h1>
        <p className="text-gray-600">
          {threshold} of {total} shares required • {network} network
        </p>
        {date && (
          <p className="text-sm text-gray-500 mt-1">
            Generated: {date}
          </p>
        )}
      </div>
      
      <div className="flex justify-center mb-6">
        <QRCodeComponent 
          value={value} 
          size={300}
          level="H"
          className="shadow-lg"
        />
      </div>
      
      <div className="border-t pt-4">
        <p className="text-xs text-gray-700 font-mono break-all">
          {value}
        </p>
      </div>
      
      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>⚠️ Keep this share secure and private</p>
        <p>Store in a different location from other shares</p>
      </div>
    </div>
  )
}