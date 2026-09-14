const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = {
  // Books - Fetched directly from MongoDB
  async getBooks(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.featured) query.append('featured', 'true');

    const res = await fetch(`${API_BASE_URL}/books?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to fetch books from database' }));
      throw new Error(err.message || 'Database error');
    }
    return res.json();
  },

  async getBookById(id) {
    const res = await fetch(`${API_BASE_URL}/books/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch book from database');
    return res.json();
  },

  async createBook(data) {
    const res = await fetch(`${API_BASE_URL}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to save book to database');
    return json;
  },

  async updateBook(id, data) {
    const res = await fetch(`${API_BASE_URL}/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update book in database');
    return json;
  },

  async deleteBook(id) {
    const res = await fetch(`${API_BASE_URL}/books/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to delete book from database');
    return json;
  },

  // Borrow & Circulation - Direct MongoDB Transactions
  async requestBorrow({ bookId, userId, userName, userEmail, userPhone, borrowDays = 14 }) {
    const res = await fetch(`${API_BASE_URL}/borrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, userId, userName, userEmail, userPhone, borrowDays }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to submit borrow request');
    return json;
  },

  // Backward compatibility alias
  async borrowBook(params) {
    return this.requestBorrow(params);
  },

  async approveBorrow(borrowId) {
    const res = await fetch(`${API_BASE_URL}/borrow/${borrowId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to approve borrow request');
    return json;
  },

  async rejectBorrow(borrowId, note = '') {
    const res = await fetch(`${API_BASE_URL}/borrow/${borrowId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to decline borrow request');
    return json;
  },

  // Student submits return request to librarian
  async requestReturn(borrowId) {
    const res = await fetch(`${API_BASE_URL}/borrow/request-return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrowId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to submit return request');
    return json;
  },

  // Admin accepts return request and restocks inventory
  async acceptReturn(borrowId) {
    const res = await fetch(`${API_BASE_URL}/borrow/${borrowId}/accept-return`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to accept return');
    return json;
  },

  async returnBook({ borrowId, bookId, userId }) {
    const res = await fetch(`${API_BASE_URL}/borrow/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrowId, bookId, userId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to return book');
    return json;
  },

  async getUserBorrows(userId = 'guest_user', status = '') {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE_URL}/borrow/user/${userId}${query}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch borrowed records from database');
    return res.json();
  },

  async getAllBorrows(status = '') {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE_URL}/borrow/all${query}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch circulation records from database');
    return res.json();
  },

  // Stats directly from MongoDB aggregation / counts
  async getStats() {
    const res = await fetch(`${API_BASE_URL}/stats`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch database statistics');
    return res.json();
  },
};

