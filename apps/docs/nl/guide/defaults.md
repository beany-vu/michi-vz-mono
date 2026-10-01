# Standaardwaarden voor de hele app

`setMichiVzDefaults` legt eenmalig voor de hele app vast hoe elke grafiek begint: het kleurenpalet, het lettertype, de hoeken van balken en tegels, en de tooltip. Het is de michi-vz-tegenhanger van `Highcharts.setOptions` en werkt hetzelfde in React, Vue, Svelte, Angular en de webcomponenten.

```ts
import { setMichiVzDefaults } from "@michi-vz/core"; // ook geëxporteerd door elk frameworkpakket

setMichiVzDefaults({
  colors: ["#1A657D", "#3E75B0", "#21B6A8"],
  fontFamily: "Roboto",
  barRadius: 0,
  tileRadius: 0,
  tooltip: { borderRadius: 0, shadow: false },
});
```

Roep het aan voordat de eerste grafiek wordt geplaatst, bijvoorbeeld naast het startpunt van je app. Elke aanroep wordt samengevoegd met de vorige, en `resetMichiVzDefaults()` gaat terug naar het ingebouwde uiterlijk.

## Welke waarde wint

Een prop op een grafiek wint altijd. Daarna komen de standaardwaarden van de app, dan het ingebouwde uiterlijk. Zo houdt `<TreemapChart tileRadius={6} />` zijn hoeken van 6 px, ook als de standaardwaarden 0 zeggen.

## Opties

| Optie | Geldt voor | Ingebouwd |
|---|---|---|
| `colors` | elke grafiek zonder `colors`-prop, en de legenda | de 20 kleuren van `DEFAULT_COLORS` |
| `fontFamily` | alle tekst in grafieken, in svg, canvas en webgpu | overgenomen van de pagina |
| `barRadius` | vergelijkende staafdiagrammen (horizontaal en verticaal) | 5 |
| `tileRadius` | tegels van de Treemap | 1 |
| `tooltip.borderRadius` | elke tooltip, in px | 4 |
| `tooltip.shadow` | `false` (geen), `true` (ingebouwd) of een css `box-shadow` | een zachte schaduw |
| `tooltip.background`, `tooltip.borderColor`, `tooltip.color` | elke tooltip | wit, `#ccc`, overgenomen |
| `tooltip.fontSize` | elke tooltip, in px | `--michi-vz-font-size` (12) |

## Hetzelfde in elke renderer

Elke standaardwaarde wordt bepaald voordat er iets getekend wordt: het palet en de hoekstralen in het datamodel van de grafiek, het lettertype en de tooltip als css-variabelen op de grafiek. Zo tekenen `renderer="svg"`, `"canvas"` en `"webgpu"` dezelfde kleuren en hoeken, en is de tooltip overal hetzelfde element.

De tooltipwaarden worden css-variabelen (`--michi-vz-tooltip-radius`, `--michi-vz-tooltip-shadow`, `--michi-vz-tooltip-bg`, `--michi-vz-tooltip-border`, `--michi-vz-tooltip-color`, `--michi-vz-tooltip-font-size`), zodat een stylesheet ze voor één pagina nog kan overschrijven.
