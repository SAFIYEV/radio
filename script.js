document.addEventListener('DOMContentLoaded', function() {
    // Основные элементы
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
    const currentSongElement = document.querySelector('.current-song');
    
    // Инициализация визуализатора
    for (let i = 0; i < 60; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        visualizer.appendChild(bar);
    }
    const bars = document.querySelectorAll('.bar');
    
    // Установка радиостанции
    audioPlayer.src = 'https://region-ru1.tunio.ai/radio-choyxona.aac';
    
    // Статусы подключения
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
            
            // Инициализация интерфейса
            webApp.ready();
            webApp.expand();
            webApp.enableClosingConfirmation();
            
            // Изменение цвета кнопок под тему Telegram
            webApp.setHeaderColor(webApp.themeParams.bg_color || "#17212b");
            webApp.setBackgroundColor(webApp.themeParams.bg_color || "#17212b");
            
            // Обработка данных пользователя
            const user = webApp.initDataUnsafe.user;
            if (user) {
                initUserProfile(user);
            }
            
            // Обработка событий платформы
            webApp.onEvent('themeChanged', () => {
                document.body.classList.toggle('light-theme', webApp.colorScheme === 'light');
            });
            
            return true;
        }
        return false;
    }
    
    // Инициализация профиля пользователя
    function initUserProfile(user) {
        const profileHTML = `
            <div class="profile-header">
                <div class="profile-avatar" id="profile-avatar" 
                     style="${user.photo_url ? `background-image: url(${user.photo_url})` : ''}">
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
    
    // Запуск/пауза
    playBtn.addEventListener('click', function() {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playIcon.textContent = '⏸';
            setStatus(status.CONNECTED);
        } else {
            audioPlayer.pause();
            playIcon.textContent = '▶';
            setStatus(status.PAUSED);
        }
    });
    
    // Регулировка громкости
    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = volumeSlider.value;
    });
    
    // Аудио анализатор
    let audioContext;
    let analyser;
    let dataArray;
    
    function initAudioAnalyser() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(audioPlayer);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        }
        
        function animate() {
            if (!audioPlayer.paused) {
                requestAnimationFrame(animate);
            }
            
            analyser.getByteFrequencyData(dataArray);
            
            for (let i = 0; i < bars.length; i++) {
                const value = dataArray[Math.floor(i * dataArray.length / bars.length)];
                const height = Math.max(5, value * 0.7);
                bars[i].style.height = `${height}px`;
                
                // Динамический цвет
                const hue = 200 + value * 0.4;
                bars[i].style.background = `linear-gradient(to top, 
                    hsla(${hue}, 100%, 50%, 0.8), 
                    hsla(${hue + 20}, 100%, 65%, 0.8))`;
            }
        }
        
        animate();
    }
    
    // Инициализация анализатора
    audioPlayer.addEventListener('play', function() {
        setStatus(status.CONNECTED);
        if (!audioContext) {
            initAudioAnalyser();
        }
    });
    
    // Обработчики статусов
    audioPlayer.addEventListener('waiting', () => setStatus(status.BUFFERING));
    audioPlayer.addEventListener('playing', () => setStatus(status.CONNECTED));
    audioPlayer.addEventListener('pause', () => setStatus(status.PAUSED));
    audioPlayer.addEventListener('error', () => setStatus(status.ERROR));
    
    // Автовоспроизведение
    setTimeout(function() {
        audioPlayer.play().then(() => {
            playIcon.textContent = '⏸';
            setStatus(status.CONNECTED);
        }).catch(e => {
            console.log("Автовоспроизведение заблокировано: ", e);
            setStatus({
                text: "Нажмите ▶", 
                color: "#ff0",
                class: ""
            });
        });
    }, 1500);
    
    // Кнопки Prev/Next
    document.getElementById('prev-btn').addEventListener('click', function() {
        setStatus(status.SWITCHING);
        setTimeout(() => setStatus(status.CONNECTED), 800);
    });
    
    document.getElementById('next-btn').addEventListener('click', function() {
        setStatus(status.SWITCHING);
        setTimeout(() => setStatus(status.CONNECTED), 800);
    });
    
    // Навигация
    radioBtn.addEventListener('click', function() {
        playerContainer.style.display = 'block';
        profileSection.style.display = 'none';
        radioBtn.classList.add('active');
        profileBtn.classList.remove('active');
    });
    
    profileBtn.addEventListener('click', function() {
        playerContainer.style.display = 'none';
        profileSection.style.display = 'block';
        profileBtn.classList.add('active');
        radioBtn.classList.remove('active');
    });
    
    // Переключение тем
    themeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            document.body.className = theme + '-theme';
            localStorage.setItem('selectedTheme', theme);
            
            // Обновление активной кнопки
            themeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Применение сохранённой темы
    const savedTheme = localStorage.getItem('selectedTheme') || 'night';
    document.body.className = savedTheme + '-theme';
    document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`).classList.add('active');
    
    // Инициализация Telegram
    const isTelegram = initTelegramApp();
    
    // Заглушка для тестового профиля
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
    
    // Обновление названия трека
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
    
    // Обработка изменения ориентации
    window.addEventListener('orientationchange', function() {
        if (audioContext) {
            initAudioAnalyser();
        }
    });
});