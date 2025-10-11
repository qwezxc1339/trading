let cooldowns = {};
let currentPair = "";
let signalHistory = [];
let totalSignals = 0;
let successfulSignals = 0;

const translations = {
    ru: {
        logoText: "Trade Signal Pro",
        currencyLabel: "Актив",
        timeframeLabel: "Временной интервал",
        generateButton: "Получить сигнал",
        waiting: "Анализ...",
        signalTitle: "Торговый сигнал",
        signalPlaceholder: "Нажмите 'Получить сигнал' для генерации торговой рекомендации",
        languageLabel: "Язык интерфейса",
        timeframes: ["5 секунд", "15 секунд", "1 минута", "3 минуты", "5 минут", "10 минут"],
        buy: "ПОКУПКА",
        sell: "ПРОДАЖА",
        timeframe: "Таймфрейм",
        accuracy: "Точность",
        statusWaiting: "Ожидание данных",
        statusActive: "Активный сигнал",
        statusCooldown: "Охлаждение",
        copySignal: "Скопировать сигнал",
        copySuccess: "Сигнал скопирован!",
        totalSignals: "Всего сигналов",
        successRate: "Успешность",
        history: "История сигналов",
        noHistory: "Здесь будет отображаться история ваших торговых сигналов"
    },
    en: {
        logoText: "Trade Signal Pro",
        currencyLabel: "Instrument",
        timeframeLabel: "Timeframe",
        generateButton: "Get Signal",
        waiting: "Analyzing...",
        signalTitle: "Trading Signal",
        signalPlaceholder: "Click 'Get Signal' to generate trading recommendation",
        languageLabel: "Interface Language",
        timeframes: ["5 seconds", "15 seconds", "1 minute", "3 minutes", "5 minutes", "10 minutes"],
        buy: "BUY",
        sell: "SELL",
        timeframe: "Timeframe",
        accuracy: "Accuracy",
        statusWaiting: "Waiting for data",
        statusActive: "Active signal",
        statusCooldown: "Cooldown",
        copySignal: "Copy signal",
        copySuccess: "Signal copied!",
        totalSignals: "Total Signals",
        successRate: "Success Rate",
        history: "Signal History",
        noHistory: "Your trading signal history will be displayed here"
    },
    uz: {
        logoText: "Savdo Signali Pro",
        currencyLabel: "Asbob",
        timeframeLabel: "Vaqt oralig'i",
        generateButton: "Signal Olish",
        waiting: "Tahlil qilmoqda...",
        signalTitle: "Savdo Signali",
        signalPlaceholder: "Savdo tavsiyasini olish uchun 'Signal Olish' ni bosing",
        languageLabel: "Interfeys tili",
        timeframes: ["5 soniya", "15 soniya", "1 daqiqa", "3 daqiqa", "5 daqiqa", "10 daqiqa"],
        buy: "SOTIB OLISH",
        sell: "SOTISH",
        timeframe: "Vaqt oralig'i",
        accuracy: "Aniqlik",
        statusWaiting: "Ma'lumot kutilmoqda",
        statusActive: "Faol signal",
        statusCooldown: "Sovutish",
        copySignal: "Signalni nusxalash",
        copySuccess: "Signal nusxalandi!",
        totalSignals: "Jami signallar",
        successRate: "Muvaffaqiyat darajasi",
        history: "Signal tarixi",
        noHistory: "Sizning savdo signal tarixingiz bu yerda ko'rsatiladi"
    }
};

document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

function initializeApp() {
    const generateButton = document.getElementById("generate-btn");
    const signalResult = document.getElementById("signal-result");
    const signalTime = document.getElementById("signal-time");
    const currencySelect = document.getElementById("currency-pair");
    const copyButton = document.getElementById("copy-signal");
    const zoomInButton = document.getElementById("zoom-in");
    const zoomOutButton = document.getElementById("zoom-out");
    const resetChartButton = document.getElementById("reset-chart");

    let signalUpdateTimeout = null;
    currentPair = currencySelect.value;

    // Initialize components
    initChart();
    updateStats();
    loadHistory();

    // Event listeners
    generateButton.addEventListener("click", generateSignal);
    currencySelect.addEventListener("change", handleCurrencyChange);
    copyButton.addEventListener("click", copySignalToClipboard);
    zoomInButton.addEventListener("click", zoomChart);
    zoomOutButton.addEventListener("click", zoomChart);
    resetChartButton.addEventListener("click", resetChart);

    // Set initial language
    changeLanguage();
}

function generateSignal() {
    const generateButton = document.getElementById("generate-btn");
    const signalResult = document.getElementById("signal-result");
    const signalTime = document.getElementById("signal-time");
    const signalStatus = document.getElementById("signal-status");
    const indicatorDot = document.querySelector(".indicator-dot");
    const currencySelect = document.getElementById("currency-pair");

    generateButton.disabled = true;
    generateButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg><span>${translations[document.getElementById("language").value].waiting}</span>`;

    indicatorDot.classList.add("active");
    signalStatus.textContent = translations[document.getElementById("language").value].statusActive;

    if (signalUpdateTimeout) clearTimeout(signalUpdateTimeout);

    signalUpdateTimeout = setTimeout(() => {
        const currencyPair = currencySelect.value;
        const timeframeText = document.getElementById("timeframe").value;
        const cooldownDuration = parseTimeframeToMs(timeframeText);

        const isBuy = Math.random() > 0.5;
        const accuracy = (Math.random() * 10 + 85).toFixed(2);
        const now = new Date();
        const timeString = now.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        const dateString = now.toLocaleDateString("ru-RU");

        const language = document.getElementById("language").value;
        const signalDetails = `
            <div class="signal-details fade-in">
                <div class="signal-pair">${currencyPair}</div>
                <div class="signal-direction ${isBuy ? "buy" : "sell"}">
                    ${isBuy ? translations[language].buy : translations[language].sell}
                </div>
                <div class="signal-meta">
                    <div class="meta-item">
                        <div class="meta-label">${translations[language].timeframe}</div>
                        <div class="meta-value">${timeframeText}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">${translations[language].accuracy}</div>
                        <div class="meta-value text-success">${accuracy}%</div>
                    </div>
                </div>
            </div>
        `;

        signalResult.innerHTML = signalDetails;
        signalTime.textContent = `${dateString} ${timeString}`;

        // Update statistics
        totalSignals++;
        if (accuracy > 90) successfulSignals++;
        updateStats();

        // Add to history
        addToHistory({
            pair: currencyPair,
            direction: isBuy ? "buy" : "sell",
            timeframe: timeframeText,
            accuracy: accuracy,
            timestamp: now.getTime()
        });

        const endTime = Date.now() + cooldownDuration;

        if (cooldowns[currencyPair]?.intervalId) {
            clearInterval(cooldowns[currencyPair].intervalId);
        }

        cooldowns[currencyPair] = { endTime };
        startCooldown(currencyPair);

        // Update chart
        updateChart(currencyPair, isBuy, accuracy);
    }, 1500);
}

function handleCurrencyChange() {
    const currencySelect = document.getElementById("currency-pair");
    const generateButton = document.getElementById("generate-btn");
    const newPair = currencySelect.value;

    if (cooldowns[currentPair]?.intervalId) {
        clearInterval(cooldowns[currentPair].intervalId);
    }

    currentPair = newPair;

    if (cooldowns[newPair] && cooldowns[newPair].endTime > Date.now()) {
        startCooldown(newPair);
    } else {
        generateButton.disabled = false;
        const language = document.getElementById("language").value;
        generateButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg><span>${translations[language].generateButton}</span>`;

        const indicatorDot = document.querySelector(".indicator-dot");
        const signalStatus = document.getElementById("signal-status");
        indicatorDot.classList.remove("active");
        signalStatus.textContent = translations[language].statusWaiting;
    }
}

function startCooldown(pair) {
    const generateButton = document.getElementById("generate-btn");
    const indicatorDot = document.querySelector(".indicator-dot");
    const signalStatus = document.getElementById("signal-status");

    function updateCooldown() {
        const now = Date.now();
        const remaining = Math.ceil((cooldowns[pair].endTime - now) / 1000);
        const language = document.getElementById("language").value;
        const baseText = translations[language].generateButton;

        if (remaining <= 0) {
            clearInterval(cooldowns[pair].intervalId);
            generateButton.disabled = false;
            generateButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg><span>${baseText}</span>`;
            indicatorDot.classList.remove("active");
            signalStatus.textContent = translations[language].statusWaiting;
            delete cooldowns[pair];
        } else {
            generateButton.disabled = true;
            generateButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg><span>${baseText} (${remaining}s)</span>`;
            indicatorDot.classList.add("active");
            signalStatus.textContent = translations[language].statusCooldown;
        }
    }

    updateCooldown();
    cooldowns[pair].intervalId = setInterval(updateCooldown, 1000);
}

function parseTimeframeToMs(timeframeText) {
    const lowercase = timeframeText.toLowerCase();
    const numberMatch = lowercase.match(/\d+/);
    const value = numberMatch ? parseInt(numberMatch[0], 10) : 30;

    if (lowercase.includes("second") || lowercase.includes("seconds") || lowercase.includes("секунд") || lowercase.includes("секунда") || lowercase.includes("soniya")) {
        return value * 1000;
    }
    if (lowercase.includes("minute") || lowercase.includes("minutes") || lowercase.includes("min") || lowercase.includes("минут") || lowercase.includes("минута") || lowercase.includes("минуты") || lowercase.includes("daqiqa")) {
        return value * 60 * 1000;
    }
    return 30000;
}

function copySignalToClipboard() {
    const signalResult = document.getElementById("signal-result");
    const signalTime = document.getElementById("signal-time").textContent;

    if (signalResult.querySelector('.signal-placeholder')) {
        showNotification('Нет активного сигнала для копирования', 'warning');
        return;
    }

    const pair = signalResult.querySelector('.signal-pair').textContent;
    const direction = signalResult.querySelector('.signal-direction').textContent;
    const timeframe = signalResult.querySelector('.meta-item:nth-child(1) .meta-value').textContent;
    const accuracy = signalResult.querySelector('.meta-item:nth-child(2) .meta-value').textContent;

    const signalText = `Торговый сигнал ${pair}\nНаправление: ${direction}\nТаймфрейм: ${timeframe}\nТочность: ${accuracy}\nВремя: ${signalTime}`;

    navigator.clipboard.writeText(signalText).then(() => {
        showNotification(translations[document.getElementById("language").value].copySuccess, 'success');
    }).catch(() => {
        showNotification('Ошибка копирования', 'error');
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? 'var(--accent-green)' : type === 'error' ? 'var(--accent-red)' : 'var(--accent-blue)'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateStats() {
    document.getElementById('total-signals').textContent = totalSignals;
    const successRate = totalSignals > 0 ? Math.round((successfulSignals / totalSignals) * 100) : 0;
    document.getElementById('success-rate').textContent = `${successRate}%`;
}

function addToHistory(signal) {
    signalHistory.unshift(signal);
    if (signalHistory.length > 10) {
        signalHistory = signalHistory.slice(0, 10);
    }
    saveHistory();
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById('history-list');
    const language = document.getElementById("language").value;

    if (signalHistory.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <p>${translations[language].noHistory}</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = signalHistory.map(signal => `
        <div class="history-item ${signal.direction} slide-in">
            <div class="history-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="${signal.direction === 'buy' ? 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' : 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'}"/>
                </svg>
            </div>
            <div class="history-content">
                <div class="history-pair">${signal.pair}</div>
                <div class="history-details">
                    <span>${signal.direction === 'buy' ? translations[language].buy : translations[language].sell}</span>
                    <span>${translations[language].accuracy}: ${signal.accuracy}%</span>
                    <span>${signal.timeframe}</span>
                </div>
            </div>
            <div class="history-time">${new Date(signal.timestamp).toLocaleTimeString()}</div>
        </div>
    `).join('');
}

function saveHistory() {
    localStorage.setItem('tradingSignalHistory', JSON.stringify(signalHistory));
}

function loadHistory() {
    const saved = localStorage.getItem('tradingSignalHistory');
    if (saved) {
        signalHistory = JSON.parse(saved);
        renderHistory();
    }
}

function initChart() {
    const chartContainer = d3.select("#chart");
    chartContainer.selectAll("*").remove();

    const width = chartContainer.node().getBoundingClientRect().width;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = chartContainer
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--text-tertiary)")
        .style("font-size", "14px")
        .text("График появится после получения сигнала");
}

function updateChart(pair, isBuy, accuracy) {
    const chartContainer = d3.select("#chart");
    chartContainer.selectAll("*").remove();

    const width = chartContainer.node().getBoundingClientRect().width;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = chartContainer
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Generate realistic price data
    const data = [];
    let currentPrice = 100;
    const volatility = 0.02;

    for (let i = 0; i < 50; i++) {
        const change = (Math.random() - 0.5) * volatility * currentPrice;
        currentPrice += change;
        data.push({
            time: i,
            value: currentPrice
        });
    }

    const x = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.value) * 0.99, d3.max(data, d => d.value) * 1.01])
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    // Add gradient
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "line-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", y(d3.min(data, d => d.value)))
        .attr("x2", 0)
        .attr("y2", y(d3.max(data, d => d.value)));

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", isBuy ? "var(--accent-green)" : "var(--accent-red)")
        .attr("stop-opacity", 0.8);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", isBuy ? "var(--accent-green)" : "var(--accent-red)")
        .attr("stop-opacity", 0.2);

    // Add area
    const area = d3.area()
        .x(d => x(d.time))
        .y0(height - margin.bottom)
        .y1(d => y(d.value))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(data)
        .attr("fill", "url(#line-gradient)")
        .attr("d", area);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", isBuy ? "var(--accent-green)" : "var(--accent-red)")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(() => ""))
        .attr("color", "var(--text-tertiary)");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5))
        .attr("color", "var(--text-tertiary)");

    // Add current price label
    const lastPrice = data[data.length - 1].value;
    svg.append("text")
        .attr("x", width - margin.right - 4)
        .attr("y", y(lastPrice) - 8)
        .attr("text-anchor", "end")
        .attr("fill", "var(--text-primary)")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .text(lastPrice.toFixed(4));
}

function zoomChart(event) {
    // Placeholder for zoom functionality
    showNotification('Функция масштабирования в разработке', 'info');
}

function resetChart() {
    initChart();
    showNotification('График сброшен', 'info');
}

function changeLanguage() {
    const language = document.getElementById("language").value;
    const lang = translations[language];

    // Update text content
    document.getElementById("logo-text").textContent = lang.logoText;
    document.getElementById("currency-label").innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.67h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.78-1.18 2.9-3.12 3.16z"/></svg>${lang.currencyLabel}`;
    document.getElementById("timeframe-label").innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>${lang.timeframeLabel}`;

    const generateButton = document.getElementById("generate-btn");
    if (!generateButton.disabled) {
        generateButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg><span>${lang.generateButton}</span>`;
    }

    document.getElementById("signal-title").innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3zm4 0c0 3.87-3.13 7-7 7s-7-3.13-7-7 3.13-7 7-7 7 3.13 7 7zm-4.5 0c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z"/></svg>${lang.signalTitle}`;

    const signalResult = document.getElementById("signal-result");
    const signalPlaceholder = signalResult.querySelector(".signal-placeholder");
    if (signalPlaceholder) {
        signalPlaceholder.innerHTML = `<svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg><p>${lang.signalPlaceholder}</p>`;
    }

    document.querySelector(".language-selector label").innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>${lang.languageLabel}`;

    // Update timeframe options
    const timeframeSelect = document.getElementById("timeframe");
    const timeframes = lang.timeframes;
    timeframeSelect.innerHTML = "";
    timeframes.forEach(timeframe => {
        const option = document.createElement("option");
        option.textContent = timeframe;
        timeframeSelect.appendChild(option);
    });

    // Update stats labels
    document.querySelector('.stat-item:nth-child(1) .stat-label').textContent = lang.totalSignals;
    document.querySelector('.stat-item:nth-child(2) .stat-label').textContent = lang.successRate;

    // Update history
    document.querySelector('.history-header h2').innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>${lang.history}`;

    renderHistory();

    // Update status
    const indicatorDot = document.querySelector(".indicator-dot");
    const signalStatus = document.getElementById("signal-status");
    if (indicatorDot.classList.contains("active")) {
        signalStatus.textContent = lang.statusCooldown;
    } else {
        signalStatus.textContent = lang.statusWaiting;
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0 }
        to { transform: translateX(0); opacity: 1 }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1 }
        to { transform: translateX(100%); opacity: 0 }
    }
`;
document.head.appendChild(style);
