"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="store-container py-24"><h1 className="text-3xl font-bold">Sayfa yüklenemedi.</h1><p className="my-5">Lütfen yeniden deneyin.</p><button className="button-red" onClick={reset}>Tekrar dene</button></main>}
