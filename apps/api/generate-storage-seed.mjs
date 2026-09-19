import fs from 'node:fs';
import { execSync } from 'node:child_process';

const realImagesToStore = [
  {
    key: "products/kemis-trad-01/preview.webp",
    url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=380&q=65",
    contentType: "image/jpeg",
  },
  {
    key: "products/kemis-trad-01/thumb.webp",
    url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=200&q=60",
    contentType: "image/jpeg",
  },
  {
    key: "products/kidan-men-01/preview.webp",
    url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=380&q=65",
    contentType: "image/jpeg",
  },
  {
    key: "products/shemma-jacket-01/preview.webp",
    url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=380&q=65",
    contentType: "image/jpeg",
  },
  {
    key: "products/netela-scarf-01/preview.webp",
    url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=380&q=65",
    contentType: "image/jpeg",
  },
  {
    key: "products/leather-oxford-01/preview.webp",
    url: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=380&q=65",
    contentType: "image/jpeg",
  },
  {
    key: "products/habesha-evening-01/preview.webp",
    url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=380&q=65",
    contentType: "image/jpeg",
  },
];

async function run() {
  console.log("Fetching images...");
  for (let i = 0; i < realImagesToStore.length; i++) {
    const item = realImagesToStore[i];
    console.log(`[${i + 1}/${realImagesToStore.length}] Fetching ${item.key}...`);
    const res = await fetch(item.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "image/*,*/*",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${item.url}: ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hex = buffer.toString("hex");
    const mime = res.headers.get("content-type") || item.contentType;
    const etag = `"seed-${item.key.replace(/[^a-zA-Z0-9]/g, "-")}-${buffer.length}"`;

    const sql = `INSERT INTO storage_objects (key, data, contentType, size, etag, uploadedAt)
VALUES ('${item.key}', X'${hex}', '${mime}', ${buffer.length}, '${etag}', ${Date.now()})
ON CONFLICT (key) DO UPDATE SET
  data = excluded.data,
  contentType = excluded.contentType,
  size = excluded.size,
  etag = excluded.etag,
  uploadedAt = excluded.uploadedAt;
`;

    const fileName = `seed-img-${i}.sql`;
    fs.writeFileSync(fileName, sql, "utf8");
    console.log(`Wrote ${fileName} (${buffer.length} bytes data, ${sql.length} chars SQL)`);
  }
  console.log("All seed image SQL files generated successfully.");
}

run();
