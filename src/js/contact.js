import { getLocale, t } from '../i18n/index.js';
const STUDIO_EMAIL = 'contact@hotwireinteractive.co.uk';
const confirmationMessages = {
  accepted: 'Your inquiry has been accepted by our mail server. A confirmation email has also been accepted for delivery to your address.',
  unavailable: 'Your inquiry has been accepted by our mail server. A confirmation email may not arrive, but you do not need to send your inquiry again.',
  suppressed: 'Your inquiry has been accepted by our mail server. No additional confirmation email was sent for this address. You do not need to send your inquiry again.',
};

export function createEmailDraft({ name, email, category, message, brief = '' }) {
  const sender = name.trim().replace(/[\r\n]+/g, ' ');
  const subject = t('{category} from {sender}', { category, sender });
  const body = [
    t('Name / studio: {name}', { name: sender }),
    t('Email: {email}', { email: email.trim() }),
    t('Inquiry type: {category}', { category }),
    '',
    message.trim(),
    ...(brief ? ['', t('Website quiz brief:'), brief] : []),
  ].join('\r\n');

  return {
    url: `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    text: `To: ${STUDIO_EMAIL}\r\nSubject: ${subject}\r\n\r\n${body}`,
  };
}

export function initContactForm() {
  const form = document.getElementById('studio-contact-form');
  if (!form) return;

  const status = document.getElementById('contact-status');
  const preview = document.getElementById('draft-preview');
  const draftText = document.getElementById('draft-text');
  const copyButton = document.getElementById('copy-message');
  const category = form.elements.namedItem('category');
  const attachment = document.getElementById('contact-quiz-brief');
  const attachmentText = document.getElementById('contact-quiz-text');
  const briefInput = document.getElementById('contact-brief');
  const message = form.elements.namedItem('message');
  const submit = document.getElementById('contact-submit');
  const localeInput = document.createElement('input');
  localeInput.type = 'hidden'; localeInput.name = 'locale'; localeInput.value = getLocale(); form.append(localeInput);
  let websiteBrief = '';
  let busy = false;
  let sent = false;
  let tokenRequest;
  let revision = 0;
  const resetSubmission = () => {
    sent = false;
    if (!busy) {
      submit.disabled = false;
      submit.textContent = t('Send inquiry');
    }
    const requestId = form.elements.namedItem('request_id');
    if (requestId) requestId.value = '';
  };

  let lastStatus = [];
  const setStatus = (text, state = '') => {
    lastStatus = Array.isArray(text) ? text : [text];
    status.textContent = lastStatus.map((source) => t(source)).join(' ');
    status.dataset.state = state;
  };

  const validate = (forSending = true) => {
    for (const name of ['name', 'email', 'message']) {
      const field = form.elements.namedItem(name);
      field.setCustomValidity(field.required && !field.value.trim() ? t('Please complete this field.') : '');
    }
    const consent = form.elements.namedItem('consent');
    // Copying is local: permission to send an inquiry is not needed to keep a copy.
    const wasRequired = consent.required;
    if (!forSending) consent.required = false;
    try { return form.reportValidity(); }
    finally { consent.required = wasRequired; }
  };

  const loadToken = (signal) => {
    if (!tokenRequest) {
      tokenRequest = fetch(form.action, { headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store', signal })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok || typeof data.csrf !== 'string' || !data.csrf || typeof data.request_id !== 'string' || !data.request_id) throw new Error('Contact server unavailable');
          form.elements.namedItem('csrf').value = data.csrf;
          let requestId = form.elements.namedItem('request_id');
          if (!requestId) {
            requestId = document.createElement('input');
            requestId.type = 'hidden';
            requestId.name = 'request_id';
            form.append(requestId);
          }
          if (!requestId.value) requestId.value = data.request_id;
        }).finally(() => { tokenRequest = null; });
    }
    return tokenRequest;
  };

  const getDraft = () => {
    if (!validate(false)) return null;
    const data = Object.fromEntries(new FormData(form));
    const draft = createEmailDraft({ ...data, category: category.selectedOptions[0].textContent, brief: websiteBrief });
    draftText.value = draft.text;
    preview.hidden = false;
    return draft;
  };

  form.addEventListener('input', (event) => {
    revision += 1;
    event.target.setCustomValidity?.('');
    status.textContent = '';
    preview.hidden = true;
    resetSubmission();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || sent || !validate()) return;
    revision += 1;
    const body = new FormData(form);
    const controls = [...form.elements].filter((control) => !control.disabled);
    busy = true;
    // Freeze a single snapshot before requesting the security token. FormData omits
    // disabled fields, so it must be constructed before the controls are disabled.
    controls.forEach((control) => { control.disabled = true; });
    submit.textContent = t('Sending…');
    form.setAttribute('aria-busy', 'true');
    setStatus('Sending your inquiry…');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      await loadToken(controller.signal);
      body.set('csrf', form.elements.namedItem('csrf').value);
      body.set('request_id', form.elements.namedItem('request_id').value);
      const response = await fetch(form.action, {
        method: 'POST', body, headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok || data.ok !== true) {
        setStatus(typeof data.message === 'string' && data.message ? data.message : 'Your inquiry was not sent. Please try again or email us directly.', 'error');
        return;
      }
      sent = true;
      setStatus([
        Object.hasOwn(confirmationMessages, data.confirmation) ? confirmationMessages[data.confirmation] : 'Your inquiry has been accepted by our mail server. We’ll reply to your email address.',
        'Your details are still here for reference.',
      ], 'success');
    } catch {
      setStatus('We could not confirm that your inquiry was sent. Your information is still here. You can retry, copy your message, or email us directly.', 'error');
    } finally {
      window.clearTimeout(timeout);
      controls.forEach((control) => { control.disabled = false; });
      busy = false;
      submit.disabled = sent;
      submit.textContent = t(sent ? 'Inquiry sent' : 'Send inquiry');
      form.removeAttribute('aria-busy');
    }
  });

  copyButton.addEventListener('click', async () => {
    if (busy) return;
    const draft = getDraft();
    if (!draft) return;
    const currentRevision = revision;
    try {
      await navigator.clipboard.writeText(draft.text);
      if (currentRevision === revision) setStatus('Message copied. You can keep a copy or email it to contact@hotwireinteractive.co.uk.');
    } catch {
      if (currentRevision !== revision) return;
      preview.open = true;
      draftText.focus();
      draftText.select();
      setStatus('Automatic copying is unavailable. Your draft is selected below; copy it and paste it into your email app.');
    }
  });

  form.hidden = false;
  document.getElementById('contact-help').hidden = false;
  document.getElementById('composer-fallback').hidden = true;

  document.getElementById('remove-quiz-brief').addEventListener('click', () => {
    revision += 1;
    resetSubmission();
    websiteBrief = '';
    briefInput.value = '';
    message.required = true;
    document.getElementById('message-label').textContent = t('Your message');
    attachment.hidden = true;
    attachmentText.textContent = '';
    preview.hidden = true;
    setStatus('Website recommendation removed. Your message and contact details are still here.');
    category.focus();
  });

  window.addEventListener('hotwire:languagechange', () => {
    localeInput.value = getLocale();
    document.getElementById('message-label').textContent = t(websiteBrief ? 'Your message (optional)' : 'Your message');
    submit.textContent = t(busy ? 'Sending…' : sent ? 'Inquiry sent' : 'Send inquiry');
    if (status.textContent && lastStatus.length) status.textContent = lastStatus.map((source) => t(source)).join(' ');
  });

  return {
    attachWebsiteBrief(brief) {
      if (!brief) return;
      websiteBrief = brief;
      briefInput.value = brief;
      attachmentText.textContent = brief;
      attachment.hidden = false;
      category.value = 'website';
      message.required = false;
      document.getElementById('message-label').textContent = t('Your message (optional)');
      message.setCustomValidity('');
      preview.hidden = true;
      setStatus('Your project brief is attached. Just add your name, email, and consent to send it. Extra notes are optional.');
    },
  };
}
