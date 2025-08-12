'use client'

import { useState } from 'react'
import { Network, validateThreshold } from '@/lib/shamir'

interface NkSelectorProps {
  threshold: number
  total: number
  network: Network
  onThresholdChange: (threshold: number) => void
  onTotalChange: (total: number) => void
  onNetworkChange: (network: Network) => void
  disabled?: boolean
}

export function NkSelector({
  threshold,
  total,
  network,
  onThresholdChange,
  onTotalChange,
  onNetworkChange,
  disabled = false
}: NkSelectorProps) {
  const [touched, setTouched] = useState(false)
  
  const validationError = validateThreshold(threshold, total)
  const showError = touched && validationError

  const handleThresholdChange = (value: string) => {
    setTouched(true)
    const num = parseInt(value) || 1
    onThresholdChange(Math.max(1, Math.min(10, num)))
  }

  const handleTotalChange = (value: string) => {
    setTouched(true)
    const num = parseInt(value) || 1
    onTotalChange(Math.max(1, Math.min(10, num)))
  }

  const handleBlur = () => {
    setTouched(true)
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border">
      <h3 className="text-lg font-semibold text-gray-900">Share Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-1">
            Threshold (K)
          </label>
          <input
            type="number"
            id="threshold"
            min="1"
            max="10"
            value={threshold}
            onChange={(e) => handleThresholdChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              showError ? 'border-red-500' : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            aria-describedby="threshold-help"
          />
          <p id="threshold-help" className="text-xs text-gray-500 mt-1">
            Minimum shares required to recover
          </p>
        </div>

        <div>
          <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-1">
            Total Shares (N)
          </label>
          <input
            type="number"
            id="total"
            min="1"
            max="10"
            value={total}
            onChange={(e) => handleTotalChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              showError ? 'border-red-500' : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            aria-describedby="total-help"
          />
          <p id="total-help" className="text-xs text-gray-500 mt-1">
            Total number of shares to create
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="network" className="block text-sm font-medium text-gray-700 mb-1">
          Network
        </label>
        <select
          id="network"
          value={network}
          onChange={(e) => onNetworkChange(e.target.value as Network)}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white border-gray-300'
          }`}
        >
          <option value="mainnet">Mainnet</option>
          <option value="testnet">Testnet</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Choose the network for address generation
        </p>
      </div>

      {showError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {validationError}
          </p>
        </div>
      )}

      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-1">Configuration Summary</h4>
        <p className="text-sm text-blue-800">
          Creating <strong>{total}</strong> shares where any <strong>{threshold}</strong> can recover the secret.
          {threshold < total && (
            <span className="block mt-1">
              You can lose up to <strong>{total - threshold}</strong> shares and still recover.
            </span>
          )}
        </p>
      </div>
    </div>
  )
}