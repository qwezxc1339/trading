let cooldowns = {};
let currentPair = "";

document.addEventListener("DOMContentLoaded", () => {
    const generateButton = document.getElementById("generate-btn");
    const signalResult = document.getElementById("signal-result");
    const signalTime = document.getElementById("signal-time");
    const currencySelect = document.getElementById("currency-pair");

    let signalUpdateTimeout = null;
    currentPair = currencySelect.value;

    // Инициализация графика
    initChart();

    generateButton.addEventListener("click", () => {
        generateButton.disabled = true;
        generateButton.textContent = translations[document.getElementById("language").value].waiting;
        console.log("Button clicked, generating signal...");

        if (signalUpdateTimeout) clearTimeout(signalUpdateTimeout);

        signalUpdateTimeout = setTimeout(() => {
            const currencyPair = currencySelect.value;
            const timeframeText = document.getElementById("timeframe").value;
            const cooldownDuration = parseTimeframeToMs(timeframeText);

            const isBuy = Math.random() > 0.5;
            const accuracy = (Math.random() * 10 + 85).toFixed(2);
            const now = new Date().toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });

            const language = document.getElementById("language").value;
            const signalDetails = `
                <div class="signal-details">
                    <div class="signal-pair">${currencyPair}</div>
                    <div class="signal-direction ${isBuy ? "green" : "red"}">
                        ${isBuy ? translations[language].buy : translations[language].sell}
                    </div>
                    <div class="signal-timeframe">${translations[language].timeframe}: ${timeframeText}</div>
                    <div class="signal-probability">${translations[language].accuracy}: ${accuracy}%</div>
                </div>
            `;
            signalResult.innerHTML = signalDetails;
            signalTime.textContent = now;

            const endTime = Date.now() + cooldownDuration;

            if (cooldowns[currencyPair]?.intervalId) {
                clearInterval(cooldowns[currencyPair].intervalId);
            }

            cooldowns[currencyPair] = { endTime };
            startCooldown(currencyPair);

            // Обновление графика (заглушка)
            updateChart(currencyPair, isBuy, accuracy);
        }, 1000);
    });

    currencySelect.addEventListener("change", () => {
        const newPair = currencySelect.value;

        if (cooldowns[currentPair]?.intervalId) {
            clearInterval(cooldowns[currentPair].intervalId);
        }

        currentPair = newPair;

        if (cooldowns[newPair] && cooldowns[newPair].endTime > Date.now()) {
            startCooldown(newPair);
        } else {
            generateButton.disabled = false;
            generateButton.textContent = translations[document.getElementById("language").value].generateButton;
        }
    });
});

function startCooldown(pair) {
    const generateButton = document.getElementById("generate-btn");

    function updateCooldown() {
        const now = Date.now();
        const remaining = Math.ceil((cooldowns[pair].endTime - now) / 1000);
        const language = document.getElementById("language").value;
        const baseText = translations[language].generateButton;

        if (remaining <= 0) {
            clearInterval(cooldowns[pair].intervalId);
            generateButton.disabled = false;
            generateButton.textContent = baseText;
            delete cooldowns[pair];
        } else {
            generateButton.disabled = true;
            generateButton.textContent = `${baseText} (${remaining}s)`;
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

function resetSignalAndChart() {
    const signalResult = document.getElementById("signal-result");
    const signalTime = document.getElementById("signal-time");

    signalResult.innerHTML = `<div class="signal-placeholder">${translations[document.getElementById("language").value].signalPlaceholder}</div>`;
    signalTime.textContent = "";
    initChart();
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
        .attr("fill", "#A0A0A0")
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

    // Пример данных для графика
    const data = Array.from({ length: 10 }, (_, i) => ({
        time: i,
        value: 100 + Math.random() * 50 * (isBuy ? 1 : -1)
    }));

    const x = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.value) - 10, d3.max(data, d => d.value) + 10])
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", isBuy ? "#00E676" : "#FF5252")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
}

const translations = {
    ru: {
        logoText: "Торговый сигнал",
        currencyLabel: "Актив",
        timeframeLabel: "Время",
        generateButton: "Получить сигнал",
        waiting: "Ожидание...",
        signalTitle: "Сигнал",
        signalPlaceholder: "Нажмите 'Получить сигнал'",
        languageLabel: "Язык",
        timeframes: ["5 секунд", "15 секунд", "1 минута", "3 минуты", "5 минут", "10 минут"],
        buy: "Купить",
        sell: "Продать",
        timeframe: "Временной интервал",
        accuracy: "Точность"
    },
    en: {
        logoText: "Trade Signal",
        currencyLabel: "Instrument",
        timeframeLabel: "Time",
        generateButton: "Get Signal",
        waiting: "Waiting...",
        signalTitle: "Signal",
        signalPlaceholder: "Click 'Get Signal'",
        languageLabel: "Language",
        timeframes: ["5 seconds", "15 seconds", "1 minute", "3 minutes", "5 minutes", "10 minutes"],
        buy: "Buy",
        sell: "Sell",
        timeframe: "Timeframe",
        accuracy: "Accuracy"
    },
    uz: {
        logoText: "Savdo Signali",
        currencyLabel: "Asbob",
        timeframeLabel: "Vaqt",
        generateButton: "Signal Olish",
        waiting: "Kutmoqda...",
        signalTitle: "Signal",
        signalPlaceholder: "Signal Olish uchun bosing",
        languageLabel: "Til",
        timeframes: ["5 soniya", "15 soniya", "1 daqiqa", "3 daqiqa", "5 daqiqa", "10 daqiqa"],
        buy: "Sotib olish",
        sell: "Sotish",
        timeframe: "Vaqt oralig'i",
        accuracy: "Aniqlik"
    }
};

function changeLanguage() {
    const language = document.getElementById("language").value;

    document.getElementById("logo-text").textContent = translations[language].logoText;
    document.getElementById("currency-label").textContent = translations[language].currencyLabel;
    document.getElementById("timeframe-label").textContent = translations[language].timeframeLabel;
    document.getElementById("generate-btn").textContent = translations[language].generateButton;
    document.getElementById("signal-title").textContent = translations[language].signalTitle;

    const signalResult = document.getElementById("signal-result");
    const signalPlaceholder = signalResult.querySelector(".signal-placeholder");
    if (signalPlaceholder) {
        signalPlaceholder.textContent = translations[language].signalPlaceholder;
    }

    const languageLabel = document.querySelector(".language-selector label");
    if (languageLabel) languageLabel.textContent = translations[language].languageLabel;

    const timeframeSelect = document.getElementById("timeframe");
    const timeframes = translations[language].timeframes;
    timeframeSelect.innerHTML = "";
    timeframes.forEach(timeframe => {
        const option = document.createElement("option");
        option.textContent = timeframe;
        timeframeSelect.appendChild(option);
    });

    resetSignalAndChart();
}