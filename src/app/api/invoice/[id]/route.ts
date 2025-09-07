import { getInvoiceHtml } from "@/actions/invoiceActions"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
    try {
        const result = await getInvoiceHtml(id)

        if (!result.success || !result.invoiceData) {
            return NextResponse.redirect(new URL('/dashboard/purchases', request.url))
        }

        return new NextResponse(result.invoiceData, {
            headers: {
                'Content-Type': 'text/html'
            }
        })
    } catch (error) {
        return NextResponse.redirect(new URL('/dashboard/purchases', request.url))
    }

}