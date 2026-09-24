import {publicSeo} from "@/lib/site-configuration";
export const dynamic="force-dynamic";
export async function GET(){const seo=await publicSeo();return new Response("# "+seo.siteTitle+"\n\n"+seo.siteDescription+"\n\n"+seo.geoContent+"\n",{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"public, max-age=60"}});}
