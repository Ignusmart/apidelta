/**
 * Shared OG image JSX used by both opengraph-image.tsx and twitter-image.tsx.
 * These files must live in the app root as separate route-level exports
 * (Next.js convention), but the visual content is identical.
 */
export function OgImageContent() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* Logo + name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span
          style={{ fontSize: "48px", fontWeight: 700, color: "#ffffff" }}
        >
          DriftWatch
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          display: "flex",
          fontSize: "28px",
          fontWeight: 500,
          color: "#d4d4d8",
          textAlign: "center",
          maxWidth: "800px",
          lineHeight: 1.4,
        }}
      >
        AI-Powered API Change Monitoring
      </div>

      {/* Subline */}
      <div
        style={{
          display: "flex",
          fontSize: "18px",
          color: "#a1a1aa",
          marginTop: "16px",
          textAlign: "center",
          maxWidth: "700px",
        }}
      >
        Monitor changelogs. Classify breaking changes. Alert your team.
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          fontSize: "16px",
          color: "#71717a",
        }}
      >
        <span>driftwatch.dev</span>
        <span style={{ color: "#3f3f46" }}>|</span>
        <span>From $49/mo</span>
        <span style={{ color: "#3f3f46" }}>|</span>
        <span>14-day free trial</span>
      </div>
    </div>
  );
}
