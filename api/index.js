import fetch from "node-fetch";
import * as cheerio from "cheerio";

function extractAsiaCloudLinks(html) {
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

  return asiacloud;
}

export default async function handler(req, res) {
  try {
    const pageUrl = req.query.url;
    if (!pageUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    // First fetch
    const response1 = await fetch(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html1 = await response1.text();
    let asiacloud = extractAsiaCloudLinks(html1);

    // Retry after 3s if none found
    if (asiacloud.length === 0) {
      await new Promise(r => setTimeout(r, 3000));
      const response2 = await fetch(pageUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const html2 = await response2.text();
      asiacloud = extractAsiaCloudLinks(html2);
    }

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
