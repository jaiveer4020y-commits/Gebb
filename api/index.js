import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const pageUrl = req.query.url;
    if (!pageUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    // Fetch HTML
    const response = await fetch(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await response.text();

    // Parse with cheerio
    const $ = cheerio.load(html);
    const asiacloud = [];

    $('a[href*="hlsforge.com/?url"]').each((i, el) => {
      const raw = $(el).attr("href");
      const text = $(el).text().trim();

      // extract url=...m3u8 part and decode
      const match = raw.match(/url=([^&]+m3u8)/);
      let decoded = null;
      if (match) {
        decoded = decodeURIComponent(match[1]);
      }

      asiacloud.push({ text, raw, m3u8: decoded });
    });

    res.status(200).json({
      source: pageUrl,
      total: asiacloud.length,
      asiacloud
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
