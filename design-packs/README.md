# Original pack catalog

The validated source of truth currently lives in `packages/core/src/domain.ts` (`packs`). Three packs each contain two recipes: Editorial Signal (margin-notes, folio), Vivid Product (product-stage, guided-path), Quiet Precision (workbench, ledger).

Since pack version 1.1.0 each recipe carries an optional `type` block (`heading`: serif/sans/condensed, `body`: serif/sans, `headingWeight`, `numerals`) that drives boards, tokens and blueprints; packs without it validate and fall back to a neutral sans system. Run the export command in scripts/export-packs.mjs after changing the catalog. JSON files are data; `art-director pack validate` validates an individual pack. External pack loading and a complete third-party pack SDK are not yet supported. All original recipes are MIT; user assets keep their own licenses, with CC0 preferred when sourcing new assets.
