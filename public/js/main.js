(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('form[data-loading-submit]').forEach(function (form) {
    form.addEventListener('submit', function () {
      var btn = form.querySelector('button[type="submit"]');
      if (btn && !btn.disabled) {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'Đang gửi...';
      }
    });
  });

  document.querySelectorAll('[data-confirm]').forEach(function (el) {
    el.addEventListener('submit', function (e) {
      if (!window.confirm(el.getAttribute('data-confirm'))) {
        e.preventDefault();
      }
    });
  });

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll-reveal: hien dan cac phan tu ".reveal" khi cuon toi
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  // Dem so tang dan cho cac chi so (vd: 13 phong, 02 chi nhanh)
  var counters = document.querySelectorAll('[data-count-to]');
  if (counters.length) {
    var animateCount = function (el) {
      var target = parseInt(el.getAttribute('data-count-to'), 10);
      if (isNaN(target)) return;
      var pad = parseInt(el.getAttribute('data-count-pad'), 10) || 0;
      var format = function (n) { return String(n).padStart(pad, '0'); };
      if (prefersReducedMotion) {
        el.textContent = format(target);
        return;
      }
      var duration = 1100;
      var start = null;
      var step = function (ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = format(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = format(target);
      };
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { countObserver.observe(el); });
    } else {
      counters.forEach(animateCount);
    }
  }

  // Navbar do bong nhe khi cuon xuong
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    var updateNavbarShadow = function () {
      navbar.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    updateNavbarShadow();
    window.addEventListener('scroll', updateNavbarShadow, { passive: true });
  }

  // Carousel dung chung: nut prev/next + cham (dot) dong bo theo item dang hien
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.carousel-track');
    var items = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-item'));
    var prevBtn = carousel.querySelector('.carousel-arrow.prev');
    var nextBtn = carousel.querySelector('.carousel-arrow.next');
    var dotsWrap = carousel.querySelector('.carousel-dots');
    if (!track || !items.length) return;

    var dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      items.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Đi tới mục ' + (i + 1));
        dot.addEventListener('click', function () {
          items[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    var setActiveDot = function (idx) {
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
    };

    if ('IntersectionObserver' in window) {
      var activeIndex = 0;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            var idx = items.indexOf(entry.target);
            if (idx !== -1) { activeIndex = idx; setActiveDot(idx); }
          }
        });
      }, { root: track, threshold: [0.6] });
      items.forEach(function (item) { io.observe(item); });
    }

    var scrollByItem = function (dir) {
      var itemWidth = items[0].getBoundingClientRect().width + 20;
      track.scrollBy({ left: dir * itemWidth, behavior: 'smooth' });
    };
    if (prevBtn) prevBtn.addEventListener('click', function () { scrollByItem(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { scrollByItem(1); });
  });

  // Thu vien anh trang chi tiet phong: click thumbnail de doi anh chinh
  var mainPhoto = document.getElementById('room-main-photo');
  var thumbButtons = document.querySelectorAll('.room-gallery-thumb');
  if (mainPhoto && thumbButtons.length) {
    thumbButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-photo-src');
        if (!src) return;
        mainPhoto.src = src;
        thumbButtons.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
      });
    });
  }
})();
