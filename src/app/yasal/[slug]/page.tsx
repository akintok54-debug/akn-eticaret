import Link from "next/link";
import {notFound} from "next/navigation";
import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";
import {LEGAL_VERSION, legalDocuments, type LegalSlug} from "@/lib/legal";

export default async function LegalPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 if(!(slug in legalDocuments))notFound();
 const doc=legalDocuments[slug as LegalSlug];
 return <><StoreHeader/><main className="store-container"><div className="page-heading"><p><Link href="/">Ana sayfa</Link> / Yasal metinler</p><span className="overline">YASAL BİLGİLENDİRME</span><h1>{doc.title}</h1><p className="mt-3">Sürüm: {LEGAL_VERSION}</p></div><article className="form-panel mb-12 max-w-4xl"><div className="whitespace-pre-line leading-7 text-sm">{doc.body}</div></article></main><StoreFooter/></>;
}
