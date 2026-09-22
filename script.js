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

if (!document.querySelector('.cookie-banner')) {
  document.body.insertAdjacentHTML('beforeend', '<div class="cookie-banner" hidden><p><b>Privacy-friendly cookies</b> We use essential cookies required for the website to function. With your permission, we may also use optional cookies for analytics or other purposes.</p><div><button type="button" data-cookie-action="accept">Accept All</button><button type="button" data-cookie-action="reject">Reject Non-Essential</button><button type="button" data-cookie-action="settings">Cookie Settings</button></div></div><dialog class="cookie-dialog" aria-labelledby="cookie-dialog-title"><form method="dialog"><h2 id="cookie-dialog-title">Cookie Settings</h2><p>Choose whether to allow optional cookies. No analytics or marketing scripts are installed at present.</p><label><input type="checkbox" checked disabled> Necessary cookies <small>Required for core website functions.</small></label><label><input type="checkbox" data-cookie-category="analytics"> Analytics cookies <small>Currently not used.</small></label><label><input type="checkbox" data-cookie-category="marketing"> Marketing cookies <small>Currently not used.</small></label><div class="dialog-actions"><button value="cancel">Cancel</button><button value="save" data-cookie-action="save">Save Preferences</button></div></form></dialog>');
}
const cookieKey = 'omni-cookie-preferences';
const banner = document.querySelector('.cookie-banner');
const dialog = document.querySelector('.cookie-dialog');
function readCookies() { try { return JSON.parse(localStorage.getItem(cookieKey)); } catch { return null; } }
function saveCookies(preferences) { localStorage.setItem(cookieKey, JSON.stringify({ necessary: true, analytics: false, marketing: false, ...preferences })); if (banner) banner.hidden = true; }
function openCookieSettings() { if (dialog?.showModal) dialog.showModal(); }
const currentCookies = readCookies();
if (!currentCookies && banner) banner.hidden = false;
document.querySelectorAll('[data-cookie-action="accept"]').forEach((button) => button.addEventListener('click', () => saveCookies({ analytics: true, marketing: true })));
document.querySelectorAll('[data-cookie-action="reject"]').forEach((button) => button.addEventListener('click', () => saveCookies({ analytics: false, marketing: false })));
document.querySelectorAll('[data-cookie-action="settings"], .footer-cookie-settings').forEach((button) => button.addEventListener('click', openCookieSettings));
dialog?.addEventListener('close', () => {
  if (dialog.returnValue !== 'save') return;
  saveCookies({ analytics: Boolean(dialog.querySelector('[data-cookie-category="analytics"]')?.checked), marketing: Boolean(dialog.querySelector('[data-cookie-category="marketing"]')?.checked) });
});
