export const store = {
  name: "AKN Motosiklet",
  url: "https://www.aknmotosiklet.com",
  categories: ["Motor Parçaları", "Fren", "Zincir & Dişli", "Yağ & Bakım", "Elektrik", "Aksesuar"],
};
export function money(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
}
