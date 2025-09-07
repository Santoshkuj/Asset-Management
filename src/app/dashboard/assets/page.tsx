import { getCategories, getUserAssets } from "@/actions/dashboardActions";
import AssetGrid from "@/components/dashboard/assetGrid";
import UploadAsset from "@/components/dashboard/uploadAsset";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const AssetsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session === null) {
    return null
  }
  const [categories, assets] = await Promise.all([
    getCategories(),
    getUserAssets(session?.user?.id),
  ]);
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold">My Assets</h1>
        <UploadAsset categories={categories || []} />
      </div>
      <AssetGrid assets={assets}/>
    </div>
  );
};
export default AssetsPage;
