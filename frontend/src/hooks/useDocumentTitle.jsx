import { useEffect } from 'react';

export const useDocumentMeta = ({ title, description, keywords, author }) => {
  useEffect(() => {
    // Set title
    if (title) {
      document.title = title;
    }
    
    // Set X-UA-Compatible (IE Edge)
    let metaXUA = document.querySelector('meta[http-equiv="X-UA-Compatible"]');
    if (!metaXUA) {
      metaXUA = document.createElement('meta');
      metaXUA.setAttribute('http-equiv', 'X-UA-Compatible');
      metaXUA.setAttribute('content', 'IE=edge');
      document.head.appendChild(metaXUA);
    }
    
    // Set viewport
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.setAttribute('name', 'viewport');
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1');
      document.head.appendChild(metaViewport);
    }
    
    // Set description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
    
    // Set keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }
    
    // Set author
    if (author) {
      let metaAuthor = document.querySelector('meta[name="author"]');
      if (!metaAuthor) {
        metaAuthor = document.createElement('meta');
        metaAuthor.setAttribute('name', 'author');
        document.head.appendChild(metaAuthor);
      }
      metaAuthor.setAttribute('content', author);
    }
    
    // Set charset (se non esiste)
    let metaCharset = document.querySelector('meta[charset]');
    if (!metaCharset) {
      metaCharset = document.createElement('meta');
      metaCharset.setAttribute('charset', 'utf-8');
      document.head.insertBefore(metaCharset, document.head.firstChild);
    }
  }, [title, description, keywords, author]);
};

// Keep backward compatibility
export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};

export default useDocumentMeta;