/* =========================================================================
   BIBLIOTHÈQUE — script.js
   -------------------------------------------------------------------------
   Gestion des livres, Espace personnel "Ma Bibliothèque",
   Couvertures haute qualité & Liseuse interactive (E-Reader).
   ========================================================================= */

/* ---------------------------------------------------------------------
   1) CONSTANTES & LOCALSTORAGE KEYS
   --------------------------------------------------------------------- */
const STORAGE_KEY = "biblio_books";
const COUNTER_KEY = "biblio_next_id";
const PROGRESS_KEY = "biblio_reading_progress";
const FAVORITES_KEY = "biblio_favorites";
const READER_SETTINGS_KEY = "biblio_reader_settings";
const PROFILE_KEY = "biblio_user_profile";

const SPINE_COLORS = [
  "#1F3A34", "#B8874A", "#3E7D51", "#7B4B3A", "#4A5E8C", "#8C4A6B", "#A3762F", "#2A526A"
];

/* ---------------------------------------------------------------------
   1 bis) 20 LIVRES DE TEST AVEC COUVERTURES & TEXTES COMPLETS
   --------------------------------------------------------------------- */
const SEED_BOOKS_DATA = [
  {
    title: "Le Petit Prince",
    author: "Antoine de Saint-Exupéry",
    category: "Roman",
    year: 1943,
    copies: 5,
    cover: "https://covers.openlibrary.org/b/id/12836262-L.jpg",
    content: `--- Chapitre 1 : Les grandes personnes et les serpents boas ---
Lorsque j'avais six ans j'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s'appelait « Histoires Vécues ». Ça représentait un serpent boa qui avalait un fauve.

On disait dans le livre : « Les serpents boas avalent leur proie tout entière, sans la mâcher. Ensuite ils ne peuvent plus bouger et ils dorment pendant les six mois de leur digestion. »

J'ai alors beaucoup réfléchi sur les aventures de la jungle et, à mon tour, j'ai réussi, avec un crayon de couleur, à tracer mon premier dessin. Mon dessin numéro 1. Il était comme ça : j'avais dessiné l'intérieur d'un boa digérant un éléphant.

J'ai montré mon chef-d'œuvre aux grandes personnes et je leur ai demandé si mon dessin leur faisait peur. Elles m'ont répondu : « Pourquoi un chapeau ferait-il peur ? » Mon dessin ne représentait pas un chapeau. Il représentait un serpent boa qui digérait un éléphant. J'ai alors dessiné l'intérieur du serpent boa, afin que les grandes personnes puissent comprendre. Elles ont toujours besoin d'explications.

--- Chapitre 2 : La rencontre dans le désert ---
J'ai ainsi vécu seul, sans personne avec qui parler véritablement, jusqu'à une panne dans le désert du Sahara, il y a six ans. Quelque chose s'était cassé dans mon moteur. Et comme je n'avais avec moi ni mécanicien, ni passagers, je me préparais à essayer de réussir, tout seul, une réparation difficile. C'était pour moi une question de vie ou de mort. J'avais à peine de l'eau à boire pour huit jours.

Le premier soir je me suis donc endormi sur le sable à mille milles de toute terre habitée. J'étais bien plus isolé qu'un naufragé sur un radeau au milieu de l'Océan. Alors vous imaginez ma surprise, au lever du jour, quand une drôle de petite voix m'a réveillé. Elle disait :
— S'il vous plaît... dessine-moi un mouton !
— Hein !
— Dessine-moi un mouton...

Je sautai sur mes pieds comme si j'avais été frappé par la foudre. Je me frottai bien les yeux. Je regardai bien. Et je vis un petit bonhomme tout à fait extraordinaire qui me considérait gravement.

--- Chapitre 3 : L'apprivoisement et le secret du Renard ---
— Qu'est-ce que signifie « apprivoiser » ? demanda le petit prince.
— C'est une chose trop oubliée, dit le renard. Ça signifie « créer des liens... »
— Créer des liens ?
— Bien sûr, dit le renard. Tu n'es encore pour moi qu'un petit garçon tout semblable à cent mille petits garçons. Et je n'ai pas besoin de toi. Et tu n'as pas besoin de moi non plus. Mais, si tu m'apprivoises, nous aurons besoin l'un de l'autre. Tu seras pour moi unique au monde. Je serai pour toi unique au monde...

Voici mon secret. Il est très simple : on ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux.
— L'essentiel est invisible pour les yeux, répéta le petit prince, afin de se souvenir.`
  },
  {
    title: "Python Facile",
    author: "Jean Dupont",
    category: "Informatique",
    year: 2020,
    copies: 3,
    cover: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop&q=80",
    content: `--- Chapitre 1 : Introduction au langage Python ---
Python est un langage de programmation interprété, interactif, orienté objet et de haut niveau. Créé par Guido van Rossum à la fin des années 1980, il a conquis le monde par sa clarté syntaxique exemplaire.

Pourquoi choisir Python ?
1. Une lisibilité remarquable proche du pseudo-code.
2. Une vaste bibliothèque standard (« batteries incluses »).
3. Un écosystème riche dans la Data Science, l'Intelligence Artificielle et le développement Web.

Pour exécuter votre première instruction, rien de plus simple :
print("Bonjour, monde !")

--- Chapitre 2 : Variables, Conditions et Boucles ---
Les variables en Python n'exigent aucune déclaration explicite de type. Le typage est dynamique et inféré automatiquement lors de l'assignation :

nom = "Alice"
age = 24
est_etudiant = True

Les structures de contrôle utilisent l'indentation comme délimiteur de blocs :
if age >= 18:
    print(f"{nom} est majeure.")
else:
    print(f"{nom} est mineure.")

Les boucles for parcourent aisément n'importe quelle séquence :
for i in range(5):
    print("Itération n°", i)

--- Chapitre 3 : Fonctions et Bonnes Pratiques ---
Une fonction s'écrit avec le mot-clé 'def'. Il est recommandé d'y ajouter des docstrings pour documenter clairement les entrées et sorties :

def calculer_carre(nombre):
    """Retourne le carré du nombre fourni."""
    return nombre ** 2

La modularité et la simplicité restent au cœur de la philosophie Python (le fameux Zen de Python).`
  },
  {
    title: "Les Misérables",
    author: "Victor Hugo",
    category: "Roman",
    year: 1862,
    copies: 4,
    cover: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
    content: `--- Chapitre 1 : Un juste — Monseigneur Myriel ---
En 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. C'était un vieillard d'environ soixante-quinze ans ; il occupait le siège de Digne depuis 1806.

Quoique ce détail ne touche en aucune manière au fond même de ce que nous avons à raconter, il n'est peut-être pas inutile d'indiquer ici les bruits et les propos qui avaient couru sur son compte au moment où il était arrivé dans le diocèse. Vrai ou faux, ce qu'on dit des hommes tient souvent autant de place dans leur vie et surtout dans leur destinée que ce qu'ils font.

L'évêque vivait dans une pauvreté volontaire, donnant presque la totalité de ses revenus aux indigents, aux malades et aux hôpitaux.

--- Chapitre 2 : L'arrivée de Jean Valjean ---
À l'heure où le soleil se couchait, un homme qui voyageait à pied entra dans la petite ville de Digne. Cet homme était Jean Valjean.

Il portait sur l'épaule un paquetage râpé, un gros bâton noueux à la main. Partout où il frappa pour obtenir du pain ou un toit, on lui ferma la porte au nez sitôt qu'on aperçut son passeport jaune de forçat libéré. Dix-neuf ans de bagne pour avoir volé un pain et tenté de s'évader.

Rejeté par toute la cité, il frappa enfin à la porte de l'Évêché.

--- Chapitre 3 : Les chandeliers d'argent ---
L'évêque l'accueillit avec une infinie douceur :
— Asseyez-vous, monsieur, et chauffez-vous. Nous allons souper tout à l'heure, et votre lit sera préparé pendant que vous souperez.

Dans la nuit, tourmenté par ses démons et la misère, Jean Valjean s'empara de l'argenterie et s'enfuit. Capturé au matin par les gendarmes, il fut ramené devant Monseigneur Myriel.
À la stupeur générale, l'évêque déclara :
— Ah ! vous voilà ! Je suis bien aise de vous voir. Mais quoi ! je vous avais donné les chandeliers aussi, qui sont en argent comme le reste et dont vous pouvez bien avoir deux cents francs. Pourquoi ne les avez-vous pas emportés avec vos couverts ?

Puis, se penchant vers lui :
— Jean Valjean, mon frère, vous n'appartenez plus au mal, mais au bien. C'est votre âme que je vous achète.`
  },
  {
    title: "Une Brève Histoire du Temps",
    author: "Stephen Hawking",
    category: "Science",
    year: 1988,
    copies: 2,
    cover: "https://covers.openlibrary.org/b/id/8306073-L.jpg",
    content: `--- Chapitre 1 : Notre image de l'Univers ---
Un scientifique réputé donnait un jour une conférence publique sur l'astronomie. Il décrivait comment la Terre tourne autour du Soleil et comment le Soleil, à son tour, gravite autour du centre d'un vaste rassemblement d'étoiles appelé notre Galaxie.

À la fin de la conférence, une petite vieille dame se leva au fond de la salle et dit :
— Tout ce que vous venez de raconter, ce sont des bêtises. En réalité, le monde est une assiette plate posée sur le dos d'une tortue géante.
Le scientifique sourit avec condescendance avant de répliquer :
— Et sur quoi repose la tortue ?
— Vous êtes très malin, jeune homme, mais c'est des tortues jusqu'en bas !

Cette anecdote montre à quel point notre conception de l'Univers a évolué depuis les mythes anciens jusqu'aux équations de la relativité générale.

--- Chapitre 2 : L'Espace et le Temps selon Einstein ---
Avant le XXe siècle, on croyait que le temps s'écoulait de manière absolue et universelle, identique pour tout le monde. Albert Einstein a balayé cette illusion.

Le temps et l'espace sont intimement liés au sein d'un tissu à quatre dimensions : l'espace-temps. La gravité n'est pas une simple force invisible agissant à distance, mais la courbure même de cet espace-temps provoquée par la masse et l'énergie des corps célestes.

--- Chapitre 3 : Les Trous Noirs et les Mystères Quantiques ---
Le terme « trou noir » est d'origine récente. Il a été forgé en 1969 par le physicien américain John Wheeler. Il désigne une région de l'espace où la gravitation est si intense que rien, pas même la lumière, ne peut s'en échapper.`
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    category: "Histoire",
    year: 2011,
    copies: 6,
    cover: "https://covers.openlibrary.org/b/id/12539702-L.jpg",
    content: `--- Chapitre 1 : Un animal sans importance ---
Il y a 100 000 ans, la Terre était habitée par au moins six espèces différentes d'hominidés. Aujourd'hui, il n'en reste qu'une seule : Homo sapiens.

Comment une espèce d'animal moyen, vivant dans un coin d'Afrique de l'Est et craignant les grands prédateurs, est-elle devenue le maître incontesté de la planète Terre ?

Trois grandes révolutions ont façonné le cours de cette formidable aventure :
1. La Révolution cognitive (il y a ~70 000 ans).
2. La Révolution agricole (il y a ~12 000 ans).
3. La Révolution scientifique (il y a ~500 ans).

--- Chapitre 2 : L'Arbre de la Connaissance et la Fiction ---
Le véritable super-pouvoir de Sapiens ne réside pas dans sa force musculaire ou sa taille de cerveau, mais dans sa capacité unique à coopérer de manière flexible en très grand nombre.

Et qu'est-ce qui permet cette coopération à grande échelle ? La capacité d'inventer et de croire collectivement à des fictions : les mythes, les dieux, les nations, les lois et l'argent.

--- Chapitre 3 : Une journée chez les chasseurs-cueilleurs ---
Pendant des dizaines de milliers d'années, nos ancêtres ont vécu en petits groupes nomades. Leurs connaissances sur leur environnement naturel étaient prodigieuses. Ils bénéficiaient d'une alimentation diversifiée et travaillaient souvent moins d'heures par jour que l'ouvrier ou le cadre moderne.`
  },
  {
    title: "1984",
    author: "George Orwell",
    category: "Science-fiction",
    year: 1949,
    copies: 5,
    cover: "https://covers.openlibrary.org/b/id/12547191-L.jpg",
    content: `--- Chapitre 1 : Big Brother vous regarde ---
C'était une journée d'avril froide et claire. Les horloges sonnaient treize heures. Winston Smith, le menton enfoncé dans le cou pour échapper au vent glacial, se glissa rapidement par les portes vitrées des Maisons de la Victoire, bien que pas assez vite pour empêcher un tourbillon de poussière et de gravier d'entrer en même temps que lui.

Le couloir empestait le chou cuit et les vieux paillassons. Au fond, une affiche en couleurs, trop grande pour être déployée à l'intérieur, avait été clouée au mur. Elle représentait simplement un visage énorme, large de plus d'un mètre : le visage d'un homme d'environ quarante-cinq ans, à l'épaisse moustache noire et aux traits vigoureusement séduisants.

Sous le portrait, les mots disaient :
BIG BROTHER VOUS REGARDE.

--- Chapitre 2 : Le journal intime interdit ---
Dans la pièce, le télécran diffusait sans arrêt une voix métallique détaillant des chiffres de production d'acier. Winston s'assit dans la petite alcôve hors de portée du regard du télécran.

Il ouvrit le carnet qu'il avait acheté dans une boutique clandestine du quartier des prolétaires. Du papier blanc et épais, une relique du passé.
Tremblant, il trempa la plume dans l'encre et écrivit la date :
4 avril 1984.
Écrire un journal intime était puni de mort, ou tout au moins de vingt-cinq ans de camp de travail forcé.

--- Chapitre 3 : La Novlangue et la Double-Pensée ---
« La guerre, c'est la paix.
La liberté, c'est l'esclavage.
L'ignorance, c'est la force. »
Tels étaient les trois slogans inscrits sur la façade étincelante du Ministère de la Vérité.`
  },
  {
    title: "Le Comte de Monte-Cristo",
    author: "Alexandre Dumas",
    category: "Roman",
    year: 1844,
    copies: 3,
    cover: "https://covers.openlibrary.org/b/id/8225261-L.jpg",
    content: `--- Chapitre 1 : L'arrivée à Marseille ---
Le 24 février 1815, la vigie de Notre-Dame de la Garde signala le trois-mâts le Pharaon, venant de Smyrne, Trieste et Naples.

Un pilote côtier partit aussitôt du port et monta à bord du navire. Edmond Dantès, jeune marin plein d'avenir de dix-neuf ans, se tenait sur le pont, dirigeant les manœuvres d'une voix calme et assurée. Il rapportait le navire à bon port après la mort en mer du capitaine Leclerc.

Le bonheur lui souriait : il allait être nommé capitaine et épouser la belle Mercédès.

--- Chapitre 2 : Le complot et l'arrestation ---
Mais la jalousie rongeait ses ennemis : Danglars qui convoitait son poste, et Fernand Mondego qui aimait Mercédès à la folie. Ensemble, avec l'aide de Gérard de Villefort, ils rédigèrent une lettre de dénonciation calomnieuse accusant Dantès de conspiration bonapartiste.

En plein repas de fiançailles, les gardes firent irruption. Dantès fut arraché aux bras de Mercédès et jeté dans un cachot du redoutable Château d'If.

--- Chapitre 3 : Le trésor de l'Abbé Faria ---
Quatorze années d'enfermement auraient dû anéantir Edmond. Mais dans l'obscurité, il rencontra l'abbé Faria, un savant italien qui lui enseigna les sciences, les langues, l'histoire, et lui transmit le secret du trésor inestimable caché sur l'île déserte de Monte-Cristo.`
  },
  {
    title: "Introduction à l'Algorithmique",
    author: "Claire Morel",
    category: "Informatique",
    year: 2018,
    copies: 2,
    cover: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&auto=format&fit=crop&q=80",
    content: `--- Chapitre 1 : Qu'est-ce qu'un algorithme ? ---
Un algorithme est une suite ordonnée, non ambiguë et finie d'opérations ou d'instructions permettant de résoudre un problème ou d'accomplir une tâche précise à partir de données en entrée.

L'analogie classique est la recette de cuisine : des ingrédients en entrée, des étapes rigoureuses et reproductibles, et un plat savoureux en sortie.

Les trois critères fondamentaux d'un bon algorithme sont :
1. La correction (il donne le bon résultat).
2. L'efficacité (il économise le temps de calcul et la mémoire).
3. La clarté (il est compréhensible et maintenable).

--- Chapitre 2 : La complexité et la notation Grand O ---
Pour mesurer la performance d'un algorithme indépendamment de la puissance de la machine, on étudie sa complexité asymptotique (notée O).

- O(1) : Temps constant (accès direct par clé ou index).
- O(log n) : Temps logarithmique (recherche dichotomique).
- O(n) : Temps linéaire (parcours d'une liste).
- O(n log n) : Tri efficace (Tri fusion, Tri rapide).
- O(n²) : Temps quadratique (doubles boucles imbriquées).

--- Chapitre 3 : Recherche et Tri fondamentaux ---
La recherche dichotomique permet de trouver un élément dans un tableau trié en divisant l'espace de recherche par deux à chaque étape. Pour 1 million d'éléments, 20 comparaisons suffisent !`
  },
  {
    title: "L'Étranger",
    author: "Albert Camus",
    category: "Roman",
    year: 1942,
    copies: 4,
    cover: "https://covers.openlibrary.org/b/id/11188392-L.jpg",
    content: `--- Chapitre 1 : Aujourd'hui, maman est morte ---
Aujourd'hui, maman est morte. Ou peut-être hier, je ne sais pas. J'ai reçu un télégramme de l'asile : « Mère décédée. Enterrement demain. Sentiments distingués. » Cela ne veut rien dire. C'était peut-être hier.

L'asile de vieillards est à Marengo, à quatre-vingts kilomètres d'Alger. J'ai pris l'autobus à deux heures. Il faisait très chaud. J'ai mangé au restaurant, chez Céleste, comme d'habitude. Ils avaient tous beaucoup de peine pour moi et Céleste m'a dit : « On n'a qu'une mère. » Quand je suis parti, ils m'ont accompagné à la porte.

--- Chapitre 2 : Le soleil d'Alger et la plage ---
C'était un dimanche d'été éclatant. Avec Marie et Raymond, nous sommes allés sur la plage près d'un cabanon. La lumière écrasait la mer dans un flamboiement de miroir.

Sur le sable brûlant, nous avons aperçu deux Arabes vêtus de bleus de chauffe. La tension est montée dans la moiteur de l'après-midi. La chaleur pesait sur mes épaules comme une chape de plomb.

--- Chapitre 3 : L'absurde et la sentence ---
Tout a vacillé dans l'éclat aveuglant du soleil se reflétant sur la lame d'un couteau. La gâchette a cédé. J'ai compris que j'avais détruit l'équilibre du jour, le silence exceptionnel d'une plage où j'avais été heureux.`
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    category: "Science-fiction",
    year: 1965,
    copies: 2,
    cover: "https://covers.openlibrary.org/b/id/11149454-L.jpg",
    content: `--- Chapitre 1 : L'épreuve du Gom Jabbar ---
Au début de tout, il y eut cette nuit glacée sur Caladan avant le grand départ pour Arrakis.

La Révérende Mère Gaius Helen Mohiam, vêtue de sa robe d'ombre des Bene Gesserit, ordonna au jeune Paul Atréides d'approcher :
— Place ta main droite dans cette boîte, jeune homme.
Paul sentit une terreur primitive monter en lui, mais le regard sévère de sa mère Jessica l'obligea au courage.

La douleur commença comme une brûlure lente, puis devint insoutenable, consumant ses nerfs.
— Si tu retires ta main, l'aiguille du Gom Jabbar touchera ton cou et la mort sera instantanée. Un animal ronge sa patte pour fuir le piège. Un être humain endure l'épreuve pour dominer son instinct.

--- Chapitre 2 : Arrakis, la planète des sables ---
Arrakis... Dune... Une planète désertique hostile balayée par des tempêtes de Coriolis géantes, où l'eau est la monnaie la plus précieuse et où rôdent les monstrueux vers des sables, Shai-Hulud.

Mais Arrakis est surtout le seul endroit de l'univers connu où l'on récolte l'Épice gériatrique (le Mélange), indispensable aux voyages spatiaux de la Guilde.`
  },
  {
    title: "Histoire de France",
    author: "Ernest Lavisse",
    category: "Histoire",
    year: 1900,
    copies: 1,
    cover: "https://covers.openlibrary.org/b/id/9255566-L.jpg",
    content: `--- Chapitre 1 : Les origines et la Gaule ---
Autrefois, le pays où nous vivons s'appelait la Gaule et ses habitants étaient les Gaulois.

Les Gaulois étaient grands, vigoureux et braves. Ils aimaient la guerre et les parures éclatantes. Leurs prêtres, les Druides, cueillaient le gui sacré dans les forêts de chênes millénaires. Vercingétorix unit les tribus pour défendre leur terre contre Jules César lors du siège héroïque d'Alésia.

--- Chapitre 2 : Des Mérovingiens aux Capétiens ---
Avec Clovis et le baptême de Reims, un royaume nouveau prend forme. Charlemagne étend son empire d'Occident et organise les écoles. Puis, en 987, Hugues Capet est élu roi, fondant une dynastie qui unifiera patiemment les provinces de France siècle après siècle.

--- Chapitre 3 : Le Siècle des Lumières et la République ---
Au XVIIIe siècle, les idées de Voltaire, Rousseau et Diderot éclairent les esprits. La liberté, l'égalité et la fraternité deviennent les piliers de la modernité.`
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Informatique",
    year: 2008,
    copies: 3,
    cover: "https://covers.openlibrary.org/b/id/10522435-L.jpg",
    content: `--- Chapitre 1 : Pourquoi le code propre compte ---
Vous lisez ce livre pour deux raisons. Premièrement, vous êtes programmeur. Deuxièmement, vous voulez devenir un meilleur programmeur.

Le seul véritable moyen de mesurer la qualité d'un code dans une revue d'équipe est le nombre de « WTF par minute ». Un mauvais code ralentit l'équipe, accumule la dette technique et finit par immobiliser des projets entiers. Écrire du code propre est un acte de respect envers vos pairs et votre futur vous-même.

--- Chapitre 2 : Nommer les choses avec soin ---
Les noms doivent révéler l'intention.
- Choisissez des noms prononçables et faciles à chercher.
- Évitez les abréviations cryptiques comme 'd' ou 'chk_val'.
- Préférez 'elapsedTimeInDays' à 'd'.
- Une classe doit être un nom (ex. Customer, Account), une méthode un verbe (ex. postPayment, deletePage).

--- Chapitre 3 : Des fonctions courtes et pures ---
La première règle des fonctions est qu'elles doivent être courtes. La seconde règle est qu'elles doivent être encore plus courtes.
Une fonction ne doit faire qu'une seule chose, et elle doit la faire bien.`
  },
  {
    title: "Le Rouge et le Noir",
    author: "Stendhal",
    category: "Roman",
    year: 1830,
    copies: 3,
    cover: "https://covers.openlibrary.org/b/id/8235114-L.jpg",
    content: `--- Chapitre 1 : La petite ville de Verrières ---
La petite ville de Verrières peut passer pour l'une des plus jolies de la Franche-Comté. Ses maisons blanches avec leurs toits pointus de tuiles rouges s'étendent sur la pente d'une colline, dont des touffes de vigoureux châtaigniers dessinent les moindres sinuosités. Le Doubs coule à quelques centaines de pieds au-dessous de ses fortifications.

C'est là que règne Monsieur de Rênal, maire fier de sa noblesse et soucieux de sa réputation.

--- Chapitre 2 : Julien Sorel et l'ambition ---
Fils d'un modeste scieur de bois, Julien Sorel est un jeune homme timide mais doté d'une intelligence vive et d'une mémoire prodigieuse. Idolâtrant secrètement Napoléon Bonaparte, il rêve d'élévation sociale et refuse le destin médiocre auquel sa naissance le condamnait.`
  },
  {
    title: "Cosmos",
    author: "Carl Sagan",
    category: "Science",
    year: 1980,
    copies: 2,
    cover: "https://covers.openlibrary.org/b/id/10398642-L.jpg",
    content: `--- Chapitre 1 : Les rivages de l'océan cosmique ---
Le Cosmos est tout ce qui est, tout ce qui a jamais été, et tout ce qui sera jamais.

La simple contemplation du Cosmos nous fait vibrer : nous éprouvons un frisson sacré, une voix douce nous rappelle un lointain souvenir, comme si nous tombions d'une grande hauteur. Nous savons que nous approchons du plus grand des mystères.

Nous sommes faits de poussière d'étoiles. Les atomes de fer dans notre sang, l'oxygène dans nos poumons et le carbone dans nos muscles ont été forgés au cœur d'étoiles massives qui ont explosé il y a des milliards d'années.

--- Chapitre 2 : Une planète fragile — Le point bleu pâle ---
Regardez ce point. C'est ici. C'est notre foyer. C'est nous. Sur ce grain de poussière suspendu dans un rayon de soleil, tous ceux que vous aimez, tous ceux que vous connaissez, chaque être humain qui a jamais vécu a consumé son existence.`
  },
  {
    title: "Harry Potter à l'École des Sorciers",
    author: "J.K. Rowling",
    category: "Jeunesse",
    year: 1997,
    copies: 7,
    cover: "https://covers.openlibrary.org/b/id/10521270-L.jpg",
    content: `--- Chapitre 1 : Le survivant ---
Mr et Mrs Dursley, qui habitaient au 4, Privet Drive, avaient toujours affirmé avec la plus grande fierté qu'ils étaient parfaitement normaux, merci pour eux. Jamais quiconque n'aurait imaginé qu'ils puissent se trouver impliqués dans quoi que ce soit d'étrange ou de mystérieux. Ils n'avaient pas de temps à perdre avec des sornettes.

Pourtant, cette nuit-là, un chat tigré lisait une carte routière au coin de la rue, et un vieil homme vêtu d'une longue robe violette nommé Albus Dumbledore déposait un panier sur le perron des Dursley.

À l'intérieur reposait un bébé endormi au front marqué d'une fine cicatrice en forme d'éclair.

--- Chapitre 2 : La lettre venue de nulle part ---
Dix ans passèrent. Harry vivait sous l'escalier, maltraité par son cousin Dudley, jusqu'au jour où un hibou majestueux apporta une lettre scellée de cire pourpre portant le blason d'une école de magie : Poudlard.`
  },
  {
    title: "Germinal",
    author: "Émile Zola",
    category: "Roman",
    year: 1885,
    copies: 3,
    cover: "https://covers.openlibrary.org/b/id/8235035-L.jpg",
    content: `--- Chapitre 1 : La plaine sous la nuit noire ---
Dans la plaine rase, sous la nuit sans étoiles, d'une obscurité et d'une épaisseur d'encre, un homme marchait seul, le long de la grand-route de Marchiennes à Montsou, dix kilomètres de pavé coupant tout droit, à travers les champs de betteraves.

Devant lui, il ne voyait même pas le sol noir, et il n'avait la sensation de l'immense horizon découvert que par les souffles du vent de mars, de grands coups de vent, froids comme des coups de faux, qui balayaient la terre.

Cet homme était Étienne Lantier, mécanicien sans travail chassé de Lille pour avoir giflé son patron.

--- Chapitre 2 : La fosse du Voreux ---
Au loin, des feux rouges perçaient les ténèbres. C'était la fosse du Voreux, monstre de fer et de brique accroupi dans la nuit, avalant des hommes pour nourrir ses chaudières insatiables de charbon.`
  },
  {
    title: "La Physique Quantique pour les Nuls",
    author: "Sami Boudelal",
    category: "Science",
    year: 2015,
    copies: 1,
    cover: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
    content: `--- Chapitre 1 : Le monde étrange de l'infiniment petit ---
Dans notre monde quotidien, les objets ont des positions nettes et des trajectoires prévisibles. Si vous lancez une balle de tennis, vous pouvez calculer exactement où elle atterrira.

Mais à l'échelle atomique, les règles changent totalement. Une particule peut se comporter à la fois comme une bille solide et comme une vague d'eau (dualité onde-corpuscule).

--- Chapitre 2 : Le chat de Schrödinger et la superposition ---
Tant qu'on ne regarde pas un système quantique, il existe dans une superposition de tous les états possibles à la fois. C'est la fameuse expérience de pensée d'Erwin Schrödinger : le chat dans la boîte est simultanément vivant et mort tant que la boîte reste fermée !`
  },
  {
    title: "Fondation",
    author: "Isaac Asimov",
    category: "Science-fiction",
    year: 1951,
    copies: 2,
    cover: "https://covers.openlibrary.org/b/id/12836263-L.jpg",
    content: `--- Chapitre 1 : Hari Seldon et la Psychohistoire ---
Hari Seldon était né la quarante-quatrième année de l'Ère Impériale. Il avait créé la Psychohistoire, la science mathématique capable de prédire l'avenir des sociétés humaines à grande échelle.

Ses calculs étaient formels : le glorieux Empire Galactique, vieux de 12 000 ans, allait s'effondrer d'ici trois siècles, suivi par 30 000 ans de barbarie. Pour réduire cette nuit à un seul millénaire, Seldon créa la Fondation aux confins de la Galaxie, sur la planète Terminus.

--- Chapitre 2 : Les Encyclopédistes de Terminus ---
Rassemblés sur ce monde rocheux, les savants avaient pour mission de compiler l'Encyclopedia Galactica, somme de tout le savoir humain pour préserver la flamme de la civilisation.`
  },
  {
    title: "Les Fables",
    author: "Jean de La Fontaine",
    category: "Poésie",
    year: 1668,
    copies: 4,
    cover: "https://covers.openlibrary.org/b/id/8231991-L.jpg",
    content: `--- Fable 1 : La Cigale et la Fourmi ---
La Cigale, ayant chanté
Tout l'été,
Se trouva fort dépourvue
Quand la bise fut venue.
Pas un seul petit morceau
De mouche ou de vermisseau.

Elle alla crier famine
Chez la Fourmi sa voisine,
La priant de lui prêter
Quelque grain pour subsister
Jusqu'à la saison nouvelle.

La Fourmi n'est pas prêteuse :
C'est là son moindre défaut.
« Que faisiez-vous au temps chaud ?
Dit-elle à cette emprunteuse.
— Nuit et jour à tout venant,
Je chantais, ne vous déplaise.
— Vous chantiez ? J'en suis fort aise.
Eh bien ! dansez maintenant. »

--- Fable 2 : Le Corbeau et le Renard ---
Maître Corbeau, sur un arbre perché,
Tenait en son bec un fromage.
Maître Renard, par l'odeur allché,
Lui tint à peu près ce langage :
« Hé ! bonjour, Monsieur du Corbeau.
Que vous êtes joli ! que vous me semblez beau !
Sans mentir, si votre ramage
Se rapporte à votre plumage,
Vous êtes le Phénix des hôtes de ces bois. »

À ces mots le Corbeau ne se sent pas de joie ;
Et pour montrer sa belle voix,
Il ouvre un large bec, laisse tomber sa proie.
Le Renard s'en saisit, et dit : « Mon bon Monsieur,
Apprenez que tout flatteur
Vit aux dépens de celui qui l'écoute :
Cette leçon vaut bien un fromage, sans doute. »
Le Corbeau, honteux et confus,
Jura, mais un peu tard, qu'on ne l'y prendrait plus.`
  },
  {
    title: "Petit Cahier d'Exercices de Confiance en Soi",
    author: "Charly Cungi",
    category: "Développement personnel",
    year: 2013,
    copies: 2,
    cover: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&auto=format&fit=crop&q=80",
    content: `--- Chapitre 1 : Les piliers de l'estime de soi ---
La confiance en soi n'est pas un don inné réservé à quelques privilégiés, mais une compétence psychologique qui se cultive et s'entraîne pas à pas.

Les trois dimensions clés :
1. L'amour de soi : s'accepter inconditionnellement avec ses forces et ses limites.
2. La vision de soi : le regard bienveillant que l'on porte sur ses capacités.
3. La confiance en soi en action : oser agir sans craindre exagérément l'échec.

--- Chapitre 2 : Dépasser le syndrome de l'imposteur ---
Chaque jour, notez 3 petites réussites personnelles. Célébrer les petits pas renforce le sentiment d'auto-efficacité et calme la voix du critique intérieur.`
  }
];

/* ---------------------------------------------------------------------
   2) FONCTIONS DE CHARGEMENT & PERSISTANCE
   --------------------------------------------------------------------- */

/** Récupère la liste des livres depuis le localStorage */
function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erreur de lecture des livres :", e);
    return [];
  }
}

/** Sauvegarde la liste complète des livres */
function saveBooks(bList) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bList));
  } catch (e) {
    console.error("Erreur d'écriture des livres :", e);
    showToast("Impossible d'enregistrer les livres dans le localStorage.", "error");
  }
}

/** Génère un identifiant incrémental LIV-0001, LIV-0002... */
function generateId() {
  try {
    let next = parseInt(localStorage.getItem(COUNTER_KEY) || "1", 10);
    const id = "LIV-" + String(next).padStart(4, "0");
    localStorage.setItem(COUNTER_KEY, String(next + 1));
    return id;
  } catch (e) {
    return "LIV-" + Date.now();
  }
}

/** Suivi de la progression de lecture */
function loadReadingProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveReadingProgress(prog) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(prog));
  } catch (e) {}
}

function getBookProgress(bookId) {
  const all = loadReadingProgress();
  return all[bookId] || { percent: 0, chapter: 0, isFinished: false, lastReadAt: null };
}

function setBookProgress(bookId, data) {
  const all = loadReadingProgress();
  all[bookId] = { ...(all[bookId] || {}), ...data, lastReadAt: new Date().toISOString() };
  saveReadingProgress(all);
}

/** Favoris */
function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveFavorites(favs) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch (e) {}
}

function isFavorite(bookId) {
  return loadFavorites().includes(bookId);
}

function toggleFavorite(bookId) {
  let favs = loadFavorites();
  const index = favs.indexOf(bookId);
  if (index >= 0) {
    favs.splice(index, 1);
    showToast("Retiré des favoris.", "info");
  } else {
    favs.push(bookId);
    showToast("Ajouté aux favoris ❤️", "success");
  }
  saveFavorites(favs);
  renderAll();
}

/** Réglages liseuse */
function loadReaderSettings() {
  try {
    const raw = localStorage.getItem(READER_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { theme: "sepia", fontSize: 18, fontSerif: true };
  } catch (e) {
    return { theme: "sepia", fontSize: 18, fontSerif: true };
  }
}

function saveReaderSettings(settings) {
  try {
    localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

/* ---------------------------------------------------------------------
   PROFIL UTILISATEUR
   --------------------------------------------------------------------- */
const EMOJI_PRESETS = ['\ud83d\udcd6','\ud83e\udd89','\ud83e\udd85','\ud83d\udc3b','\ud83e\udd81','\ud83d\udc22','\ud83d\ude80','\ud83c\udf1f','\ud83c\udfaf','\ud83d\udcda','\u270d\ufe0f','\ud83d\udcd5','\ud83d\udcac','\ud83c\udf0d','\u2615'];

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : { name: 'Mon Profil', avatar: '\ud83d\udc64', bio: 'Passionn\u00e9(e) de lecture', favoriteGenre: '', readingGoal: 12 };
  } catch (e) {
    return { name: 'Mon Profil', avatar: '\ud83d\udc64', bio: 'Passionn\u00e9(e) de lecture', favoriteGenre: '', readingGoal: 12 };
  }
}

function saveProfile(p) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch (e) {}
}

function updateSidebarProfile() {
  const p = loadProfile();
  const allProg = loadReadingProgress();
  const finishedCount = books.filter(b => allProg[b.id]?.isFinished || allProg[b.id]?.percent === 100).length;
  document.getElementById('sidebarAvatar').textContent = p.avatar || '\ud83d\udc64';
  document.getElementById('sidebarName').textContent = p.name || 'Mon Profil';
  document.getElementById('sidebarReadCount').textContent = finishedCount + ' livre' + (finishedCount > 1 ? 's' : '') + ' lu' + (finishedCount > 1 ? 's' : '');
}

function renderProfileView() {
  const p = loadProfile();
  const allProg = loadReadingProgress();
  const favs = loadFavorites();

  // Hero
  document.getElementById('profileAvatarDisplay').textContent = p.avatar || '\ud83d\udc64';
  document.getElementById('profileNameDisplay').textContent = p.name || 'Mon Profil';
  document.getElementById('profileBioDisplay').textContent = p.bio || 'Passionn\u00e9(e) de lecture';

  // Badges d'accomplissement
  const finishedCount = books.filter(b => allProg[b.id]?.isFinished || allProg[b.id]?.percent === 100).length;
  const readingCount = books.filter(b => allProg[b.id]?.percent > 0 && !allProg[b.id]?.isFinished).length;
  const favCount = favs.length;
  const badgesEl = document.getElementById('profileHeroBadges');
  const badges = [];
  if (p.favoriteGenre) badges.push(`<span class="profile-badge">\ud83c\udff7\ufe0f ${escapeHTML(p.favoriteGenre)}</span>`);
  if (finishedCount >= 10) badges.push(`<span class="profile-badge gold">\ud83c\udfc6 Grand Lecteur</span>`);
  else if (finishedCount >= 5) badges.push(`<span class="profile-badge gold">\u2b50 Lecteur assidu</span>`);
  else if (finishedCount >= 1) badges.push(`<span class="profile-badge">\u2705 Premier livre terminé</span>`);
  if (favCount >= 5) badges.push(`<span class="profile-badge">❤\ufe0f ${favCount} favoris</span>`);
  badgesEl.innerHTML = badges.join('');

  // Stats row
  const totalRead = finishedCount;
  const goalPct = p.readingGoal ? Math.min(100, Math.round((finishedCount / p.readingGoal) * 100)) : 0;
  const statsEl = document.getElementById('profileStatsRow');
  statsEl.innerHTML = `
    <div class="profile-stat-card">
      <div class="profile-stat-icon">\ud83d\udcda</div>
      <div class="profile-stat-value">${books.length}</div>
      <div class="profile-stat-label">Livres dans la collection</div>
    </div>
    <div class="profile-stat-card">
      <div class="profile-stat-icon">\u2705</div>
      <div class="profile-stat-value">${totalRead}</div>
      <div class="profile-stat-label">Livres terminés</div>
    </div>
    <div class="profile-stat-card">
      <div class="profile-stat-icon">\ud83d\udcd6</div>
      <div class="profile-stat-value">${readingCount}</div>
      <div class="profile-stat-label">En cours de lecture</div>
    </div>
    <div class="profile-stat-card">
      <div class="profile-stat-icon">❤\ufe0f</div>
      <div class="profile-stat-value">${favCount}</div>
      <div class="profile-stat-label">Favoris</div>
    </div>
    ${p.readingGoal ? `
    <div class="profile-stat-card">
      <div class="profile-stat-icon">\ud83c\udfaf</div>
      <div class="profile-stat-value">${goalPct}%</div>
      <div class="profile-stat-label">Objectif ${p.readingGoal} livres/an</div>
      <div class="profile-goal-bar-wrap"><div class="profile-goal-bar" style="width:${goalPct}%"></div></div>
    </div>` : ''}
  `;

  // Formulaire
  document.getElementById('profileName').value = p.name || '';
  document.getElementById('profileAvatarEmoji').value = p.avatar || '';
  document.getElementById('profileBio').value = p.bio || '';
  document.getElementById('profileFavoriteGenre').value = p.favoriteGenre || '';
  document.getElementById('profileReadingGoal').value = p.readingGoal || '';

  // Emoji presets
  const presetsEl = document.getElementById('emojiPresets');
  presetsEl.innerHTML = EMOJI_PRESETS.map(em => `
    <button type="button" class="emoji-preset-btn ${p.avatar === em ? 'active' : ''}" data-emoji="${em}">${em}</button>
  `).join('');

  // Lectures récentes
  const recentEl = document.getElementById('profileRecentReads');
  const recentEmptyEl = document.getElementById('profileRecentEmpty');
  const booksWithProgress = books
    .filter(b => allProg[b.id] && allProg[b.id].percent > 0)
    .sort((a, b) => {
      const da = allProg[a.id]?.lastReadAt || '';
      const db = allProg[b.id]?.lastReadAt || '';
      return db.localeCompare(da);
    })
    .slice(0, 8);

  recentEmptyEl.hidden = booksWithProgress.length > 0;
  recentEl.innerHTML = booksWithProgress.map(b => {
    const prog = allProg[b.id];
    const statusLabel = prog.isFinished ? 'Terminé ✓' : 'En cours';
    const thumbHTML = b.cover
      ? `<div class="profile-read-thumb"><img src="${escapeAttr(b.cover)}" alt="" loading="lazy" onerror="this.style.display='none'" /></div>`
      : `<div class="profile-read-thumb" style="background:${colorForCategory(b.category)};">${escapeHTML(b.title.slice(0,2))}</div>`;
    return `
      <div class="profile-read-item" data-id="${b.id}">
        ${thumbHTML}
        <div class="profile-read-info">
          <div class="profile-read-title">${escapeHTML(b.title)}</div>
          <div class="profile-read-author">${escapeHTML(b.author)}</div>
        </div>
        <div class="profile-read-progress">
          <span class="profile-read-percent">${prog.percent}%</span>
          <span class="profile-read-status">${statusLabel}</span>
        </div>
        <button class="btn btn-primary btn-sm profile-read-btn" data-action="read" data-id="${b.id}">${prog.isFinished ? 'Relire' : 'Continuer'}</button>
      </div>
    `;
  }).join('');

  // Favoris
  const favGrid = document.getElementById('profileFavoritesGrid');
  const favEmptyEl = document.getElementById('profileFavoritesEmpty');
  const favBooks = books.filter(b => favs.includes(b.id));
  favEmptyEl.hidden = favBooks.length > 0;
  favGrid.innerHTML = favBooks.map(b => {
    const spineBg = colorForCategory(b.category);
    const coverHTML = b.cover
      ? `<img src="${escapeAttr(b.cover)}" alt="${escapeAttr(b.title)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="profile-fav-fallback" style="background:${spineBg}; display:none;">
           <span>\ud83d\udcd6</span>
           <div class="fav-title">${escapeHTML(b.title)}</div>
         </div>`
      : `<div class="profile-fav-fallback" style="background:${spineBg};">
           <span>\ud83d\udcd6</span>
           <div class="fav-title">${escapeHTML(b.title)}</div>
         </div>`;
    return `
      <div class="profile-fav-card" data-id="${b.id}">
        <div class="profile-fav-cover">${coverHTML}</div>
        <div class="profile-fav-info">
          <div class="fav-book-title">${escapeHTML(b.title)}</div>
          <div class="fav-author">${escapeHTML(b.author)}</div>
        </div>
        <button class="profile-fav-read-btn" data-action="read" data-id="${b.id}">\ud83d\udcd6 Lire</button>
      </div>
    `;
  }).join('');

  updateSidebarProfile();
}

/** Couleur stable pour chaque catégorie */
function colorForCategory(category) {
  if (!category) return SPINE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SPINE_COLORS.length;
  return SPINE_COLORS[index];
}

/** Initialise ou met à jour les données de test */
function seedDemoData() {
  books = SEED_BOOKS_DATA.map(item => ({
    id: generateId(),
    title: item.title,
    author: item.author,
    category: item.category,
    year: item.year,
    maxCopies: item.copies,
    copies: item.copies,
    cover: item.cover,
    content: item.content
  }));
  saveBooks(books);
}

/**
 * Migration transparente : si des livres existent déjà mais n'ont pas
 * de couverture ou de contenu textuel, on enrichit automatiquement ceux qui correspondent
 * aux titres de démonstration.
 */
function upgradeExistingBooksIfNeeded() {
  let modified = false;
  books.forEach(b => {
    const seedMatch = SEED_BOOKS_DATA.find(s => s.title.toLowerCase() === b.title.toLowerCase());
    if (seedMatch) {
      if (!b.cover && seedMatch.cover) {
        b.cover = seedMatch.cover;
        modified = true;
      }
      if (!b.content && seedMatch.content) {
        b.content = seedMatch.content;
        modified = true;
      }
    }
  });
  if (modified) {
    saveBooks(books);
  }
}

/* ---------------------------------------------------------------------
   3) ÉTAT GLOBAL DE L'APPLICATION
   --------------------------------------------------------------------- */
let books = loadBooks();
let editingId = null;
let pendingDeleteId = null;

// Filtres de l'espace personnel
let personalFilter = "all"; // 'all', 'reading', 'finished', 'unread', 'favorites'
let personalQuery = "";
let personalCategory = "";
let personalSort = "recent";

// État de la liseuse active
let activeReadingBook = null;
let activeChapterIndex = 0;
let readerChapters = [];

// Chargement initial des livres si vide
if (books.length === 0) {
  seedDemoData();
  books = loadBooks();
} else {
  upgradeExistingBooksIfNeeded();
}

/* ---------------------------------------------------------------------
   4) NAVIGATION
   --------------------------------------------------------------------- */
const VIEW_META = {
  dashboard: { title: "Tableau de bord", subtitle: "Vue d'ensemble de votre bibliothèque" },
  personal:  { title: "Ma Bibliothèque", subtitle: "Votre espace de lecture personnel et vos favoris" },
  profile:   { title: "Mon Profil", subtitle: "Vos statistiques, lectures récentes et favoris" },
  list:      { title: "Liste des livres", subtitle: "Rechercher, lire et emprunter des ouvrages" },
  borrow:    { title: "Emprunter", subtitle: "Sélectionner un livre disponible" },
  return:    { title: "Retourner", subtitle: "Enregistrer le retour d'un exemplaire" },
  stats:     { title: "Statistiques", subtitle: "Chiffres clés de la collection" },
};

function switchView(viewName) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const targetView = document.getElementById("view-" + viewName);
  if (targetView) targetView.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  if (VIEW_META[viewName]) {
    document.getElementById("viewTitle").textContent = VIEW_META[viewName].title;
    document.getElementById("viewSubtitle").textContent = VIEW_META[viewName].subtitle;
  }

  renderAll();
}

document.getElementById("mainNav").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-btn");
  if (!btn) return;
  switchView(btn.dataset.view);
});

/* ---------------------------------------------------------------------
   5) TOASTS & CONFIRMATIONS
   --------------------------------------------------------------------- */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

const confirmOverlay = document.getElementById("confirmOverlay");

function askDeleteConfirmation(book) {
  pendingDeleteId = book.id;
  document.getElementById("confirmMessage").textContent =
    `Voulez-vous vraiment supprimer « ${book.title} » ? Cette action est irréversible.`;
  confirmOverlay.hidden = false;
}

document.getElementById("confirmCancelBtn").addEventListener("click", () => {
  pendingDeleteId = null;
  confirmOverlay.hidden = true;
});

document.getElementById("confirmOkBtn").addEventListener("click", () => {
  if (pendingDeleteId) {
    books = books.filter(b => b.id !== pendingDeleteId);
    saveBooks(books);
    showToast("Livre supprimé.", "success");
  }
  pendingDeleteId = null;
  confirmOverlay.hidden = true;
  renderAll();
});

/* ---------------------------------------------------------------------
   6) HELPER : RENDU DE COUVERTURE AVEC SECOURS VISUEL ÉLÉGANT
   --------------------------------------------------------------------- */
function renderCoverThumbHTML(book) {
  if (book.cover) {
    return `<div class="table-book-cover">
      <img src="${escapeAttr(book.cover)}" alt="${escapeAttr(book.title)}" loading="lazy" onerror="this.parentElement.innerHTML='📖'" />
    </div>`;
  }
  const bg = colorForCategory(book.category);
  return `<div class="table-book-cover" style="background:${bg}; color:#FFF; font-size:11px; font-weight:700;">
    ${escapeHTML(book.title.slice(0, 2).toUpperCase())}
  </div>`;
}

/* ---------------------------------------------------------------------
   7) PARSEUR DE TEXTE / CHAPITRES POUR LA LISEUSE
   --------------------------------------------------------------------- */
function parseBookChapters(book) {
  const defaultText = `--- Chapitre 1 : Début de l'ouvrage ---
Bienvenue dans la lecture de « ${book.title} » par ${book.author}.

Cet ouvrage fait partie de votre bibliothèque. Vous pouvez en savourer les chapitres à tout moment grâce à cette liseuse interactive.

Bonne lecture !`;

  const raw = book.content && book.content.trim() ? book.content : defaultText;
  const sections = raw.split(/^---/m);
  const chapters = [];

  sections.forEach((sec, idx) => {
    const trimmed = sec.trim();
    if (!trimmed) return;

    const lines = trimmed.split("\n");
    let title = `Chapitre ${chapters.length + 1}`;
    let bodyLines = lines;

    const firstLine = lines[0].replace(/^---|\s*---$/g, "").trim();
    if (firstLine.toLowerCase().startsWith("chapitre") || firstLine.toLowerCase().startsWith("fable") || firstLine.length < 80) {
      title = firstLine;
      bodyLines = lines.slice(1);
    }

    const htmlBody = bodyLines
      .join("\n")
      .trim()
      .split(/\n\s*\n/)
      .map(p => `<p>${escapeHTML(p.trim()).replace(/\n/g, "<br>")}</p>`)
      .join("");

    chapters.push({
      index: chapters.length,
      title: title,
      html: htmlBody || "<p>Contenu à venir...</p>"
    });
  });

  return chapters.length ? chapters : [{ index: 0, title: "Chapitre 1", html: `<p>${escapeHTML(raw)}</p>` }];
}

/* ---------------------------------------------------------------------
   8) MOTEUR DE LA LISEUSE (E-READER)
   --------------------------------------------------------------------- */
const readerOverlay = document.getElementById("readerOverlay");
const readerWindow = document.getElementById("readerWindow");
const readerTitle = document.getElementById("readerTitle");
const readerAuthor = document.getElementById("readerAuthor");
const readerChapterBadge = document.getElementById("readerChapterBadge");
const readerChapterTitle = document.getElementById("readerChapterTitle");
const readerArticle = document.getElementById("readerArticle");
const readerProgressBar = document.getElementById("readerProgressBar");
const readerFooterInfo = document.getElementById("readerFooterInfo");
const readerTocList = document.getElementById("readerTocList");
const readerTocSidebar = document.getElementById("readerTocSidebar");
const readerScrollArea = document.getElementById("readerScrollArea");

let readerSettings = loadReaderSettings();

function applyReaderSettings() {
  readerWindow.className = `reader-window theme-${readerSettings.theme || 'sepia'}`;
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === readerSettings.theme);
  });
  readerArticle.style.setProperty("--reader-font-size", (readerSettings.fontSize || 18) + "px");
  readerArticle.classList.toggle("font-serif", !!readerSettings.fontSerif);
  readerArticle.classList.toggle("font-sans", !readerSettings.fontSerif);
}

function openReader(bookId, targetChapter = null) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  activeReadingBook = book;
  readerChapters = parseBookChapters(book);

  const prog = getBookProgress(book.id);
  if (targetChapter !== null) {
    activeChapterIndex = Math.max(0, Math.min(targetChapter, readerChapters.length - 1));
  } else {
    activeChapterIndex = Math.max(0, Math.min(prog.chapter || 0, readerChapters.length - 1));
  }

  readerTitle.textContent = book.title;
  readerAuthor.textContent = book.author + " (" + book.year + ")";

  applyReaderSettings();
  renderTocSidebar();
  renderActiveChapter();

  readerOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeReader() {
  if (activeReadingBook) {
    updateProgressAndSave();
  }
  readerOverlay.hidden = true;
  document.body.style.overflow = "";
  activeReadingBook = null;
  renderAll();
}

function renderTocSidebar() {
  readerTocList.innerHTML = readerChapters.map((ch, idx) => `
    <li class="reader-toc-item ${idx === activeChapterIndex ? 'active' : ''}" data-idx="${idx}">
      ${escapeHTML(ch.title)}
    </li>
  `).join("");
}

function renderActiveChapter() {
  if (!readerChapters[activeChapterIndex]) return;
  const ch = readerChapters[activeChapterIndex];

  readerChapterBadge.textContent = `Section ${activeChapterIndex + 1} / ${readerChapters.length}`;
  readerChapterTitle.textContent = ch.title;
  readerArticle.innerHTML = ch.html;

  document.getElementById("readerPrevChapterBtn").disabled = activeChapterIndex <= 0;
  document.getElementById("readerNextChapterBtn").disabled = activeChapterIndex >= readerChapters.length - 1;

  readerScrollArea.scrollTop = 0;
  updateReadingProgressUI();
  renderTocSidebar();
}

function updateReadingProgressUI() {
  if (!activeReadingBook || !readerChapters.length) return;
  const total = readerChapters.length;
  const percent = Math.min(100, Math.round(((activeChapterIndex + 1) / total) * 100));

  readerProgressBar.style.width = percent + "%";
  readerFooterInfo.textContent = `Chapitre ${activeChapterIndex + 1} sur ${total} · ${percent}% lu`;
}

function updateProgressAndSave(isFinished = false) {
  if (!activeReadingBook || !readerChapters.length) return;
  const total = readerChapters.length;
  let percent = Math.min(100, Math.round(((activeChapterIndex + 1) / total) * 100));
  if (isFinished) percent = 100;

  setBookProgress(activeReadingBook.id, {
    percent: percent,
    chapter: activeChapterIndex,
    isFinished: isFinished || percent === 100
  });
}

// Boutons de la liseuse
document.getElementById("readerCloseBtn").addEventListener("click", closeReader);
document.getElementById("readerPrevChapterBtn").addEventListener("click", () => {
  if (activeChapterIndex > 0) {
    activeChapterIndex--;
    renderActiveChapter();
    updateProgressAndSave();
  }
});
document.getElementById("readerNextChapterBtn").addEventListener("click", () => {
  if (activeChapterIndex < readerChapters.length - 1) {
    activeChapterIndex++;
    renderActiveChapter();
    updateProgressAndSave();
  }
});
document.getElementById("readerMarkFinishedBtn").addEventListener("click", () => {
  updateProgressAndSave(true);
  showToast(`Félicitations ! Vous avez terminé « ${activeReadingBook.title} ».`, "success");
  closeReader();
});
document.getElementById("readerResetProgressBtn").addEventListener("click", () => {
  if (confirm("Voulez-vous réinitialiser votre progression sur ce livre ?")) {
    setBookProgress(activeReadingBook.id, { percent: 0, chapter: 0, isFinished: false });
    activeChapterIndex = 0;
    renderActiveChapter();
    showToast("Progression réinitialisée.", "info");
  }
});

// Sommaire
document.getElementById("readerTocToggle").addEventListener("click", () => {
  readerTocSidebar.hidden = !readerTocSidebar.hidden;
});
document.getElementById("readerTocClose").addEventListener("click", () => {
  readerTocSidebar.hidden = true;
});
readerTocList.addEventListener("click", (e) => {
  const item = e.target.closest(".reader-toc-item");
  if (!item) return;
  activeChapterIndex = parseInt(item.dataset.idx, 10);
  renderActiveChapter();
  updateProgressAndSave();
  if (window.innerWidth < 800) readerTocSidebar.hidden = true;
});

// Réglages (thème, taille, police)
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    readerSettings.theme = btn.dataset.theme;
    saveReaderSettings(readerSettings);
    applyReaderSettings();
  });
});
document.getElementById("readerFontInc").addEventListener("click", () => {
  readerSettings.fontSize = Math.min(28, (readerSettings.fontSize || 18) + 2);
  saveReaderSettings(readerSettings);
  applyReaderSettings();
});
document.getElementById("readerFontDec").addEventListener("click", () => {
  readerSettings.fontSize = Math.max(13, (readerSettings.fontSize || 18) - 2);
  saveReaderSettings(readerSettings);
  applyReaderSettings();
});
document.getElementById("readerFontFamily").addEventListener("click", () => {
  readerSettings.fontSerif = !readerSettings.fontSerif;
  saveReaderSettings(readerSettings);
  applyReaderSettings();
  showToast(readerSettings.fontSerif ? "Police Serif activée" : "Police Sans-Serif activée", "info");
});

// Plein écran
document.getElementById("readerFullscreenBtn").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Raccourci Échap
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !readerOverlay.hidden) {
    closeReader();
  }
});

/* ---------------------------------------------------------------------
   9) RENDU : VUE "MA BIBLIOTHÈQUE" (ESPACE PERSONNEL)
   --------------------------------------------------------------------- */
const readingFilterPills = document.getElementById("readingFilterPills");
const personalSearchInput = document.getElementById("personalSearchInput");
const personalCategorySelect = document.getElementById("personalCategorySelect");
const personalSortSelect = document.getElementById("personalSortSelect");

readingFilterPills.addEventListener("click", (e) => {
  const btn = e.target.closest(".pill-btn");
  if (!btn) return;
  personalFilter = btn.dataset.filter;
  document.querySelectorAll("#readingFilterPills .pill-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderPersonalView();
});

personalSearchInput.addEventListener("input", (e) => {
  personalQuery = e.target.value.trim().toLowerCase();
  renderPersonalView();
});

personalCategorySelect.addEventListener("change", (e) => {
  personalCategory = e.target.value;
  renderPersonalView();
});

personalSortSelect.addEventListener("change", (e) => {
  personalSort = e.target.value;
  renderPersonalView();
});

function getPersonalFilteredBooks() {
  const favs = loadFavorites();
  const allProg = loadReadingProgress();

  let list = books.filter(b => {
    const prog = allProg[b.id] || { percent: 0, isFinished: false };
    const matchesQuery = !personalQuery ||
      b.title.toLowerCase().includes(personalQuery) ||
      b.author.toLowerCase().includes(personalQuery) ||
      b.category.toLowerCase().includes(personalQuery);

    const matchesCategory = !personalCategory || b.category === personalCategory;

    let matchesFilter = true;
    if (personalFilter === "reading") {
      matchesFilter = prog.percent > 0 && !prog.isFinished;
    } else if (personalFilter === "finished") {
      matchesFilter = prog.isFinished || prog.percent === 100;
    } else if (personalFilter === "unread") {
      matchesFilter = !prog.percent || prog.percent === 0;
    } else if (personalFilter === "favorites") {
      matchesFilter = favs.includes(b.id);
    }

    return matchesQuery && matchesCategory && matchesFilter;
  });

  // Tri
  if (personalSort === "alpha") {
    list.sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } else if (personalSort === "author") {
    list.sort((a, b) => a.author.localeCompare(b.author, "fr"));
  } else if (personalSort === "progress") {
    list.sort((a, b) => (allProg[b.id]?.percent || 0) - (allProg[a.id]?.percent || 0));
  } else if (personalSort === "recent") {
    list.sort((a, b) => {
      const dateA = allProg[a.id]?.lastReadAt || "";
      const dateB = allProg[b.id]?.lastReadAt || "";
      return dateB.localeCompare(dateA);
    });
  }

  return list;
}

function renderPersonalView() {
  const favs = loadFavorites();
  const allProg = loadReadingProgress();
  const grid = document.getElementById("personalBooksGrid");
  const emptyState = document.getElementById("personalEmptyState");

  // Mise à jour des compteurs sur les badges
  const totalCount = books.length;
  const readingCount = books.filter(b => (allProg[b.id]?.percent > 0 && !allProg[b.id]?.isFinished)).length;
  const finishedCount = books.filter(b => allProg[b.id]?.isFinished || allProg[b.id]?.percent === 100).length;
  const unreadCount = books.filter(b => !allProg[b.id] || allProg[b.id]?.percent === 0).length;
  const favoritesCount = books.filter(b => favs.includes(b.id)).length;

  document.getElementById("count-all").textContent = totalCount;
  document.getElementById("count-reading").textContent = readingCount;
  document.getElementById("count-finished").textContent = finishedCount;
  document.getElementById("count-unread").textContent = unreadCount;
  document.getElementById("count-favorites").textContent = favoritesCount;

  // Stat pills de l'en-tête
  const heroStats = document.getElementById("personalStatsPills");
  heroStats.innerHTML = `
    <div class="personal-stat-pill"><strong>${finishedCount}</strong><span>Lus</span></div>
    <div class="personal-stat-pill"><strong>${readingCount}</strong><span>En cours</span></div>
    <div class="personal-stat-pill"><strong>${favoritesCount}</strong><span>Favoris</span></div>
  `;

  // Menu déroulant des catégories
  const uniqueCats = [...new Set(books.map(b => b.category))].sort();
  personalCategorySelect.innerHTML = `<option value="">Toutes les catégories</option>` +
    uniqueCats.map(c => `<option value="${escapeAttr(c)}" ${personalCategory === c ? 'selected' : ''}>${escapeHTML(c)}</option>`).join("");

  const filtered = getPersonalFilteredBooks();
  emptyState.hidden = filtered.length !== 0;

  grid.innerHTML = filtered.map(b => {
    const prog = allProg[b.id] || { percent: 0, isFinished: false };
    const fav = favs.includes(b.id);
    const spineBg = colorForCategory(b.category);

    let statusBadgeHTML = "";
    if (prog.isFinished) {
      statusBadgeHTML = `<span class="p-card-status-badge status-finished">✓ Lu</span>`;
    } else if (prog.percent > 0) {
      statusBadgeHTML = `<span class="p-card-status-badge status-reading">📖 ${prog.percent}%</span>`;
    }

    const coverMarkup = b.cover
      ? `<img class="p-card-img" src="${escapeAttr(b.cover)}" alt="${escapeAttr(b.title)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="p-card-fallback-cover" style="background:${spineBg}; display:none;">
           <span class="p-fallback-deco">§</span>
           <div class="p-fallback-title">${escapeHTML(b.title)}</div>
           <div class="p-fallback-author">${escapeHTML(b.author)}</div>
         </div>`
      : `<div class="p-card-fallback-cover" style="background:${spineBg};">
           <span class="p-fallback-deco">§</span>
           <div class="p-fallback-title">${escapeHTML(b.title)}</div>
           <div class="p-fallback-author">${escapeHTML(b.author)}</div>
         </div>`;

    const actionLabel = prog.isFinished ? "Relire" : (prog.percent > 0 ? "Continuer" : "Lire");

    return `
      <div class="personal-book-card" data-id="${b.id}">
        <div class="p-card-cover-wrap">
          ${coverMarkup}
          <button class="btn-fav ${fav ? 'active' : ''}" data-action="favorite" data-id="${b.id}" title="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
            ${fav ? '❤️' : '🤍'}
          </button>
          ${statusBadgeHTML}
        </div>
        <div class="p-card-body">
          <h3 class="p-card-title" title="${escapeAttr(b.title)}">${escapeHTML(b.title)}</h3>
          <span class="p-card-author">${escapeHTML(b.author)}</span>
          <span class="p-card-category">${escapeHTML(b.category)}</span>

          <div class="p-card-progress-section">
            <div class="p-card-progress-bar">
              <div class="fill ${prog.isFinished ? 'finished' : ''}" style="width:${prog.percent || 0}%"></div>
            </div>
            <div class="p-card-progress-text">
              <span>${prog.isFinished ? 'Terminé' : (prog.percent > 0 ? 'En cours' : 'Non commencé')}</span>
              <b>${prog.percent || 0}%</b>
            </div>
          </div>

          <div class="p-card-actions">
            <button class="btn btn-primary btn-sm" data-action="read" data-id="${b.id}">${actionLabel}</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Délégation d'événements pour la grille personnelle
document.getElementById("personalBooksGrid").addEventListener("click", (e) => {
  const btnFav = e.target.closest("button[data-action='favorite']");
  if (btnFav) {
    e.stopPropagation();
    toggleFavorite(btnFav.dataset.id);
    return;
  }

  const btnRead = e.target.closest("button[data-action='read']");
  if (btnRead) {
    e.stopPropagation();
    openReader(btnRead.dataset.id);
    return;
  }

  const card = e.target.closest(".personal-book-card");
  if (card && !e.target.closest("button")) {
    openReader(card.dataset.id);
  }
});

/* ---------------------------------------------------------------------
   11) EMPRUNTER / RETOURNER
   --------------------------------------------------------------------- */
function borrowBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  if (book.copies <= 0) {
    showToast("Livre indisponible.", "error");
    return;
  }
  book.copies -= 1;
  saveBooks(books);
  showToast(`« ${book.title} » emprunté avec succès.`, "success");
  renderAll();
}

function returnBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  if (book.copies >= book.maxCopies) {
    showToast("Tous les exemplaires de ce livre sont déjà disponibles.", "error");
    return;
  }
  book.copies += 1;
  saveBooks(books);
  showToast(`« ${book.title} » retourné avec succès.`, "success");
  renderAll();
}

/* ---------------------------------------------------------------------
   12) RECHERCHE & TRI (VUE "LISTE DES LIVRES")
   --------------------------------------------------------------------- */
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

searchInput.addEventListener("input", renderListView);
sortSelect.addEventListener("change", renderListView);

function getFilteredSortedBooks() {
  const query = searchInput.value.trim().toLowerCase();
  let result = books.filter(b =>
    b.title.toLowerCase().includes(query) ||
    b.author.toLowerCase().includes(query) ||
    b.category.toLowerCase().includes(query)
  );

  const sortMode = sortSelect.value;
  if (sortMode === "alpha") {
    result = result.slice().sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } else if (sortMode === "category") {
    result = result.slice().sort((a, b) => a.category.localeCompare(b.category, "fr"));
  } else if (sortMode === "year") {
    result = result.slice().sort((a, b) => b.year - a.year);
  }
  return result;
}

/* ---------------------------------------------------------------------
   13) RENDU — TABLEAU DE BORD
   --------------------------------------------------------------------- */
function computeStats() {
  const totalBooks = books.length;
  const totalCopies = books.reduce((sum, b) => sum + b.maxCopies, 0);
  const availableCopies = books.reduce((sum, b) => sum + b.copies, 0);
  const borrowedCopies = totalCopies - availableCopies;
  const availableTitles = books.filter(b => b.copies > 0).length;
  const unavailableTitles = totalBooks - availableTitles;
  return { totalBooks, totalCopies, availableCopies, borrowedCopies, availableTitles, unavailableTitles };
}

function renderQuickStats() {
  const s = computeStats();
  const el = document.getElementById("quickStats");
  el.innerHTML = `
    <div class="quick-stat"><b>${s.totalBooks}</b><span>Livres</span></div>
    <div class="quick-stat"><b>${s.availableCopies}</b><span>Dispo.</span></div>
    <div class="quick-stat"><b>${s.borrowedCopies}</b><span>Empruntés</span></div>
  `;
}

function renderDashboard() {
  const s = computeStats();
  const cardsEl = document.getElementById("dashboardCards");
  cardsEl.innerHTML = `
    ${statCardHTML("Nombre total de livres", s.totalBooks, "▤")}
    ${statCardHTML("Nombre total d'exemplaires", s.totalCopies, "≣")}
    ${statCardHTML("Livres disponibles", s.availableTitles, "✓")}
    ${statCardHTML("Livres indisponibles", s.unavailableTitles, "✕")}
  `;

  // Panneau Reprendre la lecture
  const allProg = loadReadingProgress();
  const inProgressBooks = books.filter(b => allProg[b.id] && allProg[b.id].percent > 0 && !allProg[b.id].isFinished);
  const resumePanel = document.getElementById("resumeReadingPanel");

  if (inProgressBooks.length > 0) {
    inProgressBooks.sort((a, b) => (allProg[b.id]?.lastReadAt || "").localeCompare(allProg[a.id]?.lastReadAt || ""));
    const lastBook = inProgressBooks[0];
    const lastProg = allProg[lastBook.id];

    document.getElementById("resumeBookTitle").textContent = lastBook.title;
    document.getElementById("resumeBookMeta").textContent = `${lastBook.author} · Chapitre ${(lastProg.chapter || 0) + 1} · ${lastProg.percent}% lu`;
    document.getElementById("resumeProgressBar").style.width = `${lastProg.percent}%`;

    const resumeBtn = document.getElementById("resumeReadingBtn");
    resumeBtn.onclick = () => openReader(lastBook.id);
    resumePanel.hidden = false;
  } else {
    resumePanel.hidden = true;
  }

  // Cinq derniers livres ajoutés
  const tbody = document.querySelector("#recentTable tbody");
  const recent = books.slice(-5).reverse();
  tbody.innerHTML = recent.length
    ? recent.map(b => `
        <tr>
          <td>${renderCoverThumbHTML(b)}</td>
          <td><span class="id-chip">${b.id}</span></td>
          <td><b>${escapeHTML(b.title)}</b></td>
          <td>${escapeHTML(b.author)}</td>
          <td>${escapeHTML(b.category)}</td>
          <td>${availabilityBadge(b)}</td>
          <td>
            <button class="btn btn-primary btn-sm" data-action="read" data-id="${b.id}">📖 Lire</button>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="7" class="empty-state">Aucun livre pour le moment. Ajoutez votre premier livre !</td></tr>`;
}

document.querySelector("#recentTable").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='read']");
  if (btn) openReader(btn.dataset.id);
});

function statCardHTML(label, value, icon) {
  return `
    <div class="stat-card">
      <div class="stat-icon">${icon}</div>
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
    </div>`;
}

function availabilityBadge(book) {
  return book.copies > 0
    ? `<span class="badge available">Disponible (${book.copies}/${book.maxCopies})</span>`
    : `<span class="badge unavailable">Indisponible</span>`;
}

/* ---------------------------------------------------------------------
   14) RENDU — LISTE DES LIVRES (TABLEAU)
   --------------------------------------------------------------------- */
function renderListView() {
  const list = getFilteredSortedBooks();
  const tbody = document.querySelector("#booksTable tbody");
  const emptyState = document.getElementById("listEmptyState");

  tbody.innerHTML = list.map(b => `
    <tr>
      <td><span class="mini-spine" style="background:${colorForCategory(b.category)}"></span></td>
      <td>${renderCoverThumbHTML(b)}</td>
      <td><span class="id-chip">${b.id}</span></td>
      <td><b>${escapeHTML(b.title)}</b></td>
      <td>${escapeHTML(b.author)}</td>
      <td>${escapeHTML(b.category)}</td>
      <td>${b.year}</td>
      <td>${availabilityBadge(b)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-primary btn-sm" data-action="read" data-id="${b.id}">📖 Lire</button>
          <button class="btn btn-success btn-sm" data-action="borrow" data-id="${b.id}">↷ Emprunter</button>
        </div>
      </td>
    </tr>
  `).join("");

  emptyState.hidden = list.length !== 0;

  const categoryList = document.getElementById("categoryList");
  const uniqueCategories = [...new Set(books.map(b => b.category))];
  categoryList.innerHTML = uniqueCategories.map(c => `<option value="${escapeHTML(c)}"></option>`).join("");
}

document.getElementById("booksTable").addEventListener("click", handleTableAction);

function handleTableAction(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const book = books.find(b => b.id === btn.dataset.id);
  if (!book) return;

  if (btn.dataset.action === "read") openReader(book.id);
  if (btn.dataset.action === "edit") enterEditMode(book);
  if (btn.dataset.action === "delete") askDeleteConfirmation(book);
  if (btn.dataset.action === "borrow") borrowBook(book.id);
}

/* ---------------------------------------------------------------------
   15) RENDU — EMPRUNTER / RETOURNER (CARTES)
   --------------------------------------------------------------------- */
function bookCardHTML(book, actionLabel, actionName, btnClass) {
  const spineColor = colorForCategory(book.category);
  const coverContent = book.cover
    ? `style="background-image:url('${escapeAttr(book.cover)}'); background-size:cover; background-position:center;"`
    : "";
  return `
    <div class="book-card">
      <div class="spine" style="background:${spineColor}"></div>
      <div class="cover" ${coverContent}>${book.cover ? "" : "📖"}</div>
      <div class="info">
        <h3>${escapeHTML(book.title)}</h3>
        <div class="author">${escapeHTML(book.author)}</div>
        <div class="meta">${book.year} · ${book.copies}/${book.maxCopies} exemplaire(s) dispo.</div>
        <span class="tag">${escapeHTML(book.category)}</span>
        <div class="card-actions">
          <button class="btn ${btnClass} btn-sm" data-action="${actionName}" data-id="${book.id}">${actionLabel}</button>
          <button class="btn btn-outline btn-sm" data-action="read" data-id="${book.id}">Lire</button>
        </div>
      </div>
    </div>`;
}

function renderBorrowView() {
  const grid = document.getElementById("borrowGrid");
  const available = books.filter(b => b.copies > 0);
  grid.innerHTML = available.map(b => bookCardHTML(b, "Emprunter", "borrow", "btn-success")).join("");
  document.getElementById("borrowEmptyState").hidden = available.length !== 0;
}

function renderReturnView() {
  const grid = document.getElementById("returnGrid");
  const borrowed = books.filter(b => b.copies < b.maxCopies);
  grid.innerHTML = borrowed.map(b => bookCardHTML(b, "Retourner", "return", "btn-primary")).join("");
  document.getElementById("returnEmptyState").hidden = borrowed.length !== 0;
}

document.getElementById("borrowGrid").addEventListener("click", (e) => {
  const btnBorrow = e.target.closest("button[data-action='borrow']");
  if (btnBorrow) borrowBook(btnBorrow.dataset.id);
  const btnRead = e.target.closest("button[data-action='read']");
  if (btnRead) openReader(btnRead.dataset.id);
});

document.getElementById("returnGrid").addEventListener("click", (e) => {
  const btnReturn = e.target.closest("button[data-action='return']");
  if (btnReturn) returnBook(btnReturn.dataset.id);
  const btnRead = e.target.closest("button[data-action='read']");
  if (btnRead) openReader(btnRead.dataset.id);
});

/* ---------------------------------------------------------------------
   16) RENDU — STATISTIQUES
   --------------------------------------------------------------------- */
function renderStatsView() {
  const s = computeStats();
  const cardsEl = document.getElementById("statsCards");
  cardsEl.innerHTML = `
    ${statCardHTML("Nombre total de livres", s.totalBooks, "▤")}
    ${statCardHTML("Nombre total d'exemplaires", s.totalCopies, "≣")}
    ${statCardHTML("Livres disponibles", s.availableTitles, "✓")}
    ${statCardHTML("Livres empruntés (exemplaires)", s.borrowedCopies, "↷")}
  `;

  const byCategory = {};
  books.forEach(b => { byCategory[b.category] = (byCategory[b.category] || 0) + 1; });
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;

  const chart = document.getElementById("categoryChart");
  chart.innerHTML = entries.length
    ? entries.map(([cat, count]) => `
        <div class="category-row">
          <div class="cat-label">${escapeHTML(cat)}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${(count / max) * 100}%; background:${colorForCategory(cat)}"></div>
          </div>
          <div class="cat-count">${count}</div>
        </div>`).join("")
    : `<p class="empty-state">Aucune donnée à afficher pour le moment.</p>`;
}

/* ---------------------------------------------------------------------
   17) EXPORTS (PDF & Excel)
   --------------------------------------------------------------------- */
document.getElementById("exportPdfBtn").addEventListener("click", () => {
  if (!books.length) { showToast("Aucun livre à exporter.", "error"); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Bibliothèque — Liste des livres", 14, 16);

  const rows = books.map(b => [
    b.id, b.title, b.author, b.category, String(b.year), `${b.copies}/${b.maxCopies}`,
  ]);

  doc.autoTable({
    head: [["ID", "Titre", "Auteur", "Catégorie", "Année", "Exemplaires"]],
    body: rows,
    startY: 22,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [31, 58, 52] },
  });

  doc.save("bibliotheque.pdf");
  showToast("Export PDF généré.", "success");
});

document.getElementById("exportExcelBtn").addEventListener("click", () => {
  if (!books.length) { showToast("Aucun livre à exporter.", "error"); return; }

  const data = books.map(b => ({
    ID: b.id,
    Titre: b.title,
    Auteur: b.author,
    Catégorie: b.category,
    Année: b.year,
    "Exemplaires disponibles": b.copies,
    "Exemplaires total": b.maxCopies,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Livres");
  XLSX.writeFile(workbook, "bibliotheque.xlsx");
  showToast("Export Excel généré.", "success");
});

/* ---------------------------------------------------------------------
   18) UTILITAIRES
   --------------------------------------------------------------------- */
function escapeHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(str) {
  return String(str || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ---------------------------------------------------------------------
   19) PROFIL — ÉVÉNEMENTS
   --------------------------------------------------------------------- */

// Clic sur la mini-carte sidebar -> aller sur le profil
document.getElementById('sidebarProfile').addEventListener('click', (e) => {
  if (!e.target.closest('.sidebar-profile-edit-btn')) return;
  switchView('profile');
});
document.getElementById('sidebarProfile').addEventListener('click', (e) => {
  if (e.target.closest('.sidebar-profile-edit-btn')) {
    switchView('profile');
  }
});

// Emoji presets
document.getElementById('emojiPresets').addEventListener('click', (e) => {
  const btn = e.target.closest('.emoji-preset-btn');
  if (!btn) return;
  document.getElementById('profileAvatarEmoji').value = btn.dataset.emoji;
  document.querySelectorAll('.emoji-preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('profileAvatarDisplay').textContent = btn.dataset.emoji;
});

// Saisie manuelle de l'emoji -> update avatar aperçu
document.getElementById('profileAvatarEmoji').addEventListener('input', (e) => {
  const val = e.target.value.trim();
  if (val) document.getElementById('profileAvatarDisplay').textContent = val;
});

// Formulaire profil submit
document.getElementById('profileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const p = {
    name: document.getElementById('profileName').value.trim() || 'Mon Profil',
    avatar: document.getElementById('profileAvatarEmoji').value.trim() || '\ud83d\udc64',
    bio: document.getElementById('profileBio').value.trim() || 'Passionn\u00e9(e) de lecture',
    favoriteGenre: document.getElementById('profileFavoriteGenre').value.trim(),
    readingGoal: parseInt(document.getElementById('profileReadingGoal').value, 10) || 12,
  };
  saveProfile(p);
  renderProfileView();
  showToast('Profil enregistré avec succès ✓', 'success');
});

// Clic sur un livre dans les lectures récentes / favoris du profil
document.getElementById('profileRecentReads').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="read"]');
  if (btn) { openReader(btn.dataset.id); return; }
  const item = e.target.closest('.profile-read-item');
  if (item) openReader(item.dataset.id);
});
document.getElementById('profileFavoritesGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="read"]');
  if (btn) { openReader(btn.dataset.id); return; }
  const card = e.target.closest('.profile-fav-card');
  if (card && !e.target.closest('button')) openReader(card.dataset.id);
});

/* ---------------------------------------------------------------------
   20) RENDU GLOBAL
   --------------------------------------------------------------------- */
function renderAll() {
  renderQuickStats();
  renderDashboard();
  renderPersonalView();
  renderListView();
  renderBorrowView();
  renderReturnView();
  renderStatsView();
  renderProfileView();
}

// Premier rendu au chargement
renderAll();
