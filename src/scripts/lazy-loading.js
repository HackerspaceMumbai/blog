/**
 * Enhanced Lazy Loading Script
 * Handles lazy loading of images with Intersection Observer
 */

document.addEventListener('DOMContentLoaded', function() {
  // Enhanced lazy loading with Intersection Observer
  const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
  
  if ('IntersectionObserver' in window && lazyImages.length > 0) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // Handle data-src attribute
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // Handle srcset
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          // Remove loading placeholder
          img.classList.remove('lazy-loading');
          img.classList.add('lazy-loaded');
          
          // Add fade-in effect
          img.style.opacity = '0';
          img.style.transition = 'opacity 0.3s ease-in-out';
          
          img.onload = () => {
            img.style.opacity = '1';
            
            // Remove blur effect if present
            if (img.style.filter) {
              img.style.filter = '';
            }
          };
          
          img.onerror = () => {
            // Handle loading error
            img.classList.add('lazy-error');
            img.alt = img.alt || 'Image failed to load';
            
            // Show fallback if available
            if (img.dataset.fallback) {
              img.src = img.dataset.fallback;
            }
          };
          
          observer.unobserve(img);
        }
      });
    }, {
      // Load images 50px before they enter viewport
      rootMargin: '50px 0px',
      threshold: 0.01
    });
    
    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    lazyImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        img.removeAttribute('data-srcset');
      }
    });
  }
  
  // Progressive enhancement for background images
  const lazyBackgrounds = document.querySelectorAll('[data-bg-src]');
  
  if ('IntersectionObserver' in window && lazyBackgrounds.length > 0) {
    const backgroundObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const bgSrc = element.dataset.bgSrc;
          
          if (bgSrc) {
            element.style.backgroundImage = `url(${bgSrc})`;
            element.removeAttribute('data-bg-src');
            element.classList.add('bg-loaded');
          }
          
          backgroundObserver.unobserve(element);
        }
      });
    }, {
      rootMargin: '50px 0px'
    });
    
    lazyBackgrounds.forEach(element => {
      backgroundObserver.observe(element);
    });
  }
});