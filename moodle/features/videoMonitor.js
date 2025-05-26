export function monitorVideo(video, onComplete, onStop) {
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
            if (onStop) onStop("動画が途中で停止しました");
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

    // 動画要素がDOMから削除された場合も検知
    observer = new MutationObserver(() => {
        if (!document.body.contains(video)) {
            if (!ended && onStop) onStop("動画要素が削除されました");
            cleanup();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}