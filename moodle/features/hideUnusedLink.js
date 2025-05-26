export function hideUnusedLink(qs) {
    const pageNaviBar = qs("#page-navbar");
    if (pageNaviBar) {
        [1, 2, 3, 4].forEach(num => {
            const li = pageNaviBar.querySelector(`li:nth-child(${num})`);
            if (li) {
                li.style.display = "none";
            }
        });
    }
}