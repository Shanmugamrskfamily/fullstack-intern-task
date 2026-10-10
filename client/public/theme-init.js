// Light is the default. A saved "dark" choice is applied before the first paint.
(function () {
  try {
    if (localStorage.getItem('layora:theme') === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#161B24');
    }
  } catch (e) {
    /* storage blocked: stay light */
  }
})();
