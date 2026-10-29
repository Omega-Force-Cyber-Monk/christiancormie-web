import type { UploadedAsset } from "../schemas/truckAssets.schema";
export async function persistTruckAsset<T>({
  uploaded,
  upload,
  remember,
  persist,
  isCurrent,
}: {
  uploaded?: UploadedAsset;
  upload: () => Promise<UploadedAsset>;
  remember: (asset: UploadedAsset) => void;
  persist: (asset: UploadedAsset) => Promise<T>;
  isCurrent: () => boolean;
}) {
  const asset = uploaded ?? (await upload());
  if (!isCurrent()) throw Error("The editing session changed.");
  if (!uploaded) remember(asset);
  const result = await persist(asset);
  if (!isCurrent()) throw Error("The editing session changed.");
  return result;
}
