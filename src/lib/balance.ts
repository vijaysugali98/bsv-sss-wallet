'use client'

import { Network } from './shamir'

export interface BalanceData {
  network: string
  address: string
  confirmedSatoshis: number
  unconfirmedSatoshis: number
  totalSatoshis: number
  confirmedBSV: number
  unconfirmedBSV: number
  totalBSV: number
  source: string
}

export interface BalanceError {
  message: string
  network: string
  address: string
}

// Convert network name to WhatsOnChain format
function normalizeNetwork(network: Network): string {
  return network === 'mainnet' ? 'main' : 'test'
}

// Convert satoshis to BSV
function satoshisToBSV(satoshis: number): number {
  return satoshis / 1e8
}

// Convert BSV to satoshis  
export function bsvToSatoshis(bsv: number): number {
  return Math.round(bsv * 1e8)
}

// Format satoshis with commas
export function formatSatoshis(satoshis: number): string {
  return satoshis.toLocaleString()
}

// Format BSV with proper decimals
export function formatBSV(bsv: number): string {
  if (bsv === 0) return '0'
  if (bsv < 0.00000001) return '< 0.00000001'
  return bsv.toFixed(8).replace(/\.?0+$/, '')
}

// Fetch balance from WhatsOnChain API
export async function fetchBalance(network: Network, address: string): Promise<BalanceData> {
  const normalizedNetwork = normalizeNetwork(network)
  const url = `https://api.whatsonchain.com/v1/bsv/${normalizedNetwork}/address/${encodeURIComponent(address)}/balance`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'bsv-sss-ui',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    // WhatsOnChain returns { confirmed: <satoshis>, unconfirmed: <satoshis> }
    const confirmed = Number(result.confirmed || 0)
    const unconfirmed = Number(result.unconfirmed || 0)
    const total = confirmed + unconfirmed

    return {
      network,
      address,
      confirmedSatoshis: confirmed,
      unconfirmedSatoshis: unconfirmed,
      totalSatoshis: total,
      confirmedBSV: satoshisToBSV(confirmed),
      unconfirmedBSV: satoshisToBSV(unconfirmed),
      totalBSV: satoshisToBSV(total),
      source: 'WhatsOnChain',
    }
  } catch (error) {
    throw new Error(`Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get WhatsOnChain explorer URL for address
export function getExplorerURL(network: Network, address: string): string {
  const baseUrl = network === 'mainnet' 
    ? 'https://whatsonchain.com' 
    : 'https://test.whatsonchain.com'
  return `${baseUrl}/address/${address}`
}

// Get WhatsOnChain explorer URL for transaction
export function getTxExplorerURL(network: Network, txid: string): string {
  const baseUrl = network === 'mainnet' 
    ? 'https://whatsonchain.com' 
    : 'https://test.whatsonchain.com'
  return `${baseUrl}/tx/${txid}`
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    document.execCommand('copy')
    textArea.remove()
    
    // Re-throw if fallback also fails
    if (error instanceof Error) {
      throw error
    }
  }
}
