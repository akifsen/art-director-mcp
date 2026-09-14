# Art Director MCP

Kodlama ajanları için yerel görsel yönler, sürümlü tasarım sözleşmesi ve render kanıtı üretir. GitHub üzerinden dağıtılan erken geliştirme sürümüdür; npm registry yayını henüz bekliyor.

```powershell
npm ci --ignore-scripts
npm run typecheck
npm run build
npm test
node packages/mcp/dist/cli.js doctor
node packages/mcp/dist/cli.js serve --project 'C:\tam\proje-yolu'
```

Altı MCP aracı, üç pack ve altı kompozisyon; brief → yön panosu → contract/token akışı uygulanmıştır. Ayrı browser worker ile desktop/mobile axe ve overflow denetimi vardır. API anahtarı istemez. IDE modeline aktarılan içerik sağlayıcı koşullarına tabidir.

Gerçek React/Vite demosu: `examples/expressive-product`. Kurulum ve test komutları İngilizce README'dedir. IDE config üretimi gerçek IDE entegrasyon testi değildir. Tam state/keyboard denetimi, incremental cache ve diğer kabul kapıları henüz tamamlanmamıştır. Ayrıntılar: `docs/status.md`.

## Projeye kurulum

```sh
npm install --save-dev https://github.com/akifsen/art-director-mcp/releases/download/v0.1.0/akifsen-art-director-mcp-0.1.0.tgz
npx art-director init --client cursor --apply --local
```

`cursor` yerine `codex` veya `vscode` seçilebilir. `--apply` olmadan önizleme, `--with-rules` ile isteğe bağlı ajan kuralı oluşturulur. Mevcut ayarlar korunur ve yedeklenir. npm registry yayımlandığında kısa `npx -y @akifsen/art-director-mcp@0.1.0 init --client cursor --apply` komutu kullanılabilir. Gerçek IDE oturumları henüz test edilmedi.

Desteklenen seçenekler: `claude`, `cursor`, `copilot`, `kiro`, `codex`, `qoder`, `roocode`, `gemini`, `opencode`, `continue`, `codebuddy`, `droid`, `kilocode`, `all`. `vscode` eski ad olarak korunur. `all` doğrulanmış proje adapter’larını kurar; global ayarları değiştirmez. Atlananlar: Windsurf, Antigravity, Trae, Warp, Augment. Ayrıntılar: [istemci matrisi](docs/clients.md).
