'use client'

import React, { useState, useEffect } from 'react'
import { PrivateKey } from '@bsv/sdk'
import { Network } from '@/lib/shamir'
import { 
  transfer, 
  TransferResult, 
  getFeeRates,
  calculateFee,
  getUTXOsForAddress 
} from '@/lib/transfer'
import { 
  bsvToSatoshis, 
  formatBSV, 
  formatSatoshis, 
  getTxExplorerURL,
  fetchBalance,
  copyToClipboard 
} from '@/lib/balance'

interface TransferPanelProps {
  privateKey: PrivateKey
  network: Network
  threshold: number
  shares: string[]
  className?: string
}

export function TransferPanel({ 
  privateKey, 
  network, 
  threshold, 
  shares,
  className = '' 
}: TransferPanelProps) {
  const [toAddress, setToAddress] = useState('')
  const [amountBSV, setAmountBSV] = useState('')
  const [sweepAll, setSweepAll] = useState(false)
  const [feeRate, setFeeRate] = useState(0.5)
  const [customFeeRate, setCustomFeeRate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<TransferResult | null>(null)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [estimatedFee, setEstimatedFee] = useState(0)

  const feeRates = getFeeRates()
  const fromAddress = privateKey.toAddress(network)

  // Fetch available balance
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const balance = await fetchBalance(network, fromAddress)
        setAvailableBalance(balance.totalSatoshis)
      } catch (error) {
        console.error('Failed to fetch balance for transfer:', error)
        // Set to 0 if balance fetch fails
        setAvailableBalance(0)
      }
    }
    
    // Only load balance if we have a valid fromAddress
    if (fromAddress) {
      loadBalance()
    }
  }, [network, fromAddress])

  // Estimate fee when inputs change
  useEffect(() => {
    const estimateFee = async () => {
      try {
        const utxos = await getUTXOsForAddress(network, fromAddress)
        const inputCount = utxos.length
        const outputCount = sweepAll ? 1 : 2 // sweep = 1 output, normal = 2 outputs (recipient + change)
        const fee = calculateFee(inputCount, outputCount, feeRate)
        setEstimatedFee(fee)
      } catch (error) {
        console.error('Failed to estimate fee:', error)
        setEstimatedFee(calculateFee(1, 2, feeRate)) // Fallback estimate
      }
    }

    if (availableBalance > 0) {
      estimateFee()
    }
  }, [network, fromAddress, feeRate, sweepAll, availableBalance])

  const handleAmountChange = (value: string) => {
    setAmountBSV(value)
    setSweepAll(false) // Disable sweep when amount is specified
  }

  const handleSweepToggle = (checked: boolean) => {
    setSweepAll(checked)
    if (checked) {
      setAmountBSV('') // Clear amount when sweep is enabled
    }
  }

  const handleFeeRateChange = (rate: number | string) => {
    if (typeof rate === 'number') {
      setFeeRate(rate)
      setCustomFeeRate('')
    } else {
      setCustomFeeRate(rate)
      const numRate = parseFloat(rate)
      if (!isNaN(numRate) && numRate > 0) {
        setFeeRate(numRate)
      }
    }
  }

  const validateInputs = (): string | null => {
    if (!toAddress.trim()) {
      return 'Recipient address is required'
    }

    if (!sweepAll) {
      if (!amountBSV.trim()) {
        return 'Amount is required when not sweeping all'
      }
      
      const amount = parseFloat(amountBSV)
      if (isNaN(amount) || amount <= 0) {
        return 'Amount must be a positive number'
      }

      const amountSats = bsvToSatoshis(amount)
      if (amountSats + estimatedFee > availableBalance) {
        return 'Insufficient balance (including fee)'
      }
    }
    
    if (sweepAll && availableBalance <= estimatedFee) {
      return 'Insufficient balance to cover fee'
    }

    if (feeRate <= 0) {
      return 'Fee rate must be positive'
    }

    return null
  }

  const handleTransfer = async () => {
    const validationError = validateInputs()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Reconstruct private key from shares (just-in-time)
      const reconstructedKey = PrivateKey.fromBackupShares(shares.slice(0, threshold))
      
      const transferResult = await transfer({
        fromPrivateKey: reconstructedKey,
        toAddress: toAddress.trim(),
        amount: sweepAll ? undefined : bsvToSatoshis(parseFloat(amountBSV)),
        network,
        feeRate
      })

      setResult(transferResult)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError('')
    setToAddress('')
    setAmountBSV('')
    setSweepAll(false)
    setFeeRate(0.5)
    setCustomFeeRate('')
  }

  if (result) {
    const txExplorerURL = getTxExplorerURL(network, result.txid)
    
    return (
      <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Transfer Broadcast Successful!
          </h3>
          <p className="text-gray-600 mb-8">
            Your transaction has been broadcast to the BSV network
          </p>
          
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-8 mb-8 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    Transaction ID
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.txid)}
                    className="flex-shrink-0 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy transaction ID"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm font-mono text-sm break-all text-gray-900 relative group">
                  {result.txid}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
                  Amount Sent
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="text-2xl font-bold text-green-600">{formatBSV(result.totalSent / 1e8)} BSV</div>
                  <div className="text-sm text-gray-600 mt-1">{formatSatoshis(result.totalSent)} satoshis</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
                  Network Fee
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="text-lg font-semibold text-orange-600">{formatBSV(result.fee / 1e8)} BSV</div>
                  <div className="text-sm text-gray-600 mt-1">{formatSatoshis(result.fee)} satoshis</div>
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    Recipient Address
                  </div>
                  <button
                    onClick={() => copyToClipboard(toAddress)}
                    className="flex-shrink-0 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy recipient address"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm font-mono text-sm break-all text-gray-900">
                  {toAddress}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={txExplorerURL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on WhatsOnChain
            </a>
            
            <button
              onClick={handleReset}
              className="px-8 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Make Another Transfer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Transfer BSV
      </h3>

      <div className="space-y-6">
        {/* Available Balance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Available Balance:</span>
            <div className="text-right">
              <div className="font-semibold text-blue-900">{formatBSV(availableBalance / 1e8)} BSV</div>
              <div className="text-xs text-blue-700">{formatSatoshis(availableBalance)} sats</div>
            </div>
          </div>

        </div>

        {/* Recipient Address */}
        <div>
          <label htmlFor="toAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            id="toAddress"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            disabled={loading}
            placeholder="Enter recipient Bitcoin address..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        {/* Amount or Sweep All */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">
              Amount
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sweepAll"
                checked={sweepAll}
                onChange={(e) => handleSweepToggle(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="sweepAll" className="text-sm font-medium text-gray-700">
                Sweep all funds
              </label>
            </div>
          </div>
          
          {!sweepAll && (
            <div className="space-y-2">
              <input
                type="number"
                value={amountBSV}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={loading}
                placeholder="0.00000000"
                step="0.00000001"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <div className="text-xs text-gray-600">
                {amountBSV && !isNaN(parseFloat(amountBSV)) && (
                  <>≈ {formatSatoshis(bsvToSatoshis(parseFloat(amountBSV)))} satoshis</>
                )}
              </div>
            </div>
          )}
          
          {sweepAll && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                All available funds will be sent to the recipient address (minus network fee).
              </p>
            </div>
          )}
        </div>

        {/* Fee Rate Selection */}
        <div>
          <div className="block text-sm font-medium text-gray-700 mb-2">
            Fee Rate (satoshis per byte)
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button
              onClick={() => handleFeeRateChange(feeRates.slow)}
              disabled={loading}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                feeRate === feeRates.slow 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Slow ({feeRates.slow})
            </button>
            <button
              onClick={() => handleFeeRateChange(feeRates.normal)}
              disabled={loading}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                feeRate === feeRates.normal 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Normal ({feeRates.normal})
            </button>
            <button
              onClick={() => handleFeeRateChange(feeRates.fast)}
              disabled={loading}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                feeRate === feeRates.fast 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Fast ({feeRates.fast})
            </button>
          </div>
          <input
            type="number"
            value={customFeeRate}
            onChange={(e) => handleFeeRateChange(e.target.value)}
            disabled={loading}
            placeholder="Custom fee rate..."
            step="0.1"
            min="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <div className="mt-1 text-xs text-gray-600">
            Estimated fee: {formatBSV(estimatedFee / 1e8)} BSV ({formatSatoshis(estimatedFee)} sats)
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Transfer Button */}
        <button
          onClick={handleTransfer}
          disabled={loading || !toAddress.trim() || (!sweepAll && !amountBSV.trim())}
          className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              {sweepAll ? 'Sweeping All Funds...' : 'Sending Transfer...'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              {sweepAll ? 'Sweep All Funds' : 'Send Transfer'}
            </>
          )}
        </button>

        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Security Notice:</p>
              <p>Private key is reconstructed just-in-time for signing and immediately discarded. Double-check recipient address before sending.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

