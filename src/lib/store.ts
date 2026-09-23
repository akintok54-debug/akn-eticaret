export const store = {
  name: "AKN Motosiklet",
  url: "https://www.aknmotosiklet.com",
  categories: [
    "Motor & Mekanik",
    "Elektrik & Elektronik",
    "Fren Sistemi",
    "Aktarma & Debriyaj",
    "Süspansiyon & Ön Düzen",
    "Tekerlek & Lastik",
    "Kaporta & Dış Aksam",
    "Aydınlatma",
    "Kumanda & Teller",
    "Filtre & Bakım",
    "Egzoz",
    "Motosiklet Aksesuarları",
    "Sürücü Ekipmanları",
    "E-Scooter",
    "Bisiklet",
  ],
};

export function money(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}