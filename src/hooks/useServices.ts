import { useState, useEffect, useCallback } from "react";
import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "@/db/client";
import { services, serviceCategories } from "@/db/schema";
import { useAuthStore } from "@/stores/auth.store";
import {
  PREDEFINED_CATEGORIES,
  type CategoryInfo,
} from "@/constants/serviceCategories";
import type { ServiceItem, ServiceCategoryRow, PricingType } from "@/types/models";

export interface ServiceInput {
  name: string;
  categoryKey: string;
  pricingType: PricingType;
  price?: number;
  packagePrice?: number;
}

export function useServices() {
  const cloudUserId = useAuthStore((s) => s.cloudUserId);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [customCategories, setCustomCategories] = useState<ServiceCategoryRow[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [svc, cats] = await Promise.all([
        db.select().from(services),
        db.select().from(serviceCategories),
      ]);
      setItems(svc as ServiceItem[]);
      setCustomCategories(cats as ServiceCategoryRow[]);
    } catch (e) {
      console.error("useServices load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Predefined categories + the user's custom ones (custom key = its row id).
  const allCategories: CategoryInfo[] = [
    ...PREDEFINED_CATEGORIES,
    ...customCategories.map((c) => ({
      key: c.id,
      label: c.label,
      icon: c.icon,
    })),
  ];

  const categoryInfo = useCallback(
    (key: string): CategoryInfo =>
      allCategories.find((c) => c.key === key) ?? {
        key,
        label: "Otros",
        icon: "ellipsis-horizontal-outline",
      },
    [allCategories]
  );

  const addService = useCallback(
    async (input: ServiceInput): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await db.insert(services).values({
          id: randomUUID(),
          userId: cloudUserId ?? undefined,
          name: input.name.trim(),
          categoryKey: input.categoryKey,
          pricingType: input.pricingType,
          price: input.price,
          packagePrice: input.packagePrice,
          createdAt: now,
          updatedAt: now,
        });
        await refresh();
        return true;
      } catch (e) {
        console.error("addService error:", e);
        return false;
      }
    },
    [cloudUserId, refresh]
  );

  const updateService = useCallback(
    async (id: string, input: ServiceInput): Promise<boolean> => {
      try {
        await db
          .update(services)
          .set({
            name: input.name.trim(),
            categoryKey: input.categoryKey,
            pricingType: input.pricingType,
            price: input.price,
            packagePrice: input.packagePrice,
            updatedAt: new Date().toISOString(),
            syncedAt: null,
          })
          .where(eq(services.id, id));
        await refresh();
        return true;
      } catch (e) {
        console.error("updateService error:", e);
        return false;
      }
    },
    [refresh]
  );

  const deleteService = useCallback(
    async (id: string): Promise<void> => {
      try {
        await db.delete(services).where(eq(services.id, id));
        await refresh();
      } catch (e) {
        console.error("deleteService error:", e);
      }
    },
    [refresh]
  );

  const addCategory = useCallback(
    async (label: string, icon: string): Promise<string | null> => {
      try {
        const id = randomUUID();
        const now = new Date().toISOString();
        await db.insert(serviceCategories).values({
          id,
          userId: cloudUserId ?? undefined,
          label: label.trim(),
          icon,
          createdAt: now,
          updatedAt: now,
        });
        await refresh();
        return id;
      } catch (e) {
        console.error("addCategory error:", e);
        return null;
      }
    },
    [cloudUserId, refresh]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      try {
        await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
        await refresh();
      } catch (e) {
        console.error("deleteCategory error:", e);
      }
    },
    [refresh]
  );

  return {
    services: items,
    customCategories,
    allCategories,
    categoryInfo,
    loading,
    refresh,
    addService,
    updateService,
    deleteService,
    addCategory,
    deleteCategory,
  };
}
