'use client'

import { useEffect, useState } from 'react'
import { PrintableQRCode } from '@/lib/qr'
import type { Network } from '@/lib/shamir'
import { exportShareToPDF, generateFilename, type SharePDFData } from '@/lib/print'

interface PrintShareModalProps {
  isOpen: boolean
  onClose: () => void
  share: string
  shareIndex: number
  threshold: number
  total: number
  network: Network
  generatedAt: string
  address: string
  publicKey: string
}

export function PrintShareModal({
  isOpen,
  onClose,
  share,
  shareIndex,
  threshold,
  total,
  network,
  generatedAt,
  address,
  publicKey
}: Readonly<PrintShareModalProps>) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent background scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      // Get the QR code SVG
      const qrElement = document.getElementById('print-modal-content')?.querySelector('svg')
      const qrSvg = qrElement ? qrElement.outerHTML : '<div>QR Code</div>'
      
      // Create the document structure
      printWindow.document.title = `Share #${shareIndex + 1} - BSV Backup`
      
      // Add styles
      const styleElement = printWindow.document.createElement('style')
      styleElement.textContent = `
              @page { 
                margin: 0.75in;
                size: A4;
              }
              
              * {
                user-select: text !important;
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                -webkit-touch-callout: text !important;
                -khtml-user-select: text !important;
              }
              
              body { 
                font-family: 'Times New Roman', serif;
                margin: 0; 
                padding: 20px;
                color: #000 !important;
                background: #fff !important;
                line-height: 1.5;
                font-size: 14px;
              }
              
              .print-container {
                width: 100%;
                max-width: none;
              }
              
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #000;
                padding-bottom: 20px;
              }
              
              .header h1 {
                font-size: 24px;
                margin: 0 0 15px 0;
                color: #000 !important;
                font-weight: bold;
              }
              
              .header p {
                font-size: 16px;
                color: #000 !important;
                margin: 8px 0;
                font-weight: normal;
              }
              
              .qr-section {
                text-align: center;
                margin: 30px 0;
                page-break-inside: avoid;
              }
              
              .qr-section svg {
                max-width: 250px;
                height: auto;
              }
              
              .share-section {
                margin: 30px 0;
                page-break-inside: avoid;
              }
              
              .share-section h3 {
                font-size: 18px;
                color: #000 !important;
                margin: 0 0 15px 0;
                font-weight: bold;
                border-bottom: 2px solid #000;
                padding-bottom: 5px;
              }
              
              .share-data {
                background: #ffffff !important;
                border: 2px solid #000;
                padding: 15px;
                margin: 15px 0;
                font-family: 'Courier New', 'Lucida Console', monospace;
                font-size: 11px;
                line-height: 1.6;
                word-break: break-all;
                word-wrap: break-word;
                color: #000 !important;
              }
              
              .wallet-section {
                margin: 30px 0;
                page-break-inside: avoid;
              }
              
              .wallet-section h3 {
                font-size: 18px;
                color: #000 !important;
                margin: 0 0 20px 0;
                font-weight: bold;
                border-bottom: 2px solid #000;
                padding-bottom: 5px;
              }
              
              .wallet-item {
                margin: 20px 0;
              }
              
              .wallet-label {
                font-size: 14px;
                font-weight: bold;
                color: #000 !important;
                margin-bottom: 8px;
              }
              
              .wallet-value {
                background: #ffffff !important;
                border: 2px solid #000;
                padding: 12px;
                font-family: 'Courier New', 'Lucida Console', monospace;
                font-size: 10px;
                line-height: 1.4;
                word-break: break-all;
                word-wrap: break-word;
                color: #000 !important;
              }
              
              .security-section {
                margin: 30px 0;
                border: 3px solid #000;
                padding: 20px;
                page-break-inside: avoid;
              }
              
              .security-section h4 {
                font-size: 16px;
                margin: 0 0 15px 0;
                color: #000 !important;
                font-weight: bold;
              }
              
              .security-section p {
                margin: 10px 0;
                font-size: 13px;
                color: #000 !important;
                line-height: 1.4;
              }
              
              .metadata {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #000;
                font-size: 12px;
                color: #000 !important;
                text-align: center;
              }
      `
      printWindow.document.head.appendChild(styleElement)
      
      // Add content to body
      printWindow.document.body.innerHTML = `
            <div class="print-container">
              <div class="header">
                <h1>BSV Shamir Secret Share</h1>
                <p><strong>Share ${shareIndex + 1} of ${total}</strong> • Threshold: ${threshold} shares required</p>
                <p>Network: ${network} • Generated: ${generatedAt}</p>
              </div>
              
              <div class="qr-section">
                ${qrSvg}
              </div>
              
              <div class="share-section">
                <h3>Share Data (Copy this text for recovery)</h3>
                <div class="share-data">${share}</div>
              </div>
              
              <div class="wallet-section">
                <h3>Associated Wallet Information</h3>
                
                <div class="wallet-item">
                  <div class="wallet-label">BSV Address (${network}):</div>
                  <div class="wallet-value">${address}</div>
                </div>
                
                <div class="wallet-item">
                  <div class="wallet-label">Public Key:</div>
                  <div class="wallet-value">${publicKey}</div>
                </div>
              </div>
              
              <div class="security-section">
                <h4>⚠️ SECURITY INSTRUCTIONS</h4>
                <p>• This is share <strong>${shareIndex + 1}</strong> of a ${threshold}-of-${total} Shamir Secret Sharing backup</p>
                <p>• <strong>${threshold} shares are required</strong> to recover the private key</p>
                <p>• Store this share separately from other shares</p>
                <p>• Keep in a secure, dry location away from direct sunlight</p>
                <p>• Anyone with ${threshold} or more shares can access the funds at the address above</p>
                <p>• To recover: copy the "Share Data" text above and use it in the recovery tool</p>
              </div>
              
              <div class="metadata">
                <p><strong>Share:</strong> ${shareIndex + 1}/${total} | <strong>Threshold:</strong> ${threshold} | <strong>Network:</strong> ${network}</p>
                <p><strong>Generated:</strong> ${generatedAt}</p>
              </div>
            </div>
      `
      
      printWindow.document.close()
      
      // Wait a bit for the document to be ready, then print
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const pdfData: SharePDFData = {
        share,
        shareIndex,
        threshold,
        total,
        network,
        generatedAt,
        address,
        publicKey
      }
      
      const filename = generateFilename('sss_share', shareIndex, network)
      await exportShareToPDF(pdfData, filename)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Print Share #{shareIndex + 1}
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Print Content */}
        <div className="p-6">
          <div id="print-modal-content" className="flex items-center justify-center">
            <PrintableQRCode
              value={share}
              shareIndex={shareIndex}
              threshold={threshold}
              total={total}
              network={network}
              date={generatedAt}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Print & Download Options</h3>
          
          {/* <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>📄 Both options create identical formats:</strong> Whether you print directly or download the PDF, 
              the layout, fonts, and text selectability are the same for consistency.
            </p>
          </div> */}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
            <div>
              <h4 className="font-semibold mb-1">Print Option:</h4>
              <ul className="space-y-1">
                <li>• Direct to your printer</li>
                <li>• Uses browser&apos;s print dialog</li>
                <li>• Choose paper size & quality</li>
                <li>• Preview before printing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Download PDF Option:</h4>
              <ul className="space-y-1">
                <li>• Save to your device</li>
                <li>• Text is fully selectable</li>
                <li>• Print later or share digitally</li>
                <li>• Consistent formatting</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
            <div>
              <h4 className="font-semibold mb-1">Before Printing/Saving:</h4>
              <ul className="space-y-1">
                <li>• Ensure sufficient ink/toner</li>
                <li>• Use high-quality paper</li>
                <li>• Test scan QR code first</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">After Printing:</h4>
              <ul className="space-y-1">
                <li>• Store in secure, dry location</li>
                <li>• Keep away from direct sunlight</li>
                <li>• Consider laminating for protection</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-xs text-yellow-800">
              <strong>⚠️ Security Reminder:</strong> This share is part of a {threshold}-of-{total} backup system. 
              Store separately from other shares. Anyone with {threshold} or more shares can recover your secret.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}