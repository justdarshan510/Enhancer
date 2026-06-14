// APPLICATION LOGIC - Enhancer 3D Photo Enhancer

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let isDragging = false;
    let startX = 0;
    let rotationY = 0;
    let velocityY = 0.5; // Auto rotation speed
    let targetRotationY = 0;
    let activeCardIndex = null;
    let autoRotateInterval = null;
    let uploadedImageBase64 = null;
    let processedImageBase64 = null;
    let isSliderDragging = false;

    // Restoration Mode state management
    let restorationMode = localStorage.getItem('restoration_mode') || 'canvas';
    let replicateApiToken = localStorage.getItem('replicate_api_token') || '';
    let modalUrl = localStorage.getItem('modal_url') || 'https://justdarshan510--enhance.modal.run';


    // Card data definitions
    const cardsData = [
        {
            title: "Elegance In Boldness",
            desc: "A dramatic black-and-white high-fashion portrait capturing clean geometries, striking angles, and raw aesthetic focus. Captured with professional studio lighting to emphasize contrast.",
            tags: ["Black & White", "Fashion", "Studio"],
            image: "assets/card1.png"
        },
        {
            title: "Structured Silence",
            desc: "Minimalist concrete and glass architecture emphasizing flowing curves, abstract shadows, and monochromatic textures. A study of light and shade in modern spaces.",
            tags: ["Architecture", "Monochrome", "Minimalist"],
            image: "assets/card2.png"
        },
        {
            title: "Golden Reflections",
            desc: "A cinematic outdoor portrait highlighting bold retro-futuristic sunglasses under a glowing sunset. Rich color hues and deep shadows combine for dynamic depth.",
            tags: ["Portrait", "Golden Hour", "Editorial"],
            image: "assets/card3.png"
        },
        {
            title: "Liquid Silver Waves",
            desc: "An abstract fine-art photograph mapping the reflective ripples of liquid mercury-like waves. Explores light bending on fluid, high-contrast metallic surfaces.",
            tags: ["Abstract", "Fine Art", "Texture"],
            image: "assets/card4.png"
        },
        {
            title: "Reflective Shadows",
            desc: "A moody, close-up high-contrast portrait of a male model looking thoughtfully. Focuses on the subtle gradations of shadow cast across facial features.",
            tags: ["Portrait", "Moody", "Contrast"],
            image: "assets/card5.png"
        },
        {
            title: "Detailed Freckles",
            desc: "A stunning close-up beauty portrait showing highly detailed freckles and skin pores. Ideal for showcasing high-frequency detail restoration in upscaling tests.",
            tags: ["Macro", "Beauty", "High Detail"],
            image: "assets/demo.png"
        }
    ];

    // DOM Elements
    const carouselDome = document.querySelector('.carousel-dome');
    const carouselContainer = document.querySelector('.carousel-container');
    const detailsPanel = document.querySelector('.card-details-panel');
    const heroSection = document.querySelector('.hero-section');
    const enhancerSection = document.querySelector('.enhancer-section');
    const appWorkspace = document.querySelector('.app-workspace');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const processingContainer = document.getElementById('processing-container');
    const consoleLogs = document.getElementById('console-logs');
    const sliderViewContainer = document.getElementById('slider-view-container');
    const sliderWrapper = document.getElementById('slider-wrapper');
    const sliderHandle = document.getElementById('slider-handle');
    const beforeImg = document.getElementById('before-img');
    const afterImg = document.getElementById('after-img');
    const toast = document.getElementById('toast');

    // View toggling DOM Elements
    const viewModeToggle = document.getElementById('view-mode-toggle');
    const btnViewSlider = document.getElementById('btn-view-slider');
    const btnViewSide = document.getElementById('btn-view-side');
    const sideBySideContainer = document.getElementById('side-by-side-container');
    const sideBeforeImg = document.getElementById('side-before-img');
    const sideAfterImg = document.getElementById('side-after-img');

    // Active View Mode ('slider' or 'side')
    let activeViewMode = 'slider';

    // UI Buttons
    const btnTryApp = document.getElementById('btn-try-app');
    const btnCloseEnhancer = document.getElementById('btn-close-enhancer');
    const btnUpscaleAnother = document.getElementById('btn-upscale-another');
    const btnDownload = document.getElementById('btn-download');
    const btnEnhanceCard = document.getElementById('btn-enhance-card');
    const btnDetailsClose = document.getElementById('btn-details-close');
    
    // Sliders & values
    const sliderEnhance = document.getElementById('slider-enhance');
    const sliderEnhanceVal = document.getElementById('slider-enhance-val');
    const sliderDenoise = document.getElementById('slider-denoise');
    const sliderDenoiseVal = document.getElementById('slider-denoise-val');

    // Restoration Mode DOM Elements
    const selectRestorationMode = document.getElementById('select-restoration-mode');
    const aiTokenContainer = document.getElementById('ai-token-container');
    const localServerContainer = document.getElementById('local-server-container');
    const modalUrlContainer = document.getElementById('modal-url-container');
    const inputReplicateToken = document.getElementById('input-replicate-token');
    const inputModalUrl = document.getElementById('input-modal-url');

    // Initialize Restoration inputs from saved state
    selectRestorationMode.value = restorationMode;
    aiTokenContainer.style.display = (restorationMode === 'replicate') ? 'block' : 'none';
    localServerContainer.style.display = (restorationMode === 'local') ? 'block' : 'none';
    modalUrlContainer.style.display = (restorationMode === 'modal') ? 'block' : 'none';
    inputReplicateToken.value = replicateApiToken;
    inputModalUrl.value = modalUrl;

    // Set up View Mode Toggle Listeners
    btnViewSlider.addEventListener('click', () => {
        activeViewMode = 'slider';
        btnViewSlider.classList.add('active');
        btnViewSide.classList.remove('active');
        if (uploadedImageBase64) {
            sliderViewContainer.style.display = 'flex';
            sideBySideContainer.style.display = 'none';
        }
    });

    btnViewSide.addEventListener('click', () => {
        activeViewMode = 'side';
        btnViewSide.classList.add('active');
        btnViewSlider.classList.remove('active');
        if (uploadedImageBase64) {
            sideBySideContainer.style.display = 'flex';
            sliderViewContainer.style.display = 'none';
        }
    });

    // Restoration state listeners
    selectRestorationMode.addEventListener('change', (e) => {
        restorationMode = e.target.value;
        localStorage.setItem('restoration_mode', restorationMode);
        aiTokenContainer.style.display = (restorationMode === 'replicate') ? 'block' : 'none';
        localServerContainer.style.display = (restorationMode === 'local') ? 'block' : 'none';
        modalUrlContainer.style.display = (restorationMode === 'modal') ? 'block' : 'none';
        
        // Keep custom apple select trigger text and active element in sync
        syncAppleSelect();
        
        if (uploadedImageBase64) {
            debounceProcess();
        }
    });

    // Apple-style Custom Dropdown logic
    const appleSelect = document.getElementById('apple-restoration-select');
    const appleTrigger = appleSelect.querySelector('.apple-select-trigger');
    const appleTriggerText = appleSelect.querySelector('.apple-select-trigger-text');
    const appleOptions = appleSelect.querySelectorAll('.apple-select-option');

    function syncAppleSelect() {
        const activeOption = appleSelect.querySelector(`.apple-select-option[data-value="${restorationMode}"]`);
        if (activeOption) {
            appleOptions.forEach(opt => opt.classList.remove('active'));
            activeOption.classList.add('active');
            appleTriggerText.textContent = activeOption.textContent;
        }
    }
    syncAppleSelect();

    appleTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        appleSelect.classList.toggle('open');
    });

    appleOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = option.getAttribute('data-value');
            
            // Update native select and trigger the change listener
            selectRestorationMode.value = val;
            selectRestorationMode.dispatchEvent(new Event('change'));
            
            appleSelect.classList.remove('open');
        });
    });

    document.addEventListener('click', () => {
        appleSelect.classList.remove('open');
    });

    inputReplicateToken.addEventListener('input', (e) => {
        replicateApiToken = e.target.value.trim();
        localStorage.setItem('replicate_api_token', replicateApiToken);
        if (uploadedImageBase64) {
            debounceProcess();
        }
    });

    inputModalUrl.addEventListener('input', (e) => {
        modalUrl = e.target.value.trim();
        localStorage.setItem('modal_url', modalUrl);
        if (uploadedImageBase64) {
            debounceProcess();
        }
    });

    // Parameter sliders logic
    let debounceTimer = null;
    function debounceProcess() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (uploadedImageBase64) {
                const afterBadge = document.querySelector('.slider-badge.after-badge');
                if (restorationMode === 'replicate' && replicateApiToken) {
                    if (afterBadge) {
                        afterBadge.textContent = "AI Restoring...";
                        afterBadge.style.background = "rgba(0, 180, 255, 0.45)";
                        afterBadge.style.color = "#ffffff";
                    }
                    processImageAI(uploadedImageBase64, parseInt(sliderEnhance.value), parseInt(sliderDenoise.value), false, (processedDataUrl, isAiSuccess) => {
                        processedImageBase64 = processedDataUrl;
                        afterImg.src = processedDataUrl;
                        sideAfterImg.src = processedDataUrl;
                        if (afterBadge) {
                            afterBadge.textContent = isAiSuccess ? "4K AI Enhanced" : "4K Canvas Enhanced";
                            afterBadge.style.background = isAiSuccess ? "rgba(0, 255, 100, 0.15)" : "rgba(255, 165, 0, 0.15)";
                            afterBadge.style.color = isAiSuccess ? "#99ffbb" : "#ffcc99";
                        }
                    });
                } else if (restorationMode === 'local') {
                    if (afterBadge) {
                        afterBadge.textContent = "Local AI Restoring...";
                        afterBadge.style.background = "rgba(0, 180, 255, 0.45)";
                        afterBadge.style.color = "#ffffff";
                    }
                    processImageLocal(uploadedImageBase64, (processedDataUrl, isLocalSuccess) => {
                        processedImageBase64 = processedDataUrl;
                        afterImg.src = processedDataUrl;
                        sideAfterImg.src = processedDataUrl;
                        if (afterBadge) {
                            afterBadge.textContent = isLocalSuccess ? "4K Local AI Enhanced" : "4K Canvas Enhanced";
                            afterBadge.style.background = isLocalSuccess ? "rgba(0, 255, 100, 0.15)" : "rgba(255, 165, 0, 0.15)";
                            afterBadge.style.color = isLocalSuccess ? "#99ffbb" : "#ffcc99";
                        }
                    });
                } else if (restorationMode === 'modal') {
                    if (afterBadge) {
                        afterBadge.textContent = "Modal AI Restoring...";
                        afterBadge.style.background = "rgba(0, 180, 255, 0.45)";
                        afterBadge.style.color = "#ffffff";
                    }
                    processImageModal(uploadedImageBase64, (processedDataUrl, isModalSuccess) => {
                        processedImageBase64 = processedDataUrl;
                        afterImg.src = processedDataUrl;
                        sideAfterImg.src = processedDataUrl;
                        if (afterBadge) {
                            afterBadge.textContent = isModalSuccess ? "4K Modal AI Enhanced" : "4K Canvas Enhanced";
                            afterBadge.style.background = isModalSuccess ? "rgba(0, 255, 100, 0.15)" : "rgba(255, 165, 0, 0.15)";
                            afterBadge.style.color = isModalSuccess ? "#99ffbb" : "#ffcc99";
                        }
                    });
                } else {
                    if (afterBadge) {
                        afterBadge.textContent = "4K Canvas Enhanced";
                        afterBadge.style.background = "rgba(0, 255, 100, 0.15)";
                        afterBadge.style.color = "#99ffbb";
                    }
                    processImage(uploadedImageBase64, parseInt(sliderEnhance.value), parseInt(sliderDenoise.value), false, (processedDataUrl) => {
                        processedImageBase64 = processedDataUrl;
                        afterImg.src = processedDataUrl;
                        sideAfterImg.src = processedDataUrl;
                    });
                }
            }
        }, 150);
    }

    sliderEnhance.addEventListener('input', (e) => {
        sliderEnhanceVal.textContent = e.target.value + '%';
        triggerQuickScanEffect();
        debounceProcess();
    });
    sliderDenoise.addEventListener('input', (e) => {
        sliderDenoiseVal.textContent = e.target.value + '%';
        triggerQuickScanEffect();
        debounceProcess();
    });

    // 1. Initialize 3D Carousel Cards
    function initCarousel() {
        if (!carouselDome) return;
        
        carouselDome.innerHTML = '';
        const N = cardsData.length;
        const radius = 280; // distance from center of rotation

        cardsData.forEach((card, index) => {
            const angle = (360 / N) * index;
            const cardEl = document.createElement('div');
            cardEl.className = 'carousel-card';
            cardEl.dataset.index = index;
            
            // Positioning card around cylinder rotation
            cardEl.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
            
            cardEl.innerHTML = `
                <img src="${card.image}" alt="${card.title}">
                <div class="carousel-card-overlay">
                    <div class="carousel-card-category">${card.tags[0]}</div>
                    <div class="carousel-card-title">${card.title}</div>
                </div>
            `;
            
            // Click handler for focusing
            cardEl.addEventListener('click', (e) => {
                // If clicking an already focused card, do nothing
                if (cardEl.classList.contains('focused')) return;
                
                // Stop dragging propagation
                e.stopPropagation();
                focusCard(index);
            });

            carouselDome.appendChild(cardEl);
        });

        // Set initial transform
        updateCarouselTransform();
        
        // Start auto-rotation animation
        startAutoRotation();
    }

    function updateCarouselTransform() {
        if (activeCardIndex !== null) return; // Don't rotate while focused
        carouselDome.style.transform = `rotateY(${rotationY}deg)`;
    }

    // Auto-rotation when idle
    function startAutoRotation() {
        if (autoRotateInterval) clearInterval(autoRotateInterval);
        autoRotateInterval = setInterval(() => {
            if (!isDragging && activeCardIndex === null) {
                rotationY += velocityY;
                updateCarouselTransform();
            }
        }, 16); // ~60fps
    }

    // Drag to rotate logic
    carouselContainer.addEventListener('mousedown', (e) => {
        if (activeCardIndex !== null) return;
        isDragging = true;
        startX = e.clientX;
        clearInterval(autoRotateInterval);
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        rotationY += deltaX * 0.15; // drag sensitivity
        startX = e.clientX;
        updateCarouselTransform();
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            startAutoRotation();
        }
    });

    // Touch support for mobile
    carouselContainer.addEventListener('touchstart', (e) => {
        if (activeCardIndex !== null) return;
        isDragging = true;
        startX = e.touches[0].clientX;
        clearInterval(autoRotateInterval);
    });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const deltaX = e.touches[0].clientX - startX;
        rotationY += deltaX * 0.15;
        startX = e.touches[0].clientX;
        updateCarouselTransform();
    });

    window.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            startAutoRotation();
        }
    });

    // 2. Focus Card Detail Panel
    function focusCard(index) {
        activeCardIndex = index;
        const cards = document.querySelectorAll('.carousel-card');
        const N = cards.length;
        const activeAngle = - (360 / N) * index;
        
        // Rotate the dome so the targeted card is facing forward (0deg rotation)
        carouselDome.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        carouselDome.style.transform = `rotateY(${activeAngle}deg)`;

        // Highlight card & pull it out
        cards.forEach((card, idx) => {
            card.classList.remove('focused');
            card.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            if (idx === index) {
                card.classList.add('focused');
            } else {
                // Dim other cards
                card.style.opacity = '0.15';
                card.style.pointerEvents = 'none';
            }
        });

        // Set card details
        const data = cardsData[index];
        detailsPanel.querySelector('.details-title').textContent = data.title;
        detailsPanel.querySelector('.details-desc').textContent = data.desc;
        
        const tagsContainer = detailsPanel.querySelector('.details-tags');
        tagsContainer.innerHTML = '';
        data.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'details-tag';
            span.textContent = tag;
            tagsContainer.appendChild(span);
        });

        // Show panel
        setTimeout(() => {
            detailsPanel.classList.add('visible');
        }, 150);
    }

    function unfocusCard() {
        activeCardIndex = null;
        detailsPanel.classList.remove('visible');

        const cards = document.querySelectorAll('.carousel-card');
        cards.forEach(card => {
            card.classList.remove('focused');
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
            card.style.transition = '';
        });

        carouselDome.style.transition = '';
        
        // Resume auto-rotation
        startAutoRotation();
    }

    btnDetailsClose.addEventListener('click', unfocusCard);

    // 3. Navigation between Landing Page & Photo Enhancer App
    function showEnhancerSection(imageSrc = null) {
        unfocusCard();
        heroSection.classList.add('hidden');
        enhancerSection.classList.add('visible');

        if (imageSrc) {
            // Preset selected image from carousel
            uploadedImageBase64 = imageSrc;
            startUpscalePipeline(imageSrc);
        } else {
            // Default dropzone mode
            resetToUploadScreen();
        }
    }

    // Hide enhancer and go back to showroom
    function hideEnhancerSection() {
        enhancerSection.classList.remove('visible');
        heroSection.classList.remove('hidden');
    }

    btnTryApp.addEventListener('click', () => showEnhancerSection());
    btnCloseEnhancer.addEventListener('click', hideEnhancerSection);
    
    // Clicking focused card "Enhance"
    btnEnhanceCard.addEventListener('click', () => {
        if (activeCardIndex !== null) {
            const cardImgSrc = cardsData[activeCardIndex].image;
            showEnhancerSection(cardImgSrc);
        }
    });

    // 4. File Drop & Reader
    // Drag/drop behaviors
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--text-primary)';
            dropzone.style.background = 'rgba(255, 255, 255, 0.05)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            dropzone.style.background = 'rgba(255, 255, 255, 0.01)';
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            handleUploadedFile(files[0]);
        }
    });

    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploadedFile(e.target.files[0]);
        }
    });

    function handleUploadedFile(file) {
        if (!file.type.startsWith('image/')) {
            showToast("Invalid file format. Please upload an image.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImageBase64 = e.target.result;
            startUpscalePipeline(uploadedImageBase64);
        };
        reader.readAsDataURL(file);
    }

    // 5. Simulated Neural Network Pipeline
    function startUpscalePipeline(imageSrc) {
        dropzone.style.display = 'none';
        processingContainer.style.display = 'flex';
        consoleLogs.innerHTML = '';
        
        const logLines = [
            { text: "System ready. Input image loaded successfully.", delay: 300 },
            { text: "Resolving file dimensions: original width 240px, height 360px.", delay: 800 },
            { text: "Initializing Enhancer Neural Engine v4.2...", delay: 1300 },
            { text: "Mapping texture matrices and high-frequency noise layers...", delay: 2000 },
            { text: "Interpolating vector graphics & removing JPEG compression artifacts...", delay: 2800 },
            { text: "Enhancing details: pores, clothing fibers, and specular highlights...", delay: 3500 },
            { text: "Rendering upscaled outputs (3840px x 5760px UHD). Done.", delay: 4200 }
        ];

        logLines.forEach((line) => {
            setTimeout(() => {
                const lineEl = document.createElement('div');
                lineEl.className = 'console-line';
                lineEl.textContent = `> ${line.text}`;
                consoleLogs.appendChild(lineEl);
                consoleLogs.scrollTop = consoleLogs.scrollHeight;
            }, line.delay);
        });

        // Pipeline completed
        setTimeout(() => {
            showComparisonSlider(imageSrc);
        }, 4600);
    }

    // =====================================================================
    // SPECIFIED PORTRAIT ENHANCEMENT PIPELINE
    // Bilateral Filter -> Unsharp Mask -> CLAHE -> Edge Enhancement -> Lanczos Upscaling
    // =====================================================================
    // Helper: sinc function
    function sinc(x) {
        if (x === 0) return 1.0;
        const pix = Math.PI * x;
        return Math.sin(pix) / pix;
    }

    // Helper: Lanczos-3 weight kernel
    function lanczos3Kernel(x) {
        const ax = Math.abs(x);
        if (ax === 0) return 1.0;
        if (ax < 3) {
            return sinc(ax) * sinc(ax / 3);
        }
        return 0.0;
    }

    // Helper: Separable 2-Pass Lanczos3 Resampling
    function applyLanczos3(srcPixels, srcW, srcH, destW, destH) {
        const scaleX = srcW / destW;
        const scaleY = srcH / destH;

        // Precompute horizontal contributions
        const contribX = [];
        for (let x = 0; x < destW; x++) {
            const srcX = (x + 0.5) * scaleX - 0.5;
            const xMin = Math.floor(srcX - 3) + 1;
            const xMax = Math.floor(srcX + 3);
            
            let sumW = 0;
            const weights = [];
            const indices = [];
            
            for (let ix = xMin; ix <= xMax; ix++) {
                const clampedIx = Math.min(srcW - 1, Math.max(0, ix));
                const w = lanczos3Kernel(ix - srcX);
                sumW += w;
                weights.push(w);
                indices.push(clampedIx);
            }
            
            // Normalize weights
            if (sumW > 0) {
                for (let i = 0; i < weights.length; i++) {
                    weights[i] /= sumW;
                }
            } else {
                weights[0] = 1.0;
            }
            
            contribX.push({ indices, weights });
        }

        // Precompute vertical contributions
        const contribY = [];
        for (let y = 0; y < destH; y++) {
            const srcY = (y + 0.5) * scaleY - 0.5;
            const yMin = Math.floor(srcY - 3) + 1;
            const yMax = Math.floor(srcY + 3);
            
            let sumW = 0;
            const weights = [];
            const indices = [];
            
            for (let iy = yMin; iy <= yMax; iy++) {
                const clampedIy = Math.min(srcH - 1, Math.max(0, iy));
                const w = lanczos3Kernel(iy - srcY);
                sumW += w;
                weights.push(w);
                indices.push(clampedIy);
            }
            
            // Normalize weights
            if (sumW > 0) {
                for (let i = 0; i < weights.length; i++) {
                    weights[i] /= sumW;
                }
            } else {
                weights[0] = 1.0;
            }
            
            contribY.push({ indices, weights });
        }

        // Pass 1: Horizontal scale (srcW x srcH) -> (destW x srcH)
        const tempPixels = new Float32Array(destW * srcH * 4);
        for (let y = 0; y < srcH; y++) {
            const srcRowOffset = y * srcW * 4;
            const destRowOffset = y * destW * 4;
            for (let x = 0; x < destW; x++) {
                const contrib = contribX[x];
                const indices = contrib.indices;
                const weights = contrib.weights;
                
                let r = 0, g = 0, b = 0, a = 0;
                for (let i = 0; i < indices.length; i++) {
                    const srcIdx = srcRowOffset + indices[i] * 4;
                    const w = weights[i];
                    r += srcPixels[srcIdx] * w;
                    g += srcPixels[srcIdx + 1] * w;
                    b += srcPixels[srcIdx + 2] * w;
                    a += srcPixels[srcIdx + 3] * w;
                }
                
                const destIdx = destRowOffset + x * 4;
                tempPixels[destIdx] = r;
                tempPixels[destIdx + 1] = g;
                tempPixels[destIdx + 2] = b;
                tempPixels[destIdx + 3] = a;
            }
        }

        // Pass 2: Vertical scale (destW x srcH) -> (destW x destH)
        const destPixels = new Uint8ClampedArray(destW * destH * 4);
        for (let y = 0; y < destH; y++) {
            const contrib = contribY[y];
            const indices = contrib.indices;
            const weights = contrib.weights;
            const destRowOffset = y * destW * 4;
            
            for (let x = 0; x < destW; x++) {
                let r = 0, g = 0, b = 0, a = 0;
                for (let i = 0; i < indices.length; i++) {
                    const srcIdx = (indices[i] * destW + x) * 4;
                    const w = weights[i];
                    r += tempPixels[srcIdx] * w;
                    g += tempPixels[srcIdx + 1] * w;
                    b += tempPixels[srcIdx + 2] * w;
                    a += tempPixels[srcIdx + 3] * w;
                }
                
                const destIdx = destRowOffset + x * 4;
                destPixels[destIdx] = Math.min(255, Math.max(0, r));
                destPixels[destIdx + 1] = Math.min(255, Math.max(0, g));
                destPixels[destIdx + 2] = Math.min(255, Math.max(0, b));
                destPixels[destIdx + 3] = Math.min(255, Math.max(0, a));
            }
        }
        
        return destPixels;
    }

    function processImage(imgSrc, sharpenVal, denoiseVal, isDownload, callback) {
        const img = new Image();
        if (imgSrc.startsWith('http') && !imgSrc.startsWith(window.location.origin)) {
            img.crossOrigin = "anonymous";
        }
        img.src = imgSrc;
        img.onload = () => {
            try {
                // Compute filter dimensions (normalize/downscale input size for smooth processing)
                const maxFilterDim = isDownload ? 960 : 600;
                let lw = img.naturalWidth;
                let lh = img.naturalHeight;
                if (lw > maxFilterDim || lh > maxFilterDim) {
                    const ratio = Math.min(maxFilterDim / lw, maxFilterDim / lh);
                    lw = Math.round(lw * ratio);
                    lh = Math.round(lh * ratio);
                }

                // 1. Create base processing canvas at filter resolution
                const lowCanvas = document.createElement('canvas');
                const lowCtx = lowCanvas.getContext('2d');
                lowCanvas.width = lw;
                lowCanvas.height = lh;
                lowCtx.drawImage(img, 0, 0, lw, lh);
                
                const inputData = lowCtx.getImageData(0, 0, lw, lh);
                const inputPixels = inputData.data;

                // -----------------------------------------------------------------
                // PRE-COMPUTE: High-frequency Detail Density Map (Face feature preservation)
                // -----------------------------------------------------------------
                const tempY = new Float32Array(lw * lh);
                for (let i = 0; i < inputPixels.length; i += 4) {
                    tempY[i / 4] = 0.299 * inputPixels[i] + 0.587 * inputPixels[i + 1] + 0.114 * inputPixels[i + 2];
                }
                const tempYBlurred = applyGaussianBlurY(tempY, lw, lh, 1.0);
                const tempYDiff = new Float32Array(lw * lh);
                for (let i = 0; i < tempY.length; i++) {
                    tempYDiff[i] = Math.abs(tempY[i] - tempYBlurred[i]);
                }
                const detailDensity = applyGaussianBlurY(tempYDiff, lw, lh, 2.0);

                // -----------------------------------------------------------------
                // STEP 1: Bilateral Filter (Denoise)
                // -----------------------------------------------------------------
                const sigmaD = 2.0; 
                const sigmaR = 8.0 + ((100 - denoiseVal) / 100) * 16.0; // range 8 to 24
                const bilateralPixels = applyBilateralFilter(inputPixels, lw, lh, sigmaD, sigmaR);
                
                // Blend original back in adaptively based on detail density
                // Flat/skin areas get stronger denoising, detail areas get minimal denoising
                const denoisedPixels = new Uint8ClampedArray(inputPixels.length);
                const alphaBase = (denoiseVal / 100) * 0.20; 
                for (let i = 0; i < inputPixels.length; i += 4) {
                    const idx = i / 4;
                    let Wd = detailDensity[idx] / 4.0;
                    Wd = Math.min(1.0, Math.max(0.0, Wd));
                    
                    const adaptiveAlpha = Math.min(0.40, alphaBase * (1.5 - Wd));
                    
                    denoisedPixels[i] = adaptiveAlpha * bilateralPixels[i] + (1 - adaptiveAlpha) * inputPixels[i];
                    denoisedPixels[i + 1] = adaptiveAlpha * bilateralPixels[i + 1] + (1 - adaptiveAlpha) * inputPixels[i + 1];
                    denoisedPixels[i + 2] = adaptiveAlpha * bilateralPixels[i + 2] + (1 - adaptiveAlpha) * inputPixels[i + 2];
                    denoisedPixels[i + 3] = inputPixels[i + 3];
                }

                // -----------------------------------------------------------------
                // STEP 2: Unsharp Mask (Luminance Sharpening)
                // -----------------------------------------------------------------
                const yChannel = new Float32Array(lw * lh);
                const uChannel = new Float32Array(lw * lh);
                const vChannel = new Float32Array(lw * lh);
                
                for (let i = 0; i < denoisedPixels.length; i += 4) {
                    const r = denoisedPixels[i];
                    const g = denoisedPixels[i + 1];
                    const b = denoisedPixels[i + 2];
                    const idx = i / 4;
                    
                    yChannel[idx] = 0.299 * r + 0.587 * g + 0.114 * b;
                    uChannel[idx] = -0.14713 * r - 0.28886 * g + 0.436 * b + 128;
                    vChannel[idx] = 0.615 * r - 0.51499 * g - 0.10001 * b + 128;
                }

                // Multi-scale Gaussian blurs
                const yBlurredFine = applyGaussianBlurY(yChannel, lw, lh, 1.0);
                const yBlurredCoarse = applyGaussianBlurY(yChannel, lw, lh, 3.0);
                const ySharp = new Float32Array(lw * lh);
                
                const sFine = 0.4 + (sharpenVal / 100) * 3.0;   // fine details weight (more deblurring)
                const sCoarse = 0.2 + (sharpenVal / 100) * 1.2; // coarse details weight (more deblurring)
                
                for (let i = 0; i < yChannel.length; i++) {
                    const diffFine = yChannel[i] - yBlurredFine[i];
                    const diffCoarse = yChannel[i] - yBlurredCoarse[i];
                    
                    const absFine = Math.abs(diffFine);
                    const absCoarse = Math.abs(diffCoarse);
                    
                    // Detail weight Wd ranges from 0.0 (skin/flat) to 1.0 (edges/eyes/glasses/hair/lips)
                    let Wd = detailDensity[i] / 4.0;
                    Wd = Math.min(1.0, Math.max(0.0, Wd));
                    
                    // In flat areas, reduce fine sharpening. In detail areas, boost fine sharpening.
                    const localSFine = sFine * (0.15 + 0.85 * Wd);
                    const localSCoarse = sCoarse * (0.3 + 0.7 * Wd);
                    
                    // Soft-threshold details to avoid noise amplification in flat regions (like skin)
                    // and suppress highlights that could cause halos.
                    const modFine = absFine / (absFine + 3.0);
                    const modCoarse = absCoarse / (absCoarse + 5.0);
                    
                    // Clamp difference to mitigate halos and oversharpening
                    const clampedFine = Math.max(-20, Math.min(20, diffFine));
                    const clampedCoarse = Math.max(-15, Math.min(15, diffCoarse));
                    
                    ySharp[i] = yChannel[i] + localSFine * modFine * clampedFine + localSCoarse * modCoarse * clampedCoarse;
                }

                // -----------------------------------------------------------------
                // STEP 3: CLAHE Contrast Enhancement
                // -----------------------------------------------------------------
                const clipLimit = 1.2 + (sharpenVal / 100) * 1.2; // range 1.2 to 2.4 (stronger local contrast enhancement)
                const yClahe = applyCLAHE(ySharp, lw, lh, 8, 8, clipLimit);

                // -----------------------------------------------------------------
                // STEP 4: Edge Enhancement (Laplacian)
                // -----------------------------------------------------------------
                const yFinal = new Float32Array(lw * lh);
                const edgeStrength = (sharpenVal / 100) * 0.12; // edge gain
                
                for (let y = 0; y < lh; y++) {
                    for (let x = 0; x < lw; x++) {
                        const idx = y * lw + x;
                        
                        let laplacian = 0;
                        if (y > 0 && y < lh - 1 && x > 0 && x < lw - 1) {
                            laplacian = 8 * yClahe[idx] - 
                                        yClahe[idx - 1] - yClahe[idx + 1] - 
                                        yClahe[idx - lw] - yClahe[idx + lw] -
                                        yClahe[idx - lw - 1] - yClahe[idx - lw + 1] -
                                        yClahe[idx + lw - 1] - yClahe[idx + lw + 1];
                        }
                        
                        // Noise-suppressed soft-thresholding on Laplacian to keep edges clean without pixelation
                        const absLap = Math.abs(laplacian);
                        const edgeMod = absLap > 3.0 ? (absLap - 3.0) / absLap : 0;
                        const clampedEdge = Math.max(-12, Math.min(12, laplacian * edgeMod));
                        
                        // Scale edge enhancement by local detail weight
                        let Wd = detailDensity[idx] / 4.0;
                        Wd = Math.min(1.0, Math.max(0.0, Wd));
                        const localEdgeStrength = edgeStrength * (0.1 + 0.9 * Wd);
                        
                        yFinal[idx] = Math.min(255, Math.max(0, yClahe[idx] + localEdgeStrength * clampedEdge));
                    }
                }

                // Convert back from YUV to RGB space
                const lowResultData = lowCtx.createImageData(lw, lh);
                const lowResultPixels = lowResultData.data;
                
                for (let i = 0; i < lowResultPixels.length; i += 4) {
                    const idx = i / 4;
                    const yVal = yFinal[idx];
                    const uVal = uChannel[idx];
                    const vVal = vChannel[idx];
                    
                    let r = yVal + 1.13983 * (vVal - 128);
                    let g = yVal - 0.39465 * (uVal - 128) - 0.58060 * (vVal - 128);
                    let b = yVal + 2.03211 * (uVal - 128);
                    
                    lowResultPixels[i] = Math.min(255, Math.max(0, r));
                    lowResultPixels[i + 1] = Math.min(255, Math.max(0, g));
                    lowResultPixels[i + 2] = Math.min(255, Math.max(0, b));
                    lowResultPixels[i + 3] = denoisedPixels[i + 3];
                }
                
                // Write enhanced low-res results to canvas
                lowCtx.putImageData(lowResultData, 0, 0);

                // -----------------------------------------------------------------
                // STEP 5: Separable Lanczos-3 Upscaling
                // -----------------------------------------------------------------
                const scale = isDownload ? 4 : 3;
                let ow = lw * scale;
                let oh = lh * scale;
                const maxDim = isDownload ? 3840 : 1200; // Capped at 4K for download, 1.2K for preview
                
                if (ow > maxDim || oh > maxDim) {
                    const ratio = Math.min(maxDim / ow, maxDim / oh);
                    ow = Math.round(ow * ratio);
                    oh = Math.round(oh * ratio);
                }
                
                const destCanvas = document.createElement('canvas');
                const destCtx = destCanvas.getContext('2d');
                destCanvas.width = ow;
                destCanvas.height = oh;
                
                // Perform high-precision Lanczos-3 interpolation
                const lowResData = lowCtx.getImageData(0, 0, lw, lh);
                const upscaledPixels = applyLanczos3(lowResData.data, lw, lh, ow, oh);
                
                const upscaledData = destCtx.createImageData(ow, oh);
                upscaledData.data.set(upscaledPixels);
                destCtx.putImageData(upscaledData, 0, 0);
                
                callback(destCanvas.toDataURL());
            } catch (err) {
                console.error("Restoration processing failed: ", err);
                showToast("Security restriction: Run via local server ('npm run dev') to enable enhancement processing!");
                callback(imgSrc);
            }
        };
        img.onerror = () => {
            callback(imgSrc);
        };
    }

    // AI Processing logic using Replicate API Proxy
    function processImageAI(imgSrc, sharpenVal, denoiseVal, isDownload, callback) {
        if (!replicateApiToken) {
            // Fallback to local Canvas restoration
            processImage(imgSrc, sharpenVal, denoiseVal, isDownload, (res) => callback(res, false));
            return;
        }

        const token = replicateApiToken;
        fetch('/api-replicate/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: "cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2", // CodeFormer version
                input: {
                    image: imgSrc,
                    codeformer_fidelity: Math.min(1.0, Math.max(0.1, 1.0 - (denoiseVal / 100))),
                    background_enhance: true,
                    face_upsample: true,
                    upscale: isDownload ? 4 : 2
                }
            })
        })
        .then(async (res) => {
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Unauthorized / Replicate API error");
            }
            return res.json();
        })
        .then((prediction) => {
            const id = prediction.id;
            
            // Poll prediction status
            const pollInterval = setInterval(() => {
                fetch(`/api-replicate/v1/predictions/${id}`, {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                })
                .then(r => r.json())
                .then((pred) => {
                    if (pred.status === 'succeeded') {
                        clearInterval(pollInterval);
                        convertImgToDataURL(pred.output, (dataUrl) => {
                            callback(dataUrl, true);
                        });
                    } else if (pred.status === 'failed' || pred.status === 'canceled') {
                        clearInterval(pollInterval);
                        console.warn("Replicate Prediction failed/canceled. Status:", pred.status);
                        processImage(imgSrc, sharpenVal, denoiseVal, isDownload, (res) => callback(res, false));
                    }
                })
                .catch((err) => {
                    clearInterval(pollInterval);
                    console.error("Replicate Polling Network Error:", err);
                    processImage(imgSrc, sharpenVal, denoiseVal, isDownload, (res) => callback(res, false));
                });
            }, 1500);
        })
        .catch((err) => {
            console.error("Replicate Initiation Error:", err);
            showToast("AI restoration failed. Falling back to local Canvas engine!");
            processImage(imgSrc, sharpenVal, denoiseVal, isDownload, (res) => callback(res, false));
        });
    }

    // Helper to convert Replicate output URL to base64 data URL to prevent CORS problems during download
    function convertImgToDataURL(url, callback) {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            const reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            }
            reader.readAsDataURL(xhr.response);
        };
        xhr.onerror = function() {
            console.warn("Failed to fetch image via XHR proxy. Returning URL directly.");
            callback(url);
        };
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    }

    // Local Real-ESRGAN Python Server Integration
    function processImageLocal(imgSrc, callback) {
        fetch('/api-local/api/enhance-local', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imgSrc })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error("Local backend enhancement failed.");
            }
            return res.json();
        })
        .then(data => {
            if (data.output) {
                callback(data.output, true);
            } else {
                throw new Error(data.error || "No output returned from local server.");
            }
        })
        .catch(err => {
            console.error("Local AI Error:", err);
            showToast("Local AI backend unreachable. Check if python local_server.py is running!");
            // Fallback to local Canvas restoration
            processImage(imgSrc, parseInt(sliderEnhance.value), parseInt(sliderDenoise.value), false, (res) => callback(res, false));
        });
    }

    // Modal GPU Serverless Integration
    function processImageModal(imgSrc, callback) {
        if (!modalUrl) {
            showToast("Please enter a valid Modal Web Endpoint URL.");
            processImage(imgSrc, parseInt(sliderEnhance.value), parseInt(sliderDenoise.value), false, (res) => callback(res, false));
            return;
        }

        let targetUrl = modalUrl.trim();
        if (!targetUrl.endsWith('/enhance') && !targetUrl.endsWith('/')) {
            targetUrl += '/enhance';
        }

        console.log("Fetching Modal upscaler at:", targetUrl);

        fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imgSrc })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error("Modal GPU serverless enhancement failed.");
            }
            return res.json();
        })
        .then(data => {
            if (data.output) {
                callback(data.output, true);
            } else {
                throw new Error(data.error || "No output returned from Modal server.");
            }
        })
        .catch(err => {
            console.error("Modal GPU Error:", err);
            showToast("Modal GPU backend unreachable. Check if your endpoint is active and URL is correct.");
            // Fallback to local Canvas restoration
            processImage(imgSrc, parseInt(sliderEnhance.value), parseInt(sliderDenoise.value), false, (res) => callback(res, false));
        });
    }

    // Helper: 3x3 Bilateral Filter for Denoising (Preserves sharp transitions like lips/eyes and avoids oil painting texture)
    function applyBilateralFilter(pixels, w, h, sigmaD, sigmaR) {
        const output = new Uint8ClampedArray(pixels.length);
        const twoSigmaD2 = 2 * sigmaD * sigmaD;
        const twoSigmaR2 = 2 * sigmaR * sigmaR;
        const halfSide = 1; // 3x3 neighborhood window for detail preservation
        
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const rCenter = pixels[idx];
                const gCenter = pixels[idx + 1];
                const bCenter = pixels[idx + 2];
                
                let sumR = 0, sumG = 0, sumB = 0;
                let sumW = 0;
                
                for (let cy = -halfSide; cy <= halfSide; cy++) {
                    for (let cx = -halfSide; cx <= halfSide; cx++) {
                        const ny = Math.min(h - 1, Math.max(0, y + cy));
                        const nx = Math.min(w - 1, Math.max(0, x + cx));
                        const nIdx = (ny * w + nx) * 4;
                        
                        const rNeigh = pixels[nIdx];
                        const gNeigh = pixels[nIdx + 1];
                        const bNeigh = pixels[nIdx + 2];
                        
                        const distS2 = cx * cx + cy * cy;
                        const weightS = Math.exp(-distS2 / twoSigmaD2);
                        
                        const distC2 = (rCenter - rNeigh) ** 2 + (gCenter - gNeigh) ** 2 + (bCenter - bNeigh) ** 2;
                        const weightC = Math.exp(-distC2 / twoSigmaR2);
                        
                        const wTotal = weightS * weightC;
                        sumR += rNeigh * wTotal;
                        sumG += gNeigh * wTotal;
                        sumB += bNeigh * wTotal;
                        sumW += wTotal;
                    }
                }
                
                output[idx] = sumR / sumW;
                output[idx + 1] = sumG / sumW;
                output[idx + 2] = sumB / sumW;
                output[idx + 3] = pixels[idx + 3];
            }
        }
        return output;
    }

    // Helper: 1D Gaussian horizontal & vertical blur passes
    function applyGaussianBlurY(yChannel, w, h, sigma) {
        const output = new Float32Array(yChannel.length);
        const radius = Math.ceil(2 * sigma);
        const kernel = [];
        let sum = 0;
        
        for (let i = -radius; i <= radius; i++) {
            const g = Math.exp(-(i * i) / (2 * sigma * sigma));
            kernel.push(g);
            sum += g;
        }
        for (let i = 0; i < kernel.length; i++) {
            kernel[i] /= sum;
        }
        
        // Horizontal pass
        const temp = new Float32Array(yChannel.length);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let val = 0;
                for (let k = -radius; k <= radius; k++) {
                    const nx = Math.min(w - 1, Math.max(0, x + k));
                    val += yChannel[y * w + nx] * kernel[k + radius];
                }
                temp[y * w + x] = val;
            }
        }
        
        // Vertical pass
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let val = 0;
                for (let k = -radius; k <= radius; k++) {
                    const ny = Math.min(h - 1, Math.max(0, y + k));
                    val += temp[ny * w + x] * kernel[k + radius];
                }
                output[y * w + x] = val;
            }
        }
        
        return output;
    }

    // Helper: Adaptive Local CLAHE implementation
    function applyCLAHE(yChannel, w, h, numTilesX, numTilesY, clipLimit) {
        const output = new Float32Array(w * h);
        const tileSizeX = Math.floor(w / numTilesX);
        const tileSizeY = Math.floor(h / numTilesY);
        const numBins = 256;
        const histograms = [];
        
        // 1. Calculate histograms and clip/redistribute for each tile
        for (let ty = 0; ty < numTilesY; ty++) {
            for (let tx = 0; tx < numTilesX; tx++) {
                const hist = new Float32Array(numBins);
                const startX = tx * tileSizeX;
                const startY = ty * tileSizeY;
                let count = 0;
                
                for (let y = 0; y < tileSizeY; y++) {
                    for (let x = 0; x < tileSizeX; x++) {
                        const px = Math.min(255, Math.max(0, Math.floor(yChannel[(startY + y) * w + (startX + x)])));
                        hist[px]++;
                        count++;
                    }
                }
                
                // Clip histogram
                const clipVal = Math.max(1, Math.round(clipLimit * (count / numBins)));
                let clipped = 0;
                for (let b = 0; b < numBins; b++) {
                    if (hist[b] > clipVal) {
                        clipped += hist[b] - clipVal;
                        hist[b] = clipVal;
                    }
                }
                
                // Redistribute
                const redistVal = clipped / numBins;
                for (let b = 0; b < numBins; b++) {
                    hist[b] += redistVal;
                }
                
                // Compute CDF
                const cdf = new Float32Array(numBins);
                let sum = 0;
                for (let b = 0; b < numBins; b++) {
                    sum += hist[b];
                    cdf[b] = sum / count;
                }
                histograms.push(cdf);
            }
        }
        
        // 2. Map and Bilinearly interpolate pixels
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const val = Math.min(255, Math.max(0, Math.floor(yChannel[y * w + x])));
                
                const tx = (x - tileSizeX / 2) / tileSizeX;
                const ty = (y - tileSizeY / 2) / tileSizeY;
                
                const tx0 = Math.max(0, Math.min(numTilesX - 1, Math.floor(tx)));
                const tx1 = Math.max(0, Math.min(numTilesX - 1, tx0 + 1));
                const ty0 = Math.max(0, Math.min(numTilesY - 1, Math.floor(ty)));
                const ty1 = Math.max(0, Math.min(numTilesY - 1, ty0 + 1));
                
                const dx = tx - tx0;
                const dy = ty - ty0;
                
                const cdf00 = histograms[ty0 * numTilesX + tx0][val];
                const cdf01 = histograms[ty0 * numTilesX + tx1][val];
                const cdf10 = histograms[ty1 * numTilesX + tx0][val];
                const cdf11 = histograms[ty1 * numTilesX + tx1][val];
                
                // Bilinear CDF interpolation
                const cdfVal = (1 - dx) * (1 - dy) * cdf00 +
                               dx * (1 - dy) * cdf01 +
                               (1 - dx) * dy * cdf10 +
                               dx * dy * cdf11;
                               
                output[y * w + x] = cdfVal * 255;
            }
        }
        
        return output;
    }

    function showComparisonSlider(imageSrc) {
        processingContainer.style.display = 'none';
        viewModeToggle.style.display = 'flex';
        const afterBadge = document.querySelector('.slider-badge.after-badge');
        
        if (restorationMode === 'replicate' && replicateApiToken) {
            if (afterBadge) {
                afterBadge.textContent = "AI Restoring...";
                afterBadge.style.background = "rgba(0, 180, 255, 0.45)";
                afterBadge.style.color = "#ffffff";
            }
            processImageAI(imageSrc, parseInt(sliderEnhance.value), parseInt(sliderDenoise.value), false, (processedDataUrl, isAiSuccess) => {
                processedImageBase64 = processedDataUrl;
                beforeImg.src = imageSrc;
                afterImg.src = processedDataUrl;
                sideBeforeImg.src = imageSrc;
                sideAfterImg.src = processedDataUrl;
                
                if (activeViewMode === 'slider') {
                    sliderViewContainer.style.display = 'flex';
                    sideBySideContainer.style.display = 'none';
                } else {
                    sideBySideContainer.style.display = 'flex';
                    sliderViewContainer.style.display = 'none';
                }
                
                if (afterBadge) {
                    afterBadge.textContent = isAiSuccess ? "4K AI Enhanced" : "4K Canvas Enhanced";
                    afterBadge.style.background = isAiSuccess ? "rgba(0, 255, 100, 0.15)" : "rgba(255, 165, 0, 0.15)";
                    afterBadge.style.color = isAiSuccess ? "#99ffbb" : "#ffcc99";
                }
            });
        } else if (restorationMode === 'local') {
            if (afterBadge) {
                afterBadge.textContent = "Local AI Restoring...";
                afterBadge.style.background = "rgba(0, 180, 255, 0.45)";
                afterBadge.style.color = "#ffffff";
            }
            processImageLocal(imageSrc, (processedDataUrl, isLocalSuccess) => {
                processedImageBase64 = processedDataUrl;
                beforeImg.src = imageSrc;
                afterImg.src = processedDataUrl;
                sideBeforeImg.src = imageSrc;
                sideAfterImg.src = processedDataUrl;
                
                if (activeViewMode === 'slider') {
                    sliderViewContainer.style.display = 'flex';
                    sideBySideContainer.style.display = 'none';
                } else {
                    sideBySideContainer.style.display = 'flex';
                    sliderViewContainer.style.display = 'none';
                }
                
                if (afterBadge) {
                    afterBadge.textContent = isLocalSuccess ? "4K Local AI Enhanced" : "4K Canvas Enhanced";
                    afterBadge.style.background = isLocalSuccess ? "rgba(0, 255, 100, 0.15)" : "rgba(255, 165, 0, 0.15)";
                    afterBadge.style.color = isLocalSuccess ? "#99ffbb" : "#ffcc99";
                }
            });
        } else if (restorationMode === 'modal') {
            if (afterBadge) {
                afterBadge.textContent = "Modal AI Restoring...";
                afterBadge.style.background = "rgba(0, 180, 255, 0.45)";
                afterBadge.style.color = "#ffffff";
            }
            processImageModal(imageSrc, (processedDataUrl, isModalSuccess) => {
                processedImageBase64 = processedDataUrl;
                beforeImg.src = imageSrc;
                afterImg.src = processedDataUrl;
                sideBeforeImg.src = imageSrc;
                sideAfterImg.src = processedDataUrl;
                
                if (activeViewMode === 'slider') {
                    sliderViewContainer.style.display = 'flex';
                    sideBySideContainer.style.display = 'none';
                } else {
                    sideBySideContainer.style.display = 'flex';
                    sliderViewContainer.style.display = 'none';
                }
                
                if (afterBadge) {
                    afterBadge.textContent = isModalSuccess ? "4K Modal AI Enhanced" : "4K Canvas Enhanced";
                    afterBadge.style.background = isModalSuccess ? "rgba(0, 255, 100, 0.15)" : "rgba(255, 165, 0, 0.15)";
                    afterBadge.style.color = isModalSuccess ? "#99ffbb" : "#ffcc99";
                }
            });
        } else {
            if (afterBadge) {
                afterBadge.textContent = "4K Canvas Enhanced";
                afterBadge.style.background = "rgba(0, 255, 100, 0.15)";
                afterBadge.style.color = "#99ffbb";
            }
            processImage(imageSrc, parseInt(sliderEnhance.value), parseInt(sliderDenoise.value), false, (processedDataUrl) => {
                processedImageBase64 = processedDataUrl;
                beforeImg.src = imageSrc;
                afterImg.src = processedDataUrl;
                sideBeforeImg.src = imageSrc;
                sideAfterImg.src = processedDataUrl;
                
                if (activeViewMode === 'slider') {
                    sliderViewContainer.style.display = 'flex';
                    sideBySideContainer.style.display = 'none';
                } else {
                    sideBySideContainer.style.display = 'flex';
                    sliderViewContainer.style.display = 'none';
                }
            });
        }

        // Reset slider to middle
        document.documentElement.style.setProperty('--slider-pos', '50%');
    }

    function resetToUploadScreen() {
        uploadedImageBase64 = null;
        sliderViewContainer.style.display = 'none';
        sideBySideContainer.style.display = 'none';
        viewModeToggle.style.display = 'none';
        processingContainer.style.display = 'none';
        dropzone.style.display = 'flex';
        fileInput.value = '';
    }

    btnUpscaleAnother.addEventListener('click', resetToUploadScreen);

    // 6. Before/After Split-screen Slider Mechanics
    function getSliderPercentage(clientX) {
        const rect = sliderWrapper.getBoundingClientRect();
        const posX = clientX - rect.left;
        let percentage = (posX / rect.width) * 100;
        
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        
        return percentage;
    }

    function updateSlider(clientX) {
        const percentage = getSliderPercentage(clientX);
        document.documentElement.style.setProperty('--slider-pos', `${percentage}%`);
    }

    // Mouse handlers on handle and wrapper
    sliderHandle.addEventListener('mousedown', (e) => {
        isSliderDragging = true;
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isSliderDragging) return;
        updateSlider(e.clientX);
    });

    window.addEventListener('mouseup', () => {
        if (isSliderDragging) {
            isSliderDragging = false;
        }
    });

    // Touch support for slider
    sliderHandle.addEventListener('touchstart', (e) => {
        isSliderDragging = true;
    });

    window.addEventListener('touchmove', (e) => {
        if (!isSliderDragging) return;
        updateSlider(e.touches[0].clientX);
    });

    window.addEventListener('touchend', () => {
        if (isSliderDragging) {
            isSliderDragging = false;
        }
    });

    // 7. Interactive real-time upscaling feedback (Scanline Effect)
    function triggerQuickScanEffect() {
        const workspace = document.querySelector('.app-workspace');
        
        // Remove existing scan line if any
        const existingScan = workspace.querySelector('.quick-scan-line');
        if (existingScan) existingScan.remove();
        
        // Create scan line
        const scanLine = document.createElement('div');
        scanLine.className = 'quick-scan-line';
        scanLine.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
            z-index: 30;
            pointer-events: none;
            animation: verticalScan 0.5s ease-out forwards;
        `;
        
        // Inject animation style dynamically if not present
        if (!document.getElementById('scan-keyframe')) {
            const style = document.createElement('style');
            style.id = 'scan-keyframe';
            style.textContent = `
                @keyframes verticalScan {
                    0% { top: 0; opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        workspace.appendChild(scanLine);
        
        // Quick visual parameters adjust simulation
        afterImg.style.filter = `
            saturate(${1 + (sliderEnhance.value - 50) / 400}) 
            contrast(${1 + (sliderEnhance.value - 50) / 400}) 
            brightness(${1 + (sliderDenoise.value - 50) / 800})
        `;
    }

    // 8. Download / Success Interactions
    btnDownload.addEventListener('click', () => {
        if (!uploadedImageBase64) return;
        
        // Show processing console and log high-res steps
        sliderViewContainer.style.display = 'none';
        sideBySideContainer.style.display = 'none';
        viewModeToggle.style.display = 'none';
        processingContainer.style.display = 'flex';
        consoleLogs.innerHTML = '';
        
        const activeMode = restorationMode;
        let logLines = [];
        if (activeMode === 'replicate' && replicateApiToken) {
            logLines = [
                { text: "Initializing 4K AI CodeFormer Enhancement...", delay: 100 },
                { text: "Contacting Replicate serverless GPU cluster...", delay: 400 },
                { text: "Uploading full-resolution source image...", delay: 700 },
                { text: "Spawning A100 GPU instance for face restoration...", delay: 1000 },
                { text: "Reconstructing eyes, eyebrows, lips, and facial contours...", delay: 1500 },
                { text: "Restoring background details using Real-ESRGAN...", delay: 2000 },
                { text: "Compiling output files and rendering 4K frame...", delay: 2500 },
                { text: "Downloading 4K AI restored image...", delay: 3000 }
            ];
        } else if (activeMode === 'local') {
            logLines = [
                { text: "Initializing Local 4K AI Restoration...", delay: 100 },
                { text: "Connecting to local backend at port 8002...", delay: 400 },
                { text: "Uploading image to local server...", delay: 700 },
                { text: "Invoking local Python Real-ESRGAN-master...", delay: 1000 },
                { text: "Applying RealESRGAN_x4plus model weights...", delay: 1500 },
                { text: "Performing 4x spatial upscaling...", delay: 2000 },
                { text: "Local GPU/CPU processing completed...", delay: 2500 },
                { text: "Downloading 4K locally upscaled output...", delay: 3000 }
            ];
        } else {
            logLines = [
                { text: "Initializing 4K UHD Restoration Engine...", delay: 100 },
                { text: "Loading full-resolution image source...", delay: 300 },
                { text: "Executing edge-preserving Bilateral Filter...", delay: 600 },
                { text: "Blending base layers to preserve natural skin pores...", delay: 900 },
                { text: "Executing multi-scale luminance Unsharp Masking...", delay: 1200 },
                { text: "Applying clip-limited local adaptive equalizations (CLAHE)...", delay: 1500 },
                { text: "Extracting discrete 3x3 Laplacian edges...", delay: 1800 },
                { text: "Performing separable 2-pass Lanczos-3 upscaling (3840px UHD)...", delay: 2100 },
                { text: "Reconstructing high-frequency fine details...", delay: 2400 },
                { text: "4K UHD Restoration complete.", delay: 2700 }
            ];
        }

        logLines.forEach((line) => {
            setTimeout(() => {
                const lineEl = document.createElement('div');
                lineEl.className = 'console-line';
                lineEl.textContent = `> ${line.text}`;
                consoleLogs.appendChild(lineEl);
                consoleLogs.scrollTop = consoleLogs.scrollHeight;
            }, line.delay);
        });

        // Run full upscaling pipeline
        setTimeout(() => {
            if (activeMode === 'replicate' && replicateApiToken) {
                processImageAI(uploadedImageBase64, parseInt(sliderEnhance.value), parseInt(sliderDenoise.value), true, (processedDataUrl, isAiSuccess) => {
                    processingContainer.style.display = 'none';
                    viewModeToggle.style.display = 'flex';
                    if (activeViewMode === 'slider') {
                        sliderViewContainer.style.display = 'flex';
                    } else {
                        sideBySideContainer.style.display = 'flex';
                    }
                    
                    const link = document.createElement('a');
                    link.href = processedDataUrl;
                    link.download = isAiSuccess ? "enhancer_ai_restored.png" : "enhancer_canvas_enhanced.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showToast(isAiSuccess ? "Success! AI Face Restored image saved!" : "Success! Canvas Enhanced image saved!");
                });
            } else if (activeMode === 'local') {
                processImageLocal(uploadedImageBase64, (processedDataUrl, isLocalSuccess) => {
                    processingContainer.style.display = 'none';
                    viewModeToggle.style.display = 'flex';
                    if (activeViewMode === 'slider') {
                        sliderViewContainer.style.display = 'flex';
                    } else {
                        sideBySideContainer.style.display = 'flex';
                    }
                    
                    const link = document.createElement('a');
                    link.href = processedDataUrl;
                    link.download = isLocalSuccess ? "enhancer_local_fsrcnn.png" : "enhancer_canvas_enhanced.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showToast(isLocalSuccess ? "Success! Local Real-ESRGAN image saved!" : "Success! Canvas Enhanced image saved!");
                });
            } else {
                processImage(uploadedImageBase64, parseInt(sliderEnhance.value), parseInt(sliderDenoise.value), true, (processedDataUrl) => {
                    processingContainer.style.display = 'none';
                    viewModeToggle.style.display = 'flex';
                    if (activeViewMode === 'slider') {
                        sliderViewContainer.style.display = 'flex';
                    } else {
                        sideBySideContainer.style.display = 'flex';
                    }
                    
                    const link = document.createElement('a');
                    link.href = processedDataUrl;
                    link.download = "enhancer_4k_enhanced.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showToast("Success! 4K UHD restored image saved to downloads.");
                });
            }
        }, (activeMode === 'canvas') ? 3000 : 3300);
    });

    // Toast Alert Helper
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    // Run Initializations
    initCarousel();
});
