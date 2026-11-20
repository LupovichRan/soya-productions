/* Where waiting-list signups and "what would you add" requests are sent. Leave url empty to switch the forms off
   (they then say "opens soon"). The destination is a Google Apps Script web app that appends a row to a Google Sheet,
   one tab per app (see infra/waitlist/README.md). It receives only what the person typed and the app's name. */
window.SOYA_WAITLIST = {
  url: ''
};
