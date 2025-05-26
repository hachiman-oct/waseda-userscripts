// ==UserScript==
// @name         Moodle Smoother
// @namespace    https://github.com/hachiman-oct/
// @version      1.1.0
// @description  Refactored version with modular settings and function mapping
// @match        https://wsdmoodle.waseda.jp/*
// @icon         https://raw.githubusercontent.com/hachiman-oct/waseda-userscripts/main/moodle/moodle-smoother-icon.svg
// @updateURL    https://raw.githubusercontent.com/hachiman-oct/waseda-userscripts/main/moodle/moodle-smoother.user.js
// @downloadURL  https://raw.githubusercontent.com/hachiman-oct/waseda-userscripts/main/moodle/moodle-smoother.user.js
// @license      MIT
// @resource     externalCSS https://raw.githubusercontent.com/hachiman-oct/waseda-userscripts/main/moodle/style.css
// @grant        GM_getResourceText
// @resource     moodleLogo https://moodle.org/theme/moodleorg/pix/moodle_logo_TM.svg
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(() => {
  // moodle/features/changeHeader.js
  function changeHeader(qs, GM_getResourceURL2) {
    const moodleLogo = GM_getResourceURL2("moodleLogo");
    const primaryNavigation = qs(".primary-navigation");
    const brandLogo = qs(".navbar-brand");
    const brandLogoImg = brandLogo.querySelector("img");
    [primaryNavigation, brandLogoImg].forEach((el) => {
      el.style.display = "none";
    });
    const dashboardLink = document.createElement("a");
    dashboardLink.href = "https://wsdmoodle.waseda.jp/my/courses.php";
    const logoSvg = document.createElement("img");
    logoSvg.src = moodleLogo;
    logoSvg.id = "moodle-logo";
    qs(".container-fluid").insertBefore(dashboardLink, primaryNavigation);
    dashboardLink.appendChild(logoSvg);
    const logoEl = qs("#moodle-logo");
    logoEl.removeAttribute("width");
    logoEl.removeAttribute("height");
    logoEl.style.width = "100px";
    logoEl.style.height = "25px";
  }

  // moodle/features/hideUnusedLink.js
  function hideUnusedLink(qs) {
    const pageNaviBar = qs("#page-navbar");
    if (pageNaviBar) {
      [1, 2, 3, 4].forEach((num) => {
        const li = pageNaviBar.querySelector(`li:nth-child(${num})`);
        if (li) {
          li.style.display = "none";
        }
      });
    }
  }

  // moodle/features/videoMonitor.js
  function monitorVideo(video, onComplete, onStop) {
    if (!video) return;
    let ended = false;
    let observer;
    function handleEnded() {
      if (!ended) {
        ended = true;
        if (onComplete) onComplete();
        cleanup();
      }
    }
    function handlePause() {
      if (!ended && video.currentTime < video.duration) {
        if (onStop) onStop("\u52D5\u753B\u304C\u9014\u4E2D\u3067\u505C\u6B62\u3057\u307E\u3057\u305F");
        cleanup();
      }
    }
    function cleanup() {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("pause", handlePause);
      if (observer) observer.disconnect();
    }
    video.addEventListener("ended", handleEnded);
    video.addEventListener("pause", handlePause);
    observer = new MutationObserver(() => {
      if (!document.body.contains(video)) {
        if (!ended && onStop) onStop("\u52D5\u753B\u8981\u7D20\u304C\u524A\u9664\u3055\u308C\u307E\u3057\u305F");
        cleanup();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // moodle/features/moodleDlBtn.js
  function moodleDlBtn() {
    const isCoursePage = window.location.href.includes("https://wsdmoodle.waseda.jp/course/view.php");
    if (!isCoursePage) return;
    let activitiesToObserve = [];
    let shouldPause = false;
    let shouldResume = false;
    const btnCss = `
        .btn {
            color: #1d2125;
            background-color: #fff;
            border-color: #ced4da;
            min-height: 32px;
            font-weight: 700;
            border-radius: .5rem;
        }
        .btn-complete {
            background-color: #d7e4d6;
            border-color: #d7e4d6;
            color: #1c3f1a;
        }
    `;
    const btnContainerClassList = ["activity", "activity-item"];
    const dlBtnClassList = [
      "btn",
      "btn-outline-secondary",
      "btn-sm",
      "text-nowrap",
      "activity-completion"
    ];
    const dlBtnCompleteClassList = [
      "btn",
      "btn-outline-secondary",
      "btn-sm",
      "text-nowrap",
      "activity-completion",
      "btn-success",
      "btn-complete"
    ];
    const dlBtnId = "dlbtn";
    const dlBtnCompleteId = "dlbtn-complete";
    const dlBtnText = "Download all uncompleted files in this section";
    const dlBtnCompleteText = "All files downloaded!";
    const secs = document.querySelectorAll(".course-content .course-section");
    secs.forEach((sec) => {
      displayBtn(sec);
    });
    observeBtnChanges();
    function displayBtn(section) {
      let links = [];
      let actsHasResource = [];
      const acts = section.querySelectorAll(".activity");
      acts.forEach((act) => {
        if (!hasResourceLink(act) || hasToggleBtn(act)) return;
        const isCompleted = isActivityCompleted(act);
        const link = act.querySelector("a");
        actsHasResource.push(act);
        if (isCompleted || !link) return;
        links.push(link);
      });
      if (actsHasResource.length === 0) return;
      activitiesToObserve.push(actsHasResource);
      const skipDl = links.length === 0;
      const oldbtn = section.querySelector("#dlbtn-container");
      if (oldbtn) oldbtn.remove();
      const btnContainer = document.createElement("div");
      btnContainer.id = "dlbtn-container";
      btnContainer.style.textAlign = "right";
      if (btnContainerClassList.length > 0) btnContainer.classList.add(...btnContainerClassList);
      const dlBtn = document.createElement("button");
      const btnId = skipDl ? dlBtnCompleteId : dlBtnId;
      if (btnId) dlBtn.id = btnId;
      const targetClassList = skipDl ? dlBtnCompleteClassList : dlBtnClassList;
      if (targetClassList.length > 0) dlBtn.classList.add(...targetClassList);
      const text = skipDl ? dlBtnCompleteText : dlBtnText;
      if (text) dlBtn.textContent = text;
      const target = section.querySelector(".sectionbody") || section.querySelector(".content");
      if (target) {
        target.insertBefore(btnContainer, target.firstChild);
      }
      btnContainer.appendChild(dlBtn);
      const style = document.createElement("style");
      style.textContent = btnCss;
      document.head.appendChild(style);
      if (skipDl) return;
      dlBtn.addEventListener("click", async () => {
        shouldPause = true;
        for (const link of links) {
          window.location.href = link.href;
          clickCompleteBtn(link);
          await delay(3e3);
        }
        const newBtn = dlBtn.cloneNode(true);
        newBtn.textContent = dlBtnCompleteText;
        newBtn.classList.add(...dlBtnCompleteClassList);
        dlBtn.replaceWith(newBtn);
        shouldResume = true;
        resumeObserver(activitiesToObserve);
      });
    }
    function hasResourceLink(el) {
      const modLink = el.querySelector("a");
      if (!modLink) return false;
      const onclickValue = modLink.getAttribute("onclick");
      if (onclickValue) return false;
      return modLink.href.includes("mod/resource");
    }
    function isActivityCompleted(el) {
      if (!el || !(el instanceof Element)) return false;
      const btnSuccess = el.querySelector(".btn-success");
      return btnSuccess !== null;
    }
    function hasToggleBtn(el) {
      const btn = el.querySelector("button");
      if (!btn) return false;
      return btn.dataset.action == "toggle-manual-completion";
    }
    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    function observeBtnChanges() {
      const observerConfig = { childList: true, subtree: true };
      const observer = new MutationObserver((mutationsList) => {
        if (shouldPause) return;
        for (const mutation of mutationsList) {
          const act = mutation.target;
          const section = act.closest(".course-section");
          if (!section) return;
          displayBtn(section);
        }
      });
      const flatActivities = activitiesToObserve.filter((section) => Array.isArray(section)).flat();
      flatActivities.forEach((act) => {
        observer.observe(act, observerConfig);
      });
    }
    function resumeObserver() {
      if (shouldResume) {
        shouldPause = false;
        shouldResume = false;
        observeBtnChanges();
      }
    }
    function clickCompleteBtn(el) {
      const act = el.closest(".activity-grid");
      const btn = act?.querySelector("button");
      if (!btn) return;
      const isSuccess = btn.classList.contains("btn-success");
      if (!isSuccess) btn.click();
    }
  }

  // moodle/moodle-smoother.user.js
  (async function() {
    "use strict";
    const qs = (sel) => document.querySelector(sel);
    const qsa = (sel) => document.querySelectorAll(sel);
    const SETTINGS = {
      autoClickLogin: { label: "Automatically click the login button", default: false },
      setHomeDashboard: { label: "Set the dashboard as the home page", default: false },
      changeHeader: { label: "Change the header to only link to the dashboard", default: false },
      hideUnusedLink: { label: "Hide unnecessary links", default: false },
      hideEmptySections: { label: "Hide empty sections", default: false },
      moodleDlBtn: { label: "Add a button to download all files", default: false },
      hideEmptyCourseIndex: { label: "Hide empty course index", default: false },
      alertVideoStatus: { label: "Alert Video Status", default: false }
    };
    const FEATURE_FUNCTIONS = {
      autoClickLogin,
      setHomeDashboard,
      changeHeader: () => changeHeader(qs, GM_getResourceURL),
      hideUnusedLink: () => hideUnusedLink(qs),
      hideEmptySections,
      moodleDlBtn,
      // ← ここを直接参照
      hideEmptyCourseIndex,
      alertVideoStatus
    };
    const currentValues = {};
    await Promise.all(Object.keys(SETTINGS).map(async (key) => {
      const value = await GM_getValue(key);
      currentValues[key] = value !== void 0 ? value : SETTINGS[key].default;
    }));
    const tempValues = { ...currentValues };
    const css = GM_getResourceText("externalCSS");
    const style = document.createElement("style");
    style.textContent = css;
    console.log(css);
    document.head.appendChild(style);
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "\u2699\uFE0FSettings";
    toggleButton.className = "settings-toggle-btn";
    document.body.appendChild(toggleButton);
    const panel = document.createElement("div");
    panel.className = "settings-panel";
    const title = document.createElement("div");
    title.textContent = "\u2699\uFE0F Userscript settings";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    panel.appendChild(title);
    const checkboxMap = {};
    for (const key in SETTINGS) {
      const label = document.createElement("label");
      label.style.display = "block";
      label.style.marginBottom = "6px";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = tempValues[key];
      checkbox.addEventListener("change", () => {
        tempValues[key] = checkbox.checked;
      });
      checkboxMap[key] = checkbox;
      label.appendChild(checkbox);
      label.append(" " + SETTINGS[key].label);
      panel.appendChild(label);
    }
    const buttonRow = document.createElement("div");
    buttonRow.style.textAlign = "right";
    buttonRow.style.marginTop = "10px";
    const applyBtn = document.createElement("button");
    applyBtn.textContent = "Apply";
    applyBtn.style.marginRight = "6px";
    applyBtn.addEventListener("click", async () => {
      for (const key in tempValues) {
        await GM_setValue(key, tempValues[key]);
      }
      location.reload();
    });
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      for (const key in currentValues) {
        tempValues[key] = currentValues[key];
        checkboxMap[key].checked = currentValues[key];
      }
      panel.style.display = "none";
    });
    buttonRow.appendChild(applyBtn);
    buttonRow.appendChild(cancelBtn);
    panel.appendChild(buttonRow);
    document.body.appendChild(panel);
    toggleButton.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });
    document.addEventListener("click", (event) => {
      if (panel.style.display === "block" && !panel.contains(event.target) && !toggleButton.contains(event.target)) {
        panel.style.display = "none";
      }
    });
    for (const [key, isEnabled] of Object.entries(currentValues)) {
      if (isEnabled && typeof FEATURE_FUNCTIONS[key] === "function") {
        FEATURE_FUNCTIONS[key]();
      }
    }
    function autoClickLogin() {
      const isLoginPage = window.location.href.includes("https://wsdmoodle.waseda.jp/login/index.php");
      if (isLoginPage) {
        qs(".login-identityprovider-btn").click();
      }
    }
    function setHomeDashboard() {
      const isHomePage = window.location.href === "https://wsdmoodle.waseda.jp/";
      if (isHomePage) {
        window.location.href = "https://wsdmoodle.waseda.jp/my/courses.php";
      }
    }
    function hideEmptySections() {
      hideLists(".sectionbody ul", ".course-section");
    }
    function hideLists(listSel, sectionSel) {
      const lists = qsa(listSel);
      console.log(sectionSel);
      console.log(lists);
      lists.forEach((list) => {
        const listItems = list.querySelectorAll("li");
        if (listItems.length === 0) {
          const section = list.closest(sectionSel);
          if (section) section.style.display = "none";
        }
      });
    }
    function hideEmptyCourseIndex() {
      setTimeout(() => {
        hideLists(".courseindex-item-content ul", ".courseindex-section");
      }, 1e3);
    }
    function alertVideoStatus() {
      const isVideoPage = window.location.pathname === "/mod/millvi/view.php";
      if (!isVideoPage) return;
      const videos = document.querySelectorAll("video");
      videos.forEach((video) => {
        monitorVideo(
          video,
          () => alert("\u{1F389} \u52D5\u753B\u8996\u8074\u5B8C\u4E86\uFF01"),
          (reason) => alert(`\u26A0\uFE0F \u52D5\u753B\u505C\u6B62: ${reason}`)
        );
      });
    }
  })();
})();