import { chromium } from "playwright-core";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing ?url=" });
  }

  let browser;
  try {
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    // wait for 2-3 seconds to let JS build links
    await page.waitForTimeout(3000);

    const html = await page.content();
    const $ = cheerio.load(html);

    let links = [];

    $("a[href]").each((_, el) => {
      const text = $(el).text().trim();
      const raw = $(el).attr("href");
      if (!raw) return;

      links.push({
        text,
        raw,
        decoded: decodeURIComponent(raw)
      });
    });

    const asiacloud = links.filter(l => l.raw.includes("asiacloud"));

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      source: url,
      totalLinks: links.length,
      asiacloud,
      allLinks: links
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
}
