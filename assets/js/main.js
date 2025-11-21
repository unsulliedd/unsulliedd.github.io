// Translations - loaded from external JSON file
let translations = {};

// Theme & Language Management
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const html = document.documentElement;
const langButtons = document.querySelectorAll('.nav-lang-btn');

// Check if elements exist before using them
if (!themeToggle || !themeIcon) {
    console.warn('Theme toggle elements not found');
}

// Load saved theme or default to dark
let currentTheme = 'dark';
try {
    currentTheme = localStorage.getItem('theme') || 'dark';
} catch (e) {
    console.warn('LocalStorage access denied, defaulting to dark theme');
}
html.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

// Load saved language or default to en
let currentLang = 'en';
try {
    currentLang = localStorage.getItem('lang') || 'en';
} catch (e) {
    console.warn('LocalStorage access denied, defaulting to en');
}

if (themeToggle && themeIcon) {
    themeToggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) {
            // Ignore
        }
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-moon';
        } else {
            themeIcon.className = 'fas fa-sun';
        }
    }
}

// Language Switching
langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        setLanguage(lang);
    });
});

function setLanguage(lang) {
    // Check if translations are loaded
    if (!translations || Object.keys(translations).length === 0) {
        console.warn('Translations not loaded yet, skipping language update');
        return;
    }

    // Check if language exists in translations
    if (!translations[lang]) {
        console.warn(`Language "${lang}" not found in translations, defaulting to "en"`);
        lang = 'en';
    }

    try {
        localStorage.setItem('lang', lang);
    } catch (e) {
        // Ignore
    }

    currentLang = lang;

    // Update buttons
    langButtons.forEach(btn => {
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update text content for elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const keys = key.split('.');
        let value = translations[lang];

        keys.forEach(k => {
            if (value) value = value[k];
        });

        if (value) {
            element.textContent = value;
        }
    });

    // Update placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        const keys = key.split('.');
        let value = translations[lang];

        keys.forEach(k => {
            if (value) value = value[k];
        });

        if (value && element.placeholder !== undefined) {
            element.placeholder = value;
        }
    });

    // Update aria-label attributes
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        const key = element.dataset.i18nAriaLabel;
        const keys = key.split('.');
        let value = translations[lang];

        keys.forEach(k => {
            if (value) value = value[k];
        });

        if (value) {
            element.setAttribute('aria-label', value);
        }
    });

    // Update title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.dataset.i18nTitle;
        const keys = key.split('.');
        let value = translations[lang];

        keys.forEach(k => {
            if (value) value = value[k];
        });

        if (value) {
            element.setAttribute('title', value);
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update CV paths if a CV is currently open
    const cvFrame = document.getElementById('cvFrame');
    if (currentCvType && cvFrame) {
        const cvPath = getCvHtmlPath(currentCvType);
        cvFrame.src = cvPath;
    }
    
    // Update expand button text if it exists
    if (projectsExpandBtn && projectsExpandWrapper && projectsExpandWrapper.style.display !== 'none') {
        updateExpandButtonText();
    }
}

// Load projects from JSON
let projectsData = [];
let filteredProjects = [];

// DOM Elements
const projectsGrid = document.getElementById('projectsGrid');
const highlightsCarousel = document.getElementById('highlightsCarousel');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('projectSearch');
const modal = document.getElementById('projectModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close-modal');
const cvModal = document.getElementById('cvModal');
const cvFrame = document.getElementById('cvFrame');
const closeCvModal = document.querySelector('.close-cv-modal');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const projectsExpandWrapper = document.getElementById('projectsExpandWrapper');
const projectsExpandBtn = document.getElementById('projectsExpandBtn');

// Carousel state
let currentHighlightIndex = 0;
let highlightProjects = [];
let carouselInterval = null;
const CAROUSEL_AUTO_ROTATE_INTERVAL = 5000; // 5 seconds

// Projects expand state
let projectsExpanded = false;
const INITIAL_PROJECTS_LIMIT = 3;

// Load projects data
async function loadProjects() {
    // Ensure DOM elements exist
    if (!projectsGrid) {
        return;
    }
    // highlightsCarousel will be checked in renderHighlights()
    
    const paths = [
        'assets/projects/projects.json',
        '/assets/projects/projects.json',
        './assets/projects/projects.json'
    ];
    
    let lastError = null;
    
    for (const path of paths) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data || !data.projects) {
                throw new Error('Invalid projects data structure');
            }
            projectsData = data.projects;
            filteredProjects = projectsData;
            renderProjects();
            renderHighlights();
            return; // Success, exit function
        } catch (error) {
            lastError = error;
            continue; // Try next path
        }
    }
    
    // If all paths failed
    console.error('Error loading projects from all paths:', lastError);
    const errorMsg = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">Error loading projects. Please check the console for details.</p>';
    if (projectsGrid) {
        projectsGrid.innerHTML = errorMsg;
    }
    const carouselEl = document.getElementById('highlightsCarousel');
    if (carouselEl) {
        carouselEl.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-primary);">Error loading featured projects.</p>';
    }
}

// Render highlights as carousel
function renderHighlights() {
    // Re-check element in case DOM wasn't ready when script loaded
    const carousel = document.getElementById('highlightsCarousel');
    if (!carousel) {
        return;
    }
    
    highlightProjects = projectsData.filter(p => p.highlight);

    if (highlightProjects.length === 0) {
        carousel.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-primary);">No featured projects yet.</p>';
        return;
    }

    // Clear any existing interval
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }

    // Reset index
    currentHighlightIndex = 0;

    // Render all carousel items
    carousel.innerHTML = highlightProjects.map((project, index) => {
        const coverImage = project.image || '';

        return `
            <div class="highlight-carousel-item ${index === 0 ? 'active' : ''}" data-project-id="${project.id}" data-index="${index}">
                <div class="highlight-card" ${coverImage ? `style="background-image: url('${coverImage}');"` : ''}>
                    <div class="list-card-overlay"></div>
                    <div class="list-card">
                        <div class="list-card-wrapper">
                            <div class="list-card-text">
                                <span class="highlight-badge">
                                    <i class="fas ${getProjectTypeIcon(project.type || 'other')}"></i>
                                    ${project.category}
                                </span>
                                <h1 class="list-card-title">${project.name}</h1>
                                <div class="list-card-subinfo">
                                    <span class="box">${project.type === 'unity' ? 'Unity Game' : (project.type === 'dotnet' || project.type === '.net' ? '.NET' : project.type)}</span>
                                    ${project.technologies && project.technologies.length > 0 ? `
                                        <div class="list-card-tags">
                                            ${project.technologies.slice(0, 3).map(tech => `<span class="netflix-tag">${tech}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="list-card-desc">
                                    <p>${project.description}</p>
                                </div>
                            </div>
                        </div>
                        <div class="list-card-actions">
                            <a href="#" class="list-card-actions-link" onclick="event.preventDefault(); event.stopPropagation(); showProjectDetailModal('${project.id}'); return false;">
                                <i class="fas fa-info-circle"></i> View Details
                            </a>
                            ${project.github ? `<a href="${project.github}" target="_blank" class="list-card-actions-link" onclick="event.stopPropagation()">
                                <i class="fab fa-github"></i> GitHub
                            </a>` : ''}
                            ${project.playstore ? `<a href="${project.playstore}" target="_blank" class="list-card-actions-link" onclick="event.stopPropagation()">
                                <i class="fab fa-google-play"></i> Play Store
                            </a>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click event listeners
    document.querySelectorAll('.highlight-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on links or buttons
            if (e.target.closest('a') || e.target.closest('button')) return;
            const carouselItem = card.closest('.highlight-carousel-item');
            if (carouselItem) {
                const projectId = carouselItem.dataset.projectId;
                showProjectDetailModal(projectId);
            }
        });
    });

    // Setup carousel navigation
    setupCarouselNavigation();
    
    // Create and setup dots
    createCarouselDots();

    // Start auto-rotation
    startCarouselAutoRotate();
}

// Setup carousel navigation
function setupCarouselNavigation() {
    const prevBtn = document.getElementById('highlightPrev');
    const nextBtn = document.getElementById('highlightNext');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateCarousel(-1));
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateCarousel(1));
    }

    // Pause on hover
    const carouselEl = document.getElementById('highlightsCarousel');
    if (carouselEl) {
        carouselEl.addEventListener('mouseenter', pauseCarousel);
        carouselEl.addEventListener('mouseleave', startCarouselAutoRotate);
    }
}

// Navigate carousel
function navigateCarousel(direction) {
    if (highlightProjects.length === 0) return;

    // Remove active class from current item
    const currentItem = document.querySelector('.highlight-carousel-item.active');
    if (currentItem) {
        currentItem.classList.remove('active');
        if (direction === -1) {
            currentItem.classList.add('prev');
        }
    }

    // Calculate new index
    currentHighlightIndex += direction;
    if (currentHighlightIndex < 0) {
        currentHighlightIndex = highlightProjects.length - 1;
    } else if (currentHighlightIndex >= highlightProjects.length) {
        currentHighlightIndex = 0;
    }

    // Add active class to new item
    const newItem = document.querySelector(`.highlight-carousel-item[data-index="${currentHighlightIndex}"]`);
    if (newItem) {
        // Remove prev class from all items
        document.querySelectorAll('.highlight-carousel-item').forEach(item => {
            item.classList.remove('prev');
        });
        newItem.classList.add('active');
    }

    // Update dots
    updateCarouselDots();

    // Restart auto-rotate timer
    restartCarouselAutoRotate();
}

// Go to specific carousel slide
function goToCarouselSlide(index) {
    if (highlightProjects.length === 0 || index < 0 || index >= highlightProjects.length) return;
    
    // Remove active class from current item
    const currentItem = document.querySelector('.highlight-carousel-item.active');
    if (currentItem) {
        currentItem.classList.remove('active', 'prev');
    }

    // Set new index
    currentHighlightIndex = index;

    // Add active class to new item
    const newItem = document.querySelector(`.highlight-carousel-item[data-index="${currentHighlightIndex}"]`);
    if (newItem) {
        newItem.classList.add('active');
    }

    // Update dots
    updateCarouselDots();

    // Restart auto-rotate timer
    restartCarouselAutoRotate();
}

// Create carousel dots
function createCarouselDots() {
    const dotsContainer = document.getElementById('carouselDotsContainer');
    if (!dotsContainer || highlightProjects.length <= 1) {
        if (dotsContainer) dotsContainer.style.display = 'none';
        return;
    }

    dotsContainer.innerHTML = '';
    dotsContainer.style.display = 'flex';

    highlightProjects.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.setAttribute('data-index', index);
        dot.addEventListener('click', () => goToCarouselSlide(index));
        dotsContainer.appendChild(dot);
    });
}

// Update carousel dots
function updateCarouselDots() {
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
        if (index === currentHighlightIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Start carousel auto-rotation
function startCarouselAutoRotate() {
    if (highlightProjects.length <= 1) return;

    // Clear existing interval
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }

    // Set new interval
    carouselInterval = setInterval(() => {
        navigateCarousel(1);
    }, CAROUSEL_AUTO_ROTATE_INTERVAL);
}

// Pause carousel auto-rotation
function pauseCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

// Restart carousel auto-rotation
function restartCarouselAutoRotate() {
    pauseCarousel();
    startCarouselAutoRotate();
}

// Render projects
function renderProjects() {
    if (filteredProjects.length === 0) {
        projectsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No projects found.</p>';
        if (projectsExpandWrapper) projectsExpandWrapper.style.display = 'none';
        return;
    }

    // Determine which projects to show
    const projectsToShow = projectsExpanded ? filteredProjects : filteredProjects.slice(0, INITIAL_PROJECTS_LIMIT);
    const hasMoreProjects = filteredProjects.length > INITIAL_PROJECTS_LIMIT;

    projectsGrid.innerHTML = projectsToShow.map(project => `
        <div class="project-card animate-on-scroll" data-project-id="${project.id}">
            <div class="project-image">
                ${project.image
            ? `<img src="${project.image}" alt="${project.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-${getProjectIcon(project.type)}\\'></i>'">`
            : project.screenshots && project.screenshots.length > 0
            ? `<img src="${project.screenshots[0]}" alt="${project.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-${getProjectIcon(project.type)}\\'></i>'">`
            : `<i class="fas fa-${getProjectIcon(project.type)}"></i>`
        }
            </div>
            <div class="project-content">
                <span class="project-type">
                    <i class="fas ${getProjectTypeIcon(project.type || 'other')}"></i>
                    ${project.category}
                </span>
                <h3 class="project-title">${project.name}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-tech">
                    ${project.technologies.slice(0, 4).map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                    ${project.technologies.length > 4 ? `<span class="tech-tag">+${project.technologies.length - 4}</span>` : ''}
                </div>
                <div class="project-links">
                    <a href="#" class="project-link" onclick="event.preventDefault(); event.stopPropagation(); showProjectDetailModal('${project.id}'); return false;">
                        <i class="fas fa-arrow-right"></i> View Details
                    </a>
                    ${project.github ? `<a href="${project.github}" target="_blank" class="project-link" onclick="event.stopPropagation()">
                        <i class="fab fa-github"></i> GitHub
                    </a>` : ''}
                    ${project.playstore ? `<a href="${project.playstore}" target="_blank" class="project-link" onclick="event.stopPropagation()">
                        <i class="fab fa-google-play"></i> Play Store
                    </a>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Show/hide expand button
    if (projectsExpandWrapper) {
        if (hasMoreProjects) {
            projectsExpandWrapper.style.display = 'flex';
            updateExpandButtonText();
        } else {
            projectsExpandWrapper.style.display = 'none';
        }
    }

    // Add click event listeners to project cards
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on links
            if (e.target.closest('a')) return;
            const projectId = card.dataset.projectId;
            showProjectDetailModal(projectId);
        });
    });

    // Trigger animation on scroll
    observeElements();
}

// Toggle projects expansion
function toggleProjectsExpansion() {
    projectsExpanded = !projectsExpanded;
    renderProjects();
    
    // Smooth scroll to projects section if expanding
    if (projectsExpanded) {
        // Wait for DOM to update with new projects
        setTimeout(() => {
            const projectsSection = document.getElementById('projects');
            if (projectsSection) {
                const navbar = document.querySelector('.navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 70;
                const offsetTop = projectsSection.offsetTop - navbarHeight;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }, 200);
    }
}

// Update expand button text
function updateExpandButtonText() {
    if (!projectsExpandBtn) return;
    
    const showLessText = translations[currentLang]?.projects?.showLess || 'Show Less';
    const viewAllText = translations[currentLang]?.projects?.viewAll || 'View All Projects';
    
    if (projectsExpanded) {
        projectsExpandBtn.innerHTML = `<i class="fas fa-chevron-up"></i> <span>${showLessText}</span>`;
    } else {
        const remainingCount = filteredProjects.length - INITIAL_PROJECTS_LIMIT;
        projectsExpandBtn.innerHTML = `<i class="fas fa-chevron-down"></i> <span>${viewAllText} (${remainingCount} more)</span>`;
    }
}

// Get icon based on project type
function getProjectIcon(type) {
    const icons = {
        'unity': 'gamepad',
        'dotnet': 'code',
        'other': 'laptop-code'
    };
    return icons[type] || 'folder';
}

// Get icon class for project type badge
function getProjectTypeIcon(type) {
    if (!type) {
        return 'fa-folder';
    }
    
    const icons = {
        'unity': 'fa-gamepad',
        'dotnet': 'fa-code',
        'other': 'fa-laptop-code'
    };
    
    return icons[type.toLowerCase()] || 'fa-folder';
}

// Filter projects
function filterProjects(filter) {
    if (filter === 'all') {
        filteredProjects = projectsData;
    } else if (filter === 'opensource') {
        filteredProjects = projectsData.filter(project => project.opensource === true);
    } else {
        filteredProjects = projectsData.filter(project => project.type === filter);
    }
    // Reset expansion state when filtering
    projectsExpanded = false;
    renderProjects();
}

// Search projects
function searchProjects(query) {
    const lowerQuery = query.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    let baseProjects = projectsData;

    if (activeFilter === 'opensource') {
        baseProjects = projectsData.filter(p => p.opensource === true);
    } else if (activeFilter !== 'all') {
        baseProjects = projectsData.filter(p => p.type === activeFilter);
    }

    filteredProjects = baseProjects.filter(project =>
        project.name.toLowerCase().includes(lowerQuery) ||
        project.description.toLowerCase().includes(lowerQuery) ||
        project.technologies.some(tech => tech.toLowerCase().includes(lowerQuery))
    );
    // Reset expansion state when searching
    projectsExpanded = false;
    renderProjects();
}

// Show project detail modal with carousel
let currentScreenshotIndex = 0;
let currentProjectScreenshots = [];
let currentTrailerIframe = null; // Track the current trailer iframe to stop it when navigating

// Convert YouTube URL to embed URL
function convertToYouTubeEmbed(url) {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    let videoId = null;
    
    // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (watchMatch) {
        videoId = watchMatch[1];
    }
    
    if (!videoId) return null;
    
    // Return embed URL with autoplay and JS API enabled
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1&enablejsapi=1`;
}

// Make functions globally accessible for onclick handlers
window.showProjectDetailModal = function(projectId) {
    const project = projectsData.find(p => p.id === projectId);
    if (!project) {
        console.error('Project not found:', projectId);
        return;
    }

    const modal = document.getElementById('projectModal');
    const modalBody = document.getElementById('modalBody');
    
    // Stop any currently playing trailer
    if (currentTrailerIframe) {
        try {
            currentTrailerIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } catch (e) {}
        currentTrailerIframe = null;
    }
    
    // Use only screenshots for carousel (cover image is not automatically included)
    const screenshots = project.screenshots || [];
    
    // Check if trailer exists and convert to embed URL
    const trailerEmbedUrl = project.trailer ? convertToYouTubeEmbed(project.trailer) : null;
    
    // Build media items array: trailer first (if exists), then screenshots only
    const mediaItems = [];
    if (trailerEmbedUrl) {
        mediaItems.push({ type: 'video', url: trailerEmbedUrl, isTrailer: true });
    }
    mediaItems.push(...screenshots.map(img => ({ type: 'image', url: img })));
    
    currentProjectScreenshots = mediaItems;
    currentScreenshotIndex = 0;

    // Build modal content
    modalBody.innerHTML = `
        <div class="project-modal-header">
                <div class="project-modal-screenshot-container">
                ${currentProjectScreenshots.length > 0 ? `
                    ${currentProjectScreenshots.length > 1 ? `
                        <div class="project-modal-screenshot-counter">
                            <span id="screenshotCounter">1 / ${currentProjectScreenshots.length}</span>
                        </div>
                    ` : ''}
                    ${currentProjectScreenshots.map((item, index) => {
                        if (item.type === 'video') {
                            return `
                                <div class="project-modal-media-item project-modal-video ${index === 0 ? 'active' : ''}" data-index="${index}">
                                    <iframe 
                                        id="trailer-iframe-${index}"
                                        src="${item.url}" 
                                        frameborder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowfullscreen
                                        class="project-modal-trailer">
                                    </iframe>
                                </div>
                            `;
                        } else {
                            return `
                                <img src="${item.url}" alt="${project.name} ${item.isTrailer ? 'trailer' : 'screenshot'} ${index + 1}" 
                                     class="project-modal-screenshot ${index === 0 ? 'active' : ''}"
                                     onclick="openImageViewer(${index})"
                                     style="cursor: pointer;"
                                     onload="detectImageOrientation(this)"
                                     onerror="this.style.display='none'"
                                     data-index="${index}">
                            `;
                        }
                    }).join('')}
                    ${currentProjectScreenshots.length > 1 ? `
                        <button class="project-modal-screenshot-nav prev" onclick="changeScreenshot(-1)" aria-label="Previous screenshot">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="project-modal-screenshot-nav next" onclick="changeScreenshot(1)" aria-label="Next screenshot">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="project-modal-screenshot-indicators">
                            ${currentProjectScreenshots.map((_, index) => `
                                <div class="project-modal-indicator ${index === 0 ? 'active' : ''}" 
                                     onclick="goToScreenshot(${index})"></div>
                            `).join('')}
                        </div>
                    ` : ''}
                ` : `
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary);">
                        <i class="fas fa-${getProjectIcon(project.type)}" style="font-size: 6rem; color: var(--text-secondary); opacity: 0.5;"></i>
                    </div>
                `}
            </div>
        </div>
        <div class="project-modal-body">
            <div class="project-modal-title-section">
                <div class="project-modal-badges">
                    <span class="project-modal-type-badge">
                        <i class="fas ${getProjectTypeIcon(project.type || 'other')}"></i>
                        ${project.type === 'unity' ? 'Unity Game' : project.type === 'dotnet' ? '.NET Application' : 'Other Project'}
                    </span>
                    <span class="project-modal-category">${project.category}</span>
                    ${project.opensource ? '<span class="project-modal-category" style="background: rgba(34, 197, 94, 0.2); border-color: rgba(34, 197, 94, 0.5); color: #22c55e;"><i class="fas fa-code-branch"></i> Open Source</span>' : ''}
                </div>
                <h2 class="project-modal-title">${project.name}</h2>
                <p class="project-modal-description">${project.description}</p>
            </div>
            <div class="project-modal-sections">
                <div class="project-modal-features">
                    <h3>Key Features</h3>
                    <ul class="project-modal-features-list">
                        ${project.features.map(feature => `
                            <li class="project-modal-feature-item">
                                <i class="fas fa-check-circle"></i>
                                <span>${feature}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="project-modal-sidebar">
                    <div class="project-modal-tech">
                        <h3>Technologies</h3>
                        <div class="project-modal-tech-tags">
                            ${project.technologies.map(tech => `
                                <span class="project-modal-tech-tag">${tech}</span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="project-modal-links">
                        <h3>Links</h3>
                        ${project.github ? `
                            <a href="${project.github}" target="_blank" class="project-modal-link">
                                <i class="fab fa-github"></i>
                                <span>View on GitHub</span>
                            </a>
                        ` : ''}
                        ${project.playstore ? `
                            <a href="${project.playstore}" target="_blank" class="project-modal-link">
                                <i class="fab fa-google-play"></i>
                                <span>Download on Play Store</span>
                            </a>
                        ` : ''}
                        ${!project.github && !project.playstore ? `
                            <p style="color: var(--text-secondary); text-align: center; padding: 1rem;">No external links available</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    updateScreenshotNavigation();
    
    // Detect orientation for initial screenshot after a short delay to ensure image is loaded
    setTimeout(() => {
        const activeScreenshot = document.querySelector('.project-modal-screenshot.active');
        if (activeScreenshot) {
            if (activeScreenshot.complete && activeScreenshot.naturalWidth > 0) {
                detectImageOrientation(activeScreenshot);
            } else {
                activeScreenshot.onload = function() {
                    detectImageOrientation(this);
                };
            }
        }
    }, 100);
    
    // Re-attach close button listener
    setTimeout(() => {
        attachCloseButtonListener();
    }, 100);
}

// Detect image orientation and apply appropriate styling
window.detectImageOrientation = function(img) {
    if (!img || !img.complete) return;
    
    const isPortrait = img.naturalHeight > img.naturalWidth;
    const modalHeader = document.querySelector('.project-modal-header');
    
    if (isPortrait) {
        img.classList.add('portrait');
        img.classList.remove('landscape');
        if (modalHeader) {
            modalHeader.classList.add('portrait-mode');
        }
    } else {
        img.classList.add('landscape');
        img.classList.remove('portrait');
        if (modalHeader) {
            modalHeader.classList.remove('portrait-mode');
        }
    }
}

window.changeScreenshot = function(direction) {
    if (currentProjectScreenshots.length === 0) return;
    
    // Stop current trailer if playing
    stopCurrentTrailer();
    
    currentScreenshotIndex += direction;
    
    if (currentScreenshotIndex < 0) {
        currentScreenshotIndex = currentProjectScreenshots.length - 1;
    } else if (currentScreenshotIndex >= currentProjectScreenshots.length) {
        currentScreenshotIndex = 0;
    }
    
    updateScreenshotDisplay();
    updateScreenshotNavigation();
}

window.goToScreenshot = function(index) {
    if (index < 0 || index >= currentProjectScreenshots.length) return;
    
    // Stop current trailer if playing
    stopCurrentTrailer();
    
    currentScreenshotIndex = index;
    updateScreenshotDisplay();
    updateScreenshotNavigation();
}

// Stop current trailer video
function stopCurrentTrailer() {
    // Stop the tracked iframe
    if (currentTrailerIframe) {
        try {
            currentTrailerIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } catch (e) {
            // Silently fail if postMessage doesn't work
        }
        currentTrailerIframe = null;
    }
    
    // Also stop all video iframes in the modal (in case tracking failed)
    const modal = document.getElementById('projectModal');
    if (modal) {
        const allVideoIframes = modal.querySelectorAll('.project-modal-video iframe');
        allVideoIframes.forEach(iframe => {
            try {
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } catch (e) {
                // Silently fail if postMessage doesn't work
            }
        });
    }
}

// Play current trailer video
function playCurrentTrailer() {
    if (currentTrailerIframe) {
        try {
            currentTrailerIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } catch (e) {
            // Silently fail if postMessage doesn't work
        }
    }
}

function updateScreenshotDisplay() {
    const mediaItems = document.querySelectorAll('.project-modal-screenshot, .project-modal-video');
    const indicators = document.querySelectorAll('.project-modal-indicator');
    const counter = document.getElementById('screenshotCounter');
    
    // Stop any currently playing trailer
    stopCurrentTrailer();
    
    mediaItems.forEach((item, index) => {
        if (index === currentScreenshotIndex) {
            item.classList.add('active');
            
            // If it's a video, track the iframe and play it
            if (item.classList.contains('project-modal-video')) {
                const iframe = item.querySelector('iframe');
                if (iframe) {
                    currentTrailerIframe = iframe;
                    // Play the video when it becomes active (only if it's the first item)
                    if (index === 0) {
                        setTimeout(() => {
                            playCurrentTrailer();
                        }, 100);
                    }
                }
            }
            
            // Detect orientation for active image
            if (item.tagName === 'IMG' && item.complete && item.naturalWidth > 0) {
                detectImageOrientation(item);
            } else if (item.tagName === 'IMG') {
                item.onload = function() {
                    detectImageOrientation(this);
                };
            }
        } else {
            item.classList.remove('active');
        }
    });
    
    indicators.forEach((indicator, index) => {
        if (index === currentScreenshotIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
    
    if (counter && currentProjectScreenshots.length > 1) {
        counter.textContent = `${currentScreenshotIndex + 1} / ${currentProjectScreenshots.length}`;
    }
}

function updateScreenshotNavigation() {
    const prevBtn = document.querySelector('.project-modal-screenshot-nav.prev');
    const nextBtn = document.querySelector('.project-modal-screenshot-nav.next');
    
    if (currentProjectScreenshots.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    } else {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    }
}

// Full-size Image Viewer
let currentImageViewerIndex = 0;

window.openImageViewer = function(index) {
    if (currentProjectScreenshots.length === 0) return;
    
    // Check if the clicked item is a video - don't open image viewer for videos
    const clickedItem = currentProjectScreenshots[index];
    if (clickedItem && clickedItem.type === 'video') {
        return; // Don't open image viewer for videos
    }
    
    // Find the first image index (skip videos)
    let imageIndex = 0;
    for (let i = 0; i < currentProjectScreenshots.length; i++) {
        if (currentProjectScreenshots[i].type === 'image') {
            imageIndex = i;
            if (i >= index) break; // Use the clicked index if it's an image, otherwise use first image
            if (i === index) break;
        }
    }
    
    // Build array of only images for the image viewer
    const imageItems = currentProjectScreenshots.filter(item => item.type === 'image');
    if (imageItems.length === 0) return;
    
    // Find the index in the image-only array
    let viewerIndex = 0;
    for (let i = 0; i < currentProjectScreenshots.length; i++) {
        if (currentProjectScreenshots[i].type === 'image' && i <= index) {
            viewerIndex = imageItems.findIndex(img => img.url === currentProjectScreenshots[i].url);
            if (i === index) break;
        }
    }
    
    currentImageViewerIndex = viewerIndex >= 0 ? viewerIndex : 0;
    const imageViewerModal = document.getElementById('imageViewerModal');
    const imageViewerImg = document.getElementById('imageViewerImg');
    const imageViewerCounter = document.getElementById('imageViewerCounter');
    
    if (!imageViewerModal || !imageViewerImg) return;
    
    // Set initial image
    imageViewerImg.src = imageItems[currentImageViewerIndex].url;
    imageViewerImg.alt = `Full size image ${currentImageViewerIndex + 1}`;
    
    // Update counter
    if (imageViewerCounter) {
        imageViewerCounter.textContent = `${currentImageViewerIndex + 1} / ${imageItems.length}`;
    }
    
    // Show modal
    imageViewerModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Update navigation buttons visibility
    updateImageViewerNavigation();
}

function closeImageViewer() {
    const imageViewerModal = document.getElementById('imageViewerModal');
    if (imageViewerModal) {
        imageViewerModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function navigateImageViewer(direction) {
    if (currentProjectScreenshots.length === 0) return;
    
    currentImageViewerIndex += direction;
    
    if (currentImageViewerIndex < 0) {
        currentImageViewerIndex = currentProjectScreenshots.length - 1;
    } else if (currentImageViewerIndex >= currentProjectScreenshots.length) {
        currentImageViewerIndex = 0;
    }
    
    const imageViewerImg = document.getElementById('imageViewerImg');
    const imageViewerCounter = document.getElementById('imageViewerCounter');
    
    if (imageViewerImg) {
        imageViewerImg.src = currentProjectScreenshots[currentImageViewerIndex];
        imageViewerImg.alt = `Full size image ${currentImageViewerIndex + 1}`;
    }
    
    if (imageViewerCounter) {
        imageViewerCounter.textContent = `${currentImageViewerIndex + 1} / ${currentProjectScreenshots.length}`;
    }
}

function updateImageViewerNavigation() {
    const prevBtn = document.querySelector('.image-viewer-prev');
    const nextBtn = document.querySelector('.image-viewer-next');
    
    if (currentProjectScreenshots.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    } else {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    }
}

// Keyboard navigation for screenshots
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('projectModal');
    const imageViewerModal = document.getElementById('imageViewerModal');
    
    // Handle image viewer keyboard navigation
    if (imageViewerModal && imageViewerModal.style.display === 'flex') {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateImageViewer(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateImageViewer(1);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeImageViewer();
        }
        return;
    }
    
    // Handle project modal keyboard navigation
    if (modal && modal.style.display === 'block') {
        if (e.key === 'ArrowLeft') {
            changeScreenshot(-1);
        } else if (e.key === 'ArrowRight') {
            changeScreenshot(1);
        } else if (e.key === 'Escape') {
            closeProjectModal();
        }
    }
});

// CV Viewer
let currentCvType = '';

// Function to get CV HTML path based on language and type
function getCvHtmlPath(cvType) {
    const lang = currentLang || 'en';
    const langPrefix = lang === 'tr' ? 'TR' : 'EN';
    const cvName = cvType === 'unity' ? 'Unity_GameDeveloper' : 'DotNet_Developer';
    return `assets/docs/CV_LONG_${langPrefix}_${cvName}.html`;
}

// Function to get CV PDF path based on language and type
function getCvPdfPath(cvType) {
    const lang = currentLang || 'en';
    const langPrefix = lang === 'tr' ? 'TR' : 'EN';
    const cvName = cvType === 'unity' ? 'Unity_GameDeveloper' : 'DotNet_Developer';
    return `assets/docs/pdf/CV_${langPrefix}_${cvName}.pdf`;
}

// Function to download PDF version
function downloadCvPdf(cvType) {
    const pdfPath = getCvPdfPath(cvType);
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = pdfPath.split('/').pop();
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// CV Viewer buttons
const cvButtons = document.querySelectorAll('.cv-btn');
cvButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const cvType = btn.dataset.cvType;
        currentCvType = cvType;
        const cvPath = getCvHtmlPath(cvType);
        cvFrame.src = cvPath;
        cvModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
});

// CV Download buttons (in contact section)
const cvDownloadButtons = document.querySelectorAll('.cv-download-btn');
cvDownloadButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the view button
        const cvType = btn.dataset.cvType;
        downloadCvPdf(cvType);
    });
});

// Navbar CV View buttons
const navCvViewButtons = document.querySelectorAll('.nav-cv-view-btn');
navCvViewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent dropdown from closing
        const cvType = btn.dataset.cvType;
        currentCvType = cvType;
        const cvPath = getCvHtmlPath(cvType);
        cvFrame.src = cvPath;
        cvModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
});

// Navbar CV Download buttons
const navCvDownloadButtons = document.querySelectorAll('.nav-cv-download-btn');
navCvDownloadButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent dropdown from closing
        const cvType = btn.dataset.cvType;
        downloadCvPdf(cvType);
    });
});

// CV Modal Download button
const cvModalDownload = document.getElementById('cvModalDownload');
if (cvModalDownload) {
    cvModalDownload.addEventListener('click', () => {
        if (currentCvType) {
            downloadCvPdf(currentCvType);
        }
    });
}

if (closeCvModal) {
    closeCvModal.addEventListener('click', () => {
        cvModal.style.display = 'none';
        cvFrame.src = '';
        currentCvPath = '';
        document.body.style.overflow = 'auto';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === cvModal) {
        cvModal.style.display = 'none';
        cvFrame.src = '';
        currentCvPath = '';
        document.body.style.overflow = 'auto';
    }
});

// Close modal
function closeProjectModal() {
    // Stop any playing trailer - this now stops all videos in the modal
    stopCurrentTrailer();
    
    // Force stop all videos by clearing their src when modal closes
    const modal = document.getElementById('projectModal');
    if (modal) {
        const allVideoIframes = modal.querySelectorAll('.project-modal-video iframe');
        allVideoIframes.forEach(iframe => {
            try {
                // Try to pause first
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } catch (e) {}
            // Clear src to force stop - this ensures video stops completely
            iframe.src = '';
        });
    }
    
    // Reset tracking
    currentTrailerIframe = null;
    currentScreenshotIndex = 0;
    currentProjectScreenshots = [];
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Smooth scrolling
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        const offsetTop = element.offsetTop - 70;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Event Listeners
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterProjects(btn.dataset.filter);
    });
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query === '') {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        filterProjects(activeFilter);
    } else {
        searchProjects(query);
    }
});

if (closeModal) {
closeModal.addEventListener('click', closeProjectModal);
}

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeProjectModal();
    }
});

// Image Viewer Modal Event Listeners
const imageViewerModal = document.getElementById('imageViewerModal');
const imageViewerClose = document.querySelector('.image-viewer-close');
const imageViewerPrev = document.querySelector('.image-viewer-prev');
const imageViewerNext = document.querySelector('.image-viewer-next');

if (imageViewerClose) {
    imageViewerClose.addEventListener('click', closeImageViewer);
}

if (imageViewerPrev) {
    imageViewerPrev.addEventListener('click', () => navigateImageViewer(-1));
}

if (imageViewerNext) {
    imageViewerNext.addEventListener('click', () => navigateImageViewer(1));
}

if (imageViewerModal) {
    window.addEventListener('click', (e) => {
        if (e.target === imageViewerModal) {
            closeImageViewer();
        }
    });
}

// Re-attach close button listener after modal content is updated
function attachCloseButtonListener() {
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeProjectModal);
    }
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        smoothScroll(target);
        navMenu.classList.remove('active');
    });
});

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Navbar scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.boxShadow = 'var(--shadow)';
    } else {
        navbar.style.boxShadow = 'var(--shadow)';
    }

    lastScroll = currentScroll;
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

function observeElements() {
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = Math.floor(target);
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

// Tech ticker
function initTechTicker() {
    const ticker = document.querySelector('.tech-ticker');
    if (!ticker) return;

    const inner = ticker.querySelector('.tech-inner');
    const items = Array.from(inner.children);
    
    // Calculate width of one complete set
    const singleSetWidth = inner.scrollWidth;
    
    // Clone items multiple times for seamless loop
    const cloneSets = 3; // Create 3 additional copies
    for (let i = 0; i < cloneSets; i++) {
        items.forEach(item => {
            inner.appendChild(item.cloneNode(true));
        });
    }

    let position = 0;
    const speed = 0.5;
    let animationId;
    let isPaused = false;

    function animate() {
        if (!isPaused) {
            position -= speed;
            
            // Reset position when we've scrolled past one complete set
            // This creates the infinite loop illusion
            if (Math.abs(position) >= singleSetWidth) {
                position += singleSetWidth; // Add back instead of resetting to 0
            }
            
            inner.style.transform = `translateX(${position}px)`;
        }
        
        animationId = requestAnimationFrame(animate);
    }

    ticker.addEventListener('mouseenter', () => isPaused = true);
    ticker.addEventListener('mouseleave', () => isPaused = false);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        cancelAnimationFrame(animationId);
    });

    animate();
}

async function loadPartial(elementId, partialPath) {
    try {
        const response = await fetch(partialPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading partial:', error);
    }
}

// Load translations from JSON file
async function loadTranslations() {
    try {
        const response = await fetch('assets/translations/translations.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        translations = await response.json();
        return true;
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to empty object - translations will be empty but app won't crash
        translations = {};
        return false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load translations first
    await loadTranslations();
    
    // Load cube background partial
    await loadPartial('cubeBackground', 'partials/cube-background.html');
    
    // Initialize language after translations are loaded
    if (currentLang && Object.keys(translations).length > 0) {
        setLanguage(currentLang);
    }
    
    // Setup expand button event listener
    if (projectsExpandBtn) {
        projectsExpandBtn.addEventListener('click', toggleProjectsExpansion);
    }
    
    // Then initialize everything else
    loadProjects();
    observeElements();
    
    // Initialize tech ticker after layout is complete
    setTimeout(initTechTicker, 200);
});

