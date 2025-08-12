'use client'

import { PrivateKey, Transaction, P2PKH, Script } from '@bsv/sdk'
import { Network } from './shamir'

export interface UTXO {
  tx_hash: string
  tx_pos: number
  value: number
  scriptHex?: string
}

export interface TransferParams {
  fromPrivateKey: PrivateKey
  toAddress: string
  amount?: number // in satoshis, undefined for sweep
  network: Network
  feeRate?: number // satoshis per byte, default 0.5
}

export interface TransferResult {
  txid: string
  txHex: string
  fee: number
  totalSent: number
}

export interface FeeRateInfo {
  slow: number
  normal: number
  fast: number
}

// Convert network name to WhatsOnChain format
function normalizeNetwork(network: Network): string {
  return network === 'mainnet' ? 'main' : 'test'
}

// Get suggested fee rates (static values, could be enhanced to fetch from API)
export function getFeeRates(): FeeRateInfo {
  return {
    slow: 1.0,    // 1.0 sat/byte
    normal: 5.0,   // 5.0 sat/byte  
    fast: 10.0,     // 10.0 sat/byte
  }
}

// Fetch UTXOs for an address
export async function getUTXOsForAddress(network: Network, address: string): Promise<UTXO[]> {
  const normalizedNetwork = normalizeNetwork(network)
  const url = `https://api.whatsonchain.com/v1/bsv/${normalizedNetwork}/address/${address}/unspent`
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'bsv-sss-ui',
    },
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch UTXOs: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// Fetch output script hex for a specific UTXO
export async function getOutputScriptHex(network: Network, txid: string, vout: number): Promise<string> {
  const normalizedNetwork = normalizeNetwork(network)
  const url = `https://api.whatsonchain.com/v1/bsv/${normalizedNetwork}/tx/${txid}/out/${vout}/hex`
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'bsv-sss-ui',
    },
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch output script: ${response.status} ${response.statusText}`)
  }
  
  return response.text()
}

// Add script hex to UTXOs (batched to avoid rate limiting)
export async function enrichUTXOsWithScripts(network: Network, utxos: UTXO[]): Promise<UTXO[]> {
  const maxBatch = 5
  const enriched: UTXO[] = []
  
  for (let i = 0; i < utxos.length; i += maxBatch) {
    const batch = utxos.slice(i, i + maxBatch)
    
    // Fetch scripts for this batch
    const scripts = await Promise.all(
      batch.map(utxo => getOutputScriptHex(network, utxo.tx_hash, utxo.tx_pos))
    )
    
    // Add scripts to UTXOs
    for (let j = 0; j < batch.length; j++) {
      enriched.push({
        ...batch[j],
        scriptHex: scripts[j]
      })
    }
    
    // Add delay between batches to respect rate limits
    if (i + maxBatch < utxos.length) {
      await new Promise(resolve => setTimeout(resolve, 120))
    }
  }
  
  return enriched
}

// Build and sign transaction
export async function buildTransaction(params: TransferParams): Promise<Transaction> {
  const { fromPrivateKey, toAddress, amount, network } = params
  const fromAddress = fromPrivateKey.toAddress(network)
  
  // Get UTXOs
  const utxos = await getUTXOsForAddress(network, fromAddress)
  if (utxos.length === 0) {
    throw new Error('No UTXOs available to spend')
  }
  
  // Enrich UTXOs with script data
  const enrichedUTXOs = await enrichUTXOsWithScripts(network, utxos)
  
  // Create transaction
  const tx = new Transaction()
  
  // Add inputs with per-input unlocker including sourceSatoshis and lockingScript
  for (const utxo of enrichedUTXOs) {
    const satoshis = Number(utxo.value)
    const lockingScript = Script.fromHex(utxo.scriptHex!)
    
    // Create minimal sourceTransaction structure for fee calculation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outputs: any[] = []
    outputs[utxo.tx_pos] = { satoshis }
    
    const perInputUnlocker = new P2PKH().unlock(fromPrivateKey, 'all', false, satoshis, lockingScript)
    
    tx.addInput({
      sourceTXID: utxo.tx_hash,
      sourceOutputIndex: utxo.tx_pos,
      sourceSatoshis: satoshis,
      unlockingScriptTemplate: perInputUnlocker,
      // minimal sourceTransaction for fee() and EF serialization
      sourceTransaction: { outputs },
      sequence: 0xffffffff,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  }
  
  // Set custom fee rate if provided
  const customFeeRate = params.feeRate || 5.0
  
  // Add outputs based on whether it's a sweep or specific amount
  if (amount) {
    // Specific amount transfer
    tx.addOutput({ 
      lockingScript: new P2PKH().lock(toAddress), 
      satoshis: amount 
    })
    tx.addOutput({ 
      lockingScript: new P2PKH().lock(fromAddress), 
      change: true 
    })
    await tx.fee()
    
    // Override the fee with our custom calculation
    const calculatedFee = calculateFee(enrichedUTXOs.length, 2, customFeeRate)
    if (tx.outputs[1] && tx.outputs[1].satoshis !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx.outputs[1].satoshis = tx.outputs[1].satoshis + ((tx as any).feeAmount ?? 0) - calculatedFee;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (tx as any).feeAmount = calculatedFee
    }
  } else {
    // Sweep all - send everything to target address
    tx.addOutput({ 
      lockingScript: new P2PKH().lock(toAddress), 
      satoshis: 1 
    })
    tx.addOutput({ 
      lockingScript: new P2PKH().lock(fromAddress), 
      change: true 
    })
    await tx.fee()
    
    // For sweep, calculate with custom fee rate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalIn = tx.inputs.reduce((sum, input: any) => sum + (input.sourceSatoshis ?? 0), 0)
    const totalOutExceptFirst = tx.outputs.slice(1).reduce((sum, output) => sum + (output.satoshis ?? 0), 0)
    const customFee = calculateFee(enrichedUTXOs.length, 2, customFeeRate)
    const sweepAmount = totalIn - totalOutExceptFirst - customFee
    
    if (sweepAmount <= 0) {
      throw new Error('Insufficient funds to sweep after fee calculation')
    }
    
    tx.outputs[0].satoshis = +sweepAmount;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tx as any).feeAmount = customFee;
  }
  
  // Sign all inputs
  await tx.sign()
  
  return tx
}

// Broadcast transaction to WhatsOnChain
export async function broadcastTransaction(network: Network, txHex: string): Promise<string> {
  const normalizedNetwork = normalizeNetwork(network)
  const url = `https://api.whatsonchain.com/v1/bsv/${normalizedNetwork}/tx/raw`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'bsv-sss-ui',
    },
    body: JSON.stringify({ txhex: txHex })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Broadcast failed: ${response.status} ${error}`)
  }
  
  const result = await response.json()
  return result.txid || result
}

// Complete transfer flow
export async function transfer(params: TransferParams): Promise<TransferResult> {
  const tx = await buildTransaction(params)
  
  // Get UTXOs to calculate fee  
  const fromAddress = params.fromPrivateKey.toAddress(params.network)
  const utxos = await getUTXOsForAddress(params.network, fromAddress)
  
  // Get transaction hex
  const txHex = tx.toHex ? tx.toHex() : tx.toString()
  
  // Broadcast transaction
  const txid = await broadcastTransaction(params.network, txHex)
  
  // Calculate totals
  const customFeeRate = params.feeRate || 5.0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fee = (tx as any).feeAmount ?? calculateFee(utxos.length, 2, customFeeRate)
  const totalSent = params.amount ? params.amount : 
    tx.outputs[0].satoshis ?? 0
  
  return {
    txid,
    txHex,
    fee,
    totalSent
  }
}

// Estimate transaction size for fee calculation
export function estimateTransactionSize(inputCount: number, outputCount: number): number {
  // Rough estimation: 
  // - 10 bytes overhead
  // - ~148 bytes per P2PKH input 
  // - ~34 bytes per P2PKH output
  return 10 + (inputCount * 148) + (outputCount * 34)
}

// Calculate fee for estimated transaction size
export function calculateFee(inputCount: number, outputCount: number, feeRate: number): number {
  const estimatedSize = estimateTransactionSize(inputCount, outputCount)
  return Math.ceil(estimatedSize * feeRate)
}
