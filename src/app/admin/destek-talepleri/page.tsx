"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SupportMessage = {
    id: string;
    senderType: string;
    senderName: string | null;
    message: string;
    createdAt: string;
};

type SupportTicket = {
    id: string;
    ticketNumber: string;
    customerId: string | null;
    customerName: string | null;
    customerPhone: string | null;
    customerEmail: string | null;
    subject: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;

    customer: {
        id: string;
        fullName: string;
        phone: string;
        email: string | null;
    } | null;

    messages: SupportMessage[];
};

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("tr-TR");
}

function getStatusText(status: string) {
    switch (status) {
        case "open":
            return "Açık";

        case "in_progress":
            return "İşlemde";

        case "closed":
            return "Kapalı";

        default:
            return status;
    }
}

function getPriorityText(priority: string) {
    switch (priority) {
        case "low":
            return "Düşük";

        case "normal":
            return "Normal";

        case "high":
            return "Yüksek";

        case "urgent":
            return "Acil";

        default:
            return priority;
    }
}

export default function DestekTalepleriPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [replies, setReplies] = useState<Record<string, string>>({});

    useEffect(() => {
        const controller = new AbortController();
        fetch("/api/support-tickets", { cache: "no-store", signal: controller.signal })
            .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Kayıtlar alınamadı."); return data; })
            .then(data => { if (!controller.signal.aborted) { setTickets(data.tickets || []); } })
            .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Kayıtlar alınamadı."); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, []);

    async function updateTicket(
        id: string,
        field: "status" | "priority" | "message",
        value: string
    ) {
        try {
            if (savingId) return;
            setSavingId(id);
            setError("");

            const response = await fetch("/api/support-tickets", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id,
                    [field]: value,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Destek talebi güncellenemedi."
                );
            }

            if (field === "message") setReplies(current => ({ ...current, [id]: "" }));
            setTickets((currentTickets) =>
                currentTickets.map((ticket) =>
                    ticket.id === id
                        ? data.ticket
                        : ticket
                )
            );
        } catch (err) {
            console.error(err);

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Destek talebi güncellenemedi.");
            }
        } finally {
            setSavingId(null);
        }
    }

    const openCount = tickets.filter(
        (ticket) => ticket.status === "open"
    ).length;

    const progressCount = tickets.filter(
        (ticket) => ticket.status === "in_progress"
    ).length;

    const closedCount = tickets.filter(
        (ticket) => ticket.status === "closed"
    ).length;

    return (
        <main className="min-h-screen bg-slate-100 text-slate-900">
            <header className="bg-slate-950 text-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
                    <div>
                        <div className="font-black">
                            AKN YÖNETİM
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                            Üyeler / Destek Talepleri
                        </div>
                    </div>

                    <Link
                        href="/admin"
                        className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold"
                    >
                        Yönetim Paneli
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
                <h1 className="text-2xl font-black sm:text-3xl">
                    Destek Talepleri
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Müşteri ve bayilerden gelen destek taleplerini
                    görüntüleyin ve yönetin.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-bold text-slate-400">
                            AÇIK
                        </div>

                        <div className="mt-1 text-2xl font-black">
                            {openCount}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-bold text-slate-400">
                            İŞLEMDE
                        </div>

                        <div className="mt-1 text-2xl font-black">
                            {progressCount}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-bold text-slate-400">
                            KAPALI
                        </div>

                        <div className="mt-1 text-2xl font-black">
                            {closedCount}
                        </div>
                    </div>
                </div>

                {error !== "" && (
                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                        Destek talepleri yükleniyor...
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                        Henüz destek talebi bulunmuyor.
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        {tickets.map((ticket) => {
                            const customerName =
                                ticket.customer?.fullName ||
                                ticket.customerName ||
                                "Misafir";

                            const customerPhone =
                                ticket.customer?.phone ||
                                ticket.customerPhone ||
                                "-";

                            const customerEmail =
                                ticket.customer?.email ||
                                ticket.customerEmail ||
                                "-";

                            const lastMessage =
                                ticket.messages.length > 0
                                    ? ticket.messages[
                                    ticket.messages.length - 1
                                    ]
                                    : null;

                            return (
                                <article
                                    key={ticket.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                                >
                                    <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                                                    {ticket.ticketNumber}
                                                </span>

                                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                                                    {getStatusText(ticket.status)}
                                                </span>

                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                                                    {getPriorityText(ticket.priority)}
                                                </span>
                                            </div>

                                            <h2 className="mt-3 text-lg font-black">
                                                {ticket.subject}
                                            </h2>

                                            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                                <div>
                                                    <div className="text-xs font-bold text-slate-400">
                                                        MÜŞTERİ
                                                    </div>

                                                    <div className="mt-1 text-sm font-semibold">
                                                        {customerName}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs font-bold text-slate-400">
                                                        TELEFON
                                                    </div>

                                                    <div className="mt-1 text-sm font-semibold">
                                                        {customerPhone}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs font-bold text-slate-400">
                                                        E-POSTA
                                                    </div>

                                                    <div className="mt-1 break-all text-sm font-semibold">
                                                        {customerEmail}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs font-bold text-slate-400">
                                                        TARİH
                                                    </div>

                                                    <div className="mt-1 text-sm font-semibold">
                                                        {formatDate(ticket.createdAt)}
                                                    </div>
                                                </div>
                                            </div>

                                            <details className="mt-4 rounded-xl border p-4">
                                                <summary className="cursor-pointer font-bold">Detay ve Mesaj Geçmişi ({ticket.messages.length})</summary>
                                                <div className="mt-4 space-y-3">{ticket.messages.map(message => <article key={message.id} className="rounded-xl bg-slate-50 p-3">
                                                    <p className="text-xs font-bold text-slate-500">{message.senderType === "admin" ? "Yönetici" : message.senderName || "Müşteri"} · {formatDate(message.createdAt)}</p>
                                                    <p className="mt-2 whitespace-pre-wrap break-words text-sm">{message.message}</p>
                                                </article>)}</div>
                                                <form className="mt-4" onSubmit={event => { event.preventDefault(); void updateTicket(ticket.id, "message", replies[ticket.id] ?? ""); }}>
                                                    <label className="block text-sm font-bold">Yönetici Cevabı<textarea required maxLength={5000} rows={3} value={replies[ticket.id] ?? ""} onChange={event => setReplies(current => ({ ...current, [ticket.id]: event.target.value }))} className="mt-2 w-full rounded-xl border p-3" /></label>
                                                    <button disabled={savingId !== null || !(replies[ticket.id] ?? "").trim()} className="mt-3 rounded-xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-50">Cevabı Kaydet</button>
                                                    <p className="mt-2 text-xs text-slate-500">Cevap mesaj geçmişine kaydedilir.</p>
                                                </form>
                                            </details>
                                            {lastMessage !== null && (
                                                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                                                    <div className="text-xs font-bold text-slate-400">
                                                        SON MESAJ
                                                    </div>

                                                    <div className="mt-2 whitespace-pre-wrap text-sm">
                                                        {lastMessage.message}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2 lg:w-56 lg:grid-cols-1">
                                            <label className="block">
                                                <span className="text-xs font-bold text-slate-400">
                                                    DURUM
                                                </span>

                                                <select
                                                    value={ticket.status}
                                                    disabled={savingId === ticket.id}
                                                    onChange={(event) =>
                                                        void updateTicket(
                                                            ticket.id,
                                                            "status",
                                                            event.target.value
                                                        )
                                                    }
                                                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-bold"
                                                >
                                                    <option value="open">
                                                        Açık
                                                    </option>

                                                    <option value="in_progress">
                                                        İşlemde
                                                    </option>

                                                    <option value="closed">
                                                        Kapalı
                                                    </option>
                                                </select>
                                            </label>

                                            <label className="block">
                                                <span className="text-xs font-bold text-slate-400">
                                                    ÖNCELİK
                                                </span>

                                                <select
                                                    value={ticket.priority}
                                                    disabled={savingId === ticket.id}
                                                    onChange={(event) =>
                                                        void updateTicket(
                                                            ticket.id,
                                                            "priority",
                                                            event.target.value
                                                        )
                                                    }
                                                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-bold"
                                                >
                                                    <option value="low">
                                                        Düşük
                                                    </option>

                                                    <option value="normal">
                                                        Normal
                                                    </option>

                                                    <option value="high">
                                                        Yüksek
                                                    </option>

                                                    <option value="urgent">
                                                        Acil
                                                    </option>
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}