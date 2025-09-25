import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Helper: decode deeply (handles % encoding multiple times)
function deepDecode(url) {
  let prev, curr = url;
  try {
    do {
      prev = curr;
      curr = decodeURIComponent(curr);
    } while (curr !== prev);
    return curr;
  } catch {
    return curr;
  }
}

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing ?url=" });
  }

  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RivestreamScraper/1.0)" }
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    let links = [];

    $("a[href]").each((_, el) => {
      const text = $(el).text().trim();
      const rawHref = $(el).attr("href");
      if (!rawHref) return;

      // decode deeply if contains %3A or %2F etc.
      const decoded = deepDecode(rawHref);

      links.push({
        text,
        raw: rawHref,
        decoded
      });
    });

    // Special filter: asiacloud links
    const asiacloud = links.filter(l => l.raw.includes("asiacloud"));

    res.json({
      source: url,
      totalLinks: links.length,
      asiacloud,
      allLinks: links
    });

  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}
