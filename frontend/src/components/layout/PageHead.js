import React, { useEffect } from "react";

const PageHead = ({
  title = "PinkCare: il primo portale dedicato alla salute femminile",
  description = "Con PinkCare potrai ottenere gratuitamente il tuo Piano di prevenzione e cura",
  author = "",
  themeColor = "#e42080",
  keywords = "PinkCare, salute femminile, prevenzione, donne, medicina",
  ogType = "website",
  ogImage = null,
  twitterCard = "summary_large_image",
  links = [] // Array di oggetti link { href, rel, type?, media?, etc. }
}) => {
  useEffect(() => {
    console.log("PageHead mounted with title:", title);
    
    const currentUrl = window.location.href;

    // Set title
    document.title = title;

    // Set basic meta tags
    const setMeta = (selector, attrs) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        Object.keys(attrs).forEach(key => meta.setAttribute(key, attrs[key]));
        document.head.appendChild(meta);
      } else {
        Object.keys(attrs).forEach(key => {
          if (key !== 'name' && key !== 'property' && key !== 'http-equiv') {
            meta.setAttribute(key, attrs[key]);
          }
        });
      }
    };

    // Basic meta tags
    setMeta('meta[charset]', { charset: 'utf-8' });
    setMeta('meta[http-equiv="X-UA-Compatible"]', { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' });
    setMeta('meta[name="viewport"]', { name: 'viewport', content: 'width=device-width, initial-scale=1' });
    setMeta('meta[name="theme-color"]', { name: 'theme-color', content: themeColor });

    // SEO meta tags
    setMeta('meta[name="description"]', { name: 'description', content: description });
    if (author) setMeta('meta[name="author"]', { name: 'author', content: author });
    setMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
    setMeta('meta[name="robots"]', { name: 'robots', content: 'index, follow' });

    // Open Graph tags
    setMeta('meta[property="og:type"]', { property: 'og:type', content: ogType });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: currentUrl });
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'PinkCare' });
    if (ogImage) setMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });

    // Twitter Card tags
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: twitterCard });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    if (ogImage) setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage });

    // Mobile meta tags
    setMeta('meta[name="format-detection"]', { name: 'format-detection', content: 'telephone=no' });
    setMeta('meta[name="mobile-web-app-capable"]', { name: 'mobile-web-app-capable', content: 'yes' });
    setMeta('meta[name="apple-mobile-web-app-capable"]', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    setMeta('meta[name="apple-mobile-web-app-status-bar-style"]', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });

    // Set HTML lang
    document.documentElement.setAttribute('lang', 'it');

    // Gestione link dinamici
    const setLink = (selector, attrs) => {
      let link = document.querySelector(selector);
      if (!link) {
        link = document.createElement('link');
        Object.keys(attrs).forEach(key => link.setAttribute(key, attrs[key]));
        document.head.appendChild(link);
      } else {
        Object.keys(attrs).forEach(key => {
          if (key !== 'rel') { // rel non cambia mai
            link.setAttribute(key, attrs[key]);
          }
        });
      }
    };

    // Rimuovi link dinamici esistenti (con data-dynamic="true")
    const existingDynamicLinks = document.querySelectorAll('link[data-dynamic="true"]');
    existingDynamicLinks.forEach(link => link.remove());

    // Aggiungi nuovi link dinamici
    links.forEach((linkConfig, index) => {
      const linkAttrs = {
        ...linkConfig,
        'data-dynamic': 'true',
        'data-page': title.replace(/\s+/g, '-').toLowerCase() // identificativo pagina
      };
      
      const selector = `link[href="${linkConfig.href}"][rel="${linkConfig.rel}"]`;
      setLink(selector, linkAttrs);
    });

  }, [title, description, author, themeColor, keywords, ogType, ogImage, twitterCard, links]);

  return null; // Non renderizza nulla nel DOM
};

export default PageHead;
