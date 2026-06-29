/* ============================================================
   LibraVault — Library Management System
   JavaScript Application
   ============================================================ */

'use strict';

// ============================================================
// DATA STORE (Firestore backed)
// ============================================================
const Store = {
  books: [],
  members: [],
  transactions: [],
  activities: [],
  
  // Start realtime listeners
  initSync(onDataLoaded) {
    let bLoaded = false, mLoaded = false, tLoaded = false;
    let initialLoadFired = false;
    const checkReady = () => { 
      if (bLoaded && mLoaded && tLoaded && !initialLoadFired) {
        initialLoadFired = true;
        if (onDataLoaded) onDataLoaded(); 
      }
    };

    db.collection('books').onSnapshot(snap => {
      this.books = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
      bLoaded = true; checkReady();
      if (bLoaded && mLoaded && tLoaded) { App.renderBooks(); App.renderDashboard(); App.renderBorrow(); }
    });

    db.collection('members').onSnapshot(snap => {
      this.members = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
      mLoaded = true; checkReady();
      if (bLoaded && mLoaded && tLoaded) { App.renderMembers(); App.renderDashboard(); App.renderBorrow(); }
    });

    db.collection('transactions').onSnapshot(snap => {
      this.transactions = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
      tLoaded = true; checkReady();
      if (bLoaded && mLoaded && tLoaded) { App.renderDashboard(); App.renderBorrow(); }
    });
    
    db.collection('activities').orderBy('time', 'desc').limit(30).onSnapshot(snap => {
      this.activities = snap.docs.map(d => d.data());
      if (bLoaded && mLoaded && tLoaded) { App.renderDashboard(); }
    });
  }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const uid = () => Math.random().toString(36).slice(2, 10);

const today = () => new Date().toISOString().split('T')[0];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysOverdue = (dueDateStr) => {
  const due = new Date(dueDateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now - due) / 86400000);
  return diff > 0 ? diff : 0;
};

const defaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
};

const avatarInitials = (name) => {
  if (!name) return '??';
  return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

const bookSvg = () => `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;

const GENRE_COLORS = [
  '#6c63ff','#a855f7','#06b6d4','#22c55e','#f59e0b',
  '#ef4444','#ec4899','#14b8a6','#f97316','#8b5cf6'
];

const timeAgo = (isoStr) => {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const addActivity = (type, text) => {
  db.collection('activities').add({ type, text, time: new Date().toISOString() }).catch(()=>{});
};

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
const Toast = {
  show(msg, type = 'info', duration = 3500) {
    const icons = {
      success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `${icons[type] || icons.info}<span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    requestAnimationFrame(() => { setTimeout(() => el.classList.add('show'), 10); });
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    }, duration);
  }
};

// ============================================================
// MODAL
// ============================================================
const Modal = {
  open(title, bodyHTML) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-overlay').classList.add('active');
  },
  close() {
    document.getElementById('modal-overlay').classList.remove('active');
  }
};

// ============================================================
// NAVIGATION
// ============================================================
const Nav = {
  current: 'dashboard',

  pageMeta: {
    dashboard: { title: 'Dashboard', sub: "Welcome back! Here's your library overview." },
    books: { title: 'Books Collection', sub: 'Manage your entire book inventory.' },
    members: { title: 'Members', sub: 'View and manage library members.' },
    borrow: { title: 'Borrow & Return', sub: 'Issue and return books quickly.' },
    analytics: { title: 'Analytics', sub: 'Insights and statistics about your library.' },
    overdue: { title: 'Overdue Books', sub: 'Track overdue books and fines.' },
  },

  go(page) {
    if (!this.pageMeta[page]) return;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    // Update topbar
    const meta = this.pageMeta[page];
    document.getElementById('page-title').textContent = meta.title;
    document.getElementById('page-subtitle').textContent = meta.sub;

    this.current = page;

    // Page-specific refresh
    if (page === 'dashboard') App.renderDashboard();
    if (page === 'books') App.renderBooks();
    if (page === 'members') App.renderMembers();
    if (page === 'borrow') App.renderBorrow();
    if (page === 'analytics') App.renderAnalytics();
    if (page === 'overdue') App.renderOverdue();
  }
};

// ============================================================
// MAIN APP
// ============================================================
const App = {

  // ---------- INIT ----------
  init() {
    Store.initSync(() => {
      this.bindSidebar();
      this.bindSearch();
      this.bindModal();
      this.bindBookEvents();
      this.bindMemberEvents();
      this.bindBorrowEvents();
      Nav.go('dashboard');
      this.updateNotifBadge();
    });
  },

  // ---------- SEED DATA ----------
  async seedData() {

    Toast.show('Seeding database with sample books...', 'info');
    const btn = document.querySelector('button[onclick="App.seedData()"]');
    if (btn) btn.disabled = true;

    try {
      const books = [
        // Fiction
        { title: 'Madol Doova', author: 'Martin Wickramasinghe', genre: 'Fiction', year: '1947', isbn: '978-955-0000-00-1', copies: 5, available: 5, imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&q=80' }, // Book cover style
        { title: 'Chinaman', author: 'Shehan Karunatilaka', genre: 'Fiction', year: '2010', isbn: '978-955-0000-00-2', copies: 3, available: 3, imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80' },
        { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Fiction', year: '1925', isbn: '9780743273565', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg' },
        { title: '1984', author: 'George Orwell', genre: 'Fiction', year: '1949', isbn: '9780451524935', copies: 4, available: 4, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg' },
        { title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', year: '1960', isbn: '9780060935467', copies: 2, available: 2, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780060935467-L.jpg' },
        
        // Non-Fiction
        { title: 'The Village in the Jungle', author: 'Leonard Woolf', genre: 'Non-Fiction', year: '1913', isbn: '978-955-0000-00-3', copies: 2, available: 2, imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80' },
        { title: 'Sapiens: A Brief History', author: 'Yuval Noah Harari', genre: 'Non-Fiction', year: '2011', isbn: '9780062316097', copies: 5, available: 5, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg' },
        { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'Non-Fiction', year: '2011', isbn: '9780374275631', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780374275631-L.jpg' },
        { title: 'Educated', author: 'Tara Westover', genre: 'Non-Fiction', year: '2018', isbn: '9780399590504', copies: 2, available: 2, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg' },
        { title: 'Outliers', author: 'Malcolm Gladwell', genre: 'Non-Fiction', year: '2008', isbn: '9780316017923', copies: 4, available: 4, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780316017923-L.jpg' },

        // Science
        { title: 'Birds of Sri Lanka', author: 'Gehan de Silva', genre: 'Science', year: '2001', isbn: '978-955-0000-00-4', copies: 2, available: 2, imageUrl: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=600&q=80' },
        { title: 'A Brief History of Time', author: 'Stephen Hawking', genre: 'Science', year: '1988', isbn: '9780553380163', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg' },
        { title: 'Cosmos', author: 'Carl Sagan', genre: 'Science', year: '1980', isbn: '9780394502946', copies: 2, available: 2, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780394502946-L.jpg' },
        { title: 'The Selfish Gene', author: 'Richard Dawkins', genre: 'Science', year: '1976', isbn: '9780192860927', copies: 1, available: 1, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780192860927-L.jpg' },
        { title: 'Astrophysics for People', author: 'Neil deGrasse Tyson', genre: 'Science', year: '2017', isbn: '9780393609394', copies: 4, available: 4, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780393609394-L.jpg' },

        // Technology
        { title: 'IT in Sri Lanka', author: 'V.K. Samaranayake', genre: 'Technology', year: '2005', isbn: '978-955-0000-00-5', copies: 2, available: 2, imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80' },
        { title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', genre: 'Technology', year: '1999', isbn: '9780201616224', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780201616224-L.jpg' },
        { title: 'Clean Code', author: 'Robert C. Martin', genre: 'Technology', year: '2008', isbn: '9780132350884', copies: 4, available: 4, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg' },
        { title: 'Design Patterns', author: 'GoF', genre: 'Technology', year: '1994', isbn: '9780201633610', copies: 2, available: 2, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780201633610-L.jpg' },
        { title: 'The Phoenix Project', author: 'Gene Kim', genre: 'Technology', year: '2013', isbn: '9780988262508', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780988262508-L.jpg' },

        // History
        { title: 'A History of Sri Lanka', author: 'K.M. de Silva', genre: 'History', year: '1981', isbn: '978-955-0000-00-6', copies: 3, available: 3, imageUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&q=80' },
        { title: 'The Mahavamsa', author: 'Mahanama', genre: 'History', year: '500', isbn: '978-955-0000-00-7', copies: 2, available: 2, imageUrl: 'https://images.unsplash.com/photo-1447014421976-7fec21d26d86?w=600&q=80' },
        { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', genre: 'History', year: '1997', isbn: '9780393038910', copies: 4, available: 4, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780393038910-L.jpg' },
        { title: 'A People\'s History', author: 'Howard Zinn', genre: 'History', year: '1980', isbn: '9780060194482', copies: 2, available: 2, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780060194482-L.jpg' },
        { title: 'The Silk Roads', author: 'Peter Frankopan', genre: 'History', year: '2015', isbn: '9781101946329', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9781101946329-L.jpg' },

        // Biography
        { title: 'Running in the Family', author: 'Michael Ondaatje', genre: 'Biography', year: '1982', isbn: '978-955-0000-00-8', copies: 4, available: 4, imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead27d8?w=600&q=80' },
        { title: 'Steve Jobs', author: 'Walter Isaacson', genre: 'Biography', year: '2011', isbn: '9781451655922', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9781451655922-L.jpg' },
        { title: 'Becoming', author: 'Michelle Obama', genre: 'Biography', year: '2018', isbn: '9781524763138', copies: 5, available: 5, imageUrl: 'https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg' },
        { title: 'The Diary of a Young Girl', author: 'Anne Frank', genre: 'Biography', year: '1947', isbn: '9780553296983', copies: 2, available: 2, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780553296983-L.jpg' },
        { title: 'Long Walk to Freedom', author: 'Nelson Mandela', genre: 'Biography', year: '1994', isbn: '9780316548182', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780316548182-L.jpg' },

        // Mystery
        { title: 'The Seven Moons', author: 'Shehan Karunatilaka', genre: 'Mystery', year: '2022', isbn: '978-955-0000-00-9', copies: 5, available: 5, imageUrl: 'https://images.unsplash.com/photo-1587876800778-654dbdbb0d0f?w=600&q=80' },
        { title: 'The Da Vinci Code', author: 'Dan Brown', genre: 'Mystery', year: '2003', isbn: '9780385504205', copies: 4, available: 4, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780385504205-L.jpg' },
        { title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Mystery', year: '2012', isbn: '9780307588364', copies: 2, available: 2, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780307588364-L.jpg' },
        { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', genre: 'Mystery', year: '2005', isbn: '9780307269751', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780307269751-L.jpg' },
        { title: 'And Then There Were None', author: 'Agatha Christie', genre: 'Mystery', year: '1939', isbn: '9780312330873', copies: 2, available: 2, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780312330873-L.jpg' },

        // Romance
        { title: 'The Jam Fruit Tree', author: 'Carl Muller', genre: 'Romance', year: '1993', isbn: '978-955-0000-01-0', copies: 3, available: 3, imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80' },
        { title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Romance', year: '1813', isbn: '9780141439518', copies: 4, available: 4, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg' },
        { title: 'The Notebook', author: 'Nicholas Sparks', genre: 'Romance', year: '1996', isbn: '9780446520805', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780446520805-L.jpg' },
        { title: 'Outlander', author: 'Diana Gabaldon', genre: 'Romance', year: '1991', isbn: '9780440212560', copies: 2, available: 2, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780440212560-L.jpg' },
        { title: 'Me Before You', author: 'Jojo Moyes', genre: 'Romance', year: '2012', isbn: '9780670026609', copies: 4, available: 4, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780670026609-L.jpg' },

        // Fantasy
        { title: 'Yakada Yaka', author: 'Carl Muller', genre: 'Fantasy', year: '1994', isbn: '978-955-0000-01-1', copies: 2, available: 2, imageUrl: 'https://images.unsplash.com/photo-1629196914522-824c965e99f6?w=600&q=80' },
        { title: 'Dune', author: 'Frank Herbert', genre: 'Fantasy', year: '1965', isbn: '9780441017947', copies: 5, available: 5, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780441017947-L.jpg' },
        { title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', year: '1937', isbn: '9780547928227', copies: 4, available: 4, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg' },
        { title: 'Harry Potter', author: 'J.K. Rowling', genre: 'Fantasy', year: '1997', isbn: '9780747532699', copies: 6, available: 6, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780747532699-L.jpg' },
        { title: 'A Game of Thrones', author: 'George R.R. Martin', genre: 'Fantasy', year: '1996', isbn: '9780553103540', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780553103540-L.jpg' },

        // Self-Help
        { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', year: '2018', isbn: '9780735213707', copies: 5, available: 5, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780735213707-L.jpg' },
        { title: 'The Power of Now', author: 'Eckhart Tolle', genre: 'Self-Help', year: '1997', isbn: '9781577311522', copies: 2, available: 2, imageUrl: 'https://covers.openlibrary.org/b/isbn/9781577311522-L.jpg' },
        { title: 'How to Win Friends', author: 'Dale Carnegie', genre: 'Self-Help', year: '1936', isbn: '9780671027032', copies: 4, available: 4, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780671027032-L.jpg' },
        { title: 'The Subtle Art', author: 'Mark Manson', genre: 'Self-Help', year: '2016', isbn: '9780062457714', copies: 3, available: 3, imageUrl: 'https://covers.openlibrary.org/b/isbn/9780062457714-L.jpg' },
        { title: 'Mindset', author: 'Carol S. Dweck', genre: 'Self-Help', year: '2006', isbn: '9781400062751', copies: 2, available: 2, imageUrl: 'https://covers.openlibrary.org/b/isbn/9781400062751-L.jpg' },
      ];

      const batch = db.batch();
      books.forEach(b => {
        const ref = db.collection('books').doc();
        batch.set(ref, { ...b, added: new Date().toISOString() });
      });

      await batch.commit();
      Toast.show('Sample books added successfully!', 'success');
      addActivity('add', 'Library system initialized with 10 sample books');
    } catch (err) {
      console.error(err);
      Toast.show('Error seeding data', 'error');
    }
  },

  // ---------- SIDEBAR ----------
  bindSidebar() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        Nav.go(el.dataset.page);
      });
    });

    document.getElementById('menu-toggle').addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const main = document.getElementById('main-content');
      sidebar.classList.toggle('collapsed');
      main.classList.toggle('expanded');
    });
  },

  // ---------- SEARCH ----------
  bindSearch() {
    const input = document.getElementById('global-search');
    let wrapper = null;

    input.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      this.closeSearchDrop(wrapper);

      if (q.length < 2) return;

      const results = [];
      Store.books.forEach(b => {
        if (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) {
          results.push({ type: 'book', title: b.title, sub: b.author, page: 'books' });
        }
      });
      Store.members.forEach(m => {
        if (m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) {
          results.push({ type: 'member', title: m.name, sub: m.email, page: 'members' });
        }
      });

      if (results.length === 0) return;

      const searchBar = input.closest('.search-bar');
      if (!searchBar.parentElement.classList.contains('search-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'search-wrap';
        searchBar.parentNode.insertBefore(wrap, searchBar);
        wrap.appendChild(searchBar);
        wrapper = wrap;
      } else {
        wrapper = searchBar.parentElement;
      }

      const drop = document.createElement('div');
      drop.className = 'search-results-dropdown';
      drop.id = 'search-drop';

      const bookIcon = `<svg class="search-result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
      const memberIcon = `<svg class="search-result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>`;

      results.slice(0, 6).forEach(r => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `${r.type === 'book' ? bookIcon : memberIcon}<div><div class="search-result-title">${r.title}</div><div class="search-result-sub">${r.sub}</div></div>`;
        item.addEventListener('click', () => {
          Nav.go(r.page);
          input.value = '';
          this.closeSearchDrop(wrapper);
        });
        drop.appendChild(item);
      });

      const existing = document.getElementById('search-drop');
      if (existing) existing.remove();
      (wrapper || document.querySelector('.search-bar').parentElement).appendChild(drop);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrap') && !e.target.closest('.search-bar')) {
        this.closeSearchDrop(wrapper);
        wrapper = null;
      }
    });
  },

  closeSearchDrop(wrapper) {
    const drop = document.getElementById('search-drop');
    if (drop) drop.remove();
  },

  // ---------- MODAL ----------
  bindModal() {
    document.getElementById('modal-close').addEventListener('click', Modal.close);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) Modal.close();
    });
  },

  updateNotifBadge() {
    const overdue = Store.transactions.filter(t => !t.returned && daysOverdue(t.due) > 0).length;
    const badge = document.getElementById('notif-count');
    badge.textContent = overdue;
    badge.classList.toggle('visible', overdue > 0);
  },

  // ===========================================================
  // DASHBOARD
  // ===========================================================
  renderDashboard() {
    const books = Store.books;
    const members = Store.members;
    const txns = Store.transactions;
    const active = txns.filter(t => !t.returned);
    const overdue = active.filter(t => daysOverdue(t.due) > 0);

    // Stats
    this.animateCount('stat-total-books', books.length);
    this.animateCount('stat-total-members', members.filter(m => m.status === 'active').length);
    this.animateCount('stat-borrowed', active.length);
    this.animateCount('stat-overdue', overdue.length);

    const overdueLabel = document.getElementById('overdue-label');
    if (overdue.length > 0) {
      overdueLabel.textContent = `${overdue.length} need${overdue.length > 1 ? '' : 's'} attention`;
      overdueLabel.className = 'stat-change negative';
    } else {
      overdueLabel.textContent = 'All on time!';
      overdueLabel.className = 'stat-change positive';
    }

    // Activity
    this.renderActivity();

    // Genre chart
    this.renderGenreChart();

    // Popular books
    this.renderPopularBooks();
  },

  animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const duration = 600;
    const startTime = performance.now();
    el.classList.add('counting');
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (target - start) * ease);
      if (progress < 1) requestAnimationFrame(step);
      else el.classList.remove('counting');
    };
    requestAnimationFrame(step);
  },

  renderActivity() {
    const list = document.getElementById('activity-list');
    const acts = Store.activities;
    if (acts.length === 0) {
      list.innerHTML = `<div class="empty-state small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg><p>No recent activity yet</p></div>`;
      return;
    }
    list.innerHTML = acts.slice(0, 8).map(a => `
      <div class="activity-item">
        <div class="activity-dot ${a.type}"></div>
        <div>
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${timeAgo(a.time)}</div>
        </div>
      </div>
    `).join('');
  },

  renderGenreChart() {
    const chart = document.getElementById('genre-chart');
    const books = Store.books;
    if (books.length === 0) {
      chart.innerHTML = `<div class="empty-state small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/></svg><p>Add books to see genre stats</p></div>`;
      return;
    }

    const counts = {};
    books.forEach(b => { counts[b.genre] = (counts[b.genre] || 0) + b.copies; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1;

    chart.innerHTML = sorted.map(([genre, count]) => `
      <div class="genre-bar-item">
        <span class="genre-label">${genre}</span>
        <div class="genre-bar-track">
          <div class="genre-bar-fill" style="width:${(count / max) * 100}%"></div>
        </div>
        <span class="genre-count">${count}</span>
      </div>
    `).join('');
  },

  renderPopularBooks() {
    const list = document.getElementById('popular-list');
    const txns = Store.transactions;
    const books = Store.books;

    // Count borrows per book
    const counts = {};
    txns.forEach(t => { counts[t.bookId] = (counts[t.bookId] || 0) + 1; });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([bookId, borrows]) => {
        const book = books.find(b => b.id === bookId);
        return book ? { ...book, borrows } : null;
      })
      .filter(Boolean);

    if (sorted.length === 0) {
      list.innerHTML = `<div class="empty-state small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><p>Borrow books to track popularity</p></div>`;
      return;
    }

    const rankClasses = ['gold', 'silver', 'bronze'];
    list.innerHTML = sorted.map((b, i) => `
      <div class="popular-item">
        <span class="popular-rank ${rankClasses[i] || ''}">${i + 1}</span>
        <div class="popular-info">
          <div class="popular-title">${b.title}</div>
          <div class="popular-author">${b.author}</div>
        </div>
        <span class="popular-borrows">${b.borrows}×</span>
      </div>
    `).join('');
  },

  // ===========================================================
  // BOOKS
  // ===========================================================
  bindBookEvents() {
    document.getElementById('add-book-btn').addEventListener('click', () => this.openAddBook());
    document.getElementById('book-genre-filter').addEventListener('change', () => this.renderBooks());
    document.getElementById('book-status-filter').addEventListener('change', () => this.renderBooks());
  },

  renderBooks() {
    const grid = document.getElementById('books-grid');
    let books = Store.books;
    const genreF = document.getElementById('book-genre-filter').value;
    const statusF = document.getElementById('book-status-filter').value;

    if (genreF) books = books.filter(b => b.genre === genreF);
    if (statusF === 'available') books = books.filter(b => b.available > 0);
    if (statusF === 'borrowed') books = books.filter(b => b.available === 0);

    if (books.length === 0) {
      grid.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg><h3>No Books Found</h3><p>Try adjusting your filters or add a new book.</p></div>`;
      return;
    }

    grid.innerHTML = books.map(b => {
      const status = b.available > 0 ? 'available' : 'borrowed';
      const statusLabel = b.available > 0 ? `${b.available} Available` : 'All Borrowed';
      return `
        <div class="book-card" data-id="${b._id}">
          <div class="book-cover" style="background: ${b.imageUrl ? `url('${b.imageUrl}') center/cover` : this.genreGradient(b.genre)}">
            <span class="book-status-badge ${status}">${statusLabel}</span>
            ${!b.imageUrl ? `<span style="position:relative;z-index:1;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${bookSvg()}</span>` : ''}
          </div>
          <div class="book-info">
            <div class="book-title">${b.title}</div>
            <div class="book-author">by ${b.author}</div>
            <div class="book-meta">
              <span class="book-genre-tag">${b.genre}</span>
              <span class="book-year">${b.year}</span>
            </div>
          </div>
          <div class="book-actions">
            <button class="btn btn-secondary btn-sm" onclick="App.openEditBook('${b._id}')">Edit</button>
            <button class="btn btn-danger btn-sm" style="background:var(--red-bg);color:var(--red);border-color:transparent;" onclick="App.deleteBook('${b._id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  },



  genreGradient(genre) {
    const map = {
      Fiction: 'linear-gradient(135deg,#1a1040,#2d1b69)',
      'Non-Fiction': 'linear-gradient(135deg,#0f2027,#203a43)',
      Science: 'linear-gradient(135deg,#0d1b2a,#1b4332)',
      Technology: 'linear-gradient(135deg,#0a0f1e,#1e3a5f)',
      History: 'linear-gradient(135deg,#2d1515,#4a1942)',
      Biography: 'linear-gradient(135deg,#1a1a2e,#16213e)',
      Mystery: 'linear-gradient(135deg,#0d0d0d,#1a0033)',
      Romance: 'linear-gradient(135deg,#1f0011,#3d0030)',
      Fantasy: 'linear-gradient(135deg,#0f0c29,#302b63)',
      'Self-Help': 'linear-gradient(135deg,#1a2a0a,#2d4a1b)',
    };
    return map[genre] || 'linear-gradient(135deg,#1a1a2e,#16213e)';
  },

  openAddBook() {
    Modal.open('Add New Book', `
      <div class="modal-form">
        <div class="form-group">
          <label for="m-title">Book Title *</label>
          <input id="m-title" class="form-control" type="text" placeholder="Enter book title" />
        </div>
        <div class="form-group">
          <label for="m-author">Author *</label>
          <input id="m-author" class="form-control" type="text" placeholder="Enter author name" />
        </div>
        <div class="form-group">
          <label for="m-imageurl">Cover Image URL</label>
          <input id="m-imageurl" class="form-control" type="text" placeholder="https://..." />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="m-genre">Genre *</label>
            <select id="m-genre" class="form-control">
              <option value="">Select genre</option>
              ${['Fiction','Non-Fiction','Science','Technology','History','Biography','Mystery','Romance','Fantasy','Self-Help'].map(g => `<option value="${g}">${g}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="m-year">Year</label>
            <input id="m-year" class="form-control" type="number" placeholder="2024" min="1000" max="2099" value="${new Date().getFullYear()}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="m-isbn">ISBN</label>
            <input id="m-isbn" class="form-control" type="text" placeholder="978-..." />
          </div>
          <div class="form-group">
            <label for="m-copies">Copies</label>
            <input id="m-copies" class="form-control" type="number" min="1" max="99" value="1" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
          <button class="btn btn-primary" id="m-save-book">Add Book</button>
        </div>
      </div>
    `);

    document.getElementById('m-save-book').addEventListener('click', async () => {
      const title = document.getElementById('m-title').value.trim();
      const author = document.getElementById('m-author').value.trim();
      const genre = document.getElementById('m-genre').value;
      const year = document.getElementById('m-year').value;
      const isbn = document.getElementById('m-isbn').value.trim();
      const copies = parseInt(document.getElementById('m-copies').value) || 1;
      const imageUrl = document.getElementById('m-imageurl').value.trim();

      if (!title || !author || !genre) { Toast.show('Please fill all required fields.', 'error'); return; }

      const book = { title, author, genre, year, isbn, copies, available: copies, imageUrl };
      
      db.collection('books').add(book).then(() => {
        addActivity('add', `New book <strong>${title}</strong> added to collection`);
        Modal.close();
        Toast.show(`"${title}" added successfully!`, 'success');
      }).catch(err => {
        console.error(err);
        Toast.show('Failed to add book', 'error');
      });
    });
  },

  openEditBook(id) {
    const books = Store.books;
    const b = books.find(x => x._id === id);
    if (!b) return;

    Modal.open('Edit Book', `
      <div class="modal-form">
        <div class="form-group">
          <label>Book Title *</label>
          <input id="e-title" class="form-control" type="text" value="${b.title}" />
        </div>
        <div class="form-group">
          <label>Author *</label>
          <input id="e-author" class="form-control" type="text" value="${b.author}" />
        </div>
        <div class="form-group">
          <label>Cover Image URL</label>
          <input id="e-imageurl" class="form-control" type="text" value="${b.imageUrl || ''}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="m-genre">Genre *</label>
            <select id="m-genre" class="form-control">
              ${['Fiction','Non-Fiction','Science','Technology','History','Biography','Mystery','Romance','Fantasy','Self-Help'].map(g => `<option value="${g}" ${b.genre === g ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="m-year">Year</label>
            <input id="m-year" class="form-control" type="number" value="${b.year}" min="1000" max="2099" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="m-isbn">ISBN</label>
            <input id="m-isbn" class="form-control" type="text" value="${b.isbn || ''}" />
          </div>
          <div class="form-group">
            <label for="m-copies">Total Copies</label>
            <input id="m-copies" class="form-control" type="number" min="${b.copies - b.available}" max="99" value="${b.copies}" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
          <button class="btn btn-primary" id="m-save-book">Save Changes</button>
        </div>
      </div>
    `);

    document.getElementById('m-save-book').addEventListener('click', () => {
      const title = document.getElementById('e-title').value.trim();
      const author = document.getElementById('e-author').value.trim();
      const imageUrl = document.getElementById('e-imageurl').value.trim();
      const genre = document.getElementById('m-genre').value;
      const year = document.getElementById('m-year').value;
      const isbn = document.getElementById('m-isbn').value.trim();
      const newCopies = parseInt(document.getElementById('m-copies').value) || b.copies;
      const borrowed = b.copies - b.available;
      const newAvailable = Math.max(0, newCopies - borrowed);

      if (!title || !author || !genre) { Toast.show('Please fill all required fields.', 'error'); return; }
      if (newCopies < borrowed) { Toast.show(`Cannot reduce below ${borrowed} copies — books currently borrowed.`, 'error'); return; }

      db.collection('books').doc(id).update({
        title, author, genre, year, isbn, copies: newCopies, available: newAvailable, imageUrl
      }).then(() => {
        addActivity('add', `Book <strong>${title}</strong> details updated`);
        Modal.close();
        Toast.show(`"${title}" updated!`, 'success');
      }).catch(err => {
        console.error(err);
        Toast.show('Failed to update book', 'error');
      });
    });
  },

  deleteBook(id) {
    const books = Store.books;
    const b = books.find(x => x._id === id);
    if (!b) return;

    // Check if currently borrowed
    const activeTxn = Store.transactions.find(t => t.bookId === id && !t.returned);
    if (activeTxn) { Toast.show('Cannot delete — this book has active borrows!', 'error'); return; }

    Modal.open('Delete Book', `
      <div style="text-align:center; padding: 12px 0">
        <div style="font-size:3rem; margin-bottom:16px">🗑️</div>
        <h3 style="color:var(--text-primary); margin-bottom:8px">Delete "${b.title}"?</h3>
        <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:24px">This action cannot be undone.</p>
        <div style="display:flex; gap:12px; justify-content:center">
          <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
          <button class="btn btn-danger" id="m-confirm-delete">Yes, Delete</button>
        </div>
      </div>
    `);

    document.getElementById('m-confirm-delete').addEventListener('click', () => {
      db.collection('books').doc(id).delete().then(() => {
        addActivity('add', `Book <strong>${b.title}</strong> removed from collection`);
        Modal.close();
        Toast.show(`"${b.title}" deleted.`, 'warning');
      }).catch(err => {
        console.error(err);
        Toast.show('Failed to delete book', 'error');
      });
    });
  },

  // ===========================================================
  // MEMBERS
  // ===========================================================
  bindMemberEvents() {
    document.getElementById('add-member-btn').addEventListener('click', () => this.openAddMember());
    document.getElementById('member-status-filter').addEventListener('change', () => this.renderMembers());
  },

  renderMembers() {
    const grid = document.getElementById('members-grid');
    let members = Store.members;
    const statusF = document.getElementById('member-status-filter').value;
    if (statusF) members = members.filter(m => m.status === statusF);

    if (members.length === 0) {
      grid.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><h3>No Members Found</h3><p>Try adjusting filters or register a new member.</p></div>`;
      return;
    }

    grid.innerHTML = members.map(m => `
      <div class="member-card" data-id="${m.id}">
        <div class="member-avatar-large">${avatarInitials(m.name)}</div>
        <div class="member-name">${m.name}</div>
        <div class="member-email">${m.email}</div>
        <div class="member-stats">
          <div class="member-stat">
            <div class="member-stat-value">${m.borrowed}</div>
            <div class="member-stat-label">Active</div>
          </div>
          <div class="member-stat">
            <div class="member-stat-value">${m.total}</div>
            <div class="member-stat-label">Total</div>
          </div>
        </div>
        <span class="member-status-badge ${m.status}">${m.status}</span>
        <div class="member-actions">
          <button class="btn btn-secondary btn-sm" onclick="App.openEditMember('${m._id || m.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="App.deleteMember('${m._id || m.id}')">Remove</button>
        </div>
      </div>
    `).join('');
  },

  openAddMember() {
    Modal.open('Register New Member', `
      <div class="modal-form">
        <div class="form-group">
          <label for="m-name">Full Name *</label>
          <input id="m-name" class="form-control" type="text" placeholder="Enter member's full name" />
        </div>
        <div class="form-group">
          <label for="m-email">Email Address *</label>
          <input id="m-email" class="form-control" type="email" placeholder="member@email.com" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="m-phone">Phone Number</label>
            <input id="m-phone" class="form-control" type="tel" placeholder="9876543210" maxlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);" />
          </div>
          <div class="form-group">
            <label for="m-status">Status</label>
            <select id="m-status" class="form-control">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
          <button class="btn btn-primary" id="m-save-member">Register Member</button>
        </div>
      </div>
    `);

    document.getElementById('m-save-member').addEventListener('click', () => {
      const name = document.getElementById('m-name').value.trim();
      const email = document.getElementById('m-email').value.trim();
      const phone = document.getElementById('m-phone').value.trim();
      const status = document.getElementById('m-status').value;

      if (!name || !email) { Toast.show('Name and email are required.', 'error'); return; }
      if (!email.includes('@')) { Toast.show('Please enter a valid email.', 'error'); return; }
      if (phone && !/^\d{10}$/.test(phone)) { Toast.show('Phone number must be exactly 10 digits.', 'error'); return; }
      if (Store.members.find(m => m.email === email)) { Toast.show('Member with this email already exists.', 'error'); return; }

      const newId = uid();
      const member = { id: newId, name, email, phone, joined: today(), status, borrowed: 0, total: 0 };
      
      db.collection('members').doc(newId).set(member).then(() => {
        addActivity('member', `New member <strong>${name}</strong> registered`);
        Modal.close();
        Toast.show(`${name} registered successfully!`, 'success');
      }).catch(err => Toast.show('Error saving member', 'error'));
    });
  },

  openEditMember(id) {
    const members = Store.members;
    const m = members.find(x => x._id === id || x.id === id);
    if (!m) return;

    Modal.open('Edit Member', `
      <div class="modal-form">
        <div class="form-group">
          <label for="m-name">Full Name *</label>
          <input id="m-name" class="form-control" type="text" value="${m.name}" />
        </div>
        <div class="form-group">
          <label for="m-email">Email Address *</label>
          <input id="m-email" class="form-control" type="email" value="${m.email}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="m-phone">Phone Number</label>
            <input id="m-phone" class="form-control" type="tel" value="${m.phone || ''}" maxlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);" />
          </div>
          <div class="form-group">
            <label for="m-status">Status</label>
            <select id="m-status" class="form-control">
              <option value="active" ${m.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${m.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
          <button class="btn btn-primary" id="m-save-member">Save Changes</button>
        </div>
      </div>
    `);

    document.getElementById('m-save-member').addEventListener('click', () => {
      const name = document.getElementById('m-name').value.trim();
      const email = document.getElementById('m-email').value.trim();
      const phone = document.getElementById('m-phone').value.trim();
      const status = document.getElementById('m-status').value;

      if (!name || !email) { Toast.show('Name and email are required.', 'error'); return; }
      if (phone && !/^\d{10}$/.test(phone)) { Toast.show('Phone number must be exactly 10 digits.', 'error'); return; }
      const dup = members.find(x => x.email === email && x.id !== id);
      if (dup) { Toast.show('Another member with this email exists.', 'error'); return; }

      const updateData = { name, email, phone, status };
      db.collection('members').doc(id).update(updateData).then(() => {
        addActivity('member', `Member <strong>${name}</strong> profile updated`);
        Modal.close();
        Toast.show(`${name} updated!`, 'success');
      }).catch(err => Toast.show('Error updating member', 'error'));
    });
  },

  deleteMember(id) {
    const members = Store.members;
    const m = members.find(x => x._id === id || x.id === id);
    if (!m) return;
    if (m.borrowed > 0) { Toast.show('Cannot remove member with active borrowed books!', 'error'); return; }

    Modal.open('Remove Member', `
      <div style="text-align:center; padding: 12px 0">
        <div style="font-size:3rem; margin-bottom:16px">👤</div>
        <h3 style="color:var(--text-primary); margin-bottom:8px">Remove "${m.name}"?</h3>
        <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:24px">Their borrowing history will also be cleared.</p>
        <div style="display:flex; gap:12px; justify-content:center">
          <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
          <button class="btn btn-danger" id="m-confirm-delete">Yes, Remove</button>
        </div>
      </div>
    `);

    document.getElementById('m-confirm-delete').addEventListener('click', () => {
      db.collection('members').doc(id).delete().then(() => {
        addActivity('member', `Member <strong>${m.name}</strong> removed`);
        Modal.close();
        Toast.show(`${m.name} removed.`, 'warning');
      }).catch(err => Toast.show('Error removing member', 'error'));
    });
  },

  // ===========================================================
  // BORROW / RETURN
  // ===========================================================
  bindBorrowEvents() {
    document.getElementById('borrow-due-date').value = defaultDueDate();

    document.getElementById('issue-btn').addEventListener('click', () => {
      const memberVal = document.getElementById('borrow-member-input').value;
      const bookVal = document.getElementById('borrow-book-input').value;
      const due = document.getElementById('borrow-due-date').value;
      const qty = parseInt(document.getElementById('borrow-quantity').value) || 1;

      if (!memberVal) { Toast.show('Please select a member.', 'error'); return; }
      if (!bookVal) { Toast.show('Please select a book.', 'error'); return; }

      const member = Store.members.find(m => `${m.name} (${m.email})` === memberVal);
      const book = Store.books.find(b => `${b.title} (${b.available} avail.)` === bookVal);

      if (!member) { Toast.show('Invalid member selected.', 'error'); return; }
      if (!book) { Toast.show('Invalid book selected.', 'error'); return; }

      const memberId = member._id || member.id;
      const bookId = book._id || book.id;

      if (!due) { Toast.show('Please set a due date.', 'error'); return; }
      if (due <= today()) { Toast.show('Due date must be in the future.', 'warning'); return; }
      if (qty < 1 || qty > 3) { Toast.show('You can only issue between 1 and 3 copies.', 'error'); return; }

      if (book.available < qty) { Toast.show(`Only ${book.available} copies available!`, 'error'); return; }
      if ((member.borrowed || 0) + qty > 3) { Toast.show(`Member limit reached. Can only borrow ${Math.max(0, 3 - (member.borrowed || 0))} more.`, 'error'); return; }

      const txn = { bookId, memberId, issued: today(), due, returned: null, quantity: qty };
      
      db.collection('transactions').add(txn).then(() => {
        db.collection('books').doc(bookId).update({ available: firebase.firestore.FieldValue.increment(-qty) });
        db.collection('members').doc(member._id).update({ borrowed: firebase.firestore.FieldValue.increment(qty), total: firebase.firestore.FieldValue.increment(qty) });
        
        addActivity('borrow', `<strong>${member.name}</strong> borrowed ${qty > 1 ? qty + ' copies of ' : ''}<strong>${book.title}</strong>`);
        Toast.show(`"${book.title}" (${qty}) issued to ${member.name}!`, 'success');

        document.getElementById('borrow-member-input').value = '';
        document.getElementById('borrow-book-input').value = '';
        document.getElementById('borrow-due-date').value = defaultDueDate();
        document.getElementById('borrow-quantity').value = '1';
      }).catch(err => Toast.show('Error issuing book', 'error'));

      // Reset form
      document.getElementById('borrow-member-input').value = '';
      document.getElementById('borrow-book-input').value = '';
      document.getElementById('borrow-due-date').value = defaultDueDate();

      this.refreshBorrowSelects();
      this.renderTransactions();
      this.updateNotifBadge();
    });
  },

  renderBorrow() {
    this.refreshBorrowSelects();
    this.renderTransactions();
  },

  refreshBorrowSelects() {
    const memberOptions = document.getElementById('member-options');
    const bookOptions = document.getElementById('book-options');
    if (!memberOptions || !bookOptions) return;

    const members = Store.members.filter(m => m.status === 'active');
    const books = Store.books.filter(b => b.available > 0);

    memberOptions.innerHTML = members.map(m => `<option value="${m.name} (${m.email})"></option>`).join('');
    bookOptions.innerHTML = books.map(b => `<option value="${b.title} (${b.available} avail.)"></option>`).join('');
  },

  renderTransactions() {
    const list = document.getElementById('transactions-list');
    const txns = Store.transactions.filter(t => !t.returned);
    document.getElementById('tx-count').textContent = txns.length;

    if (txns.length === 0) {
      list.innerHTML = `<div class="empty-state small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>No active transactions</p></div>`;
      return;
    }

    const books = Store.books;
    const members = Store.members;

    list.innerHTML = txns.map(t => {
      const book = books.find(b => b._id === t.bookId);
      const member = members.find(m => m._id === t.memberId || m.id === t.memberId);
      const overdue = daysOverdue(t.due) > 0;
      return `
        <div class="transaction-item ${overdue ? 'overdue' : ''}">
          <div>
            <div class="tx-book-title">${book?.title || 'Unknown Book'} ${t.quantity && t.quantity > 1 ? `<span style="font-size:0.8rem;color:var(--brand-primary);">(x${t.quantity})</span>` : ''}</div>
            <div class="tx-member">👤 ${member?.name || 'Unknown Member'}</div>
            <div class="tx-due ${overdue ? 'overdue-date' : ''}">
              ${overdue ? '⚠️ Overdue since' : '📅 Due:'} ${formatDate(t.due)}
            </div>
          </div>
          <div class="tx-actions">
            <button class="btn btn-success btn-sm" onclick="App.returnBook('${t._id}')">Return</button>
          </div>
        </div>
      `;
    }).join('');
  },

  returnBook(txnId) {
    const t = Store.transactions.find(x => x._id === txnId);
    if (!t) return;

    const book = Store.books.find(b => b._id === t.bookId);
    const member = Store.members.find(m => m._id === t.memberId || m.id === t.memberId);

    const od = daysOverdue(t.due);
    const fine = od > 0 ? od * 5 : 0;
    const qty = t.quantity || 1;

    db.collection('transactions').doc(txnId).update({ returned: today() }).then(() => {
      db.collection('books').doc(t.bookId).update({ available: firebase.firestore.FieldValue.increment(qty) });
      db.collection('members').doc(member._id).update({ borrowed: firebase.firestore.FieldValue.increment(-qty) });

      addActivity('return', `<strong>${member?.name || 'Member'}</strong> returned ${qty > 1 ? qty + ' copies of ' : ''}<strong>${book?.title || 'Book'}</strong>${fine > 0 ? ` (Fine: ₹${fine})` : ''}`);
      Toast.show(`"${book?.title}" returned!${fine > 0 ? ` Fine: ₹${fine}` : ''}`, fine > 0 ? 'warning' : 'success');
    }).catch(err => Toast.show('Error returning book', 'error'));

    this.renderTransactions();
    this.refreshBorrowSelects();
    this.updateNotifBadge();
    if (Nav.current === 'overdue') this.renderOverdue();
    if (Nav.current === 'dashboard') this.renderDashboard();
  },

  // ===========================================================
  // ANALYTICS
  // ===========================================================
  renderAnalytics() {
    const books = Store.books;
    const members = Store.members;
    const txns = Store.transactions;
    const active = txns.filter(t => !t.returned);
    const totalCopies = books.reduce((s, b) => s + b.copies, 0);
    const availableCopies = books.reduce((s, b) => s + b.available, 0);

    // Overview Bars
    const bars = document.getElementById('overview-bars');
    const overview = [
      { label: 'Total Books', value: books.length, max: Math.max(books.length, 1), color: '#6c63ff' },
      { label: 'Active Members', value: members.filter(m => m.status === 'active').length, max: Math.max(members.length, 1), color: '#06b6d4' },
      { label: 'Books Borrowed', value: active.length, max: Math.max(totalCopies, 1), color: '#a855f7' },
      { label: 'Available Copies', value: availableCopies, max: Math.max(totalCopies, 1), color: '#22c55e' },
      { label: 'Total Transactions', value: txns.length, max: Math.max(txns.length, 1), color: '#f59e0b' },
    ];

    bars.innerHTML = overview.map(o => `
      <div class="overview-bar-item">
        <div class="overview-bar-label">
          <span>${o.label}</span>
          <span>${o.value}</span>
        </div>
        <div class="overview-track">
          <div class="overview-fill" style="width:${(o.value / o.max) * 100}%; background:${o.color}"></div>
        </div>
      </div>
    `).join('');

    // Donut Chart
    this.drawDonut();

    // Bar Chart
    this.drawBarChart();
  },

  drawDonut() {
    const canvas = document.getElementById('donut-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const books = Store.books;

    const counts = {};
    books.forEach(b => { counts[b.genre] = (counts[b.genre] || 0) + b.copies; });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);

    ctx.clearRect(0, 0, 220, 220);

    if (total === 0) {
      ctx.fillStyle = '#1c1c35';
      ctx.beginPath();
      ctx.arc(110, 110, 90, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    let startAngle = -Math.PI / 2;
    const cx = 110, cy = 110, outerR = 95, innerR = 58;

    entries.forEach(([, val], i) => {
      const slice = (val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = GENRE_COLORS[i % GENRE_COLORS.length];
      ctx.fill();
      startAngle += slice;
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#16162a';
    ctx.fill();

    // Center text
    ctx.fillStyle = '#f0eeff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 8);
    ctx.fillStyle = '#9b9ab0';
    ctx.font = '11px Outfit, sans-serif';
    ctx.fillText('copies', cx, cy + 12);

    // Legend
    const legend = document.getElementById('donut-legend');
    legend.innerHTML = entries.map(([genre, val], i) => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${GENRE_COLORS[i % GENRE_COLORS.length]}"></div>
        <span class="legend-name">${genre}</span>
        <span class="legend-val">${val}</span>
      </div>
    `).join('');
  },

  drawBarChart() {
    const canvas = document.getElementById('bar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const txns = Store.transactions;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const counts = days.map(day => ({
      label: new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }),
      borrows: txns.filter(t => t.issued === day).length,
      returns: txns.filter(t => t.returned === day).length,
    }));

    const W = canvas.width = canvas.parentElement.offsetWidth - 48 || 600;
    const H = 200;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(...counts.map(c => Math.max(c.borrows, c.returns)), 1);
    const padL = 30, padR = 20, padTop = 20, padBot = 40;
    const chartW = W - padL - padR;
    const chartH = H - padTop - padBot;
    const barW = (chartW / days.length) * 0.3;
    const gap = (chartW / days.length);

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (chartH / 4) * (4 - i);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();

      ctx.fillStyle = '#5a597a';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round((maxVal / 4) * i), padL - 4, y + 4);
    }

    counts.forEach((c, i) => {
      const x = padL + gap * i + gap / 2;

      // Borrows bar
      const bH = (c.borrows / maxVal) * chartH;
      const grad1 = ctx.createLinearGradient(0, padTop + chartH - bH, 0, padTop + chartH);
      grad1.addColorStop(0, '#6c63ff');
      grad1.addColorStop(1, 'rgba(108,99,255,0.3)');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.roundRect(x - barW - 2, padTop + chartH - bH, barW, bH, [4, 4, 0, 0]);
      ctx.fill();

      // Returns bar
      const rH = (c.returns / maxVal) * chartH;
      const grad2 = ctx.createLinearGradient(0, padTop + chartH - rH, 0, padTop + chartH);
      grad2.addColorStop(0, '#22c55e');
      grad2.addColorStop(1, 'rgba(34,197,94,0.3)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.roundRect(x + 2, padTop + chartH - rH, barW, rH, [4, 4, 0, 0]);
      ctx.fill();

      // Day label
      ctx.fillStyle = '#9b9ab0';
      ctx.font = '11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, x, padTop + chartH + 16);
    });

    // Legend
    const lx = W - padR - 160;
    const ly = padTop;
    ctx.fillStyle = '#6c63ff';
    ctx.fillRect(lx, ly, 12, 12);
    ctx.fillStyle = '#9b9ab0';
    ctx.font = '11px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Borrows', lx + 18, ly + 9);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(lx + 80, ly, 12, 12);
    ctx.fillStyle = '#9b9ab0';
    ctx.fillText('Returns', lx + 98, ly + 9);
  },

  // ===========================================================
  // OVERDUE
  // ===========================================================
  renderOverdue() {
    const txns = Store.transactions.filter(t => !t.returned);
    const overdue = txns.filter(t => daysOverdue(t.due) > 0);
    const books = Store.books;
    const members = Store.members;

    const alert = document.getElementById('overdue-alert');
    const label = document.getElementById('overdue-count-label');
    const tbody = document.getElementById('overdue-tbody');
    const empty = document.getElementById('overdue-empty');
    const table = document.getElementById('overdue-table');

    if (overdue.length === 0) {
      label.textContent = 'All books are returned on time. Great job! 🎉';
      alert.className = 'overdue-alert ok';
      alert.querySelector('svg').innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
      table.style.display = 'none';
      empty.style.display = 'flex';
      this.updateNotifBadge();
      return;
    }

    label.textContent = `${overdue.length} book${overdue.length > 1 ? 's are' : ' is'} overdue and need${overdue.length === 1 ? 's' : ''} attention.`;
    alert.className = 'overdue-alert';
    alert.querySelector('svg').innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
    table.style.display = 'table';
    empty.style.display = 'none';

    tbody.innerHTML = overdue.map(t => {
      const book = books.find(b => b.id === t.bookId);
      const member = members.find(m => m.id === t.memberId);
      const od = daysOverdue(t.due);
      const fine = od * 5;
      return `
        <tr>
          <td>${book?.title || 'Unknown'}</td>
          <td>${member?.name || 'Unknown'}</td>
          <td>${formatDate(t.due)}</td>
          <td><span class="days-badge">+${od} days</span></td>
          <td><span class="fine-badge">₹${fine}</span></td>
          <td>
            <button class="btn btn-success btn-sm" onclick="App.returnBook('${t.id}')">Return</button>
          </td>
        </tr>
      `;
    }).join('');

    this.updateNotifBadge();
  },
};

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => App.init());
