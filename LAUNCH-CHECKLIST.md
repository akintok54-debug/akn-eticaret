# AKN Motosiklet — açılış hazırlığı

## Hazır

- Mobil mağaza, ürün arama/filtreleme, sepet, sipariş ve bayi ekranları.
- AKN'ye özel Vercel projesi; ERP projesi değiştirilmedi.
- Alan adlarının Vercel projesine eklenmesi.
- Üretimde oturum anahtarı ve güçlü yönetici giriş bilgileri.
- PostgreSQL başlangıç geçişi AKN Railway veritabanına uygulandı; beş mağaza tablosu doğrulandı. Eski SQLite geçmişi korundu.
- AKN Vercel Production ortamına gizli DATABASE_URL eklendi; yeni yayında etkinleşecek.
- IBAN kontrol basamağı, sipariş tutarı, stok ve yönetici yetkisi kontrolleri.
- `npm run launch:check`: yerel eksikleri değerleri göstermeden listeler.
- `npm run launch:check -- --database`: erişim sağlandığında veritabanını salt-okunur doğrular.

## Hesap sahibinin tamamlaması gereken erişimler

1. **Vercel / GitHub:** GitHub'daki commit sahibinin AKN Vercel projesinde yayın yetkisi olmalı. Son güncelleme `TEAM_ACCESS_REQUIRED` nedeniyle engellendi. Hesap eşleştirmesi düzelmeden tekrar yayın veya kimlik değişikliği yapılmaz.
2. **Railway tamamlandı:** Doğru AKN hesabıyla bağlantı, tablo kurulumu ve Vercel ortam değişkeni aktarımı yapıldı. Şifreli URL sohbete veya kaynak koduna yazılmadı.
3. **Alan adı:** IdeaSoft/alan adı yönetim paneline erişim gerektiğinden DNS kayıtları henüz değişmedi. Gerekli kayıtlar `DEPLOYMENT.md` içinde.

## İşletmeden gereken gerçek bilgiler

- Ticari ünvan, vergi dairesi/numarası, işletme adresi, müşteri destek telefonu ve e-posta.
- Banka alıcı ünvanı ve gerçek TR IBAN; kargo ücreti ve ücretsiz kargo eşiği.
- Ürün dosyası: stok kodu, isim, marka, kategori, KDV dahil fiyat, KDV oranı, stok, açıklama ve görsel bağlantısı. Marka/model/yıl uyumluluğu açıklamada belirtilmeli.
- İşletmeye uygun gizlilik, satış, teslimat ve iade metinleri.
- Kartlı satış isteniyorsa seçilen sağlayıcının test ve canlı hesap bilgileri; şu anda kart tahsilatı yapılmaz.

## Erişim tamamlandıktan sonraki sıra

1. Tamamlandı: AKN veritabanının boş olduğu salt-okunur incelemeyle doğrulandı.
2. Tamamlandı: PostgreSQL migration uygulandı ve tamamlanma kaydı doğrulandı. Başlangıç kurulumu tekrar çalıştırılmamalıdır.
3. Gerçek ürünleri aktar; fiyat/stok ve görselleri kontrol et.
4. Başarılı sipariş, yetersiz stok, değişmiş fiyat, aynı isteğin tekrarı, iptal/stok iadesi ve başka misafirin siparişlerine erişememe senaryolarını ayrı test ortamında doğrula.
5. Vercel hesap yetkisiyle son sürümü yayınla; üretim URL'sini doğrula.
6. İşletme ve ödeme ayarları tamamlandıktan sonra sipariş alımını aç; ardından DNS geçişini tamamla.

İlk yayın erişilebilir; son yerel değişiklikler yetki engeli nedeniyle henüz yayında değildir. Tüm satış testleri tamamlanmadan `CHECKOUT_ENABLED=true` yapılmamalıdır.
