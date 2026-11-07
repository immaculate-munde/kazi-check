/** Apply stored theme before paint. Default is light glass. */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('kc-theme');if(t!=='dark'&&t!=='light')t='light';document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t;}catch(e){}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
