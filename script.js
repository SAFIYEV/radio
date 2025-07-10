document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const visualizer = document.getElementById('visualizer');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const radioBtn = document.getElementById('radio-btn');
    const profileBtn = document.getElementById('profile-btn');
    const playerContainer = document.querySelector('.player-container');
    const profileSection = document.getElementById('profile-section');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const profileName = document.getElementById('profile-name');
    const profileUsername = document.getElementById('profile-username');
    const profileAvatar = document.getElementById('profile-avatar');
    
    // Инициализация визуализатора
    for (let i = 0; i < 40; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        visualizer.appendChild(bar);
    }
    const bars = document.querySelectorAll('.bar');
    
    // Установка радиостанции
    audioPlayer.src = 'https://region-ru1.tunio.ai/radio-choyxona.aac';
    
    // Запуск/пауза
    playBtn.addEventListener('click', function() {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playBtn.innerHTML = '⏸';
            statusText.textContent = 'Играет';
            statusIndicator.style.backgroundColor = '#0f0';
            statusIndicator.style.boxShadow = '0 0 6px #0f0';
        } else {
            audioPlayer.pause();
            playBtn.innerHTML = '▶';
            statusText.textContent = 'Пауза';
            statusIndicator.style.backgroundColor = '#ff0';
            statusIndicator.style.boxShadow = '0 0 6px #ff0';
        }
    });
    
    // Регулировка громкости
    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = volumeSlider.value;
    });
    
    // Создание визуализации
    let audioContext;
    let analyser;
    let dataArray;
    
    function initAudioAnalyser() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audioPlayer);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        function animate() {
            if (!audioPlayer.paused) {
                requestAnimationFrame(animate);
            }
            
            analyser.getByteFrequencyData(dataArray);
            
            for (let i = 0; i < bars.length; i++) {
                const bar = bars[i];
                const value = dataArray[i % bufferLength];
                const height = Math.max(5, value * 0.5);
                bar.style.height = `${height}px`;
                
                // Изменение цвета в зависимости от высоты столбца
                const hue = 200 + value * 0.3;
                bar.style.background = `linear-gradient(to top, hsla(${hue}, 100%, 50%, 0.7), hsla(${hue}, 100%, 70%, 0.7))`;
            }
        }
        
        animate();
    }
    
    // Инициализация анализатора при первом воспроизведении
    audioPlayer.addEventListener('play', function() {
        if (!audioContext) {
            initAudioAnalyser();
        }
    });
    
    // Статус загрузки
    audioPlayer.addEventListener('waiting', function() {
        statusText.textContent = "Загрузка...";
        statusIndicator.style.backgroundColor = "#ff0";
        statusIndicator.style.boxShadow = '0 0 6px #ff0';
    });
    
    audioPlayer.addEventListener('playing', function() {
        statusText.textContent = "Играет";
        statusIndicator.style.backgroundColor = "#0f0";
        statusIndicator.style.boxShadow = '0 0 6px #0f0';
    });
    
    audioPlayer.addEventListener('error', function() {
        statusText.textContent = "Ошибка";
        statusIndicator.style.backgroundColor = "#f00";
        statusIndicator.style.boxShadow = '0 0 6px #f00';
    });
    
    // Автовоспроизведение при загрузке
    setTimeout(function() {
        audioPlayer.play().then(() => {
            playBtn.innerHTML = '⏸';
            statusText.textContent = 'Играет';
            statusIndicator.style.backgroundColor = '#0f0';
            statusIndicator.style.boxShadow = '0 0 6px #0f0';
        }).catch(e => {
            console.log("Автовоспроизведение заблокировано: ", e);
            statusText.textContent = "Нажмите ▶";
            statusIndicator.style.backgroundColor = "#ff0";
            statusIndicator.style.boxShadow = '0 0 6px #ff0';
        });
    }, 1000);
    
    // Обработчики для кнопок Prev/Next
    document.getElementById('prev-btn').addEventListener('click', function() {
        statusText.textContent = "Переключение...";
        statusIndicator.style.backgroundColor = "#ff0";
        statusIndicator.style.boxShadow = '0 0 6px #ff0';
        
        setTimeout(() => {
            statusText.textContent = "Играет";
            statusIndicator.style.backgroundColor = "#0f0";
            statusIndicator.style.boxShadow = '0 0 6px #0f0';
        }, 800);
    });
    
    document.getElementById('next-btn').addEventListener('click', function() {
        statusText.textContent = "Переключение...";
        statusIndicator.style.backgroundColor = "#ff0";
        statusIndicator.style.boxShadow = '0 0 6px #ff0';
        
        setTimeout(() => {
            statusText.textContent = "Играет";
            statusIndicator.style.backgroundColor = "#0f0";
            statusIndicator.style.boxShadow = '0 0 6px #0f0';
        }, 800);
    });
    
    // Навигация - Радио/Профиль
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
            
            // Сохраняем выбранную тему
            localStorage.setItem('selectedTheme', theme);
        });
    });
    
    // Проверка сохранённой темы
    const savedTheme = localStorage.getItem('selectedTheme') || 'night';
    document.body.className = savedTheme + '-theme';
    
    // Инициализация данных пользователя Telegram
    function initTelegramUser() {
        // Проверяем, запущено ли приложение внутри Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            const user = Telegram.WebApp.initDataUnsafe.user;
            
            if (user) {
                profileName.textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                profileUsername.textContent = user.username ? `@${user.username}` : '';
                
                if (user.photo_url) {
                    profileAvatar.style.backgroundImage = `url(${user.photo_url})`;
                    profileAvatar.style.backgroundSize = 'cover';
                    profileAvatar.textContent = '';
                } else {
                    const initials = `${user.first_name ? user.first_name.charAt(0) : ''}${user.last_name ? user.last_name.charAt(0) : ''}`;
                    profileAvatar.textContent = initials;
                }
                return;
            }
        }
        
        // Если данные Telegram недоступны, используем тестовые данные
        profileName.textContent = "No name";
        profileUsername.textContent = "@chayxona_radio";
        profileAvatar.textContent = "АУ";
    }
    
    initTelegramUser();
    
    // Обработка изменения ориентации устройства
    window.addEventListener('orientationchange', function() {
        // Перезапускаем анимацию визуализатора при смене ориентации
        if (audioContext) {
            initAudioAnalyser();
        }
    });
});