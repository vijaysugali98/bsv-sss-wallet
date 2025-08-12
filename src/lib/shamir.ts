'use client'

import { PrivateKey } from '@bsv/sdk'

export type Network = 'mainnet' | 'testnet'

export interface GenerateSharesParams {
  threshold: number
  total: number
  network: Network
  existingSecret?: string
}

export interface GenerateSharesResult {
  shares: string[]
  address: string
  publicKey: string
}

export interface RecoverFromSharesParams {
  shares: string[]
  threshold: number
  network: Network
}

export interface RecoverFromSharesResult {
  address: string
  publicKey: string
  privateKey: PrivateKey
}

// Ensure we're using browser's Web Crypto API
if (typeof window !== 'undefined' && typeof globalThis !== 'undefined') {
  try {
    globalThis.crypto = globalThis.crypto || window.crypto
  } catch (e) {
    // globalThis.crypto might be read-only in some environments
  }
}

export async function generateShares(params: GenerateSharesParams): Promise<GenerateSharesResult> {
  const { threshold, total, network, existingSecret } = params
  
  // Validation
  if (threshold < 1) {
    throw new Error('Threshold must be at least 1')
  }
  if (total < threshold) {
    throw new Error('Total shares must be at least equal to threshold')
  }
  if (total > 10) {
    throw new Error('Total shares cannot exceed 10')
  }
  
  let privateKey: PrivateKey
  
  if (existingSecret) {
    try {
      // Try to parse as WIF first, then as hex
      if (existingSecret.length === 51 || existingSecret.length === 52) {
        privateKey = PrivateKey.fromWif(existingSecret)
      } else {
        privateKey = PrivateKey.fromHex(existingSecret)
      }
    } catch (error) {
      console.error('Failed to parse existing secret:', error)
      throw new Error('Invalid existing secret format. Expected WIF or hex string.')
    }
  } else {
    // Generate new random private key using Web Crypto
    privateKey = PrivateKey.fromRandom()
  }
  
  // Create backup shares
  const shares = privateKey.toBackupShares(threshold, total)
  
  // Derive address and public key
  const address = privateKey.toAddress(network)
  const publicKey = privateKey.toPublicKey().toString()
  
  return {
    shares,
    address,
    publicKey
  }
}

export function recoverFromShares(params: RecoverFromSharesParams): RecoverFromSharesResult {
  const { shares, threshold, network } = params
  
  // Validation
  if (!shares || shares.length < threshold) {
    throw new Error(`Need at least ${threshold} shares to recover. Got ${shares?.length || 0}.`)
  }
  
  // Filter out empty shares
  const validShares = shares.filter(share => share && share.trim().length > 0)
  
  if (validShares.length < threshold) {
    throw new Error(`Need at least ${threshold} valid shares to recover. Got ${validShares.length}.`)
  }
  
  try {
    // Reconstruct private key from shares
    const privateKey = PrivateKey.fromBackupShares(validShares.slice(0, threshold))
    
    // Derive address and public key
    const address = privateKey.toAddress(network)
    const publicKey = privateKey.toPublicKey().toString()
    
    return {
      address,
      publicKey,
      privateKey
    }
  } catch (error) {
    throw new Error(`Failed to recover from shares: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function validateShareFormat(share: string): boolean {
  if (!share || typeof share !== 'string') {
    return false
  }
  
  // Basic validation - shares should be non-empty strings
  // The actual format validation will happen when we try to reconstruct
  return share.trim().length > 0
}

export function validateThreshold(threshold: number, total: number): string | null {
  if (!Number.isInteger(threshold) || threshold < 1) {
    return 'Threshold must be a positive integer'
  }
  if (!Number.isInteger(total) || total < 1) {
    return 'Total shares must be a positive integer'
  }
  if (threshold > total) {
    return 'Threshold cannot be greater than total shares'
  }
  if (total > 10) {
    return 'Total shares cannot exceed 10'
  }
  return null
}