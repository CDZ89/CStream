// Allow trusted donation and social links while blocking malicious ones
export const blockExternalLinks = () => {
  if (typeof window === 'undefined') return;

  console.log('🛡️ CStream Security: External link blocker active - whitelisted URLs allowed');

  // Whitelist safe external URLs (donations, socials, official partners)
  const whitelistedDomains = [
    'paypal.me',
    'ko-fi.com',
    'discord.gg',
    'discord.com',
    'github.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'youtube.com'
  ];

  const isWhitelisted = (url: string) => {
    try {
      const urlObj = new URL(url);
      return whitelistedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  // 1. Allow window.open for whitelisted and internal links
  const originalOpen = window.open;
  window.open = function(url, target, features) {
    if (url && typeof url === 'string') {
      const isInternal = url.startsWith('/') || 
                        url.startsWith(window.location.origin) ||
                        url.startsWith('http://localhost') ||
                        url.startsWith('http://127.0.0.1') ||
                        url.startsWith('#') ||
                        url.startsWith('blob:') ||
                        url.startsWith('data:');
      
      if (!isInternal && !isWhitelisted(url)) {
        console.warn(`🛡️ Security: Blocked window.open redirect to untrusted: ${url}`);
        return null;
      }
    }
    return originalOpen.call(this, url as string, target as string, features as string);
  } as any;

  // 2. Allow external link clicks for whitelisted URLs only
  document.addEventListener('click', (e: MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor && anchor.href) {
      try {
        const isInternal = anchor.href.startsWith('/') ||
                          anchor.href.startsWith('#') ||
                          anchor.href.startsWith('javascript:') ||
                          anchor.href.startsWith(window.location.origin) ||
                          anchor.href.includes('localhost') ||
                          anchor.href.includes('127.0.0.1');

        if (!isInternal && !isWhitelisted(anchor.href)) {
          e.preventDefault();
          e.stopPropagation();
          console.warn(`🛡️ Security: BLOCKED untrusted external link: ${anchor.href}`);
          return false;
        }
      } catch (err) {
        // Allow click to proceed for whitelisted or internal links
      }
    }
  }, true);

  // 3. Block external form submissions
  document.addEventListener('submit', (e: Event) => {
    const form = e.target as HTMLFormElement;
    if (form && form.action) {
      const isInternal = form.action.startsWith('/') ||
                        form.action.startsWith(window.location.origin) ||
                        form.action.startsWith('#') ||
                        form.action === '';

      if (!isInternal && !isWhitelisted(form.action)) {
        e.preventDefault();
        console.warn(`🛡️ Security: Blocked external form submission to: ${form.action}`);
        return false;
      }
    }
  }, true);

  console.log('🛡️ CStream Security: External link blocker initialized with whitelist');
};
