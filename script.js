document.addEventListener('DOMContentLoaded', function() {
    const d3Script = document.createElement('script');
    d3Script.src = "https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js";
    document.head.appendChild(d3Script);

    d3Script.onload = initializeApp;
});

function initializeApp() {
    // Variables globales
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    let currentSection = 0;
    let achievements = [];
    let sectionsViewed = new Set();
    const sections = document.querySelectorAll('[data-section]');
    const navDots = document.getElementById('navDots');
    const progressBar = document.getElementById('progressBar');
    const gamificationPanel = document.getElementById('gamificationPanel');
    const achievementsContainer = document.getElementById('achievements');
    const progressPercent = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');

    // Datos de ejemplo para los gráficos
    const data = {
        originChart: [
            { year: 1886, sales: 9 }, { year: 1889, sales: 500 }, { year: 1892, sales: 2000 },
            { year: 1899, sales: 10000 }, { year: 1915, sales: 50000 }
        ],
        investmentChart: [
            { year: 1889, value: 2300, label: "Adquisición de Candler" },
            { year: 1892, value: 10000, label: "Creación de la compañía" },
            { year: 1899, value: 50000, label: "Inversión en embotellado" }
        ],
        salesEvolution: {
            'global': [{ year: 1950, sales: 10 }, { year: 1970, sales: 50 }, { year: 1990, sales: 150 }, { year: 2024, sales: 190 }],
            'north-america': [{ year: 1950, sales: 8 }, { year: 1970, sales: 30 }, { year: 1990, sales: 80 }, { year: 2024, sales: 95 }],
            'europe': [{ year: 1950, sales: 1 }, { year: 1970, sales: 15 }, { year: 1990, sales: 35 }, { year: 2024, sales: 40 }]
        },
        marketing: {
            'coupons': [{ year: 1886, value: 1000 }, { year: 1890, value: 5000 }, { year: 1914, value: 20000 }],
            'radio': [{ year: 1920, value: 50000 }, { year: 1930, value: 100000 }, { year: 1950, value: 250000 }],
            'tv': [{ year: 1950, value: 500000 }, { year: 1980, value: 1200000 }, { year: 2000, value: 2000000 }]
        },
        sustainability: {
            'water': [{ year: 2010, value: 2.5 }, { year: 2015, value: 2.1 }, { year: 2020, value: 1.8 }, { year: 2025, value: 1.5 }],
            'plastic': [{ year: 2010, value: 0.8 }, { year: 2015, value: 0.9 }, { year: 2020, value: 1.1 }, { year: 2025, value: 1.5 }]
        },
        products: {
            'classic': [{ year: 1886, value: 100 }, { year: 1950, value: 200 }, { year: 2024, value: 300 }],
            'diet': [{ year: 1982, value: 50 }, { year: 2024, value: 150 }]
        },
        categoryPie: [
            { label: 'Refrescos Carbonatados', value: 50 },
            { label: 'Aguas', value: 15 },
            { label: 'Jugos', value: 10 },
            { label: 'Tés y Cafés', value: 10 },
            { label: 'Bebidas Energéticas', value: 15 }
        ],
        financial: {
            'revenue': [{ year: 1980, value: 5 }, { year: 1990, value: 10 }, { year: 2000, value: 20 }, { year: 2010, value: 30 }, { year: 2024, value: 47 }],
            'profit': [{ year: 1980, value: 1 }, { year: 1990, value: 3 }, { year: 2000, value: 6 }, { year: 2010, value: 8 }, { year: 2024, value: 10.7 }]
        }
    };
    
    // Funciones de dibujo de gráficos con D3.js
    function drawLineChart(elementId, chartData, xLabel, yLabel, title, color = "#DC143C") {
        const container = document.getElementById(elementId);
        d3.select(container).select("svg").remove();

        const width = container.clientWidth - margin.left - margin.right;
        const height = container.clientHeight - margin.top - margin.bottom;

        if (width <= 0 || height <= 0) return; // Salir si el tamaño es inválido

        const svg = d3.select(container).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const x = d3.scaleLinear()
            .domain(d3.extent(chartData, d => d.year))
            .range([0, width]);
        
        const y = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.sales || d.value) * 1.1])
            .range([height, 0]);

        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.sales || d.value));

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.append("path")
            .datum(chartData)
            .attr("class", "line")
            .attr("d", line)
            .style("stroke", color);
        
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("fill", "#FFD700")
            .style("font-size", "1rem")
            .text(title);
    }

    function drawBarChart(elementId, chartData, xLabel, yLabel, title, color = "#DC143C") {
        const container = document.getElementById(elementId);
        d3.select(container).select("svg").remove();

        const width = container.clientWidth - margin.left - margin.right;
        const height = container.clientHeight - margin.top - margin.bottom;

        if (width <= 0 || height <= 0) return; // Salir si el tamaño es inválido

        const svg = d3.select(container).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const x = d3.scaleBand()
            .domain(chartData.map(d => d.year || d.label))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.sales || d.value) * 1.1])
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.selectAll(".bar")
            .data(chartData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.year || d.label))
            .attr("width", x.bandwidth())
            .attr("y", height)
            .attr("height", 0)
            .style("fill", color)
            .transition()
            .duration(1000)
            .delay((d, i) => i * 150)
            .attr("y", d => y(d.sales || d.value))
            .attr("height", d => height - y(d.sales || d.value));

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("fill", "#FFD700")
            .style("font-size", "1rem")
            .text(title);
    }
    
    function drawPieChart(elementId, chartData, title) {
        const container = document.getElementById(elementId);
        d3.select(container).select("svg").remove();

        const width = container.clientWidth;
        const height = container.clientHeight;
        const radius = Math.min(width, height) / 2 - 20;

        if (radius <= 0) return; // Salir si el radio es inválido

        const svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        const color = d3.scaleOrdinal(d3.schemeCategory10);
        
        const pie = d3.pie().value(d => d.value);
        const arc = d3.arc().innerRadius(0).outerRadius(radius);
        
        const path = svg.selectAll("path")
            .data(pie(chartData))
            .enter().append("path")
            .attr("fill", d => color(d.data.label))
            .transition()
            .duration(1000)
            .attrTween("d", function(d) {
                const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return function(t) {
                    return arc(i(t));
                };
            });
        
        const legend = svg.selectAll(".legend")
            .data(chartData)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${radius + 20},${(i - chartData.length / 2) * 20})`);
        
        legend.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", d => color(d.label));

        legend.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(d => d.label);

        svg.append("text")
            .attr("x", 0)
            .attr("y", -(height / 2 - 10))
            .attr("text-anchor", "middle")
            .style("fill", "#FFD700")
            .style("font-size", "1rem")
            .text(title);
    }
    
    // Funciones que deben ser globales para el onclick del HTML
    window.scrollToSection = function(sectionIndex) {
        const section = document.querySelector(`[data-section="${sectionIndex}"]`);
        section.scrollIntoView({ behavior: 'smooth' });
    }

    window.showRegionalData = function(region) {
        const chartData = data.salesEvolution[region] || data.salesEvolution['global'];
        drawLineChart('salesEvolutionChart', chartData, 'Año', 'Ventas', `Evolución de Ventas: ${region}`);
        
        document.querySelectorAll('.interactive-buttons .btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.interactive-buttons .btn[onclick="showRegionalData('${region}')"]`).classList.add('active');
    };

    window.showMarketingData = function(era) {
        const chartData = data.marketing[era] || data.marketing['coupons'];
        drawBarChart('marketingChart', chartData, 'Año', 'Efectividad', `Efectividad de Campañas: ${era}`);

        document.querySelectorAll('.interactive-buttons .btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.interactive-buttons .btn[onclick="showMarketingData('${era}')"]`).classList.add('active');
    };

    window.showSustainabilityData = function(category) {
        const chartData = data.sustainability[category] || data.sustainability['water'];
        drawLineChart('sustainabilityChart', chartData, 'Año', 'Valor', `Datos de Sostenibilidad: ${category}`, '#22B14C');

        document.querySelectorAll('.interactive-buttons .btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.interactive-buttons .btn[onclick="showSustainabilityData('${category}')"]`).classList.add('active');
    };

    window.showProductData = function(product) {
        const chartData = data.products[product] || data.products['classic'];
        drawLineChart('productsTimelineChart', chartData, 'Año', 'Volumen', `Evolución del portafolio: ${product}`, '#9370DB');
    
        document.querySelectorAll('.interactive-buttons .btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.interactive-buttons .btn[onclick="showProductData('${product}')"]`).classList.add('active');
    };

    window.showFinancialData = function(dataType) {
        const chartData = data.financial[dataType] || data.financial['revenue'];
        drawLineChart('financialChart', chartData, 'Año', `Valor ($B)`, `Evolución de ${dataType}`, '#FFD700');

        document.querySelectorAll('.interactive-buttons .btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.interactive-buttons .btn[onclick="showFinancialData('${dataType}')"]`).classList.add('active');
    };

    window.answerQuiz = function(selectedButton, isCorrect) {
        const buttons = selectedButton.parentNode.querySelectorAll('.quiz-option');
        buttons.forEach(btn => btn.disabled = true);
        
        const feedback = selectedButton.parentNode.querySelector('#quizFeedback');
        
        if (isCorrect) {
            selectedButton.classList.add('correct');
            feedback.textContent = '✅ ¡Correcto! La primera Coca-Cola costaba 5 centavos.';
            feedback.style.color = '#22B14C';
            const scholarAchievement = window.achievementsList.find(a => a.id === 'scholar');
            if (scholarAchievement && !scholarAchievement.achieved) {
                scholarAchievement.achieved = true;
                showAchievement(scholarAchievement);
                updateGamification();
            }
        } else {
            selectedButton.classList.add('incorrect');
            const correctButton = Array.from(buttons).find(btn => btn.getAttribute('onclick').includes('true'));
            if (correctButton) {
                 correctButton.classList.add('correct');
            }
            feedback.textContent = '❌ Incorrecto. La respuesta correcta es 5 centavos.';
            feedback.style.color = '#8B0000';
        }
    };

    window.answerFutureQuiz = function(selectedButton, isCorrect) {
        const buttons = selectedButton.parentNode.querySelectorAll('.quiz-option');
        buttons.forEach(btn => btn.disabled = true);
        
        const feedback = selectedButton.parentNode.querySelector('#futureQuizFeedback');
        
        if (isCorrect) {
            selectedButton.classList.add('correct');
            feedback.textContent = '✅ ¡Correcto! El cambio hacia bebidas más saludables se considera uno de los mayores desafíos.';
            feedback.style.color = '#22B14C';
        } else {
            selectedButton.classList.add('incorrect');
            const correctButton = Array.from(buttons).find(btn => btn.getAttribute('onclick').includes('true'));
            if (correctButton) {
                 correctButton.classList.add('correct');
            }
            feedback.textContent = '❌ Incorrecto. Aunque todos son desafíos, el cambio de tendencias de salud es el más significativo.';
            feedback.style.color = '#8B0000';
        }
    };

    // Inicialización de elementos interactivos
    function initializeNavigation() {
        sections.forEach((section, index) => {
            const dot = document.createElement('div');
            dot.className = 'nav-dot';
            if (index === 0) dot.classList.add('active');
            dot.onclick = () => scrollToSection(index);
            navDots.appendChild(dot);
        });
    }

    function updateNavigation() {
        const scrollPosition = window.scrollY + window.innerHeight * 0.5;
        let activeSectionIndex = 0;
        sections.forEach((section, index) => {
            if (scrollPosition >= section.offsetTop && scrollPosition < section.offsetTop + section.offsetHeight) {
                activeSectionIndex = index;
            }
        });
        
        if (activeSectionIndex !== currentSection) {
            currentSection = activeSectionIndex;
            document.querySelectorAll('.nav-dot').forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSection);
            });
            sectionsViewed.add(currentSection);
            updateGamification();
        }
    }
    
    function initializeGamification() {
        const achievementsList = [
            { id: 'explorer', name: '🗺️ Explorador', desc: 'Visitaste 3 secciones', requirement: 3, achieved: false },
            { id: 'scholar', name: '🎓 Académico', desc: 'Completaste un quiz', requirement: 1, achieved: false },
            { id: 'completionist', name: '🏆 Completista', desc: 'Visitaste todas las secciones', requirement: 9, achieved: false }
        ];
        window.achievementsList = achievementsList;
        updateGamification();
    }

    function updateGamification() {
        const totalSections = sections.length;
        const progress = (sectionsViewed.size / totalSections) * 100;
        progressPercent.textContent = `${Math.round(progress)}%`;
        progressFill.style.width = `${progress}%`;

        window.achievementsList.forEach(achievement => {
            if (!achievement.achieved) {
                if (achievement.id === 'explorer' && sectionsViewed.size >= 3) {
                    achievement.achieved = true;
                    showAchievement(achievement);
                } else if (achievement.id === 'completionist' && sectionsViewed.size === totalSections) {
                    achievement.achieved = true;
                    showAchievement(achievement);
                }
            }
        });
    }

    function showAchievement(achievement) {
        const achievementElement = document.createElement('div');
        achievementElement.className = 'achievement';
        achievementElement.innerHTML = `
            <span>${achievement.name}</span>
            <span style="font-size: 0.8rem; color: #aaa;">${achievement.desc}</span>
        `;
        achievementsContainer.appendChild(achievementElement);
    }

    // Manejador principal de scroll
    function handleScroll() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPosition = window.scrollY;
        const scrollPercentage = (scrollPosition / docHeight) * 100;
        progressBar.style.width = `${scrollPercentage}%`;

        const fadeInElements = document.querySelectorAll('.fade-in');
        fadeInElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.85) {
                element.classList.add('visible');
            }
        });

        const footerPosition = document.body.offsetHeight - window.innerHeight - 100;
        if (window.scrollY >= footerPosition) {
            navDots.style.position = 'absolute';
            navDots.style.top = `${footerPosition + window.innerHeight / 2}px`;
            gamificationPanel.style.position = 'absolute';
            gamificationPanel.style.top = `${footerPosition + 80}px`;
        } else {
            navDots.style.position = 'fixed';
            navDots.style.top = '50%';
            gamificationPanel.style.position = 'fixed';
            gamificationPanel.style.top = '80px';
        }

        updateNavigation();

        // Activación de las animaciones de los gráficos al hacer scroll
        if (sectionsViewed.has(1) && !document.getElementById('originChart').dataset.animated) {
            drawBarChart('originChart', data.originChart, 'Año', 'Ventas', 'Crecimiento Inicial (1886-1920)');
            drawBarChart('investmentChart', data.investmentChart, 'Año', 'Inversión ($)', 'Inversión vs Retorno', '#FFD700');
            document.getElementById('originChart').dataset.animated = 'true';
        }
        if (sectionsViewed.has(2) && !document.getElementById('salesEvolutionChart').dataset.animated) {
            drawLineChart('salesEvolutionChart', data.salesEvolution['global'], 'Año', 'Ventas', 'Evolución de Ventas por Región');
            document.getElementById('salesEvolutionChart').dataset.animated = 'true';
        }
        if (sectionsViewed.has(3) && !document.getElementById('marketingChart').dataset.animated) {
            drawBarChart('marketingChart', data.marketing['coupons'], 'Año', 'Efectividad', 'Efectividad de Campañas: Cupones');
            document.getElementById('marketingChart').dataset.animated = 'true';
        }
        if (sectionsViewed.has(4) && !document.getElementById('sustainabilityChart').dataset.animated) {
            drawLineChart('sustainabilityChart', data.sustainability['water'], 'Año', 'Eficiencia (%)', 'Eficiencia en el Uso del Agua', '#22B14C');
            document.getElementById('sustainabilityChart').dataset.animated = 'true';
        }
        if (sectionsViewed.has(5) && !document.getElementById('categoryPieChart').dataset.animated) {
            drawPieChart('categoryPieChart', data.categoryPie, 'Participación por Categoría');
            document.getElementById('categoryPieChart').dataset.animated = 'true';
        }
        if (sectionsViewed.has(6) && !document.getElementById('financialChart').dataset.animated) {
            drawLineChart('financialChart', data.financial['revenue'], 'Año', 'Ingresos ($B)', 'Evolución de Ingresos (1980-2024)', '#FFD700');
            document.getElementById('financialChart').dataset.animated = 'true';
        }
    }
    
    // Inicialización de elementos interactivos
    const timelineMarkers = document.querySelectorAll('.timeline-marker');
    const tooltip = d3.select("#tooltip");

    timelineMarkers.forEach(marker => {
        d3.select(marker)
            .on("mouseenter", (e, d) => {
                const year = e.target.getAttribute('data-year');
                const info = e.target.getAttribute('data-info');
                tooltip.html(`<strong>${year}</strong><br>${info}`)
                       .style("display", "block")
                       .style("left", `${e.pageX + 15}px`)
                       .style("top", `${e.pageY - 25}px`);
            })
            .on("mousemove", (e) => {
                tooltip.style("left", `${e.pageX + 15}px`)
                       .style("top", `${e.pageY - 25}px`);
            })
            .on("mouseleave", () => {
                tooltip.style("display", "none");
            });
    });

    // Inicia el proceso de observación para animaciones
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Inicialización de la navegación y eventos
    initializeNavigation();
    initializeGamification();
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
}