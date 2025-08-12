'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import { PrintableQRCode } from '@/lib/qr'
import { printPage } from '@/lib/print'

interface PrintPageProps {
  params: Promise<{ index: string }>
}

export default function PrintPage({ params }: PrintPageProps) {
  const searchParams = useSearchParams()
  const resolvedParams = use(params)
  const [shareData, setShareData] = useState<{
    share: string
    index: number
    threshold: number
    total: number
    network: string
    generatedAt: string
  } | null>(null)

  useEffect(() => {
    const sharesParam = searchParams.get('shares')
    const threshold = parseInt(searchParams.get('threshold') || '2')
    const total = parseInt(searchParams.get('total') || '3')
    const network = searchParams.get('network') || 'testnet'
    const generatedAt = searchParams.get('generatedAt') || new Date().toLocaleString()
    const index = parseInt(resolvedParams.index)

    if (sharesParam) {
      try {
        const shares = JSON.parse(decodeURIComponent(sharesParam))
        if (shares[index]) {
          setShareData({
            share: shares[index],
            index,
            threshold,
            total,
            network,
            generatedAt
          })
        }
      } catch (error) {
        console.error('Failed to parse shares:', error)
      }
    }
  }, [searchParams, resolvedParams.index])

  if (!shareData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading share data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* No-print header */}
      <header className="no-print bg-white shadow-sm border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Print Share #{shareData.index + 1}
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={printPage}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      {/* Print content */}
      <div className="print-page flex items-center justify-center p-8">
        <PrintableQRCode
          value={shareData.share}
          shareIndex={shareData.index}
          threshold={shareData.threshold}
          total={shareData.total}
          network={shareData.network}
          date={shareData.generatedAt}
        />
      </div>

      {/* No-print footer with instructions */}
      <footer className="no-print bg-gray-50 border-t p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Printing Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">Before Printing:</h3>
              <ul className="space-y-1">
                <li>• Ensure your printer has sufficient ink/toner</li>
                <li>• Use high-quality paper for durability</li>
                <li>• Test scan the QR code before final printing</li>
                <li>• Consider printing multiple copies</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">After Printing:</h3>
              <ul className="space-y-1">
                <li>• Store in a secure, dry location</li>
                <li>• Keep away from direct sunlight</li>
                <li>• Consider laminating for protection</li>
                <li>• Never share with unauthorized persons</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">
              ⚠️ Security Reminder
            </h3>
            <p className="text-yellow-800">
              This share is part of a {shareData.threshold}-of-{shareData.total} backup system. 
              Store this share separately from other shares. Anyone with {shareData.threshold} 
              or more shares can recover your complete secret.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}