# Art Director MCP — Ürün ve Teknik Tasarım

**Hazırlanma:** 14 Eylül 2026  
**Durum:** Geliştirme önerisi; henüz uygulanmış, test edilmiş veya yayımlanmış ürün değildir.  
**Önerilen repository:** `akifsen/art-director-mcp`  
**Önerilen npm paketi:** `@akifsen/art-director-mcp`  
**Önerilen CLI:** `art-director`  
**Konumlandırma:** Art direction, design contracts, and visual verification for coding agents.

Paket adı ve namespace sahipliği yayın öncesinde doğrulanmalıdır. Bu belgede verilen paket komutları, geliştirilecek arayüzün örnekleridir; mevcut bir yayımlanmış paketi göstermez.

## 1. Ürün kararı

Yeni bir renk paleti veya stil arama MCP’si değil; proje bağlamını, görsel yön seçimini, uygulanabilir tasarım sözleşmesini ve çalışan arayüzden toplanan kanıtları aynı akışta buluşturan yerel bir geliştirici aracı geliştireceğiz.

Problem tanımı: Kullanıcı AI destekli IDE’lerde üretilen web arayüzlerini birbirine benzeyen, fazla güvenli, soluk ve klişe buluyor. Yalnızca daha doygun renkler vermek bu sorunun tamamını çözmez. Kompozisyon, tipografik hiyerarşi, içerik, görsel malzeme, gezinme ve uygulamanın seçilen tasarım yönünden sapması da ele alınmalıdır.

Ürün vaadi: Kodlama ajanına bağlama uygun, gerekçelendirilmiş ve tutarlı görsel kararlar sağlamak; ortaya çıkan uygulamanın bu kararlara ne kadar uyduğunu kanıtlarla değerlendirmeyi kolaylaştırmak.

Vaadimiz olmayanlar: Her modelden otomatik olarak harika tasarım çıkarmak, estetik kaliteyi nesnel tek puanla ölçmek, kendi başına ekran görüntülerini anlayan ücretsiz bir görsel model sunmak, tam WCAG uygunluğunu otomatik sertifikalandırmak veya mevcut MCP’lerden ölçüm yapılmadan daha iyi olduğunu iddia etmek.

## 2. Hedef kullanıcı ve kullanım bağlamı

İlk hedef: Cursor, Codex CLI/IDE eklentisi ve VS Code içinde çalışan bireysel geliştiriciler. İlk ürün kapsamı responsive web arayüzleridir. Native mobil, Figma, uzaktan ekip servisi ve uygulama mağazaları ilk sürümde kapsam dışıdır.

İlk source adapter React + Vite + CSS/Tailwind projelerini destekler. Tarayıcıdan DOM/CSS denetimi framework bağımsız tasarlanır; ancak bunun her framework için derin kaynak kod analizi anlamına gelmediği açıkça belirtilir. İlerleyen sürümde Vue, Laravel Blade ve Spring/FreeMarker source adapter’ları eklenir. Mevcut uygulamalar React’a veya başka bir template engine’e zorla taşınmaz.

Ürün web sitesi ve veri yoğun yönetim paneli aynı estetik kurallarla değerlendirilmez. Kullanıcının bağlamı ve açık tercihleri, genel önerilerden önceliklidir. Soluk görünümü gidermek her ekranı karanlık, neon veya animasyonlu yapmak değildir.

## 3. Birincil kullanıcı akışı

1. IDE açık workspace’i ve ilgili dosyaları incelemek için `inspect_project` çağırır.
2. Ajan kullanıcının isteğini yapılandırılmış `DesignBrief` nesnesine çevirir.
3. `propose_directions` üç uyumlu fakat farklı kompozisyon önerir. Bunlar yalnızca farklı renk varyasyonları değildir.
4. Her öneri için gerçek başlık ve içerik örnekleriyle bir HTML yön panosu hazırlanır. Bu pano bir uygulama teslimi veya render edilmiş ekran görüntüsü olarak sunulmaz.
5. Kullanıcı bir yön seçer. Kesintisiz çalışma talep edilmişse ajan en uygun yönü seçip seçimin geçici olduğunu ve gerekçesini kaydeder.
6. `compile_design_contract` seçilen yönü sürümlü, makinece okunabilir bir sözleşmeye dönüştürür.
7. IDE ajanı projeyi mevcut stack içinde değiştirir. MCP kaynak dosyaları kendi başına topluca yeniden yazmaz.
8. Çalışan geliştirme URL’si mevcutsa `audit_ui` izin verilen sayfadan DOM, computed style, ekran görüntüsü ve erişilebilirlik bulgularını toplar.
9. Ajan destekleniyorsa ekran görüntüsünü görsel olarak değerlendirir; deterministik bulgular ile estetik yargılar ayrı tutulur.
10. En önemli bulgulardan bir düzeltme paketi çıkarılır. Varsayılan en fazla iki iyileştirme turu yapılır; çözülemeyen noktalar açıkça raporlanır.

Bu akışın ajan tarafından benimsenmesi için isteğe bağlı IDE kural dosyaları sağlanır. MCP sunucusu modelin bir aracı çağırmasını veya talimatlarını her zaman izlemesini zorunlu kılamaz.

## 4. Ürünü farklılaştıran mekanizmalar

### 4.1 Bağlama bağlı görsel yön

Girdi yalnızca `industry: SaaS` değildir. Ürün türü, hedef kullanıcı, birincil görev, gerçek içerik, marka malzemeleri, mevcut tasarım sistemi, sayfa türü, dil, görsel yoğunluk, erişilebilirlik ihtiyaçları ve korunacak davranışlar birlikte ele alınır.

Öncelik sırası: açık kullanıcı gereksinimi → mevcut ürünün korunacak gereksinimleri → erişilebilirlik ve işlevsel kısıtlar → seçilen yön → genel tavsiyeler. Çelişki olduğunda motor bunu raporlar; sessizce bir gereksinimi silmez.

### 4.2 Kompozisyon çeşitliliği

Bir yönün parmak izi şu alanlardan oluşur: hero/top-level composition, grid yapısı, başlık/gövde ilişkisi, metin-görsel dengesi, gezinme modeli, bölüm ritmi, yüzey kullanımı, görsel malzeme stratejisi ve etkileşim yaklaşımı.

Üç aday en az üç renk dışı kompozisyon ekseninde anlamlı biçimde ayrışmalıdır. Sayfa türü bunu makul kılmıyorsa motor yapay farklılık yaratmak yerine kısıtı açıklar. Bu kontrol estetik özgünlük kanıtı değil, aynı şablonun farklı renkle tekrar sunulmasını azaltan bir mühendislik kontrolüdür.

### 4.3 Tasarım sözleşmesi

Sözleşme renklerden ibaret değildir. Aşağıdakileri içerir:

- Ürün amacı ve içerik doğruları; uydurulamayacak istatistikler, referanslar ve başarı iddiaları.
- Tipografi, renk, boşluk, grid, radius, border ve motion token’ları.
- Her bölümün rolü; desktop ve mobile kompozisyon davranışı.
- Menü açık/kapalı, loading, empty, error, success, focus ve disabled durumları.
- Görsel malzemelerin türü, lisansı, focal point ve responsive crop yaklaşımı.
- Seçilen yöne özel kaçınılacak kalıplar ve makul istisnalar.
- Hangi gereksinimin otomatik, sezgisel veya insan/vision değerlendirmesi ile kontrol edilebildiği.

Sözleşme bir güvenlik mekanizması veya ajana mutlak yaptırım aracı değildir. Sürüm kontrollü bir uygulama ve denetim referansıdır.

### 4.4 Klişe ve uyumsuzluk denetimi

Aday uyarılar: gerekçesiz tekrar eden kartlar, tüm bölümlerde aynı yerleşim, seçilen yönle çelişen tipografi, sıradan şablon sloganları, mobilde yalnızca küçültülmüş desktop menü, işlevi olmayan görseller, yoğun ekranda gereksiz animasyon.

Bunlar evrensel yasaklar değildir. Kartlar, nötr renkler, merkez hizalama veya gradient kendi başına hata sayılmaz. Örneğin veri yoğun bir panelde tekrar eden kartlar işlevsel olabilir. Bulgular sayfa türüne ve sözleşmeye dayanmalıdır.

### 4.5 Kanıta dayalı görsel döngü

Kanıt paketi: viewport, route, run zamanı, araç sürümleri, contract hash, DOM selector/bounding box, ilgili computed style, ekran görüntüsü kimliği, bulgu türü ve önerilen düzeltme.

Kaynak dosya ve satır bilgisi yalnızca güvenilir bir eşleştirme olduğunda gösterilir. DOM selector bulundu diye otomatik olarak React/Blade kaynak satırı bulunduğu iddia edilmez.

## 5. Zekânın nerede çalışacağı

**Yerel deterministik motor:** Dosya inceleme, şema doğrulama, küratörlü pack eşleştirme, kompozisyon varyantları, token derleme, stil ölçümü, DOM kontrolleri, rapor ve cache.

**IDE ajanı:** Serbest metin brief’i yapılandırma, tasarım muhakemesi, özgün içerik ve uygulama kodu oluşturma, görsel yeteneği varsa screenshot değerlendirme, düzeltme uygulama.

**İsteğe bağlı browser worker:** İzin verilen URL’de tarayıcı çalıştırma, screenshot ve DOM kanıtı toplama, axe-core tabanlı otomatik kontroller.

MVP kendi API anahtarı, Ollama, model indirme, GPU veya ücretli servis gerektirmez. Bu, IDE’nin kullanımının ücretsiz olduğu veya IDE’ye gönderilen verinin hiçbir sağlayıcıya ulaşmayacağı anlamına gelmez. MCP ayrı bir bulut servisine veri göndermeyecek; IDE’nin modeline dönen içerik IDE sağlayıcısının veri işleme koşullarına tabi olacaktır.

MCP sampling gelecekte isteğe bağlı bir adapter olabilir; temel çalışma yolu sampling desteğine bağlı olmayacaktır. Görsel girdi desteklenmiyorsa `visualReview: not-performed` raporlanır. Screenshot alınması tek başına görsel inceleme değildir.

Bir MCP sunucusu IDE’ye bağlı başka MCP sunucularını otomatik olarak çağırabiliyormuş gibi tasarlanmaz. Mevcut Playwright MCP ile iş birliği IDE ajanı üzerinden yapılır veya kendi açıkça kurulmuş browser worker’ımız kullanılır.

## 6. MCP araç sözleşmeleri

İlk sürüm altı araçla sınırlandırılır. Her araç bounded input, açık hata şeması ve sürümlü output schema sunar. Ortak metadata: `schemaVersion`, `projectId`, `artifactId`, `capabilities`, `warnings`, `truncated`, `nextCursor` ve gerekiyorsa `contractRevision`.

| Araç | Temel girdi | Temel çıktı | Sınır |
|---|---|---|---|
| `inspect_project` | `scope`, `refresh`, `detailLevel` | Stack, mevcut token’lar, UI envanteri, kanıtlar, tespit güveni | Yalnızca başlatılırken yetkilendirilmiş root |
| `propose_directions` | Yapılandırılmış `brief`, `count`, `seed` | Üç `DirectionSpec`, gerekçeler, farklılıklar ve preview artifact’ları | Sınırsız katalog veya uzak model çağrısı yok |
| `compile_design_contract` | `direction`, `expectedRevision`, `persist` | Sözleşme, token çıktıları, uygulama rehberi | Uygulama kaynaklarını değiştirmez |
| `get_blueprint` | `contractId`, `componentOrSection`, `stack` | İlgili davranış, responsive, state ve semantik uygulama rehberi | Tam kataloğu context’e dökmez |
| `audit_ui` | `contractId`, izinli `url` veya yerel `evidenceArtifactId`, `viewports`, `mode` | Deterministik/sezgisel/inceleme-bekleyen bulgular, kanıtlar | Kaynak uygulamada mutasyon yapmaz |
| `get_artifact` | `artifactId`, `cursor`, `limit`, `format` | Sınırlı parça, rapor veya destekleniyorsa image content | Serbest dosya yolu okuyucusu değildir |

MCP resources ve prompts ek bağlam olarak sunulabilir; temel iş akışı yalnızca tools destekleyen istemcilerde de kullanılabilir. Uzun sonuçlar artifact kimliği ve pagination ile alınır. Tool açıklamaları kısa, farklı ve görev odaklı tutulur.

`persist`, browser/network veya dosya yazımı olabilen araçlar için yanıltıcı read-only işaretleri kullanılmaz. Annotation’lar erişim kontrolü yerine geçmez.

### Hata ve kısmi sonuç modeli

Beklenen kodlar: `PROJECT_NOT_AUTHORIZED`, `UNSUPPORTED_STACK`, `INVALID_BRIEF`, `CONTRACT_CONFLICT`, `BROWSER_NOT_INSTALLED`, `ORIGIN_NOT_ALLOWED`, `AUDIT_TIMEOUT`, `ARTIFACT_NOT_FOUND`, `CAPABILITY_UNAVAILABLE`.

`status` değeri `complete`, `partial` veya `blocked` olabilir. Tarayıcı kurulmamışsa sahte bir başarılı audit dönülmez. Geçmiş screenshot’lar güncel run’ın kanıtıymış gibi sunulmaz.

## 7. Veri modeli ve proje belleği

Ana modeller: `ProjectProfile`, `DesignBrief`, `DirectionSpec`, `DesignContract`, `DesignPack`, `Blueprint`, `AuditRun`, `Finding`, `EvidenceArtifact`, `AssetRecord`.

`Finding` alanları: `id`, `category`, `severity`, `confidence`, `ruleId`, `ruleVersion`, `evaluationType`, `contractRequirementId`, `evidenceRefs`, `observed`, `expected`, `suggestedFix`, `verificationMethod`.

`evaluationType`: `deterministic`, `heuristic` veya `human-review`. Model görüşleri deterministik bulgu sınıfına yazılmaz. Tek bir “premium puanı” üretilmez.

`AssetRecord`: kaynak, üretici, lisans tanımı, attribution gereksinimi, yerel yol, dosya hash’i, alt metin, crop/focal point ve kullanım amacı. Kullanıcının CC0 önceliği varsayılan tercihe dönüştürülür; diğer lisanslı içerikler kendi koşullarıyla kaydedilir. Katalog bir lisans uygunluğu sertifikası üretmez.

Proje dosyaları:

```text
.art-director/
  config.json
  brief.json
  contract.json
  tokens.json
  decisions.md
  preferences.json
  cache/                 # gitignore
  reports/               # gitignore; paylaşım açık opt-in
  screenshots/           # gitignore
  previews/              # gitignore
```

Sözleşme ve brief isteğe göre version control’e alınabilir. Cache, screenshot ve raporlar varsayılan olarak izlenmez. Kullanıcının seçtiği yönler ve reddettiği kalıplar yalnızca proje özelinde saklanır. Projeler arası zevk öğrenme veya telemetri varsayılan değildir.

Sözleşmede optimistic concurrency uygulanır: `expectedRevision` uyuşmuyorsa diğer IDE’nin kararını ezmek yerine conflict dönülür. Yazımlar temp file + atomic rename kullanır; cache bozulduğunda güvenli yeniden oluşturma yapılır.

## 8. Teknik mimari

Önerilen runtime Node.js 24 LTS, dil TypeScript strict. 14 Eylül 2026’da kontrol edilen resmi SDK deposunda v2 kararlı sürüm hattı olarak belirtiliyor; yeni sunucu için `@modelcontextprotocol/server` çizgisi esas alınmalı. Uygulama başlamadan paket `engines`, exports ve güncel kararlı sürüm tekrar doğrulanmalı; v1 ve v2 import örnekleri karıştırılmamalı.

Transport: öncelikle yerel stdio. İlk sürümde uzaktan HTTP servis, kimlik yönetimi, kullanıcı veritabanı veya SaaS kontrol paneli yok.

```text
Cursor / Codex / VS Code
            |
        MCP stdio
            |
  CLI ve MCP transport adapter
            |
  Application services / use cases
            |
  Domain core
    Project profile + constraints
    Pack matching + composition diversity
    Design contract + token compilation
    Evidence + findings + drift evaluation
            |
  Adapters
    Workspace / filesystem / cache
    React/Vite source inspection
    CSS/Tailwind output
    JSON / Markdown / HTML artifacts
    Optional browser worker
```

Çekirdek MCP SDK veya Playwright import etmez. Bağımlılıklar domain’e doğru yönelir. Domain fonksiyonları mümkün olduğunca deterministik ve pure olur. Test kolaylığı ve CLI/MCP arasında aynı kararların üretilmesi temel gerekçedir; mikroservis kurmak değildir.

Repository önerisi:

```text
art-director-mcp/
  packages/
    core/                 # başlangıçta internal
    mcp/                  # public MCP + CLI
    browser/              # explicit opt-in worker
  design-packs/
  examples/
    editorial-portfolio/
    expressive-product/
    dense-dashboard/
  evals/
  docs/
    architecture/
    adr/
    security/
    compatibility/
  .github/workflows/
```

Tek repository ve npm workspaces yeterli. İlk sürümde Redis, harici SQL veritabanı, vector database, Kubernetes veya dağıtık kuyruk gerekmiyor. JSON tabanlı yerel indeks, sınırlı LRU ve gerektiğinde disk cache kullanılacak.

Token çıktılarında DTCG 2025.10 formatına uyum hedeflenir; ayrıca CSS custom properties ve Tailwind için adapter üretilir. DTCG belgesi Community Group formatıdır; W3C Recommendation olarak adlandırılmaz. Token dosyalarının şema ve alias çözümleme testleri bulunur.

## 9. Design pack tasarımı

İlk sürümde üç derinlikli pack, her biri iki gerçek kompozisyon: toplam altı özgün composition recipe. Bunlar uygulanabilir örnekler, state tanımları ve denetim kuralları içermelidir; yalnızca sıfat listeleri olmamalıdır.

**Editorial Signal:** Güçlü tipografi, asimetrik akış, içerik önceliği; portföy, kişisel site ve yazı odaklı ürünler.

**Vivid Product:** Ürünün kendisini gösteren ana görsel, kontrollü renk blokları, belirgin bilgi ve aksiyon hiyerarşisi; uygulama ve geliştirici aracı sayfaları.

**Quiet Precision:** Sade fakat okunaklı yüzeyler, iyi veri yoğunluğu ve net durum anlatımı; dashboard, kurumsal araç ve yönetim paneli.

Sonraki üç pack: Tactile Studio, Technical Console, Commerce Gallery. Her pack için şu alanlar gerekir: amaç, uygun/uygunsuz bağlam, kompozisyon kuralları, içerik rolleri, token’lar, responsive davranış, mobile navigation, state matrix, motion, erişilebilirlik değerlendirme notları, varlık politikası, iyi/kötü örnekler, kaynak/lisans ve sürüm.

Palette ve yüzey renklerinin rolü açık olmalı: brand accent, interactive state, semantic status ve dekoratif vurgu birbirine karıştırılmaz. Düşük doygunluk otomatik hata değildir; metin okunaklılığı ile sanatsal kontrast ayrıdır.

Pack’ler veri olarak yüklenir. Üçüncü taraf pack’lerin keyfi JavaScript çalıştırmasına izin verilmez. Paket içi SVG/HTML ve metin alanları güvenlik açısından doğrulanır; harici script ve izinsiz network içeriği kullanılmaz.

## 10. Audit kapsamı ve doğruluk sınırları

Deterministik kontroller mümkün olan alanlarla sınırlanır: ilgili düz renk yüzeylerde kontrast, yatay overflow, eksik label, belirli focus/keyboard senaryoları, semantik yapı, beklenen token sapmaları ve contract’ta işaretli durumların varlığı.

Karmaşık arka planlar, görsel üzerine bindirilmiş metin, animasyon veya ölçülemeyen durumlarda “geçti” yerine `needs-review` üretilir. WCAG 2.2 minimum metin kontrastı istisnalarla normal metinde 4.5:1 ve büyük metinde 3:1’dir. Target size gibi kurallar istisnalarıyla ele alınmalıdır; 44 px bütün etkileşimler için evrensel AA zorunluluğu gibi gösterilmez.

Otomatik erişilebilirlik denetimi tam uygunluk ispatı değildir. Klavye, ekran okuyucu, görev tamamlama ve gerçek kullanıcı değerlendirmesi manuel kontrol olarak görünür tutulur.

Sezgisel kontroller: bölüm ritmi tekrarı, başlık hiyerarşisinin görsel zayıflığına aday göstergeler, contract’a göre fazla kartlaşma, görsel alan dengesizliği. Bulgular düşük/orta/yüksek güven ve kanıtla verilir; evrensel tasarım kuralları olarak sunulmaz.

Görsel değerlendirme: IDE modelinin görüntü yeteneğiyle yapılırsa kullanılan model, değerlendirilen ekran, değerlendirme tarihi ve yargının model kaynaklı olduğu kaydedilir. Bu kayıt deterministik denetim sonuçlarını değiştirmez.

SEO koruma kontrolleri: mevcut heading yapısı, gerçek metin içeriği, crawl edilebilir linkler ve mevcut SSR davranışı inceleme checklist’ine eklenir. Görsel farklılık uğruna metinler canvas’a veya salt görsele dönüştürülmez. Bu denetim SEO başarı veya sıralama garantisi değildir.

## 11. Browser worker sınırları

Ana MCP paketi startup sırasında browser yüklememeli, indirmemeli veya çalıştırmamalıdır. Browser özelliği ayrı, sürümü eşleştirilmiş `@akifsen/art-director-browser` paketi olarak kurulabilir. Kurulum yalnızca açık `browser install` komutuyla, kurulum özeti gösterilerek yapılır. Main pakette `postinstall` ile Chromium indirilmez.

Worker sabit, sürümlü bir IPC sözleşmesi kullanır. Keyfi shell, terminal komutu, kullanıcı gönderimli JavaScript veya uygulama başlatma komutu kabul etmez. Çalışan dev server kullanıcı/IDE tarafından sağlanır.

Varsayılan sadece açıkça izinli local development origin’leri kabul edilir. Redirect ve alt kaynak istekleri de denetlenir. Loopback IP, port ve scheme kontrolleri yapılır; diğer private ağ adreslerine veya metadata uçlarına erişim varsayılan kapalıdır. CDN/API gerekirse ayrı allowlist’e eklenir.

İzole browser context kullanılır. Kullanıcının normal browser profilinden cookie, oturum veya şifreler alınmaz. Ekran görüntüsünde kişisel veri olabileceği belirtilir; yerel mask selector’ları ve rapor saklama/temizleme ayarları sunulur.

Her workspace için sınırlı worker ve kuyruk, timeout, cancellation, browser çökmesinde temiz toparlanma ve SIGTERM kapanışı uygulanır. Tekrarlanabilir testlerde font yüklenmesi beklenir, animasyonlar kontrollü dondurulur ve dinamik alanlar maskelenir. Bunun site performans ölçümü olmadığı belirtilir.

## 12. Performans ve context bütçesi

Aşağıdakiler ölçülmüş sonuç değil, ilk mühendislik hedefleridir. Benchmark ortamı, CPU, disk, OS, Node sürümü, dependency sürümleri, warm/cold koşulları ve fixture boyutu raporlanmalıdır.

| İşlem | Başlangıç hedefi |
|---|---|
| Hazır kurulmuş core process → MCP initialize tamamlanması | p95 < 1 saniye |
| Warm pack/blueprint lookup | p95 < 50 ms |
| Tek değişen UI dosyası için incremental refresh | p95 < 200 ms |
| Sınırlandırılmış 2.000 kaynak dosya / 20 MB ilk tarama | p95 < 2 saniye |
| Varsayılan metin tool sonucu | En fazla 12 KiB; ek içerik artifact olarak |
| Core lookup çalışma ağı | Network olmadan başarılı |

İlk npx indirmesi, npm registry erişimi, browser kurulumu, IDE model yanıtı ve browser audit bu core hedeflere dahil değildir. Bunların süreleri ayrı ölçülür. Native modül veya büyük binary eklenirse paket dağıtım maliyeti yeniden değerlendirilir.

İndeks yalnızca ilgili dosya türlerini tarar. `node_modules`, `.git`, build çıktıları, büyük binary’ler, `.env` ve özel dosyalar dışarıda tutulur. Cache key; dosya içerik hash’i, pack sürümü, rule sürümü, contract sürümü ve ilgili yapılandırmayı kapsar. Süresiz/global dosya izleyici yerine değişiklik odaklı veya talep bazlı yenileme tercih edilir.

## 13. IDE kurulumu ve CLI deneyimi

Aşağıdaki komutlar planlanan API’dir; paket yayımlandıktan sonra çalışacaktır:

```bash
npx -y @akifsen/art-director-mcp@0.1.0 init --client cursor --apply
npx -y @akifsen/art-director-mcp@0.1.0 init --client codex --apply
npx -y @akifsen/art-director-mcp@0.1.0 init --client vscode --apply
npx -y @akifsen/art-director-mcp@0.1.0 doctor
```

`init` varsayılan olarak dry-run ve diff üretir. `--apply` açık yazma iznidir. Mevcut MCP tanımları ve IDE kuralları korunur; parse edilemeyen ayar dosyası yeniden oluşturularak ezilmez. Yedekleme, idempotent merge, rollback ve versiyonlu managed section uygulanır. İsteğe bağlı ajan kuralı için `--with-rules` ayrı flag kullanılır.

Cursor proje ayarı `.cursor/mcp.json` içindeki `mcpServers` anahtarıdır. VS Code proje ayarı `.vscode/mcp.json` içindeki `servers` anahtarıdır. Codex TOML biçimindeki `mcp_servers` tanımlarını kullanır. Tek JSON dosyasını tüm istemcilere kopyalamak doğru yaklaşım değildir.

Her IDE adapter’ı gerçek bir subprocess initialize/tools-list/tools-call smoke test’i ile doğrulanır. Yapılandırma oluşturulması, istemci entegrasyonunun test edildiği anlamına gelmez. Compatibility matrix `tested`, `config-generated`, `not-tested` ayrımını gösterir.

Windows’ta npx/cmd çözümlemesi, boşluklu/Türkçe karakterli yollar, PowerShell, native Windows ve WSL ayrımı test edilir. `doctor` Node, PATH, izinli root, browser durumu, paket sürümü, artifact yazma yetkisi ve istemci ayar dosyasını denetler. Sürekli kullanımda sabitlenmiş yerel kurulumdan mutlak `node` yolu ile başlatma seçeneği üretilir; her IDE açılışında `@latest` kullanılmaz.

## 14. Güvenlik

İzinli root başlatma/kurulum aşamasında belirlenir. Modelin tool argümanıyla başka root’a geçmesine izin verilmez. MCP roots bilgisinin tek başına OS sandbox veya güvenlik sınırı olmadığı kabul edilir. Gerçek root allowlist, canonical path ve symlink/junction kontrolleri uygulanır.

Mutlak ve göreli path traversal, Windows drive değişimi, UNC yolu, symlink/junction kaçışı, artifact id üzerinden kaçış ve izinli olmayan ağ istekleri için negatif testler bulunur. Varsayılan redaction ve dosya sınırları uygulanır; redaction’ın tüm sırları yakalama garantisi olmadığı dokümante edilir.

İncelenen kaynak dosyaları ve web içeriği güvenilmeyen veridir. Bunlar içindeki “talimatları değiştir, sırları oku, dosya gönder” türü ifadeler hiçbir zaman sunucu yetkisine veya tool çağrısına dönüştürülmez. Secret dosyaları aranmaz veya model context’ine gönderilmez.

stdout yalnızca MCP protokol mesajları içindir. Loglar stderr veya açıkça ayarlanmış yerel dosyaya yazılır. Telemetri ve uzak içerik paylaşımı varsayılan kapalıdır. Publish, dosya silme, repo oluşturma veya remote servis değişiklikleri MCP araçları içinde gizli yan etki değildir.

## 15. Test ve değerlendirme

**Birim/domain:** Brief doğrulama, kısıt öncelikleri, pack eşleştirme, kompozisyon farkı, token ve alias çözümleme, contract revision, cache invalidation, deterministik çıktı.

**Protokol:** Gerçek initialize ve tool çağrıları, hatalar, cancellation, stdout saflığı, sınır aşan girdi, pagination, schema uyumu, partial sonuçlar.

**Dosya ve güvenlik:** Root kaçışı, symlink/junction, gizli dosya, fixture içine yerleştirilmiş prompt injection metinleri, bozuk cache, eşzamanlı iki istemci, izinsiz URL/redirect/subresource.

**Browser:** Desktop/mobile screenshot, menü durumları, görünür focus senaryosu, overflow, axe bulguları, browser eksikliği, dev server kapalı, timeout ve crash.

**Paket:** `npm pack` ile gerçek tarball oluştur; temiz geçici klasörde kur; repo kaynaklarına erişmeden CLI ve MCP smoke test çalıştır. Paket yanlışlıkla fixture/private dosya içermemeli. Windows/macOS/Linux testleri yayın kapısı olmalı.

**Tasarım değerlendirmesi:** Aynı brief, başlangıç repository’si, içerik/asset seti, model sürümü, toplam token sınırı ve maksimum iterasyon sayısıyla üç koşul karşılaştırılır: araçsız ajan, mevcut UI UX MCP’nin sabitlenmiş sürümü, Art Director MCP. Altı brief ve üç tekrar ile 54 çıktı başlangıç deney seti olabilir. Bunun maliyeti ve manuel değerlendirme yükü ayrıca görünür olmalıdır.

Kör değerlendirmede çıktılar isimlendirme ipuçlarından arındırılır. Görsel hiyerarşi, bağlama uygunluk, tutarlılık, gerçek içerik kullanımı, mobil kullanılabilirlik ve algılanan ayırt edicilik ayrı puanlanır. Otomatik a11y bulguları ve model token/süre ölçümleri ayrı raporlanır. İyi örnekler kadar kötü sonuçlar da saklanır. Ölçümden önce başarı yüzdesi, performans rekoru veya “rakipten üstün” iddiası yayımlanmaz.

## 16. Yayın planı ve GitHub sunumu

Kod lisansı için MIT önerilir. Üçüncü taraf içerikler kendi lisanslarını korur; tüm dataset’i tek taraflı CC0 saymayız. Özgün pack’ler için lisans kararı ayrıca verilir. `LICENSE`, `THIRD_PARTY_NOTICES`, `SECURITY.md`, `CONTRIBUTING.md`, changelog ve destek matrisi hazırlanır.

GitHub README İngilizce, ek Türkçe README ile yayımlanır. Açılışta araç adının yanında tek cümle ürün açıklaması ve gerçek üç-yön/önce-sonra demosu bulunur. README’de temel kullanım, kurulum, no-extra-API-key sınırı, gizlilik sınırı, doğrulanan istemciler, performans ölçüm yöntemi ve roadmap yer alır.

Dokümantasyon/galeri statik olabilir; login, dashboard veya backend gerektirmez. Galeri, üç pack’in farklı ürün bağlamlarında gerçekten farklı sonuçlar verdiğini göstermelidir. Tüm demo siteleri aynı bento grid’in farklı renkleri olmamalıdır.

Release akışı: lockfile kontrollü kurulum → lint/typecheck/test → build → pack → temiz kurulum testleri → güvenlik/paket içeriği kontrolü → açık maintainer onayı → public npm yayını. GitHub Actions OIDC trusted publishing tercih edilir. npm’de publisher ve repo kimlik bağları kullanıcı hesabıyla yapılandırılır; ilk yayın için gerekli hesap adımları ayrıca doğrulanır.

Resmi MCP Registry için `server.json` hazırlanır. Önerilen `mcpName`: `io.github.akifsen/art-director`. `package.json` değeri registry metadata ile eşleşir. Registry kaydı, erişilemeyen bir paketi mevcutmuş gibi göstermemelidir.

## 17. Milestone’lar ve kabul kapıları

### M0 — İskelet ve güvenilir çalışma

Monorepo, core sınırları, CLI, stdio sunucu, altı tool schema, errors, artifact store, root politikası ve smoke test. Bu aşama ürün lansmanı değildir.

### M1 / v0.1 — Tam dikey akış

React/Vite projesi → üç pack/altı kompozisyon → üç HTML yön panosu → contract/token çıktısı → IDE uygulaması → opt-in browser üzerinden desktop/mobile kanıt → gerçek audit raporu. Cursor ve Codex kurulum adapter’ları, VS Code config üretimi ve platform testleri. Browser yokken dürüst partial fallback. Ürünü farklılaştıran görsel döngü tamamen sonraki sürüme ertelenmez.

### M2 / v0.2 — Dağıtım ve içerik kalitesi

Üç IDE’de gerçek entegrasyon doğrulaması, altı olgun pack, Vue/Blade/FreeMarker için kademeli adapter kapsamı, blind benchmark raporu, static showcase, public npm ve MCP Registry yayını.

### M3 / v0.3 — Genişletilebilirlik

Veri tabanlı pack SDK, proje bazlı tercih iyileştirmeleri, daha iyi design drift denetimi; gerçek talep varsa Figma/reference adapter ve remote transport. Native mobil ve hosted servis ayrı ürün kararlarıdır.

İlk tamamlanma tanımı: Temiz Windows ortamında kurulabilmesi, gerçek UI projesine üç belirgin yön verebilmesi, bir yönün uygulanabilir sözleşmesini üretmesi, çalışan ekrandan en az bir gerçek sorunu kanıtıyla bulması ve bunu dürüstçe raporlaması. Kapsamı küçük fakat uçtan uca çalışır olmalı.

## 18. Doğrulanan teknik kaynaklar

Aşağıdaki resmi kaynaklar 14 Eylül 2026’da tasarım hazırlanırken incelendi. Bağımlılık ve istemci sürümleri uygulama/yayın sırasında yeniden doğrulanmalıdır.

- UI UX Pro MCP projesinin kendi araç listesi: https://github.com/redf0x1/ui-ux-pro-mcp
- Resmi TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP 2026-07-28 specification: https://modelcontextprotocol.io/specification/2026-07-28
- MCP roots: https://modelcontextprotocol.io/specification/2026-07-28/client/roots
- MCP sampling: https://modelcontextprotocol.io/specification/2026-07-28/client/sampling
- Cursor MCP: https://cursor.com/docs/mcp
- Codex MCP resmi giriş adresi: https://developers.openai.com/codex/mcp/
- VS Code MCP: https://code.visualstudio.com/docs/agent-customization/mcp-servers
- Node.js release tablosu: https://nodejs.org/en/about/previous-releases
- Playwright erişilebilirlik denetimi: https://playwright.dev/docs/accessibility-testing
- Playwright browser kurulumu: https://playwright.dev/docs/browsers
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Design Tokens Community Group formatı: https://www.designtokens.org/tr/2025.10/format/
- npm trusted publishing: https://docs.npmjs.com/trusted-publishers/
- MCP Registry yayın kılavuzu: https://modelcontextprotocol.io/registry/quickstart
