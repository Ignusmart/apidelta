import { ImageResponse } from "next/og";
import { OgImageContent } from "./_components/og-image-content";

export const runtime = "edge";
export const alt = "APIDelta — AI-Powered API Change Monitoring";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  return new ImageResponse(<OgImageContent />, { ...size });
}
