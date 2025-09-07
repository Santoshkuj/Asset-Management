import { getAssetById } from "@/actions/dashboardActions";
import { checkExistingPurchase } from "@/actions/paymentActions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
    try {

        const hasPurchased = await checkExistingPurchase(id)
        if (!hasPurchased) {
            return NextResponse.redirect(new URL(`/gallery/${id}`, request.url))
        }

        const result = await getAssetById(id)

        if (!result) {
            return NextResponse.redirect(new URL(`/gallery`, request.url))
        }

        return NextResponse.redirect(result?.asset.fileUrl)
    } catch (error) {
            return NextResponse.redirect(new URL(`/gallery`, request.url))
    }

}