# AKN yayın durumu — 21 Eylül 2026

- Vercel projesi: `bahadir2/akn-eticaret`
- Proje kimliği: `prj_5JoU7Cv0X0BiwydQMn8YNjab09cq`
- Geçerli mağaza adresi: https://akn-eticaret-chi.vercel.app
- İlk yayın `dpl_7FbJGNu8cZjY9XkRF5k23g5fkzep` ile tamamlandı. Katalog hazırlık mesajını içeren sonraki yayın `dpl_Hgi5mHt98zE1sjk5kxVHfgVydURs`, Vercel tarafından `BLOCKED / TEAM_ACCESS_REQUIRED` durumuna alındı: commit yazarının bu projede yayın yetkisi yok. Son yerel düzeltme henüz canlıya geçmedi. GitHub/Vercel hesap yetkisi tamamlanmadan yeniden yayın denenmemeli.
- `aknmotosiklet.com` ve `www.aknmotosiklet.com` projeye eklendi; DNS yönlendirmesi bekleniyor.
- Diğer proje `moto-parca-erp` değiştirilmedi. Eski yerel bağlantısı Git dışında `.vercel-other-project-backup` içinde tutuluyor.
- GitHub erişimi henüz Vercel'e verilmediğinden yayın yerel kaynaklardan CLI ile yapıldı. GitHub'a bu değişiklikler gönderilmedi.

## DNS

Mevcut yetkili DNS sunucuları IdeaSoft: `ns31.myideasoft.com`, `ns32.myideasoft.com`.
Vercel'in bu proje için bildirdiği kayıtlar:

| Tür | Ad | Değer |
|---|---|---|
| A | @ | 216.198.79.1 |
| A | @ | 64.29.17.1 |
| CNAME | www | e6a28c3413293a2a.vercel-dns-017.com |

Yeni mağazaya geçileceği zaman mevcut web A/CNAME kayıtları bunlarla değiştirilmelidir. E-posta MX/TXT kayıtlarını koruyun. DNS paneline erişilmediği için bu kayıtlar tarafımızdan değiştirilmedi. Alan adını eklemek tek başına DNS yönlendirmesi yapmaz.

## Satış öncesi kalanlar

`SITE_URL`, `SESSION_SECRET` ve `CHECKOUT_ENABLED=false` üretim ortamına eklendi. Gizli değerler kaynak kodunda tutulmaz.

`ADMIN_USER` ve güçlü `ADMIN_PASSWORD` da AKN üretim ortamına gizli değişkenler olarak eklendi. Kullanıcı adı ve parola yalnızca Git ve dağıtım dışında tutulan `.env.admin.local` dosyasındadır; sohbete yazılmadı. Bu ortam değişiklikleri başarılı bir sonraki yayınla etkinleşir.

AKN Railway projesi `c6b43b60-dfdf-405e-94bc-faf66dd03c6f`, Postgres servisi `74d63e4b-bd42-4256-8fef-d75f5155d4c5`.
Railway CLI artık doğru AKN hesabıyla (`aknmotorsiklet@gmail.com`) giriş yaptı. Veritabanının boş olduğu doğrulandı; PostgreSQL başlangıç geçişi başarıyla uygulandı. Product, Customer, Address, Order ve OrderItem tabloları ile tamamlanmış migration kaydı doğrulandı. Ürün sayısı 0. Diğer projenin veritabanı kullanılmadı.

1. `DATABASE_PUBLIC_URL`, AKN Vercel projesinin Production ortamına gizli `DATABASE_URL` olarak eklendi; yerel `.env` bağlantısı da düzeltildi. Yayın yetkisi düzeldikten sonra yeni deployment gereklidir.
2. `prisma/postgresql-migrations/20260921000000_init` canlı AKN veritabanına uygulandı. Eski SQLite geçmişi `prisma/migrations` içinde korundu ve uygulanmadı. `--initialize` tekrar çalıştırılmamalıdır; salt-okunur kontrol için `node scripts/deploy-setup.mjs` kullanılabilir.
3. Gerçek ürünler, kargo/banka bilgileri ve işletme metinlerini tamamlayın. IBAN kontrol basamakları kodda doğrulanır; gerçek banka bilgisi girilmeden ödeme açılmaz.
4. Veritabanında sipariş/stok/iptal ve eşzamanlılık testlerini yapın. Ödeme ve işletme koşulları hazır olduktan sonra satış alımını açın.

Mevcut yayın mağaza arayüzüdür. Veritabanı yapılandırması tamamlandı ancak mevcut deployment yeni ortam değişkenlerini henüz kullanmıyor; gerçek sipariş ve ödeme alımı kapalıdır. Son sürüm, hesap yetkisi düzeltildikten sonra yayınlanabilir.
