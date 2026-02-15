"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  toggleServiceListingStatus,
  deleteServiceListing,
} from "@/actions/service-listings";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { serviceListingStatusKey } from "@/lib/i18n-constants";
import { PlusCircle, Pencil, Trash2, Pause, Play } from "lucide-react";
import Link from "next/link";
import type { ServiceListingStatus } from "@/lib/types/database";
import { useTranslations } from "next-intl";

type ServiceListing = {
  id: string;
  title: string;
  category: string;
  starting_price: number;
  status: ServiceListingStatus;
};

export default function ContractorServicesPage() {
  const t = useTranslations();
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ServiceListing | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("service_listings")
        .select("id, title, category, starting_price, status")
        .order("created_at", { ascending: false });
      setListings((data ?? []) as ServiceListing[]);
      setLoading(false);
    }
    load();
  }, []);

  async function handleToggle(id: string) {
    await toggleServiceListingStatus(id);
    setListings((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, status: l.status === "active" ? "paused" : "active" }
          : l
      )
    );
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteServiceListing(deleteTarget.id);
    setListings((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("services.myServices")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("services.manageListings")}
          </p>
        </div>
        <Link
          href="/contractor/services/new"
          className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
        >
          <PlusCircle className="h-4 w-4" />
          {t("services.addService")}
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border-t py-16">
          <p className="text-sm text-muted-foreground">
            {t("services.noListingsYet")}
          </p>
          <Link
            href="/contractor/services/new"
            className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
          >
            <PlusCircle className="h-4 w-4" />
            {t("services.createFirstService")}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center justify-between border p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{listing.title}</h3>
                  <Badge
                    variant={
                      listing.status === "active" ? "default" : "secondary"
                    }
                  >
                    {t(serviceListingStatusKey(listing.status))}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {listing.category} &middot;{" "}
                  {t("services.startingAt", { price: formatCurrency(listing.starting_price) })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggle(listing.id)}
                  title={
                    listing.status === "active" ? t("services.pause") : t("services.activate")
                  }
                >
                  {listing.status === "active" ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Link href={`/contractor/services/${listing.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(listing)}
                >
                  <Trash2 className="h-4 w-4 text-danger-red" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("services.deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {t("services.deleteConfirmDesc", { title: deleteTarget?.title ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? t("services.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
