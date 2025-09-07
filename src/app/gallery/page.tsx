import { getCategories, getPublicAssets } from "@/actions/dashboardActions";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { Loader } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface GalleryProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}
const GalleryPage = async ({ searchParams }: GalleryProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session && session?.user?.role === "admin") {
    return redirect("/");
  }
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <GalleryContent searchParams={searchParams} />
    </Suspense>
  );
};
export default GalleryPage;

async function GalleryContent({ searchParams }: GalleryProps) {
  const search = await searchParams;
  const category = search.category;
  const categoryId = category
    ? Number.parseInt(category as string, 10)
    : undefined;

  const categories = await getCategories();
  const assets = await getPublicAssets(categoryId);
  return (
    <div className="min-h-screen container px-4 bg-white">
      <div className="sticky top-0 z-30 bg-white border-b py-3 px-4">
        <div className="container flex overflow-x-auto gap-2">
          <Button
            variant={!categoryId ? "default" : "outline"}
            size={"sm"}
            className={!categoryId ? "bg-black text-white" : ""}
          >
            <Link href={"/gallery"}>All</Link>
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={categoryId === c.id ? "default" : "outline"}
              size={"sm"}
              className={categoryId === c.id ? "bg-black text-white" : ""}
              asChild
            >
              <Link href={`/gallery?category=${c.id}`}>{c.name}</Link>
            </Button>
          ))}
        </div>
        <div className="container py-12">
          {assets.length === 0 ? (
            <p className="text-xl text-center font-bold">
              No assets uploaded! Please check in sometimes
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {assets.map(({ asset, categoryName, userName }) => (
                <Link
                  href={`/gallery/${asset.id}`}
                  key={asset.id}
                  className="block"
                >
                  <div className="group relative overflow-hidden rounded-lg aspect-square">
                    <Image
                      src={asset.fileUrl}
                      alt={asset.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-medium text-lg">
                          {asset.title}
                        </h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-white/80 text-sm">
                            {userName}
                          </span>
                          {categoryName && (
                            <span className="bg-white/25 text-white text-xs px-2 py-1 rounded-full">
                              {categoryName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
