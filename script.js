let cooldowns = {};
let currentPair = "";

document.addEventListener("DOMContentLoaded", () => {
    const generateButton = document.getElementById("generate-btn");
    const signalResult = document.getElementById("signal-result");
    const signalTime = document.getElementById("signal-time");
    const currencySelect = document.getElementById("currency-pair");

    let signalUpdateTimeout = null;
    currentPair = currencySelect.value;

    // Lazy loading для графика
    const chartElement = document.getElementById("chart");
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            initChart();
        }
    }, { threshold: 0.1 });
    observer.observe(chartElement);

    generateButton.addEventListener("click", () => {
        generateButton.disabled = true;
        generateButton.classList.add('loading');
        generateButton.textContent = translations[document.getElementById("language").value].waiting;
        console.log("Button clicked, generating signal...");

        if (signalUpdateTimeout) clearTimeout(signalUpdateTimeout);

        signalUpdateTimeout = setTimeout(() => {
            try {
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
                const directionText = isBuy ? translations[language].buy : translations[language].sell;
                const icon = isBuy ? '↑' : '↓';
                const signalDetails = `
                    <div class="signal-details">
                        <div class="signal-pair">${currencyPair}</div>
                        <div class="signal-direction ${isBuy ? "green" : "red"}">
                            <span class="direction-icon">${icon}</span> ${directionText}
                        </div>
                        <div class="signal-timeframe">${translations[language].timeframe}: ${timeframeText}</div>
                        <div class="signal-probability">${translations[language].accuracy}: ${accuracy}%</div>
                    </div>
                `;
                signalResult.innerHTML = signalDetails;
                signalTime.textContent = now;

                // Анимация появления сигнала
                signalResult.style.opacity = 0;
                signalResult.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    signalResult.style.opacity = 1;
                    signalResult.style.transform = 'translateY(0)';
                }, 100);

                const endTime = Date.now() + cooldownDuration;

                if (cooldowns[currencyPair]?.intervalId) {
                    clearInterval(cooldowns[currencyPair].intervalId);
                }

                cooldowns[currencyPair] = { endTime, duration: cooldownDuration };
                startCooldown(currencyPair);

                // Обновление графика
                updateChart(currencyPair, isBuy, accuracy);

                generateButton.classList.remove('loading');
            } catch (error) {
                console.error(error);
                signalResult.innerHTML = `<div class="signal-error">Ошибка генерации сигнала. Попробуйте снова.</div>`;
                generateButton.disabled = false;
                generateButton.textContent = translations[document.getElementById("language").value].generateButton;
                generateButton.classList.remove('loading');
            }
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

    // Загрузка сохранённой темы
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.body.classList.add(savedTheme + "-theme");
    document.getElementById("theme-select").value = savedTheme;

    // Выравнивание языка и темы
    function alignSelectors() {
        if (window.innerWidth <= 768) {
            document.getElementById("language-selector").style.position = '';
            document.getElementById("language-selector").style.top = '';
            document.getElementById("theme-toggle").style.position = '';
            document.getElementById("theme-toggle").style.top = '';
            return;
        }

        const chartBlock = document.getElementById("chart-block");
        const sidebar = document.querySelector(".sidebar");
        const languageSelector = document.getElementById("language-selector");
        const themeToggle = document.getElementById("theme-toggle");

        const chartRect = chartBlock.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();

        const relativeBottom = chartRect.bottom - sidebarRect.top;

        const themeHeight = themeToggle.getBoundingClientRect().height;
        const languageHeight = languageSelector.getBoundingClientRect().height;

        themeToggle.style.position = 'absolute';
        themeToggle.style.top = `${relativeBottom - themeHeight}px`;

        languageSelector.style.position = 'absolute';
        languageSelector.style.top = `${relativeBottom - themeHeight - languageHeight - 10}px`; // 10px gap
    }

    alignSelectors();
    window.addEventListener('resize', alignSelectors);
});

function startCooldown(pair) {
    const generateButton = document.getElementById("generate-btn");
    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');
    generateButton.appendChild(progressBar);

    function updateCooldown() {
        const now = Date.now();
        const remaining = Math.ceil((cooldowns[pair].endTime - now) / 1000);
        const language = document.getElementById("language").value;
        const baseText = translations[language].generateButton;

        if (remaining <= 0) {
            clearInterval(cooldowns[pair].intervalId);
            generateButton.disabled = false;
            generateButton.textContent = baseText;
            progressBar.style.width = '0%';
            delete cooldowns[pair];
            progressBar.remove();
        } else {
            generateButton.disabled = true;
            generateButton.textContent = `${baseText} (${remaining}s)`;
            const progress = ((cooldowns[pair].endTime - now) / cooldowns[pair].duration) * 100;
            progressBar.style.width = `${progress}%`;
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
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const svg = chartContainer
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#A0A0A0")
        .text("График появится после получения сигнала");
}

let tooltip = null; // Глобальный tooltip

function updateChart(pair, isBuy, accuracy) {
    const chartContainer = d3.select("#chart");
    chartContainer.selectAll("*").remove();

    const width = chartContainer.node().getBoundingClientRect().width;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const svg = chartContainer
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const data = Array.from({ length: 30 }, (_, i) => ({
        time: i,
        value: 100 + (Math.random() - 0.5) * 10 * i * (isBuy ? 1 : -1)
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
        .curve(d3.curveCatmullRom.alpha(0.5));

    const area = d3.area()
        .x(d => x(d.time))
        .y0(height - margin.bottom)
        .y1(d => y(d.value))
        .curve(d3.curveCatmullRom.alpha(0.5));

    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "area-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0).attr("y1", y(d3.min(data, d => d.value)))
        .attr("x2", 0).attr("y2", y(d3.max(data, d => d.value)));

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", isBuy ? "rgba(0, 230, 118, 0.2)" : "rgba(255, 82, 82, 0.2)");

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "rgba(0, 0, 0, 0)");

    svg.append("path")
        .datum(data)
        .attr("fill", "url(#area-gradient)")
        .attr("d", area)
        .attr("opacity", 0)
        .transition()
        .duration(1000)
        .attr("opacity", 1);

    const path = svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", isBuy ? "#00E676" : "#FF5252")
        .attr("stroke-width", 2.5)
        .attr("d", line);

    const length = path.node().getTotalLength();
    path.attr("stroke-dasharray", length + " " + length)
        .attr("stroke-dashoffset", length)
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    // Создаём tooltip один раз
    if (!tooltip) {
        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "var(--bg-light)")
            .style("border", "1px solid var(--border-color)")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("pointer-events", "none");
    }

    svg.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("r", 4)
        .attr("cx", d => x(d.time))
        .attr("cy", d => y(d.value))
        .attr("fill", isBuy ? "#00E676" : "#FF5252")
        .attr("opacity", 0.7)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("r", 6).attr("opacity", 1);
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Time: ${d.time}<br>Value: ${d.value.toFixed(2)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 4).attr("opacity", 0.7);
            tooltip.transition().duration(500).style("opacity", 0);
        });

    const zoom = d3.zoom()
        .scaleExtent([1, 5])
        .translateExtent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    svg.call(zoom);

    function zoomed(event) {
        const newX = event.transform.rescaleX(x);
        const newY = event.transform.rescaleY(y);
        svg.selectAll("path.line").attr("d", line.x(d => newX(d.time)));
        svg.selectAll("path.area").attr("d", area.x(d => newX(d.time)).y1(d => newY(d.value)));
        svg.selectAll("circle").attr("cx", d => newX(d.time)).attr("cy", d => newY(d.value));
        svg.select(".x-axis").call(d3.axisBottom(newX));
        svg.select(".y-axis").call(d3.axisLeft(newY));
    }

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0))
        .attr("color", "#555");

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0))
        .attr("color", "#555");
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
    alignSelectors(); // Realign after change
}

function toggleTheme() {
    const theme = document.getElementById("theme-select").value;
    document.body.classList.remove("dark-theme", "light-theme");
    document.body.classList.add(theme + "-theme");
    localStorage.setItem("theme", theme);
    // Анимация перехода темы
    document.body.style.transition = "background-color 0.5s ease, color 0.5s ease";
    setTimeout(() => {
        document.body.style.transition = "";
        alignSelectors(); // Realign after theme change
    }, 500);
}
