'use client'

import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

export interface ExportOptions {
  element: HTMLElement
  filename: string
  format: 'png' | 'pdf'
}

export async function exportToPNG(element: HTMLElement, filename: string): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      quality: 1.0,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    })
    
    downloadDataUrl(dataUrl, `${filename}.png`)
  } catch (error) {
    throw new Error(`Failed to export PNG: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export interface SharePDFData {
  share: string
  shareIndex: number
  threshold: number
  total: number
  network: string
  generatedAt: string
  address: string
  publicKey: string
}

export async function exportToPDF(element: HTMLElement, filename: string): Promise<void> {
  // For generic HTML elements, fall back to browser print functionality
  printElement(element)
}

export async function exportShareToPDF(data: SharePDFData, filename: string): Promise<void> {
  try {
    // Create a new PDF document (A4 size) - matching print margins
    const pdf = new jsPDF('portrait', 'mm', 'a4')
    const pageWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const margin = 19 // 0.75in = ~19mm to match print margins
    const contentWidth = pageWidth - (margin * 2)
    
    // Set default font to Times New Roman to match print version
    pdf.setFont('times', 'normal')
    
    // HEADER SECTION (matching print styles exactly)
    pdf.setFontSize(24)
    pdf.setFont('times', 'bold')
    const headerText = 'BSV Shamir Secret Share'
    const textWidth = pdf.getTextWidth(headerText)
    pdf.text(headerText, (pageWidth - textWidth) / 2, margin + 15) // Centered
    
    // Header details
    pdf.setFontSize(16)
    pdf.setFont('times', 'normal')
    const shareInfo = `Share ${data.shareIndex + 1} of ${data.total} • Threshold: ${data.threshold} shares required`
    const shareInfoWidth = pdf.getTextWidth(shareInfo)
    pdf.text(shareInfo, (pageWidth - shareInfoWidth) / 2, margin + 25)
    
    const networkInfo = `Network: ${data.network} • Generated: ${data.generatedAt}`
    const networkInfoWidth = pdf.getTextWidth(networkInfo)
    pdf.text(networkInfo, (pageWidth - networkInfoWidth) / 2, margin + 35)
    
    // Header bottom border (3px solid black)
    pdf.setLineWidth(1)
    pdf.setDrawColor(0, 0, 0)
    pdf.line(margin, margin + 45, pageWidth - margin, margin + 45)
    
    let yPosition = margin + 60
    
    // QR CODE SECTION (centered, matching print size)
    try {
      const qrCodeDataUrl = await generateQRCodeDataUrl(data.share)
      const qrSize = 65 // Matching max-width: 250px from print (~65mm)
      const qrX = (pageWidth - qrSize) / 2
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, yPosition, qrSize, qrSize)
      yPosition += qrSize + 15
    } catch (error) {
      console.warn('QR Code generation failed:', error)
      // Draw placeholder rectangle
      const qrSize = 65
      const qrX = (pageWidth - qrSize) / 2
      pdf.setDrawColor(0, 0, 0)
      pdf.rect(qrX, yPosition, qrSize, qrSize)
      pdf.setFontSize(8)
      pdf.text('QR Code Generation Failed', qrX + 15, yPosition + 30)
      yPosition += qrSize + 15
    }
    
    // SHARE DATA SECTION
    pdf.setFontSize(18)
    pdf.setFont('times', 'bold')
    pdf.text('Share Data (Copy this text for recovery)', margin, yPosition)
    
    // Underline for section header (2px solid black)
    const headerY = yPosition + 2
    pdf.setLineWidth(0.5)
    pdf.line(margin, headerY, pageWidth - margin, headerY)
    
    yPosition += 15
    
    // Share data box with border (matching print styles)
    const shareBoxY = yPosition
    const shareBoxHeight = 25 // Estimated height for share data
    
    // Draw border (2px solid black)
    pdf.setLineWidth(0.7)
    pdf.setDrawColor(0, 0, 0)
    pdf.rect(margin, shareBoxY, contentWidth, shareBoxHeight)
    
    // Share text with monospace font
    pdf.setFontSize(11)
    pdf.setFont('courier', 'normal') // Monospace matching print
    
    const shareLines = pdf.splitTextToSize(data.share, contentWidth - 10)
    let shareY = shareBoxY + 8
    shareLines.forEach((line: string) => {
      if (shareY < shareBoxY + shareBoxHeight - 5) { // Keep within box bounds
        pdf.text(line, margin + 5, shareY)
        shareY += 4
      }
    })
    
    yPosition = shareBoxY + shareBoxHeight + 15
    
    // WALLET SECTION
    pdf.setFontSize(18)
    pdf.setFont('times', 'bold')
    pdf.text('Associated Wallet Information', margin, yPosition)
    
    // Section underline
    const walletHeaderY = yPosition + 2
    pdf.setLineWidth(0.5)
    pdf.line(margin, walletHeaderY, pageWidth - margin, walletHeaderY)
    
    yPosition += 20
    
    // Bitcoin Address
    pdf.setFontSize(14)
    pdf.setFont('times', 'bold')
    pdf.text(`BSV Address (${data.network}):`, margin, yPosition)
    yPosition += 8
    
    // Address box
    const addrBoxHeight = 15
    pdf.setLineWidth(0.7)
    pdf.rect(margin, yPosition, contentWidth, addrBoxHeight)
    
    pdf.setFontSize(10)
    pdf.setFont('courier', 'normal')
    const addressLines = pdf.splitTextToSize(data.address, contentWidth - 10)
    let addrY = yPosition + 6
    addressLines.forEach((line: string) => {
      if (addrY < yPosition + addrBoxHeight - 3) {
        pdf.text(line, margin + 5, addrY)
        addrY += 4
      }
    })
    
    yPosition += addrBoxHeight + 15
    
    // Public Key
    pdf.setFontSize(14)
    pdf.setFont('times', 'bold')
    pdf.text('Public Key:', margin, yPosition)
    yPosition += 8
    
    // Public key box
    const pubKeyBoxHeight = 15
    pdf.setLineWidth(0.7)
    pdf.rect(margin, yPosition, contentWidth, pubKeyBoxHeight)
    
    pdf.setFontSize(10)
    pdf.setFont('courier', 'normal')
    const pubKeyLines = pdf.splitTextToSize(data.publicKey, contentWidth - 10)
    let pubKeyY = yPosition + 6
    pubKeyLines.forEach((line: string) => {
      if (pubKeyY < yPosition + pubKeyBoxHeight - 3) {
        pdf.text(line, margin + 5, pubKeyY)
        pubKeyY += 4
      }
    })
    
    yPosition += pubKeyBoxHeight + 15
    
    // SECURITY SECTION (matching print styles with border)
    const securityBoxHeight = 35
    
    // Security section border (3px solid black)
    pdf.setLineWidth(1)
    pdf.setDrawColor(0, 0, 0)
    pdf.rect(margin, yPosition, contentWidth, securityBoxHeight)
    
    pdf.setFontSize(16)
    pdf.setFont('times', 'bold')
    pdf.text('⚠️ SECURITY INSTRUCTIONS', margin + 5, yPosition + 10)
    
    pdf.setFontSize(13)
    pdf.setFont('times', 'normal')
    const securityTexts = [
      `• This is share ${data.shareIndex + 1} of a ${data.threshold}-of-${data.total} Shamir Secret Sharing backup`,
      `• ${data.threshold} shares are required to recover the private key`,
      '• Store this share separately from other shares',
      '• Keep in a secure, dry location away from direct sunlight',
      `• Anyone with ${data.threshold} or more shares can access the funds at the address above`,
      '• To recover: copy the "Share Data" text above and use it in the recovery tool'
    ]
    
    let securityY = yPosition + 18
    securityTexts.forEach(text => {
      if (securityY < yPosition + securityBoxHeight - 5) {
        const lines = pdf.splitTextToSize(text, contentWidth - 20)
        lines.forEach((line: string) => {
          if (securityY < yPosition + securityBoxHeight - 5) {
            pdf.text(line, margin + 10, securityY)
            securityY += 4
          }
        })
      }
    })
    
    yPosition += securityBoxHeight + 15
    
    // METADATA SECTION (bottom with border line)
    const metadataY = pageHeight - 30
    
    // Top border line
    pdf.setLineWidth(0.5)
    pdf.line(margin, metadataY, pageWidth - margin, metadataY)
    
    pdf.setFontSize(12)
    pdf.setFont('times', 'normal')
    const metadata1 = `Share: ${data.shareIndex + 1}/${data.total} | Threshold: ${data.threshold} | Network: ${data.network}`
    const metadata2 = `Generated: ${data.generatedAt}`
    
    // Center align metadata
    const meta1Width = pdf.getTextWidth(metadata1)
    const meta2Width = pdf.getTextWidth(metadata2)
    
    pdf.text(metadata1, (pageWidth - meta1Width) / 2, metadataY + 10)
    // pdf.text(metadata2, (pageWidth - meta2Width) / 2, metadataY + 18)
    
    // Save the PDF
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function printElement(element: HTMLElement): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Unable to open print window. Please check your popup blocker settings.')
  }
  
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('')
      } catch (e) {
        // Handle cross-origin stylesheets
        console.warn('Could not access stylesheet:', e)
        return ''
      }
    })
    .join('')
  
  // Create the document structure
  printWindow.document.title = 'Print Share'
  
  // Add styles
  const styleElement = printWindow.document.createElement('style')
  styleElement.textContent = `
    ${styles}
    @media print {
      body { margin: 0; }
      .print-qr-container { 
        max-width: none; 
        margin: 0;
        page-break-inside: avoid;
      }
    }
  `
  printWindow.document.head.appendChild(styleElement)
  
  // Add content
  printWindow.document.body.innerHTML = element.outerHTML
  
  printWindow.document.close()
  printWindow.focus()
  
  // Wait for content to load before printing
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

export function printPage(): void {
  window.print()
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function generateFilename(prefix: string, index?: number, network?: string): string {
  const timestamp = new Date().toISOString().split('T')[0]
  const indexSuffix = index !== undefined ? `_${index + 1}` : ''
  const networkSuffix = network ? `_${network}` : ''
  return `${prefix}${indexSuffix}${networkSuffix}_${timestamp}`
}

// Helper function to generate QR code as data URL for PDF embedding
async function generateQRCodeDataUrl(value: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(value, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrDataUrl
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}