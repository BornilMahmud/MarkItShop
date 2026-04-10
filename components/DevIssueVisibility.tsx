"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const DevIssueVisibility = () => {
  const pathname = usePathname();

  useEffect(() => {
    const panel = pathname?.startsWith("/admin") ? "admin" : "public";
    document.body.setAttribute("data-panel", panel);

    return () => {
      document.body.removeAttribute("data-panel");
    };
  }, [pathname]);

  return null;
};

export default DevIssueVisibility;
