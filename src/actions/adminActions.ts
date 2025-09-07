'use server'

import { auth } from "@/lib/auth"
import { db } from "@/lib/db/db"
import { asset, category, user } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

const CategorySchema = z.object({
    name: z.string().min(2, 'Category name min 2 charactors').max(50, 'Category name max 50 charactors')
})

export type CategoryFormValues = z.infer<typeof CategorySchema>

export async function addNewCategory(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized')
    }
    try {
        const name = formData.get('name') as string
        const validateField = CategorySchema.parse({ name })
        const existingCategory = await db.select().from(category).where(eq(category.name, validateField.name)).limit(1)

        if (existingCategory.length > 0) {
            return {
                success: false,
                message: 'Category already exists'
            }
        }
        await db.insert(category).values({
            name: validateField.name
        })
        revalidatePath('/admin/settings')
        return {
            success: true,
            message: 'Category added'
        }

    } catch (error) {
        console.log(error);
        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: error.issues[0].message
            }
        }
        return {
            success: false,
            message: 'Failed to add category'
        }
    }
}

export async function getAllCategories() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user || session.user.role !== 'admin') {
            throw new Error('Unauthorized')
        }
        return await db.select().from(category).orderBy(category.name)
    } catch (error) {
        console.log(error);
        return []
    }
}

export async function getTotalUserCount() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized')
    }
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(user)
        return result[0]?.count || 0;
    } catch (error) {
        console.log(error);
        return 0
    }
}

export async function deleteCategory(categoryId: number) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized')
    }
    try {
        await db.delete(category).where(eq(category.id, categoryId))
        revalidatePath('/admin/settings')
        return {
            success: true,
            message: 'Category deleted'
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: 'Failed to delete category'
        }
    }
}

export async function getTotalAssets() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized')
    }
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(asset)
        return result[0]?.count || 0;
    } catch (error) {
        console.log(error);
        return 0
    }
}

export async function approveAsset(assetId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized')
    }
    try {
        await db.update(asset).set({ isApproved: 'approved', updatedAt: new Date() }).where(eq(asset.id, assetId))
        revalidatePath('/admin/assetsApproval')

        return {
            success: true
        }
    } catch (error) {
        console.log(error);
        return {
            success: false
        }
    }
}
export async function rejectAsset(assetId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized')
    }
    try {
        await db.update(asset).set({ isApproved: 'rejected', updatedAt: new Date() }).where(eq(asset.id, assetId))
        revalidatePath('/admin/assetsApproval')

        return {
            success: true
        }
    } catch (error) {
        console.log(error);
        return {
            success: false
        }
    }
}

export async function getPendingAssets() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized')
    }
    try {
        const pendingAssets = await db.select({
            asset: asset,
            userName: user.name
        }).from(asset).leftJoin(user, eq(asset.userId, user.id)).where(eq(asset.isApproved, 'pending'))

        return pendingAssets
    } catch (error) {
        console.log(error);
        return []
    }
}