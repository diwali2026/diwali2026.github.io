(function () {
  "use strict";

  var MIN_IFRAME_H = 140;
  if (!document.querySelector(".tweet-card")) return;

  // Prefer fallbacks when screenshots/print/reduced-data, or ?cards=1
  var params = new URLSearchParams(location.search);
  var forceCards =
    params.get("cards") === "1" ||
    params.get("fallback") === "1" ||
    window.matchMedia("(prefers-reduced-data: reduce)").matches ||
    !!window.__DIWALI_FORCE_CARDS__;

  var pool = document.createElement("div");
  pool.id = "tweet-widget-pool";
  pool.setAttribute("aria-hidden", "true");
  pool.style.cssText =
    "position:absolute;left:-10000px;top:0;width:550px;height:auto;overflow:hidden;opacity:0;pointer-events:none;";
  document.body.appendChild(pool);

  function isGoodIframe(iframe) {
    if (!iframe) return false;
    var h = Math.max(
      iframe.getBoundingClientRect().height || 0,
      iframe.offsetHeight || 0,
      parseInt(iframe.style.height, 10) || 0,
      parseInt(iframe.getAttribute("height"), 10) || 0
    );
    return h >= MIN_IFRAME_H;
  }

  function showFallback(card) {
    if (!card) return;
    var fb = card.querySelector(".tweet-fallback");
    var emb = card.querySelector(".tweet-embed");
    if (fb) fb.hidden = false;
    if (emb) {
      emb.hidden = true;
      emb.innerHTML = "";
    }
    card.setAttribute("data-status", "fallback");
  }

  function showEmbed(card, widgetRoot) {
    if (forceCards) return false;
    if (!card || !widgetRoot) return false;
    var iframe = widgetRoot.querySelector("iframe");
    if (!isGoodIframe(iframe)) return false;
    var fb = card.querySelector(".tweet-fallback");
    var emb = card.querySelector(".tweet-embed");
    if (!emb) return false;
    emb.innerHTML = "";
    emb.appendChild(widgetRoot);
    emb.hidden = false;
    if (fb) fb.hidden = true;
    card.setAttribute("data-status", "embed");
    return true;
  }

  document.querySelectorAll(".tweet-card").forEach(showFallback);

  // Expose for screenshot tooling
  window.__diwaliSocial = {
    showAllFallbacks: function () {
      forceCards = true;
      document.querySelectorAll(".tweet-card").forEach(showFallback);
    },
    stats: function () {
      var embed = 0, fallback = 0;
      document.querySelectorAll(".tweet-card").forEach(function (c) {
        if (c.getAttribute("data-status") === "embed") embed++;
        else fallback++;
      });
      return { embed: embed, fallback: fallback, total: embed + fallback };
    },
  };

  if (forceCards) return; // stay on rich cards forever

  function loadWidgets() {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".tweet-card"));

    cards.forEach(function (card, index) {
      var id = card.getAttribute("data-tweet-id");
      if (!id || !window.twttr || !twttr.widgets || !twttr.widgets.createTweet) {
        showFallback(card);
        return;
      }

      var slot = document.createElement("div");
      slot.className = "pool-slot";
      pool.appendChild(slot);

      setTimeout(function () {
        twttr.widgets
          .createTweet(id, slot, { conversation: "none", dnt: true, align: "center" })
          .then(function (el) {
            if (!el) {
              showFallback(card);
              return;
            }
            var tries = 0;
            var iv = setInterval(function () {
              tries += 1;
              var iframe = el.querySelector("iframe");
              if (isGoodIframe(iframe)) {
                clearInterval(iv);
                if (!showEmbed(card, el)) showFallback(card);
              } else if (tries >= 24) {
                clearInterval(iv);
                showFallback(card);
                try { slot.remove(); } catch (e) {}
              }
            }, 250);
          })
          .catch(function () {
            showFallback(card);
            try { slot.remove(); } catch (e) {}
          });
      }, index * 300);
    });

    setTimeout(function () {
      document.querySelectorAll(".tweet-card").forEach(function (card) {
        if (card.getAttribute("data-status") !== "embed") showFallback(card);
      });
    }, cards.length * 300 + 8000);
  }

  window.twttr = (function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0], t = window.twttr || {};
    if (d.getElementById(id)) return t;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://platform.twitter.com/widgets.js";
    js.async = true;
    js.onerror = function () {
      document.querySelectorAll(".tweet-card").forEach(showFallback);
    };
    fjs.parentNode.insertBefore(js, fjs);
    t._e = [];
    t.ready = function (f) { t._e.push(f); };
    return t;
  })(document, "script", "twitter-wjs");

  if (window.twttr && twttr.ready) {
    twttr.ready(function () { loadWidgets(); });
  }
})();
