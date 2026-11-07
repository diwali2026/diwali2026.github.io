/**
 * Visitors + likes + share for the static Diwali site.
 * Counters: Abacus API. Failures are silent (UI hidden / no throws).
 */
(function () {
  "use strict";

  var cfg = window.DIWALI_CONFIG || {};
  var BASE = cfg.COUNTER_BASE || "https://abacus.jasoncameron.dev";
  var NS = cfg.COUNTER_TEST_MODE
    ? cfg.COUNTER_TEST_NAMESPACE || "diwali2026-test"
    : cfg.COUNTER_NAMESPACE || "diwali2026.github.io";

  function pageId() {
    var body = document.body;
    if (body && body.dataset && body.dataset.page) return body.dataset.page;
    var path = (location.pathname || "/").split("/").pop() || "index.html";
    return path.replace(/\.html$/i, "") || "index";
  }

  function fmt(n) {
    try {
      return Number(n).toLocaleString("en-IN");
    } catch (e) {
      return String(n);
    }
  }

  function api(path) {
    return fetch(BASE + path, { method: "GET", mode: "cors", cache: "no-store" }).then(
      function (r) {
        if (!r.ok) throw new Error("counter " + r.status);
        return r.json();
      }
    );
  }

  function hit(key) {
    return api("/hit/" + encodeURIComponent(NS) + "/" + encodeURIComponent(key));
  }

  function get(key) {
    return api("/get/" + encodeURIComponent(NS) + "/" + encodeURIComponent(key)).catch(
      function () {
        return { value: 0 };
      }
    );
  }

  function sessionKey(pid) {
    return "diwali2026-visited-" + pid;
  }
  function likeKey(pid) {
    return "diwali2026-liked-" + pid;
  }

  function showVisitors(total, pageCount) {
    document.querySelectorAll("[data-visitor-wrap]").forEach(function (el) {
      el.hidden = false;
    });
    document.querySelectorAll("[data-visitor-count]").forEach(function (el) {
      el.textContent = fmt(total);
    });
    document.querySelectorAll("[data-visitor-page-wrap]").forEach(function (el) {
      if (pageCount != null) {
        el.hidden = false;
        var c = el.querySelector("[data-visitor-page-count]");
        if (c) c.textContent = fmt(pageCount);
      }
    });
  }

  function hideVisitors() {
    document.querySelectorAll("[data-visitor-wrap]").forEach(function (el) {
      el.hidden = true;
    });
  }

  function trackVisitors(pid) {
    var sk = sessionKey(pid);
    var counted = false;
    try {
      counted = sessionStorage.getItem(sk) === "1";
    } catch (e) {}

    var pageKey = "visitors-" + pid;
    var siteKey = "visitors-site";

    var chain;
    if (!counted) {
      chain = Promise.all([hit(siteKey), hit(pageKey)]).then(function (res) {
        try {
          sessionStorage.setItem(sk, "1");
        } catch (e) {}
        return { total: res[0].value, page: res[1].value };
      });
    } else {
      chain = Promise.all([get(siteKey), get(pageKey)]).then(function (res) {
        return { total: res[0].value || 0, page: res[1].value || 0 };
      });
    }

    return chain
      .then(function (v) {
        showVisitors(v.total, v.page);
        return v;
      })
      .catch(function () {
        hideVisitors();
      });
  }

  function sparkle(btn) {
    btn.classList.remove("liked-pop");
    // force reflow
    void btn.offsetWidth;
    btn.classList.add("liked-pop");
    for (var i = 0; i < 8; i++) {
      var s = document.createElement("span");
      s.className = "like-spark";
      s.style.setProperty("--a", String((i / 8) * 360) + "deg");
      s.style.setProperty("--d", String(0.35 + Math.random() * 0.35) + "s");
      btn.appendChild(s);
      (function (node) {
        setTimeout(function () {
          try {
            node.remove();
          } catch (e) {}
        }, 900);
      })(s);
    }
  }

  function setupLikes(pid) {
    var key = "likes-" + pid;
    var liked = false;
    try {
      liked = localStorage.getItem(likeKey(pid)) === "1";
    } catch (e) {}

    get(key).then(function (res) {
      var n = (res && res.value) || 0;
      document.querySelectorAll("[data-like-count]").forEach(function (el) {
        el.textContent = fmt(n);
      });
    });

    document.querySelectorAll("[data-like-btn]").forEach(function (btn) {
      if (liked) {
        btn.setAttribute("aria-pressed", "true");
        btn.classList.add("is-liked");
      }
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var already = false;
        try {
          already = localStorage.getItem(likeKey(pid)) === "1";
        } catch (err) {}
        if (already) {
          btn.classList.add("liked-pop");
          return;
        }
        hit(key)
          .then(function (res) {
            try {
              localStorage.setItem(likeKey(pid), "1");
            } catch (err) {}
            btn.setAttribute("aria-pressed", "true");
            btn.classList.add("is-liked");
            document.querySelectorAll("[data-like-count]").forEach(function (el) {
              el.textContent = fmt(res.value);
            });
            sparkle(btn);
          })
          .catch(function () {
            // still celebrate locally if API fails after first click intent
            try {
              localStorage.setItem(likeKey(pid), "1");
            } catch (err) {}
            btn.setAttribute("aria-pressed", "true");
            btn.classList.add("is-liked");
            sparkle(btn);
          });
      });
    });
  }

  function setupShare() {
    document.querySelectorAll("[data-share-btn]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var title = document.title || "Diwali Encyclopedia";
        var url = location.href;
        var text = "Exploring Diwali — Festival of Lights";
        if (navigator.share) {
          navigator
            .share({ title: title, text: text, url: url })
            .catch(function () {
              copyLink(btn, url);
            });
        } else {
          copyLink(btn, url);
        }
      });
    });
  }

  function copyLink(btn, url) {
    var done = function () {
      var prev = btn.textContent;
      btn.textContent = "Link copied!";
      setTimeout(function () {
        btn.textContent = prev;
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () {
        fallbackCopy(url);
        done();
      });
    } else {
      fallbackCopy(url);
      done();
    }
  }

  function fallbackCopy(url) {
    var ta = document.createElement("textarea");
    ta.value = url;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {}
    ta.remove();
  }

  function init() {
    var pid = pageId();
    trackVisitors(pid);
    setupLikes(pid);
    setupShare();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose for tests
  window.__diwaliEngage = {
    pageId: pageId,
    hit: hit,
    get: get,
    NS: NS,
  };
})();
