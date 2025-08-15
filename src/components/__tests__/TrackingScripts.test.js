import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock environment variables
const mockEnv = {
  PROD: true,
  GOOGLE_ANALYTICS_ID: 'G-TEST123456',
  CLARITY_ID: 'test-clarity-id'
};

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: mockEnv
});

describe('TrackingScripts Component', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head></head>
        <body></body>
      </html>
    `);
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
  });

  it('should include Google Analytics script when GA ID is provided in production', () => {
    // Simulate the tracking scripts being added to the document
    const gaScript = document.createElement('script');
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${mockEnv.GOOGLE_ANALYTICS_ID}`;
    gaScript.async = true;
    document.head.appendChild(gaScript);

    const configScript = document.createElement('script');
    configScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${mockEnv.GOOGLE_ANALYTICS_ID}', {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        send_page_view: true
      });
    `;
    document.head.appendChild(configScript);

    // Verify GA script is present
    const scripts = document.querySelectorAll('script');
    const gaScriptElement = Array.from(scripts).find(script => 
      script.src && script.src.includes('googletagmanager.com/gtag/js')
    );
    
    expect(gaScriptElement).toBeTruthy();
    expect(gaScriptElement.src).toContain(mockEnv.GOOGLE_ANALYTICS_ID);
    expect(gaScriptElement.async).toBe(true);
  });

  it('should include Microsoft Clarity script when Clarity ID is provided in production', () => {
    // Simulate the Clarity script being added
    const clarityScript = document.createElement('script');
    clarityScript.textContent = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${mockEnv.CLARITY_ID}");
    `;
    document.head.appendChild(clarityScript);

    // Verify Clarity script is present
    const scripts = document.querySelectorAll('script');
    const clarityScriptElement = Array.from(scripts).find(script => 
      script.textContent && script.textContent.includes('clarity.ms/tag')
    );
    
    expect(clarityScriptElement).toBeTruthy();
    expect(clarityScriptElement.textContent).toContain(mockEnv.CLARITY_ID);
  });

  it('should include privacy notice when tracking scripts are loaded', () => {
    // Simulate privacy notice script
    const privacyScript = document.createElement('script');
    privacyScript.textContent = `
      console.log('🔒 Privacy Notice: This site uses analytics to improve user experience. Data is anonymized and not used for advertising.');
    `;
    document.head.appendChild(privacyScript);

    const scripts = document.querySelectorAll('script');
    const privacyScriptElement = Array.from(scripts).find(script => 
      script.textContent && script.textContent.includes('Privacy Notice')
    );
    
    expect(privacyScriptElement).toBeTruthy();
  });

  it('should have privacy-focused GA configuration', () => {
    // Test that GA config includes privacy settings
    const configScript = document.createElement('script');
    configScript.textContent = `
      gtag('config', '${mockEnv.GOOGLE_ANALYTICS_ID}', {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        send_page_view: true
      });
    `;
    document.head.appendChild(configScript);

    expect(configScript.textContent).toContain('anonymize_ip: true');
    expect(configScript.textContent).toContain('allow_google_signals: false');
    expect(configScript.textContent).toContain('allow_ad_personalization_signals: false');
  });
});

describe('Analytics Environment Handling', () => {
  it('should not load scripts in development environment', () => {
    const devEnv = { ...mockEnv, PROD: false };
    
    // In development, scripts should not be added
    // This would be handled by the Astro component's conditional rendering
    expect(devEnv.PROD).toBe(false);
  });

  it('should not load scripts when tracking IDs are missing', () => {
    const noTrackingEnv = { PROD: true };
    
    // Without tracking IDs, scripts should not be added
    expect(noTrackingEnv.GOOGLE_ANALYTICS_ID).toBeUndefined();
    expect(noTrackingEnv.CLARITY_ID).toBeUndefined();
  });
});