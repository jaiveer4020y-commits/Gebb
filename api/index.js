import fetch from "node-fetch";
import * as cheerio from "cheerio";

function extractM3u8(encodedHref) {
  try {
    // Example href starts with: https://hlsforge.com/?url=ENCODED&id=...
    const urlParam = new URL(encodedHref).searchParams.get("url");
    if (!urlParam) return null;

    // Decode deeply (handles %3A%2F%2F...)
    let prev, curr = urlParam;
    do {
      prev = curr;
      curr = decodeURIComponent(curr);
    } while (curr !== prev);

    // Only keep until .m3u8
    const idx = curr.indexOf(".m3u8");
    if (idx !== -1) {
      curr = curr.substring(0, idx + 5);
    }

    return curr;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing ?url=" });
  }

  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (ScraperBot/1.0)" }
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    let results = [];

    $("a[href]").each((_, el) => {
      const text = $(el).text().trim();
      if (!/AsiaCloud/i.test(text)) return; // only AsiaCloud links

      const rawHref = $(el).attr("href");
      const m3u8 = extractM3u8(rawHref);

      results.push({
        text,
        raw: rawHref,
        m3u8
      });
    });

    res.status(200).json({
      source: url,
      asiacloud: results
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
