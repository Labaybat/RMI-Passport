import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";

export function useAdminGuard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
        navigate({ to: "/dashboard" });
      }
    }
  }, [user, profile, loading, navigate]);
}
