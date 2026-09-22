const OMNI_CONTACT = {
  whatsapp: "260776833956",
  phone: "+260776833956",
  email: "info@omniminerals.co.zm",
  facebook: "",
  instagram: ""
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.querySelector('.site-header');
const progress = document.querySelector('.scroll-progress');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const launcher = document.querySelector('.contact-launcher');
const launcherButton = document.querySelector('.launcher-button');

if (!reducedMotion) document.body.classList.add('motion-ready');

function updateScrollEffects() {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 24);
  if (progress) {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--progress', `${scrollable ? (window.scrollY / scrollable) * 100 : 0}%`);
  }
}
updateScrollEffects();
window.addEventListener('scroll', () => requestAnimationFrame(updateScrollEffects), { passive: true });

function closeMenu() {
  if (!nav || !menuButton) return;
  nav.classList.remove('open');
  header?.classList.remove('menu-active');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  document.body.classList.remove('menu-open');
}

function toggleMenu() {
  if (!nav || !menuButton) return;
  const isOpen = !nav.classList.contains('open');
  nav.classList.toggle('open', isOpen);
  header?.classList.toggle('menu-active', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  document.body.classList.toggle('menu-open', isOpen);
}

menuButton?.addEventListener('click', toggleMenu);
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('click', (event) => {
  if (nav?.classList.contains('open') && header && !header.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
    setLauncher(false);
    document.querySelector('.cookie-dialog')?.close();
  }
});

function setLauncher(open) {
  if (!launcher || !launcherButton) return;
  launcher.dataset.expanded = String(open);
  launcherButton.setAttribute('aria-expanded', String(open));
  launcherButton.setAttribute('aria-label', open ? 'Close contact options' : 'Open contact options');
}

function configureContactActions() {
  document.querySelectorAll('[data-contact]').forEach((action) => {
    const type = action.dataset.contact;
    if (type === 'whatsapp') action.href = `https://wa.me/${OMNI_CONTACT.whatsapp}?text=${encodeURIComponent('Hello Omni Minerals, I would like to make an enquiry about your services.')}`;
    if (type === 'phone') action.href = `tel:${OMNI_CONTACT.phone}`;
    if (type === 'email') action.href = `mailto:${OMNI_CONTACT.email}`;
  });
}
configureContactActions();
launcherButton?.addEventListener('click', () => setLauncher(launcher.dataset.expanded !== 'true'));
document.addEventListener('click', (event) => {
  if (launcher?.dataset.expanded === 'true' && !launcher.contains(event.target)) setLauncher(false);
});

const observer = 'IntersectionObserver' in window && !reducedMotion ? new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 }) : null;
document.querySelectorAll('.reveal, .market-visual').forEach((item) => observer ? observer.observe(item) : item.classList.add('visible'));

function fieldMessage(field, message = '') {
  const label = field.closest('label');
  if (!label) return !message;
  let output = label.querySelector('.field-error');
  if (!output) { output = document.createElement('span'); output.className = 'field-error'; output.setAttribute('role', 'alert'); label.append(output); }
  output.textContent = message;
  label.classList.toggle('field-invalid', Boolean(message));
  field.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}

function validateField(field) {
  if (field.type === 'checkbox') return fieldMessage(field, field.required && !field.checked ? 'Please acknowledge the Privacy Policy.' : '');
  if (field.name === '_website') return true;
  let error = '';
  const value = field.value.trim();
  if (field.required && !value) error = `Please enter your ${field.closest('label')?.firstChild?.textContent?.trim().toLowerCase() || 'answer'}.`;
  if (!error && field.type === 'email' && !field.validity.valid) error = 'Please enter a valid email address.';
  if (!error && field.name === 'message' && value.length > 2000) error = 'Please keep your message under 2,000 characters.';
  if (!error && field.name === 'phone' && value && !/^[+\d\s().-]{7,30}$/.test(value)) error = 'Please enter a valid phone number.';
  return fieldMessage(field, error);
}

function formFeedback(form, text, type) {
  const message = form.querySelector('.form-message');
  if (message) { message.textContent = text; message.className = `form-message is-${type}`; }
}

document.querySelectorAll('form').forEach((form) => {
  const fields = [...form.querySelectorAll('input, select, textarea')];
  const startField = form.elements.formStartedAt;
  if (startField) startField.value = String(Date.now());
  fields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validateField(field); });
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const valid = fields.filter((field) => field.name !== '_website' && field.type !== 'hidden').every(validateField);
    if (!valid) { formFeedback(form, 'Please review the highlighted fields and try again.', 'error'); form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    if (form.matches('[data-contact-form]')) {
      if (form.elements._website.value) return;
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.consent = form.elements.consent.checked;
      try {
        form.classList.add('form-submitting');
        const response = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error('Contact endpoint unavailable');
        form.reset();
        formFeedback(form, 'Thank you. Your enquiry has been sent to Omni Minerals.', 'success');
      } catch {
        formFeedback(form, `The secure enquiry channel is being configured. Please email ${OMNI_CONTACT.email} or use WhatsApp.`, 'error');
      } finally { form.classList.remove('form-submitting'); }
      return;
    }
    formFeedback(form, 'Thank you. Your interest has been recorded for follow-up.', 'success');
    form.reset();
  });
});

const cookieKey = 'omni-cookie-preferences';
const cookieMarkup = '<div class="cookie-banner" hidden><p><b>Privacy-friendly cookies</b> We use essential cookies to keep the website working. Optional cookies are used only with your permission.</p><div><button type="button" data-cookie-action="accept">Accept All</button><button type="button" data-cookie-action="reject">Reject Non-Essential</button><button type="button" data-cookie-action="settings">Cookie Settings</button></div></div><dialog class="cookie-dialog" aria-labelledby="cookie-dialog-title"><form method="dialog"><h2 id="cookie-dialog-title">Cookie Settings</h2><p>Choose whether to allow optional cookie preferences. No analytics or marketing scripts are installed at present.</p><label><input type="checkbox" checked disabled> Necessary cookies <small>Required for core website functions.</small></label><label><input type="checkbox" data-cookie-category="analytics"> Analytics cookies <small>Currently not used.</small></label><label><input type="checkbox" data-cookie-category="marketing"> Marketing cookies <small>Currently not used.</small></label><div class="dialog-actions"><button type="button" value="cancel">Cancel</button><button type="button" value="save" data-cookie-action="save">Save Preferences</button></div></form></dialog>';
if (!document.querySelector('.cookie-banner')) document.body.insertAdjacentHTML('beforeend', cookieMarkup);
const banner = document.querySelector('.cookie-banner');
const dialog = document.querySelector('.cookie-dialog');
const cookieMessage = document.querySelector('.cookie-banner p');
if (cookieMessage) cookieMessage.innerHTML = '<b>Privacy-friendly cookies</b> We use essential cookies to keep the website working. Optional cookies are used only with your permission.';
function readCookies() { try { return JSON.parse(localStorage.getItem(cookieKey)); } catch { return null; } }
function setBannerVisible(visible) { if (banner) banner.hidden = !visible; document.body.classList.toggle('cookies-visible', visible); }
function saveCookies(preferences) { try { localStorage.setItem(cookieKey, JSON.stringify({ necessary: true, analytics: false, marketing: false, ...preferences })); } catch {} setBannerVisible(false); }
function syncCookieControls(preferences = readCookies() || {}) { const analytics = dialog?.querySelector('[data-cookie-category="analytics"]'); const marketing = dialog?.querySelector('[data-cookie-category="marketing"]'); if (analytics) analytics.checked = preferences.analytics === true; if (marketing) marketing.checked = preferences.marketing === true; }
function openCookieSettings() { if (!dialog?.showModal || dialog.open) return; syncCookieControls(); dialog.showModal(); }
const currentCookies = readCookies();
setBannerVisible(!currentCookies);
document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-cookie-action], .footer-cookie-settings');
  if (!action) return;
  event.preventDefault();
  if (action.matches('.footer-cookie-settings, [data-cookie-action="settings"]')) return openCookieSettings();
  if (action.matches('[data-cookie-action="accept"]')) return saveCookies({ analytics: true, marketing: true });
  if (action.matches('[data-cookie-action="reject"]')) return saveCookies({ analytics: false, marketing: false });
  if (action.matches('[data-cookie-action="save"]')) {
    saveCookies({ analytics: Boolean(dialog?.querySelector('[data-cookie-category="analytics"]')?.checked), marketing: Boolean(dialog?.querySelector('[data-cookie-category="marketing"]')?.checked) });
    if (dialog?.open) dialog.close('save');
    return;
  }
  if (dialog && action.form === dialog.querySelector('form') && action.value === 'cancel') {
    if (dialog.open) dialog.close('cancel');
  }
});
dialog?.addEventListener('cancel', () => { document.body.classList.remove('menu-open'); });
