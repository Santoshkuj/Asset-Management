import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server';

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

export async function POST(request: Request) {
    try {
        const { timestamp } = await request.json()
        const signature = cloudinary.utils.api_sign_request({
            timestamp,
            folder: 'next-assetManagement'
        },
            process.env.CLOUD_API_SECRET as string
        )
        return NextResponse.json({
            signature,
            timestamp,
            apiKey: process.env.CLOUD_API_KEY
        })
    } catch (error) {
        console.log('cloudinary signature error', error);
        return NextResponse.json({
            error: 'Failed to generate signature',
        }, { status: 500 })
    }
}