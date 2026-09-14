# Art Director MCP

**Kodlama ajanınıza görsel yön, tasarım sözleşmesi ve sonucu iyileştirecek kanıt sağlayın.**

Art Director MCP, IDE'nizin yanında yerel olarak çalışır. Proje brief'inden farklı görsel yönler üretir, seçilen kararları sürümlü bir tasarım sözleşmesine dönüştürür ve çalışan arayüzden tarayıcı kanıtı toplar.

[English](README.md) · [Kurulum referansı](docs/clients.md)

## Özellikler

- Üç tasarım paketi ve altı kompozisyon (çerçeve, grid, ritim, gezinme, mobil davranış). Yönler önce brief'e uygunluğa göre sıralanır, sonra yapısal çeşitlilik için seçilir; her yön neden uygun olduğunu, neyi öne çıkardığını, görsel etkiyi hangi kararın oluşturduğunu, mobilde nasıl değiştiğini ve ne zaman yanlış seçim olacağını söyler.
- Marka sizin kalır: palet ve tipografi marka verilerinizden ve açık tercihlerinizden gelir; paket yalnızca boşlukları doldurur. Token ve sözleşmedeki her karar kaynağını (`user`, `host`, `brand`, `character`, `pack`) taşır; düşük kontrastlı marka renkleri gibi çelişkiler sessizce düzeltilmez, raporlanır.
- İçerik listesi bilgi mimarisine dönüşür: brief maddeleri rol, öncelik ve grup taşır; ilişkili maddeler tek gruplu bölüm, sıralı içerik adımlar, veri tablo olur; kanıtı olmayan iddialar açık bir boşluk olarak kalır. Hiçbir şey uydurulmaz.
- Proje kısıtlarını ve korunacak davranışları taşıyan tasarım sözleşmeleri, DTCG token çıktıları ve CSS değişkenleri oluşturun.
- Sayfa bütünü, gezinme, içerik, form, tablo ve giriş bölümleri için sözleşmenin mimarisinden ve kimliğinden türetilen uygulama rehberi alın.
- İsteğe bağlı tarayıcı bileşeniyle masaüstü/mobil ekran görüntüleri, erişilebilirlik bulguları ve yatay taşma ölçümleri toplayın; aşama süreleri, kapsam sayıları ve zaman aşımında kısmi sonuç raporlanır.

Uygulama kodunu ve görsel değerlendirmeyi IDE ajanınız yapar. Art Director ek model API anahtarı istemez.

## Kurulum

**Node.js 22 veya 24 LTS** (test paketi ikisinde de çalışır; desteklenen aralık `>=22 <27`) ve npm gerekir. Projenizin klasöründe çalıştırın:

```sh
npx -y @akifsen/art-director-mcp@0.3.0 init --client cursor --apply
```

[npm paketi](https://www.npmjs.com/package/@akifsen/art-director-mcp), IDE'yi sabitlenmiş sürümü yerel çalıştıracak şekilde yapılandırır. IDE'yi yeniden yükleyip gerektiğinde MCP sunucusunu onaylayın.

Alternatif olarak paketi projeye kurup `--local` ile o kopyaya bağlayın:

```sh
npm install --save-dev @akifsen/art-director-mcp@0.3.0
npx art-director init --client cursor --apply --local
```

İki yöntem de bilgisayarınızda çalışır. `--local` kurulu kopyayı seçer; verilmezse IDE sabitlenmiş paketi npx üzerinden başlatır. Yazılmış bir yapılandırma dosyası henüz çalışan bir entegrasyon değildir: `npx art-director doctor --client cursor`, yapılandırmadaki komutu IDE'nin başlatacağı gibi başlatır ve stdio el sıkışmasını (`initialize` → `tools/list`) doğrular; başlangıç süresini, araç listesini ve npx indirmesinin sürdüğü, IDE'nin desteklenmeyen bir Node devraldığı veya komutun başlatılamadığı durumlar için ipuçlarını raporlar. IDE'nin kendi arayüzü `doctor`'ın doğrulayabildiği alanın dışındadır.

## Asistan seçimi

`cursor` yerine şu seçeneklerden birini kullanın:

| Asistan | Seçenek |
|---|---|
| Claude Code | `claude` |
| Cursor | `cursor` |
| GitHub Copilot — VS Code | `copilot` |
| Kiro | `kiro` |
| Codex CLI | `codex` |
| Qoder CLI | `qoder` |
| Roo Code | `roocode` |
| Gemini CLI | `gemini` |
| OpenCode | `opencode` |
| Continue IDE eklentisi | `continue` |
| CodeBuddy CLI | `codebuddy` |
| Droid — Factory | `droid` |
| Kilo Code | `kilocode` |
| Desteklenen tüm asistanlar | `all` |

```sh
# Değişiklikleri önizle
npx art-director init --client claude --local

# Desteklenen bütün proje yapılandırmalarını ekle
npx art-director init --client all --apply --local

# İstemci ayrıntılarını göster
npx art-director clients
```

Kurulum mevcut diğer ayarları ve yorumları korur, yedek oluşturur ve yalnızca proje içinde çalışır. Tekrarlanan kurulum aynı değişiklikleri yeniden yapmaz. `vscode`, `copilot` için alternatif addır.

Cursor, Copilot ve Codex için `--with-rules` ile çalışma yönergesi ekleyebilirsiniz. Dosya yolları, istemciye özel davranış ve proje dosyası yerine kendi ayarlarından yapılandırılan asistanlar [kurulum referansındadır](docs/clients.md).

## Çalışma akışı

1. Projenin UI dosyalarını, teknolojilerini, token'larını ve varlıklarını inceleyin.
2. Brief ve içeriğinizle oluşturulan görsel yön panolarını karşılaştırın.
3. Seçilen yönü sürümlü tasarım sözleşmesine dönüştürün.
4. Arayüzü IDE ajanınızla uygulayın.
5. Çalışan arayüzü denetleyip bulgularla iyileştirin.

Altı MCP aracı: `inspect_project`, `propose_directions`, `compile_design_contract`, `get_blueprint`, `audit_ui`, `get_artifact`.

Yön panoları tasarım çalışmalarıdır. Her pano reçetesinin çerçevesini (üst bar, yan ray veya masthead içi bağlantılar, grid ve ritim) izler, brief'in içerik mimarisini (gruplu hizmetler, iş listeleri, adımlar, tablolar, açık kanıt boşlukları) kurar ve çözümlenmiş kimliği (verildiyse marka paleti ve fontları, yoksa paket varsayılanları) uygular. Böylece yönler yalnızca renkle değil yapı ve tipografiyle ayrışır; aynı kompozisyon farklı markalarda farklı görünür. Panolar `.art-director/previews/<directionId>.html` dosyalarına (`previewPath`) yazılır. Her yön `fit` (lehte/aleyhte gerekçeler), `rationaleDetail` (fit, emphasis, visualDriver, mobile, wrongWhen, identity), `architecture` ve `identity.provenance` döndürür. Sayfa türü veya `character.avoid` listesi reçeteleri dışladığında üçten az yön döner ve nedeni yazılır. Sözleşme güncellemelerinde revision kontrolü, başka bir istemcinin kararlarının sessizce ezilmesini önler.

Denetim, ölçülen bulguları sözleşmenin deterministik gereksinimlerine (`requirementResults`: overflow, labels, accessibility, contrast) eşler ve gerçekte neyin kapsandığını (`coverage`: değerlendirilen eleman sayısı, kontrast düğümleri, zaman aşımına uğrayan aşamalar) raporlar. Bir gereksinim yalnızca her viewport'ta ölçüldüyse `pass` olur; ölçülmeyenler `not-measured`, zaman aşımına uğrayan çalıştırmalar `partial` olarak işaretlenir. Kompozisyon, mimari, kimlik, tipografi, mobil davranış, korunacak davranışlar ve içerik doğruluğu insan incelemesine bırakılır; geçen denetim "ölçülen kusur yok" demektir, "tasarım başarılı" demek değildir. İsteğe bağlı `hostReview` (IDE ajanının veya bir kişinin yapılandırılmış değerlendirmesi) değerlendirdiği sözleşme revision'ıyla saklanır ve ölçülen bulgularla asla karıştırılmaz.

Denetim, ölçülen bulguları sözleşmenin deterministik gereksinimlerine eşler (`requirementResults`: overflow, labels, accessibility, contrast); kompozisyon, tipografi, mobil davranış ve içerik doğruluğu açıkça insan incelemesine bırakılır.

## IDE sohbetinde kullanım

Kurulumdan sonra IDE'yi yeniden yükleyin, araçlar/ayarlar bölümünden Art Director MCP sunucusunu etkinleştirin ve araç çağırabilen sohbet modunu açın. Aşağıdaki metinleri sohbete yapıştırabilirsiniz. Bunlar slash komutu değil, ajanın MCP araçlarını kullanmasını isteyen doğal dil örnekleridir.

### Tasarım yönü seçme

> Art Director MCP ile bu projeyi incele. Bağımsız bir tasarımcı için portföy oluşturuyorum; temel görev proje çalışmalarını bulmak ve okumak. Mevcut route'ları ve gerçek içeriği koru. İsteğimi yapılandırılmış brief'e dönüştür, uygun görsel yönler öner ve yerleşim farklarını açıkla. Uygulama kodunu değiştirmeden önce yön panolarını göster.

### Seçilen yönü uygulama

> Az önce önerdiğin ikinci yönü kullan. Mevcut revision değerini dikkate alarak tasarım sözleşmesini oluştur, gezinme blueprint'ini al ve tasarımı projenin mevcut teknolojileriyle uygula. Gerçek içeriği ve işlevleri koru; referans veya kullanım istatistiği uydurma.

### Denetim ve düzeltme

> Uygulama http://127.0.0.1:5187 adresinde çalışıyor. Art Director MCP ile oluşturduğumuz sözleşmeye göre denetle. Masaüstü ve mobil bulguları özetle, ölçülen sorunları görsel yorumlardan ayır ve en önemli sorunları düzelt. Değişikliklerden sonra denetimi tekrar çalıştır.

Bu örnek için önce tarayıcı bileşenini kurun ve uygulamanızın origin'ini sunucu başlangıç argümanlarında izinli hale getirin; [tarayıcı denetimi](#tarayıcı-denetimi) bölümüne bakın. Sohbette URL yazmak tek başına ağ izni vermez.

### Tek bileşene odaklanma

> Mevcut sözleşmemiz için form blueprint'ini al. Bu formun etiketlerini, focus davranışını, loading, error ve success durumlarını iyileştir. Neleri doğruladığını ve nelerin görsel inceleme gerektirdiğini belirt.

Yaklaşık 40 KB'ı aşan sonuçlar artifact olarak saklanır ve bir `summary` ile döner; ajandan `artifactId` değerini `get_artifact` ile (sayfa başına en fazla 12000 karakter) `nextCursor` üzerinden okumasını isteyin. Sözleşme derlemek için `propose_directions` çağrısındaki `brief` ve `seed` ile birlikte `directionId` verin; ya da yön nesnesini `previewArtifactId`, `previewPath` ve `differences` alanları olmadan gönderin. İlk kayıt için `expectedRevision: 0`, güncelleme için mevcut revision kullanılır. Derleme `.art-director/contract.json`, `tokens.json`, `tokens.css` ve `brief.json` dosyalarını yazar. Blueprint ve audit çağrılarında derlemenin döndürdüğü `contractId` artifact kimliği kullanılır.

## MCP araçları

| Araç | Ne yapar? |
|---|---|
| `inspect_project` | İzinli projedeki UI dosyalarını, teknolojileri, token ve varlık envanterini inceler |
| `propose_directions` | Yapılandırılmış brief'ten uygun yönler ve HTML tasarım panoları üretir |
| `compile_design_contract` | Seçilen yönü revision kontrollü sözleşme ve token çıktılarına dönüştürür |
| `get_blueprint` | Hero, gezinme, içerik, form veya tablo için uygulama rehberi getirir |
| `audit_ui` | Sözleşmeyle ilişkili tarayıcı kanıtı ve bulguları toplar; yerel kanıt artifact'ını da kabul eder |
| `get_artifact` | Üretilen çıktıları kimlikleriyle, sınırlı sayfalar halinde okur |

## Terminal komutları

Komutları paketin kurulu olduğu proje klasöründe çalıştırın. Her satırın başına `npx art-director` ekleyin.

| Komut | Ne yapar? |
|---|---|
| `--help` | CLI kullanımını, asistan seçeneklerini ve komut adlarını gösterir |
| `--version` | Paket sürümünü yazdırır |
| `clients` | Adapter'ları, alternatif adları ve proje dışından yapılandırılan asistanları listeler |
| `init --client cursor --local` | Dosya yazmadan kurulum değişikliklerini önizler |
| `init --client cursor --apply --local` | Seçilen asistanı mevcut ayarları yedekleyerek projeye ekler |
| `init --client all --apply --local` | Ön kontrollerden sonra desteklenen tüm proje adapter'larını kurar |
| `doctor` | Paket/Node sürümünü, platformu, proje kökünü, worker ve Chromium varlığını, izinli origin'leri ve çözüm ipuçlarını gösterir |
| `doctor --client cursor` | Ek olarak asistanın proje yapılandırmasındaki komutu başlatır ve stdio üzerinden MCP el sıkışmasını (initialize, tools/list) sürelerle ve tanılarla doğrular |
| `serve --project <mutlak-kök>` | IDE'nin bağlanacağı stdio MCP sunucusunu başlatır |
| `inspect` | Projenin UI envanterini inceler |
| `directions --brief brief.json [--seed 0]` | Yapılandırılmış JSON brief'ten tasarım yönleri üretir; panolar `.art-director/previews/` altına yazılır |
| `contract --direction direction.json --expected-revision 0` | Üretilmiş yön JSON dosyasından sözleşme derler ve kaydeder |
| `contract --direction-id <id> --brief brief.json [--seed 0] --expected-revision 0` | Yön kimliği ile, üretimde kullanılan brief ve seed'i vererek derler |
| `blueprint --contract-id <id> --section page [--stack react]` | `page`, `hero`, `navigation`, `content`, `form` veya `table` için uygulama rehberi (`get_blueprint` ile aynı) |
| `artifact <artifactId> [--cursor 0] [--limit 6000]` | Bir artifact'ın tek sayfasını okur (`get_artifact` ile aynı) |
| `audit --contract-id <id> --url http://127.0.0.1:5187 --allow-origin http://127.0.0.1:5187 [--audit-budget 40000]` | Çalışan yerel sayfayı kayıtlı sözleşmeye göre denetler |
| `browser install` | Kurulu isteğe bağlı worker üzerinden sabitlenmiş tarayıcı dosyalarını indirir |
| `pack validate design-pack.json` | Tasarım paketi JSON dosyasını şemaya göre doğrular |

Komutsuz `npx art-director`, `doctor` çıktısını verir. Her komut MCP araçlarıyla aynı servis katmanını çağırır; doğrulama, hata kodları, sayfalama ve çıktı biçimi iki arayüzde aynıdır.

### Komut seçenekleri

| Seçenek | Kullanıldığı komut | Açıklama |
|---|---|---|
| `--project <mutlak-kök>` | Proje komutları | Projeyi seçer; varsayılan mevcut klasördür |
| `--client <ad>` | `init` | Asistanı, `vscode` alternatif adını veya `all` seçeneğini belirler |
| `--apply` | `init` | Planlanan dosya değişikliklerini yazar; yoksa yalnızca önizler |
| `--local` | `init` | Kurulu Node ve paket dosyasının yolunu kullanır |
| `--with-rules` | `init` | Desteklenen kural adapter'ları için çalışma yönergesi ekler |
| `--client <ad>` | `doctor` | O asistanın proje yapılandırmasını başlatıp MCP el sıkışmasını tamamlayarak doğrular |
| `--brief <dosya>` | `directions`, `contract` | Projeye göre brief yolu; varsayılan `brief.json` |
| `--seed <sayı>` | `directions`, `contract` | Aday sıralamasında eşitlik bozucu; varsayılan `0` |
| `--direction <dosya>` | `contract` | Projeye göre üretilmiş yön yolu; varsayılan `direction.json` |
| `--direction-id <id>` | `contract` | Dosya yerine yön kimliğiyle derler (`--brief` gerekir) |
| `--expected-revision <sayı>` | `contract` | Beklenen mevcut revision; varsayılan `0` |
| `--contract-id <id>` | `blueprint`, `audit` | Derlemenin döndürdüğü sözleşme artifact kimliği |
| `--section <ad>`, `--stack <react\|html>` | `blueprint` | Rehber bölümü (varsayılan `page`) ve hedef stack (varsayılan `react`) |
| `--cursor <n>`, `--limit <n>` | `artifact` | Sayfa penceresi; limit en çok 12000 karakter |
| `--url <url>` | `audit` | Çalışan uygulamanın sayfa adresi |
| `--allow-origin <origin>` | `serve`, `audit` | Tam eşleşen sayısal loopback origin'ine izin verir; tekrarlanabilir |
| `--audit-budget <ms>` | `serve`, `audit` | Worker'a verilen toplam tarayıcı bütçesi (varsayılan 40000; CLI başlatma/IPC için 15 s daha bekler) |
| `--help` | CLI | Komutu çalıştırmak yerine yardımı gösterir |

Brief, yön ve paket dosyası yolları seçilen proje köküne göredir; kök dışına çıkamaz. Örnek brief:

```json
{
  "product": "Tasarımcı portföyü",
  "primaryTask": "Proje çalışmalarını bulmak ve okumak",
  "pageType": "portfolio",
  "audience": "Potansiyel müşteriler",
  "content": [
    { "heading": "Seçili işler", "body": "Buraya gerçek proje açıklamanızı yazın." }
  ],
  "constraints": ["Mevcut route'ları koru"]
}
```

`pageType`: `portfolio`, `product`, `dashboard`, `landing`, `company`, `article` veya `docs`. Brief'te gerçek proje içeriği kullanın. CLI JSON çıktı verir; sayfalanan sonuçları IDE'nin MCP araçlarıyla okuyabilirsiniz.

### Tasarımı biçimlendiren brief alanları

Aşağıdakilerin hepsi isteğe bağlı ve geriye uyumludur; 0.1/0.2 brief'leri çalışmaya devam eder ve `provenance: "pack"` ile paket varsayılanlarını alır.

| Alan | Etkisi |
|---|---|
| `purpose` | Kuruluşun veya ürünün ne yaptığını anlatan tek cümle; giriş destek satırı olur ve uygunluğu etkiler |
| `secondaryTasks` | Referans sütunlarında listelenir; asla bölüme dönüşmez |
| `content[].role` | `hero`, `offering`, `work`, `proof`, `process`, `technical`, `organization`, `data`, `support`, `contact`, `other`. Verilmezse başlıktan çıkarılır |
| `content[].priority` | `primary`, `secondary`, `supporting`; bölüm sırasını ve boyutunu belirler |
| `content[].group` | Aynı gruptaki maddeler ayrı ayrı değil, tek gruplu bölüm olarak çizilir |
| `content[].evidence` | `real`, `placeholder`, `none`; gerçek kanıtı olmayan proof maddeleri açık "Evidence pending" boşluğu olur |
| `brand.colors`, `brand.fonts`, `brand.name`, `brand.designSystem` | Mevcut marka verileri; paket paletini ve tipografisini ezer. Marka font adları CSS font yığınının başına yerleşir ve tür sistemi için sınıflanır (serif/sans/condensed/mono) |
| `character.prefer` | Somut kararlara eşlenen sıfatlar (örn. `premium` → serif başlık, 400 ağırlık, kısıtlı vurgu rengi; `technical` → tabular rakamlar, sans, 600). Yalnızca marka ve tercihlerin karar vermediği yerde uygulanır; eşlenmeyen kelimeler ve çelişkiler raporlanır |
| `character.avoid` | Dışlanacak yapısal kalıplar (`sidebar`, `hero-image`, `numbered-steps`, `tables`, `masthead`, …). Bunlara dayanan reçeteler dışlanır; eşlenmeyen kelimeler insan incelemesi gereksinimine dönüşür |
| `assets` | Hangi malzemenin var olduğu (`screenshots`, `photography`, `illustration`, `logos`); ekran görüntüsü olmayan ürün sahnesi puan kaybeder ve yer tutucu olarak etiketlenir |
| `preserve` | Uygulamada korunması gereken davranışlar; sözleşmeye gereksinim olarak taşınır |
| `preferences` | Açık kararlar (`navigation`, `density`, `heading`, `body`, `headingWeight`, `palette`) ve `source: "user"` ya da `"host"`; en yüksek öncelik |

Öncelik sırası: preferences → brand → character → pack. Çözümlenen `identity` her kararın kaynağını kaydeder ve renklerinizi sessizce değiştirmek yerine `conflicts` listesini (örn. marka metin/arka plan kontrastı 4.5:1 altında) döndürür.


## Tarayıcı denetimi

İsteğe bağlı bileşeni aynı projeye kurun:

```sh
npm install --save-dev @akifsen/art-director-browser@0.2.0
npx -y @akifsen/art-director-mcp@0.3.0 browser install
```

Uygulamanızın geliştirme sunucusunu başlatın. IDE yapılandırmasındaki Art Director sunucu argümanlarına uygulamanızın portuyla izinli origin ekleyin:

```text
--allow-origin http://127.0.0.1:5187
```

Denetim izole tarayıcı oturumunda çalışır; kişisel tarayıcı profilinizi kullanmaz. Art Director uygulamanızın sunucusunu başlatmaz. axe erişilebilirlik, odak ve taşma kontrolleri toplam bütçe (varsayılan 40 s) içinde adlandırılmış aşamalara (launch, navigate, fonts, measure, axe, focus, screenshot) bölünerek çalışır; bir aşama payını aşarsa worker tamamlanan viewport'ları `partial` olarak döndürür ve zaman aşımına uğrayan aşamayı adlandırır. Bulgular değerlendirmeye yardımcı olur; WCAG sertifikası veya estetik puanı üretmez. IDE ajanı görsel değerlendirmeyi `audit_ui` içindeki `hostReview` alanıyla kaydedebilir. Worker 0.1.0 bu sunucuyla çalışmaya devam eder (aşama bütçesi olmadan); `doctor` yükseltmeyi önerir.

## Yerel çalışma ve gizlilik

Araç kullanıcının bilgisayarında çalışır. Kullanım sırasında bu deponun GitHub API'sine istek göndermez, GitHub Actions tetiklemez ve geliştiricinin bilgisayarına bağlanmaz. Paket ve isteğe bağlı tarayıcı kurulumu gerekli bağımlılıkları indirir.

Ayrı bir Art Director bulut servisi veya telemetri yoktur. IDE'nizin model sağlayıcısı araç çıktılarını kendi politikaları kapsamında işleyebilir.

Raporlar ve ekran görüntüleri projenin `.art-director/` dizininde saklanır. Görüntü maskeleri yalnızca piksellere uygulanır; DOM bulguları sayfa içeriği barındırabilir. Paylaşmadan önce çıktıları inceleyin. Ayrıntılar: [SECURITY.md](SECURITY.md).

## Kaynaktan çalıştırma

```sh
git clone https://github.com/akifsen/art-director-mcp.git
cd art-director-mcp
npm ci --ignore-scripts
npm run typecheck
npm run build
npm test
```

React/Vite örneği `examples/expressive-product` klasöründedir. Windows, Linux ve macOS kontrolleri [CI iş akışında](https://github.com/akifsen/art-director-mcp/actions/workflows/ci.yml) çalıştırılır.

## Lisans

[MIT](LICENSE). Üçüncü taraf bağımlılıkların lisansları korunur: [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES).
