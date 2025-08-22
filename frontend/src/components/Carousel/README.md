# Carousel Components

React carousel components migrated from the JSF/XHTML PinkCare application. These components maintain the same Bootstrap 3 styling and functionality as the original carousels.

## Components

### 1. Carousel (Base Component)

Generic carousel component that can be used for any type of content.

```jsx
import { Carousel } from './components/Carousel';

<Carousel
  items={[
    { src: 'image1.jpg', alt: 'Image 1' },
    { src: 'image2.jpg', alt: 'Image 2' }
  ]}
  autoPlay={true}
  interval={5000}
  showIndicators={true}
  showControls={true}
  className="custom-carousel"
  renderItem={(item, index) => (
    <img src={item.src} alt={item.alt} />
  )}
/>
```

#### Props:
- `items` (array): Array of items to display in carousel
- `autoPlay` (boolean): Enable/disable automatic sliding (default: true)
- `interval` (number): Time in milliseconds between slides (default: 5000)
- `showIndicators` (boolean): Show/hide dot indicators (default: true)
- `showControls` (boolean): Show/hide prev/next buttons (default: true)
- `className` (string): Additional CSS class name
- `renderItem` (function): Custom render function for carousel items

### 2. MainCarousel

Pre-configured carousel for the main PinkCare slider with static images.

```jsx
import { MainCarousel } from './components/Carousel';

<MainCarousel />
```

This component displays the 5 main PinkCare slider images:
- slide_pink-care_web-1.jpg through slide_pink-care_web-5.jpg

### 3. NewsCarousel

Carousel specifically designed for displaying news articles in a 2-column layout.

```jsx
import { NewsCarousel } from './components/Carousel';

<NewsCarousel 
  newsData={[
    [
      {
        id: 1,
        headline: "News Title",
        text: "News content...",
        image: "news-image.jpg",
        insertion_date: "2025-01-20T10:00:00Z"
      },
      // More news items...
    ]
    // More news pages...
  ]}
  resourceBundle={{
    Last_News: "Ultime News",
    Read_all: "Leggi tutto"
  }}
/>
```

#### Props:
- `newsData` (array): Array of news page arrays, each containing news items
- `resourceBundle` (object): Localized strings

## CSS Classes

The components use Bootstrap 3 carousel classes:
- `.carousel` - Main carousel container
- `.carousel-inner` - Inner container for slides
- `.item` - Individual slide
- `.active` - Active slide
- `.carousel-indicators` - Dot indicators container
- `.carousel-control` - Navigation controls
- `.news-carousel` - Specific styles for news carousel

## Migration Notes

These components replicate the functionality from:
- `public.xhtml` - Main image carousel
- `home.xhtml` - News carousel
- `standard_public.xhtml` - JavaScript initialization: `jQuery('.carousel').carousel()`

The React implementation maintains the same visual appearance and behavior as the original JSF/XHTML carousels while providing modern React component patterns.