// ============================================================
// LibraVault — Member Portal App
// ============================================================
'use strict';

const MemberApp = {
  uid: null,
  userProfile: null,
  books: [],
  transactions: [],

  init(uid, profile) {
    this.uid = uid;
    this.userProfile = profile;
    this.bindNavigation();
    this.bindSearch();
    this.bindProfileForm();

    // Setup Firestore Listeners
    db.collection('books').onSnapshot(snap => {
      this.books = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
      this.renderDiscover();
    });

    db.collection('transactions').where('memberId', '==', uid).onSnapshot(snap => {
      this.transactions = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
      this.renderMyBooks();
    });

    // Initial Nav
    this.go('discover');
    
    // Fill profile
    document.getElementById('prof-name').value = profile.name || '';
  },

  // ---------- NAVIGATION ----------
  bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.go(el.dataset.page);
      });
    });

    document.getElementById('menu-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
      document.getElementById('main-content').classList.toggle('expanded');
    });
  },

  go(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const page = document.getElementById(`page-${pageId}`);
    const nav = document.getElementById(`nav-${pageId}`);
    
    if (page) page.classList.add('active');
    if (nav) nav.classList.add('active');

    const meta = {
      'discover': { title: 'Discover Books', sub: 'Find your next great read.' },
      'my-books': { title: 'My Borrowed Books', sub: 'Track your current and past reads.' },
      'profile': { title: 'My Profile', sub: 'Manage your personal details.' }
    };

    if (meta[pageId]) {
      document.getElementById('page-title').textContent = meta[pageId].title;
      document.getElementById('page-subtitle').textContent = meta[pageId].sub;
    }
  },

  // ---------- SEARCH ----------
  bindSearch() {
    document.getElementById('discover-search').addEventListener('input', (e) => {
      this.renderDiscover(e.target.value.trim().toLowerCase());
    });
  },

  // ---------- PROFILE ----------
  bindProfileForm() {
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('prof-name').value.trim();
      const phone = document.getElementById('prof-phone').value.trim();
      if (!name) return;
      if (phone && !/^\d{10}$/.test(phone)) {
        this.showToast('Phone number must be exactly 10 digits.');
        return;
      }

      const btn = document.getElementById('prof-save');
      btn.textContent = 'Saving...';
      btn.disabled = true;

      try {
        await db.collection('users').doc(this.uid).update({ name });
        await db.collection('members').doc(this.uid).update({ name, phone });
        document.getElementById('nav-user-name').textContent = name;
        document.getElementById('nav-avatar').textContent = name.charAt(0).toUpperCase();
        
        // Show Toast
        const t = document.createElement('div');
        t.className = 'toast success show';
        t.innerHTML = '<span>Profile updated successfully!</span>';
        document.getElementById('toast-container').appendChild(t);
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
      } catch (err) {
        console.error(err);
      } finally {
        btn.textContent = 'Save Changes';
        btn.disabled = false;
      }
    });
  },

  // ---------- RENDER DISCOVER ----------
  renderDiscover(query = '') {
    const grid = document.getElementById('discover-grid');
    grid.innerHTML = '';

    const filtered = this.books.filter(b => {
      if (!query) return true;
      return b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></div>
        <h3>No books found</h3>
        <p>Try searching for something else.</p>
      </div>`;
      return;
    }

    filtered.forEach(b => {
      const isAvail = b.available > 0;
      const html = `
        <div class="book-card" data-id="${b._id}">
          <div class="book-cover" style="background: ${b.imageUrl ? `url('${b.imageUrl}') center/cover` : this.genreGradient(b.genre)}">
            <span class="book-status-badge ${isAvail ? 'available' : 'borrowed'}">${isAvail ? 'Available' : 'All Borrowed'}</span>
            ${!b.imageUrl ? `<span style="position:relative;z-index:1;display:flex;align-items:center;justify-content:center;width:100%;height:100%"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></span>` : ''}
          </div>
          <div class="book-info">
            <div class="book-title">${b.title}</div>
            <div class="book-author">by ${b.author}</div>
            <div class="book-meta">
              <span class="book-genre-tag">${b.genre}</span>
              <span class="book-year">${b.year}</span>
            </div>
          </div>
        </div>
      `;
      grid.insertAdjacentHTML('beforeend', html);
    });
  },

  // ---------- RENDER MY BOOKS ----------
  renderMyBooks() {
    const tbody = document.getElementById('my-books-table');
    tbody.innerHTML = '';

    if (this.transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 3rem;">You haven't borrowed any books yet.</td></tr>`;
      return;
    }

    // Sort: unreturned first, then by issue date desc
    const sorted = [...this.transactions].sort((a, b) => {
      if (!a.returned && b.returned) return -1;
      if (a.returned && !b.returned) return 1;
      return new Date(b.issued) - new Date(a.issued);
    });

    sorted.forEach(t => {
      const book = this.books.find(b => b.id === t.bookId || b._id === t.bookId);
      const title = book ? book.title : 'Unknown Book';
      
      let statusHtml = '';
      if (t.returned) {
        statusHtml = `<span class="status-badge status-green">Returned</span>`;
      } else {
        const due = new Date(t.due + 'T00:00:00');
        const now = new Date();
        now.setHours(0,0,0,0);
        const diff = Math.floor((now - due) / 86400000);
        if (diff > 0) {
          statusHtml = `<span class="status-badge status-red">Overdue by ${diff} days</span>`;
        } else {
          statusHtml = `<span class="status-badge status-amber">Borrowed</span>`;
        }
      }

      const row = `
        <tr>
          <td>
            <div style="font-weight:500; color:var(--text-primary); margin-bottom:4px;">${title}</div>
          </td>
          <td>${t.issued}</td>
          <td>${t.due}</td>
          <td>${statusHtml}</td>
        </tr>
      `;
      tbody.insertAdjacentHTML('beforeend', row);
    });
  },

  // ---------- BORROW ACTION ----------
  async borrowBook(bookId) {
    const book = this.books.find(b => b._id === bookId);
    if (!book || book.available <= 0) return;

    // Check if member already borrowed this book and hasn't returned it
    const alreadyBorrowed = this.transactions.find(t => (t.bookId === book.id || t.bookId === book._id) && !t.returned);
    if (alreadyBorrowed) {
      this.showToast('You already have an active borrow for this book.');
      return;
    }

    // Enforce max 3 books limit
    const activeBorrows = this.transactions.filter(t => !t.returned).reduce((sum, t) => sum + (t.quantity || 1), 0);
    if (activeBorrows >= 3) {
      this.showToast('You have reached the maximum limit of 3 borrowed books.');
      return;
    }

    try {
      // 1. Create transaction
      const issued = new Date();
      const due = new Date();
      due.setDate(issued.getDate() + 14); // 14 days borrow period
      
      const newTx = {
        id: 'TXN-' + Math.floor(Math.random() * 1000000),
        bookId: book._id,
        memberId: this.uid,
        issued: issued.toISOString().split('T')[0],
        due: due.toISOString().split('T')[0],
        returned: false,
        memberData: {
          name: this.userProfile.name,
          email: this.userProfile.email
        },
        bookData: {
          title: book.title
        },
        quantity: 1
      };
      
      await db.collection('transactions').add(newTx);
      
      // 2. Decrement availability
      await db.collection('books').doc(book._id).update({
        available: firebase.firestore.FieldValue.increment(-1)
      });
      
      // 3. Increment member borrowed count
      await db.collection('members').doc(this.uid).update({
        borrowed: firebase.firestore.FieldValue.increment(1)
      });
      
      this.showToast(`Success! You borrowed "${book.title}".`);
      
    } catch (err) {
      console.error(err);
      this.showToast('Error borrowing book. Please try again.');
    }
  },

  showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast success show';
    t.innerHTML = `<span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
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
  }
};

