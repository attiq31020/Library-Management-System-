(function () {
  'use strict';
 
  /* =======================================================
     1. HELPERS AUR STORAGE
  ======================================================= */
  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
 
  const reducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
  function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
 
  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
 
  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
 
  function debounce(fn, delay) {
    let timer;
    return function () {
      const args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(null, args); }, delay);
    };
  }
 
  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
 
  const Store = {
    get: function (key, fallback) {
      try {
        const raw = localStorage.getItem('librahub:' + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (error) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem('librahub:' + key, JSON.stringify(value));
      } catch (error) {
        /* storage band ho to bhi site chalti rahe */
      }
    }
  };
 
  /* =======================================================
     2. EXTRA CSS (sirf naye features ke liye)
  ======================================================= */
  function injectStyles() {
    const css = `
      /* scroll progress bar */
      .lh-progress {
        position: fixed; top: 0; left: 0; height: 3px; width: 0;
        background: linear-gradient(90deg, #5369f5, #9b50da);
        z-index: 300; transition: width .1s linear;
      }
      .navbar { transition: box-shadow .25s ease; }
      .navbar.lh-scrolled { box-shadow: 0 8px 30px rgba(23, 35, 70, .08); }
 
      /* top strip */
      .top-strip { transition: opacity .35s ease; }
      .top-strip.lh-fade { opacity: 0; }
 
      /* floating cards animation */
      .float-top { animation: lhFloat 5s ease-in-out infinite; }
      .float-bottom { animation: lhFloat 6s ease-in-out infinite reverse; }
      @keyframes lhFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-9px); }
      }
 
      /* reveal animation */
      .lh-pre { opacity: 0; }
      .lh-in { animation: lhFadeUp .6s ease backwards; }
      @keyframes lhFadeUp {
        from { opacity: 0; transform: translateY(26px); }
        to { opacity: 1; transform: none; }
      }
 
      /* category count badge */
      .category { position: relative; }
      .lh-count {
        position: absolute; top: 14px; right: 14px;
        min-width: 24px; height: 24px; padding: 0 7px;
        display: grid; place-items: center;
        border-radius: 20px; background: #f0f2fb;
        color: var(--muted); font-size: 10px; font-weight: 800;
        transition: background .2s ease, color .2s ease;
      }
      .category.selected .lh-count { background: var(--blue); color: #fff; }
 
      /* search extras */
      .lh-clear {
        flex-shrink: 0; width: 22px; height: 22px; border: 0;
        border-radius: 50%; background: #e9ecf5; color: var(--muted);
        font-size: 11px; line-height: 1;
      }
      .lh-clear:hover { background: #dfe3f5; color: var(--navy); }
      .lh-kbd {
        flex-shrink: 0; min-width: 22px; padding: 1px 7px;
        border: 1px solid var(--line); border-bottom-width: 2px;
        border-radius: 6px; background: #fff; color: var(--muted);
        font-family: inherit; font-size: 11px; font-weight: 700; text-align: center;
      }
      .search input:not(:placeholder-shown) ~ .lh-kbd { display: none; }
      .lh-mark {
        padding: 0 2px; border-radius: 3px;
        background: #e5e8ff; color: var(--blue-dark, #3949c8);
      }
 
      /* filters bar */
      .lh-filters {
        display: flex; justify-content: space-between; align-items: center;
        flex-wrap: wrap; gap: 14px; margin-bottom: 26px;
      }
      .lh-chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .lh-chip {
        padding: 8px 14px; border: 1px solid var(--line); border-radius: 30px;
        background: #fff; color: #606b83; font-size: 12px; font-weight: 700;
        transition: all .2s ease;
      }
      .lh-chip:hover { border-color: #b7bfff; color: var(--blue); }
      .lh-chip.active {
        color: #fff; border-color: transparent;
        background: linear-gradient(120deg, #5369f5, #7654e8);
        box-shadow: 0 6px 15px rgba(83, 105, 245, .22);
      }
      .lh-chip-count { margin-left: 6px; font-size: 10px; opacity: .75; }
      .lh-filter-right { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; }
      .lh-link-btn {
        border: 0; background: none; color: var(--blue);
        font-size: 12px; font-weight: 800;
      }
      .lh-link-btn:hover { color: var(--purple); }
      .lh-sort { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 12px; }
      .lh-sort select {
        padding: 9px 12px; border: 1px solid var(--line); border-radius: 9px;
        background: #f8f9fd; color: var(--navy); font-size: 12px; font-weight: 600;
      }
 
      /* favorite heart on book cover */
      .book-cover { cursor: pointer; }
      .lh-fav {
        position: absolute; top: 10px; right: 10px; z-index: 3;
        width: 34px; height: 34px; display: grid; place-items: center;
        border: 0; border-radius: 50%; background: rgba(255, 255, 255, .92);
        color: #8a93ab; font-size: 17px; line-height: 1;
        box-shadow: 0 4px 12px rgba(16, 26, 54, .18);
        transition: transform .2s ease, color .2s ease;
      }
      .lh-fav:hover { transform: scale(1.12); color: #e0457b; }
      .lh-fav.active { color: #e0457b; }
      .lh-fav.pop { animation: lhPop .35s ease; }
      @keyframes lhPop {
        0% { transform: scale(1); }
        50% { transform: scale(1.4); }
        100% { transform: scale(1); }
      }
 
      /* dialog extras */
      dialog[open] { animation: lhDialogIn .25s ease; }
      @keyframes lhDialogIn {
        from { opacity: 0; transform: translateY(14px) scale(.98); }
        to { opacity: 1; transform: none; }
      }
      .lh-dialog-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
      .lh-pill {
        padding: 5px 10px; border-radius: 20px; background: #f1f3ff;
        color: #4a55c7; font-size: 11px; font-weight: 700;
      }
      .lh-pill.warn { background: #fff3dc; color: #ad7625; }
      .lh-dialog-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
      .lh-dialog-actions .btn[disabled] {
        opacity: .55; cursor: not-allowed; transform: none; box-shadow: none;
      }
 
      /* toast */
      .lh-toasts {
        position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%);
        display: grid; gap: 10px; width: min(420px, 92%);
        z-index: 500; pointer-events: none;
      }
      .lh-toast {
        display: flex; align-items: center; gap: 10px;
        padding: 13px 18px; border-radius: 12px;
        background: #111b37; color: #fff; font-size: 13px; font-weight: 600;
        box-shadow: 0 14px 40px rgba(17, 27, 55, .3);
        animation: lhToastIn .3s ease both;
      }
      .lh-toast.out { animation: lhToastOut .3s ease both; }
      .lh-toast-icon { font-size: 16px; }
      @keyframes lhToastIn {
        from { opacity: 0; transform: translateY(14px); }
        to { opacity: 1; transform: none; }
      }
      @keyframes lhToastOut {
        from { opacity: 1; transform: none; }
        to { opacity: 0; transform: translateY(14px); }
      }
 
      /* back to top */
      .lh-top {
        position: fixed; right: 22px; bottom: 22px; z-index: 90;
        width: 46px; height: 46px; border: 0; border-radius: 50%;
        color: #fff; font-size: 20px;
        background: linear-gradient(135deg, #5369f5, #8256e8);
        box-shadow: 0 10px 25px rgba(83, 105, 245, .35);
        opacity: 0; visibility: hidden; transform: translateY(12px);
        transition: all .25s ease;
      }
      .lh-top.show { opacity: 1; visibility: visible; transform: none; }
      .lh-top:hover { transform: translateY(-3px); }
 
      @media (max-width: 700px) {
        .lh-filters { align-items: flex-start; }
        .lh-filter-right { width: 100%; }
        .lh-sort { width: 100%; }
        .lh-sort select { flex: 1; }
        .lh-kbd { display: none; }
        .lh-top { right: 14px; bottom: 14px; }
        .lh-count { top: 10px; right: 10px; }
      }
 
      @media (prefers-reduced-motion: reduce) {
        .float-top, .float-bottom, .lh-in, dialog[open] { animation: none; }
      }
    `;
 
    const style = document.createElement('style');
    style.id = 'librahub-extra-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }
 
  /* =======================================================
     3. MAIN APP
  ======================================================= */
  function init() {
    injectStyles();
 
    /* ---------- elements ---------- */
    const grid = $('#bookGrid');
    const searchInput = $('#searchInput');
    const searchBox = $('.search');
    const countLabel = $('#bookCount');
    const emptyState = $('#emptyState');
    const collectionLabel = $('#collectionLabel');
    const menuToggle = $('#menuToggle');
    const navLinks = $('#navLinks');
    const navbar = $('.navbar');
    const dialog = $('#bookDialog');
    const categoryButtons = $$('.category');
 
    if (!grid || !searchInput || !dialog) return;
 
    /* ---------- state ---------- */
    const state = {
      query: '',
      category: 'All',
      quick: 'all',
      sort: 'default',
      favorites: new Set(Store.get('favorites', [])),
      borrowed: Store.get('borrowed', {})
    };
 
    let currentBook = null;
 
    /* ---------- books ka data cards se ---------- */
    const books = $$('.book-card', grid).map(function (card, index) {
      const titleEl = $('.book-details h3', card);
      const authorEl = $('.book-author', card);
      const statusEl = $('.status', card);
      const detailsBtn = $('.details-btn', card);
      const ratingEl = $('.book-rating', card);
      const title = titleEl.textContent.trim();
 
      return {
        id: slugify(title),
        el: card,
        index: index,
        title: title,
        author: authorEl.textContent.trim(),
        category: card.dataset.category,
        rating: parseFloat(ratingEl.textContent.replace(/[^\d.]/g, '')) || 0,
        description: detailsBtn ? detailsBtn.dataset.description || '' : '',
        baseOnLoan: statusEl.classList.contains('loan'),
        titleEl: titleEl,
        authorEl: authorEl,
        statusEl: statusEl,
        detailsBtn: detailsBtn,
        cover: $('.book-cover', card)
      };
    });
 
    /* ---------- book status helpers ---------- */
    const isBorrowed = (book) => Boolean(state.borrowed[book.id]);
    const isOnLoan = (book) => book.baseOnLoan || isBorrowed(book);
 
    function statusInfo(book) {
      if (isBorrowed(book)) return { text: '● Borrowed by you', loan: true };
      if (book.baseOnLoan) return { text: '● On Loan', loan: true };
      return { text: '● Available', loan: false };
    }
 
    function renderStatus(book) {
      const info = statusInfo(book);
      book.statusEl.textContent = info.text;
      book.statusEl.classList.toggle('loan', info.loan);
    }
 
    /* =====================================================
       TOAST NOTIFICATIONS
    ===================================================== */
    function toast(message, icon) {
      const host = dialog.open ? dialog : document.body;
      let box = Array.from(host.children).find(function (child) {
        return child.classList && child.classList.contains('lh-toasts');
      });
 
      if (!box) {
        box = document.createElement('div');
        box.className = 'lh-toasts';
        box.setAttribute('aria-live', 'polite');
        host.appendChild(box);
      }
 
      const item = document.createElement('div');
      item.className = 'lh-toast';
      item.innerHTML =
        '<span class="lh-toast-icon">' + (icon || '✓') + '</span><span>' + escapeHTML(message) + '</span>';
      box.appendChild(item);
 
      setTimeout(function () {
        item.classList.add('out');
        setTimeout(function () { item.remove(); }, 300);
      }, 2600);
    }
 
    /* =====================================================
       FILTER BAR (chips + sort + surprise + reset)
    ===================================================== */
    const quickFilters = [
      ['all', 'All'],
      ['available', 'Available'],
      ['loan', 'On Loan'],
      ['favorites', '♥ Favorites'],
      ['borrowed', 'My Borrowed']
    ];
 
    const filtersBar = document.createElement('div');
    filtersBar.className = 'lh-filters';
    filtersBar.innerHTML =
      '<div class="lh-chips" role="group" aria-label="Filter books by status">' +
        quickFilters.map(function (item, i) {
          return '<button type="button" class="lh-chip' + (i === 0 ? ' active' : '') +
            '" data-quick="' + item[0] + '">' + item[1] +
            '<span class="lh-chip-count">0</span></button>';
        }).join('') +
      '</div>' +
      '<div class="lh-filter-right">' +
        '<button type="button" class="lh-link-btn" id="lhSurprise">🎲 Surprise me</button>' +
        '<button type="button" class="lh-link-btn" id="lhReset" hidden>Reset filters</button>' +
        '<label class="lh-sort"><span>Sort by</span>' +
          '<select id="lhSort" aria-label="Sort books">' +
            '<option value="default">Featured</option>' +
            '<option value="rating">Top rated</option>' +
            '<option value="title-asc">Title A–Z</option>' +
            '<option value="title-desc">Title Z–A</option>' +
            '<option value="author-asc">Author A–Z</option>' +
          '</select>' +
        '</label>' +
      '</div>';
    grid.parentNode.insertBefore(filtersBar, grid);
 
    const chips = $$('.lh-chip', filtersBar);
    const sortSelect = $('#lhSort');
    const resetBtn = $('#lhReset');
    const surpriseBtn = $('#lhSurprise');
 
    /* ---------- search box extras ---------- */
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'lh-clear';
    clearBtn.setAttribute('aria-label', 'Clear search');
    clearBtn.textContent = '✕';
    clearBtn.hidden = true;
 
    const kbdHint = document.createElement('kbd');
    kbdHint.className = 'lh-kbd';
    kbdHint.textContent = '/';
 
    searchBox.appendChild(clearBtn);
    searchBox.appendChild(kbdHint);
 
    /* ---------- category counts ---------- */
    categoryButtons.forEach(function (button) {
      const category = button.dataset.category;
      const total = category === 'All'
        ? books.length
        : books.filter(function (b) { return b.category === category; }).length;
 
      const badge = document.createElement('span');
      badge.className = 'lh-count';
      badge.textContent = total;
      button.appendChild(badge);
      button.setAttribute('aria-pressed', String(button.classList.contains('selected')));
    });
 
    /* =====================================================
       DIALOG (details + borrow + favorite)
    ===================================================== */
    const dialogStatus = $('.dialog-status', dialog);
    const dialogDescription = $('#dialogDescription');
 
    const dialogMeta = document.createElement('div');
    dialogMeta.className = 'lh-dialog-meta';
 
    const dialogActions = document.createElement('div');
    dialogActions.className = 'lh-dialog-actions';
    dialogActions.innerHTML =
      '<button type="button" class="btn btn-primary" id="lhBorrowBtn"></button>' +
      '<button type="button" class="btn btn-outline" id="lhFavBtn"></button>';
 
    dialogDescription.after(dialogMeta);
    dialogMeta.after(dialogActions);
 
    const borrowBtn = $('#lhBorrowBtn', dialog);
    const dialogFavBtn = $('#lhFavBtn', dialog);
 
    function renderDialog() {
      if (!currentBook) return;
      const book = currentBook;
      const borrowedUntil = state.borrowed[book.id] ? new Date(state.borrowed[book.id]) : null;
 
      /* meta pills */
      let pills =
        '<span class="lh-pill">📚 ' + escapeHTML(book.category) + '</span>' +
        '<span class="lh-pill">★ ' + book.rating.toFixed(1) + '</span>';
 
      if (borrowedUntil) {
        const overdue = borrowedUntil < new Date();
        pills += '<span class="lh-pill warn">⏰ ' + (overdue ? 'Overdue since ' : 'Due ') +
          formatDate(borrowedUntil) + '</span>';
      }
      dialogMeta.innerHTML = pills;
 
      /* borrow button */
      if (isBorrowed(book)) {
        borrowBtn.textContent = '↩ Return book';
        borrowBtn.disabled = false;
      } else if (book.baseOnLoan) {
        borrowBtn.textContent = 'Currently unavailable';
        borrowBtn.disabled = true;
      } else {
        borrowBtn.textContent = 'Borrow this book';
        borrowBtn.disabled = false;
      }
 
      /* favorite button */
      dialogFavBtn.textContent = state.favorites.has(book.id) ? '♥ Saved' : '♡ Save to favorites';
 
      /* status badge */
      const info = statusInfo(book);
      dialogStatus.textContent = info.text;
      dialogStatus.classList.toggle('loan', info.loan);
    }
 
    function openDialog(book) {
      currentBook = book;
      $('#dialogTitle').textContent = book.title;
      $('#dialogAuthor').textContent = 'Author: ' + book.author;
      dialogDescription.textContent = book.description;
      renderDialog();
 
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        alert(book.title + '\n' + book.author + '\n' + book.description);
      }
    }
 
    function closeDialog() {
      if (dialog.open) dialog.close();
    }
 
    $('#closeDialog').addEventListener('click', closeDialog);
 
    dialog.addEventListener('click', function (event) {
      const box = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= box.left && event.clientX <= box.right &&
        event.clientY >= box.top && event.clientY <= box.bottom;
      if (!inside) closeDialog();
    });
 
    dialog.addEventListener('close', function () { currentBook = null; });
 
    borrowBtn.addEventListener('click', function () {
      if (!currentBook) return;
      const book = currentBook;
 
      if (isBorrowed(book)) {
        delete state.borrowed[book.id];
        toast('You returned “' + book.title + '”. Thank you!', '↩');
      } else if (!book.baseOnLoan) {
        const due = new Date();
        due.setDate(due.getDate() + 14);
        state.borrowed[book.id] = due.toISOString();
        toast('Borrowed “' + book.title + '”. Due ' + formatDate(due), '📘');
      }
 
      Store.set('borrowed', state.borrowed);
      renderStatus(book);
      renderDialog();
      updateMeta();
      applyFilters();
    });
 
    dialogFavBtn.addEventListener('click', function () {
      if (currentBook) toggleFavorite(currentBook);
    });
 
    /* =====================================================
       FAVORITES
    ===================================================== */
    function renderFavorite(book) {
      const active = state.favorites.has(book.id);
      book.favBtn.classList.toggle('active', active);
      book.favBtn.textContent = active ? '♥' : '♡';
      book.favBtn.setAttribute('aria-pressed', String(active));
      book.favBtn.setAttribute(
        'aria-label',
        (active ? 'Remove ' : 'Add ') + book.title + (active ? ' from' : ' to') + ' favorites'
      );
    }
 
    function toggleFavorite(book) {
      const nowActive = !state.favorites.has(book.id);
 
      if (nowActive) state.favorites.add(book.id);
      else state.favorites.delete(book.id);
 
      Store.set('favorites', Array.from(state.favorites));
      renderFavorite(book);
 
      if (!reducedMotion) {
        book.favBtn.classList.remove('pop');
        void book.favBtn.offsetWidth;
        book.favBtn.classList.add('pop');
      }
 
      toast(
        nowActive
          ? '“' + book.title + '” saved to favorites'
          : 'Removed “' + book.title + '” from favorites',
        nowActive ? '♥' : '♡'
      );
 
      updateMeta();
      renderDialog();
      if (state.quick === 'favorites') applyFilters();
    }
 
    /* =====================================================
       BOOK CARDS: heart button + click events + status
    ===================================================== */
    books.forEach(function (book) {
      const fav = document.createElement('button');
      fav.type = 'button';
      fav.className = 'lh-fav';
      book.favBtn = fav;
      book.cover.appendChild(fav);
 
      renderFavorite(book);
      renderStatus(book);
 
      fav.addEventListener('click', function (event) {
        event.stopPropagation();
        toggleFavorite(book);
      });
 
      book.cover.addEventListener('click', function (event) {
        if (event.target.closest('.lh-fav')) return;
        openDialog(book);
      });
 
      if (book.detailsBtn) {
        book.detailsBtn.addEventListener('click', function () { openDialog(book); });
      }
    });
 
    /* =====================================================
       FILTERING + SORTING + RENDERING
    ===================================================== */
    const sorters = {
      'default': function (a, b) { return a.index - b.index; },
      'rating': function (a, b) { return b.rating - a.rating || a.title.localeCompare(b.title); },
      'title-asc': function (a, b) { return a.title.localeCompare(b.title); },
      'title-desc': function (a, b) { return b.title.localeCompare(a.title); },
      'author-asc': function (a, b) { return a.author.localeCompare(b.author); }
    };
 
    function matchesQuick(book) {
      switch (state.quick) {
        case 'available': return !isOnLoan(book);
        case 'loan': return isOnLoan(book);
        case 'favorites': return state.favorites.has(book.id);
        case 'borrowed': return isBorrowed(book);
        default: return true;
      }
    }
 
    function matches(book) {
      const text = (book.title + ' ' + book.author + ' ' + book.category).toLowerCase();
      const words = state.query.toLowerCase().split(/\s+/).filter(Boolean);
 
      const okText = words.every(function (word) { return text.includes(word); });
      const okCategory = state.category === 'All' || book.category === state.category;
 
      return okText && okCategory && matchesQuick(book);
    }
 
    function highlight(element, text) {
      const words = state.query.split(/\s+/).filter(Boolean).map(escapeRegExp);
 
      if (!words.length) {
        element.textContent = text;
        return;
      }
 
      const parts = text.split(new RegExp('(' + words.join('|') + ')', 'gi'));
      element.innerHTML = parts.map(function (part, i) {
        return i % 2 ? '<mark class="lh-mark">' + escapeHTML(part) + '</mark>' : escapeHTML(part);
      }).join('');
    }
 
    function emptyMessage() {
      if (state.quick === 'favorites' && !state.favorites.size && !state.query) {
        return 'No favorites yet. Tap the ♡ on any book to save it here.';
      }
      if (state.quick === 'borrowed' && !Object.keys(state.borrowed).length && !state.query) {
        return 'You have not borrowed any books yet. Open a book and press “Borrow this book”.';
      }
      return 'No matching books found. Try another search or category.';
    }
 
    function applyFilters() {
      const sorted = books.slice().sort(sorters[state.sort] || sorters['default']);
      let visible = 0;
 
      sorted.forEach(function (book) {
        grid.appendChild(book.el);
 
        const show = matches(book);
        book.el.hidden = !show;
 
        if (show) {
          visible++;
          highlight(book.titleEl, book.title);
          highlight(book.authorEl, book.author);
        }
      });
 
      countLabel.textContent = 'Showing ' + visible + ' of ' + books.length + ' books';
      emptyState.textContent = emptyMessage();
      emptyState.hidden = visible !== 0;
 
      if (collectionLabel) {
        collectionLabel.textContent =
          state.category === 'All' ? 'Explore the collection ↗' : state.category + ' collection ↗';
      }
 
      const filtersActive =
        state.query || state.category !== 'All' || state.quick !== 'all' || state.sort !== 'default';
      resetBtn.hidden = !filtersActive;
    }
 
    function updateMeta() {
      const counts = {
        all: books.length,
        available: books.filter(function (b) { return !isOnLoan(b); }).length,
        loan: books.filter(isOnLoan).length,
        favorites: state.favorites.size,
        borrowed: Object.keys(state.borrowed).length
      };
 
      chips.forEach(function (chip) {
        $('.lh-chip-count', chip).textContent = counts[chip.dataset.quick];
      });
    }
 
    function setCategory(category) {
      state.category = category;
      categoryButtons.forEach(function (button) {
        const selected = button.dataset.category === category;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
    }
 
    function setQuick(quick) {
      state.quick = quick;
      chips.forEach(function (chip) {
        chip.classList.toggle('active', chip.dataset.quick === quick);
      });
    }
 
    /* ---------- events: search ---------- */
    const onSearch = debounce(function () {
      state.query = searchInput.value.trim();
      applyFilters();
    }, 120);
 
    searchInput.addEventListener('input', function () {
      clearBtn.hidden = !searchInput.value;
      onSearch();
    });
 
    clearBtn.addEventListener('click', function () {
      searchInput.value = '';
      clearBtn.hidden = true;
      state.query = '';
      applyFilters();
      searchInput.focus();
    });
 
    searchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && searchInput.value) {
        event.preventDefault();
        clearBtn.click();
      }
    });
 
    /* ---------- events: categories ---------- */
    categoryButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        setCategory(button.dataset.category);
        applyFilters();
        $('#books').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      });
    });
 
    /* ---------- events: chips, sort, reset, surprise ---------- */
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        setQuick(chip.dataset.quick);
        applyFilters();
      });
    });
 
    sortSelect.addEventListener('change', function () {
      state.sort = sortSelect.value;
      applyFilters();
    });
 
    resetBtn.addEventListener('click', function () {
      state.query = '';
      state.sort = 'default';
      searchInput.value = '';
      clearBtn.hidden = true;
      sortSelect.value = 'default';
      setCategory('All');
      setQuick('all');
      applyFilters();
      toast('Filters cleared', '↺');
    });
 
    surpriseBtn.addEventListener('click', function () {
      const pool = books.filter(function (b) { return !isOnLoan(b); });
      if (!pool.length) {
        toast('All books are on loan right now', 'ℹ');
        return;
      }
      openDialog(pool[Math.floor(Math.random() * pool.length)]);
    });
 
    /* =====================================================
       MOBILE MENU
    ===================================================== */
    function closeMenu() {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰';
    }
 
    menuToggle.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.textContent = isOpen ? '✕' : '☰';
    });
 
    $$('a', navLinks).forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
 
    document.addEventListener('click', function (event) {
      if (navLinks.classList.contains('open') && !event.target.closest('.nav-inner')) closeMenu();
    });
 
    window.addEventListener('resize', debounce(function () {
      if (window.innerWidth > 700) closeMenu();
    }, 150));
 
    /* =====================================================
       SCROLL EFFECTS: progress bar, navbar, spy, back to top
    ===================================================== */
    const progress = document.createElement('div');
    progress.className = 'lh-progress';
    document.body.appendChild(progress);
 
    const topBtn = document.createElement('button');
    topBtn.type = 'button';
    topBtn.className = 'lh-top';
    topBtn.setAttribute('aria-label', 'Back to top');
    topBtn.textContent = '↑';
    document.body.appendChild(topBtn);
 
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
 
    const sections = ['home', 'categories', 'books', 'about']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
 
    function updateScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
 
      progress.style.width = (maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0) + '%';
      navbar.classList.toggle('lh-scrolled', scrollTop > 10);
      topBtn.classList.toggle('show', scrollTop > 600);
 
      /* scroll spy */
      let current = sections.length ? sections[0].id : '';
      sections.forEach(function (section) {
        if (section.offsetTop <= scrollTop + 140) current = section.id;
      });
      if (maxScroll > 0 && scrollTop >= maxScroll - 4 && sections.length) {
        current = sections[sections.length - 1].id;
      }
 
      $$('a', navLinks).forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    }
 
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        updateScroll();
        ticking = false;
      });
    }, { passive: true });
 
    /* =====================================================
       ANIMATED COUNTERS + REVEAL ON SCROLL
    ===================================================== */
    function animateCounter(element) {
      const match = element.textContent.trim().match(/^([\d,]+)(\+?)$/);
      if (!match) return;
 
      const target = parseInt(match[1].replace(/,/g, ''), 10);
      const suffix = match[2];
      const duration = 1400;
      const startTime = performance.now();
 
      function frame(now) {
        const progressValue = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progressValue, 3);
        element.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
        if (progressValue < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
 
    if ('IntersectionObserver' in window && !reducedMotion) {
      /* stats counters */
      const counterObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
 
      $$('.stat strong').forEach(function (el) { counterObserver.observe(el); });
 
      /* reveal animation */
      const revealTargets = $$(
        '.stat, .category, .book-card, .promo-box, .about-art, .about-copy, .footer-top > div'
      );
 
      revealTargets.forEach(function (el) { el.classList.add('lh-pre'); });
 
      const revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
 
          const el = entry.target;
          const siblings = el.parentElement ? Array.from(el.parentElement.children) : [el];
          el.style.animationDelay = Math.min(siblings.indexOf(el), 6) * 70 + 'ms';
          el.classList.remove('lh-pre');
          el.classList.add('lh-in');
 
          el.addEventListener('animationend', function () {
            el.classList.remove('lh-in');
            el.style.animationDelay = '';
          }, { once: true });
 
          observer.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
 
      revealTargets.forEach(function (el) { revealObserver.observe(el); });
    }
 
    /* =====================================================
       TOP STRIP: rotating messages
    ===================================================== */
    const strip = $('.top-strip');
 
    if (strip && !reducedMotion) {
      const messages = [
        strip.textContent.trim(),
        '📚 Browse by category or search by title and author.',
        '🔎 Tip: press “/” to jump straight to search.',
        '💜 Tap the heart on a book to save it to your favorites.'
      ];
      let messageIndex = 0;
 
      setInterval(function () {
        strip.classList.add('lh-fade');
        setTimeout(function () {
          messageIndex = (messageIndex + 1) % messages.length;
          strip.textContent = messages[messageIndex];
          strip.classList.remove('lh-fade');
        }, 350);
      }, 5000);
    }
 
    /* =====================================================
       KEYBOARD SHORTCUTS
    ===================================================== */
    document.addEventListener('keydown', function (event) {
      const tag = (event.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || event.target.isContentEditable;
 
      if ((event.key === '/' && !typing && !dialog.open) ||
          ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        $('#books').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        setTimeout(function () { searchInput.focus(); }, 300);
      }
 
      if (event.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
    });
 
    /* =====================================================
       FINAL SETUP
    ===================================================== */
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
 
    updateMeta();
    applyFilters();
    updateScroll();
  }
 
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
 


