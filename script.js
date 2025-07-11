document.addEventListener('DOMContentLoaded', function() {
    // Элементы
    const audioPlayer = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const volumeSlider = document.getElementById('volume-slider');
    const visualizer = document.getElementById('visualizer');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const radioBtn = document.getElementById('radio-btn');
    const profileBtn = document.getElementById('profile-btn');
    const playerContainer = document.querySelector('.player-container');
    const profileSection = document.getElementById('profile-section');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const currentSongElement = document.getElementById('current-song');

    // Визуализатор
    for (let i = 0; i < 60; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        visualizer.appendChild(bar);
    }
    const bars = document.querySelectorAll('.bar');

    // Стрим
    audioPlayer.src = 'https://region-ru1.tunio.ai/radio-choyxona.aac';

    // Статусы
    const status = {
        CONNECTING: {text: "Подключение...", color: "#ff0", class: ""},
        CONNECTED: {text: "Играет", color: "#0f0", class: "connected"},
        PAUSED: {text: "Пауза", color: "#ff0", class: ""},
        ERROR: {text: "Ошибка", color: "#f00", class: "error"},
        BUFFERING: {text: "Буферизация...", color: "#ff0", class: ""},
        SWITCHING: {text: "Переключение...", color: "#ff0", class: ""}
    };

    function setStatus(newStatus) {
        statusText.textContent = newStatus.text;
        statusIndicator.style.backgroundColor = newStatus.color;
        statusIndicator.style.boxShadow = `0 0 10px ${newStatus.color}`;
        statusIndicator.className = `status-indicator ${newStatus.class}`;
    }

    // Инициализация Telegram WebApp
    function initTelegramApp() {
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = Telegram.WebApp;

            webApp.ready();
            webApp.expand();
            webApp.enableClosingConfirmation();

            console.log("Telegram initData:", webApp.initData);
            console.log("initDataUnsafe:", webApp.initDataUnsafe);

            webApp.setHeaderColor(webApp.themeParams.bg_color || "#17212b");
            webApp.setBackgroundColor(webApp.themeParams.bg_color || "#17212b");

            if (webApp.colorScheme === 'light') {
                document.body.classList.add('light-theme');
                document.body.classList.remove('night-theme', 'rain-theme');
            } else {
                document.body.classList.add('night-theme');
                document.body.classList.remove('light-theme', 'rain-theme');
            }

            const user = webApp.initDataUnsafe?.user;
            if (user) {
                initUserProfile(user);
                return true;
            } else {
                alert("Нет данных пользователя. Убедись, что WebApp открыт через Telegram.");
            }
        }
        return false;
    }

    // Профиль пользователя
    function initUserProfile(user) {
        const profileHTML = `
            <div class="profile-header">
                <div class="profile-avatar" 
                     style="${user.photo_url ? `background-image: url(${user.photo_url})` : 'background: linear-gradient(135deg, #00c6ff, #0072ff)'}">
                    ${user.photo_url ? '' : (user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
                </div>
                <div class="profile-info">
                    <div class="profile-name">${user.first_name || ''} ${user.last_name || ''}</div>
                    <div class="profile-username">${user.username ? `@${user.username}` : 'Choyxona FM'}</div>
                </div>
            </div>
            <div class="profile-stats">
                <div class="stat-item">
                    <div class="stat-value">24</div>
                    <div class="stat-label">часов</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">128</div>
                    <div class="stat-label">треков</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">7</div>
                    <div class="stat-label">дней</div>
                </div>
            </div>
        `;
        profileSection.innerHTML = profileHTML;
    }

    // Плей
    playBtn.addEventListener('click', function() {
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    });

    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = volumeSlider.value;
    });

    // Аудио анализатор
    let audioContext;
    let analyser;
    let dataArray;
    let animationFrameId;

    function initAudioAnalyser() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(audioPlayer);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }

        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            analyser.getByteFrequencyData(dataArray);

            for (let i = 0; i < bars.length; i++) {
                const value = dataArray[Math.floor(i * dataArray.length / bars.length)];
                const height = Math.max(5, value * 0.7);
                bars[i].style.height = `${height}px`;
                const hue = 200 + value * 0.4;
                bars[i].style.background = `linear-gradient(to top, 
                    hsla(${hue}, 100%, 50%, 0.8), 
                    hsla(${hue + 20}, 100%, 65%, 0.8))`;
            }
        }

        animate();
    }

    audioPlayer.addEventListener('play', function() {
        playIcon.textContent = '⏸';
        setStatus(status.CONNECTED);
        initAudioAnalyser();
    });

    audioPlayer.addEventListener('pause', function() {
        playIcon.textContent = '▶';
        setStatus(status.PAUSED);
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    });

    audioPlayer.addEventListener('waiting', () => setStatus(status.BUFFERING));
    audioPlayer.addEventListener('playing', () => setStatus(status.CONNECTED));
    audioPlayer.addEventListener('error', () => setStatus(status.ERROR));

    // Автовоспроизведение
    setTimeout(() => {
        audioPlayer.play().then(() => {
            playIcon.textContent = '⏸';
            setStatus(status.CONNECTED);
        }).catch(e => {
            console.warn("Автовоспроизведение заблокировано:", e);
            setStatus({ text: "Нажмите ▶", color: "#ff0", class: "" });
        });
    }, 1500);

    // Prev/Next
    document.getElementById('prev-btn').addEventListener('click', () => {
        setStatus(status.SWITCHING);
        setTimeout(() => setStatus(status.CONNECTED), 800);
    });
    document.getElementById('next-btn').addEventListener('click', () => {
        setStatus(status.SWITCHING);
        setTimeout(() => setStatus(status.CONNECTED), 800);
    });

    // Навигация
    radioBtn.addEventListener('click', () => {
        playerContainer.style.display = 'block';
        profileSection.style.display = 'none';
        radioBtn.classList.add('active');
        profileBtn.classList.remove('active');
    });
    profileBtn.addEventListener('click', () => {
        playerContainer.style.display = 'none';
        profileSection.style.display = 'block';
        profileBtn.classList.add('active');
        radioBtn.classList.remove('active');
    });

    // Темы
    themeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            document.body.className = theme + '-theme';
            localStorage.setItem('selectedTheme', theme);
            themeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const savedTheme = localStorage.getItem('selectedTheme') || 'night';
    document.body.className = savedTheme + '-theme';
    document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`)?.classList.add('active');

    // Telegram init
    const isTelegram = initTelegramApp();

    if (!isTelegram) {
        profileSection.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">CF</div>
                <div class="profile-info">
                    <div class="profile-name">Choyxona FM</div>
                    <div class="profile-username">@chayxona_radio</div>
                </div>
            </div>
            <div class="profile-stats">
                <div class="stat-item">
                    <div class="stat-value">24</div>
                    <div class="stat-label">часов</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">128</div>
                    <div class="stat-label">треков</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">7</div>
                    <div class="stat-label">дней</div>
                </div>
            </div>
        `;
    }

    // Обновление трека
    function updateTrackInfo() {
        const songs = [
            "Otabek Muhammad - Sen Emading",
            "Shoxruxxon - Sevgi",
            "Rayhon - Yor Yor",
            "Dilfuza Rahimova - Seni Menga",
            "Ozodbek Nazarbekov - Sevgi Qushi"
        ];
        if (audioPlayer.duration > 0 && !audioPlayer.paused) {
            const randomSong = songs[Math.floor(Math.random() * songs.length)];
            currentSongElement.textContent = randomSong;
        }
    }

    setInterval(updateTrackInfo, 10000);
    updateTrackInfo();

    // Ориентация
    function handleOrientationChange() {
        setTimeout(() => {
            if (audioContext) initAudioAnalyser();
        }, 300);
    }

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
});
