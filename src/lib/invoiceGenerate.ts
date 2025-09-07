
export function generateInvoice(invoiceNumber: string, purchaseDate: Date, assetTitle: string, price: number): string {
    const formattedDate = purchaseDate.toLocaleDateString('en-US',{
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const formattedTime = price.toFixed(2)

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8"/>
        <title>Invoive ${invoiceNumber}</title>
    </head>
    <body>
    <div>
     <div>${invoiceNumber}</div>
     <div>${assetTitle}</div>
     <div>${formattedTime}</div>
     <div>Date: ${formattedDate}</div>
    </div>
    </dody>
    </html>
    `
}