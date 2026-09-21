// Add official Omni Minerals contact details here.
const OMNI_CONTACT = { whatsapp: '', phone: '', facebook: '', instagram: '' };

const header = document.querySelector('.site-header');
const progress = document.querySelector('.scroll-progress');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const launcher = document.querySelector('.contact-launcher');
const launcherButton = document.querySelector('.launcher-button');
const hero = document.querySelector('.hero');
const heroMedia = document.querySelector('.hero-media');
const canAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wideViewport = window.matchMedia('(min-width: 761px)');
document.body.classList.add('motion-ready');

function updateScrollEffects() {
  const scrollY = window.scrollY;
  header.classList.toggle('scrolled', scrollY > 24);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.setProperty('--progress', `${scrollable ? (scrollY / scrollable) * 100 : 0}%`);
  if (canAnimate && wideViewport.matches && scrollY < hero.offsetHeight) {
    heroMedia.style.transform = `translateY(${scrollY * 0.14}px) scale(1.015)`;
    hero.querySelector('.hero-content').style.transform = `translateY(${-scrollY * 0.06}px)`;
  }
}

updateScrollEffects();
window.addEventListener('scroll', () => requestAnimationFrame(updateScrollEffects), { passive: true });
window.addEventListener('resize', updateScrollEffects, { passive: true });

function closeMenu() {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}

menuButton.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
});
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
    launcher.dataset.expanded = 'false';
    launcherButton.setAttribute('aria-expanded', 'false');
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal, .market-visual').forEach((item) => observer.observe(item));

function fieldMessage(field, message = '') {
  const label = field.closest('label');
  let output = label.querySelector('.field-error');
  if (!output) {
    output = document.createElement('span');
    output.className = 'field-error';
    output.setAttribute('aria-live', 'polite');
    label.append(output);
  }
  output.textContent = message;
  label.classList.toggle('field-invalid', Boolean(message));
  label.classList.toggle('field-valid', !message && field.value.trim() !== '');
  field.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}

function validateField(field) {
  const label = field.closest('label');
  const name = label.firstChild.textContent.trim();
  let error = '';
  if (field.required && !field.value.trim()) error = `Please enter your ${name.toLowerCase()}.`;
  if (!error && field.type === 'email' && field.value && !field.validity.valid) error = 'Please enter a valid email address.';
  if (!error && field.type === 'file' && field.files.length) {
    const file = field.files[0];
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(extension)) error = 'Please choose a PDF, DOC or DOCX file.';
    if (!error && file.size > 10 * 1024 * 1024) error = 'Please choose a file smaller than 10 MB.';
  }
  return fieldMessage(field, error);
}

document.querySelectorAll('form').forEach((form) => {
  const fields = [...form.querySelectorAll('input, select, textarea')];
  fields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
    if (field.type === 'file') field.addEventListener('change', () => {
      validateField(field);
      const label = field.closest('label');
      let filename = label.querySelector('.selected-file');
      if (!filename) {
        filename = document.createElement('span');
        filename.className = 'selected-file';
        label.append(filename);
      }
      filename.textContent = field.files.length ? field.files[0].name : 'No file selected.';
    });
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const valid = fields.every(validateField);
    const message = form.querySelector('.form-message');
    if (!valid) {
      message.textContent = 'Please review the highlighted fields and try again.';
      message.className = 'form-message is-error';
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button.innerHTML;
    form.classList.add('form-submitting');
    button.innerHTML = '<span>Processing</span>';
    window.setTimeout(() => {
      form.classList.remove('form-submitting');
      button.innerHTML = originalLabel;
      message.textContent = 'Your enquiry has been captured. Our team will be in touch once the enquiry channel is connected.';
      message.className = 'form-message is-success';
      form.reset();
      form.querySelectorAll('.field-valid').forEach((item) => item.classList.remove('field-valid'));
      form.querySelectorAll('.selected-file').forEach((item) => item.remove());
    }, 450);
  });
});

function configureContactActions() {
  const configured = Object.values(OMNI_CONTACT).some(Boolean);
  if (!configured) {
    launcher.hidden = true;
    return;
  }
  const message = encodeURIComponent('Hello Omni Minerals, I would like to enquire about your mining and industrial solutions.');
  document.querySelectorAll('[data-contact]').forEach((action) => {
    const type = action.dataset.contact;
    const value = OMNI_CONTACT[type];
    if (!value || type === 'whatsapp') return;
    action.classList.remove('is-hidden');
    action.href = type === 'phone' ? `tel:${value}` : value;
  });
  if (OMNI_CONTACT.whatsapp) {
    const whatsapp = document.createElement('a');
    whatsapp.className = 'floating-action';
    whatsapp.href = `https://wa.me/${OMNI_CONTACT.whatsapp}?text=${message}`;
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener noreferrer';
    whatsapp.setAttribute('aria-label', 'Chat with Omni Minerals on WhatsApp');
    whatsapp.dataset.tooltip = 'Chat on WhatsApp';
    whatsapp.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.8a8 8 0 0 1-11.8 7L4 20l1.3-4.1A8 8 0 1 1 20 11.8Z"></path><path d="M9 8.5c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4 0 .6l-.5.7c.5 1 1.3 1.8 2.3 2.3l.7-.5c.2-.1.4-.1.6 0l1.6.7c.3.1.4.3.4.5v.5c0 .3 0 .5-.5.7-.5.2-1.5.2-2.7-.4-1-.5-2.2-1.5-3.1-2.9-.8-1.3-1.2-2.5-1.2-3.3 0-.3 0-.6.1-.8Z"></path></svg>';
    launcher.querySelector('.contact-actions').prepend(whatsapp);
  }
}

configureContactActions();
launcherButton.addEventListener('click', () => {
  const isExpanded = launcher.dataset.expanded === 'true';
  launcher.dataset.expanded = String(!isExpanded);
  launcherButton.setAttribute('aria-expanded', String(!isExpanded));
});
if (wideViewport.matches) {
  launcher.addEventListener('mouseenter', () => {
    if (launcher.querySelector('.contact-actions a:not(.is-hidden)')) {
      launcher.dataset.expanded = 'true';
      launcherButton.setAttribute('aria-expanded', 'true');
    }
  });
  launcher.addEventListener('mouseleave', () => {
    launcher.dataset.expanded = 'false';
    launcherButton.setAttribute('aria-expanded', 'false');
  });
}
