import { checkoutSettings } from "@/lib/checkout";
import { guestSession } from "@/lib/guest-session";
export async function GET() { const settings=checkoutSettings(); if(settings.enabled)await guestSession(true); return Response.json(settings, {headers:{"Cache-Control":"no-store"}}); }
