---
title: Fontaine (Jet d'Eau)
description: "Graphique Fontaine (Jet d'Eau) : un gros point pour la valeur habituelle, une fontaine de la plus basse à la plus haute, et un petit point par mesure réelle, pour compter combien de fois on dépasse sa limite. Expérimental."
---
# Fontaine (Jet d'Eau)

<span class="vp-badge warning">Expérimental</span> <span class="vp-badge tip">Comparaison</span>

::: warning Expérimental - pas encore stable
Contrairement aux 21 autres graphiques (qui sont stables), le graphique Fontaine est **expérimental** : son API, ses visuels et la forme de son `ChartContext` peuvent changer dans les futures versions. Core 1.29 l'a entièrement redessiné ; voir [Migrer depuis core 1.28](#migrating). Épinglez une version si vous en dépendez.
:::

**« Combien de temps dure mon trajet ? »** « Environ 30 minutes » est vrai, mais ce n'est pas toute la réponse. Certains jours il prend 22 minutes, d'autres 55. Ce que vous voulez vraiment savoir, c'est combien de fois il dépasse le temps que vous prévoyez. Le graphique Fontaine montre tout cela sur un seul axe : le temps habituel, le meilleur et le pire jour, et chaque jour sous forme d'un point que l'on peut compter.

Il porte le nom du Jet d'Eau de Genève : une tige fine monte du lac et retombe en fontaine.

<ChartDemo chart="fountain-chart" :index="0" :legend="false" :height="480" />

Chaque petit point est l'un des 20 derniers jours de travail. La voiture met en général 30 minutes, mais 3 de ses 20 jours ont dépassé la ligne des 45 minutes : un mauvais jour en voiture arrive parfois. Le bus l'a dépassée 8 jours sur 20 : un mauvais jour en bus est fréquent. Le train et le vélo électrique n'atteignent jamais la ligne.

## Comment le lire {#how-to-read-it}

::: tip Les règles
- **Le gros point est le chiffre à citer** : la valeur habituelle. La moitié des mesures sont en dessous, l'autre moitié au-dessus.
- **Un petit point est une mesure réelle** : 20 petits points, ce sont 20 jours.
- **Beaucoup de petits points serrés** montrent ce qui arrive d'habitude.
- **Une ligne rouge en pointillés** est une promesse ou une limite.
- **Combien de fois ?** Comptez les petits points au-delà de la ligne : **1 ou 2 sur 20, c'est rare ; 3 ou 4, c'est parfois ; 5 ou plus, c'est fréquent.** Sous chaque colonne, le graphique les compte pour vous : sur la démo, « 17 of 20 within 45 min » veut dire 17 jours du bon côté, donc 3 au-delà.
- **Une fontaine haute** veut dire que ça change beaucoup. Une fontaine basse, que c'est à peu près pareil à chaque fois.
- **Plus de petits points au total**, c'est plus de mesures, donc plus de confiance. Ce n'est pas une valeur plus grande.
- **Peu de petits points**, c'est juste une estimation. En dessous de 10, le graphique le dit (« only 5 days »).
- **La gauche et la droite ne veulent rien dire.** Les petits points se décalent seulement sur le côté pour ne pas se cacher les uns les autres.
:::

### Les parties d'une fontaine {#anatomy}

<ChartDemo chart="fountain-chart" :index="16" :legend="false" :height="420" />

1. **La tige** : une barre de 0 jusqu'au gros point. Elle s'arrête au gros point. Plus haut veut dire plus de minutes, et ici plus de minutes veut dire plus lent.
2. **Le gros point** : le jour habituel, 30 minutes. La moitié des jours ont été plus rapides, l'autre moitié plus lents. C'est ce chiffre qu'il faut retenir.
3. **La fontaine** : son sommet est le pire jour (55 minutes) et sa base plate le meilleur jour (22 minutes). Sa largeur ne veut rien dire : elle fait seulement de la place aux petits points.
4. **Les petits points** : un par jour réel, chacun à sa hauteur exacte, toujours dans la fontaine. Là où ils se serrent, entre 25 et 35 minutes, c'est ce qui arrive d'habitude. Les deux points tout en haut sont les seuls jours lents.
5. **La ligne et son compte** : la ligne rouge en pointillés est une promesse ou une limite, ici les 45 minutes que vous prévoyez. Sous la colonne, « 18 of 20 within 45 min » compte les petits points du bon côté de la ligne.

Les chiffres sont aussi écrits sous la colonne (habituel, meilleur, pire) et dans l'infobulle : personne n'a besoin de les mesurer sur l'axe.

### Six formes à reconnaître {#patterns}

Chaque fontaine ci-dessous est le même trajet, chronométré sur des jours différents, sur le même axe : des minutes, plus haut = plus lent.

#### Régulier

Une fontaine basse, les petits points serrés : presque le même temps tous les jours.

<ChartDemo chart="fountain-chart" :index="17" :legend="false" :height="320" />

#### Change beaucoup

Une fontaine haute, des petits points tout du long : les jours lents sont fréquents, prévoyez de la marge.

<ChartDemo chart="fountain-chart" :index="18" :legend="false" :height="320" />

#### Mauvais jours rares

La plupart des petits points en bas, un vide, puis un ou deux en haut : ça va d'habitude, les mauvais jours sont rares.

<ChartDemo chart="fountain-chart" :index="19" :legend="false" :height="320" />

#### Souvent mauvais

La plupart des petits points en haut et le gros point près du sommet : ici, lent est la journée normale.

<ChartDemo chart="fountain-chart" :index="20" :legend="false" :height="320" />

#### Juste une estimation

Seulement 5 petits points : trop peu de jours pour s'y fier. Le graphique ajoute « only 5 days » sous la colonne.

<ChartDemo chart="fountain-chart" :index="21" :legend="false" :height="320" />

#### Assez de jours

La même forme avec 20 petits points : plus de jours comptés, donc plus sûr. La fontaine va du même meilleur jour au même pire jour que celle du dessus ; seul le nombre de petits points a changé (la fontaine est un peu plus large, seulement pour leur faire de la place).

<ChartDemo chart="fountain-chart" :index="22" :legend="false" :height="320" />

## Quand l'utiliser, et quand l'éviter {#when-to-use}

**Utilisez-le** quand chaque colonne a un chiffre que l'on cite, l'étendue réelle autour, et si possible les mesures elles-mêmes, et que la question est « combien de fois ça dépasse ma limite ? ». Trajets, délais de livraison, prix selon les magasins, notes d'une classe, autonomie d'une batterie : tout ce qui se mesure encore et encore.

- Il se lit le mieux avec **2 à 12 colonnes** et 10 à 30 petits points dans chacune.
- Ajoutez une **ligne de référence avec `goodSide`** quand il y a une promesse, un budget ou une note minimale. Le graphique fait alors le compte pour le lecteur.
- Dites dans `yAxisTitle` dans quel sens c'est bien, par exemple « minutes (plus haut = plus lent) ».

**Prenez un autre graphique** quand :

- vous comparez deux valeurs par ligne (avant et après, 2010 et 2023) : le [Graphique d'écart](/fr/charts/gap) ;
- vous prévoyez beaucoup de périodes à l'avance et la prévision est de moins en moins sûre à mesure qu'on s'éloigne : le [Graphique en éventail](/fr/charts/fan) ;
- vous découpez un total en parts : les [Barres empilées verticales](/fr/charts/vertical-stack-bar) ;
- vous n'avez qu'un chiffre par élément et pas d'étendue : un simple graphique en barres le dit plus vite.

## Exemples {#examples}

Seize questions de tous les jours. Les chiffres sont illustratifs : inventés pour paraître réels, pas tirés d'une source publiée. Les graphiques affichent leurs textes en anglais ; `labels`, `endLabels` et `sampleWord` les traduisent (voir [Les options](#switches)).

### Combien de temps dure vraiment mon trajet ? {#commute-by-mode}

<ChartDemo chart="fountain-chart" :index="0" :legend="false" :height="480" />

**Comment le lire.** Chaque petit point est l'un des 20 derniers jours de travail. Les petits points de la voiture se regroupent entre 25 et 35 minutes, et seuls 3 jours ont dépassé les 45 minutes que je prévois, jusqu'à 55. Un mauvais jour en voiture arrive donc parfois. Le bus a dépassé 45 minutes 8 jours sur 20 : un mauvais jour en bus est fréquent. Les petits points du train et du vélo électrique n'atteignent jamais la ligne : ils mettent à peu près le même temps chaque jour.

**Pourquoi ce graphique.** Une barre du jour habituel fait gagner la voiture. La fontaine montre que la voiture peut aussi vous mettre 25 minutes en retard. Les petits points montrent à quelle fréquence : 3 jours sur 20 pour la voiture, 8 sur 20 pour le bus, et jamais pour le train ni le vélo électrique. Un matin où vous ne pouvez pas être en retard, prenez le train.

### Je paie pour 100 Mbit/s. Qu'est-ce que j'obtiens vraiment ? {#home-internet-promised-vs-real}

<ChartDemo chart="fountain-chart" :index="1" :legend="false" :height="480" />

**Comment le lire.** À 21 h, le gros point indique 62, mais la fontaine descend jusqu'à 22. Les petits points montrent que ce n'est pas un seul test malchanceux : 5 soirs sur 20, le débit était sous 40, moins de la moitié de ce que vous payez. À 17 h, seuls deux petits points sont bas : une fin d'après-midi lente est rare. À 7 h et à 1 h, les petits points sont serrés près du sommet : ces heures-là sont fiables.

**Pourquoi ce graphique.** Les débits habituels dépassent 80 en moyenne, assez proche de 100 pour ne pas s'en inquiéter. La fontaine de 21 h montre que le soir, le débit peut tomber à environ un cinquième de la promesse, et les petits points montrent que cela arrive à peu près un soir sur quatre, pas une seule fois. C'est la preuve à montrer au fournisseur.

### Combien de temps prend vraiment une livraison de repas ? {#food-delivery-real-time}

<ChartDemo chart="fountain-chart" :index="2" :legend="false" :height="480" />

**Comment le lire.** Chaque petit point est une commande. Le vendredi soir, l'attente habituelle est de 45 minutes, mais 5 des 20 dernières commandes ont pris plus d'une heure : les livraisons lentes sont fréquentes. Commandez avant d'avoir faim, ou allez chercher le repas. Un dimanche de pluie, presque toutes les commandes sont un peu lentes, mais seules 2 sur 18 ont dépassé une heure.

**Pourquoi ce graphique.** Les attentes habituelles vont de 25 à 50 minutes, et en barres elles ressemblent toutes à une attente normale. Les fontaines montrent que le vendredi soir et le dimanche de pluie peuvent tous deux prendre 80 à 90 minutes. Les petits points montrent lequel doit vous inquiéter : le vendredi, une commande sur quatre a dépassé une heure, alors que le dimanche de pluie, seulement deux. Le midi en semaine, la plupart des petits points restent à cinq minutes des 30 promises par l'appli, et tard le soir presque toutes les commandes font mieux.

### L'offre du Black Friday est-elle vraiment moins chère ? {#black-friday-tv}

<ChartDemo chart="fountain-chart" :index="3" :legend="false" :height="480" />

**Comment le lire.** Chaque petit point est le prix d'un magasin pour le même téléviseur. Fin octobre et début novembre, les petits points montent : la plupart des magasins augmentent le prix. La semaine du Black Friday, ils redescendent à peu près au niveau de début octobre : la plupart des « promotions » ne sont que 5 à 55 € sous la ligne d'octobre. Un seul petit point descend à 600 € : un magasin sur 15 le vend vraiment moins cher.

**Pourquoi ce graphique.** Une courbe du prix habituel ne montre qu'un petit creux. La fontaine montre les prix qui grimpent les semaines d'avant, et un bas qui atteint 600 € la semaine du Black Friday, mais seule elle ne dit pas combien de magasins sont aussi bon marché. Les petits points le disent : un magasin seul à 600 €, et les 14 autres serrés autour de la ligne d'octobre. Une vraie bonne affaire est rare, et le graphique le montre.

### Ma commande en ligne arrivera-t-elle à temps ? {#parcel-delivery-by-origin}

<ChartDemo chart="fountain-chart" :index="4" :legend="false" :height="440" />

**Comment le lire.** Depuis la Chine, le gros point indique 12 jours, mais la fontaine monte jusqu'à 30. Comptez les petits points : 4 des 20 colis ont mis plus de 3 semaines, un colis lent depuis la Chine n'est donc pas rare. Commandez un cadeau d'anniversaire un mois à l'avance. Depuis le Royaume-Uni, la plupart des petits points sont entre 5 et 7 jours : 5 colis ont mis plus longtemps, dont seulement 3 plus de 10 jours. Depuis l'Allemagne, chaque petit point est entre 2 et 5 jours.

**Pourquoi ce graphique.** Une barre des jours habituels dit seulement que plus c'est loin, plus c'est lent. La fontaine montre que plus c'est loin, moins c'est prévisible : une commande d'Allemagne ne prend jamais plus de 5 jours, alors qu'une commande de Chine peut prendre un mois si elle reste bloquée en douane. Les petits points montrent à quelle fréquence. Les fontaines du Royaume-Uni et de la Chine montent toutes deux très haut, mais depuis le Royaume-Uni seuls 3 colis ont mis plus de 10 jours, alors que depuis la Chine 4 sur 20 ont pris plus de 3 semaines. Cela vous dit si le cadeau arrivera avant l'anniversaire.

### Puis-je me fier à la météo pour le barbecue de samedi ? {#weather-forecast-week}

<ChartDemo chart="fountain-chart" :index="5" :legend="false" :height="440" />

**Comment le lire.** La fontaine de samedi reste entre 22° et 28°, au-dessus de la ligne des 20° dans tous les cas : le barbecue peut être prévu sans crainte. Celle de mardi va de 17° à 27° et passe sous la ligne : c'est plutôt une estimation.

**Pourquoi ce graphique.** Une courbe de prévision paraît aussi sûre pour mardi que pour aujourd'hui. Les fontaines grandissent au fil de la semaine : on voit tout de suite que le chiffre de samedi est fiable et celui de mardi non. Chaque fontaine est à peu près centrée sur son gros point, car la prévision peut se tromper dans les deux sens.

### Où puis-je louer un deux-chambres dans mon budget ? {#rent-by-city}

<ChartDemo chart="fountain-chart" :index="6" :legend="false" :height="480" />

**Comment le lire.** Regardez la ligne du budget de 1 000 €. Les fontaines de Lisbonne, Berlin et Madrid l'atteignent toutes, mais comptez les petits points à cet endroit, car chaque petit point est un appartement. Lisbonne n'a qu'un seul appartement à ce prix et Madrid deux. Berlin en a cinq : c'est la seule ville où un appartement à 1 000 € est facile à trouver.

**Pourquoi ce graphique.** Une barre du loyer habituel fait paraître Lisbonne, Berlin et Madrid à peu près pareilles. Les fontaines montrent que les trois descendent jusqu'à 1 000 €, et les petits points montrent à quelle fréquence. À Lisbonne, c'est un seul appartement chanceux, et le suivant est à 1 180 €. À Madrid, deux appartements, à Berlin cinq. En haut, les 2 300 € de Lisbonne sont un seul appartement, alors que la plupart coûtent entre 1 250 et 1 600 €.

### Est-ce moins cher de faire ses courses de l'autre côté de la frontière suisse ? {#border-basket}

<ChartDemo chart="fountain-chart" :index="7" :legend="false" :height="420" />

**Comment le lire.** La fontaine de chaque pays voisin s'arrête sous la base de celle de la Suisse (86 CHF) : même le magasin le plus cher de l'autre côté de la frontière bat le moins cher des magasins suisses.

**Pourquoi ce graphique.** Une barre dit seulement que la Suisse coûte plus cher. Les fontaines répondent à la vraie question : le trajet vaut-il le coup, quel que soit le magasin ? La fontaine suisse et les autres ne se touchent même pas. Ici, chaque fontaine est à peu près centrée sur son gros point, car un magasin bon marché fait économiser à peu près autant qu'un magasin cher coûte en plus.

### Pourquoi suis-je si fatigué le lundi ? {#sleep-by-night}

<ChartDemo chart="fountain-chart" :index="8" :legend="false" :height="480" />

**Comment le lire.** Chaque petit point est une nuit. Le gros point du dimanche n'est qu'une demi-heure sous celui d'une nuit de semaine, mais 5 de ses 16 petits points sont sous 5 heures. À peu près un dimanche sur trois est mauvais, et vous le sentez le lundi matin. La plupart des petits points des nuits de semaine sont entre 6 et 7 heures, avec une seule nuit courte.

**Pourquoi ce graphique.** Les barres disent que le dimanche (6 heures) est à peine pire qu'une nuit de semaine (6,5). La fontaine montre que le dimanche varie le plus, jusqu'à 3,5 heures. Les petits points montrent que c'est une habitude, pas un accident : 5 des 16 derniers dimanches étaient sous 5 heures. C'est donc la nuit du dimanche qu'il faut corriger.

### Mon téléphone tiendra-t-il encore la journée ? {#phone-battery-year-by-year}

<ChartDemo chart="fountain-chart" :index="9" :legend="false" :height="480" />

**Comment le lire.** La ligne est une journée complète : débranché à 7 h et encore allumé à 22 h. Chaque petit point est un jour : comptez les petits points sous la ligne. La première année, aucun jour n'a manqué. La deuxième, trois jours. La troisième, dix jours sur 21, dont trois où le téléphone s'est éteint avant 19 h. La quatrième année (en pointillés) est une estimation, et même un jour normal n'y suffit plus.

**Pourquoi ce graphique.** Le gros point du jour normal ne glisse que de 18 à 15 heures en trois ans : une simple courbe paraît rassurante. Les petits points montrent ce qui a vraiment changé. Neuf, le téléphone tenait la journée tous les jours. La troisième année, il ne tenait plus qu'un jour sur deux environ. C'est le moment où une nouvelle batterie vaut le coup.

### Mon train est-il vraiment souvent en retard ? {#train-really-late}

<ChartDemo chart="fountain-chart" :index="10" :legend="false" :height="480" />

**Comment le lire.** Comptez les petits points au-dessus de la ligne en pointillés. Ce sont les trajets que la compagnie elle-même considère en retard : 5 sur 20 pour le 7 h 42, 9 pour le 17 h 48 du retour, et 1 seul pour le 7 h 12. Un petit point pile sur la ligne (exactement 5 minutes) ne compte pas comme un retard.

**Pourquoi ce graphique.** Une barre du retard moyen mettrait le 7 h 42 à 5,5 minutes, comme si chaque trajet avait un peu de retard. En réalité, la moitié des trajets avaient 2 à 4 minutes de retard, et trois en avaient 12, 18 et 25. Une courbe dans le temps cacherait le choix entre les trains. Ici, on voit d'un coup d'œil que le 7 h 12 arrive presque toujours à l'heure, alors que le 7 h 42 gâche environ un matin sur quatre et le 17 h 48 presque un soir sur deux.

### Quels services rapportent le plus de pourboires ? {#tips-per-shift}

<ChartDemo chart="fountain-chart" :index="11" :legend="false" :height="480" />

**Comment le lire.** Comptez les petits points au-dessus de la ligne des 60 € : chaque samedi soir l'a dépassée, le vendredi l'a ratée deux fois, et le midi en semaine n'en a jamais approché.

**Pourquoi ce graphique.** Une barre des pourboires habituels met le vendredi (84 €) juste à côté du samedi (97 €) et les fait paraître semblables. Les petits points montrent que le vendredi est passé sous 60 € deux fois alors que le samedi jamais, et c'est ce qui décide quel service échanger. Une courbe n'a ici aucun ordre dans le temps à suivre.

### Quel jeu de société pouvons-nous finir avant le coucher ? {#board-game-before-bedtime}

<ChartDemo chart="fountain-chart" :index="12" :legend="false" :height="480" />

**Comment le lire.** Les Aventuriers du Rail (Ticket to Ride) durent en général 55 minutes, mais 4 de leurs 15 parties ont dépassé la ligne d'une heure avant le coucher. Le Scrabble dure en général 48 minutes et n'a dépassé que 2 fois sur 14. Le Uno n'a jamais dépassé ; le Monopoly a dépassé à chaque fois.

**Pourquoi ce graphique.** Une barre du temps habituel dit que le Scrabble (48 min) et les Aventuriers du Rail (55 min) tiennent tous deux en une heure. Les petits points montrent que les Aventuriers du Rail ont dépassé l'heure du coucher 4 parties sur 15, et le Scrabble seulement 2 sur 14. C'est la différence entre un coucher calme et une dispute.

### Les courses de la semaine dépassent-elles plus souvent 100 € ? {#weekly-shop-trend}

<ChartDemo chart="fountain-chart" :index="13" :legend="false" :height="480" />

**Comment le lire.** Le gros point n'est monté que de 88 € à 98 €, mais les petits points au-dessus de la ligne des 100 € sont passés de 2 semaines à 6 sur 13.

**Pourquoi ce graphique.** Une courbe de la facture habituelle paraît calme et reste sous le budget. Les petits points montrent que les semaines hors budget ont triplé (2, 3, 4, puis 6 sur 13), et c'est ce qu'une famille ressent vraiment. Une barre par saison le cacherait de la même façon.

### Ma fille nage-t-elle souvent le 50 m assez vite pour la compétition ? {#swim-gala-time}

<ChartDemo chart="fountain-chart" :index="14" :legend="false" :height="480" />

**Comment le lire.** Plus bas, c'est plus rapide. Les petits points sous la ligne en pointillés sont les nages assez rapides pour la compétition : aucune au premier trimestre, 2 sur 14 au deuxième et 5 sur 13 au troisième.

**Pourquoi ce graphique.** Une courbe de son temps habituel ne passe sous 40 s qu'à l'automne prochain : elle dit « pas encore prête ». Les petits points montrent qu'elle a déjà battu le temps de qualification 5 fois sur 13 cet été : elle pourrait s'inscrire dès maintenant. Une courbe ne peut pas le montrer.

### Combien d'élèves échouent à chaque contrôle ? {#class-test-pass-mark}

<ChartDemo chart="fountain-chart" :index="15" :legend="false" :height="480" />

**Comment le lire.** Comptez les petits points sous la ligne de la moyenne : le gros point des sciences est bien au-dessus, à 58, et pourtant 7 élèves sur 25 ont échoué, et 8 en français.

**Pourquoi ce graphique.** Une barre de la note habituelle de chaque matière met les cinq au-dessus de la moyenne et parle d'un bon trimestre. Les petits points montrent 7 échecs en sciences et 8 en français, contre aucun en lecture : c'est sur cela qu'un parent ou un enseignant doit agir.

## Forme des données {#data-shape}

Chaque élément du `dataSet` est un jet : une colonne en mode instantané, une période en mode tendance.

| Champ | Ce que c'est |
| --- | --- |
| `label` | Le nom de la colonne (instantané) ou de la série (tendance). |
| `value` | Le gros point : le chiffre à citer. Facultatif quand `samples` est fourni : c'est alors la mesure du milieu, avec la moitié des mesures en dessous et l'autre moitié au-dessus. |
| `low`, `high` | La base et le sommet de la fontaine. |
| `spread` | Raccourci pour une étendue égale des deux côtés : `low = value - spread`, `high = value + spread`. |
| `samples` | Les mesures réelles, un petit point chacune. |
| `forecast` | Une période qui n'a pas encore eu lieu (voir [Tendance et prévision](#trend-and-forecast)). |
| `date` | La position en x en mode tendance. |
| `color`, `code` | Une couleur pour cet élément, et un identifiant stable repris dans le contexte. |

L'étendue vient du premier disponible : `low` et `high`, puis `spread`, puis la plus basse et la plus haute mesure. Sans aucun des trois, pas de fontaine : seulement la tige et le gros point. Une mesure hors de `low`/`high`, ou une valeur hors de l'étendue, élargit l'étendue et envoie un [avertissement](/fr/api/fountain#warnings) : rien n'est caché. Les valeurs négatives sont acceptées : la tige descend alors depuis 0.

## Les options {#switches}

| Prop | Par défaut | Ce qu'elle fait |
| --- | --- | --- |
| `showRange` | `true` | Dessine la fontaine. `false` garde seulement la tige et le gros point ; les petits points disparaissent aussi, car ils ont besoin de la fontaine. |
| `showSamples` | `true` | Dessine un petit point par mesure, quand les éléments ont des `samples`. |
| `showValueLabels` | `true` | Écrit les chiffres sous chaque étiquette x : « usual 30 », les deux mots des extrémités, « only 5 days » sous 10 mesures, et les comptes. |
| `drift` | `false` | Le look genevois : le haut de chaque fontaine penche d'un côté, de la même façon pour tous. Cela ne porte aucune donnée. |
| `referenceLines` | aucune | Des lignes rouges en pointillés aux valeurs qui comptent. Avec `goodSide`, chaque colonne compte ses petits points du bon côté. |
| `endLabels` | `["lowest", "highest"]` | Les mots des deux extrémités de la fontaine, par exemple `["meilleur", "pire"]` ou `["moins cher", "plus cher"]`. |
| `readingGuide` | `false` | Une légende sous le graphique, sur une ligne quand elle tient ; sinon elle passe à la ligne entre ses règles (à chaque « · »). `true` affiche celle par défaut, avec seulement les règles des marques que le graphique dessine ; une chaîne la remplace. |
| `sampleWord` | `"measurements"` | Le mot au pluriel pour les petits points : « 20 jours », « seulement 5 commandes ». |
| `labels` | mots anglais | Les autres mots affichés : `usual`, `of`, `only` et `forecast`, pour d'autres langues. |
| `yAxisTitle` | aucun | Le titre à côté de l'axe y, par exemple « minutes (plus haut = plus lent) ». |

### Seulement la tige et le gros point : `showRange: false` {#show-range}

Sans la fontaine, le graphique devient un graphique en sucettes : une barre jusqu'à chaque gros point. Les petits points et les mots des extrémités disparaissent ; les comptes sous chaque colonne restent, car ils viennent des mesures.

<ChartDemo chart="fountain-chart" :index="24" :legend="false" :height="440" />

### Le look genevois : `drift: true` {#drift}

Le haut de chaque fontaine penche vers la droite de la même façon, comme le vrai Jet d'Eau un jour de brise. Tous les jets penchent pareil : l'inclinaison n'apprend donc rien au lecteur. Les lecteurs qui découvraient le graphique l'ont trouvée déroutante ; c'est pourquoi elle est désactivée par défaut. Utilisez-la pour une affiche, pas pour une décision.

<ChartDemo chart="fountain-chart" :index="23" :legend="false" :height="440" />

### Lignes, comptes et vos propres mots {#words}

```ts
const props = {
  yAxisTitle: "minutes (plus haut = plus lent)",
  endLabels: ["meilleur", "pire"], // "meilleur 22", "pire 55"
  sampleWord: "jours", // "20 jours", "seulement 5 jours" : toujours au pluriel
  referenceLines: [
    {
      value: 45,
      label: "Temps prévu : 45 min", // écrit au bout droit de la ligne
      goodSide: "below", // compte les petits points à 45 ou moins
      countLabel: "en 45 min ou moins", // "17 sur 20 en 45 min ou moins"
    },
  ],
  readingGuide: "Petit point = un jour · Gros point = le jour habituel · Fontaine haute = ça change beaucoup",
  // Les autres mots du graphique :
  labels: { usual: "habituel", of: "sur", only: "seulement", forecast: "prévision" },
};
```

- Un compte inclut les petits points pile sur la ligne : « below » compte ceux à la valeur ou en dessous, « above » ceux à la valeur ou au-dessus.
- Les colonnes de prévision et les colonnes sans mesures n'ont pas de compte.
- Sans `countLabel`, les mots sont « below the line » ou « above the line » : traduisez-les avec `countLabel`.
- `showValueLabels: false` retire les lignes sous les étiquettes x. L'infobulle montre toujours les mêmes chiffres.

## Tendance et prévision {#trend-and-forecast}

Le **mode instantané** est celui par défaut (`xAxisDataType: "band"`) : une colonne par `label`. Pour le **mode tendance**, choisissez un `xAxisDataType` temporel ou numérique (`"number"`, `"date_annual"` ou `"date_monthly"`) et donnez une `date` à chaque élément. Les jets se placent alors le long de l'axe x, et une ligne grise en pointillés relie les gros points (`showTrendLine` : activé par défaut en mode tendance avec une seule série ; désactivé avec plusieurs séries et en mode instantané). En mode tendance, `label` est le nom de la série : une série garde une seule couleur.

Un élément **`forecast: true`** est une période qui n'a pas encore eu lieu. Il a une tige et un contour en pointillés, un remplissage plus clair, un gros point creux, ni petits points ni comptes, et « (forecast) » après son étiquette x (traduisible avec `labels.forecast`).

Les périodes nommées (heures, trimestres, saisons) se placent à 1, 2, 3, etc. sur un axe numérique, et `xAxisFormat` affiche leurs noms :

```ts
const names = ["Année 1 (neuf)", "Année 2", "Année 3", "Année 4"];

const props = {
  xAxisDataType: "number",
  xAxisFormat: (d) => names[Number(d) - 1],
  yAxisTitle: "heures (plus haut = plus longtemps)",
  endLabels: ["plus court", "plus long"],
  sampleWord: "jours",
  referenceLines: [
    { value: 15, label: "une journée complète", goodSide: "above", countLabel: "a tenu la journée" },
  ],
  dataSet: [
    { label: "Batterie", date: 1, value: 18, low: 15, high: 20, samples: [18.5, 19, 17.5 /* … */] },
    { label: "Batterie", date: 2, value: 17, low: 13, high: 19, samples: [17, 18, 16.5 /* … */] },
    { label: "Batterie", date: 3, value: 15, low: 10, high: 17, samples: [15.5, 13, 16 /* … */] },
    { label: "Batterie", date: 4, value: 12, low: 7, high: 14, forecast: true },
  ],
};
```

Le graphique complet est dans la galerie : [Mon téléphone tiendra-t-il encore la journée ?](#phone-battery-year-by-year). Limitez le mode tendance à quelques périodes (environ 3 à 12), pour que chaque fontaine ait de la place.

## Faire défiler les périodes {#timeline}

En mode tendance, `timeline` ajoute un bouton lecture et un curseur qui parcourent les périodes. À chaque étape, le graphique dessine les jets jusqu'à la période active, jet actif compris, et le survol n'atteint que ce qui est dessiné. Le mode instantané n'a pas de périodes : le contrôle ne s'affiche pas. Désactivé par défaut.

<TimelinePlayDemo chart="fountain-chart" hint="Appuyez sur le bouton lecture sous le graphique : il parcourt les périodes et dessine les jets jusqu'à chacune. Faites glisser le curseur pour sauter à une période." />

::: code-group

```tsx [React]
const ref = useRef<FountainChartHandle>(null);

<FountainChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(period) / seekIndex(i) / stepForward()
```

```vue [Vue]
<FountainChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:fountainChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyFountainChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(period) / seekIndex(i)
</script>
```

:::

- `speedMs` règle le rythme, `loop` reboucle, `autoplay: true` démarre au montage, `showControl: false` masque la barre intégrée.
- Le contrôleur headless est toujours là : `chart.timeline()` expose `play() / pause() / toggle() / seek(period) / seekIndex(i) / stepForward() / stepBack()`, plus `onStep` et `formatPeriod` dans la config pour vos propres contrôles. Avec des périodes nommées, donnez à `formatPeriod` la même fonction que `xAxisFormat`.
- `seek(period)` cherche d'abord la période, en comparant le texte : `seek(2021)` et `seek("2021")` vont tous les deux sur 2021, que vos dates soient des nombres ou des chaînes. Un nombre ne compte comme une position (0 = la première) que si aucune période ne correspond, et une chaîne qui ne correspond à rien ne fait rien. `seekIndex(i)` va toujours par position, comme le curseur intégré.
- Les valeurs glissent entre les périodes par défaut (`interpolate`) ; `interpolate: false` saute d'une période à l'autre. Avec reduced motion, le saut est toujours net.
- `timeline` l'emporte sur `progressiveDraw` quand les deux sont définis.

## Animation de révélation

Le graphique se dessine de gauche à droite au montage. Désactivé par défaut : un graphique l'active avec la prop `progressiveDraw`.

<RevealDemo chart="fountain-chart" :height="440" replay-label="Rejouer l'animation" hint="Les jets apparaissent de gauche à droite ; les axes et les titres ne bougent pas. Avec reduced motion activé, le graphique s'affiche entièrement tracé, instantanément." />

`progressiveDraw: true` applique les réglages par défaut (1200 ms, easeInOutCubic). Un objet de configuration l'affine :

::: code-group

```tsx [React]
const ref = useRef<FountainChartHandle>(null);

<FountainChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() rejoue l'animation à la demande
```

```vue [Vue]
<FountainChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:fountainChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyFountainChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("c");
  el.progressiveDraw = { durationMs: 2000 };
  // el.replay() rejoue l'animation
</script>
```

:::

- `durationMs` et `easing` ("linear", "easeOutQuad", "easeInOutCubic", ou votre propre fonction `(t) => t`) règlent le tracé.
- `autoplay: false` rend le graphique entièrement tracé ; appelez `replay()` (handle de ref React, méthode du web component ou instance core) pour lancer l'animation à la demande. `replayOnUpdate: true` la rejoue à chaque changement de données.
- Respecte `prefers-reduced-motion` : le graphique s'affiche alors entièrement tracé, tout de suite.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeFountain() {
  const dataSet = [];
  for (let i = 0; i < 200; i++) {
    const value = Math.max(8, Math.round(40 + 25 * Math.sin(i / 11) + 10 * Math.sin(i / 3.3)));
    const low = value - (3 + (i % 5));
    const high = value + Math.round(4 + 14 * Math.abs(Math.sin(i / 5)));
    dataSet.push({ label: `Jet ${i + 1}`, value, low, high });
  }
  return { dataSet, xAxisDataType: "band", showValueLabels: false };
}
</script>

FountainChart dispose d'un `renderer="webgpu"` optionnel qui peint chaque tige, fontaine et gros point comme des marques instanciées sur le GPU, tandis que les axes, les étiquettes et les infobulles restent sur la couche SVG. Il dépend des capacités du navigateur : sans WebGPU, il revient à canvas, et `getContext().renderer` indique celui qui a vraiment peint. Au-delà d'une douzaine de colonnes, le graphique ne se lit plus comme une fontaine ; cette démo est un test de charge, pas une recommandation.

<WebgpuHeavyDemo element="michi-vz-fountain-chart" :make="makeFountain" caption="200 jets" />

## Usage

::: code-group

```tsx [React]
import { FountainChart } from "@michi-vz/react";

export default () => <FountainChart {...props} />; // props = les options du graphique
```

```vue [Vue]
<script setup>
import { FountainChart } from "@michi-vz/vue";
</script>

<template>
  <FountainChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { fountainChart } from "@michi-vz/svelte";
</script>

<div use:fountainChart={props}></div>
```

```ts [Angular]
// main.ts - enregistrez les éléments une seule fois
import "@michi-vz/angular";
import { applyFountainChartProps } from "@michi-vz/angular";

// composant (utilise CUSTOM_ELEMENTS_SCHEMA)
// template : <michi-vz-fountain-chart #c></michi-vz-fountain-chart>
applyFountainChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, referenceLines, …
</script>
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
chart.update(next);
chart.getContext(); // agnostique du renderer, prêt pour les LLM
chart.destroy();
```

:::

### Web component : attributs et propriétés {#web-component}

Les chaînes et les nombres simples peuvent être des attributs. Les tableaux, les objets, les fonctions et les options sont des propriétés.

```html
<michi-vz-fountain-chart
  id="trajet"
  chart-title="Combien de temps dure vraiment mon trajet ?"
  y-axis-title="minutes (plus haut = plus lent)"
  sample-word="jours"
  renderer="canvas"
></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("trajet");
  el.dataSet = [
    { label: "Voiture", value: 30, low: 22, high: 55, samples: [29, 31, 27 /* un par jour */] },
    { label: "Train", value: 35, low: 32, high: 42, samples: [34, 35, 33 /* … */] },
  ];
  el.endLabels = ["meilleur", "pire"];
  el.referenceLines = [
    { value: 45, label: "Temps prévu : 45 min", goodSide: "below", countLabel: "en 45 min ou moins" },
  ];
  el.labels = { usual: "habituel", of: "sur", only: "seulement", forecast: "prévision" };
  el.readingGuide = true;
  el.showRange = true; // aussi : showSamples, showValueLabels, drift
</script>
```

- **Attributs :** `chart-title`, `y-axis-title`, `sample-word`, `x-axis-data-type`, `renderer`, `locale`, `width`, `height`, `ticks`.
- **Propriétés seulement :** `dataSet`, `referenceLines`, `endLabels`, `labels`, `readingGuide`, `showRange`, `showSamples`, `showValueLabels`, `drift`, `showTrendLine`, `colors`, `colorsMapping`, `yAxisDomain`, `xAxisFormat`, `yAxisFormat`, `timeline`, `progressiveDraw`.
- Donnez le titre avec `chartTitle` (ou `chart-title`), pas `title` : sur un élément HTML, `title` est l'infobulle du navigateur.

## Migrer depuis core 1.28 {#migrating}

Core 1.29 remplace les deux anciennes silhouettes (le jet et le panache) par un seul dessin où chaque marque se lit sur l'axe y. L'ancien code continue de fonctionner ; voici ce qui change.

- **Les props retirées sont ignorées.** `style`, `frothLayers`, `bloomExponent`, `stemFraction`, `showDroplets` et `showMist` sont encore acceptées pendant une version, ne changent rien, et chacune envoie un [avertissement](/fr/api/fountain#warnings) `ignored-option`. Supprimez-les. Sur le web component, `fountainStyle` (`fountain-style`) est ignoré de la même façon.
- **`density` et `lean` par élément sont ignorés**, avec un avertissement `ignored-option`. Donnez de vraies mesures (`samples`) plutôt qu'une densité ; pour l'effet penché, utilisez `drift` sur tout le graphique.
- **`spread` dessine maintenant une vraie étendue.** `{ value: 30, spread: 8 }` fonctionne toujours : la fontaine va de 22 à 38 sur l'axe y. L'ancien graphique dessinait l'étendue comme une largeur qui n'était jamais sur l'axe. Si votre `spread` mesurait autre chose (une perte, un écart, une part), il ne convient plus à ce graphique : mettez ce chiffre dans l'infobulle ou dans un autre graphique.
- **`predicted` et `certainty` fonctionnent toujours** ; le nouveau nom est `forecast` (`certainty: false` équivaut à `forecast: true`).
- **L'axe y** inclut maintenant 0, chaque `low` et `high` et chaque ligne de référence, plus 10 % de marge. Les valeurs négatives se dessinent sous le lac.
- **En mode tendance, les éléments sans `date`** sont ignorés avec un avertissement `missing-date`. Avant, ils faisaient passer tout le graphique en mode instantané.
- **Chargement et absence de données.** La fontaine accepte maintenant `isLoading`, `isNodata`, `noDataLabel` et `suppressDefaultOverlay`, comme les autres graphiques. Un `dataSet` vide affiche l'overlay d'absence de données (« No data available », ou votre `noDataLabel`) au lieu d'axes vides : passez `isLoading` pendant le chargement des données, ou `isNodata: false` pour garder les axes vides.
- **Les couleurs** viennent de tout le `dataSet`, dans l'ordre d'apparition : désactiver une étiquette ne recolore jamais les autres, et une `color` par élément est respectée.
- **TypeScript : `value` et `spread` sont maintenant facultatifs** dans `FountainDataItem`, car un élément peut ne donner que des `samples`. Le code qui lit `.value` ou `.spread` sur vos propres éléments peut avoir besoin d'une vérification ou de `?? 0`. `tooltipFormatter` reçoit l'élément avec sa `value` remplie (la médiane des mesures quand l'élément n'en donne pas) : `d.value` y est donc toujours un nombre, et un formateur typé `(d: FountainDataItem) => string` convient toujours.
- **Contexte.** `jets[].spread`, `jets[].spreadRatio` et `jets[].upperBound` restent comme alias dépréciés ; utilisez `range`, `rangeRatio` et `high`. `jets[].lean` vaut toujours `null`. `stats.frothiest` est un alias déprécié ; utilisez `stats.widestRange`. Voir [getContext()](/fr/api/fountain#getcontext).

## API

Les props sont typées comme `FountainChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du renderer. Référence complète : [API Fontaine](/fr/api/fountain).
