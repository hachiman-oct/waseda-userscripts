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

import { changeHeader } from "./features/changeHeader.js";
import { hideUnusedLink } from "./features/hideUnusedLink.js";
import { monitorVideo } from "./features/videoMonitor.js";
import { moodleDlBtn } from "./features/moodleDlBtn.js";

(async function () {
    'use strict';

    const qs = sel => document.querySelector(sel);
    const qsa = sel => document.querySelectorAll(sel);    

    const SETTINGS = {
        autoClickLogin:   { label: "Automatically click the login button", default: false },
        setHomeDashboard: { label: "Set the dashboard as the home page", default: false },
        changeHeader:     { label: "Change the header to only link to the dashboard", default: false },
        hideUnusedLink:   { label: "Hide unnecessary links", default: false },
        hideEmptySections:{ label: "Hide empty sections", default: false },
        moodleDlBtn:      { label: "Add a button to download all files", default: false },
        hideEmptyCourseIndex: { label: "Hide empty course index", default: false },
        alertVideoStatus: { label: "Alert Video Status", default: false}
    };
    
    const FEATURE_FUNCTIONS = {
        autoClickLogin,
        setHomeDashboard,
        changeHeader: () => changeHeader(qs, GM_getResourceURL),
        hideUnusedLink: () => hideUnusedLink(qs),
        hideEmptySections,
        moodleDlBtn, // ← ここを直接参照
        hideEmptyCourseIndex,
        alertVideoStatus
    };

    // 初期設定の読み込み（Promise.allで並列取得）
    const currentValues = {};
    await Promise.all(Object.keys(SETTINGS).map(async key => {
        const value = await GM_getValue(key);
        currentValues[key] = value !== undefined ? value : SETTINGS[key].default;
    }));

    // 一時的な状態（適用前のチェックボックス値）
    const tempValues = { ...currentValues };

    const css = GM_getResourceText("externalCSS");
    const style = document.createElement("style");
    style.textContent = css;
    console.log(css); // ここで内容が出力されるか確認
    document.head.appendChild(style);

    // 🔘 トグルボタン
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "⚙️Settings";
    toggleButton.className = "settings-toggle-btn";
    document.body.appendChild(toggleButton);

    // ⚙️ 設定パネル
    const panel = document.createElement("div");
    panel.className = "settings-panel";

    const title = document.createElement("div");
    title.textContent = "⚙️ Userscript settings";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    panel.appendChild(title);

    // チェックボックスと一時状態をリンク
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

    // ✅ 適用＆キャンセルボタン
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
        // 値を元に戻す
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

    // 開閉の切り替え
    toggleButton.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    // 外部クリックでパネル閉じ
    document.addEventListener("click", (event) => {
        if (
            panel.style.display === "block" &&
            !panel.contains(event.target) &&
            !toggleButton.contains(event.target)
        ) {
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
        lists.forEach(list => {
            const listItems = list.querySelectorAll("li");
            if (listItems.length === 0) {
                const section = list.closest(sectionSel);
                if (section) section.style.display = "none";
            }
        })
    }

    function hideEmptyCourseIndex() {
        setTimeout(() => {
            hideLists(".courseindex-item-content ul", ".courseindex-section");
        }, 1000); 
    }

    function alertVideoStatus() {
        const isVideoPage = window.location.pathname === "/mod/millvi/view.php";
        if (!isVideoPage) return;

        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            monitorVideo(
                video,
                () => alert("🎉 動画視聴完了！"),
                (reason) => alert(`⚠️ 動画停止: ${reason}`)
            );
        });
    }
})();