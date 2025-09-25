import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    // reconstruct the full URL passed in ?url=
    const base = `http://${req.headers.host}`;
    const fullReqUrl = new URL(req.url, base);
    let pageUrl = fullReqUrl.searchParams.get("url");

    if (!pageUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    // If it's still encoded (starts with https%3A), decode it
    if (pageUrl.startsWith("http") === false) {
      pageUrl = decodeURIComponent(pageUrl);
    }

    // Validate absolute URL
    try {
      new URL(pageUrl);
    } catch {
      return res.status(400).json({ error: "Invalid url parameter" });
    }

    // wait 5 seconds before scraping
    await new Promise(r => setTimeout(r, 5000));

    // fetch page
    const response = await fetch(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await response.text();

    // parse with cheerio
    const $ = cheerio.load(html);
    const asiacloud = [];

    $('a[href*="hlsforge.com/?url"]').each((i, el) => {
      const raw = $(el).attr("href");
      const text = $(el).text().trim();

      const match = raw.match(/url=([^&]+m3u8)/);
      let decoded = null;
      if (match) decoded = decodeURIComponent(match[1]);

      asiacloud.push({ text, raw, m3u8: decoded });
    });

    res.status(200).json({
      source: pageUrl,
      total: asiacloud.length,
      asiacloud
    });
  } catch (err) {
    console.error("SCRAPER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
