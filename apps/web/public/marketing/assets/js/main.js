document.addEventListener('DOMContentLoaded', () => {
  const HERO_LAT = 42.9634;
  const HERO_LON = -85.6681;
  const HERO_ZENITH = 96; // Civil dawn/dusk
  const heroEl = document.getElementById('hero');
  const setActiveNav = () => {
    const navLinks = document.querySelectorAll('.top-nav__links a');
    if (!navLinks.length) return;
    const neighborhoods = new Set([
      'neighborhoods.html',
      'grand-rapids.html',
      'east-grand-rapids.html',
      'ada.html',
      'rockford.html',
      'kentwood.html',
      'wyoming.html',
      'byron-center.html',
      'caledonia.html',
      'grandville.html'
    ]);
    const segments = window.location.pathname.split('/').filter(Boolean);
    let file = segments.pop() || 'index.html';
    file = file.toLowerCase() || 'index.html';
    const target = neighborhoods.has(file) ? 'neighborhoods.html' : file;

    navLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      link.classList.toggle('is-active', href === target);
    });
  };
  setActiveNav();

  // --- reCAPTCHA ---
  let recaptchaSiteKey = "";
  let recaptchaReady = false;

  const initRecaptcha = async () => {
    try {
      const res = await fetch("/recaptcha/site-key", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      recaptchaSiteKey = String(data?.siteKey || "");
      if (!recaptchaSiteKey) return;

      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
        recaptchaSiteKey
      )}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.grecaptcha?.ready) {
          window.grecaptcha.ready(() => {
            recaptchaReady = true;
          });
        } else {
          recaptchaReady = true;
        }
      };
      document.head.appendChild(script);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[Marketing] Failed to init reCAPTCHA", e);
    }
  };

  // --- Mobile Menu ---
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobile-nav');
  const closeNav = document.querySelector('.mobile-nav__close');

  if (navToggle && mobileNav) {
    const openMenu = () => {
      mobileNav.classList.add('open');
      mobileNav.setAttribute('aria-hidden', 'false');
      navToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('overlay-active');
    };

    const closeMenu = () => {
      mobileNav.classList.remove('open');
      mobileNav.setAttribute('aria-hidden', 'true');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('overlay-active');
    };

    navToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    });

    if (closeNav) closeNav.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  // --- Property rail scrolling ---
  document.querySelectorAll('[data-rail]').forEach((section) => {
    const rail = section.querySelector('.property-rail');
    const prev = section.querySelector('.rail-btn--prev');
    const next = section.querySelector('.rail-btn--next');
    if (!rail) return;

    const scrollAmount = () => Math.max(rail.clientWidth * 0.8, 260);

    prev?.addEventListener('click', () => {
      rail.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });

    next?.addEventListener('click', () => {
      rail.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });
  });

  // --- Favorite toggle (UI-only) ---
  document.querySelectorAll('.favorite-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const active = btn.classList.toggle('is-active');
      btn.textContent = active ? '♥' : '♡';
    });
  });

  // --- Modal / drawer system ---
  const backdrop = document.getElementById('globalBackdrop');
  const closeAllOverlays = () => {
    document.querySelectorAll('.ui-modal, .ui-drawer, .ui-backdrop').forEach(el => el.classList.remove('is-visible'));
    document.body.classList.remove('no-scroll');
  };
  const openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal || !backdrop) return;
    backdrop.classList.add('is-visible');
    modal.classList.add('is-visible');
    document.body.classList.add('no-scroll');
  };
  const openDrawer = (id) => {
    const drawer = document.getElementById(id);
    if (!drawer || !backdrop) return;
    backdrop.classList.add('is-visible');
    drawer.classList.add('is-visible');
    document.body.classList.add('no-scroll');
  };

  backdrop?.addEventListener('click', closeAllOverlays);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllOverlays(); });

  const slugify = (str = '') => str.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleOpenModalTrigger = (trigger) => {
    const ctxInput = document.getElementById('page_context');
    if (ctxInput) {
      const fallbackHeading = document.querySelector('main h1')?.textContent || '';
      const ctx = trigger.dataset.pageContext || slugify(fallbackHeading);
      ctxInput.value = ctx;
    }
    openModal(trigger.getAttribute('data-open-modal'));
  };

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const modalTrigger = target.closest('[data-open-modal]');
    if (modalTrigger) {
      e.preventDefault();
      handleOpenModalTrigger(modalTrigger);
      return;
    }
    const drawerTrigger = target.closest('[data-open-drawer]');
    if (drawerTrigger) {
      e.preventDefault();
      openDrawer(drawerTrigger.getAttribute('data-open-drawer'));
    }
  });

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeAllOverlays();
    });
  });

  const modalForm = document.getElementById('modalForm');
  const modalStatus = document.getElementById('modal-status');
  if (modalForm && !document.getElementById('page_context')) {
    const ctxInput = document.createElement('input');
    ctxInput.type = 'hidden';
    ctxInput.name = 'page_context';
    ctxInput.id = 'page_context';
    ctxInput.value = '';
    modalForm.prepend(ctxInput);
  }
  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(modalForm);
      const firstName = (formData.get('first_name') || '').toString().trim();
      const lastName = (formData.get('last_name') || '').toString().trim();
      const email = (formData.get('email') || '').toString().trim();
      const phone = (formData.get('phone') || '').toString().trim();
      const interest = (formData.get('interest') || '').toString().trim();
      const preferredArea = (formData.get('preferred_area') || '').toString().trim();
      const userMessage = (formData.get('message') || '').toString().trim();
      const pageContextForm = (formData.get('page_context') || '').toString().trim();

      const pageContext =
        pageContextForm ||
        (window.location.pathname || '/')
          .replace(/^\/+/, '')
          .replace(/\.html$/, '') ||
        'home';

      if (!firstName || !lastName || !email || !interest) {
        if (modalStatus) modalStatus.textContent = 'Please fill all required fields.';
        return;
      }

      if (!recaptchaSiteKey || !recaptchaReady || !window.grecaptcha?.execute) {
        if (modalStatus) modalStatus.textContent = 'Captcha not ready. Please try again.';
        return;
      }

      if (modalStatus) modalStatus.textContent = 'Verifying...';

      let captchaToken;
      try {
        captchaToken = await window.grecaptcha.execute(recaptchaSiteKey, { action: "submit_lead" });
      } catch (err) {
        if (modalStatus) modalStatus.textContent = 'Captcha not ready. Please try again.';
        return;
      }

      if (!captchaToken) {
        if (modalStatus) modalStatus.textContent = 'Captcha not ready. Please try again.';
        return;
      }

      const name = `${firstName} ${lastName}`.trim();
      const lines = [];
      if (userMessage) lines.push(userMessage);
      lines.push('---');
      lines.push(`Interest: ${interest}`);
      if (preferredArea) lines.push(`Preferred area: ${preferredArea}`);
      lines.push(`Page: ${pageContext}`);
      const finalMessage = lines.join('\n');

      const payload = {
        name,
        email,
        phone: phone || undefined,
        message: finalMessage,
        brokerId: 'demo-broker',
        source: pageContext ? `marketing:${pageContext}` : 'marketing-contact-form',
        captchaToken,
      };

      if (modalStatus) modalStatus.textContent = 'Submitting...';

      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          const errorMsg = data?.message || 'Lead submission failed';
          throw new Error(errorMsg);
        }
        if (modalStatus) modalStatus.textContent = 'Thanks — we will reach out shortly.';
        setTimeout(() => {
          closeAllOverlays();
          if (modalStatus) modalStatus.textContent = '';
          modalForm.reset();
        }, 900);
      } catch (err) {
        console.error('Lead submit failed', err);
        const fallbackMessage = 'Error submitting form. Please try again.';
        const errorText = err?.message || fallbackMessage;
        if (modalStatus) modalStatus.textContent = errorText;
      }
    });
  }

  // --- Featured listings (live) ---
  const featuredGrid = document.getElementById('featuredListingsGrid');
  const featuredLoading = document.getElementById('featuredListingsLoading');
  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%23e6e7e8'/%3E%3Ctext x='50%25' y='50%25' dy='.35em' text-anchor='middle' fill='%23898b8f' font-family='Arial, sans-serif' font-size='20'%3EPhoto coming soon%3C/text%3E%3C/svg%3E";

  const escapeHtml = (str = "") =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const shuffle = (arr = []) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const NEIGHBORHOODS = [
    {
      slug: 'grand-rapids',
      name: 'Grand Rapids',
      description:
        'City neighborhoods with walkable amenities, historic homes, and ongoing revitalization projects.',
      image: 'GR_Hero.webp',
    },
    {
      slug: 'ada',
      name: 'Ada',
      description:
        'Riverside living, village conveniences, and estate-style homes with room to breathe.',
      image: 'Ada_Hero.webp',
    },
    {
      slug: 'byron-center',
      name: 'Byron Center',
      description:
        'Popular new-construction corridors, community parks, and easy access to regional employers.',
      image: 'Byron_Center_Hero.webp',
    },
    {
      slug: 'caledonia',
      name: 'Caledonia',
      description:
        'Growth-friendly schools, newer subdivisions, and open spaces with quick routes to GR.',
      image: 'Caledonia_Hero.webp',
    },
    {
      slug: 'east-grand-rapids',
      name: 'East Grand Rapids',
      description:
        'Tree-lined streets, Reeds Lake access, and a tight-knit community vibe near downtown.',
      image: 'EGR_Hero.webp',
    },
    {
      slug: 'grandville',
      name: 'Grandville',
      description:
        'Established neighborhoods, retail conveniences, and commuter-friendly access to the metro area.',
      image: 'Grandville_Hero.webp',
    },
    {
      slug: 'kentwood',
      name: 'Kentwood',
      description:
        'Diverse housing options, parks, and quick access to the airport, 131, and 96 corridors.',
      image: 'Kentwood_Hero.webp',
    },
    {
      slug: 'rockford',
      name: 'Rockford',
      description:
        'River town character, trail access, and a mix of historic downtown and newer builds.',
      image: 'Rockford_Hero.webp',
    },
    {
      slug: 'wyoming',
      name: 'Wyoming',
      description:
        'Convenient west-side hub with parks, shopping, and steady-value neighborhoods.',
      image: 'Wyoming_Hero.webp',
    },
  ];

  const renderFeaturedNeighborhoods = () => {
    const grid = document.querySelector('.neighborhood-grid--featured');
    if (!grid) return;
    const picks = shuffle([...NEIGHBORHOODS]).slice(0, 4);
    const html = picks
      .map((n) => {
        const slug = escapeHtml(n.slug);
        const name = escapeHtml(n.name);
        const desc = escapeHtml(n.description);
        const image = escapeHtml(n.image);
        return `
          <a class="area-card" href="${slug}.html" role="listitem">
            <div class="area-card__image" style="background-image:url('./assets/img/${image}');"></div>
            <div class="area-card__body">
              <h3>${name}</h3>
              <p>${desc}</p>
            </div>
          </a>
        `;
      })
      .join('');
    grid.innerHTML = html;
  };

  const formatNumber = (num) =>
    typeof num === "number" && Number.isFinite(num) ? num.toLocaleString() : "—";

  const formatPrice = (listing) => {
    if (listing?.listPriceFormatted) return listing.listPriceFormatted;
    const price = Number(listing?.listPrice ?? listing?.price ?? 0);
    if (!Number.isFinite(price) || price <= 0) return "$—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const buildCardHtml = (listing) => {
    const price = formatPrice(listing);
    const street = escapeHtml(
      listing?.address?.street || listing?.address?.full || "Address unavailable"
    );
    const city = escapeHtml(listing?.address?.city || "");
    const state = escapeHtml(listing?.address?.state || "");
    const cityLine = [city, state].filter(Boolean).join(", ");

    const beds = listing?.details?.beds ?? listing?.details?.bedrooms ?? listing?.beds;
    const baths =
      listing?.details?.baths ?? listing?.details?.bathrooms ?? listing?.baths;
    const sqft = listing?.details?.sqft ?? listing?.sqft;

    const photo =
      listing?.media?.thumbnailUrl ||
      (Array.isArray(listing?.media?.photos) ? listing.media.photos[0] : null) ||
      placeholderImage;
    const safePhoto = escapeHtml(photo);
    const altText = escapeHtml(street || "Featured listing");

    const meta = `${formatNumber(beds)} Beds · ${formatNumber(baths)} Baths · ${formatNumber(
      sqft
    )} sqft`;

    const id = escapeHtml(listing?.id || "");

    return `
      <article class="property-card hp-featured-card" role="listitem" data-listing-id="${id}">
        <div class="property-card__media">
          <img src="${safePhoto}" alt="${altText}" loading="lazy" decoding="async">
        </div>
        <div class="property-card__body">
          <div class="property-card__price">${price}</div>
          <div class="property-card__address">${street}${cityLine ? `<br>${cityLine}` : ""}</div>
          <div class="property-card__meta">${meta}</div>
          <div class="property-card__footer">
            <button class="btn btn-secondary hp-featured-btn btn-block" type="button" data-open-modal="contactModal">View Details</button>
          </div>
        </div>
      </article>
    `;
  };

  const loadFeaturedListings = async () => {
    if (!featuredGrid) return;
    const params = new URLSearchParams({
      minPrice: "300000",
      limit: "24",
      sort: "price_desc",
      bbox: "-85.8,42.8,-85.5,43.1",
    });

    try {
      const res = await fetch(`/api/listings?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch listings");
      const json = await res.json();
      const listings = Array.isArray(json?.results)
        ? json.results
        : Array.isArray(json?.data)
        ? json.data
        : [];

      const filtered = listings.filter((listing) => {
        const rawPrice = Number(listing?.listPrice ?? listing?.price ?? 0);
        const statusRaw = String(listing?.details?.status || listing?.status || "")
          .trim()
          .toUpperCase();

        const isSoldish =
          statusRaw.includes("SOLD") || statusRaw.includes("CLOSED") || statusRaw.includes("PENDING");
        const isForSale =
          statusRaw === "FOR_SALE" || statusRaw === "ACTIVE" || statusRaw.includes("ACTIVE");

        return Number.isFinite(rawPrice) && rawPrice >= 300000 && isForSale && !isSoldish;
      });

      const selected = shuffle(filtered).slice(0, 8);
      if (!selected.length) throw new Error("No listings available");

      featuredGrid.innerHTML = selected.map(buildCardHtml).join("");
    } catch (err) {
      featuredGrid.innerHTML =
        '<p class="section__lede">Featured listings are unavailable right now.</p>';
      // eslint-disable-next-line no-console
      console.error("Featured listings failed", err);
    } finally {
      featuredLoading?.remove();
    }
  };

  // --- Hero day/night switching (Grand Rapids, MI) ---
  const degToRad = (deg) => deg * Math.PI / 180;
  const radToDeg = (rad) => rad * 180 / Math.PI;
  const normalizeDeg = (deg) => (deg % 360 + 360) % 360;

  const computeSolarTime = (date, isSunrise) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const n1 = Math.floor(275 * (month + 1) / 9);
    const n2 = Math.floor((month + 1 + 9) / 12);
    const n3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
    const N = n1 - (n2 * n3) + day - 30;

    const lngHour = HERO_LON / 15;
    const t = N + ((isSunrise ? 6 : 18) - lngHour) / 24;

    const M = (0.9856 * t) - 3.289;
    let L = M + (1.916 * Math.sin(degToRad(M))) + (0.020 * Math.sin(degToRad(2 * M))) + 282.634;
    L = normalizeDeg(L);

    let RA = radToDeg(Math.atan(0.91764 * Math.tan(degToRad(L))));
    RA = normalizeDeg(RA);
    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = (RA + (Lquadrant - RAquadrant)) / 15;

    const sinDec = 0.39782 * Math.sin(degToRad(L));
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (Math.cos(degToRad(HERO_ZENITH)) - (sinDec * Math.sin(degToRad(HERO_LAT)))) / (cosDec * Math.cos(degToRad(HERO_LAT)));
    if (cosH > 1 || cosH < -1) return null; // Sun never rises/sets (edge case)

    const H = isSunrise ? 360 - radToDeg(Math.acos(cosH)) : radToDeg(Math.acos(cosH));
    const Hhours = H / 15;

    const T = Hhours + RA - (0.06571 * t) - 6.622;
    const UT = (T - lngHour + 24) % 24;

    const utcMidnight = Date.UTC(year, month, day, 0, 0, 0);
    const utcMillis = utcMidnight + UT * 3600 * 1000;
    return new Date(utcMillis);
  };

  const updateHeroTheme = () => {
    if (!heroEl) return;
    const now = new Date();
    const dawn = computeSolarTime(now, true);
    const dusk = computeSolarTime(now, false);

    let isNight = false;
    if (dawn && dusk) {
      isNight = now < dawn || now >= dusk;
    } else {
      // Fallback: treat 7pm-6am as night if calculations fail
      const hour = now.getHours();
      isNight = hour >= 19 || hour < 6;
    }

    heroEl.classList.toggle('is-night', isNight);
  };

  initRecaptcha();
  loadFeaturedListings();
  renderFeaturedNeighborhoods();
  updateHeroTheme();
  setInterval(updateHeroTheme, 5 * 60 * 1000);
});
