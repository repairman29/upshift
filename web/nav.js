(function() {
  document.querySelectorAll('.nav-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var header = btn.closest('.header');
      if (!header) return;
      header.classList.toggle('open');
      btn.setAttribute('aria-expanded', header.classList.contains('open'));
    });
  });
})();
