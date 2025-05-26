export function changeHeader(qs, GM_getResourceURL) {
    const moodleLogo = GM_getResourceURL("moodleLogo");
    const primaryNavigation = qs(".primary-navigation");
    const brandLogo = qs(".navbar-brand");
    const brandLogoImg = brandLogo.querySelector("img");
    [primaryNavigation, brandLogoImg].forEach(el => {
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