// ---------- BACKGROUND MUSIC ---------- //
if (!window.__bgMusicInitialized) {
  const audio = document.getElementById('bg-music');

  if (audio) {
    window.__bgMusicInitialized = true;
    window.__bgMusic = audio;
    window.__bgMusicStarted = false;

    const startMusicOnce = () => {
      if (!window.__bgMusicStarted) {
        audio.play().catch(() => {});
        window.__bgMusicStarted = true;
      }
      document.removeEventListener('click', startMusicOnce);
    };

    document.addEventListener('click', startMusicOnce);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // ---------- 1) Dynamic Year ----------
  document.querySelectorAll('[id^="year"]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // ---------- 2) Universal Mobile Nav Toggle ----------
  const nav = document.querySelector('.site-nav');
  const toggles = document.querySelectorAll('.nav-toggle');

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      if (nav) {
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isExpanded));
        nav.classList.toggle('show-mobile');
      }
    });
  });

  // Helper: preload images 
  function preload(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      if (img.complete) resolve(img);
      else {
        img.onload = () => resolve(img);
        img.onerror = reject;
      }
    });
  }

  // ---------- Slider factory ----------
  function createSlider(options) {
    const {
      containerSelector,
      slides,
      transitionDuration = 400,
      autoInterval = 5000
    } = options;

    const container = document.querySelector(containerSelector);
    if (!container) return null;

    const img = container.querySelector('.hero-img');
    const sticker = container.querySelector('.sticker');
    let dotsContainer = container.querySelector('.hero-dots');

    if (!img) return null;

    img.style.transition = `opacity ${transitionDuration}ms ease-in-out`;
    img.style.opacity = '1';

    if (dotsContainer && dotsContainer.children.length === 0) {
      slides.forEach((s, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dot' + (idx === 0 ? ' active' : '');
        btn.setAttribute('data-slide', String(idx));
        btn.setAttribute('aria-label', `Slide ${idx + 1}`);
        dotsContainer.appendChild(btn);
      });
    }

    const dots = Array.from(dotsContainer ? dotsContainer.querySelectorAll('.dot') : []);
    let current = 0;
    let isTransitioning = false;
    let autoTimer = null;

    function setActiveDot(i) {
      dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
    }

    function waitForFadeOut() {
      return new Promise(resolve => {
        const onEnd = (e) => {
          if (e && e.propertyName && e.propertyName !== 'opacity') return;
          img.removeEventListener('transitionend', onEnd);
          resolve();
        };
        img.addEventListener('transitionend', onEnd);
        setTimeout(resolve, transitionDuration + 80);
      });
    }

    async function showSlide(index) {
      if (isTransitioning) return;
      const nextIndex = (index + slides.length) % slides.length;
      if (nextIndex === current) return;

      isTransitioning = true;
      setActiveDot(nextIndex);
      img.style.opacity = '0';
      await waitForFadeOut();

      try { await preload(slides[nextIndex].src); } catch (err) {}

      img.src = slides[nextIndex].src;
      img.alt = slides[nextIndex].alt || '';
      if (sticker && slides[nextIndex].label) sticker.textContent = slides[nextIndex].label;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          img.style.opacity = '1';
        });
      });

      setTimeout(() => {
        current = nextIndex;
        isTransitioning = false;
      }, transitionDuration + 20);
    }

    function showSlideImmediate(index) {
      const nextIndex = (index + slides.length) % slides.length;
      current = nextIndex;
      img.src = slides[nextIndex].src;
      img.alt = slides[nextIndex].alt || '';
      if (sticker && slides[nextIndex].label) sticker.textContent = slides[nextIndex].label;
      setActiveDot(nextIndex);
      img.style.opacity = '1';
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(() => {
        if (!isTransitioning) showSlide(current + 1);
      }, autoInterval);
    }
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    dots.forEach((d, idx) => {
      d.addEventListener('click', (ev) => {
        ev.preventDefault();
        showSlide(idx);
      });
    });

    showSlideImmediate(0);
    startAuto();
  }

  createSlider({
    containerSelector: '#hero',
    slides: [
      { src: "crispy.jpg", label: "Burger", alt: "Crispy chicken sandwich" },
      { src: "wings.jpg", label: "Wings", alt: "Buffalo wings" },
      { src: "philly.jpg", label: "Philly cheesesteak", alt: "Philly cheesesteak" }
    ]
  });

  createSlider({
    containerSelector: '#hero-2',
    slides: [
      { src: "drummets.jpg", label: "Drummets", alt: "Crispy drumettes" },
      { src: "chicken.jpg", label: "Chicken", alt: "Seasoned chicken" },
      { src: "rooster.jpg", label: "Rooster", alt: "Signature rooster dish" }
    ]
  });

  // ---------- 3) Menu chips filter (Fix included) ----------
  const chips = document.querySelectorAll('.chip');
  const items = document.querySelectorAll('.menu-item');
  const FADE_MS = 180;

  if (chips.length > 0 && items.length > 0) {
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const category = chip.getAttribute('data-cat');
        chips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
        filterBy(category);
      });
    });
  }

  function hideItem(el) {
    el.style.transition = `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`;
    el.style.opacity = '0';
    el.style.transform = 'scale(.995)';
    el.setAttribute('aria-hidden', 'true');
    setTimeout(() => { el.style.display = 'none'; }, FADE_MS + 10);
  }

  function showItem(el) {
    el.style.display = 'flex';
    void el.offsetWidth;
    el.style.transition = `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`;
    el.style.opacity = '1';
    el.style.transform = 'scale(1)';
    el.removeAttribute('aria-hidden');

    // FIX: Clear inline styles after animation so CSS :hover works again
    setTimeout(() => {
      el.style.opacity = '';
      el.style.transform = '';
      el.style.transition = '';
    }, FADE_MS + 50);
  }

  function filterBy(cat) {
    items.forEach(i => {
      const itemCat = i.dataset.cat || '';
      if (cat === 'all' || itemCat === cat) { showItem(i); } 
      else { hideItem(i); }
    });
  }

  // ---------- 4) Dummy Cart Logic (Inside DOMContentLoaded) ----------
  const cart = [];
  const listDisplay = document.getElementById('cart-items-list');
  const totalDisplay = document.getElementById('cart-total-amount');
  const addButtons = document.querySelectorAll('.btn-add-cart');
  const checkoutBtn = document.querySelector('#dummy-cart .btn.primary');

  addButtons.forEach(button => {
    button.addEventListener('click', () => {
      const name = button.getAttribute('data-name');
      const price = parseFloat(button.getAttribute('data-price'));
      cart.push({ name, price });
      updateCartDisplay();

      const originalText = button.innerText;
      button.innerText = "Added! ✓";
      setTimeout(() => { button.innerText = originalText; }, 800);
    });
  });

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }
      alert('Order Placed Successfully! Your wings are being prepared.');
      cart.length = 0; // The Restart
      updateCartDisplay();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function updateCartDisplay() {
    if(!listDisplay) return;
    listDisplay.innerHTML = '';
    if (cart.length === 0) {
      listDisplay.innerHTML = '<p class="muted">Your cart is currently empty.</p>';
      totalDisplay.innerText = '$0.00';
      return;
    }
    let total = 0;
    cart.forEach((item) => {
      const itemRow = document.createElement('div');
      itemRow.style.display = 'flex';
      itemRow.style.justifyContent = 'space-between';
      itemRow.innerHTML = `<span>${item.name}</span> <span>$${item.price.toFixed(2)}</span>`;
      listDisplay.appendChild(itemRow);
      total += item.price;
    });
    totalDisplay.innerText = `$${total.toFixed(2)}`;
  }

}); // End of DOMContentLoaded