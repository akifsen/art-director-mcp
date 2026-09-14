# Art Director MCP

**Kodlama ajanınıza görsel yön, tasarım sözleşmesi ve sonucu iyileştirecek kanıt sağlayın.**

Art Director MCP, IDE'nizin yanında yerel olarak çalışır. Proje brief'inden farklı görsel yönler üretir, seçilen kararları sürümlü bir tasarım sözleşmesine dönüştürür ve çalışan arayüzden tarayıcı kanıtı toplar.

[English](README.md) · [Kurulum referansı](docs/clients.md)

## Özellikler

- Üç tasarım paketi ve altı kompozisyonla tipografi, yerleşim, mobil davranış ve arayüz durumlarını belirleyin.
- Proje kısıtlarını koruyan tasarım sözleşmeleri, token çıktıları ve CSS değişkenleri oluşturun.
- Gezinme, içerik, form, tablo ve giriş bölümleri için uygulama rehberi alın.
- İsteğe bağlı tarayıcı bileşeniyle masaüstü/mobil ekran görüntüleri, erişilebilirlik bulguları ve yatay taşma ölçümleri toplayın.

Uygulama kodunu ve görsel değerlendirmeyi IDE ajanınız yapar. Art Director ek model API anahtarı istemez.

## Kurulum

**Node.js 24 LTS** ve npm gerekir. Projenizin klasöründe çalıştırın:

```sh
npx -y @akifsen/art-director-mcp@0.2.0 init --client cursor --apply
```

[npm paketi](https://www.npmjs.com/package/@akifsen/art-director-mcp), IDE'yi sabitlenmiş sürümü yerel çalıştıracak şekilde yapılandırır. IDE'yi yeniden yükleyip gerektiğinde MCP sunucusunu onaylayın.

Alternatif olarak paketi projeye kurup `--local` ile o kopyaya bağlayın:

```sh
npm install --save-dev @akifsen/art-director-mcp@0.2.0
npx art-director init --client cursor --apply --local
```

İki yöntem de bilgisayarınızda çalışır. `--local` kurulu kopyayı seçer; verilmezse IDE sabitlenmiş paketi npx üzerinden başlatır.

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

Yön panoları tasarım çalışmalarıdır. Her pano reçetesinin gezinme desenini (üst bar, yan ray veya masthead içi bağlantılar), tipografi sistemini ve yoğunluğunu izler; yönler yalnızca renkle değil yapı ve tipografiyle ayrışır. Panolar tarayıcıda açılabilmesi için `.art-director/previews/<directionId>.html` dosyalarına (`previewPath`) yazılır. Uygun yön sayısı proje bağlamına göre değişir; dashboard brief'i şu anda iki yön üretir. Sözleşme güncellemelerinde revision kontrolü, başka bir istemcinin kararlarının sessizce ezilmesini önler.

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
| `serve --project <mutlak-kök>` | IDE'nin bağlanacağı stdio MCP sunucusunu başlatır |
| `inspect` | Projenin UI envanterini inceler |
| `directions --brief brief.json` | Yapılandırılmış JSON brief'ten tasarım yönleri üretir |
| `contract --direction direction.json --expected-revision 0` | Üretilmiş yön JSON dosyasından sözleşme derler ve kaydeder |
| `audit --contract-id <id> --url http://127.0.0.1:5187 --allow-origin http://127.0.0.1:5187` | Çalışan yerel sayfayı kayıtlı sözleşmeye göre denetler |
| `browser install` | Kurulu isteğe bağlı worker üzerinden sabitlenmiş tarayıcı dosyalarını indirir |
| `pack validate design-pack.json` | Tasarım paketi JSON dosyasını şemaya göre doğrular |

Komutsuz `npx art-director`, `doctor` çıktısını verir. `get_blueprint` ve `get_artifact`, MCP araçlarıdır; ayrı CLI alt komutları değildir.

### Komut seçenekleri

| Seçenek | Kullanıldığı komut | Açıklama |
|---|---|---|
| `--project <mutlak-kök>` | Proje komutları | Projeyi seçer; varsayılan mevcut klasördür |
| `--client <ad>` | `init` | Asistanı, `vscode` alternatif adını veya `all` seçeneğini belirler |
| `--apply` | `init` | Planlanan dosya değişikliklerini yazar; yoksa yalnızca önizler |
| `--local` | `init` | Kurulu Node ve paket dosyasının yolunu kullanır |
| `--with-rules` | `init` | Desteklenen kural adapter'ları için çalışma yönergesi ekler |
| `--brief <dosya>` | `directions` | Projeye göre brief yolu; varsayılan `brief.json` |
| `--direction <dosya>` | `contract` | Projeye göre üretilmiş yön yolu; varsayılan `direction.json` |
| `--expected-revision <sayı>` | `contract` | Beklenen mevcut revision; varsayılan `0` |
| `--contract-id <id>` | `audit` | Derlemenin döndürdüğü sözleşme artifact kimliği |
| `--url <url>` | `audit` | Çalışan uygulamanın sayfa adresi |
| `--allow-origin <origin>` | `serve`, `audit` | Tam eşleşen sayısal loopback origin'ine izin verir; tekrarlanabilir |
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

`pageType`: `portfolio`, `product` veya `dashboard`. Brief'te gerçek proje içeriği kullanın. CLI JSON çıktı verir; sayfalanan sonuçları IDE'nin MCP araçlarıyla okuyabilirsiniz.


## Tarayıcı denetimi

İsteğe bağlı bileşeni aynı projeye kurun:

```sh
npm install --save-dev @akifsen/art-director-browser@0.1.0
npx -y @akifsen/art-director-mcp@0.2.0 browser install
```

Uygulamanızın geliştirme sunucusunu başlatın. IDE yapılandırmasındaki Art Director sunucu argümanlarına uygulamanızın portuyla izinli origin ekleyin:

```text
--allow-origin http://127.0.0.1:5187
```

Denetim izole tarayıcı oturumunda çalışır; kişisel tarayıcı profilinizi kullanmaz. Art Director uygulamanızın sunucusunu başlatmaz. axe erişilebilirlik ve taşma kontrolleri değerlendirmeye yardımcı olur; WCAG sertifikası veya estetik puanı üretmez.

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
