# Art Director MCP

**Kodlama ajanınıza görsel yön, tasarım sözleşmesi ve sonucu iyileştirecek kanıt sağlayın.**

Art Director MCP, IDE'nizin yanında yerel olarak çalışır. Proje brief'inden farklı görsel yönler üretir, seçilen kararları sürümlü bir tasarım sözleşmesine dönüştürür ve çalışan arayüzden tarayıcı kanıtı toplar.

[English](README.md) · [İstemci uyumluluğu](docs/clients.md)

## Özellikler

- Üç tasarım paketi ve altı kompozisyonla tipografi, yerleşim, mobil davranış ve arayüz durumlarını belirleyin.
- Proje kısıtlarını koruyan tasarım sözleşmeleri, token çıktıları ve CSS değişkenleri oluşturun.
- Gezinme, içerik, form, tablo ve giriş bölümleri için uygulama rehberi alın.
- İsteğe bağlı tarayıcı bileşeniyle masaüstü/mobil ekran görüntüleri, erişilebilirlik bulguları ve yatay taşma ölçümleri toplayın.

Uygulama kodunu ve görsel değerlendirmeyi IDE ajanınız yapar. Art Director ek model API anahtarı istemez.

## Kurulum

**Node.js 24 LTS** ve npm gerekir. Projenizin klasöründe çalıştırın:

```sh
npm install --save-dev https://github.com/akifsen/art-director-mcp/releases/download/v0.1.0/akifsen-art-director-mcp-0.1.0.tgz
npx art-director init --client cursor --apply --local
```

Paket [GitHub sürümünden](https://github.com/akifsen/art-director-mcp/releases/tag/v0.1.0) kurulur. `--local`, IDE'yi projenize kurulmuş kopyaya bağlar. IDE'yi yeniden yükleyip gerektiğinde MCP sunucusunu onaylayın.

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

Cursor, Copilot ve Codex için `--with-rules` ile çalışma yönergesi ekleyebilirsiniz. Yapılandırma testleri dosya üretimini ve birleştirmeyi doğrular; gerçek IDE oturum testleriyle aynı şey değildir. Dosya yolları ve istemci ayrıntıları [uyumluluk belgesindedir](docs/clients.md).

## Çalışma akışı

1. Projenin UI dosyalarını, teknolojilerini, token'larını ve varlıklarını inceleyin.
2. Brief ve içeriğinizle oluşturulan görsel yön panolarını karşılaştırın.
3. Seçilen yönü sürümlü tasarım sözleşmesine dönüştürün.
4. Arayüzü IDE ajanınızla uygulayın.
5. Çalışan arayüzü denetleyip bulgularla iyileştirin.

Altı MCP aracı: `inspect_project`, `propose_directions`, `compile_design_contract`, `get_blueprint`, `audit_ui`, `get_artifact`.

Yön panoları tasarım çalışmalarıdır. Uygun yön sayısı proje bağlamına göre değişir. Sözleşme güncellemelerinde revision kontrolü, başka bir istemcinin kararlarının sessizce ezilmesini önler.

## Tarayıcı denetimi

İsteğe bağlı bileşeni aynı projeye kurun:

```sh
npm install --save-dev https://github.com/akifsen/art-director-mcp/releases/download/v0.1.0/akifsen-art-director-browser-0.1.0.tgz
npx art-director browser install
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
