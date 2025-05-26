(function(){
    'use strict';

    const isCoursePage = window.location.href.includes("https://wsdmoodle.waseda.jp/course/view.php");

    if (!isCoursePage) return;

    let activitiesToObserve = [];

    // DOM監視用
    let shouldPause = false;
    let shouldResume = false;

    // 追加的なcss
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
    `
    // ボタンとコンテナのclasslist
    const btnContainerClassList = [
        "activity",
        "activity-item"
    ];
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

    // ボタンテキスト
    const dlBtnText = "Download all uncompleted files in this section";
    const dlBtnCompleteText = "All files downloaded!";

    const secs = document.querySelectorAll(".course-content .course-section");
    secs.forEach(sec => {
        displayBtn(sec);
    })

    observeBtnChanges();

    /**
     * 指定されたセクションにダウンロードボタンを追加
     * @param {Element} section - 操作対象のセクション
     * */
    function displayBtn(section) {
        let links = [];
        let actsHasResource = [];
        const acts = section.querySelectorAll(".activity");
        acts.forEach(act => {
            if (!hasResourceLink(act) || hasToggleBtn(act)) return;

            const isCompleted = isActivityCompleted(act);
            const link = act.querySelector("a");
            actsHasResource.push(act);
            if (isCompleted || !link) return;
            
            links.push(link);
        })

        if (actsHasResource.length === 0) return;

        activitiesToObserve.push(actsHasResource);
        const skipDl = links.length === 0;

        // 前のボタンの削除
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
        };
        
        btnContainer.appendChild(dlBtn);

        const style = document.createElement('style');
        style.textContent = btnCss;
        document.head.appendChild(style);

        if (skipDl) return;

        dlBtn.addEventListener("click", async () => {
            shouldPause = true;
            for (const link of links) {
                window.location.href = link.href;
                clickCompleteBtn(link);
                await delay(3000);
            }

            const newBtn = dlBtn.cloneNode(true);
            newBtn.textContent = dlBtnCompleteText;
            newBtn.classList.add(...dlBtnCompleteClassList);
            dlBtn.replaceWith(newBtn);
            console.log("replaced");
            
            shouldResume = true;
            resumeObserver(activitiesToObserve);
        });
    }

    /**
     * 指定されたactivityがResourceのリンクを含み，onclick属性がないかどうかを判定する
     * @param {Element} el - 判定対象のDOM要素
     * @returns {boolean} - Resourceのリンクが存在しonclick属性がなければtrue，それ以外はfalse
     */
    function hasResourceLink(el) {
        const modLink = el.querySelector("a");
        if (!modLink) return false;
    
        const onclickValue = modLink.getAttribute('onclick');
        if (onclickValue) return false;
    
        return modLink.href.includes("mod/resource");
    }
    
    /**
     * 指定されたactivityが「完了」しているかどうかを判定する
     * ユーザー自身で「完了」にできないものは除外とする
     * @param {Element} el - 判定対象のDOM要素
     * @returns {boolean} - 完了していればtrue、していない又は除外条件にあてはまるならfalse
     */
    function isActivityCompleted(el) {
        if (!el || !(el instanceof Element)) return false;
  
        const btnSuccess = el.querySelector(".btn-success");
        return btnSuccess !== null;
    }

    /**
     * 指定されたactivityの完了ボタンがToggleであるかを判定する
     * @param {Element} el - 判定対象のDOM要素
     * @returns {boolean} - Toggleであればtrue、Toggleでないならfalse
     */
    function hasToggleBtn(el) {
        const btn = el.querySelector("button");
        if (!btn) return false;
    
        return btn.dataset.action == "toggle-manual-completion";
    }


    /**
     * 指定されたミリ秒数だけ待機する
     * @param {number} ms - 待機時間（ミリ秒）
     * @returns {Promise<void>}
     */
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
 
    
    // activitiesToObserveについてDOMの変化を監視
    function observeBtnChanges() {
        const observerConfig = {
            childList: true,
            subtree: true
        };
    
        const observer = new MutationObserver((mutationsList) => {
            if (shouldPause) return;
    
            for (const mutation of mutationsList) {
                const act = mutation.target;
                const section = act.closest(".course-section");
                if (!section) return;

                displayBtn(section);
            }
        });

        const flatActivities = activitiesToObserve
            .filter(section => Array.isArray(section))  // null を除く
            .flat();
    
        flatActivities.forEach(act => {
            observer.observe(act, observerConfig);
        });
    };

    // 再監視
    function resumeObserver() {
        if (shouldResume) {
            shouldPause = false;
            shouldResume = false;
            observeBtnChanges();
        }
    };

    /**
     * 指定された要素のボタンをクリック
     * @param {*} el 
     */
    function clickCompleteBtn(el) {
        const act = el.closest(".activity-grid");
        const btn = act?.querySelector("button");
        if (!btn) return;
        const isSuccess = btn.classList.contains("btn-success");
        if (!isSuccess) btn.click();
    };    
})();