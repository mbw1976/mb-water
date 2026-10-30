(function () {
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var toggle = document.querySelector('.menu-toggle');
  var links = document.getElementById('navlinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var video = document.querySelector('.hero-media');
  if (video) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var conn = navigator.connection || {};
    var slowLink = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
    if (!reduceMotion) {
      // De bron wordt normaal al direct na het video-element gezet (zie home-sjabloon); dit is de terugval.
      if (!video.getAttribute('src')) {
        var wide = window.innerWidth >= 900 && !slowLink;
        video.src = video.getAttribute(wide ? 'data-src-hd' : 'data-src-sm');
      }
      var started = video.play();
      if (started && started.catch) { started.catch(function () {}); }
    }
  }

  var form = document.getElementById('contact-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var setStatus = function (text, cls) {
      status.textContent = text;
      status.className = 'form-status ' + (cls || '');
    };

    var openedAt = Date.now();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Spamfilters: verborgen veld (honeypot) en te snel versturen (minder dan 3 s na het openen van de pagina).
      if (form.elements.website && form.elements.website.value) { return; }
      if (Date.now() - openedAt < 3000) { return; }

      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        organisation: form.elements.organisation.value.trim(),
        message: form.elements.message.value.trim()
      };
      var endpoint = form.getAttribute('data-endpoint');

      if (endpoint) {
        // De captcha voegt zelf een veld toe aan het formulier: cf-turnstile-response (Turnstile) of h-captcha-response (hCaptcha).
        var captchaField = form.querySelector('.cf-turnstile') ? 'cf-turnstile-response' : (form.querySelector('.h-captcha') ? 'h-captcha-response' : '');
        if (captchaField) {
          var token = form.elements[captchaField] ? form.elements[captchaField].value : '';
          if (!token) { setStatus(form.getAttribute('data-msg-captcha'), 'err'); return; }
          data[captchaField] = token;
        }
        // Web3Forms: de (publieke) access key hoort in het bericht; de rest wordt als e-mail doorgestuurd.
        var accessKey = form.getAttribute('data-access-key');
        if (accessKey) {
          data.access_key = accessKey;
          data.subject = form.getAttribute('data-subject');
          data.from_name = 'mb-water.nl';
        }
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            if (!r.ok || j.success === false) { throw new Error('http ' + r.status); }
          });
        }).then(function () {
          form.reset();
          if (window.turnstile) { window.turnstile.reset(); } if (window.hcaptcha) { window.hcaptcha.reset(); }
          setStatus(form.getAttribute('data-msg-sent'), 'ok');
        }).catch(function () {
          if (window.turnstile) { window.turnstile.reset(); } if (window.hcaptcha) { window.hcaptcha.reset(); }
          setStatus(form.getAttribute('data-msg-error'), 'err');
        });
        return;
      }

      var body = data.message + '\n\n' + data.name + (data.organisation ? '\n' + data.organisation : '') + '\n' + data.email;
      window.location.href = 'mailto:' + atob(form.getAttribute('data-m')) +
        '?subject=' + encodeURIComponent(form.getAttribute('data-subject')) +
        '&body=' + encodeURIComponent(body);
    });
  }
})();
