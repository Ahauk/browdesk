import { useState, useEffect, useCallback } from "react";
import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "@/db/client";
import { userProfile } from "@/db/schema";
import type { UserProfile } from "@/types/models";

const PROFILE_ID = "main";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const [result] = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, PROFILE_ID))
        .limit(1);

      if (result) {
        setProfile(result as UserProfile);
      } else {
        // Create default profile
        const now = new Date().toISOString();
        const defaultProfile: UserProfile = {
          id: PROFILE_ID,
          name: "Carolina Vazquez",
          biometricEnabled: true,
          createdAt: now,
          updatedAt: now,
        };
        await db.insert(userProfile).values(defaultProfile);
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (
      input: Partial<Omit<UserProfile, "id" | "createdAt">>
    ): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await db
          .update(userProfile)
          .set({ ...input, updatedAt: now })
          .where(eq(userProfile.id, PROFILE_ID));
        await fetchProfile();
        return true;
      } catch (error) {
        console.error("Error updating profile:", error);
        return false;
      }
    },
    [fetchProfile]
  );

  return {
    profile,
    loading,
    updateProfile,
    refresh: fetchProfile,
  };
}
