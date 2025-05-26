// video-monitor.js
(function() {
    function monitorVideo(video, onComplete, onStall) {
        let alerted = false;

        video.addEventListener('ended', () => {
            if (!alerted) {
                alerted = true;
                onComplete?.();
            }
        });

        video.addEventListener('stalled', () => {
            if (!alerted) {
                alerted = true;
                onStall?.("stalled");
            }
        });

        video.addEventListener('waiting', () => {
            setTimeout(() => {
                if (video.readyState < 3 && video.paused && !video.ended && !alerted) {
                    alerted = true;
                    onStall?.("waiting");
                }
            }, 5000);
        });

        video.addEventListener('error', () => {
            if (!alerted) {
                alerted = true;
                onStall?.("error");
            }
        });
    }

    // グローバル変数として登録（Tampermonkeyから参照できるようにする）
    window.videoMonitor = {
        monitorVideo
    };
})();