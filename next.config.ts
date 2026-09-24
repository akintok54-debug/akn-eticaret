import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{source:"/yonetici-giris",headers:[{key:"X-Robots-Tag",value:"noindex, nofollow"},{key:"Cache-Control",value:"no-store"}]},{source:"/sifre-sifirla/:path*",headers:[{key:"Referrer-Policy",value:"no-referrer"},{key:"X-Robots-Tag",value:"noindex, nofollow"},{key:"Cache-Control",value:"no-store"}]},{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};

export default nextConfig;
