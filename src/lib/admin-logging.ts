// Utility functions for admin activity logging
import supabase from "./supabase/client";

interface LogActivityParams {
  userId: string;
  userName: string;
  action: string;
  recordId?: string;
  details?: any;
  isAdmin: boolean;
  ipAddress?: string;
  deviceInfo?: string;
}

/**
 * Logs an admin activity to the database
 */
export const logAdminActivity = async ({
  userId,
  userName,
  action,
  recordId,
  details,
  isAdmin,
  ipAddress,
  deviceInfo,
}: LogActivityParams) => {
  try {
    const { data, error } = await supabase.from("admin_activity_log").insert([
      {
        user_id: userId,
        user_name: userName,
        action,
        record_id: recordId,
        details: details ? JSON.stringify(details) : null,
        is_admin: isAdmin,
        ip_address: ipAddress,
        device_info: deviceInfo,
      },
    ]);

    if (error) {
      console.error("Error logging admin activity:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Exception logging admin activity:", error);
    return { success: false, error };
  }
};

/**
 * Get client's device info string
 */
export const getDeviceInfo = (): string => {
  const userAgent = navigator.userAgent;
  const browserInfo = extractBrowserInfo(userAgent);
  const osInfo = extractOSInfo(userAgent);
  return `${browserInfo} / ${osInfo}`;
};

/**
 * Extract browser information from user agent string
 */
const extractBrowserInfo = (userAgent: string): string => {
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg") && !userAgent.includes("OPR")) {
    return "Chrome";
  } else if (userAgent.includes("Firefox")) {
    return "Firefox";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    // This will catch both desktop Safari and Safari on iOS/iPadOS
    return "Safari";
  } else if (userAgent.includes("Edg")) {
    return "Edge";
  } else if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
    return "Opera";
  } else if (userAgent.includes("CriOS")) {
    // Chrome on iOS
    return "Chrome (iOS)";
  } else if (userAgent.includes("FxiOS")) {
    // Firefox on iOS
    return "Firefox (iOS)";
  } else if (userAgent.includes("EdgiOS")) {
    // Edge on iOS
    return "Edge (iOS)";  
  } else {
    return "Unknown Browser";
  }
};

/**
 * Extract OS information from user agent string
 */
const extractOSInfo = (userAgent: string): string => {
  if (userAgent.includes("Windows")) {
    return "Windows";
  } else if (userAgent.includes("Mac")) {
    return "Mac";
  } else if (userAgent.includes("Linux")) {
    return "Linux";
  } else if (userAgent.includes("Android")) {
    return "Android";
  } else if (
    userAgent.includes("iPhone") || 
    userAgent.includes("iPad") || 
    userAgent.includes("iPod") ||
    // Modern iPads with iPadOS may not include "iPad" in user agent
    (userAgent.includes("AppleWebKit") && 
     userAgent.includes("Mobile") && 
     userAgent.includes("Safari") &&
     !userAgent.includes("Android"))
  ) {
    return "iOS";
  } else {
    return "Unknown OS";
  }
};
