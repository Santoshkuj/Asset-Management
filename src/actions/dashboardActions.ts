'use server'

import { auth } from "@/lib/auth";
import { db } from "@/lib/db/db";
import { asset, category, user } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

const AssetSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    categoryId: z.number().positive('Please select a category'),
    fileUrl: z.url('Invalid file url'),
    thumbnailUrl: z.url('Invalid file url').optional()
})

export async function getCategories() {
    try {
        return await db.select().from(category)
    } catch (error) {
        console.log(error);
        return []
    }
}

export async function uploadAsset(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        throw new Error('Un-Authenticated')
    }
    try {
        const validatefields = AssetSchema.parse({
            title: formData.get('title'),
            description: formData.get('description'),
            categoryId: Number(formData.get('categoryId')),
            fileUrl: formData.get('fileUrl'),
            thumbnailUrl: formData.get('thumbnailUrl') || formData.get('fileUrl'),
        })
        await db.insert(asset).values({
            title: validatefields.title,
            description: validatefields.description,
            categoryId: validatefields.categoryId,
            fileUrl: validatefields.fileUrl,
            thumbnailUrl: validatefields.thumbnailUrl,
            isApproved: 'pending',
            userId: session.user.id,
        })
        revalidatePath('/dashboard/assets')
        return {
            success: true
        }
    } catch (error) {
        console.log(error);
        return {
            success: true,
            error: 'Failed to upload'
        }
    }
}

export async function getUserAssets(userId: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            throw new Error('Un-Authenticated')
        }
        return await db.select().from(asset).where(eq(asset.userId, userId)).orderBy(asset.createdAt)
    } catch (error) {
        return []
    }
}

export async function getPublicAssets(categoryId?: number) {
    try {
        let conditions = and(eq(asset.isApproved, 'approved'))
        if (categoryId) {
            conditions = and(conditions, eq(asset.categoryId, categoryId))
        }

        const query = await db.select({
            asset: asset,
            categoryName: category.name,
            userName: user.name
        }).from(asset).leftJoin(category, eq(asset.categoryId, category.id)).leftJoin(user, eq(asset.userId, user.id)).where(conditions)

        return query

    } catch (error) {
        console.log(error);
        return [];
    }
}

export async function getAssetById(assetId: string) {
    try {
        const [result] = await db.select({
            asset: asset,
            categoryName: category.name,
            userName: user.name,
            userImage: user.image,
            userId: user.id
        }).from(asset).leftJoin(category, eq(asset.categoryId, category.id)).leftJoin(user, eq(asset.userId, user.id)).where(eq(asset.id, assetId))

        return result

    } catch (error) {
        console.log(error);
        return null
    }
}