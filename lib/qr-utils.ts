import QRCode from 'qrcode'

interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

export const downloadQRCode = async (data: string, filename: string, options: QRCodeOptions = {}) => {
  try {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    }

    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(data, defaultOptions)
    
    // Create canvas for final image with text
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const canvasSize = 400
    canvas.width = canvasSize
    canvas.height = canvasSize + 120 // Extra space for text
    
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }
    
    // Fill white background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add title
    ctx.fillStyle = 'black'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('KASU Device QR Code', canvasSize / 2, 30)
    
    // Add MAC address (extract from data if it's JSON)
    let macAddress = data
    try {
      const parsedData = JSON.parse(data)
      if (parsedData.macAddress) {
        macAddress = parsedData.macAddress
      }
    } catch (e) {
      // If not JSON, use data as is
    }
    
    ctx.font = '14px monospace'
    ctx.fillText(macAddress, canvasSize / 2, 55)
    
    // Load and draw QR code image
    return new Promise((resolve, reject) => {
      const qrImage = new Image()
      qrImage.onload = () => {
        // Calculate position to center QR code
        const qrSize = 300
        const qrX = (canvasSize - qrSize) / 2
        const qrY = 70
        
        // Draw QR code
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
        
        // Add instructions at bottom
        ctx.font = '12px Arial'
        ctx.fillText('Scan with KASU app to connect device', canvasSize / 2, canvasSize + 85)
        ctx.fillText('Keep this QR code secure', canvasSize / 2, canvasSize + 105)
        
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            resolve(true)
          } else {
            reject(new Error('Failed to create blob'))
          }
        }, 'image/png')
      }
      
      qrImage.onerror = () => {
        reject(new Error('Failed to load QR code image'))
      }
      
      qrImage.src = qrDataURL
    })
    
  } catch (error) {
    console.error('QR Code generation error:', error)
    throw error
  }
}

export const generateQRData = (macAddress: string): string => {
  return JSON.stringify({
    type: 'KASU_DEVICE',
    macAddress: macAddress,
    timestamp: Date.now()
  })
}