import { getAssetById } from "@/actions/dashboardActions";
import { checkExistingPurchase, createOrder } from "@/actions/paymentActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import {
  CheckCircle,
  Download,
  Info,
  Loader,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const GalleryDetails = async ({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) => {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <Details assetId={id} searchParams={searchParams} />
    </Suspense>
  );
};
export default GalleryDetails;

async function Details({
  assetId,
  searchParams,
}: {
  assetId: string;
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const result = await getAssetById(assetId);
  if (session && session?.user?.role === "admin") {
    redirect("/");
  }
  if (!result) {
    notFound();
  }

  const { success, error, failed } = await searchParams;

  const { asset, categoryName, userId, userImage, userName } = result;
  const isAuthor = session?.user.id === userId;
  const initials = userName?.charAt(0).toUpperCase() || "U";
  const hasPurchased = session?.user?.id
    ? await checkExistingPurchase(assetId)
    : false;

  async function handlePurchase() {
    "use server";
    const result = await createOrder(assetId);
    if (result?.alreadyPurchased) {
      redirect(`/gallery/${assetId}?success=true`);
    }
    if (result?.approvalLink) {
      redirect(result.approvalLink);
    }
  }
  return (
    <div className="min-h-screen container px-4 bg-white">
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-700 rounded-lg border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p>purchase Successfully! You can now download this asset</p>
        </div>
      )}
      <div className="container py-12">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            <div className="rounded-lg overflow-hidden max-w-2xl bg-gray-100 border">
              <div className="relative w-full">
                <Image
                  src={asset.fileUrl}
                  alt={asset.title}
                  width={1000}
                  height={800}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>
            <div className="flex items-center justify-between max-w-2xl ">
              <div>
                <h1 className="text-3xl font-bold">{asset?.title}</h1>
                {categoryName && (
                  <Badge className="mt-2 bg-gray-200 text-gray-700 hover:bg-gray-300">
                    <Tag className="mr-1 h-4 w-4" />
                    {categoryName}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm">{userName}</p>
                <p className="text-xs text-gray-500">Creator</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="sticky top-24">
              <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white rounded-t-xl">
                  <h3 className="text-xl font-bold mb-2">Premium Asset</h3>
                  <div>
                    <span className="text-3xl font-bold">$5.00</span>
                    <span className="ml-2 text-gray-300">
                      One time purchase
                    </span>
                  </div>
                </div>
                <CardContent>
                  <div className="space-y-4">
                    {session?.user ? (
                      isAuthor ? (
                        <div className="bg-blue-50 text-blue-700 p-5 rounded-lg flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
                          <p className="text-sm">
                            Your asset, You can&lsquo;t buy
                          </p>
                        </div>
                      ) : hasPurchased ? (
                        <Button
                          asChild
                          className="w-full bg-green-600 text-white h-12"
                        >
                          <a href={`/api/download/${assetId}`} download>
                            <Download className="mr-2 w-6 h-6" />
                            Download Asset
                          </a>
                        </Button>
                      ) : (
                        <form action={handlePurchase}>
                          <Button
                            type="submit"
                            className="w-full bg-black text-white h-12"
                          >
                            <ShoppingCart className="mr-2 w-6 h-6" />
                            Purchase Now
                          </Button>
                        </form>
                      )
                    ) : (
                      <>
                        <Button
                          asChild
                          className="w-full bg-black text-white h-12"
                        >
                          <Link href={"/login"}>Sign in to purchase</Link>
                        </Button>
                      </>
                    )}
                  </div>
                  <form action={handlePurchase}>
                    <Button
                      type="submit"
                      className="w-full bg-black text-white h-12"
                    >
                      <ShoppingCart className="mr-2 w-6 h-6" />
                      Purchase Now
                    </Button>
                  </form>
                </CardContent>
              </Card>
              {hasPurchased && (
                <Button asChild className="w-full bg-green-600 text-white h-12">
                  <a href={`/api/download/${assetId}`} download>
                    <Download className="mr-2 w-6 h-6" />
                    Download Asset
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
