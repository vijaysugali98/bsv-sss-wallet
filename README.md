# SSS Wallet - Secure Shamir Secret Sharing

A local-only frontend application for securely splitting Bitcoin private keys using Shamir's Secret Sharing (SSS). Built with Next.js, TypeScript, and Tailwind CSS, powered by the BSV SDK.

## 🔒 Security First

**All cryptographic operations happen locally in your browser. No data ever leaves your device.**

- ✅ Client-side only cryptography using Web Crypto API
- ✅ No server-side processing of secrets or shares
- ✅ No network transmission of sensitive data
- ✅ No telemetry or data collection
- ✅ Open source and auditable

## 🚀 Features

### Core Functionality
- **Generate Shares**: Split a private key into K-of-N backup shares
- **Recover Secret**: Reconstruct private key from threshold shares
- **QR Code Support**: Generate and scan QR codes for easy share handling
- **Print Support**: Print-optimized layouts for offline storage
- **Multi-Network**: Support for Bitcoin mainnet and testnet

### User Experience
- **Responsive Design**: Works on desktop and mobile devices  
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Print Styles**: Optimized layouts for physical backup storage

### Security Features
- **Local-Only Processing**: All crypto operations use browser Web Crypto API
- **No SSR of Secrets**: Sensitive data never touches server-side rendering
- **Ephemeral State**: No persistent storage of secrets or shares
- **Validation**: Input validation and error handling for all operations

## 🛠 Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Cryptography**: BSV SDK for Shamir Secret Sharing
- **QR Codes**: react-qr-code for generation, @zxing/browser for scanning
- **Export**: html-to-image for PNG/PDF export

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm package manager
- Modern web browser with Web Crypto API support

## 🎯 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sss-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📖 How to Use

### Creating Backup Shares

1. **Visit the Create Page** (`/create`)
2. **Configure Your Shares**:
   - Set **K** (threshold): minimum shares needed for recovery
   - Set **N** (total): total number of shares to create
   - Choose network (mainnet/testnet)
3. **Generate or Import**:
   - Let the app generate a new random key, OR
   - Import an existing private key (WIF or hex format)
4. **Save Your Shares**:
   - Copy share strings to clipboard
   - Download as PNG images with QR codes
   - Print individual shares for offline storage
5. **Distribute Securely**: Give shares to trusted parties/locations

### Recovering Your Secret

1. **Visit the Recovery Page** (`/recover`)
2. **Configure Recovery**:
   - Set the threshold (K value from when shares were created)
   - Select the network used
3. **Input Shares**:
   - Paste share strings manually, OR
   - Scan QR codes using your device camera
   - Need at least K shares to proceed
4. **Recover**: Click "Recover Secret" to reconstruct your private key
5. **Access Info**: View the recovered Bitcoin address and public key

### Print Optimization

- **Individual Print**: Each share has a print button for optimized layout
- **QR Code Focus**: Large, high-contrast QR codes for easy scanning
- **Metadata**: Includes share index, threshold info, network, and date
- **Security Reminders**: Each printout includes storage best practices

## 🔐 Security Notes

### What Makes This Secure

1. **Local-Only Crypto**: All operations use browser's `window.crypto` API
2. **No Network Calls**: Secrets/shares never transmitted to any server
3. **No Server Storage**: Zero server-side persistence of sensitive data
4. **Ephemeral State**: Data cleared when you leave the application
5. **Proven Cryptography**: Uses BSV SDK's implementation of Shamir's Secret Sharing

### Security Best Practices

#### When Creating Shares:
- ✅ Generate shares on a secure, offline computer if possible
- ✅ Verify your browser is up-to-date and from official sources
- ✅ Close other browser tabs and applications during the process
- ✅ Clear browser data after use (optional but recommended)

#### When Distributing Shares:
- ✅ Give different shares to different trusted parties
- ✅ Store shares in different physical locations  
- ✅ Use secure communication channels for digital distribution
- ✅ Consider printing shares for offline storage
- ✅ Never store all shares in the same location

#### When Recovering:
- ✅ Only recover on a secure device
- ✅ Ensure you're on the correct website (check URL)
- ✅ Test recovery with a subset before relying on the backup
- ✅ Create new backup shares after recovery if any shares may be compromised

### Known Limitations

- **Browser Requirement**: Requires a modern browser with Web Crypto API
- **No Mobile App**: Currently web-only (but mobile browser compatible)
- **No Hardware Wallet Integration**: Purely software-based solution
- **Single-Use Recovery**: Recovered keys exist only in browser memory

## 🧪 Testing

### Manual Testing Checklist

#### Basic Functionality:
- [ ] Landing page loads and displays correctly
- [ ] Create page generates valid shares  
- [ ] Recovery page reconstructs correct private key
- [ ] Print pages display properly formatted QR codes

#### Share Generation:
- [ ] K=2, N=3 configuration works
- [ ] K=3, N=5 configuration works  
- [ ] Network selection affects generated addresses
- [ ] Existing secret import works (WIF and hex)
- [ ] Generated addresses are valid for selected network

#### Share Recovery:
- [ ] Recovery works with exactly K shares
- [ ] Recovery works with K+1 shares
- [ ] Recovery fails with K-1 shares
- [ ] Invalid share format shows appropriate error
- [ ] QR scanner successfully reads generated QR codes

#### Error Handling:
- [ ] Invalid threshold/total combinations show errors
- [ ] Malformed shares display helpful error messages
- [ ] Network connectivity issues don't affect core functionality
- [ ] Browser compatibility warnings appear as needed

#### Print/Export:
- [ ] Share QR codes scan correctly after printing
- [ ] Print layouts are properly formatted
- [ ] PNG export generates readable QR codes
- [ ] Print styles hide navigation elements

### Unit Testing

```bash
# Run unit tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the security guidelines
4. Test thoroughly including security aspects
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)  
7. Open a Pull Request

### Development Guidelines

- **Security First**: Never introduce server-side processing of secrets
- **TypeScript**: Maintain strong typing throughout
- **Testing**: Add tests for new functionality
- **Documentation**: Update README for significant changes
- **Accessibility**: Ensure new features are accessible

## 📄 License

This project is open source. See the LICENSE file for details.

## 🙋 Support & FAQ

### Common Issues

**Q: The QR scanner doesn't work on my device**
A: Ensure your browser has camera permissions and you're using HTTPS (required for camera access).

**Q: Can I use this with other cryptocurrencies?**  
A: Currently optimized for Bitcoin (BSV), but the core SSS functionality works with any private key.

**Q: What happens if I lose more than N-K shares?**
A: If you lose more than the allowed number of shares, recovery becomes impossible. This is by design for security.

**Q: Is this compatible with hardware wallets?**
A: This is a software-only solution. For hardware wallet integration, you'd need to export your seed first.

### Security Questions

**Q: How do I know this is actually secure?**
A: The code is open source and auditable. All cryptography happens client-side using browser APIs. No network requests are made for sensitive operations.

**Q: What if the website goes down?**  
A: You can run this locally or on your own server. The shares themselves contain all needed information for recovery.

**Q: Should I trust this with my main wallet?**
A: Always test with small amounts first. Consider this beta software and perform your own security review.

## 🔗 References

- [Shamir's Secret Sharing](https://en.wikipedia.org/wiki/Shamir's_Secret_Sharing) - Wikipedia
- [BSV SDK Documentation](https://docs.bsv.blockchain/) - BSV Blockchain
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) - MDN
- [Bitcoin Improvement Proposals](https://github.com/bitcoin/bips) - GitHub

---

**⚠️ Important Security Reminder**: This software is provided as-is. Always test with small amounts and understand the risks before using with significant funds. The developers are not responsible for any lost funds due to improper usage or software bugs.