'use server'

import { auth } from "@/lib/auth"
import { db } from "@/lib/db/db"
import { asset, invioce, payment, purchase, user } from "@/lib/db/schema"
import { generateInvoice } from "@/lib/invoiceGenerate"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { v4 as uuid } from 'uuid'

export async function createInvoice(purchaseId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session?.user?.id) {
        return {
            sucess: false,
            error: 'Un-Authenticated'
        }
    }
    try {
        const [purchaseData] = await db.select({
            purchase: purchase,
            asset: asset,
            payment: payment,
            user: user
        }).from(purchase).innerJoin(asset, eq(purchase.assetId, asset.id)).innerJoin(payment, eq(purchase.paymentId, payment.id)).innerJoin(user, eq(purchase.userId, user.id)).where(eq(purchase.id, purchaseId)).limit(1)

        if (!purchaseData) {
            return {
                success: false,
                error: 'Purchase not found'
            }
        }

        if (purchaseData.purchase.userId !== session.user.id && session.user.role !== 'admin') {
            return {
                success: false,
                error: 'Un-Authorized'
            }
        }

        const invoiceNumber = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}- ${Math.floor(1000 + Math.random() * 8000)}`

        const htmlContent = generateInvoice(invoiceNumber, new Date(purchaseData.purchase.createdAt), purchaseData.asset.title, purchaseData.purchase.price)

        const [newInvoice] = await db.insert(invioce).values({
            id: uuid(),
            invoiceNumber,
            purchaseId: purchaseData.purchase.id,
            userId: purchaseData.user.id,
            amount: purchaseData.purchase.price,
            currency: 'USD',
            status: 'paid',
            htmlContent,
            createdAt: new Date(),
        }).returning()

        revalidatePath('/dashboard/purchases')

        return {
            success: true,
            invoiceId: newInvoice.id
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error: 'Failed to create invoice'
        }
    }
}

export async function getInvoices() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user?.id) {
        return {
            sucess: false,
            error: 'Un-Authenticated'
        }
    }
    try {
        const allInvoices = await db.select().from(invioce).where(eq(invioce.userId, session.user.id)).orderBy(invioce.createdAt)

        return {
            success: true,
            invoices: allInvoices
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error: 'Failed to get invoices'
        }
    }
}

export async function getInvoiceHtml(invoiceId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user?.id) {
        return {
            sucess: false,
            error: 'Un-Authenticated'
        }
    }
    try {

        const [invoice] = await db.select().from(invioce).where(eq(invioce.id, invoiceId)).limit(1)

        if (!invoice) {
            return {
                success: false,
                error: 'Invoice not found'
            }
        }
        if (invoice.userId !== session.user.id && session.user.role !== 'admin') {
            return {
                success: false,
                error: 'Un-Authorized'
            }
        }

        if (!invioce.htmlContent) {
            return {
                success: false,
                error: 'Invoice Html content not found'
            }
        }

        return {
            success: true,
            invoiceData: invoice.htmlContent
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error: 'Invoice Html content not found'
        }
    }

}
export async function getInvoiceById(invoiceId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user?.id) {
        return {
            sucess: false,
            error: 'Un-Authenticated'
        }
    }
    try {

        const [invoice] = await db.select().from(invioce).where(eq(invioce.id, invoiceId)).limit(1)

        if (!invoice) {
            return {
                success: false,
                error: 'Invoice not found'
            }
        }
        if (invoice.userId !== session.user.id && session.user.role !== 'admin') {
            return {
                success: false,
                error: 'Un-Authorized'
            }
        }

        return {
            success: true,
            invoiceData: invoice
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error: 'Invoice not found'
        }
    }

}