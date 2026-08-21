// Lolly Jaye Hair – shared site behaviour

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initForms();
  markActiveNavLink();
});

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

function markActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path) link.setAttribute('aria-current', 'page');
  });
}

/**
 * Enquiry forms send automatically to Lolly's inbox via Formspree
 * (https://formspree.io) once a real endpoint is set on the form's
 * data-formspree attribute – see README.md "Turning on real email delivery"
 * for the 2-minute setup. Until that's done (data-formspree is still the
 * placeholder), forms fall back to opening the visitor's own email app
 * pre-filled with the message, so the site still works out of the box.
 *
 * Expected data attributes on the <form>:
 *   data-mailto-form   the recipient email address (fallback path)
 *   data-formspree      a real https://formspree.io/f/XXXXXXX endpoint (primary path)
 *   data-subject         subject template, "{{Name}}" tokens replaced with
 *                         the value of the field named "Name"
 */
function initForms() {
  document.querySelectorAll('form[data-mailto-form]').forEach(form => {
    const note = form.parentElement.querySelector('.form-note');

    function updateNote() {
      const endpoint = form.getAttribute('data-formspree') || '';
      const formspreeReady = /^https:\/\/formspree\.io\/f\/\w+/.test(endpoint);
      if (note) {
        note.textContent = formspreeReady
          ? "Your enquiry is sent straight to Lolly's inbox and she will reply to you personally."
          : 'Submitting opens your email app with this message ready to send (real inbox delivery isn\'t switched on yet – see README.md).';
      }
    }
    updateNote();
    form.addEventListener('lj:endpoint-changed', updateNote);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Read the endpoint fresh at submit time – on the Contact page it can
      // change after page load, once the visitor picks what they're enquiring about.
      const endpoint = form.getAttribute('data-formspree') || '';
      const formspreeReady = /^https:\/\/formspree\.io\/f\/\w+/.test(endpoint);

      const to = form.getAttribute('data-mailto-form');
      const subjectTemplate = form.getAttribute('data-subject') || 'New website enquiry';
      const fields = Array.from(form.querySelectorAll('input, textarea, select'));

      const values = {};
      fields.forEach(f => { values[f.name] = f.value.trim(); });
      const subject = subjectTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || '');

      let sentViaFormspree = false;

      if (formspreeReady) {
        try {
          const fd = new FormData(form);
          fd.set('_subject', subject);
          const res = await fetch(endpoint, {
            method: 'POST',
            body: fd,
            headers: { Accept: 'application/json' }
          });
          sentViaFormspree = res.ok;
        } catch (err) {
          sentViaFormspree = false;
        }
      }

      if (!sentViaFormspree) {
        const bodyLines = fields.map(f => {
          const label = f.closest('.field')?.querySelector('label')?.textContent || f.name;
          return `${label}: ${f.value}`;
        });
        const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
        window.location.href = mailto;
      }

      const success = form.parentElement.querySelector('.form-success');
      if (success) {
        success.textContent = sentViaFormspree
          ? "Thank you – your enquiry has been sent to Lolly."
          : "Your email app should now be open with your message ready to send. If nothing opened, email lolly@lollyjayehair.co.uk directly.";
        success.classList.add('show');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
    });
  });

  /**
   * The Contact page's "What are you enquiring about?" dropdown routes to a
   * different Formspree inbox per class type, so each enquiry lands with the
   * right person/folder instead of all going into one generic inbox.
   */
  const enquirySelect = document.getElementById('enquiry');
  if (enquirySelect) {
    const form = enquirySelect.closest('form');
    const endpointsByEnquiry = {
      'Shadow Days': 'https://formspree.io/f/xvkpdrvv',
      '1:1 Education': 'https://formspree.io/f/mbgrqypb',
      'Private Classes': 'https://formspree.io/f/mjybjrpq',
      'Look & Learn Classes': 'https://formspree.io/f/mqpzwbwk'
    };
    enquirySelect.addEventListener('change', () => {
      const endpoint = endpointsByEnquiry[enquirySelect.value] || form.getAttribute('data-formspree-default') || '';
      form.setAttribute('data-formspree', endpoint);
      form.dispatchEvent(new Event('lj:endpoint-changed'));
    });
  }
}
