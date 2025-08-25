// Configurazione delle pagine con titoli, meta descrizioni, keywords e links
export const pageConfig = {
  home: {
    title: "PinkCare: il primo portale dedicato alla salute femminile",
    description:
      "Con PinkCare potrai ottenere gratuitamente il tuo Piano di prevenzione e cura",
    keywords:
      "PinkCare, salute femminile, prevenzione, donne, medicina, piano di cura, screening",
    author: "PinkCare Team",
    links: [
      {
        href: "https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i,800,800i",
        rel: "stylesheet",
      },
      {
        href: "https://fonts.googleapis.com/css?family=Lato:400,100,100italic,300,300italic,400italic,700,700italic,900,900italic",
        rel: "stylesheet",
        type: "text/css",
      },
      {
        href: "https://fonts.googleapis.com/css?family=Roboto:400,100,300,100italic,300italic,400italic,500,500italic,700,700italic,900,900italic",
        rel: "stylesheet",
        type: "text/css",
      },
      {
        href: "/styles/public/css/bootstrap.min.css",
        rel: "stylesheet",
      },
      {
        href: "/styles/public/css/font-awesome.min.css",
        rel: "stylesheet",
      },
      {
        href: "/styles/public/fonts/fontawesome-all.css",
        rel: "stylesheet",
        type: "text/css",
      },
      {
        href: "/styles/public/css/carousel.css",
        rel: "stylesheet",
      },
      {
        href: "/styles/public/css/style.css",
        rel: "stylesheet",
      },
    ],
  },
  about: {
    title: "PinkCare - Chi siamo",
    description:
      "La piattaforma che supporta le Donne nel proprio percorso di prevenzione e benessere.",
    keywords:
      "PinkCare, chi siamo, about, salute femminile, mission, team medico",
    author: "PinkCare Team",
    links: [
      {
        href: "https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i,800,800i",
        rel: "stylesheet",
      },
      {
        href: "https://fonts.googleapis.com/css?family=Lato:400,100,100italic,300,300italic,400italic,700,700italic,900,900italic",
        rel: "stylesheet",
        type: "text/css",
      },
      {
        href: "https://fonts.googleapis.com/css?family=Roboto:400,100,300,100italic,300italic,400italic,500,500italic,700,700italic,900,900italic",
        rel: "stylesheet",
        type: "text/css",
      },
      {
        href: "/styles/public/css/bootstrap.min.css",
        rel: "stylesheet",
      },
      {
        href: "/styles/public/css/font-awesome.min.css",
        rel: "stylesheet",
      },
      {
        href: "/styles/public/fonts/fontawesome-all.css",
        rel: "stylesheet",
        type: "text/css",
      },
      {
        href: "/styles/public/css/carousel.css",
        rel: "stylesheet",
      },
      {
        href: "/styles/public/css/style.css",
        rel: "stylesheet",
      },
    ],
  },
  blog: {
    title: "PinkCare - Blog",
    description:
      "Con PinkCare potrai ottenere gratuitamente il tuo Piano di prevenzione e cura",
    keywords:
      "PinkCare, blog, salute femminile, articoli medici, prevenzione, consigli",
    author: "PinkCare Team",
    links: [
      {
        href: "https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i,800,800i",
        rel: "stylesheet",
      },
      {
        href: "/styles/blog.css",
        rel: "stylesheet",
        type: "text/css",
      },
    ],
  },
  login: {
    title: "Login - PinkCare",
    description:
      "Accedi al tuo profilo PinkCare. Il tuo programma di cura personalizzato sempre con te",
    keywords: "PinkCare, login, accesso, profilo utente, area riservata",
    author: "PinkCare Team",
  },
  register: {
    title: "Iscriviti a PinkCare",
    description:
      "Crea un account su PinkCare, potrai ottenere gratuitamente il tuo Piano di prevenzione e cura",
    keywords: "PinkCare, registrazione, iscrizione, nuovo account, gratuito",
    author: "PinkCare Team",
  },
  accreditation: {
    title: "Sei un medico? Entra a far parte della rete PinkCare",
    description:
      "PinkCare è dotato di un Comitato scientifico con standard di qualità delle prestazioni che professionisti e strutture devono possedere per potersi iscrivere",
    keywords:
      "PinkCare, medici, specialisti, accreditamento, rete medica, registrazione medici",
    author: "PinkCare Team",
    links: [
      {
        href: "https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i,800,800i",
        rel: "stylesheet",
      },
      {
        href: "https://fonts.googleapis.com/css?family=Lato:400,100,100italic,300,300italic,400italic,700,700italic,900,900italic",
        rel: "stylesheet",
        type: "text/css",
      },
      {
        href: "https://fonts.googleapis.com/css?family=Roboto:400,100,300,100italic,300italic,400italic,500,500italic,700,700italic,900,900italic",
        rel: "stylesheet",
        type: "text/css",
      },
      {
        href: "/styles/public/css/bootstrap.min.css",
        rel: "stylesheet",
      },
      {
        href: "/styles/public/css/font-awesome.min.css",
        rel: "stylesheet",
      },
      {
        href: "/styles/public/fonts/fontawesome-all.css",
        rel: "stylesheet",
        type: "text/css",
      },
      {
        href: "/styles/public/css/carousel.css",
        rel: "stylesheet",
      },
      {
        href: "/styles/public/css/style.css",
        rel: "stylesheet",
      },
    ],
  },
};

export const getPageConfig = (page) => {
  return pageConfig[page] || pageConfig.home;
};
