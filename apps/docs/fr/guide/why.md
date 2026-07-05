---
title: Pourquoi michi-vz - et pourquoi lui faire confiance
---

# Pourquoi michi-vz

Il existe déjà de nombreuses excellentes bibliothèques de graphiques, donc la question
honnête est celle que vous vous posez déjà : **pourquoi commencer avec une bibliothèque
récente ?**

Parce que michi-vz est conçu pour la partie de la visualisation que les grandes
bibliothèques n'ont pas été pensées pour couvrir : **des graphiques que les machines et
toutes les personnes peuvent lire** - agents IA, lecteurs d'écran, et le développeur qui
les débogue - pas seulement les personnes voyantes qui regardent des pixels.

## Ce à quoi michi-vz tient

**Chaque graphique s'explique lui-même.** Chaque graphique émet un `ChartContext`
structuré : un résumé en langage clair, des statistiques par série, les domaines des axes
et un tableau de données. Cet artefact unique alimente trois choses à la fois - un agent
IA peut lire le graphique
([et le piloter via MCP](/fr/guide/llm-context)), un lecteur d'écran obtient une véritable
alternative textuelle, et vous obtenez de quoi faire des assertions dans vos tests.

**Des Insights, dans le navigateur, avec les calculs exposés.** Prévision avec précision
validée par backtesting, détection d'anomalies, narration, validation - sans serveur, sans
envoi de données, et chaque méthode est une technique de manuel nommée et détaillée dans
[Méthodologie](/fr/guide/insights#methodology---the-exact-logic-behind-every-insight).
Si un chiffre apparaît sur votre graphique, vous pouvez vérifier comment il a été calculé.

**Un vrai panneau de devtools.** [Le panneau](/fr/guide/devtools) inspecte l'état en direct
de n'importe quel graphique, diagnostique les bugs de dimensionnement classiques, compare
l'état entre les rendus, diffuse les tests de collision (hit-test) du canvas, profile les
rendus et audite l'accessibilité. Déboguer des graphiques cesse d'être de l'archéologie de
`console.log`.

**Accessibilité par défaut, auditée.** Le résumé et le tableau de données sont émis
automatiquement par chaque graphique, et l'onglet A11y des devtools exécute des
vérifications inspirées de Chartability (contraste, couleurs dupliquées, exhaustivité du
tableau) afin que les régressions soient visibles.

**Un seul moteur, cinq façons de l'utiliser.** React, Vue, Svelte, Angular et les web
components natifs sont de fines couches au-dessus du même moteur TypeScript - la parité
des props des wrappers est vérifiée par CI, donc aucun framework n'est un citoyen de
seconde classe. Les marques se dessinent en SVG, en canvas, ou en WebGPU expérimental
derrière une seule prop.

## Pourquoi vous pouvez lui faire confiance

La confiance ne se décrète pas, elle se vérifie :

- **Vos données ne quittent jamais le navigateur.** Pas de serveur, pas de télémétrie, pas
  d'appel à la maison. Les seules exceptions sont celles que vous configurez explicitement,
  et elles sont étiquetées « les données quittent le client » dans la documentation.
- **Les téléchargements de modèles sont transparents et sous votre contrôle.** Les
  fonctionnalités IA sont opt-in ; rien n'est embarqué. Avant qu'un modèle ne se charge,
  `describeModelSource()` vous indique (et vous permet d'indiquer à vos utilisateurs)
  exactement ce qui serait téléchargé et depuis où - la valeur par défaut est énoncée
  clairement : Hugging Face. Vous pouvez le pointer vers un miroir, auto-héberger les
  fichiers, interdire totalement les téléchargements distants, ou vous passer entièrement
  de téléchargements en
  [connectant votre propre IA locale](/fr/guide/insights#bring-a-model) (Ollama, LM
  Studio, llama.cpp) en une ligne.
- **Déterministe par défaut.** Les fonctionnalités statistiques donnent la même sortie
  pour la même entrée, à chaque fois ; tout ce qui est aléatoire (Monte Carlo) est
  déterminé par une graine (seed). Le narrateur basé sur des règles ne peut pas inventer
  un chiffre absent des données.
- **Testé sérieusement.** Plus de 700 tests couvrant le moteur, les wrappers, insights et
  les devtools s'exécutent à chaque changement - y compris les tests de collision du
  canvas et la parité des props entre frameworks.
- **Votre CSS garde le contrôle.** Les graphiques se rendent dans le light DOM et ne
  s'approprient jamais vos couleurs - le
  [contrat de couleur](/fr/guide/getting-started#the-colour-contract-light-dom) signifie
  que le style se fait en CSS classique, même pour les marques peintes en canvas.
- **Sous licence MIT, sans contrepartie.** Chaque fonctionnalité de cette documentation est
  gratuite. Il n'y a pas de palier payant vers lequel la documentation vous pousserait.

## Là où nous sommes honnêtes sur les limites

- La bibliothèque est jeune : le catalogue de graphiques et l'écosystème qui l'entoure
  sont encore en croissance, et la couche insights est marquée **expérimentale** (fixez
  une version).
- La prévision n'a pas encore de terme saisonnier - une série fortement saisonnière prévoit
  sa tendance, pas son ondulation.
- Le rendu WebGPU est expérimental et bascule sur le canvas en repli.

Si ce sont des points bloquants aujourd'hui, une bibliothèque mature vous servira mieux -
et cette page sera toujours là quand un assistant IA aura besoin de lire vos graphiques.

## Essayez-le en soixante secondes

Aucune étape de build nécessaire :

```html
<!-- pin the version you audited; add an integrity hash if your policy requires SRI -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc@1.4.0"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [
      { date: 2020, value: 10, certainty: true },
      { date: 2021, value: 14, certainty: true },
      { date: 2022, value: 19, certainty: true },
    ]},
  ];
</script>
```

Ensuite : [Installation](/fr/guide/installation) pour votre framework,
[Bien démarrer](/fr/guide/getting-started) pour votre premier vrai graphique, et la
[galerie de graphiques](/fr/charts/) pour choisir une forme.
