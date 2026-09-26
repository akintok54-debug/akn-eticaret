import { adminGuard } from "@/lib/admin";
import { processDueSubscriptions } from "@/lib/subscriptions";

async function handle(request:Request){
 const auth=request.headers.get("authorization");
 const cronOk=!!process.env.CRON_SECRET&&auth==="Bearer "+process.env.CRON_SECRET;
 if(!cronOk){
  const denied=adminGuard(request);
  if(denied)return denied;
 }
 const results=await processDueSubscriptions();
 return Response.json({success:true,processed:results.length,results},{headers:{"Cache-Control":"no-store"}});
}
export async function GET(request:Request){return handle(request);}
export async function POST(request:Request){return handle(request);}
