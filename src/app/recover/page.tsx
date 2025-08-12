'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QrScannerModal } from '@/components/QrScannerModal'
import { LocalOnlyNotice } from '@/components/LocalOnlyNotice'
import { AddressDisplay } from '@/components/AddressDisplay'
import { TransferPanel } from '@/components/TransferPanel'
import { recoverFromShares, Network, RecoverFromSharesResult, validateShareFormat } from '@/lib/shamir'

interface ShareInput {
  id: number
  value: string
  isValid: boolean
}

export default function RecoverPage() {
  const [shares, setShares] = useState<ShareInput[]>([
    { id: 1, value: '', isValid: false },
    { id: 2, value: '', isValid: false }
  ])
  const [threshold, setThreshold] = useState(2)
  const [network, setNetwork] = useState<Network>('testnet')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<RecoverFromSharesResult | null>(null)
  const [usedShares, setUsedShares] = useState<string[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [activeShareId, setActiveShareId] = useState<number | null>(null)

  const validSharesCount = shares.filter(share => share.value && share.isValid).length
  const canRecover = validSharesCount >= threshold && !loading

  const handleShareChange = (id: number, value: string) => {
    setShares(prev => prev.map(share => 
      share.id === id 
        ? { ...share, value, isValid: validateShareFormat(value) }
        : share
    ))
    setError('')
    setResult(null)
  }

  const handleScanShare = (shareId: number) => {
    setActiveShareId(shareId)
    setShowScanner(true)
  }

  const handleScanResult = (scannedValue: string) => {
    if (activeShareId) {
      handleShareChange(activeShareId, scannedValue)
    }
    setShowScanner(false)
    setActiveShareId(null)
  }

  const addShareInput = () => {
    const nextId = Math.max(...shares.map(s => s.id)) + 1
    setShares(prev => [...prev, { id: nextId, value: '', isValid: false }])
  }

  const removeShareInput = (id: number) => {
    if (shares.length > 2) {
      setShares(prev => prev.filter(share => share.id !== id))
    }
  }

  const handleRecover = async () => {
    setError('')
    setLoading(true)
    
    try {
      const validShares = shares
        .filter(share => share.value && share.isValid)
        .map(share => share.value)

      const recovered = recoverFromShares({
        shares: validShares,
        threshold,
        network
      })
      
      setResult(recovered)
      setUsedShares(validShares)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recover from shares')
    }
    
    setLoading(false)
  }

  const handleReset = () => {
    setResult(null)
    setUsedShares([])
    setError('')
    setShares([
      { id: 1, value: '', isValid: false },
      { id: 2, value: '', isValid: false }
    ])
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
              <h1 className="text-2xl font-bold text-gray-900">Recover Secret</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/create"
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Create Shares Instead
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!result ? (
          /* Recovery Phase */
          <div className="space-y-8">
            {/* Local Only Notice */}
            <LocalOnlyNotice variant='card' />

            {/* Recovery Form */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Enter Your Backup Shares
              </h2>
              
              <div className="space-y-6">
                {/* Threshold and Network */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-1">
                      Required Shares (Threshold)
                    </label>
                    <input
                      type="number"
                      id="threshold"
                      min="1"
                      max="10"
                      value={threshold}
                      onChange={(e) => setThreshold(parseInt(e.target.value) || 1)}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="network" className="block text-sm font-medium text-gray-700 mb-1">
                      Network
                    </label>
                    <select
                      id="network"
                      value={network}
                      onChange={(e) => setNetwork(e.target.value as Network)}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="mainnet">Mainnet</option>
                      <option value="testnet">Testnet</option>
                    </select>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Progress: {validSharesCount} of {threshold} required shares
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      canRecover 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {canRecover ? 'Ready to recover' : `Need ${threshold - validSharesCount} more`}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, (validSharesCount / threshold) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Share Inputs */}
                <div className="space-y-4">
                  {shares.map((share, index) => (
                    <div key={share.id} className="border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">
                          Share #{index + 1}
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleScanShare(share.id)}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12l4-4M12 12l4 4" />
                            </svg>
                            Scan QR
                          </button>
                          {shares.length > 2 && (
                            <button
                              onClick={() => removeShareInput(share.id)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-700 transition-colors"
                              aria-label="Remove share input"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <textarea
                        value={share.value}
                        onChange={(e) => handleShareChange(share.id, e.target.value)}
                        disabled={loading}
                        placeholder="Paste share string here or scan QR code..."
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                          share.value && !share.isValid ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        rows={3}
                      />
                      
                      {share.value && (
                        <div className={`mt-2 flex items-center text-xs ${
                          share.isValid ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            {share.isValid ? (
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            )}
                          </svg>
                          {share.isValid ? 'Valid share format' : 'Invalid share format'}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Share Button */}
                  <button
                    onClick={addShareInput}
                    disabled={loading || shares.length >= 10}
                    className="w-full py-2 text-sm font-medium text-blue-600 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
                  >
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Another Share
                  </button>
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

                {/* Recover Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleRecover}
                    disabled={!canRecover}
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Recovering...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recover Secret
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Success Phase */
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
                  Secret Recovered Successfully!
                </h2>
                <p className="text-gray-600 mb-8">
                  Your secret has been reconstructed from {validSharesCount} shares.
                </p>

                <div className="flex justify-center">
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Recover Another Secret
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

            {/* Transfer Panel */}
            <TransferPanel
              privateKey={result.privateKey}
              network={network}
              threshold={threshold}
              shares={usedShares}
            />

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-amber-600 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    🔒 Your Secret is Recovered
                  </h3>
                  <div className="text-amber-800 space-y-2">
                    <p>• Your private key is now reconstructed and can be used to access funds at the address shown above</p>
                    <p>• This recovery session is local-only and will be cleared when you leave this page</p>
                    <p>• Consider creating new backup shares if you suspect any of the used shares may be compromised</p>
                    <p>• The private key object is available in memory but never logged or transmitted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={showScanner}
        onClose={() => {
          setShowScanner(false)
          setActiveShareId(null)
        }}
        onScan={handleScanResult}
        title="Scan Share QR Code"
      />
    </div>
  )
}