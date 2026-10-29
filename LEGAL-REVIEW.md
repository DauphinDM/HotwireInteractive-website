# Legal publication checklist

The `/privacy/`, `/terms/`, and `/cookies/` pages are working drafts matched to the current site code, not a legal compliance certification. Have the operator and a suitably qualified adviser review them before publication. Do not treat the implementation or these drafts as a substitute for legal advice.

## Details the owner must confirm before publishing

- **Legal operator/controller identity:** full registered name (or the actual individual operating the business), legal form where applicable, service/registered address, Belgian enterprise number, and VAT number if applicable. Only the supplied studio name, country, and contact email have been used; no registration details were invented. Add the verified details to the website and privacy/terms pages and determine whether a separate company/legal notice is required.
- **Hosting and email providers:** their actual identities, processing locations, data-processing terms, subprocessors, backup/log retention, and any transfers outside the EEA and relevant safeguards. Provider categories are described publicly, but those operational facts cannot be inferred from the source code.
- **Retention schedule:** choose and implement appropriate periods for unsuccessful inquiries, client correspondence, project records, logs, backups, and any legal retention duties. The notices intentionally do not invent an automatic mailbox-deletion period.
- **Lawful bases and consent wording:** confirm the appropriate basis for each inquiry/security activity and whether the required confirmation in the form needs adjustment. It must not be repurposed as marketing consent.
- **Remote fonts:** Google Fonts currently receives direct browser requests. Confirm the appropriate privacy/transfer arrangements; self-hosting licensed font files is an alternative if remote requests are unsuitable. The privacy notice discloses those requests rather than claiming the site has no third parties.
- **Cookie/storage rules:** review essential contact-session storage and the user-requested quiz transfer under applicable Belgian/EU rules. There are no analytics/ad scripts in the source; verify the live host does not inject other tracking. If optional tracking is added, introduce any required prior consent controls before enabling it.
- **Commercial terms:** these are website-use terms only. Prepare separate service terms/proposals for paid work, including scope, ownership, payment, cancellation/withdrawal rights where applicable, support, and consumer protections. No invented governing-law, court, or absolute liability exclusions were added.

## Verified against the implementation

- Contact recipient: `contact@hotwireinteractive.co.uk`; fixed mail sender: `website@hotwireinteractive.co.uk`.
- Contact service: PHP, validated personal details/message/brief, consent confirmation, CSRF, a honeypot, rate limits, and duplicate-payload checks. No attachments accepted.
- Session cookie: `hotwire_contact`, API path `/api/`, session lifetime, HttpOnly, SameSite=Strict, Secure when PHP sees HTTPS. Review HTTPS/proxy configuration on the actual host.
- Quiz transfer: `hotwire-website-brief` in session storage, four choices and timestamp only, accepted for ten minutes and removed when read. An unread entry can physically remain until the tab's session ends or storage is cleared.
- Receipt matching: active window of one hour; hashed-IP request counting: per-IP fifteen-minute and global one-hour windows. Pruning happens during later processing, not through a scheduled deletion job.
- Names, email addresses, and message text are not written to browser storage by the application. Email infrastructure necessarily processes submitted inquiry content.
- Public pages link from every site footer and both contact-form variants. No marketing consent checkbox, fake cookie-preference controls, or tracking banner was introduced.

After any processing, provider, or legal-identity changes, update these pages and their “Last updated” dates together. Verify the deployed forms and storage, not only the local source.
