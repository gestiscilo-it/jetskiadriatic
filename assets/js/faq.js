(function () {
  function setup() {
    document.querySelectorAll('.faq .fa').forEach(it => {
      it.addEventListener('click', () => it.classList.toggle('open'));
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
