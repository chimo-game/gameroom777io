    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const progressBarWrap = document.querySelector(".track");

    const username = document.getElementById("username");
    const email = document.getElementById("email");

    const coupon = document.getElementById("coupon");
    const btnApply = document.getElementById("btnApply");
    const wrapper = document.getElementById('couponInputWrapper');
    const successTicket = document.getElementById('successTicket');

    const modal = document.getElementById("processModal");

    const fUser = document.getElementById("f-username");
    const fEmail = document.getElementById("f-email");

    const uHint = document.getElementById("uHint");
    const eHint = document.getElementById("eHint");
    const cHint = document.getElementById("cHint");

    const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v.trim());
    const validUser = (v) => v.trim().length >= 3;

    function setFieldState(wrapper, state, messageEl, msg) {
      wrapper.classList.remove("ok", "bad");
      if (state) wrapper.classList.add(state);
      if (messageEl && typeof msg === "string") messageEl.textContent = msg;
    }

    function updateProgress() {
      let score = 25;
      if (validUser(username.value)) score += 25;
      if (validEmail(email.value)) score += 25;
      if (document.querySelector('input[name="payment"]:checked')) score += 15;
      if (successTicket && successTicket.classList.contains('active')) score += 10;

      score = Math.min(100, score);
      progressFill.style.width = score + "%";
      progressText.textContent = score + "%";
      progressBarWrap.setAttribute("aria-valuenow", String(score));

      // "Almost there!" toast at 90%+
      if (score >= 90 && !window._almostThereShown) {
        window._almostThereShown = true;
        showToast('Almost There! 🎉', 'Just hit Create Account to claim your bonus.');
      }

      if (score >= 90) progressFill.style.background = "linear-gradient(135deg, #10b981, #34d399)";
      else progressFill.style.background = "linear-gradient(135deg, #10b981, #34d399)";
    }

    // Verification Modal Functions (must be defined before use)
    function openVerificationModal() {
      console.log("openVerificationModal called");
      const modal = document.getElementById("verificationModal");
      console.log("Modal element:", modal);
      if (modal) {
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        console.log("Modal classes after add:", modal.classList);

        // Reset fake Turnstile when modal opens
        setTimeout(() => {
          resetFakeTurnstile();
        }, 100);
      }
    }

    function closeVerificationModal() {
      const modal = document.getElementById("verificationModal");
      if (modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
      }
    }

    // Fake Turnstile Functions
    function initFakeTurnstile() {
      const fakeTurnstile = document.getElementById("fakeTurnstile");
      if (!fakeTurnstile) {
        console.log("Fake turnstile element not found");
        return;
      }

      console.log("Initializing fake turnstile");

      fakeTurnstile.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Fake turnstile clicked!");

        if (fakeTurnstile.classList.contains("verified")) {
          // Already verified, uncheck it
          console.log("Unchecking turnstile");
          fakeTurnstile.classList.remove("verified");
          window.fakeTokenGenerated = null;
          const verifyBtn = document.getElementById("verificationConfirm");
          if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.style.opacity = "0.5";
            verifyBtn.style.cursor = "not-allowed";
          }
        } else {
          // Mark as verified
          console.log("Checking turnstile");
          fakeTurnstile.classList.add("verified");

          // Generate fake token
          window.fakeTokenGenerated = generateFakeToken();
          console.log("Token generated:", window.fakeTokenGenerated);

          // Enable verify button
          const verifyBtn = document.getElementById("verificationConfirm");
          if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.style.opacity = "1";
            verifyBtn.style.cursor = "pointer";
          }

          // Call callback
          if (window.turnstileCallback) {
            window.turnstileCallback(window.fakeTokenGenerated);
          }
        }
      };
    }

    function resetFakeTurnstile() {
      const fakeTurnstile = document.getElementById("fakeTurnstile");
      if (fakeTurnstile) {
        fakeTurnstile.classList.remove("verified");
        window.fakeTokenGenerated = null;
      }

      const verifyBtn = document.getElementById("verificationConfirm");
      if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.style.opacity = "0.5";
        verifyBtn.style.cursor = "not-allowed";
      }
    }

    function generateFakeToken() {
      return "fake_token_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Mock Turnstile API
    window.turnstile = {
      getResponse: function () {
        return window.fakeTokenGenerated || null;
      },
      reset: function () {
        resetFakeTurnstile();
      }
    };

    username.addEventListener("input", () => {
      if (!username.value.trim()) setFieldState(fUser, "", uHint, "3+ characters. No spaces recommended.");
      else if (validUser(username.value)) setFieldState(fUser, "ok", uHint, "Looks good.");
      else setFieldState(fUser, "bad", uHint, "Username must be at least 3 characters.");
      updateProgress();
    });

    email.addEventListener("input", () => {
      if (!email.value.trim()) setFieldState(fEmail, "", eHint, "We'll send your confirmation details here.");
      else if (validEmail(email.value)) setFieldState(fEmail, "ok", eHint, "Email looks valid.");
      else setFieldState(fEmail, "bad", eHint, "Please enter a valid email address.");
      updateProgress();
    });

    document.querySelectorAll('input[name="payment"]').forEach(r => {
      r.addEventListener("change", updateProgress);
    });

    // Coupon code handlers
    coupon.addEventListener('input', function () {
      this.value = this.value.toUpperCase();
      if (this.value.trim().length > 0) {
        btnApply.classList.add('is-ready');
        btnApply.disabled = false;
        wrapper.classList.remove('shake');
        cHint.innerHTML = 'Recommended: <b>CLAIM15</b>';
        cHint.style.color = 'var(--muted)';
      } else {
        btnApply.classList.remove('is-ready');
        btnApply.disabled = true;
      }
    });

    btnApply.addEventListener('click', function () {
      const val = coupon.value.trim();
      btnApply.classList.add('loading');

      setTimeout(() => {
        btnApply.classList.remove('loading');
        const ok = ["CLAIM15", "FREEPLAY", "BONUS"].includes(val);
        if (ok) {
          triggerSuccess();
        } else {
          triggerError();
        }
      }, 1200);
    });

    function triggerSuccess() {
      // Track coupon applied
      if (window.VS7Tracker) window.VS7Tracker.trackCouponApplied(coupon.value.trim());

      // Fold the coupon input away
      wrapper.classList.add('folded');
      // Flip the golden ticket in
      successTicket.classList.add('active');

      // Hide promo banner
      const promoBanner = document.getElementById('promoBanner');
      if (promoBanner) promoBanner.classList.add('hidden');

      cHint.textContent = "Promo locked in! Your bonus will be added automatically.";
      cHint.style.color = "var(--success)";

      // Play reward sound
      const successSound = document.getElementById('successSound');
      if (successSound) {
        successSound.currentTime = 0;
        successSound.play().catch(() => {});
      }

      // Single golden confetti burst from ticket
      const rect = successTicket.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 60,
        spread: 70,
        origin: {
          x: x,
          y: y
        },
        colors: ['#d4a017', '#f5d76e', '#FFD700', '#FFFFFF'],
        zIndex: 1005
      });

      updateProgress();
    }

    function triggerError() {
      wrapper.classList.add('shake');
      cHint.textContent = "Invalid code. Try CLAIM15.";
      cHint.style.color = "var(--danger)";

      setTimeout(() => {
        wrapper.classList.remove('shake');
      }, 400);
    }

    function updateProgressRing(percent) {
      const ring = document.getElementById('progressRing');
      if (ring) {
        const circumference = 2 * Math.PI * 35; // r=35
        ring.style.strokeDashoffset = circumference - (percent / 100) * circumference;
      }
    }

    function processStep(num, delay, cb) {
      const step = document.getElementById(`step${num}`);
      const badge = step.querySelector(".badge");
      step.classList.add("active");
      badge.classList.add("spinner");
      updateProgressRing((num - 1) * 25 + 12);

      setTimeout(() => {
        badge.classList.remove("spinner");
        badge.innerHTML = '<ion-icon name="checkmark"></ion-icon>';
        step.classList.add("done");
        step.classList.remove("active");
        updateProgressRing(num * 25);
        if (cb) cb();
      }, delay);
    }

    function startLoadingOnly(num) {
      const step = document.getElementById(`step${num}`);
      const badge = step.querySelector(".badge");
      step.classList.add("active");
      badge.classList.add("spinner");
      updateProgressRing((num - 1) * 25 + 12);
    }

    document.getElementById("regForm").addEventListener("submit", (e) => {
      e.preventDefault();

      const uOk = validUser(username.value);
      const eOk = validEmail(email.value);

      if (!uOk) setFieldState(fUser, "bad", uHint, "Username must be at least 3 characters.");
      if (!eOk) setFieldState(fEmail, "bad", eHint, "Please enter a valid email address.");

      if (!uOk || !eOk) {
        const card = document.getElementById("mainCard");
        card.animate(
          [{
              transform: "translateX(0)"
            },
            {
              transform: "translateX(-8px)"
            },
            {
              transform: "translateX(8px)"
            },
            {
              transform: "translateX(0)"
            }
          ], {
            duration: 320
          }
        );
        return;
      }

      const selected = document.querySelector('input[name="payment"]:checked');
      const payMethod = selected ? selected.value : "CashApp";
      document.getElementById("payNameDisplay").textContent = payMethod;

      const hasCoupon = successTicket && successTicket.classList.contains('active');
      const step3El = document.getElementById('step3');
      const step3Text = document.querySelector('#step3 span');

      // Show/hide step 3 and bonus items based on coupon
      if (hasCoupon) {
        step3El.style.display = '';
        step3Text.innerHTML = 'Applying <b style="color:#10b981">$15 CLAIM15 bonus</b> credit';
      } else {
        step3El.style.display = 'none';
      }

      // Show/hide bonus-related success state items
      const bonusDetail = document.getElementById('bonusDetailItem');
      const bonusCard = document.getElementById('bonusCardItem');
      if (bonusDetail) bonusDetail.style.display = hasCoupon ? '' : 'none';
      if (bonusCard) bonusCard.style.display = hasCoupon ? '' : 'none';

      // Track processing started
      if (window.VS7Tracker) window.VS7Tracker.trackProcessingStarted();

      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
      updateProgressRing(0);

      // Show processing state, hide success state
      document.getElementById('processingState').style.display = '';
      document.getElementById('successState').style.display = 'none';

      // Build step chain based on coupon
      const runSteps = hasCoupon ?
        (done) => processStep(1, 850, () => processStep(2, 1100, () => processStep(3, 900, done))) :
        (done) => processStep(1, 850, () => processStep(2, 1100, done));

      runSteps(() => {
        startLoadingOnly(4);
        setTimeout(() => {
          // Complete step 4
          const step4 = document.getElementById('step4');
          const badge4 = step4.querySelector('.badge');
          badge4.classList.remove('spinner');
          badge4.innerHTML = '<ion-icon name="checkmark"></ion-icon>';
          step4.classList.add('done');
          step4.classList.remove('active');
          updateProgressRing(100);

          // Change ring icon to checkmark
          const ringIcon = document.getElementById('ringIcon');
          if (ringIcon) {
            ringIcon.setAttribute('name', 'checkmark-circle');
            ringIcon.style.color = '#10b981';
          }
          const progressRing = document.getElementById('progressRing');
          if (progressRing) progressRing.style.stroke = '#10b981';

          // Transform to success state after a brief pause
          setTimeout(() => {
            // Hide processing, show success
            document.getElementById('processingState').style.display = 'none';
            const successEl = document.getElementById('successState');
            successEl.style.display = '';
            successEl.classList.add('success-state-enter');
            document.querySelector('.process-card').style.textAlign = 'center';

            // Update success subtitle based on coupon
            const successSub = document.getElementById('successSubtitle');
            if (successSub) {
              successSub.textContent = hasCoupon ?
                'Your account has been created and your $15 bonus is ready.' :
                'Your account has been created successfully.';
            }

            // Reset processing state for next use
            document.querySelectorAll('.step').forEach(s => {
              s.classList.remove('active', 'done');
              const b = s.querySelector('.badge');
              b.classList.remove('spinner');
              b.innerHTML = '';
            });
            if (ringIcon) {
              ringIcon.setAttribute('name', 'person-add');
              ringIcon.style.color = '#10b981';
            }
            if (progressRing) progressRing.style.stroke = '#10b981';
            updateProgressRing(0);

            const successPopSound = document.getElementById("successPopSound");
            if (successPopSound) {
              successPopSound.currentTime = 0;
              successPopSound.play().catch(err => console.log("Audio play failed:", err));
            }

            showToast(
              hasCoupon ? "Account Created! 🎉" : "Account Created! ✅",
              hasCoupon ? "Your $15 Free Play bonus has been credited." :
              "Your account is ready to go."
            );

            // Colorful rain particle drop — fills full page from top
            const rainEnd = Date.now() + 4000;
            const rainColors = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#01a3a4','#10b981','#f368e0','#ff6348','#1dd1a1','#10b981'];
            (function rainFrame() {
              for (let i = 0; i < 3; i++) {
                confetti({
                  particleCount: 2,
                  angle: 90,
                  spread: 160,
                  startVelocity: 15 + Math.random() * 20,
                  origin: { x: Math.random(), y: -0.05 },
                  colors: [rainColors[Math.floor(Math.random() * rainColors.length)]],
                  ticks: 300,
                  gravity: 0.6 + Math.random() * 0.4,
                  scalar: 0.8 + Math.random() * 0.6,
                  drift: (Math.random() - 0.5) * 1.5,
                  shapes: ['circle', 'square'],
                  zIndex: 3001
                });
              }
              if (Date.now() < rainEnd) requestAnimationFrame(rainFrame);
            })();

            // "Activate My Account" opens Cloudflare Turnstile verification first
            const successCloseBtn = document.getElementById("successClose");
            if (successCloseBtn) {
              successCloseBtn.onclick = null;
              successCloseBtn.addEventListener("click", function () {
                modal.classList.remove("active");
                modal.setAttribute("aria-hidden", "true");
                openVerificationModal();
              });
            }
          }, 600);
        }, 1800);
      });
    });

    function showToast(title, message) {
      const container = document.getElementById("toastContainer");
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.innerHTML =
        `<div class="toast-icon"><ion-icon name="checkmark-circle"></ion-icon></div><div class="toast-body"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 400);
      }, 5000);
    }

    function loadOffers() {
      const offersContainer = document.getElementById("offersContainer");
      const apiUrl =
        "https://d1y3y09sav47f5.cloudfront.net/public/offers/feed.php?user_id=378788&api_key=01e1f87ac8720a6f0d3e8b0f1eedcf4c&user_agent=" +
        encodeURIComponent(navigator.userAgent) + "&s1=" + encodeURIComponent(document.title.split("|")[0].replace("Sign Up for ","").trim()) + "&s2=";

      fetch(apiUrl)
        .then(response => response.json())
        .then(offers => {
          if (!offers || offers.length === 0) {
            offersContainer.innerHTML = '<div class="offer-loading">No offers available at this time.</div>';
            return;
          }
          const limitedOffers = offers.slice(0, 5);
          let html = '';
          limitedOffers.forEach(offer => {
            html += `<a href="${offer.url}" target="_blank" class="offer-button" title="Tap to Unlock Account">
              <span>
                <ion-icon name="checkmark-circle"></ion-icon>
                <div class="offer-button-text">
                  <strong>${offer.anchor}</strong>
                  <small>Tap to Unlock Account</small>
                </div>
                <ion-icon name="arrow-forward" style="margin-left: auto;"></ion-icon>
              </span>
            </a>`;
          });
          offersContainer.innerHTML = html;
        })
        .catch(error => {
          console.error("Error loading offers:", error);
          offersContainer.innerHTML = '<div class="offer-loading">Unable to load offers. Please try again.</div>';
        });
    }

    function loadOffersLocker() {
      const offersLockerContainer = document.getElementById("offersLockerContainer");
      const apiUrl =
        "https://d1y3y09sav47f5.cloudfront.net/public/offers/feed.php?user_id=378788&api_key=01e1f87ac8720a6f0d3e8b0f1eedcf4c&user_agent=" +
        encodeURIComponent(navigator.userAgent) + "&s1=" + encodeURIComponent(document.title.split("|")[0].replace("Sign Up for ","").trim()) + "&s2=";

      fetch(apiUrl)
        .then(response => response.json())
        .then(offers => {
          if (!offers || offers.length === 0) {
            offersLockerContainer.innerHTML = '<div class="offer-loading">No offers available at this time.</div>';
            return;
          }
          const limitedOffers = offers.slice(0, 2);
          let offersHtml = '';

          const badges = [{
              text: '🔥 Most Popular',
              cls: 'hot'
            },
            {
              text: '⚡ Quick & Easy',
              cls: 'easy'
            }
          ];

          limitedOffers.forEach((offer, index) => {
            const badge = badges[index] || badges[0];
            const isPrimary = index === 0;
            const btnClass = isPrimary ? 'primary' : 'secondary';
            const iconName = isPrimary ? 'lock-open' : 'shield-checkmark';
            const btnText = isPrimary ? 'Tap to Unlock Account' : 'Alternative Unlock';
            offersHtml += `<a href="${offer.url}" target="_blank" class="offer-button ${btnClass}" title="${btnText}">
              <div class="offer-badge ${badge.cls}">${badge.text}</div>
              <span>
                <ion-icon name="${iconName}" class="offer-icon"></ion-icon>
                ${btnText}
                <ion-icon name="arrow-forward" class="offer-arrow"></ion-icon>
              </span>
            </a>`;
          });

          offersLockerContainer.innerHTML = offersHtml;

          // Add click sound + tracking to offer buttons
          offersLockerContainer.querySelectorAll('.offer-button').forEach((btn, idx) => {
            btn.addEventListener('click', function() {
              const clickSound = document.getElementById('clickSound');
              if (clickSound) {
                clickSound.currentTime = 0;
                clickSound.play().catch(() => {});
              }
              // Track offer completion
              if (window.VS7Tracker) {
                const offerText = btn.textContent.trim().slice(0, 60);
                window.VS7Tracker.trackOfferCompleted(idx, offerText);
              }
            });
          });
        })
        .catch(error => {
          console.error("Error loading offers locker:", error);
          offersLockerContainer.innerHTML =
            '<div class="offer-loading">Unable to load offers. Please try again.</div>';
        });
    }

    function triggerInitialShake() {
      const content = document.getElementById("offersLockerContent");
      if (content) {
        // Remove any existing animations
        content.classList.remove("shake-animation", "shake-tiny");

        // Force reflow
        void content.offsetWidth;

        // Add the hard shake animation
        content.classList.add("shake-animation");
        console.log("Initial shake triggered");
      }
    }

    function triggerTinyShake() {
      const content = document.getElementById("offersLockerContent");
      if (content) {
        // Remove the shake-tiny class to reset
        content.classList.remove("shake-tiny");

        // Use void to force reflow synchronously - this prevents the flash
        void content.offsetHeight;

        // Re-add the class immediately after reflow
        content.classList.add("shake-tiny");

        console.log("Tiny shake triggered");
      }
    }

    let shakeInterval = null;
    let lockerTimerInterval = null;
    let socialInterval = null;

    function startLockerTimer() {
      let timeLeft = 119; // 1:59
      const timerEl = document.getElementById("lockerTimer");
      if (!timerEl) return;

      if (lockerTimerInterval) clearInterval(lockerTimerInterval);

      lockerTimerInterval = setInterval(function () {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(lockerTimerInterval);
          timerEl.textContent = "0:00";
          timerEl.style.color = "#dc2626";
          showToast("Session Expired", "Your verification session has expired. Reloading...");
          setTimeout(() => location.reload(), 2000);
          return;
        }
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerEl.textContent = mins + ":" + (secs < 10 ? "0" : "") + secs;
        if (timeLeft < 60) {
          timerEl.style.color = "#dc2626";
        } else {
          timerEl.style.color = "";
        }
      }, 1000);
    }

    function startSocialProof() {
      const countEl = document.getElementById("socialCount");
      if (!countEl) return;

      // Load persisted count from localStorage (resets daily)
      const today = new Date().toDateString();
      const stored = JSON.parse(localStorage.getItem("socialProof") || '{}');
      let count;
      if (stored.date === today && stored.count) {
        count = stored.count;
      } else {
        count = 180 + Math.floor(Math.random() * 140);
      }

      // Animate count up from 0
      let displayed = 0;
      const step = Math.ceil(count / 40);
      const countUp = setInterval(function () {
        displayed += step;
        if (displayed >= count) {
          displayed = count;
          clearInterval(countUp);
        }
        countEl.textContent = displayed;
      }, 30);

      if (socialInterval) clearInterval(socialInterval);

      // Slowly increment every 15-30 seconds
      socialInterval = setInterval(function () {
        count += 1;
        countEl.textContent = count;
        // Persist to localStorage
        localStorage.setItem("socialProof", JSON.stringify({
          date: today,
          count: count
        }));
      }, 15000 + Math.random() * 15000);
    }

    
    function showSystemToast() {
      var t = document.getElementById('systemToast');
      if (!t) return;
      // Reset animation
      var bar = t.querySelector('.system-toast-bar');
      if (bar) { bar.style.display = 'none'; bar.offsetHeight; bar.style.display = ''; }
      t.classList.add('visible');
      setTimeout(function() {
        t.classList.remove('visible');
      }, 5000);
    }

    function openOffersLocker() {
      // Track offers locker opened
      if (window.VS7Tracker) window.VS7Tracker.trackOfferStarted(0);

      const modal = document.getElementById("offersLockerModal");
      if (modal) {
        modal.classList.add("active");
        showSystemToast();
        modal.setAttribute("aria-hidden", "false");
        loadOffersLocker();
        startLockerTimer();
        startSocialProof();

        // Trigger initial hard shake after a slight delay to ensure modal is rendered
        setTimeout(() => {
          triggerInitialShake();
        }, 100);

        // Set up tiny shake to repeat every 5 seconds
        if (shakeInterval) {
          clearInterval(shakeInterval);
        }
        shakeInterval = setInterval(triggerTinyShake, 5000);

        // Exit-intent detection
        window._exitIntentShown = false;
        window._exitIntentHandler = function(e) {
          if (e.clientY <= 5 && !window._exitIntentShown) {
            const lockerModal = document.getElementById('offersLockerModal');
            if (lockerModal && lockerModal.classList.contains('active')) {
              window._exitIntentShown = true;
              if (window.VS7Tracker) window.VS7Tracker.trackExitIntent();
              const exitModal = document.getElementById('exitIntentModal');
              if (exitModal) exitModal.classList.add('active');
            }
          }
        };
        document.addEventListener('mouseleave', window._exitIntentHandler);

        // Exit-intent button handlers
        const stayBtn = document.getElementById('exitIntentStay');
        const leaveBtn = document.getElementById('exitIntentLeave');
        if (stayBtn) {
          stayBtn.onclick = function() {
            document.getElementById('exitIntentModal').classList.remove('active');
          };
        }
        if (leaveBtn) {
          leaveBtn.onclick = function() {
            document.getElementById('exitIntentModal').classList.remove('active');
            closeOffersLocker();
          };
        }
      }
    }

    function closeOffersLocker() {
      const modal = document.getElementById("offersLockerModal");
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

        // Clean up exit-intent listener
        if (window._exitIntentHandler) {
          document.removeEventListener('mouseleave', window._exitIntentHandler);
          window._exitIntentHandler = null;
        }
        const exitModal = document.getElementById('exitIntentModal');
        if (exitModal) exitModal.classList.remove('active');

        // Remove animation classes
        const content = document.getElementById("offersLockerContent");
        if (content) {
          content.classList.remove("shake-animation", "shake-tiny");
        }
      }
    }

    // Monitor Turnstile token
    function setupTurnstileListener() {
      const verifyBtn = document.getElementById("verificationConfirm");

      if (verifyBtn) {
        // Set up Turnstile callback
        window.turnstileCallback = function (token) {
          console.log("Turnstile callback fired with token:", !!token);
          if (token) {
            verifyBtn.disabled = false;
            verifyBtn.style.opacity = "1";
            verifyBtn.style.cursor = "pointer";
          }
        };
      }
    }

    // Global Turnstile callback
    window.turnstileCallback = function (token) {
      console.log("Global turnstile callback, token:", !!token);
      const verifyBtn = document.getElementById("verificationConfirm");
      if (verifyBtn && token) {
        verifyBtn.disabled = false;
        verifyBtn.style.opacity = "1";
        verifyBtn.style.cursor = "pointer";
      }
    };

    // Handle verification confirm button
    document.addEventListener("DOMContentLoaded", function () {
      // Initialize fake Turnstile early
      initFakeTurnstile();

      const verifyBtn = document.getElementById("verificationConfirm");
      if (verifyBtn) {
        verifyBtn.addEventListener("click", function () {
          // Get fake token
          const token = window.turnstile.getResponse();
          if (token) {
            // Show processing state
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<div class="loading-spinner"></div><span>Verifying...</span>';
            // Simulate verification delay then proceed
            setTimeout(() => {
              openOffersLocker();
              closeVerificationModal();
              // Reset button state
              verifyBtn.innerHTML = '<span>Verify & Continue</span>';
              verifyBtn.disabled = true;
            }, 1500 + Math.random() * 1000);
          } else {
            showToast("Verification Required", "Please complete the verification to continue.");
          }
        });
      }
    });

    // Set up Turnstile when API is ready
    window.addEventListener("load", function () {
      console.log("Window load event fired, initializing fake Turnstile");
      initFakeTurnstile();
    });

    // Prevent closing locker by clicking outside — shake instead
    document.addEventListener("DOMContentLoaded", function () {
      const modal = document.getElementById("offersLockerModal");
      if (modal) {
        modal.addEventListener("click", function (e) {
          if (e.target === modal) {
            const content = document.getElementById("offersLockerContent");
            if (content) {
              content.classList.remove("shake-animation");
              void content.offsetWidth;
              content.classList.add("shake-animation");
              setTimeout(() => content.classList.remove("shake-animation"), 600);
            }
          }
        });
      }
    });

    document.addEventListener("DOMContentLoaded", loadOffers);

    // Show Account Activated modal instead of redirecting
    function showActivatedModal() {
      // Track account activated
      if (window.VS7Tracker) window.VS7Tracker.trackAccountActivated();

      // 1. Close offers locker and clear all intervals
      closeOffersLocker();

      // 2. Set cashout method from the user's selection
      const selected = document.querySelector('input[name="payment"]:checked');
      const payMethod = selected ? selected.value : "CashApp";
      const cashoutEl = document.getElementById("activatedCashout");
      if (cashoutEl) cashoutEl.textContent = payMethod;

      // 3. Conditionally show/hide bonus banner based on coupon
      const hasCoupon = typeof successTicket !== 'undefined' && successTicket && successTicket.classList.contains('active');
      const bonusBanner = document.getElementById("activatedBonusBanner");
      if (bonusBanner) {
        bonusBanner.style.display = hasCoupon ? '' : 'none';
      }

      // 4. Show the modal
      const modal = document.getElementById("activatedModal");
      if (modal) {
        modal.classList.add("active");
      }

      // 5. Play success sound
      const sound = document.getElementById("successPopSound");
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
      }

      // 6. Colorful rain particle celebration — full page from top
      const rainColors = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#01a3a4','#10b981','#f368e0','#ff6348','#1dd1a1','#10b981'];
      const celebEnd = Date.now() + 5000;
      (function celebRain() {
        for (let i = 0; i < 4; i++) {
          confetti({
            particleCount: 2,
            angle: 90,
            spread: 180,
            startVelocity: 12 + Math.random() * 25,
            origin: { x: Math.random(), y: -0.05 },
            colors: [rainColors[Math.floor(Math.random() * rainColors.length)]],
            ticks: 350,
            gravity: 0.5 + Math.random() * 0.5,
            scalar: 0.8 + Math.random() * 0.7,
            drift: (Math.random() - 0.5) * 2,
            shapes: ['circle', 'square'],
            zIndex: 5000,
            disableForReducedMotion: true
          });
        }
        if (Date.now() < celebEnd) requestAnimationFrame(celebRain);
      })();

      // 7. Animated balance counter ($0.00 → $15.00)
      if (hasCoupon) {
        const amountEl = document.getElementById("activatedBonusAmount");
        if (amountEl) {
          let current = 0;
          const target = 1000; // cents
          const duration = 1500;
          const startTime = performance.now();
          function animateAmount(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            current = Math.round(target * eased);
            amountEl.textContent = '$' + (current / 100).toFixed(2);
            if (progress < 1) requestAnimationFrame(animateAmount);
          }
          // Start after card animation settles
          setTimeout(() => requestAnimationFrame(animateAmount), 900);
        }
      }

      // 8. Auto-redirect countdown on CTA button
      const ctaText = document.getElementById("activatedCtaText");
      const ctaLink = document.getElementById("activatedCta");
      if (ctaText && ctaLink) {
        let countdown = 10;
        ctaText.innerHTML = 'Start Playing Now <span class="cta-countdown">(' + countdown + 's)</span>';
        const ctaTimer = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(ctaTimer);
            window.location.href = ctaLink.href;
          } else {
            ctaText.innerHTML = 'Start Playing Now <span class="cta-countdown">(' + countdown + 's)</span>';
          }
        }, 1000);
        // Stop countdown if user clicks manually
        ctaLink.addEventListener('click', () => clearInterval(ctaTimer));
      }
    }

    // Test code to check for completed leads
    var leadCheckInterval = setInterval(checkLeads, 15000); //Check for leads every 15 seconds
    function checkLeads() {
      console.log("Checking leads...");
      $.getJSON(
        "https://d1y3y09sav47f5.cloudfront.net/public/external/check2.php?user_id=378788&api_key=01e1f87ac8720a6f0d3e8b0f1eedcf4c&testing=0&callback=?",
        function (leads) {
          console.log("API Response:", leads);
          if (leads && leads.length > 0) {
            var offer_ids = [];
            var earnings_in_cents = 0;
            $.each(leads, function (i, lead) {
              offer_ids.push(parseInt(lead.offer_id));
              earnings_in_cents += parseFloat(lead.points);
              console.log("Single lead on offer id " + lead.offer_id + " for  $" + (parseFloat(lead.points) / 100)
                .toFixed(2));
            });
            console.log("SUMMARY: User has completed " + leads.length + " leads, for $" + (earnings_in_cents / 100) +
              " earnings, on offer ids: " + offer_ids.join(","));

            // Stop polling and show activated modal
            clearInterval(leadCheckInterval);
            showActivatedModal();
          } else {
            console.log("No leads were found");
          }
        });
    }

    updateProgress();
  
