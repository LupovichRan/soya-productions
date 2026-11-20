/* Idea Room: the shared service. A thin client for the alpha's shared state (Supabase, one function per action).
   The address and the public key are in config.js: that key is meant to be public and can only call the
   functions, never read a table. A "device" is a random id kept in this browser; it is not a person.
   If config.js is empty or the service cannot be reached, the app carries on with this device only. */
(function (root) {
  'use strict';

  var DEVICE_KEY = 'soya-idearoom-device';
  var cfg = root.SOYA_ROOM_CONFIG || {};
  var enabled = !!(cfg.url && cfg.key);

  function uuid() {
    if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
    var b = new Uint8Array(16); root.crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  var memoryDevice = '';
  function device() {
    var id = '';
    try { id = localStorage.getItem(DEVICE_KEY) || ''; } catch (e) { /* blocked */ }
    if (!/^[0-9a-f-]{36}$/.test(id)) {
      id = memoryDevice || uuid();
      try { localStorage.setItem(DEVICE_KEY, id); } catch (e) { memoryDevice = id; }
    }
    return id;
  }

  /** Call one function. Rejects with a short message that is safe to show. */
  function rpc(name, args) {
    if (!enabled) return Promise.reject(new Error('off'));
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 12000) : 0;
    return fetch(cfg.url.replace(/\/+$/, '') + '/rest/v1/rpc/' + name, {
      method: 'POST', headers: { 'apikey': cfg.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(args || {}), signal: ctl ? ctl.signal : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { /* not JSON */ }
        if (!res.ok) { var err = new Error(data && data.message ? String(data.message).slice(0, 120) : 'error'); err.status = res.status; throw err; }
        return data;
      });
    }).finally(function () { if (timer) clearTimeout(timer); });
  }

  function num(x, d) { x = Number(x); return isFinite(x) ? x : d; }
  function str(x) { return typeof x === 'string' ? x : ''; }

  /** One idea from the service, turned into the shape the screens already use. Everything is checked: it came from other people. */
  function toIdea(r) {
    var mine = {}; (Array.isArray(r.mine) ? r.mine : []).forEach(function (k) { mine[String(k)] = true; });
    var others = {}; Object.keys(r.others && typeof r.others === 'object' ? r.others : {}).forEach(function (k) { others[k] = Math.max(0, Math.floor(num(r.others[k], 0))); });
    return {
      id: str(r.id), remote: true, owner: r.owner === true, sample: '',
      name: str(r.name), problem: str(r.problem), promise: str(r.promise), mascot: str(r.mascot) || 'fox',
      startedAt: Date.parse(r.created_at) || Date.now(), dayOffset: 0,
      mine: mine, others: others, seat: r.seat === true,
      items: (Array.isArray(r.items) ? r.items : []).map(function (i) {
        return { id: str(i.id), text: str(i.text), tk: -1, by: i.by === 'you' ? 'you' : 'other', status: str(i.status), claimedBy: i.claimedBy === 'you' ? 'you' : '', reply: str(i.reply), given: Math.max(0, Math.floor(num(i.given, 0))) };
      }),
      question: str(r.question), options: (Array.isArray(r.options) ? r.options : []).map(str),
      votes: (Array.isArray(r.votes) ? r.votes : []).map(function (v) { return Math.max(0, Math.floor(num(v, 0))); }),
      myVote: Math.floor(num(r.my_vote, -1)), myVoteWeight: Math.floor(num(r.my_vote_weight, 0)),
      decision: str(r.decision),
      trust: (Array.isArray(r.trust) ? r.trust : []).map(function (g) { return { id: str(g.id), itemId: str(g.itemId), points: Math.floor(num(g.points, 0)), why: str(g.why) }; })
    };
  }

  function list() { return rpc('ir_get', { p_device: device() }).then(function (rows) { return (Array.isArray(rows) ? rows : []).map(toIdea); }); }

  var api = {
    enabled: enabled, device: device, rpc: rpc, list: list, toIdea: toIdea,
    newIdea: function (d) { return rpc('ir_new_idea', { p_device: device(), p_name: d.name, p_problem: d.problem, p_promise: d.promise, p_mascot: d.mascot }); },
    signal: function (idea, kind) { return rpc('ir_toggle_signal', { p_device: device(), p_idea: idea, p_kind: kind }); },
    seat: function (idea) { return rpc('ir_take_seat', { p_device: device(), p_idea: idea }); },
    vote: function (idea, idx) { return rpc('ir_vote', { p_device: device(), p_idea: idea, p_idx: idx }); },
    addItem: function (idea, text) { return rpc('ir_add_item', { p_device: device(), p_idea: idea, p_text: text }); },
    move: function (item, action, reply) { return rpc('ir_move_item', { p_device: device(), p_item: item, p_action: action, p_reply: reply || '' }); },
    trust: function (item, points, why) { return rpc('ir_award_trust', { p_device: device(), p_item: item, p_points: points, p_why: why || '' }); },
    survey: function (idea, question, options) { return rpc('ir_set_survey', { p_device: device(), p_idea: idea, p_question: question, p_options: options }); },
    decide: function (idea, decision) { return rpc('ir_decide', { p_device: device(), p_idea: idea, p_decision: decision }); },
    dashboard: function () { return rpc('ir_dashboard', {}); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoyaRemote = api;
})(typeof window !== 'undefined' ? window : globalThis);
