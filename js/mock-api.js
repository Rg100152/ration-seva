/* Ration Seva - localStorage demo backend (GitHub Pages mode).
 * Developer: Raj Gautam.
 *
 * Mirrors the core-service REST API so every page works with no server.
 * Activated automatically off localhost; force with ?mock=1 (or force real
 * API with ?mock=0). Never used against the real Express backend.
 */
(function () {
  'use strict';

  const DB_KEY = 'ration_seva_mock_db_v1';
  const PRICE = { Rice: 3, Wheat: 2, Sugar: 10, Kerosene: 20 };
  const BASE_QUOTA = { rice: 5, wheat: 3, sugar: 1, kerosene: 1 };

  function calcQuota(category, familyMembers) {
    const members = Math.max(1, Math.min(20, Number(familyMembers) || 1));
    if (category === 'AAY') {
      return { rice: 35, wheat: 15, sugar: 2, kerosene: 3 };
    }
    return {
      rice: BASE_QUOTA.rice * members,
      wheat: BASE_QUOTA.wheat * members,
      sugar: BASE_QUOTA.sugar * members,
      kerosene: BASE_QUOTA.kerosene * members
    };
  }

  function id(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function monthString(offset) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + (offset || 0));
    return d.toISOString().slice(0, 7);
  }

  function dateInMonth(offset) {
    const d = new Date();
    d.setDate(10);
    d.setMonth(d.getMonth() + (offset || 0));
    return d;
  }

  function itemsFor(quota) {
    return [
      { itemName: 'Rice', quantity: quota.rice, unit: 'kg', price: PRICE.Rice },
      { itemName: 'Wheat', quantity: quota.wheat, unit: 'kg', price: PRICE.Wheat },
      { itemName: 'Sugar', quantity: quota.sugar, unit: 'kg', price: PRICE.Sugar },
      { itemName: 'Kerosene', quantity: quota.kerosene, unit: 'L', price: PRICE.Kerosene }
    ];
  }

  function totalOf(items) {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  function seed() {
    const now = new Date().toISOString();
    const quotaBpl = calcQuota('BPL', 4);
    const quotaAay = calcQuota('AAY', 6);

    const users = [
      {
        _id: 'u_admin', id: 'u_admin',
        name: 'Raj Gautam', aadhaar: '333333333333', password: 'admin1234',
        role: 'admin', phone: '9876543212',
        address: 'Government Office, New Delhi', familyMembers: 1,
        category: 'APL', createdAt: now
      },
      {
        _id: 'u_shop', id: 'u_shop',
        name: 'Shop Demo', aadhaar: '222222222222', password: 'demo1234',
        role: 'shopkeeper', phone: '9876543211',
        address: 'Fair Price Shop 12, Market Road', familyMembers: 1,
        category: 'APL', createdAt: now
      },
      {
        _id: 'u_beneficiary', id: 'u_beneficiary',
        name: 'Raj Gautam', aadhaar: '111111111111', password: 'demo1234',
        role: 'beneficiary', phone: '9876543210',
        address: '123 Main Street, Delhi', familyMembers: 4,
        category: 'BPL', createdAt: now
      },
      {
        _id: 'u_aay', id: 'u_aay',
        name: 'Sunita Devi', aadhaar: '444444444444', password: 'demo1234',
        role: 'beneficiary', phone: '9876543213',
        address: 'Village Rampur, Uttar Pradesh', familyMembers: 6,
        category: 'AAY', createdAt: now
      }
    ];

    const cards = [
      {
        _id: 'c_card1', cardNumber: 'RC-2026-RG-4829', userId: 'u_beneficiary',
        category: 'BPL', monthlyQuota: quotaBpl,
        issuedDate: dateInMonth(-6).toISOString(), isActive: true
      },
      {
        _id: 'c_card2', cardNumber: 'RC-2026-RG-7712', userId: 'u_aay',
        category: 'AAY', monthlyQuota: quotaAay,
        issuedDate: dateInMonth(-4).toISOString(), isActive: true
      }
    ];

    const distributions = [];
    [-1, -2, -3].forEach(function (offset) {
      const items = itemsFor(quotaBpl);
      distributions.push({
        _id: id('d'), cardNumber: 'RC-2026-RG-4829', shopkeeperId: 'u_shop',
        items: items, totalAmount: totalOf(items), month: monthString(offset),
        status: 'completed', fraudScore: 0.06, fraudFlag: false,
        distributedAt: dateInMonth(offset).toISOString()
      });
    });

    const flagged = itemsFor(quotaBpl);
    distributions.push({
      _id: id('d'), cardNumber: 'RC-2026-RG-4829', shopkeeperId: 'u_shop',
      items: flagged, totalAmount: totalOf(flagged), month: monthString(-4),
      status: 'completed', fraudScore: 0.82, fraudFlag: true,
      distributedAt: dateInMonth(-4).toISOString()
    });

    const aayItems = itemsFor(quotaAay);
    distributions.push({
      _id: id('d'), cardNumber: 'RC-2026-RG-7712', shopkeeperId: 'u_shop',
      items: aayItems, totalAmount: totalOf(aayItems), month: monthString(-1),
      status: 'completed', fraudScore: 0.11, fraudFlag: false,
      distributedAt: dateInMonth(-1).toISOString()
    });

    return { users: users, cards: cards, distributions: distributions };
  }

  function loadDb() {
    let raw = null;
    try {
      raw = localStorage.getItem(DB_KEY);
    } catch (e) {
      raw = null;
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) return parsed;
      } catch (e) {
        /* fall through to reseed */
      }
    }
    const fresh = seed();
    saveDb(fresh);
    return fresh;
  }

  function saveDb(db) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      /* storage might be unavailable (private mode); operate in memory */
    }
  }

  function fail(message, status) {
    const err = new Error(message);
    err.status = status || 400;
    throw err;
  }

  function safeUser(user) {
    if (!user) return null;
    return {
      _id: user._id,
      id: user.id || user._id,
      name: user.name,
      aadhaar: user.aadhaar,
      role: user.role,
      phone: user.phone,
      address: user.address,
      familyMembers: user.familyMembers,
      category: user.category,
      createdAt: user.createdAt
    };
  }

  function findUser(db, userId) {
    return db.users.find(function (u) { return u._id === userId || u.id === userId; });
  }

  function findCard(db, cardNumber) {
    return db.cards.find(function (c) { return c.cardNumber === cardNumber; });
  }

  function currentMonth() {
    return new Date().toISOString().slice(0, 7);
  }

  function populateCard(db, card) {
    const owner = findUser(db, card.userId);
    return Object.assign({}, card, {
      userId: owner
        ? {
            _id: owner._id,
            id: owner.id,
            name: owner.name,
            phone: owner.phone,
            familyMembers: owner.familyMembers,
            address: owner.address,
            category: owner.category
          }
        : null
    });
  }

  function handle(db, method, endpoint, body) {
    let m;

    if (method === 'POST' && endpoint === '/auth/login') {
      const aadhaar = (body.aadhaar || '').toString().trim();
      const password = (body.password || '').toString();
      if (!aadhaar || !password) fail('Aadhaar and password are required');
      const user = db.users.find(function (u) { return u.aadhaar === aadhaar; });
      if (!user) fail('User not found');
      if (user.password !== password) fail('Invalid password');
      return { token: 'mock.' + user._id + '.' + Date.now(), user: safeUser(user) };
    }

    if (method === 'POST' && endpoint === '/auth/register') {
      const name = (body.name || '').toString().trim();
      const aadhaar = (body.aadhaar || '').toString().trim();
      const password = (body.password || '').toString();
      const role = body.role || 'beneficiary';
      if (!name || !aadhaar || !password) fail('Name, Aadhaar and password are required');
      if (!/^\d{12}$/.test(aadhaar)) fail('Aadhaar must be 12 digits');
      if (password.length < 8) fail('Password must be at least 8 characters');
      if (['beneficiary', 'shopkeeper'].indexOf(role) === -1) fail('Invalid role');
      if (db.users.some(function (u) { return u.aadhaar === aadhaar; })) {
        fail('Aadhaar already registered');
      }

      const userId = id('u');
      const user = {
        _id: userId,
        id: userId,
        name: name,
        aadhaar: aadhaar,
        password: password,
        role: role,
        phone: (body.phone || '').toString(),
        address: (body.address || '').toString(),
        familyMembers: Math.max(1, Math.min(20, Number(body.familyMembers) || 1)),
        category: body.category || 'BPL',
        createdAt: new Date().toISOString()
      };
      db.users.push(user);

      if (role === 'beneficiary') {
        let cardNumber;
        do {
          cardNumber = 'RC-' + new Date().getFullYear() + '-RG-' + Math.floor(1000 + Math.random() * 9000);
        } while (findCard(db, cardNumber));
        db.cards.push({
          _id: id('c'),
          cardNumber: cardNumber,
          userId: userId,
          category: user.category,
          monthlyQuota: calcQuota(user.category, user.familyMembers),
          issuedDate: new Date().toISOString(),
          isActive: true
        });
      }

      saveDb(db);
      return { msg: 'Registration successful' };
    }

    if (method === 'GET' && (m = endpoint.match(/^\/beneficiary\/my-card\/([^/]+)$/))) {
      const userId = decodeURIComponent(m[1]);
      const card = db.cards.find(function (c) { return c.userId === userId; });
      if (!card) fail('Ration card not found', 404);
      return card;
    }

    if (method === 'GET' && (m = endpoint.match(/^\/beneficiary\/history\/([^/]+)$/))) {
      const cardNumber = decodeURIComponent(m[1]);
      return db.distributions
        .filter(function (d) { return d.cardNumber === cardNumber; })
        .sort(function (a, b) { return new Date(b.distributedAt) - new Date(a.distributedAt); });
    }

    if (method === 'GET' && (m = endpoint.match(/^\/shopkeeper\/check-card\/([^/]+)$/))) {
      const cardNumber = decodeURIComponent(m[1]);
      const card = findCard(db, cardNumber);
      if (!card) fail('Invalid card number', 404);
      if (!card.isActive) fail('Card is inactive');
      const already = db.distributions.some(function (d) {
        return d.cardNumber === cardNumber && d.month === currentMonth();
      });
      return { card: populateCard(db, card), alreadyDistributed: already };
    }

    if (method === 'POST' && endpoint === '/shopkeeper/distribute') {
      const cardNumber = body.cardNumber;
      const items = body.items;
      if (!cardNumber || !Array.isArray(items) || items.length === 0) {
        fail('cardNumber and items are required');
      }
      const card = findCard(db, cardNumber);
      if (!card) fail('Invalid card number', 404);
      if (!card.isActive) fail('Card is inactive');
      const month = currentMonth();
      if (db.distributions.some(function (d) { return d.cardNumber === cardNumber && d.month === month; })) {
        fail('Already distributed this month');
      }

      const normalized = items.map(function (i) {
        return {
          itemName: i.itemName,
          quantity: Number(i.quantity) || 0,
          unit: i.unit || 'kg',
          price: Number(i.price) || PRICE[i.itemName] || 0
        };
      });
      const totalAmount = normalized.reduce(function (sum, i) {
        return sum + i.price * i.quantity;
      }, 0);
      const fraudScore = Math.round(Math.random() * 20) / 100;
      const receipt = {
        _id: id('d'),
        cardNumber: cardNumber,
        shopkeeperId: (body.shopkeeperId || 'u_shop'),
        items: normalized,
        totalAmount: totalAmount,
        month: month,
        status: 'completed',
        fraudScore: fraudScore,
        fraudFlag: fraudScore > 0.7,
        distributedAt: new Date().toISOString()
      };
      db.distributions.push(receipt);
      saveDb(db);
      return {
        msg: 'Ration distributed successfully',
        receipt: receipt,
        fraudAlert: fraudScore > 0.7 ? 'High fraud risk detected. Flagged for review.' : null
      };
    }

    if (method === 'GET' && (m = endpoint.match(/^\/shopkeeper\/distributions\/([^/]+)$/))) {
      const shopkeeperId = decodeURIComponent(m[1]);
      return db.distributions
        .filter(function (d) { return d.shopkeeperId === shopkeeperId; })
        .sort(function (a, b) { return new Date(b.distributedAt) - new Date(a.distributedAt); })
        .slice(0, 50);
    }

    if (method === 'GET' && endpoint === '/admin/stats') {
      const month = currentMonth();
      return {
        totalUsers: db.users.filter(function (u) { return u.role === 'beneficiary'; }).length,
        totalShops: db.users.filter(function (u) { return u.role === 'shopkeeper'; }).length,
        totalCards: db.cards.filter(function (c) { return c.isActive; }).length,
        monthDistributions: db.distributions.filter(function (d) { return d.month === month; }).length,
        fraudCount: db.distributions.filter(function (d) { return d.fraudFlag; }).length
      };
    }

    if (method === 'GET' && endpoint === '/admin/users') {
      return db.users
        .filter(function (u) { return u.role === 'beneficiary'; })
        .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
        .map(safeUser);
    }

    if (method === 'GET' && endpoint === '/admin/cards') {
      return db.cards
        .slice()
        .sort(function (a, b) { return new Date(b.issuedDate) - new Date(a.issuedDate); })
        .map(function (c) { return populateCard(db, c); });
    }

    if (method === 'PUT' && (m = endpoint.match(/^\/admin\/card\/([^/]+)\/toggle$/))) {
      const cardId = decodeURIComponent(m[1]);
      const card = db.cards.find(function (c) { return c._id === cardId; });
      if (!card) fail('Card not found', 404);
      card.isActive = !card.isActive;
      saveDb(db);
      return { msg: 'Card status updated', isActive: card.isActive };
    }

    if (method === 'GET' && endpoint === '/admin/fraud') {
      return db.distributions
        .filter(function (d) { return d.fraudFlag; })
        .sort(function (a, b) { return new Date(b.distributedAt) - new Date(a.distributedAt); })
        .slice(0, 100);
    }

    if (method === 'GET' && endpoint === '/admin/reports') {
      const byMonthMap = {};
      db.distributions.forEach(function (d) {
        if (!byMonthMap[d.month]) {
          byMonthMap[d.month] = { _id: d.month, distributions: 0, amount: 0, units: 0 };
        }
        const row = byMonthMap[d.month];
        row.distributions += 1;
        row.amount += d.totalAmount;
        row.units += (d.items || []).reduce(function (s, i) { return s + i.quantity; }, 0);
      });
      const byMonth = Object.keys(byMonthMap)
        .sort()
        .map(function (k) { return byMonthMap[k]; });

      const byCatMap = {};
      db.cards.forEach(function (c) {
        byCatMap[c.category] = (byCatMap[c.category] || 0) + 1;
      });
      const byCategory = Object.keys(byCatMap).map(function (k) {
        return { _id: k, count: byCatMap[k] };
      });

      return { byMonth: byMonth, byCategory: byCategory };
    }

    if (method === 'PUT' && (m = endpoint.match(/^\/profile\/([^/]+)\/password$/))) {
      const userId = decodeURIComponent(m[1]);
      const user = findUser(db, userId);
      if (!user) fail('User not found', 404);
      const newPassword = (body.newPassword || '').toString();
      if (!newPassword || newPassword.length < 8) {
        fail('New password must be at least 8 characters');
      }
      if (body.currentPassword && body.currentPassword !== user.password) {
        fail('Current password is incorrect');
      }
      user.password = newPassword;
      saveDb(db);
      return { msg: 'Password updated' };
    }

    if (method === 'PUT' && (m = endpoint.match(/^\/profile\/([^/]+)$/))) {
      const userId = decodeURIComponent(m[1]);
      const user = findUser(db, userId);
      if (!user) fail('User not found', 404);
      ['name', 'phone', 'address', 'familyMembers', 'category'].forEach(function (key) {
        if (body[key] !== undefined) user[key] = body[key];
      });
      saveDb(db);
      return { msg: 'Profile updated', user: safeUser(user) };
    }

    if (method === 'GET' && (m = endpoint.match(/^\/profile\/([^/]+)$/))) {
      const userId = decodeURIComponent(m[1]);
      const user = findUser(db, userId);
      if (!user) fail('User not found', 404);
      return safeUser(user);
    }

    fail('Unknown endpoint: ' + method + ' ' + endpoint, 404);
  }

  function smartApiCall(endpoint, options) {
    const opts = options || {};
    const method = (opts.method || 'GET').toUpperCase();
    let body = opts.body;
    if (typeof body === 'string') {
      try {
        body = body ? JSON.parse(body) : {};
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try {
          const db = loadDb();
          const result = handle(db, method, endpoint, body);
          resolve(JSON.parse(JSON.stringify(result)));
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      }, 120);
    });
  }

  window.MockAPI = {
    reset: function () {
      const fresh = seed();
      saveDb(fresh);
      return fresh;
    },
    seed: seed
  };
  window.smartApiCall = smartApiCall;

  console.log(
    '%c\uD83C\uDFAD Mock API Active %c localStorage demo \u00B7 by Raj Gautam ',
    'background:#1E40AF;color:#fff;padding:6px 12px;border-radius:6px 0 0 6px;font-weight:bold',
    'background:#10B981;color:#fff;padding:6px 12px;border-radius:0 6px 6px 0'
  );
})();
