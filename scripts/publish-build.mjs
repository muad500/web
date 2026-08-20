import { copyFile, cp, mkdir } from "node:fs/promises";

await mkdir("assets", { recursive: true });
await copyFile("dist/source.html", "index.html");
await cp("dist/assets", "assets", { recursive: true, force: true });
