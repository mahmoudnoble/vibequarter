import { ImageResponse } from "next/og";

export const alt = "VibeQuarter — premium websites for the niches we know best";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#FFFFFF",
          backgroundImage:
            "radial-gradient(800px 420px at 80% 110%, rgba(91,91,242,0.22), transparent), radial-gradient(700px 420px at 15% 120%, rgba(16,185,129,0.22), transparent)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: "64px", height: "64px", gap: "6px" }}>
            <div style={{ width: "29px", height: "29px", borderRadius: "8px", background: "#0A0F16" }} />
            <div style={{ width: "29px", height: "29px", borderRadius: "8px", background: "#10B981" }} />
            <div style={{ width: "29px", height: "29px", borderRadius: "8px", background: "#0A0F16" }} />
            <div style={{ width: "29px", height: "29px", borderRadius: "8px", background: "#0A0F16" }} />
          </div>
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#0A0F16", letterSpacing: "-1px" }}>vibequarter</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "76px", fontWeight: 700, color: "#0A0F16", lineHeight: 1.05, letterSpacing: "-3px", maxWidth: "900px" }}>
            From a sentence to
          </div>
          <div style={{ fontSize: "76px", fontWeight: 700, color: "#0E9C6D", lineHeight: 1.05, letterSpacing: "-3px" }}>
            a site that books.
          </div>
          <div style={{ marginTop: "26px", fontSize: "28px", color: "#44525F", maxWidth: "820px" }}>
            Premium websites & AI WhatsApp booking — built for clinics, salons, law firms & more.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: "22px", color: "#5F6F81", letterSpacing: "2px" }}>
          // WEB · APPS · AI AUTOMATION
        </div>
      </div>
    ),
    { ...size },
  );
}
