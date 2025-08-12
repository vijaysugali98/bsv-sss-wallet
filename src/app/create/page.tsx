'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NkSelector } from '@/components/NkSelector'
import { ShareCard } from '@/components/ShareCard'
import { LocalOnlyNotice } from '@/components/LocalOnlyNotice'
import { PrintShareModal } from '@/components/PrintShareModal'
import { AddressDisplay } from '@/components/AddressDisplay'
import { generateShares, Network, GenerateSharesResult } from '@/lib/shamir'

export default function CreatePage() {
  const [threshold, setThreshold] = useState(2)
  const [total, setTotal] = useState(3)
  const [network, setNetwork] = useState<Network>('testnet')
  const [existingSecret, setExistingSecret] = useState('')
  const [useExisting, setUseExisting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<GenerateSharesResult | null>(null)
  const [generatedAt, setGeneratedAt] = useState('')
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printShareIndex, setPrintShareIndex] = useState(0)

  const handleGenerate = async () => {
    setError('')
    setLoading(true)
    
    try {
      const shares = await generateShares({
        threshold,
        total,
        network,
        existingSecret: useExisting ? existingSecret : undefined
      })
      
      setResult(shares)
      setGeneratedAt(new Date().toLocaleString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
    
    setLoading(false)
  }

  const handlePrintShare = (index: number) => {
    setPrintShareIndex(index)
    setPrintModalOpen(true)
  }

  const handleReset = () => {
    setResult(null)
    setError('')
    setExistingSecret('')
    setUseExisting(false)
    setGeneratedAt('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Create Shares</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/recover"
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Recover Instead
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!result ? (
          /* Configuration Phase */
          <div className="space-y-8">
            {/* Local Only Notice */}
            <LocalOnlyNotice variant="card" />

            {/* Configuration Form */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Configure Your Backup Shares
              </h2>
              
              <div className="space-y-8">
                {/* N/K Selector */}
                <NkSelector
                  threshold={threshold}
                  total={total}
                  network={network}
                  onThresholdChange={setThreshold}
                  onTotalChange={setTotal}
                  onNetworkChange={setNetwork}
                  disabled={loading}
                />

                {/* Existing Secret Option */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="useExisting"
                      checked={useExisting}
                      onChange={(e) => setUseExisting(e.target.checked)}
                      disabled={loading}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="useExisting" className="text-sm font-medium text-gray-900">
                      Use existing secret (advanced)
                    </label>
                  </div>
                  
                  {useExisting && (
                    <div className="pl-7">
                      <label htmlFor="existingSecret" className="block text-sm font-medium text-gray-700 mb-2">
                        Existing Private Key (WIF or Hex)
                      </label>
                      <textarea
                        id="existingSecret"
                        value={existingSecret}
                        onChange={(e) => setExistingSecret(e.target.value)}
                        disabled={loading}
                        placeholder="Enter your existing private key in WIF or hex format..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        rows={3}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        If left empty, a new random key will be generated securely using your browser&apos;s Web Crypto API.
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex">
                      <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Generate Shares
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Results Phase */
          <div className="space-y-8">
            {/* Success Header */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Shares Generated Successfully!
                </h2>
                <p className="text-gray-600 mb-8">
                  Your secret has been split into {total} shares. Any {threshold} can recover your original secret.
                </p>

                <div className="flex justify-center mb-8">
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Create New Shares
                  </button>
                </div>
              </div>
            </div>

            {/* Address Display with QR, Balance, etc. */}
            <AddressDisplay
              address={result.address}
              publicKey={result.publicKey}
              network={network}
            />

            {/* Important Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-amber-600 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    ⚠️ Critical: Save Your Shares Now
                  </h3>
                  <div className="text-amber-800 space-y-2">
                    <p>• <strong>This is your only chance to save these shares.</strong> They cannot be recovered once you leave this page.</p>
                    <p>• <strong>Store each share in a different location</strong> (different people, safety deposit boxes, etc.)</p>
                    <p>• <strong>Print QR codes for easy recovery</strong> and offline storage</p>
                    <p>• <strong>Test recovery</strong> with a subset of shares before storing permanently</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.shares.map((share, index) => (
                <ShareCard
                  key={`share-${index}-${share.substring(0, 8)}`}
                  share={share}
                  index={index}
                  threshold={threshold}
                  total={total}
                  network={network}
                  onPrintClick={handlePrintShare}
                />
              ))}
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Next Steps: Distribute Your Shares Safely
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800">
                <div>
                  <h4 className="font-semibold mb-2">Recommended Distribution:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Give 1 share each to {Math.min(threshold, 2)} trusted family members</li>
                    <li>• Store 1 share in a safe deposit box</li>
                    <li>• Keep 1 share in a home safe (if total {'>'}  threshold)</li>
                    <li>• Consider giving 1 to a trusted lawyer/advisor</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Security Best Practices:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Never store all shares in the same location</li>
                    <li>• Test recovery before final distribution</li>
                    <li>• Tell trustees this is a backup system</li>
                    <li>• Document your threshold requirements</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Share Modal */}
      {result && (
        <PrintShareModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          share={result.shares[printShareIndex] || ''}
          shareIndex={printShareIndex}
          threshold={threshold}
          total={total}
          network={network}
          generatedAt={generatedAt}
          address={result.address}
          publicKey={result.publicKey}
        />
      )}
    </div>
  )
}