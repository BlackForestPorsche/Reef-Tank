import {
  addFakeHelm,
  addFakeSightglass,
  getProvision,
  resetProvision,
  seedDemo,
} from "@/server/dummy-hub";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    demo: true,
    provision: getProvision(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    name?: string;
  };
  try {
    switch (body.action) {
      case "seed":
        return Response.json({ provision: seedDemo() });
      case "add-helm":
        return Response.json({ provision: addFakeHelm() });
      case "add-sightglass":
        return Response.json({
          provision: getProvision(),
          panel: addFakeSightglass(body.name),
        });
      case "clear":
        return Response.json({ provision: resetProvision() });
      default:
        return Response.json({ error: "Unknown demo action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Demo failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
