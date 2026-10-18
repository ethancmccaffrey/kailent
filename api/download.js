const crypto = require("crypto");

const ASSETS = {
  logo: {
    url: "https://github.com/ethancmccaffrey/kailent/releases/download/logo/Kailent-logo.png",
    type: "brand_asset",
  },

  // Add future releases here:
  // "canadian-backcountry-1": {
  //   url: "YOUR_VERIFIED_GITHUB_RELEASE_ASSET_URL",
  //   type: "komic",
  // },
};

module.exports = async function handler(req, res) {
  const slug =
    typeof req.query.asset === "string" ? req.query.asset : "";

  const asset = ASSETS[slug];

  if (!asset) {
    return res.status(404).send("Download not found.");
  }

  const token = process.env.POSTHOG_PROJECT_TOKEN;
  const host = (
    process.env.POSTHOG_HOST || "https://us.i.posthog.com"
  ).replace(/\/+$/, "");

  if (token) {
    try {
      const response = await fetch(`${host}/i/v0/e/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: token,
          event: "download_requested",
          distinct_id: `kailent-download-${crypto.randomUUID()}`,
          properties: {
            asset_slug: slug,
            asset_type: asset.type,
            source: "kailent_website",
          },
        }),
      });

      if (!response.ok) {
        console.error(
          "PostHog capture failed with status:",
          response.status
        );
      }
    } catch (error) {
      // Keep the download available if analytics is temporarily down.
      console.error("PostHog capture failed:", error.message);
    }
  } else {
    console.error("POSTHOG_PROJECT_TOKEN is not configured.");
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Location", asset.url);

  return res.status(302).end();
};
