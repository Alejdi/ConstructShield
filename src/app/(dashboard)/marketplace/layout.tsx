import { MarketplaceTabs } from "@/components/marketplace/marketplace-tabs";

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <MarketplaceTabs />
      {children}
    </div>
  );
}
