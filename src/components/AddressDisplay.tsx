'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { QRCodeComponent } from '@/lib/qr'
import { Network } from '@/lib/shamir'
import { 
  fetchBalance, 
  BalanceData, 
  formatBSV, 
  formatSatoshis, 
  getExplorerURL,
  copyToClipboard 
} from '@/lib/balance'

interface AddressDisplayProps {
  address: string
  publicKey: string
  network: Network
  className?: string
}

export function AddressDisplay({ 
  address, 
  publicKey, 
  network, 
  className = '' 
}: AddressDisplayProps) {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Refresh balance data
  const refreshBalance = useCallback(async () => {
    setBalanceLoading(true)
    setBalanceError(null)
    
    try {
      const balanceData = await fetchBalance(network, address)
      setBalance(balanceData)
      setLastRefresh(new Date())
    } catch (error) {
      setBalanceError(error instanceof Error ? error.message : 'Failed to fetch balance')
    } finally {
      setBalanceLoading(false)
    }
  }, [network, address])

  // Auto-refresh every 25 seconds
  useEffect(() => {
    refreshBalance() // Initial fetch
    
    const interval = setInterval(refreshBalance, 25000)
    return () => clearInterval(interval)
  }, [refreshBalance])

  // Handle address copy
  const handleCopyAddress = async () => {
    try {
      await copyToClipboard(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  // Handle public key copy
  const handleCopyPublicKey = async () => {
    try {
      await copyToClipboard(publicKey)
    } catch (error) {
      console.error('Failed to copy public key:', error)
    }
  }

  const explorerURL = getExplorerURL(network, address)

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
        Your Bitcoin Address
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
            <QRCodeComponent
              value={address}
              size={200}
              level="M"
              className="block"
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Scan QR code to get address
          </p>
        </div>

        {/* Address Info Section */}
        <div className="space-y-4">
          {/* Address */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Address ({network})
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-50 p-3 rounded-lg border font-mono text-sm break-all text-gray-900">
                {address}
              </div>
              <button
                onClick={handleCopyAddress}
                className="flex-shrink-0 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Public Key */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Public Key
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-50 p-3 rounded-lg border font-mono text-sm break-all text-gray-900">
                {publicKey}
              </div>
              <button
                onClick={handleCopyPublicKey}
                className="flex-shrink-0 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Copy public key"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Explorer Link */}
          <div>
            <a
              href={explorerURL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on WhatsOnChain
            </a>
          </div>
        </div>
      </div>

      {/* Balance Section */}
      <div className="mt-6 border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Balance</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshBalance}
              disabled={balanceLoading}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh balance"
            >
              <svg 
                className={`w-4 h-4 ${balanceLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {lastRefresh && (
              <span className="text-xs text-gray-500">
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {balanceLoading && !balance && (
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 mx-auto border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="text-sm text-gray-600 mt-2">Loading balance...</p>
          </div>
        )}

        {balanceError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{balanceError}</p>
          </div>
        )}

        {balance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-green-800">Confirmed</p>
                <p className="text-lg font-bold text-green-900">
                  {formatBSV(balance.confirmedBSV)} BSV
                </p>
                <p className="text-xs text-green-700">
                  {formatSatoshis(balance.confirmedSatoshis)} sats
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-yellow-800">Unconfirmed</p>
                <p className="text-lg font-bold text-yellow-900">
                  {formatBSV(balance.unconfirmedBSV)} BSV
                </p>
                <p className="text-xs text-yellow-700">
                  {formatSatoshis(balance.unconfirmedSatoshis)} sats
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-800">Total</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatBSV(balance.totalBSV)} BSV
                </p>
                <p className="text-xs text-blue-700">
                  {formatSatoshis(balance.totalSatoshis)} sats
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
