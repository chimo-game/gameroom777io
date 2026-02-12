/**
 * DOWNLOAD FLOW — Exact replica of sign-up page flow:
 *   1. Processing card (white card, progress ring, 5 sequential steps)
 *   2. Cloudflare verification modal (fake turnstile checkbox widget)
 *   3. Offers locker modal (API-loaded offers, shake, timer, social proof)
 *   4. Success state (confetti, install button)
 */

(function () {
  "use strict";

  /* ================================================================
     CONFIG
     ================================================================ */
  var CONFIG = {
    STEP1_DELAY: 900,
    STEP2_DELAY: 1100,
    STEP3_DELAY: 1000,
    STEP4_DELAY: 1400,
    STEP5_DELAY: 1600,
    APK_BASE_PATH: "/downloads/",
    OFFERS_API:
      "https://d1y3y09sav47f5.cloudfront.net/public/offers/feed.php?user_id=378788&api_key=01e1f87ac8720a6f0d3e8b0f1eedcf4c",
  };

  /* ================================================================
     STATE
     ================================================================ */
  var isActive = false;
  var currentGame = null;
  var shakeInterval = null;
  var lockerTimerInterval = null;
  var socialInterval = null;

  /* ================================================================
     BUILD ALL MODALS (injected once)
     ================================================================ */
  function buildModals() {
    if (document.getElementById("dlModalOverlay")) return;

    /* ---- 1. Processing Modal (Download Manager App Style) ---- */
    var processingHTML =
      '\
    <div class="dl-modal-overlay" id="dlModalOverlay">\
      <div class="dl-process-card" role="dialog" aria-modal="true" aria-label="Preparing download">\
        <div id="dlProcessingState">\
          <div class="dl-app-hero">\
            <div class="dl-app-icon-wrap" id="dlAppIcon">\
              <div class="dl-icon-pulse"></div>\
              <div class="dl-apk-icon"><ion-icon name="logo-android"></ion-icon></div>\
            </div>\
            <div class="dl-app-name" id="dlAppName">Game Vault</div>\
            <div class="dl-app-meta">\
              <span id="dlAppFile">game-vault.apk</span>\
              <span class="dl-meta-dot"></span>\
              <span id="dlAppSize">45 MB</span>\
              <span class="dl-meta-dot"></span>\
              <span>Android</span>\
            </div>\
          </div>\
          <div class="dl-download-body">\
            <div class="dl-status-row">\
              <div class="dl-status-text" id="dlStatusText"><div class="dl-status-spinner"></div> Downloading...</div>\
              <div class="dl-percent" id="dlPercent">0%</div>\
            </div>\
            <div class="dl-progress-track">\
              <div class="dl-progress-fill" id="dlProgressFill"></div>\
            </div>\
            <div class="dl-stats-row">\
              <div class="dl-speed"><ion-icon name="arrow-down"></ion-icon> <span id="dlSpeed">0 MB/s</span></div>\
              <div class="dl-downloaded"><span id="dlDownloaded">0</span> / <span id="dlTotalSize">45</span> MB</div>\
            </div>\
            <div class="dl-status-log">\
              <div class="dl-log-item" id="dlLog1">\
                <div class="dl-log-icon"><div class="dl-log-spinner"></div><ion-icon name="cloud-download"></ion-icon></div>\
                <div class="dl-log-text">Connecting to CDN server</div>\
                <div class="dl-log-time" id="dlLog1Time"></div>\
              </div>\
              <div class="dl-log-item" id="dlLog2">\
                <div class="dl-log-icon"><div class="dl-log-spinner"></div><ion-icon name="download"></ion-icon></div>\
                <div class="dl-log-text">Downloading APK package</div>\
                <div class="dl-log-time" id="dlLog2Time"></div>\
              </div>\
              <div class="dl-log-item" id="dlLog3">\
                <div class="dl-log-icon"><div class="dl-log-spinner"></div><ion-icon name="shield-checkmark"></ion-icon></div>\
                <div class="dl-log-text">Verifying file integrity (SHA-256)</div>\
                <div class="dl-log-time" id="dlLog3Time"></div>\
              </div>\
              <div class="dl-log-item" id="dlLog4">\
                <div class="dl-log-icon"><div class="dl-log-spinner"></div><ion-icon name="scan"></ion-icon></div>\
                <div class="dl-log-text">Running security scan</div>\
                <div class="dl-log-time" id="dlLog4Time"></div>\
              </div>\
              <div class="dl-log-item" id="dlLog5">\
                <div class="dl-log-icon"><div class="dl-log-spinner"></div><ion-icon name="checkmark-done"></ion-icon></div>\
                <div class="dl-log-text">Finalizing download</div>\
                <div class="dl-log-time" id="dlLog5Time"></div>\
              </div>\
            </div>\
            <div class="dl-secure-footer">\
              <div class="dl-secure-tag"><ion-icon name="shield-checkmark"></ion-icon> Secure</div>\
              <div class="dl-secure-tag"><ion-icon name="lock-closed"></ion-icon> Encrypted</div>\
              <div class="dl-secure-tag"><ion-icon name="checkmark-circle"></ion-icon> Virus Free</div>\
            </div>\
          </div>\
        </div>\
        <div id="dlSuccessState" style="display:none;" class="dl-success-state">\
          <div class="dl-success-badge"><ion-icon name="checkmark-circle"></ion-icon></div>\
          <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 6px;">Download Ready!</h2>\
          <p style="color:#64748b;font-size:14px;margin:0 0 16px;" id="dlSuccessSubtitle">Your file has been verified and is ready to install.</p>\
          <div class="dl-success-details">\
            <div class="dl-detail-item"><div class="dl-detail-check"><ion-icon name="checkmark"></ion-icon></div><span>CDN connection verified</span></div>\
            <div class="dl-detail-item"><div class="dl-detail-check"><ion-icon name="checkmark"></ion-icon></div><span>File integrity confirmed</span></div>\
            <div class="dl-detail-item"><div class="dl-detail-check"><ion-icon name="checkmark"></ion-icon></div><span>No malware or viruses detected</span></div>\
          </div>\
          <a class="dl-install-btn" id="dlInstallBtn" href="#" download>\
            <ion-icon name="download"></ion-icon>\
            <span id="dlInstallBtnText">Install APK</span>\
          </a>\
          <div class="dl-install-guide">\
            <button class="dl-install-toggle" id="dlInstallToggle" type="button">\
              <ion-icon name="help-circle"></ion-icon>\
              How to install APK on Android\
              <ion-icon name="chevron-down" class="dl-chevron"></ion-icon>\
            </button>\
            <div class="dl-install-steps" id="dlInstallSteps">\
              <div class="dl-install-step-item"><div class="dl-install-num">1</div><div class="dl-install-text">Open <strong>Settings → Security</strong> on your Android device</div></div>\
              <div class="dl-install-step-item"><div class="dl-install-num">2</div><div class="dl-install-text">Enable <strong>"Unknown Sources"</strong> or <strong>"Install from Unknown Apps"</strong></div></div>\
              <div class="dl-install-step-item"><div class="dl-install-num">3</div><div class="dl-install-text">Open the downloaded <strong>.apk file</strong> from your notifications or file manager</div></div>\
              <div class="dl-install-step-item"><div class="dl-install-num">4</div><div class="dl-install-text">Tap <strong>"Install"</strong> and wait for it to complete. Launch the app!</div></div>\
            </div>\
          </div>\
          <div class="dl-success-footer-note"><ion-icon name="shield-checkmark"></ion-icon> Verified &amp; safe to install</div>\
        </div>\
      </div>\
    </div>';

    /* ---- 2. Cloudflare Verification Modal ---- */
    var verificationHTML =
      '\
    <div class="dl-verification-overlay" id="dlVerificationModal" aria-hidden="true">\
      <div class="dl-verification-modal" role="dialog" aria-modal="true" aria-label="Human verification">\
        <div class="dl-verification-header">\
          <div class="dl-verification-icon">\
            <ion-icon name="shield-checkmark" style="font-size:48px;color:#f48120;"></ion-icon>\
          </div>\
          <h2>Verify you are human</h2>\
          <p>gameroom777.io needs to verify you are human. This helps prevent automated access.</p>\
        </div>\
        <div class="dl-verification-content">\
          <div class="dl-turnstile-container">\
            <div class="dl-fake-turnstile" id="dlFakeTurnstile">\
              <div class="dl-turnstile-checkbox" id="dlFakeTurnstileCheckbox">\
                <span class="dl-turnstile-checkbox-icon">✓</span>\
              </div>\
              <div class="dl-turnstile-label">\
                <div class="dl-turnstile-label-text">I am human</div>\
              </div>\
              <div class="dl-turnstile-branding">\
                <img class="dl-turnstile-cf-icon" src="/assets/images/Cloudflare_Logo.svg" alt="Cloudflare">\
                <div class="dl-turnstile-links">\
                  <a href="#" onclick="return false;">Privacy</a> · <a href="#" onclick="return false;">Terms</a>\
                </div>\
              </div>\
            </div>\
          </div>\
        </div>\
        <div class="dl-verification-buttons">\
          <button type="button" class="dl-verify-btn" id="dlVerificationConfirm" disabled>\
            <span>Verify &amp; Continue</span>\
          </button>\
        </div>\
        <div class="dl-verification-footer">\
          <span>Performance &amp; security by <span class="dl-cf-brand">Cloudflare</span></span>\
        </div>\
      </div>\
    </div>';

    /* ---- 3. Offers Locker Modal ---- */
    var lockerHTML =
      '\
    <div class="dl-offers-locker-overlay" id="dlOffersLockerModal">\
      <div class="dl-locker-progress">\
        <div class="dl-locker-progress-step done"><div class="dl-step-num">✓</div><span>Download</span></div>\
        <div class="dl-locker-progress-line done"></div>\
        <div class="dl-locker-progress-step active"><div class="dl-step-num">2</div><span>Verify</span></div>\
        <div class="dl-locker-progress-line"></div>\
        <div class="dl-locker-progress-step"><div class="dl-step-num">3</div><span>Install!</span></div>\
      </div>\
      <div class="dl-offers-locker-modal" id="dlOffersLockerContent">\
        <div class="dl-offers-locker-header">\
          <div class="dl-offers-locker-icon">\
            <img src="/assets/images/giphy.gif" alt="System requirement" style="width:100px;height:100px;object-fit:contain;">\
          </div>\
          <h2>Are you a real person?</h2>\
          <p>Complete <b>1 quick step</b> below to verify your identity</p>\
        </div>\
        <div class="dl-offers-grid-wrapper">\
          <div class="dl-offers-locker-status">PENDING ACTION</div>\
          <div class="dl-offers-grid" id="dlOffersLockerContainer">\
            <div class="dl-offer-skeleton">\
              <div class="dl-skeleton-card"><div class="dl-skeleton-badge"></div><div class="dl-skeleton-icon"></div><div class="dl-skeleton-lines"><div class="dl-skeleton-line"></div><div class="dl-skeleton-line"></div></div></div>\
              <div class="dl-skeleton-card"><div class="dl-skeleton-badge"></div><div class="dl-skeleton-icon"></div><div class="dl-skeleton-lines"><div class="dl-skeleton-line"></div><div class="dl-skeleton-line"></div></div></div>\
            </div>\
          </div>\
        </div>\
        <div class="dl-offers-locker-footer">\
          <div class="dl-locker-timer">\
            <ion-icon name="time-outline"></ion-icon>\
            Session expires in <span class="dl-timer-val" id="dlLockerTimer">1:59</span>\
          </div>\
          <div class="dl-locker-trust">\
            <div class="dl-trust-item"><ion-icon name="shield-checkmark"></ion-icon> Secure</div>\
            <div class="dl-trust-item"><ion-icon name="lock-closed"></ion-icon> Encrypted</div>\
            <div class="dl-trust-item"><ion-icon name="checkmark-circle"></ion-icon> Verified</div>\
          </div>\
        </div>\
      </div>\
      <div class="dl-locker-social">\
        <span class="dl-live-dot"></span>\
        <strong id="dlSocialCount">247</strong> people verified today\
      </div>\
    </div>';

    document.body.insertAdjacentHTML(
      "beforeend",
      processingHTML + verificationHTML + lockerHTML,
    );

    // Bind events after injection
    bindModalEvents();
  }

  /* ================================================================
     BIND MODAL EVENTS
     ================================================================ */
  function bindModalEvents() {
    var overlay = document.getElementById("dlModalOverlay");

    // Close processing modal on overlay click
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeFlow();
    });

    // Install guide toggle
    var toggle = document.getElementById("dlInstallToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        this.classList.toggle("open");
        document.getElementById("dlInstallSteps").classList.toggle("open");
      });
    }

    // Fake Turnstile click handler
    initFakeTurnstile();

    // Verify button click handler
    var verifyBtn = document.getElementById("dlVerificationConfirm");
    if (verifyBtn) {
      verifyBtn.addEventListener("click", function () {
        if (!dlTurnstileVerified) return;

        // Show processing state on button
        verifyBtn.disabled = true;
        verifyBtn.innerHTML =
          '<div class="dl-loading-spinner"></div><span>Verifying...</span>';

        // Simulate verification delay then open locker
        setTimeout(
          function () {
            closeVerificationModal();
            openOffersLocker();
            // Reset button
            verifyBtn.innerHTML = "<span>Verify &amp; Continue</span>";
            verifyBtn.disabled = true;
          },
          1500 + Math.random() * 1000,
        );
      });
    }

    // Prevent closing locker by clicking outside — shake instead
    var lockerOverlay = document.getElementById("dlOffersLockerModal");
    if (lockerOverlay) {
      lockerOverlay.addEventListener("click", function (e) {
        if (e.target === lockerOverlay) {
          var content = document.getElementById("dlOffersLockerContent");
          if (content) {
            content.classList.remove("dl-shake-animation");
            void content.offsetWidth;
            content.classList.add("dl-shake-animation");
            setTimeout(function () {
              content.classList.remove("dl-shake-animation");
            }, 600);
          }
        }
      });
    }
  }

  /* ================================================================
     PROGRESS BAR + STATS
     ================================================================ */
  var dlAnimFrame = null;

  function updateProgressBar(percent) {
    var fill = document.getElementById("dlProgressFill");
    var pctEl = document.getElementById("dlPercent");
    if (fill) fill.style.width = percent + "%";
    if (pctEl) pctEl.textContent = Math.round(percent) + "%";
  }

  function updateDownloadStats(percent, totalMB) {
    var dlEl = document.getElementById("dlDownloaded");
    var speedEl = document.getElementById("dlSpeed");
    if (dlEl) dlEl.textContent = ((totalMB * percent) / 100).toFixed(1);
    if (speedEl) {
      var speed = (1.5 + Math.random() * 3.5).toFixed(1);
      speedEl.textContent = speed + " MB/s";
    }
  }

  function animateProgress(from, to, duration, totalMB, cb) {
    var start = performance.now();
    function frame(now) {
      var elapsed = now - start;
      var t = Math.min(elapsed / duration, 1);
      // easeOutCubic
      var ease = 1 - Math.pow(1 - t, 3);
      var current = from + (to - from) * ease;
      updateProgressBar(current);
      updateDownloadStats(current, totalMB);
      if (t < 1) {
        dlAnimFrame = requestAnimationFrame(frame);
      } else {
        dlAnimFrame = null;
        if (cb) cb();
      }
    }
    dlAnimFrame = requestAnimationFrame(frame);
  }

  /* ================================================================
     STATUS LOG STEPS
     ================================================================ */
  function logStep(num, delay, totalSteps, totalMB, cb) {
    var item = document.getElementById("dlLog" + num);
    var timeEl = document.getElementById("dlLog" + num + "Time");
    item.classList.add("active");

    // Progress animation for this step's segment
    var fromPct = ((num - 1) / totalSteps) * 100;
    var toPct = (num / totalSteps) * 100;

    // Update status text
    var statusText = document.getElementById("dlStatusText");
    var labels = [
      "Connecting...",
      "Downloading...",
      "Verifying...",
      "Scanning...",
      "Finalizing...",
    ];
    if (statusText)
      statusText.innerHTML =
        '<div class="dl-status-spinner"></div> ' +
        (labels[num - 1] || "Processing...");

    animateProgress(fromPct, toPct, delay, totalMB, function () {
      item.classList.remove("active");
      item.classList.add("done");
      // Show timestamp
      if (timeEl) {
        var now = new Date();
        timeEl.textContent =
          now.getHours().toString().padStart(2, "0") +
          ":" +
          now.getMinutes().toString().padStart(2, "0") +
          ":" +
          now.getSeconds().toString().padStart(2, "0");
      }
      if (cb) cb();
    });
  }

  function setStatusDone() {
    var statusText = document.getElementById("dlStatusText");
    var percentEl = document.getElementById("dlPercent");
    var fill = document.getElementById("dlProgressFill");
    if (statusText) {
      statusText.classList.add("done");
      statusText.innerHTML = "Complete";
    }
    if (percentEl) {
      percentEl.textContent = "100%";
      percentEl.style.color = "#10b981";
    }
    if (fill) fill.classList.add("complete");
  }

  /* ================================================================
     FAKE TURNSTILE (exact copy from sign-up)
     ================================================================ */
  var dlTurnstileVerified = false;

  function initFakeTurnstile() {
    var fakeTurnstile = document.getElementById("dlFakeTurnstile");
    if (!fakeTurnstile) return;

    fakeTurnstile.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (fakeTurnstile.classList.contains("verified")) {
        // Uncheck
        fakeTurnstile.classList.remove("verified");
        dlTurnstileVerified = false;
        var verifyBtn = document.getElementById("dlVerificationConfirm");
        if (verifyBtn) {
          verifyBtn.disabled = true;
          verifyBtn.style.opacity = "0.5";
          verifyBtn.style.cursor = "not-allowed";
        }
      } else {
        // Check — mark as verified
        fakeTurnstile.classList.add("verified");
        dlTurnstileVerified = true;

        // Enable verify button
        var verifyBtn = document.getElementById("dlVerificationConfirm");
        if (verifyBtn) {
          verifyBtn.disabled = false;
          verifyBtn.style.opacity = "1";
          verifyBtn.style.cursor = "pointer";
        }
      }
    };
  }

  function resetFakeTurnstile() {
    var fakeTurnstile = document.getElementById("dlFakeTurnstile");
    if (fakeTurnstile) fakeTurnstile.classList.remove("verified");
    dlTurnstileVerified = false;

    var verifyBtn = document.getElementById("dlVerificationConfirm");
    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.style.opacity = "0.5";
      verifyBtn.style.cursor = "not-allowed";
    }
  }

  /* ================================================================
     VERIFICATION MODAL
     ================================================================ */
  function openVerificationModal() {
    var modal = document.getElementById("dlVerificationModal");
    if (modal) {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
      setTimeout(function () {
        resetFakeTurnstile();
      }, 100);
    }
  }

  function closeVerificationModal() {
    var modal = document.getElementById("dlVerificationModal");
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
  }

  /* ================================================================
     OFFERS LOCKER
     ================================================================ */
  function loadOffersLocker() {
    var container = document.getElementById("dlOffersLockerContainer");
    var gameName = currentGame ? currentGame.game : "Game";
    var apiUrl =
      CONFIG.OFFERS_API +
      "&user_agent=" +
      encodeURIComponent(navigator.userAgent) +
      "&s1=" +
      encodeURIComponent(gameName) +
      "&s2=";

    fetch(apiUrl)
      .then(function (r) {
        return r.json();
      })
      .then(function (offers) {
        if (!offers || offers.length === 0) {
          container.innerHTML =
            '<div class="dl-offer-loading">No offers available at this time.</div>';
          return;
        }

        var limited = offers.slice(0, 2);
        var badges = [
          { text: "🔥 Most Popular", cls: "hot" },
          { text: "⚡ Quick & Easy", cls: "easy" },
        ];
        var html = "";

        limited.forEach(function (offer, idx) {
          var badge = badges[idx] || badges[0];
          var isPrimary = idx === 0;
          var btnClass = isPrimary ? "primary" : "secondary";
          var iconName = isPrimary ? "lock-open" : "shield-checkmark";
          var btnText = isPrimary
            ? "Tap to Unlock Download"
            : "Alternative Unlock";

          html +=
            '<a href="' +
            offer.url +
            '" target="_blank" class="dl-offer-button ' +
            btnClass +
            '" title="' +
            btnText +
            '">' +
            '<div class="dl-offer-badge ' +
            badge.cls +
            '">' +
            badge.text +
            "</div>" +
            "<span>" +
            '<ion-icon name="' +
            iconName +
            '" class="dl-offer-icon"></ion-icon>' +
            btnText +
            '<ion-icon name="arrow-forward" class="dl-offer-arrow"></ion-icon>' +
            "</span>" +
            "</a>";
        });

        container.innerHTML = html;
      })
      .catch(function (err) {
        console.error("Error loading offers:", err);
        container.innerHTML =
          '<div class="dl-offer-loading">Unable to load offers. Please try again.</div>';
      });
  }

  function triggerInitialShake() {
    var content = document.getElementById("dlOffersLockerContent");
    if (content) {
      content.classList.remove("dl-shake-animation", "dl-shake-tiny");
      void content.offsetWidth;
      content.classList.add("dl-shake-animation");
    }
  }

  function triggerTinyShake() {
    var content = document.getElementById("dlOffersLockerContent");
    if (content) {
      content.classList.remove("dl-shake-tiny");
      void content.offsetHeight;
      content.classList.add("dl-shake-tiny");
    }
  }

  function startLockerTimer() {
    var timeLeft = 119; // 1:59
    var timerEl = document.getElementById("dlLockerTimer");
    if (!timerEl) return;

    if (lockerTimerInterval) clearInterval(lockerTimerInterval);

    lockerTimerInterval = setInterval(function () {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(lockerTimerInterval);
        timerEl.textContent = "0:00";
        timerEl.style.color = "#dc2626";
        return;
      }
      var mins = Math.floor(timeLeft / 60);
      var secs = timeLeft % 60;
      timerEl.textContent = mins + ":" + (secs < 10 ? "0" : "") + secs;
      timerEl.style.color = timeLeft < 60 ? "#dc2626" : "";
    }, 1000);
  }

  function startSocialProof() {
    var countEl = document.getElementById("dlSocialCount");
    if (!countEl) return;

    var today = new Date().toDateString();
    var stored = JSON.parse(localStorage.getItem("dlSocialProof") || "{}");
    var count;
    if (stored.date === today && stored.count) {
      count = stored.count;
    } else {
      count = 180 + Math.floor(Math.random() * 140);
    }

    // Animate count up from 0
    var displayed = 0;
    var step = Math.ceil(count / 40);
    var countUp = setInterval(function () {
      displayed += step;
      if (displayed >= count) {
        displayed = count;
        clearInterval(countUp);
      }
      countEl.textContent = displayed;
    }, 30);

    if (socialInterval) clearInterval(socialInterval);

    // Slowly increment every 15-30s
    socialInterval = setInterval(
      function () {
        count += 1;
        countEl.textContent = count;
        localStorage.setItem(
          "dlSocialProof",
          JSON.stringify({ date: today, count: count }),
        );
      },
      15000 + Math.random() * 15000,
    );
  }

  function openOffersLocker() {
    var modal = document.getElementById("dlOffersLockerModal");
    if (modal) {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
      loadOffersLocker();
      startLockerTimer();
      startSocialProof();

      // Initial hard shake
      setTimeout(function () {
        triggerInitialShake();
      }, 100);

      // Repeat tiny shake every 5s
      if (shakeInterval) clearInterval(shakeInterval);
      shakeInterval = setInterval(triggerTinyShake, 5000);
    }
  }

  function closeOffersLocker() {
    var modal = document.getElementById("dlOffersLockerModal");
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");

      if (shakeInterval) {
        clearInterval(shakeInterval);
        shakeInterval = null;
      }
      if (lockerTimerInterval) {
        clearInterval(lockerTimerInterval);
        lockerTimerInterval = null;
      }
      if (socialInterval) {
        clearInterval(socialInterval);
        socialInterval = null;
      }

      var content = document.getElementById("dlOffersLockerContent");
      if (content)
        content.classList.remove("dl-shake-animation", "dl-shake-tiny");
    }
  }

  /* ================================================================
     SUCCESS STATE
     ================================================================ */
  function showSuccess() {
    if (!isActive) return;

    // Close locker
    closeOffersLocker();

    // Hide processing, show success
    document.getElementById("dlProcessingState").style.display = "none";
    var successState = document.getElementById("dlSuccessState");
    successState.style.display = "";

    // Show the processing overlay for the success card
    var overlay = document.getElementById("dlModalOverlay");
    overlay.classList.add("active");

    // Confetti
    if (typeof confetti === "function") {
      try {
        var rainEnd = Date.now() + 4000;
        var rainColors = [
          "#ff6b6b",
          "#feca57",
          "#48dbfb",
          "#ff9ff3",
          "#54a0ff",
          "#5f27cd",
          "#01a3a4",
          "#10b981",
          "#f368e0",
          "#ff6348",
          "#1dd1a1",
          "#ffc312",
        ];
        (function rainFrame() {
          for (var i = 0; i < 3; i++) {
            confetti({
              particleCount: 2,
              angle: 90,
              spread: 160,
              startVelocity: 15 + Math.random() * 20,
              origin: { x: Math.random(), y: -0.05 },
              colors: [
                rainColors[Math.floor(Math.random() * rainColors.length)],
              ],
              ticks: 300,
              gravity: 0.6 + Math.random() * 0.4,
              scalar: 0.8 + Math.random() * 0.6,
              drift: (Math.random() - 0.5) * 1.5,
              shapes: ["circle", "square"],
              zIndex: 3001,
            });
          }
          if (Date.now() < rainEnd) requestAnimationFrame(rainFrame);
        })();
      } catch (e) {
        /* ignore */
      }
    }
  }

  /* ================================================================
     OPEN FLOW — main entry point
     ================================================================ */
  function openFlow(gameData) {
    if (isActive) return;
    buildModals();
    isActive = true;
    currentGame = gameData;

    resetModal();

    // Parse total MB from size string (e.g. "45 MB" -> 45)
    var totalMB = parseFloat(gameData.size) || 45;

    // Set app hero info
    document.getElementById("dlAppName").textContent = gameData.game;
    document.getElementById("dlAppFile").textContent = gameData.apk;
    document.getElementById("dlAppSize").textContent = gameData.size;
    document.getElementById("dlTotalSize").textContent = totalMB;
    document.getElementById("dlInstallBtnText").textContent =
      "Install " + gameData.game;
    document.getElementById("dlInstallBtn").href =
      CONFIG.APK_BASE_PATH + gameData.apk;
    document.getElementById("dlSuccessSubtitle").textContent =
      gameData.game + " APK has been verified and is ready to install.";

    // Set game image in hero
    var appIconWrap = document.getElementById("dlAppIcon");
    if (gameData.image && appIconWrap) {
      appIconWrap.innerHTML =
        '<div class="dl-icon-pulse"></div><img src="' +
        gameData.image +
        '" alt="' +
        gameData.game +
        '">';
    }

    // Show processing overlay
    var overlay = document.getElementById("dlModalOverlay");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";

    // Run 5 log steps sequentially with animated progress bar
    var totalSteps = 5;
    logStep(1, CONFIG.STEP1_DELAY, totalSteps, totalMB, function () {
      logStep(2, CONFIG.STEP2_DELAY, totalSteps, totalMB, function () {
        logStep(3, CONFIG.STEP3_DELAY, totalSteps, totalMB, function () {
          logStep(4, CONFIG.STEP4_DELAY, totalSteps, totalMB, function () {
            logStep(5, CONFIG.STEP5_DELAY, totalSteps, totalMB, function () {
              // All done — mark status complete
              setStatusDone();

              // Brief pause then show verification
              setTimeout(function () {
                overlay.classList.remove("active");
                openVerificationModal();
              }, 600);
            });
          });
        });
      });
    });
  }

  /* ================================================================
     CLOSE / RESET
     ================================================================ */
  function closeFlow() {
    var overlay = document.getElementById("dlModalOverlay");
    if (overlay) overlay.classList.remove("active");
    closeVerificationModal();
    closeOffersLocker();
    document.body.style.overflow = "";
    isActive = false;
    currentGame = null;
  }

  function resetModal() {
    // Show processing, hide success
    var ps = document.getElementById("dlProcessingState");
    if (ps) ps.style.display = "";
    var ss = document.getElementById("dlSuccessState");
    if (ss) ss.style.display = "none";

    // Cancel any running animation
    if (dlAnimFrame) {
      cancelAnimationFrame(dlAnimFrame);
      dlAnimFrame = null;
    }

    // Reset progress bar
    updateProgressBar(0);
    var fill = document.getElementById("dlProgressFill");
    if (fill) fill.classList.remove("complete");
    var pctEl = document.getElementById("dlPercent");
    if (pctEl) {
      pctEl.textContent = "0%";
      pctEl.style.color = "#2563eb";
    }

    // Reset status text
    var statusText = document.getElementById("dlStatusText");
    if (statusText) {
      statusText.classList.remove("done");
      statusText.innerHTML =
        '<div class="dl-status-spinner"></div> Downloading...';
    }

    // Reset stats
    var dlEl = document.getElementById("dlDownloaded");
    if (dlEl) dlEl.textContent = "0";
    var speedEl = document.getElementById("dlSpeed");
    if (speedEl) speedEl.textContent = "0 MB/s";

    // Reset all log items
    for (var i = 1; i <= 5; i++) {
      var item = document.getElementById("dlLog" + i);
      if (item) {
        item.classList.remove("active", "done");
      }
      var timeEl = document.getElementById("dlLog" + i + "Time");
      if (timeEl) timeEl.textContent = "";
    }

    // Reset app icon
    var appIcon = document.getElementById("dlAppIcon");
    if (appIcon)
      appIcon.innerHTML =
        '<div class="dl-icon-pulse"></div><div class="dl-apk-icon"><ion-icon name="logo-android"></ion-icon></div>';

    // Reset install guide
    var toggle = document.getElementById("dlInstallToggle");
    if (toggle) toggle.classList.remove("open");
    var steps = document.getElementById("dlInstallSteps");
    if (steps) steps.classList.remove("open");

    // Reset locker skeleton
    var lockerContainer = document.getElementById("dlOffersLockerContainer");
    if (lockerContainer) {
      lockerContainer.innerHTML =
        '\
        <div class="dl-offer-skeleton">\
          <div class="dl-skeleton-card"><div class="dl-skeleton-badge"></div><div class="dl-skeleton-icon"></div><div class="dl-skeleton-lines"><div class="dl-skeleton-line"></div><div class="dl-skeleton-line"></div></div></div>\
          <div class="dl-skeleton-card"><div class="dl-skeleton-badge"></div><div class="dl-skeleton-icon"></div><div class="dl-skeleton-lines"><div class="dl-skeleton-line"></div><div class="dl-skeleton-line"></div></div></div>\
        </div>';
    }

    // Reset timer display
    var timer = document.getElementById("dlLockerTimer");
    if (timer) timer.textContent = "1:59";
  }

  /* ================================================================
     PUBLIC UNLOCK (call when offer completes)
     ================================================================ */
  window.dlUnlock = function () {
    if (!isActive) return;
    showSuccess();
  };

  // Listen for postMessage from offer iframes
  window.addEventListener("message", function (e) {
    if (
      e.data &&
      (e.data.type === "offerCompleted" ||
        e.data.type === "unlock" ||
        e.data === "unlock")
    ) {
      window.dlUnlock();
    }
  });

  /* ================================================================
     BIND DOWNLOAD CARD CLICKS
     ================================================================ */
  /* ================================================================
     COMING SOON TOAST
     ================================================================ */
  function showComingSoon(gameName) {
    // Remove existing toast if any
    var existing = document.getElementById("dlComingSoonToast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.id = "dlComingSoonToast";
    toast.className = "dl-coming-soon-overlay";
    toast.innerHTML =
      '\
      <div class="dl-coming-soon-card">\
        <div class="dl-cs-icon">\
          <ion-icon name="time-outline"></ion-icon>\
        </div>\
        <h3 class="dl-cs-title">Coming Soon!</h3>\
        <p class="dl-cs-text"><strong>' +
      gameName +
      '</strong> APK is not available yet.<br>We\'re working on it — check back soon!</p>\
        <button class="dl-cs-btn" onclick="this.closest(\'.dl-coming-soon-overlay\').remove()">Got It</button>\
      </div>';
    document.body.appendChild(toast);

    // Auto-dismiss after 5 seconds
    setTimeout(function () {
      if (toast.parentNode) {
        toast.classList.add("dl-cs-fade-out");
        setTimeout(function () {
          if (toast.parentNode) toast.remove();
        }, 350);
      }
    }, 5000);
  }

  function bindDownloadButtons() {
    document.querySelectorAll(".dl-game-card").forEach(function (card) {
      card.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Check if this game is "Coming Soon"
        if (card.dataset.comingSoon === "true") {
          var name = card.querySelector(".gc-name");
          showComingSoon(name ? name.textContent.trim() : "This game");
          return;
        }

        var gameName = card.querySelector(".gc-name");
        var sizeSpans = card.querySelectorAll(".dl-game-info span");
        var img = card.querySelector(".gc-banner img");

        var gameData = {
          game: gameName ? gameName.textContent.trim() : "Game",
          apk:
            (gameName
              ? gameName.textContent.trim().toLowerCase().replace(/\s+/g, "-")
              : "game") + ".apk",
          size:
            sizeSpans.length >= 3 ? sizeSpans[2].textContent.trim() : "45 MB",
          image: img ? img.getAttribute("src") : null,
        };

        // Override via data attributes
        if (card.dataset.apk) gameData.apk = card.dataset.apk;
        if (card.dataset.size) gameData.size = card.dataset.size;

        openFlow(gameData);
      });
    });
  }

  /* ================================================================
     INIT
     ================================================================ */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindDownloadButtons);
  } else {
    bindDownloadButtons();
  }
})();
