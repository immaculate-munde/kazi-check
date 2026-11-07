/** Inline script to avoid theme flash before React hydrates. */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('kc-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.style.colorScheme='light';}}catch(e){}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
