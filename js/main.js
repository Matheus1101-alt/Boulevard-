/* Boulevard Restaurante — interações da landing page */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Header: fundo sólido após 60px + barra de CTA após 20% ---------- */
  var header = document.querySelector('.site-header');
  var ctaBar = document.querySelector('.cta-bar');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 60);

    if (ctaBar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var show = max > 0 && y / max > 0.2;
      if (show !== ctaBar.classList.contains('is-visible')) {
        ctaBar.classList.toggle('is-visible', show);
        ctaBar.inert = !show; // escondida = fora da ordem de tabulação
      }
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var desktopNav = window.matchMedia('(min-width: 1120px)');

  function setNav(open, returnFocus) {
    header.classList.toggle('is-nav-open', open);
    document.documentElement.classList.toggle('nav-locked', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (!open && returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') !== 'true';
    setNav(open, false);
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus();
    }
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && !desktopNav.matches) setNav(false, false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('is-nav-open')) setNav(false, true);
  });

  document.addEventListener('click', function (e) {
    if (header.classList.contains('is-nav-open') && !header.contains(e.target)) setNav(false, false);
  });

  // Mantém o foco dentro do header enquanto o menu está aberto
  header.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !header.classList.contains('is-nav-open')) return;
    var items = header.querySelectorAll('a[href], button:not([hidden])');
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  desktopNav.addEventListener('change', function (mq) {
    if (mq.matches) setNav(false, false);
  });

  /* ---------- Destaque do item de menu da seção visível ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav__link'));
  var spied = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  function setCurrent(id) {
    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === '#' + id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  if (hasIO) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spied.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- Revelação ao entrar na viewport ---------- */
  var reveals = document.querySelectorAll('.reveal');

  if (hasIO) {
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('reveal--pending');
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(reveals, function (el) {
      // Só esconde o que ainda está abaixo da dobra: nada "pisca" no carregamento.
      var rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.92) el.classList.add('reveal--pending');
      else el.classList.add('is-visible');
      revealer.observe(el);
    });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Momentos: ilustração interativa ---------- */
  var picker = document.querySelector('[data-moments]');
  var scene = document.querySelector('.scene');

  if (picker && scene) {
    var buttons = Array.prototype.slice.call(picker.querySelectorAll('.moment-btn'));
    var autoBtn = picker.querySelector('[data-autoplay-toggle]');
    var stage = document.getElementById('moment-scene');
    var current = 0;

    function select(index) {
      current = (index + buttons.length) % buttons.length;
      buttons.forEach(function (btn, i) {
        btn.setAttribute('aria-pressed', String(i === current));
      });
      scene.setAttribute('data-scene', buttons[current].getAttribute('data-scene'));
    }

    function setPaused(paused) {
      picker.classList.toggle('is-paused', paused);
      autoBtn.classList.toggle('is-paused', paused);
      autoBtn.setAttribute('aria-label', paused ? 'Retomar animação' : 'Pausar animação');
    }

    function startAuto() {
      picker.classList.add('is-auto');
      setPaused(false);
    }

    function stopAuto() {
      picker.classList.remove('is-auto');
      setPaused(true);
    }

    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        stopAuto(); // escolha do usuário encerra a troca automática
        select(i);
      });
    });

    // Setas do teclado percorrem a lista
    picker.addEventListener('keydown', function (e) {
      var idx = buttons.indexOf(document.activeElement);
      if (idx === -1) return;
      var next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = idx + 1;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = idx - 1;
      if (next === null) return;
      e.preventDefault();
      next = (next + buttons.length) % buttons.length;
      buttons[next].focus();
      stopAuto();
      select(next);
    });

    // O fim da barra de progresso avança para o próximo momento
    picker.addEventListener('animationend', function (e) {
      if (e.animationName !== 'moment-progress' || !picker.classList.contains('is-auto')) return;
      select(current + 1);
    });

    // Troca automática só para quem não pediu movimento reduzido
    if (!reduceMotion.matches) {
      autoBtn.hidden = false;
      autoBtn.addEventListener('click', function () {
        if (!picker.classList.contains('is-auto')) startAuto();
        else setPaused(!picker.classList.contains('is-paused'));
      });

      if (hasIO) {
        var started = false;
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            picker.classList.toggle('is-offscreen', !entry.isIntersecting);
            if (entry.isIntersecting && !started) {
              started = true;
              startAuto();
            }
          });
        }, { threshold: 0.35 }).observe(stage);
      }
    }
  }
})();
