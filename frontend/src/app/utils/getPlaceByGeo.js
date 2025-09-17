import { Ga_Maamli } from "next/font/google";

export async function getPlaceName(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          "User-Agent": "SmartLinkApp/1.0 (rahulsingh.dev.36@Ga_Maamli.com)",
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch place name");
    }

     const data = await res.json();
    const addr = data.address || {};

    // Try multiple fields in order of preference
    return (
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.county ||   // new fallback
      addr.state ||    // new fallback
      data.display_name ||
      "Unknown Location"
    );
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return "Unknown Location";
  }
}
