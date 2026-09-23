# AKN Motosiklet

**Güncel yayın durumu:** Mağaza arayüzü Vercel'de yayınlandı. Alan adı DNS ve veritabanı bağlantısı için [DEPLOYMENT.md](DEPLOYMENT.md) dosyasını okuyun. Aşağıdaki ilk kurulum komutlarından önce mevcut veritabanı ve eski SQLite geçiş geçmişi doğrulanmalıdır.

Next.js 16 / React 19 / PostgreSQL / Prisma ile motosiklet yedek parça mağazası.
Hedef alan adı: https://www.aknmotosiklet.com

## Çalıştırma

Node.js 24 ve PostgreSQL gerekir. `.env.example` dosyasını `.env` olarak kopyalayın; gerçek bağlantı bilgilerini girin. Var olan `.env` dosyasını ezmeyin.

```powershell
npm.cmd ci
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npm.cmd run dev
```

Üretim:

```powershell
npm.cmd run build
npm.cmd run start
```

Alternatif dağıtım: Dockerfile, Next.js standalone çıktısını root olmayan kullanıcıyla çalıştırır. Docker derlemesinden önce migration işlemini ayrı bir dağıtım adımında gerçek veritabanına uygulayın. Veritabanını yedekleyin. `.env` Docker imajına dahil edilmez; ortam değerleri çalışma anında verilir. Docker imajı bu ortamda çalıştırılarak doğrulanmadı.

## Yönetim ve erişim

`/admin` yönetici doğrulaması ister. `ADMIN_USER` ve en az 16 karakterlik rastgele `ADMIN_PASSWORD` ayarlayın. İlk HTTP Basic doğrulamasından sonra API istekleri için HttpOnly, SameSite=Strict, 8 saatlik imzalı çerez kullanılır. Üretimde HTTPS zorunludur. Bu başlangıç erişim modeli çok kullanıcılı rol/izin sistemi veya MFA içermez; reverse proxy üzerinde giriş ve sipariş uçları için hız sınırı uygulanmalıdır.

Misafir siparişleri 30 günlük imzalı HttpOnly çerezle ilişkilendirilir. `SESSION_SECRET` en az 32 karakterlik rastgele bir değer olmalı. Başka cihazdan giriş ve üye hesapları henüz yoktur. Çerez silinirse müşteri siparişlerine tarayıcıdan erişemez; yönetici kayıtları görür.

## Sipariş ve ödeme

- Siparişler PostgreSQL'e kaydedilir; tarayıcıdaki eski `akn-orders` verisi kullanılmaz.
- Fiyat sunucudan okunur, kullanıcıya gösterilen toplam değişmişse işlem durdurulur.
- Stok düşümü ve sipariş oluşturma aynı transaction içindedir.
- Her denemede kullanılan anahtar çift siparişi önler.
- İptal edilen siparişin stoğu aynı transaction içinde iade edilir; iptal geri alınamaz.
- Yalnızca havale/EFT sipariş akışı vardır. Kart tahsilatı, iyzico/PayTR ve banka mutabakatı entegre değildir.
- `CHECKOUT_ENABLED=false` varsayılandır. Banka alıcı adı, TR IBAN, oturum anahtarı ve veritabanı tamamlanmadan açılmaz.
- `SHIPPING_PRICE` ve `FREE_SHIPPING_THRESHOLD` işletmenin gerçek kargo koşullarına göre ayarlanmalıdır.
- Siparişler yönetim ekranında son 100 kayıtla sınırlıdır; sayfalama henüz yoktur.

## Katalog ve bayi

Ürün, fiyat ve stok işlemleri veritabanına gider. Aktarım raporu başarılı/başarısız kayıtları ayrı sayar; toplu işlemler kayıt bazında uygulanır, tüm dosya için tek transaction değildir. Ürüne bağlı kategoriler ve markalar kalıcıdır; henüz ürüne bağlanmamış katalog taslakları eski yönetim yapısı gereği tarayıcıda saklanır.

Bayi başvuruları kalıcıdır, yönetici onay durumunu güncelleyebilir. Bayi kimlik doğrulaması ve özel fiyatla satın alma henüz yoktur. Alış ve bayi fiyatları anonim ürün API yanıtından çıkarılır. Gerçek ürün görselleri ve marka/model uyumlulukları işletme tarafından eklenmelidir. Ana sayfa atölye görseli dekoratif olarak üretilmiştir; ürün fotoğrafı değildir.

## Kontroller

```powershell
node --test tests/commerce.test.mjs
npm.cmd run lint
npm.cmd run build
```

Testler yönetici kimlik doğrulamasını, çerez sahteciliğini, çapraz kaynaklı yönetim isteğini, miktar ve fatura doğrulamasını, istemci fiyatlarının kullanılmamasını ve kargo eşiklerini kapsar. Gerçek PostgreSQL üzerinde sipariş/stok entegrasyon ve eşzamanlılık testleri ayrıca yapılmalıdır.

## Canlıya geçişte kalanlar

1. Mevcut `.env` veritabanı adresi bağlantı testinde `ENOTFOUND` döndürdü. Gerçek PostgreSQL bağlantısını doğrulayın ve migration uygulayın.
2. Hosting seçin, ortam değişkenlerini güvenli panelden girin; alan adı DNS ve HTTPS ayarlarını yapın. Proje otomatik yayımlanmadı, DNS değiştirilmedi.
3. Gerçek ürün, stok, fiyat, görsel, kargo ve banka bilgilerini girin.
4. İşletmenin ticari bilgileri, iletişim, satış koşulları, gizlilik/KVKK, iade ve mesafeli satış metinlerini işletmeye uygun içerikle tamamlayın. Bu projede gerçek işletme bilgileri verilmediğinden metin uydurulmadı.
5. Ödeme sağlayıcısı seçilirse test/sandbox entegrasyonu, imzalı bildirim ve iade akışını ekleyin.
6. Gerçek veritabanında test siparişi, tekrar gönderim, son stok için eşzamanlı sipariş, iptal ve yetkisiz erişim senaryolarını doğrulayın. Ardından satış alımını açın.
7. `npm audit --omit=dev` raporunda Prisma araç zinciri üzerinden 4 yüksek seviye bulgu var (`deepmerge-ts`, `mysql2` ve üst bağımlılıkları). Otomatik öneri Prisma 6'ya geriye dönük büyük sürüm geçişidir; doğrulanmadan uygulanmadı. Dağıtım öncesi uyumlu düzeltmeleri değerlendirin.

Bu sürüm çalışan mağaza temeli ve güvenli sipariş altyapısıdır; tam kapsamlı IdeaSoft SaaS ürünü veya tamamlanmış ödeme entegrasyonu değildir.
