/* Renders X post cards from data/social.json at runtime (so the twice-daily
 * JSON refresh updates pages automatically), then loads social-embeds.js to
 * upgrade cards to live X embeds. Supports a per-post `celebrity` boolean.
 *  - home.html:  <div data-social-feed data-limit="12"></div>
 *  - social.html: re-renders #tweet-grid and fills #celebrity-wishes. */
(function () {
  "use strict";
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" });
  }
  function n(x) { return (Number(x) || 0).toLocaleString("en-US"); }
  function isCeleb(p) { return p.celebrity === true || p.section === "celebrity"; }
  function card(p) {
    var a = document.createElement("article");
    a.className = "tweet-card" + (isCeleb(p) ? " is-celebrity" : "");
    a.setAttribute("data-tweet-id", p.id);
    a.setAttribute("data-status", "fallback");
    var url = p.url || ("https://x.com/" + p.username + "/status/" + p.id);
    a.innerHTML =
      '<div class="tweet-fallback">' +
      '<div class="tf-head"><div class="avatar" aria-hidden="true">' + esc((p.name || p.username || "?").charAt(0).toUpperCase()) + "</div>" +
      '<div><div class="tf-name">' + esc(p.name || p.username) + (isCeleb(p) ? ' <span class="celeb-badge">🌟 Celebrity</span>' : "") + "</div>" +
      '<div class="tf-meta">@' + esc(p.username) + " · " + fmtDate(p.created_at) + " · via X</div></div></div>" +
      '<p class="tf-text">' + esc(p.text) + "</p>" +
      '<div class="tf-metrics">♥ ' + n(p.likes) + " · ↻ " + n(p.retweets) + "</div>" +
      (p.note ? '<p class="tf-note">' + esc(p.note) + "</p>" : "") +
      '<a class="tf-link" href="' + esc(url) + '" target="_blank" rel="noopener">Open on X →</a>' +
      "</div>" +
      '<div class="tweet-embed" hidden></div>';
    return a;
  }
  function loadEmbeds() {
    if (document.getElementById("diwali-embeds-js")) return;
    var s = document.createElement("script");
    s.id = "diwali-embeds-js";
    s.src = "js/social-embeds.js";
    document.body.appendChild(s);
  }
  function sortPosts(posts) {
    return posts.slice().sort(function (a, b) {
      var c = (isCeleb(b) ? 1 : 0) - (isCeleb(a) ? 1 : 0);
      if (c) return c;
      return (Number(b.likes) || 0) - (Number(a.likes) || 0);
    });
  }
  function apply(data) {
    var posts = (data && Array.isArray(data.posts)) ? data.posts.filter(function (p) { return p && p.id; }) : [];
    var feed = document.querySelector("[data-social-feed]");
    if (feed && posts.length) {
      var limit = parseInt(feed.getAttribute("data-limit"), 10) || 12;
      feed.innerHTML = "";
      sortPosts(posts).slice(0, limit).forEach(function (p) { feed.appendChild(card(p)); });
    }
    var grid = document.getElementById("tweet-grid");
    if (grid && posts.length) {
      var celebs = posts.filter(isCeleb);
      var others = posts.filter(function (p) { return !isCeleb(p); });
      var sec = document.getElementById("celebrity-wishes");
      var cg = document.getElementById("celebrity-grid");
      if (sec && cg && celebs.length) {
        cg.innerHTML = "";
        celebs.forEach(function (p) { cg.appendChild(card(p)); });
        sec.hidden = false;
      }
      grid.innerHTML = "";
      (celebs.length && sec ? others : posts).forEach(function (p) { grid.appendChild(card(p)); });
    }
    var stamp = document.querySelector("[data-social-updated]");
    if (stamp && data && data.last_updated_ist) {
      stamp.textContent = "Last updated: " + data.last_updated_ist;
      stamp.hidden = false;
    }
  }
  fetch("data/social.json?v=" + Math.floor(Date.now() / 600000), { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(apply)
    .catch(function () {
      var feed = document.querySelector("[data-social-feed]");
      if (feed && !feed.querySelector(".tweet-card")) {
        feed.innerHTML = '<p class="feed-empty">Posts could not load right now — <a href="social.html">open Social Buzz</a>.</p>';
      }
    })
    .then(loadEmbeds);
})();
