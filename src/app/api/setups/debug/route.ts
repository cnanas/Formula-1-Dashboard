import { NextResponse } from "next/server";

const F126_URL =
  "https://docs.google.com/spreadsheets/d/1mmFai7jDGYpZ2cc_PBk3PBrpUFgbjEzB7z-q5P2VlFE/export?format=csv&gid=673562173";

export async function GET() {
  try {
    // Step 1: try with redirect:manual to see what Google returns
    const r1 = await fetch(F126_URL, { cache: "no-store", redirect: "manual" });
    const location = r1.headers.get("location") ?? "none";

    // Step 2: follow the redirect manually
    let r2status = 0;
    let r2type = "";
    let r2preview = "";
    if (location !== "none") {
      try {
        const r2 = await fetch(location, { cache: "no-store" });
        r2status = r2.status;
        r2type = r2.headers.get("content-type") ?? "";
        r2preview = (await r2.text()).substring(0, 200);
      } catch (e2) {
        r2preview = `redirect fetch error: ${String(e2)}`;
      }
    }

    // Step 3: try following redirects automatically
    const r3 = await fetch(F126_URL, { cache: "no-store" });
    const r3preview = (await r3.text()).substring(0, 200);

    return NextResponse.json({
      step1: { status: r1.status, location: location.substring(0, 120) },
      step2: { status: r2status, contentType: r2type, preview: r2preview },
      step3: { status: r3.status, ok: r3.ok, preview: r3preview },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
