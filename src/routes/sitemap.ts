import { Router } from "express";
import { config } from "../config/config";
import { Product } from "../product/productModel";

const router = Router();

router.get("/sitemap.xml", async (req, res) => {
  res.header("Content-Type", "application/xml");

  const BASE_URL = config.buildDomain || 'http://localhost:5173';

  // 🔹 Public pages ONLY
  const staticRoutes = [
    "/home",
    "/product/1"
  ];

  const staticUrls = staticRoutes.map(route => `
    <url>
      <loc>${BASE_URL}${route}</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
  `).join("");

  // 🔹 Dynamic product URLs
  const products = await Product.find().select("_id");

  const productUrls = products.map(p => `
    <url>
      <loc>${BASE_URL}/products/${p._id}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `).join("");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${productUrls}
</urlset>`);
});

export default router;
