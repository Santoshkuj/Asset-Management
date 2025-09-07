'use server'

import { auth } from "@/lib/auth"
import { db } from "@/lib/db/db"
import { asset, payment, purchase } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import {v4 as uuid} from 'uuid'
import { createInvoice } from "./invoiceActions"

type LinkType = {
    href: string,
    rel: string
}

export async function createOrder(assetId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user?.id) {
        redirect('/login')
    }

    const [getAsset] = await db.select().from(asset).where(eq(asset.id, assetId))

    if (!getAsset) {
        throw new Error('Asset not fount')
    }

    const existingPurchase = await db.select().from(purchase).where(and(eq(purchase.assetId, assetId), eq(purchase.userId, session.user.id))).limit(1)

    if (existingPurchase.length > 0) {
        return {
            alreadyPurchased: true
        }
    }
    try {
        const response = await fetch(`${process.env.PAYPAL_API_URL}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        reference_id: assetId,
                        description: `Purchase of ${getAsset.title}`,
                        amount: {
                            currency_code: 'USD',
                            value: '5.00'
                        },
                        custom_id: `${session.user.id}|${assetId}`
                    }
                ],
                application_context: {
                    return_url: `${process.env.APP_URL}/api/paypal/capture?assetId=${assetId}`,
                    cancel_url: `${process.env.APP_URL}/gallery/${assetId}?cancelled=true`
                }
            })
        })
        const data = await response.json()

        if (data.id) {
            return {
                orderId: data.id,
                approvalLink: data.links.find((link: LinkType) => link.rel === 'approve').href
            }
        } else {
            throw new Error('Failed to create order')
        }
    } catch (error) {
        console.log(error);
        throw new Error('Failed to create order')
    }
}

export async function recordPurchase(assetId:string, orderId:string, userId:string, price = 5.0) {
    try {
        const isPurchased = await checkExistingPurchase(assetId)
        if (isPurchased) {
            return{
                success: true,
                alreadyExists: true
            }
        }
        const paymentUuid = uuid()
        const purchaseUuid = uuid()
        
        await db.insert(payment).values({
            id: paymentUuid,
            amount: Math.round(price),
            currency: 'USD',
            status: 'completed',
            provider: 'paypal',
            providerId: orderId,
            createdAt: new Date(),
            userId
        })

        await db.insert(purchase).values({
            id: purchaseUuid,
            assetId,
            userId,
            paymentId: paymentUuid,
            price: Math.round(price),
            createdAt: new Date()
        })

        const invoiceResult = await createInvoice(purchaseUuid)

        if (!invoiceResult) {
            console.log('Faled to create invoice');
        }

        revalidatePath(`/gallery/${assetId}`)
        revalidatePath('/dashboard/purchases')

        return {
            success: true,
            purchaseId: purchaseUuid
        }
    } catch (error) {
        console.log(error);
        return{
            success: false,
            error: 'Failed to save purchase and payment info'
        }
    }
}

export async function checkExistingPurchase(assetId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user?.id) {
        return false
    }

    try {
        const existingPurchase = await db.select().from(purchase).where(and(eq(purchase.assetId, assetId), eq(purchase.userId, session.user.id))).limit(1)

        return existingPurchase.length > 0
    } catch (error) {
        console.log(error);
        return false
    }
}

export async function getAllPurchasedAssets() {
      const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user?.id) {
        redirect('/login')
    }
    try {
        const purchases = await db.select({
            purchase: purchase,
            asset: asset
        }).from(purchase).innerJoin(asset, eq(purchase.assetId,asset.id)).where(eq(purchase.userId, session.user.id)).orderBy(purchase.createdAt)

        return purchases
    } catch (error) {
        console.log(error);
        return []
    }
}