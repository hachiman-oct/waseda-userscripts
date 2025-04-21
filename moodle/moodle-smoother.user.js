// ==UserScript==
// @name         Moodle Smoother
// @namespace    https://github.com/hachiman-oct/
// @version      1.0.0
// @description  Refactored version with modular settings and function mapping
// @match        https://wsdmoodle.waseda.jp/*
// @updateURL    https://raw.githubusercontent.com/hachiman-oct/waseda-userscripts/main/moodle/moodle-smoother.user.js
// @downloadURL  https://raw.githubusercontent.com/hachiman-oct/waseda-userscripts/main/moodle/moodle-smoother.user.js
// @license      MIT
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_getResourceURL
// @resource     externalCSS https://raw.githubusercontent.com/hachiman-oct/waseda-userscripts/main/moodle/style.css
// @grant        GM_getResourceText
// @resource     moodleLogo https://moodle.org/theme/moodleorg/pix/moodle_logo_TM.svg
// @grant        GM_getResourceURL
// ==/UserScript==

(async function () {
    'use strict';

    // Utility functions
    const qs = sel => document.querySelector(sel);
    const qsa = sel => document.querySelectorAll(sel);

    // Settings definition
    const SETTINGS = {
        autoClickLogin:   { label: "自動でログインボタンを押す", default: false },
        setHomeDashboard: { label: "ダッシュボードをホームにする", default: false },
        changeHeader:     { label: "ヘッダーをダッシュボードへのリンクのみにする", default: false },
        hideUnusedLink:   { label: "不必要なリンクを非表示にする", default: false },
        hideEmptySections:{ label: "アクティビティがないセクションを非表示にする", default: false }
    };

    const currentValues = await loadSettings(SETTINGS);
    const tempValues = { ...currentValues };

    // === Feature implementations ===
    function autoClickLogin() {
        if (location.href.includes("login/index.php")) {
            qs(".login-identityprovider-btn")?.click();
        }
    }

    function setHomeDashboard() {
        if (location.href === "https://wsdmoodle.waseda.jp/") {
            location.href = "https://wsdmoodle.waseda.jp/my/";
        }
    }

    function changeHeader() {
        const moodleLogo = GM_getResourceURL("moodleLogo");
        const primaryNavigation = qs(".primary-navigation");
        const brandLogoImg = qs(".navbar-brand img");

        [primaryNavigation, brandLogoImg].forEach(el => el && (el.style.display = "none"));

        const dashboardLink = document.createElement("a");
        dashboardLink.href = "https://wsdmoodle.waseda.jp/my/";

        const logoSvg = document.createElement("img");
        logoSvg.src = moodleLogo;
        logoSvg.id = "moodle-logo";
        logoSvg.style.width = "100px";
        logoSvg.style.height = "25px";

        dashboardLink.appendChild(logoSvg);
        qs(".container-fluid")?.insertBefore(dashboardLink, primaryNavigation);
    }

    function hideUnusedLink() {
        const pageNaviBar = qs("#page-navbar");
        if (pageNaviBar) {
            [1, 2, 3, 4].forEach(num => {
                const li = pageNaviBar.querySelector(`li:nth-child(${num})`);
                if (li) li.style.display = "none";
            });
        }
    }

    function hideEmptySections() {
        qsa(".sectionbody ul").forEach(sec => {
            const listItems = sec.querySelectorAll("li");
            if (listItems.length === 0) {
                const section = sec.closest(".course-section");
                if (section) section.style.display = "none";
            }
        });
    }

    // Load saved or default settings
    async function loadSettings(settingsDef) {
        const values = {};
        await Promise.all(
            Object.keys(settingsDef).map(async key => {
                const value = await GM_getValue(key);
                values[key] = value !== undefined ? value : settingsDef[key].default;
            })
        );
        return values;
    }

    // Save settings to storage
    async function saveSettings(values) {
        for (const key in values) {
            await GM_setValue(key, values[key]);
        }
    }

    // Reset temporary values to current values
    function resetTempToCurrent(current, temp, checkboxes) {
        for (const key in current) {
            temp[key] = current[key];
            checkboxes[key].checked = current[key];
        }
    }

    function importCss() {
        const css = GM_getResourceText("externalCSS");
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
    }

    function addSettingsBtn() {
        // Settings UI toggle button
        const toggleButton = document.createElement("button");
        toggleButton.className = "setting-toggle-btn";
        toggleButton.textContent = "⚙️設定";
        document.body.appendChild(toggleButton);

        // Settings panel
        const panel = document.createElement("div");
        panel.className = "settings-panel";

        const title = document.createElement("div");
        title.textContent = "⚙️ ユーザースクリプト設定";
        title.style.fontWeight = "bold";
        title.style.marginBottom = "8px";
        panel.appendChild(title);

        const checkboxMap = {};
        Object.entries(SETTINGS).forEach(([key, { label }]) => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = tempValues[key];
            checkbox.addEventListener("change", () => {
                tempValues[key] = checkbox.checked;
            });

            const labelEl = document.createElement("label");
            labelEl.style.display = "block";
            labelEl.style.marginBottom = "6px";
            labelEl.appendChild(checkbox);
            labelEl.append(" " + label);
            panel.appendChild(labelEl);

            checkboxMap[key] = checkbox;
        });

        const buttonRow = document.createElement("div");
        buttonRow.style.textAlign = "right";
        buttonRow.style.marginTop = "10px";

        const applyBtn = document.createElement("button");
        applyBtn.textContent = "Apply";
        applyBtn.style.marginRight = "6px";
        applyBtn.addEventListener("click", async () => {
            await saveSettings(tempValues);
            location.reload();
        });

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => {
            resetTempToCurrent(currentValues, tempValues, checkboxMap);
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
            if (panel.style.display === "block" &&
                !panel.contains(event.target) &&
                !toggleButton.contains(event.target)) {
                panel.style.display = "none";
            }
        });
    }

    // === Feature execution mapping ===
    const FEATURES = {};
    for (const key of Object.keys(SETTINGS)) {
        if (typeof window[key] === "function") {
            FEATURES[key] = window[key];
        }
    }

    for (const [key, enabled] of Object.entries(currentValues)) {
        if (enabled && typeof FEATURES[key] === "function") {
            FEATURES[key]();
        }
    }
})();