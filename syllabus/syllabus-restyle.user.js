// ==UserScript==
// @name         Waseda Syllabus Restyle
// @name:ja      早稲田シラバス改善スクリプト
// @namespace    https://github.com/hachiman-oct/
// @version      1.0.1
// @author       hachiman-oct
// @description  A user script to optimize the layout and display of Waseda syllabus.
// @description:ja  スマホ対応・教室リンクなど、早稲田シラバスを実用的に改善します。
// @match        https://www.wsl.waseda.jp/syllabus/*
// @license      MIT
// @icon         https://raw.githubusercontent.com/hachiman-oct/waseda-userscripts/main/syllabus/syllabus-restyle-icon.svg
// @updateURL    https://raw.githubusercontent.com/hachiman-oct/waseda-userscripts/main/syllabus/syllabus-restyle.user.js
// @downloadURL  https://raw.githubusercontent.com/hachiman-oct/waseda-userscripts/main/syllabus/syllabus-restyle.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const qs = sel => {
        const el = document.querySelector(sel);
        if (!el) {
            //console.error(`指定したセレクタ "${sel}" の要素が見つかりませんでした。`);
        }

        return el;
    };
    const qsa = sels => {
        const els = document.querySelectorAll(sels);
        if (els.length === 0) {
            //console.error(`指定したセレクタ "${sels}" の要素が見つかりませんでした。`);
        }

        return els;
    };
    const ce = tag => document.createElement(tag);

    const url = window.location.href;
    const urlcheck = text => url.includes(text);

    const cEdit   = qs("#cEdit");
    const cCommon = qs("#cCommon");

    // ページ種別の判定
    const isJAA101 = urlcheck("JAA101.php");
    const isJAA102 = urlcheck("JAA102.php");
    const isIndex  = urlcheck("index.php");
    
    const isCurrentSearchPage = !!cEdit && isJAA101;
    const isPastSearchPage    = !!cEdit && isJAA102;
    const isResultsPage       = !!cCommon && (isJAA101 || isJAA102 || isIndex);
    const isDetailPage        = urlcheck("JAA104.php");
    const isJaPage            = document.title.includes("シラバス");

    const [lang, langOther] = isJaPage ? ["ja", "en"] : ["en", "ja"];

    const fieldAreasToHide = {
        1: ["mid_area", "bunya2_divSearch"],
        2: ["small_area", "bunya3_divSearch"]
    };

    let isMobile;


    addCss();
    restyle();

    // 初回チェック
    checkDevice();

    // リサイズ時も判定
    window.addEventListener('resize', checkDevice);
    
    function restyle() {
        switch (true) {
            case isCurrentSearchPage || isPastSearchPage:
                restyleSearch();
                updateFieldVisibility();
                observeStyleChanges();
                break;
            case isResultsPage:
                openInNewTabLink();
                restyleResultsAndDetail();
                restyleResults();
                break;
            case isDetailPage:
                restyleResultsAndDetail();
                restyleDetail();
                addSyllabusBtns();
                addInstructorBtn();
                addClassroomBtn();
                break;
        }
    };

    function checkDevice() {
        isMobile = window.innerWidth <= 768;
        if (!isResultsPage) return;

        restyleResutsTable();
    };

    function restyleSearch() {
        // meta viewport の作成または更新
        var meta = qs('meta[name=viewport]');
        if (!meta) {
        meta = ce('meta');
        meta.name = "viewport";
        document.head.appendChild(meta);
        }
        meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

        document.querySelectorAll('*').forEach(el => {
            el.style.removeProperty('width');
        });

        // 不必要な要素の非表示
        const selectorsToHide = [
            ".h-close"
        ];
        selectorsToHide.forEach(sel => {
            const el = qs(sel);
            if (el) el.style.display = "none";
        });
        
        const openCourse = qs('input[name="p_open[]"]');
        const openCourseText = isJaPage ? "全学オープン科目" : "University-wide Open Courses";

        if (openCourse) {
            const hasText = openCourse.closest("label").textContent.includes(openCourseText)
            if (!hasText) openCourse.insertAdjacentHTML('afterend', openCourseText);
        }

        // size="60"の設定を無効化
        document.querySelectorAll('input').forEach(input => {
            input.removeAttribute('size');
        });

        // インラインスタイルの中から不要なものを削除
        document.querySelectorAll('td').forEach(td => {
            td.style.removeProperty('width');
            td.style.removeProperty('height');
        });
        qs(".fcontents").style.removeProperty('margin');

        // #cMainの高さ制限を無効化
        qs("#cMain").style.removeProperty('height');

        const labels = {
            ja: {
                current: ["検索", "クリア", "過年度シラバス"],
                past: ["検索", "クリア", "今年度シラバス"]
            },
            en: {
                current: ["Search", "Reset", "See Previous Syllabi"],
                past: ["Search", "Reset", "See This Year's Syllabus"]
            }
        };
        
        const langKey = isJaPage ? "ja" : "en";
        const timeKey = isCurrentSearchPage ? "current" : "past";
        
        const buttonLabel = labels[langKey][timeKey];        
        const btns = qsa(".btn02 input")
        btns.forEach((sel, i) => {
            if (sel) {
                sel.value = buttonLabel[i];
            }
        });
    };

    function restyleResultsAndDetail(){
        const tablesDetail = qsa(".ctable-main");
        if (tablesDetail.length > 0) {
            tablesDetail[0].setAttribute("id", "course-info-table");
        };
        if (tablesDetail.length > 1) {
            tablesDetail[1].setAttribute("id", "syllabus-info-table");
        };

        const footer2 = qs("#Footer2");
        footer2.querySelector(".fcontents").removeAttribute("style");

        const footer = ce("div");
        footer.id = "footer";
        footer.style.backgroundColor = 'rgb(227, 192, 196)';
        footer.style.height = "30px";

        const elementsToRestyleResults = [
            qs(".h-sname"),
            qs("#cHeader"),
            qs("#cHonbun"),
            footer2,
            footer           
        ];

        const elementsToRestyleDetail = [
            qs(".h-sname"),
            qs("#cHeader"),
            qs(".l-btn-c"),
            tablesDetail[0],
            tablesDetail[1],
            footer2,
            footer
        ];
        const elementsToRestyle = isResultsPage ? elementsToRestyleResults : elementsToRestyleDetail;
        if (!elementsToRestyle || elementsToRestyle.length === 0) return;

        // モバイル用表示のためのコンテナを作成
        const restyledContainerId = "restyled-container"

        const restyledContainer = ce('div');
        restyledContainer.style.padding = "0.3rem";
        restyledContainer.style.fontSize = "1rem";
        restyledContainer.style.lineHeight = "1.5rem";
        restyledContainer.style.backgroundColor = "#f9f9f9";
        restyledContainer.style.maxWidth = "95%";
        restyledContainer.style.margin = "0 auto";
        restyledContainer.id = restyledContainerId

        // 指定の要素をクローンして追加
        elementsToRestyle.forEach(el =>{
            restyledContainer.appendChild(el.cloneNode(true));
        })

        const hasContainer = qs(`#${restyledContainerId}`);
        if (!hasContainer) document.body.insertBefore(restyledContainer, document.body.firstChild);

        qs("#cForm").style.display = "none";
        qs("#restyled-container").style.display = "block";
    };

    function restyleResults() {
        // 不必要な要素のの非表示
        const selsToHide = [
            ".h-close",
            ".ch-back"
        ]
        selsToHide.forEach(sel =>{
            qs(sel).style.display = "none";
        });

        // widthの削除
        qsa("#course-info-table th").forEach(el =>{
            el.removeAttribute("width");
        });
    };

    function restyleResutsTable() {
        // 重要性の低い列の表示・非表示
        [2, 9].forEach(index => {
            qsa(`.ctable-main tr td:nth-child(${index}), .ctable-main tr th:nth-child(${index})`)
                .forEach(cell => cell.style.display = isMobile ? "none" : "table-cell");
        });
    }

    function restyleDetail() {
        // 不必要な要素のの非表示
        const selsToHide = [
            ".h-close"
        ]
        selsToHide.forEach(sel =>{
            qs(sel).style.display = "none";
        });

        // widthの削除
        const tds = qsa("#syllabus-info-table td");
        tds.forEach(td => {
            td.removeAttribute("width");
        })

        // tableをそろえる
        if (!qs("#course-info-table")) return;

        [14, 7, 6, 5, 1].forEach(num => restyleCourseInfo(num));
        restyleCourseInfo(5+1, 2, 1);
        
        const tbody = qs("#course-info-table > table > tbody");
        tbody.querySelectorAll("th, td").forEach(cell => {
          cell.removeAttribute("width");
          cell.removeAttribute("colspan");
          if (cell.tagName === "TH") cell.colSpan = 2;
        });
        tbody.querySelectorAll(".course-code-group, .course-code-main, .course-code-sub")
          .forEach(cell => cell.colSpan = 1);
        ;

        const setTdId = (textJa, textEn, id) => {
            const text = isJaPage ? textJa : textEn;
            const th = [...document.querySelectorAll("#syllabus-info-table th")]
              .find(th => th.textContent.trim() === text);
            th?.nextElementSibling?.tagName === "TD" && (th.nextElementSibling.id = id);
        };
          
        // 呼び出し
        setTdIdByThText("syllabus-info-table", "授業計画", "Course Schedule", "course-schedule");
        setTdIdByThText("syllabus-info-table", "成績評価方法", "Evaluation", "grading-criteria");
        
        qsa("#course-schedule td, #grading-criteria td, #grading-criteria th").forEach(el => {
            if (!el) return;
            el.removeAttribute("style");
            el.removeAttribute("align");
        });
    };

    /**
     * tableの中身を入れ替えてth, tdを1列にそろえる
     * @param {*} num - 行の指定
     * @param {*} col - 列の指定
     * @param {*} row - 挿入先の行が1つ下の行から何番目の行か
     */
    function restyleCourseInfo(num, col = 0, row = 0) {
        const qst = sel => qs(".ctable-main")?.querySelector(sel);
        const container = ce("tr");
    
        const selList = [
            `tr:nth-child(${num}) > th:nth-child(${3 + col})`,
            `tr:nth-child(${num}) > td:nth-child(${4 + col})`
        ];
    
        for (const sel of selList) {
            const target = qst(sel);
            if (!target) continue;
            container.appendChild(target.cloneNode(true));
            target.style.display = "none";
        }
    
        const tbody = qst("table > tbody");
        const ref = qst(`tr:nth-child(${num + 1 + row})`);
        if (!tbody || !ref) return;
    
        tbody.insertBefore(container, ref);
    }     
    
    /**
     * 詳細情報へのリンクをonclickではなくhrefで格納
     */
    function openInNewTabLink() {
        // onclick属性を持つすべての <a> タグを取得
        const links = qsa('a[onclick]');

        // 'JAA104DtlSubCon' を含むものをフィルタリングして処理
        links.forEach(a => {
            const onclickValue = a.getAttribute('onclick');
            const match = onclickValue.match(/post_submit\('JAA104DtlSubCon',\s*'([^']+)'\)/);
            
            if (match) {
                const extractedValue = match[1];
                const newUrl = 'https://www.wsl.waseda.jp/syllabus/JAA104.php?pKey=' + extractedValue + '&pLng=' + lang;
                
                // 元のonclick属性を削除し、hrefとtarget属性を設定
                a.removeAttribute('onclick');
                a.setAttribute('href', newUrl);
                a.setAttribute('target', '_blank');
            }
        });
    }

    function updateFieldVisibility() {
        const isHidden = el => window.getComputedStyle(el).display === "none";
        Object.values(fieldAreasToHide).forEach(ids => {
            const elements = ids.map(id => document.getElementById(id)).filter(Boolean);
            if (!elements.length) return;
    
            const parent = elements[0].closest("td");
            if (!parent) return;
    
            parent.style.display = elements.every(isHidden) ? "none" : "flex";
        });
    };
    
    function observeStyleChanges() {
        const observer = new MutationObserver(() => {
            updateFieldVisibility(); // 属性変化が起きたら一括チェック
        });
    
        // 対象となる全要素を監視（style変更 or class変更も検出）
        Object.values(fieldAreasToHide).flat().forEach(id => {
            const el = document.getElementById(id);
            if (el) {
            observer.observe(el, {
                attributes: true,
                attributeFilter: ["style", "class"]
            });
            }
        });
    };

    /**
     * 3種類のページ(search, results, detail)に対しcssを挿入
     */
    function addCss() {
        // カスタムCSSの追加
        const restyleCssId = "restyle-css";
        const cssSearch =`
        #Contents {
            font-size: 1rem;
        }

        .ctable-main > table > tbody > tr:nth-child(2) td {
            width: 95%;
            display: block;
            height: 2rem;
        }

        #cMain {
            overflow: visible !important;
            height: auto !important;
        }

        @media screen and (max-width: 768px) {
            /* テーブル、行、セルをブロックに変更 */
            .ctable-main,
            .ctable-main thead,
            .ctable-main tbody,
            .ctable-main tr {
                display: block;
                width: 100%;
            }
            .ctable-main th,
            .ctable-main td {
                display: block;
                width: 98%;
            }

            /* th と td の場合、内部のテキストに余白を設定 */
            th, td {
                box-sizing: border-box;
                padding: 0.5em;
            }
            th {
                text-align: left !important;
            }
            
            /* プルダウンの設定 */
            .btn-default {
                height: 2rem;
            }
            .btn-default span {
                height: 1rem;
                display: flex;
                align-items: center;
            }
            .btn-default .caret {
                float: right;
            }
            
            #Header {
                width: auto;
                min-width: 0;
            }
        
            .ct-sirabasu {
                width: 100%;
            }
            .ctable-main {
                padding: 0;
            }
            #cHeader h1 {
                padding-right: 0;
            }
            .ch-pankuzu {
                padding: 0;
            }
            
            .ct-search tr {
                display: flex;
            }

            .operationboxf label, .ct-search td {
                width: 95%;
                display: flex;
                height: 1.5rem;
                align-items: center;
            }
            
            .searchDailag {
                width: 80%;
            }

            input[name="keyword"],
            input[name="kamoku"],
            input[name="kyoin"] {
                width: 80%;
                height: 2rem;
                border-radius: 0.5rem;
                padding-left: 0.3rem;
            }
        }
        `;

        const cssResults =`
        * {
            box-sizing: border-box;
        }

        .element {
            width: 100%;
            margin: 0 auto;
        }

        .container {
            overflow-x: auto;
        }  

        table {
            margin: 0;
        }
        `;

        const cssDetail =`
        .added-btn {
            display: inline-block;
            padding: 10px 20px;
            font-size: 80%;
            font-weight: 600;
            color: #fff !important; /* 文字色を強制 */
            background: linear-gradient(135deg,rgb(176, 0, 0),rgb(220, 0, 0));
            border: none;
            border-radius: 0.75rem;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            text-align: center;
            text-decoration: none !important; /* アンダーラインを消す */
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .added-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .added-btn:active {
            transform: scale(0.97);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .added-btn-container {
            display: flex;
            justify-content: center;
            gap: 5%;
        }

        .h-sname {
            /*display: flex;*/
        }

        #course-info-table th {
            width: 18%;
        }

        #course-info-table .course-code-group {
            width: 2%
        }

        #lang-btn-container {
            text-align:right;
        }

        @media screen and (max-width: 768px) {

            #syllabus-info-table,
            #syllabus-info-table thead,
            #syllabus-info-table tbody,
            #syllabus-info-table tr,
            #syllabus-info-table th,
            #syllabus-info-table td {
                display: block;
                width: 100%;
            }

            #syllabus-info-table .ct-sirabasu {
                width: 100%;
            }

            #course-info-table th {
                text-align: right;
            }

            /* th と td の場合、内部のテキストに余白を設定 */
            th, td {
                box-sizing: border-box;
                padding: 0.5em;
            }

            #syllabus-info-table th {
                text-align: left !important;
            }

            /* 授業計画のリスタイル */
            #course-schedule table {
                table-layout: auto;
                width: 100%;
            }

            #course-schedule td {
                white-space: normal;
                width: auto;
                padding: 0;
            }

            #course-schedule tr {
                display: flex;
            }

            #course-schedule td[value="top"] {
                padding-left: 0.3rem; 
            }

            #grading-criteria tr  {
                
            }

            #grading-criteria td,
            #grading-criteria th {
                display: table-cell;
                width: auto;
            }

            #grading-criteria table {
                display: table;
            }

            #grading-criteria tbody {
                display: table-row-group;
            }

            #grading-criteria tr {
                display: table-row;
            }
        }
        `;

        const cssFooter =`
        /* footer2の設定 */
        #Footer2 {
            min-height: auto;
        }

        #Footer2 {
            word-wrap: break-word;
            word-break: break-word;
            overflow-wrap: break-word;
            white-space: normal;
        }

        #Footer2 p {
            padding: 0.3rem 1rem 0.3rem 1rem;
        }

        .fcontents {
            margin: 0;
        }
        `

        let cssToAdd = isCurrentSearchPage || isPastSearchPage ? cssSearch
        : isResultsPage ? cssResults
        : isDetailPage ? cssDetail
        : null;

        cssToAdd = cssToAdd ? cssToAdd + cssFooter : cssFooter;
        if (!cssToAdd) return;

        const style = ce('style');
        style.textContent = cssToAdd;
        style.id = restyleCssId
        document.head.appendChild(style);
    }

    /**
     * detailページのときにyearボタンとlangボタンを挿入
     */
    function addSyllabusBtns() {
        const param = new URLSearchParams(location.search);
        const pKey = param.get("pKey");
        const class_key   = pKey.slice(0,  10);
        const class_code  = pKey.slice(10, 12);
        const year        = pKey.slice(12, 16);
        const school_code = pKey.slice(26, 28);
    
        const yearNext = +year + 1;
        const yearPrev = +year - 1;
        
        // ボタン要素の作成
        const yearBtnContainer = ce('td');
        yearBtnContainer.id = "year-btn-container"
        yearBtnContainer.className = "added-btn-container";

        const text = {
            title: {
                ja: {
                    previous: "前年度のシラバス",
                    next    : "翌年度のシラバス"
                },
                en: {
                    previous: "Previous Year Syllabus",
                    next    : "Next Year Syllabus"
                }
            },
        
            label: {
                ja: {
                    previous: `◀ ${yearPrev}年`,
                    next    : `${yearNext}年 ▶`
                },
                en: {
                    previous: `◀ ${yearPrev}`,
                    next    : `${yearNext} ▶`
                }
            },

            url: {
                previous: location.origin + location.pathname + '?pKey=' + class_key + class_code + yearPrev + class_key + school_code + '&pLng=' + lang,
                next    : location.origin + location.pathname + '?pKey=' + class_key + class_code + yearNext + class_key + school_code + '&pLng=' + lang
            }
        };        
    
        const currentYear = new Date().getFullYear();
        
        ['previous', 'next'].forEach(type => {
            if (type === 'next' && currentYear < yearNext) return; // 条件に合わなければスキップ
        
            const btn = ce('a');
            btn.title = text.title[lang][type];
            btn.href = text.url[type];
            btn.textContent = text.label[lang][type];
            btn.className = 'added-btn';
            yearBtnContainer.appendChild(btn);
        });
    
        // 追加位置
        document.body.appendChild(yearBtnContainer);
        document.querySelector("#course-info-table > table > tbody > tr:nth-child(1) > td:nth-child(2)").insertAdjacentElement("afterend", yearBtnContainer);


        // langボタン
        const newUrlLang = location.origin + location.pathname + '?pKey=' + class_key + class_code + year + class_key + school_code + '&pLng=' + langOther;

        // ボタンコンテナを作成
        const langBtnContainer = ce('div');
        langBtnContainer.id = 'lang-btn-container';

        // ボタン要素を作成
        const langBtn = ce('a');
        langBtn.href = newUrlLang;
        langBtn.textContent = `${langOther}`;
        langBtn.className = 'added-btn';

        // コンテナにボタンを追加
        langBtnContainer.appendChild(langBtn);

        qs(".h-sname").insertAdjacentElement("afterend", langBtnContainer);
    };

    function addInstructorBtn() {
        setTdIdByThText("course-info-table", "担当教員", "Instructor", "instructor-name");

        const name = qs("#instructor-name")?.textContent;
        if (!name || name.includes("／")) return;
        
        const text = {
          title: {
            ja: {
              wrdb: "早稲田大学研究者データベースで調べる",
              rmap: "researchmapで調べる"
            },
            en: {
              wrdb: "Search on Waseda University Researcher Database",
              rmap: "Search on researchmap"
            }
          },
          label: {
            wrdb: "Waseda DB",
            rmap: "researchmap"
          },
          url: {
            wrdb: `https://w-rdb.waseda.jp/search?m=name&l=${lang}&s=1&search_type=2&o=shokumei&n=${name}&search-submit=`,
            rmap: `https://researchmap.jp/researchers?q=${name}&lang=${lang}`
          }
        };
        
        const container = ce("td");
        container.id = "inst-btn-container";
        container.className = "added-btn-container";
        
        ["wrdb", "rmap"].forEach(type => {
          const a = ce("a");
          Object.assign(a, {
            textContent: text.label[type],
            title: text.title[lang][type],
            href: text.url[type],
            target: "_blank",
            className: "added-btn"
          });
          container.appendChild(a);
        });
        
        qs("#instructor-name")?.insertAdjacentElement("afterend", container);        
    };

    function addClassroomBtn() {
        setTdIdByThText("course-info-table", "使用教室", "Classroom", "classroom");
        setTdIdByThText("course-info-table", "キャンパス", "Campus", "campus");
        

        const classroom = qs("#classroom")?.textContent;
        const campus = qs("#campus")?.textContent;
        if (!(classroom && campus)) return;
               
        // --- 前提データ ---
        const campusKey = getCampusKey(campus);
        if (!campusKey) return;

        const langKey = isJaPage ? "ja" : "en_US";

        // classrooms は ["3-909","10-306",…] の形
        const classrooms = getClassroom(classroom);
        if (!classrooms?.length) return;

        // --- 1. buildingNums（重複除去）と buildingKeys（3桁ゼロ埋め） ---
        const buildingNums = [...new Set(classrooms.map(code => code.split("-")[0]))];
        const buildingKeys = buildingNums.map(num => num.padStart(3, "0"));

        // --- 2. classroomKeys / floorKeys （Wasedaのみフロア文字を付加） ---
        const classroomKeys = classrooms.map(code => code.split("-")[1]);
        const floorKeys = campusKey === "waseda"
        ? classroomKeys.map(k => k[0] + "f")
        : [];

        // --- 汎用ボタン作成関数 ---
        function createBtnContainer(type, keys, makeUrl, makeLabel, makeTitle, insertAfterSelector) {
            const container = document.createElement("td");
            container.id = `${type}-btn-container`;
            container.className = "added-btn-container";

            keys.forEach((key, i) => {
                const a = document.createElement("a");
                a.href    = makeUrl(key, i);
                a.textContent = makeLabel(key, i);
                a.title      = makeTitle(key, i);
                a.target     = "_blank";
                a.className  = "added-btn";
                container.appendChild(a);
        });

        document.querySelector(insertAfterSelector)
            ?.insertAdjacentElement("afterend", container);
        }

        if (campusKey == "waseda") {
            // --- 3. 建物ボタン ---
            createBtnContainer(
                "building",
                buildingNums,
                (num, i) => // URL
                    `https://support.waseda.jp/it/s/classroom/${campusKey}/${buildingKeys[i]}?language=${langKey}`,
                (num, i) => // ボタンラベル
                    isJaPage ? `${num}号館` : `Building ${num}`,
                (num, i) => // ボタンタイトル
                    isJaPage
                    ? `${num}号館の教室情報`
                    : `Building ${num} classroom details`,
                "#campus"
            );

            // --- 4. 教室ボタン ---
            createBtnContainer(
                "classroom",
                classrooms,
                (code, i) => {
                    const bkey = code.split("-")[0].padStart(3, "0");
                    const cKey = code.split("-")[1];
                    const fkey = floorKeys[i] || "";
                    return `https://support.waseda.jp/it/s/classroom/${campusKey}/${bkey}/${fkey}?language=${langKey}#${cKey}`;
                },
                (code) => // 教室ラベル
                    code,
                () => // 教室タイトルは固定
                    isJaPage ? "教室機器環境を調べる" : "Classroom equipment details",
                "#classroom"
            );
        } else {
            createBtnContainer(
                "classroom-list",
                ["02"],
                (key) => `https://support.waseda.jp/it/s/classroom?language=${langKey}#${key}`,
                () => isJaPage ? "教室機器環境" : "Classroom equipment details",
                () => isJaPage ? "教室機器環境を調べる" : "Check classroom equipment details",
                "#classroom"
            );            
        }

        function getCampusKey(campus) {
            const str = campus.trim().toLowerCase();
          
            if (["waseda", "早稲田"].includes(str)) return "waseda";
            if (["toyama", "戸山"].includes(str)) return "toyama";
            if (["nishi-waseda（former: okubo）", "西早稲田（旧大久保）"].includes(str)) return "nishiwaseda";
            if (["tokorozawa", "所沢"].includes(str)) return "tokorozawa";
            return false;
        };

        function getClassroom(classroom) {           
            // 1. 全角数字を半角に変換する関数
            function toHalfWidth(str) {
              return str.replace(/[０-９]/g, ch => 
                String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
              );
            }
            
            // 2. 教室番号（1〜3桁の数字＋ハイフン＋1〜3桁、最大2回）を抽出
            function extractClassroomCodes(text) {
                const normalized = toHalfWidth(text);
                const regex = /\d{1,3}(?:-\d{1,3}){1,2}/g;
                const matches = normalized.match(regex) || [];
                return [...new Set(matches)]; // 重複を削除
            }

            return extractClassroomCodes(classroom);
        };
    };

    /**
     * 指定したテーブル内で、見出し（<th>）のテキストに一致する要素を探し、
     * その隣接する<td>要素に指定されたIDを付与します。
     *
     * @param {string} tableId - 対象のテーブル要素のID
     * @param {string} jaText - 日本語での見出しテキスト（例: "授業計画"）
     * @param {string} enText - 英語での見出しテキスト（例: "Course Schedule"）
     * @param {string} tdId - 見つかった<td>要素に付けるID名
     */
    function setTdIdByThText(tableId, jaText, enText, tdId) {
        const targetText = isJaPage ? jaText : enText;
        const table = document.getElementById(tableId);
        if (!table) return;
      
        const targetTh = Array.from(table.getElementsByTagName("th"))
          .find(th => th.textContent.trim() === targetText);
      
        if (targetTh?.nextElementSibling?.tagName === "TD") {
          targetTh.nextElementSibling.id = tdId;
        }
      }
})();