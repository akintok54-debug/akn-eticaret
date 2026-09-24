"use client";

import Link from "next/link";
import {
    FormEvent,
    useCallback,
    useEffect,
    useState,
} from "react";

type CustomerGroup = {
    id: string;
    name: string;
    code: string;
    description: string | null;
    type: string;
    discountRate: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
        customers: number;
    };
};

export default function UyeGruplariPage() {
    const [groups, setGroups] = useState<CustomerGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [groupType, setGroupType] = useState("retail");
    const [discountRate, setDiscountRate] = useState("0");

    const loadGroups = useCallback(async () => {
        try {
            setError("");

            const response = await fetch("/api/customer-groups", {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Üye grupları alınamadı."
                );
            }

            setGroups(
                Array.isArray(data.groups) ? data.groups : []
            );
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Üye grupları yüklenemedi."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
    const controller = new AbortController();
    fetch("/api/customer-groups", { cache: "no-store", signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Kayıtlar alınamadı."); return data; })
      .then(data => { if (!controller.signal.aborted) { setGroups(data.groups || []); } })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Kayıtlar alınamadı."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [loadGroups]);

    async function createGroup(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const rate = Number(discountRate);

        if (
            !Number.isFinite(rate) ||
            rate < 0 ||
            rate > 100
        ) {
            setError(
                "İskonto oranı 0 ile 100 arasında olmalıdır."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await fetch(
                "/api/customer-groups",
                {
                    method: editingId ? "PATCH" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: editingId ?? undefined,
                        name: name.trim(),
                        code: code.trim(),
                        description: description.trim(),
                        type: groupType,
                        discountRate: rate,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Grup oluşturulamadı."
                );
            }

            setName("");
            setCode("");
            setDescription("");
            setGroupType("retail");
            setDiscountRate("0");

            setSuccess(editingId ? "Grup güncellendi." : "Grup başarıyla oluşturuldu.");
            setEditingId(null);

            await loadGroups();
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Grup oluşturulamadı."
            );
        } finally {
            setSaving(false);
        }
    }

    async function changeActiveStatus(
        group: CustomerGroup
    ) {
        try {
            setError("");
            setSuccess("");

            const response = await fetch(
                "/api/customer-groups",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: group.id,
                        active: !group.active,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Grup güncellenemedi."
                );
            }

            setSuccess(
                group.active
                    ? "Grup pasife alındı."
                    : "Grup aktif edildi."
            );

            await loadGroups();
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Grup güncellenemedi."
            );
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 text-slate-900">
            <header className="bg-slate-950 text-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
                    <div>
                        <div className="font-black">
                            AKN YÖNETİM
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                            Üyeler / Üye ve Bayi Grupları
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
                <div>
                    <h1 className="text-2xl font-black sm:text-3xl">
                        Üye / Bayi Grupları
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Müşteri ve bayi gruplarını yönetin.
                    </p>
                </div>

                {error ? (
                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                        {error}
                    </div>
                ) : null}

                {success ? (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                        {success}
                    </div>
                ) : null}

                <form
                    onSubmit={createGroup}
                    className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                    <h2 className="text-lg font-black">
                        {editingId ? "Grubu Düzenle" : "Yeni Grup Oluştur"}
                    </h2>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <label className="block">
                            <span className="text-xs font-bold text-slate-500">
                                GRUP ADI
                            </span>

                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Örn: Gold Bayi"
                                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-bold text-slate-500">
                                GRUP KODU
                            </span>

                            <input
                                type="text"
                                required
                                value={code}
                                onChange={(event) =>
                                    setCode(event.target.value)
                                }
                                placeholder="GOLD-BAYI"
                                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-bold text-slate-500">
                                GRUP TİPİ
                            </span>

                            <select
                                value={groupType}
                                onChange={(event) =>
                                    setGroupType(event.target.value)
                                }
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                            >
                                <option value="retail">
                                    Perakende
                                </option>

                                <option value="dealer">
                                    Bayi
                                </option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-xs font-bold text-slate-500">
                                İSKONTO %
                            </span>

                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={discountRate}
                                onChange={(event) =>
                                    setDiscountRate(event.target.value)
                                }
                                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3"
                            />
                        </label>
                    </div>

                    <label className="mt-4 block">
                        <span className="text-xs font-bold text-slate-500">
                            AÇIKLAMA
                        </span>

                        <textarea
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            rows={3}
                            placeholder="Grup hakkında açıklama"
                            className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-3"
                        />
                    </label>

                    <div className="mt-4 flex flex-wrap justify-end gap-3">{editingId && <button type="button" disabled={saving} onClick={() => { setEditingId(null); setName(""); setCode(""); setDescription(""); setGroupType("retail"); setDiscountRate("0"); }} className="rounded-xl border px-5 py-3">Vazgeç</button>}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50 sm:w-auto"
                        >
                            {saving
                                ? "Kaydediliyor..."
                                : editingId ? "Değişiklikleri Kaydet" : "Grup Oluştur"}
                        </button>
                    </div>
                </form>

                <section className="mt-6">
                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                            Gruplar yükleniyor...
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                            Henüz grup oluşturulmamış.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {groups.map((group) => (
                                <article
                                    key={group.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-black">
                                                {group.name}
                                            </h2>

                                            <div className="mt-1 text-xs font-bold text-slate-400">
                                                {group.code}
                                            </div>
                                        </div>

                                        <span
                                            className={
                                                group.active
                                                    ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"
                                                    : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
                                            }
                                        >
                                            {group.active
                                                ? "Aktif"
                                                : "Pasif"}
                                        </span>
                                    </div>

                                    <div className="mt-5 grid grid-cols-3 gap-2">
                                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                                            <div className="text-xs text-slate-400">
                                                Tip
                                            </div>

                                            <div className="mt-1 font-black">
                                                {group.type === "dealer"
                                                    ? "Bayi"
                                                    : "Perakende"}
                                            </div>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                                            <div className="text-xs text-slate-400">
                                                İskonto
                                            </div>

                                            <div className="mt-1 font-black">
                                                %{group.discountRate}
                                            </div>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                                            <div className="text-xs text-slate-400">
                                                Üye
                                            </div>

                                            <div className="mt-1 font-black">
                                                {group._count?.customers ?? 0}
                                            </div>
                                        </div>
                                    </div>

                                    <button type="button" disabled={saving} onClick={() => { setEditingId(group.id); setName(group.name); setCode(group.code); setDescription(group.description ?? ""); setGroupType(group.type); setDiscountRate(String(group.discountRate)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="mt-4 w-full rounded-xl border px-4 py-3 font-bold">Düzenle</button>
                                    {group.description ? (
                                        <p className="mt-4 text-sm text-slate-500">
                                            {group.description}
                                        </p>
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void changeActiveStatus(group)
                                        }
                                        className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold"
                                    >
                                        {group.active
                                            ? "Pasife Al"
                                            : "Aktif Et"}
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}