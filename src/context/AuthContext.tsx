"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Role, Profile, ModuleKey, RoleType } from "@/types";
import { getDatabase, INITIAL_DATABASE_STATE } from "@/lib/data-store";

interface AuthContextType {
  currentUser: User | null;
  currentRole: Role | null;
  currentProfile: Profile | null;
  allowedModules: Record<ModuleKey, boolean>;
  isSystemAdmin: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  loginAs: (userId: string) => void;
  hasAccess: (moduleKey: ModuleKey) => boolean;
  allUsers: User[];
  reloadAuth: () => void;
}

const defaultModules: Record<ModuleKey, boolean> = {
  users: true,
  roles: true,
  roles_profiles: true,
  profiles: true,
  categories: true,
  order_statuses: true,
  form_types: true,
  custom_forms: true,
  custom_tables: true,
  renders: true,
  products: true,
  orders: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_DATABASE_STATE.users[0]);
  const [currentRole, setCurrentRole] = useState<Role | null>(INITIAL_DATABASE_STATE.roles[0]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(INITIAL_DATABASE_STATE.profiles[0]);
  const [allowedModules, setAllowedModules] = useState<Record<ModuleKey, boolean>>(defaultModules);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_DATABASE_STATE.users);

  const loadUserData = (preferredUserId?: string) => {
    const db = getDatabase();
    setAllUsers(db.users);

    const savedUserId = preferredUserId || (typeof window !== "undefined" ? localStorage.getItem("grabamil_active_uid") : null);
    const userToSet = db.users.find((u) => u.id === savedUserId) || db.users[0]; // Default to System Admin

    if (userToSet) {
      setCurrentUser(userToSet);
      if (typeof window !== "undefined") {
        localStorage.setItem("grabamil_active_uid", userToSet.id);
      }

      const role = db.roles.find((r) => r.id === userToSet.roleId) || null;
      setCurrentRole(role);

      if (role) {
        const association = db.rolesProfiles.find((rp) => rp.roleId === role.id);
        const profile = association ? db.profiles.find((p) => p.id === association.profileId) : null;
        setCurrentProfile(profile || null);

        // Calculate allowed modules
        if (role.type === "system_admin") {
          // System admin has access to everything
          const fullAccess: Record<ModuleKey, boolean> = {
            users: true,
            roles: true,
            roles_profiles: true,
            profiles: true,
            categories: true,
            order_statuses: true,
            form_types: true,
            custom_forms: true,
            custom_tables: true,
            renders: true,
            products: true,
            orders: true,
          };
          setAllowedModules(fullAccess);
        } else if (profile) {
          setAllowedModules(profile.modules);
        } else {
          setAllowedModules({} as any);
        }
      }
    }
  };

  useEffect(() => {
    loadUserData();

    // Iniciar sincronización en tiempo real con Cloud Firestore
    let unsubscribeFirestore: (() => void) | undefined;
    import("@/lib/firebase/firestore-sync")
      .then((m) => {
        unsubscribeFirestore = m.initFirestoreSync(() => {
          loadUserData();
        });
      })
      .catch((err) => console.warn("Firestore sync init warning:", err));

    const handleDbChange = () => {
      loadUserData();
    };

    window.addEventListener("grabamil_db_changed", handleDbChange);
    return () => {
      window.removeEventListener("grabamil_db_changed", handleDbChange);
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const loginAs = (userId: string) => {
    loadUserData(userId);
  };

  const hasAccess = (moduleKey: ModuleKey): boolean => {
    if (!currentRole) return false;
    if (currentRole.type === "system_admin") return true;
    return !!allowedModules[moduleKey];
  };

  const roleType = currentRole?.type;
  const isSystemAdmin = roleType === "system_admin";
  const isAdmin = roleType === "admin";
  const isAgent = roleType === "agent";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        currentProfile,
        allowedModules,
        isSystemAdmin,
        isAdmin,
        isAgent,
        loginAs,
        hasAccess,
        allUsers,
        reloadAuth: () => loadUserData(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

