/* Ration Seva - navigation + footer injection. Developer: Raj Gautam.
 * The same file works from index.html (site root) and /pages/*.html thanks to
 * the BASE / PAGE_PREFIX values provided by app.js.
 */
(function () {
  'use strict';

  const paths = window.RATION_PATHS || {
    IS_IN_PAGES: window.location.pathname.indexOf('/pages/') !== -1,
    BASE: window.location.pathname.indexOf('/pages/') !== -1 ? '../' : './',
    PAGE_PREFIX: window.location.pathname.indexOf('/pages/') !== -1 ? '' : 'pages/'
  };
  const BASE = paths.BASE;
  const PAGE_PREFIX = paths.PAGE_PREFIX;

  const NAV_LINKS = {
    public: [
      { href: BASE + 'index.html', label: 'Home' },
      { href: PAGE_PREFIX + 'about.html', label: 'About' },
      { href: PAGE_PREFIX + 'help.html', label: 'Help' },
      { href: PAGE_PREFIX + 'contact.html', label: 'Contact' }
    ],
    beneficiary: [
      { href: PAGE_PREFIX + 'beneficiary-dashboard.html', label: 'Dashboard' },
      { href: PAGE_PREFIX + 'my-card.html', label: 'My Card' },
      { href: PAGE_PREFIX + 'history.html', label: 'History' },
      { href: PAGE_PREFIX + 'profile.html', label: 'Profile' }
    ],
    shopkeeper: [
      { href: PAGE_PREFIX + 'shopkeeper-dashboard.html', label: 'Dashboard' },
      { href: PAGE_PREFIX + 'check-card.html', label: 'Check Card' },
      { href: PAGE_PREFIX + 'distribute.html', label: 'Distribute' },
      { href: PAGE_PREFIX + 'shop-history.html', label: 'History' }
    ],
    admin: [
      { href: PAGE_PREFIX + 'admin-dashboard.html', label: 'Dashboard' },
      { href: PAGE_PREFIX + 'users.html', label: 'Users' },
      { href: PAGE_PREFIX + 'cards.html', label: 'Cards' },
      { href: PAGE_PREFIX + 'reports.html', label: 'Reports' }
    ]
  };

  function activeFor(href) {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    const target = href.split('/').pop().split('?')[0];
    return target === current ? 'active' : '';
  }

  function renderNavbar() {
    const container = document.getElementById('navbar');
    if (!container) return;

    const user = getCurrentUser();
    const links = user ? NAV_LINKS[user.role] || NAV_LINKS.public : NAV_LINKS.public;

    const navHtml = links
      .map((l) => `<a href="${l.href}" class="${activeFor(l.href)}">${l.label}</a>`)
      .join('');

    const userSection = user
      ? `<div class="user-menu">
           <a href="${PAGE_PREFIX}profile.html" title="${escapeHtml(user.name)}" style="text-decoration:none">
             <div class="avatar">${initials(user.name)}</div>
           </a>
           <button onclick="logout()" class="btn-logout">Logout</button>
         </div>`
      : `<a href="${PAGE_PREFIX}login.html" class="btn btn-primary btn-sm">Login</a>`;

    container.innerHTML = `
      <nav class="navbar">
        <a href="${user ? PAGE_PREFIX + 'dashboard.html' : BASE + 'index.html'}" class="nav-brand">
          Ration Seva <span class="dev-badge">by Raj Gautam</span>
        </a>
        <div class="nav-links">${navHtml}</div>
        ${userSection}
      </nav>
    `;
  }

  function renderFooter() {
    const container = document.getElementById('footer');
    if (!container) return;

    container.innerHTML = `
      <footer class="footer">
        <div class="footer-inner">
          <div>
            <div class="footer-brand">\uD83C\uDF3E Ration Seva</div>
            <p style="font-size:13px;line-height:1.65;max-width:320px">
              India's digital Public Distribution System. Transparent, secure and accessible to every ration card holder.
            </p>
          </div>
          <div class="footer-col">
            <h4>Platform</h4>
            <a href="${BASE}index.html">Home</a>
            <a href="${PAGE_PREFIX}about.html">About</a>
            <a href="${PAGE_PREFIX}help.html">Help Center</a>
            <a href="${PAGE_PREFIX}contact.html">Contact</a>
          </div>
          <div class="footer-col">
            <h4>Legal</h4>
            <a href="${PAGE_PREFIX}privacy.html">Privacy Policy</a>
            <a href="${PAGE_PREFIX}terms.html">Terms of Service</a>
            <a href="${PAGE_PREFIX}help.html#faq">FAQ</a>
          </div>
          <div class="footer-col">
            <h4>Account</h4>
            <a href="${PAGE_PREFIX}login.html">Login</a>
            <a href="${PAGE_PREFIX}register.html">Register</a>
            <a href="${PAGE_PREFIX}profile.html">Profile</a>
            <a href="${PAGE_PREFIX}settings.html">Settings</a>
          </div>
        </div>
        <div class="footer-bottom">
          \u00A9 2026 <strong>Ration Seva</strong> \u00B7 Developed with \u2764\uFE0F by <strong>Raj Gautam</strong>
        </div>
      </footer>
    `;
  }

  window.renderNavbar = renderNavbar;
  window.renderFooter = renderFooter;

  console.log(
    '%c\uD83C\uDF3E Ration Seva %c v1.0 ',
    'background:#1E40AF;color:#fff;padding:6px 12px;border-radius:6px 0 0 6px;font-weight:bold',
    'background:#F59E0B;color:#fff;padding:6px 12px;border-radius:0 6px 6px 0'
  );
  console.log('%c\uD83D\uDC68\u200D\uD83D\uDCBB by Raj Gautam', 'color:#1E40AF;font-weight:bold;font-size:12px');

  document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
    renderFooter();
  });
})();
