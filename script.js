import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Global Haptic Vibration Helper
function triggerBubbleVibration() {
    if ('vibrate' in navigator) {
        navigator.vibrate([10, 20, 15]);
    }
}

// ==========================================
// 1. HERO 1: TEXT SETUP & SCROLL ANIMATIONS
// ==========================================
const hero1 = document.getElementById('hero1');
const canvas = document.getElementById('three-canvas');
const textContainer = document.getElementById('textContainer');
const textElements = document.querySelectorAll('#textContainer p');
const benefitCards = document.querySelectorAll('.benefitCard');

let targetRotationY = 0;
let targetRotationX = 0;

if (hero1 && textContainer && textElements.length > 0) {
    const textData = [];
    textElements.forEach((el) => {
        textData.push({
            element: el,
            fullText: el.textContent.trim()
        });
        el.textContent = '';
    });

    const totalChars = textData.reduce((acc, item) => acc + item.fullText.length, 0);

    // DEFINE SCROLL PHASE THRESHOLDS (Pixels)
    const TYPING_RANGE = 400; // Phase 1: Typewriter completes (0px -> 400px)
    const EXIT_RANGE = 350;   // Phase 2: Text scrolls up and fades out (400px -> 750px)
    const CARDS_START = TYPING_RANGE + EXIT_RANGE; // Phase 3: 750px+

    function handleScrollAnimations() {
        const scrollTop = hero1.scrollTop;
        const maxScroll = hero1.scrollHeight - hero1.clientHeight;
        if (maxScroll <= 0) return;

        // PHASE 1: TYPEWRITER (0px -> 400px)
        const typingProgress = Math.min(Math.max(scrollTop / TYPING_RANGE, 0), 1);
        const charsToShow = Math.floor(typingProgress * totalChars);

        let currentCharCount = 0;
        textData.forEach((item) => {
            const itemLength = item.fullText.length;
            if (currentCharCount + itemLength <= charsToShow) {
                item.element.textContent = item.fullText;
                item.element.classList.remove('typing');
                currentCharCount += itemLength;
            } else if (currentCharCount < charsToShow) {
                const revealLength = charsToShow - currentCharCount;
                item.element.textContent = item.fullText.slice(0, revealLength);
                item.element.classList.add('typing');
                currentCharCount += itemLength;
            } else {
                item.element.textContent = '';
                item.element.classList.remove('typing');
            }
        });

        // Pin text container vertically during Phase 1
        if (scrollTop <= TYPING_RANGE) {
            textContainer.style.transform = `translateY(${scrollTop}px)`;
            textContainer.style.opacity = '1';
        } 
        // PHASE 2: TEXT SCROLLS OFF & FADES (400px -> 750px)
        else if (scrollTop > TYPING_RANGE && scrollTop <= CARDS_START) {
            const exitProgress = (scrollTop - TYPING_RANGE) / EXIT_RANGE;
            textContainer.style.transform = `translateY(${TYPING_RANGE - exitProgress * 200}px)`;
            textContainer.style.opacity = `${1 - exitProgress}`;
        } 
        // TEXT FULLY GONE
        else {
            textContainer.style.opacity = '0';
        }

        // PHASE 3: BENEFIT CARDS
        const heroRect = hero1.getBoundingClientRect();

        benefitCards.forEach((card) => {
            const cardRect = card.getBoundingClientRect();
            const initialYOffset = card.classList.contains('visible') ? 0 : 40;
            
            const isFullyInViewport = 
                cardRect.top >= heroRect.top && 
                (cardRect.bottom - initialYOffset) <= heroRect.bottom;

            if (scrollTop >= CARDS_START && isFullyInViewport) {
                card.classList.add('visible');
            } else {
                card.classList.remove('visible');
            }
        });

        // 3D MODEL ROTATION TARGETS
        const scrollProgress = scrollTop / maxScroll;
        targetRotationY = scrollProgress * Math.PI * 4;
        targetRotationX = 0.3 + scrollProgress * 0.4;
    }

    hero1.addEventListener('scroll', handleScrollAnimations);
    handleScrollAnimations();
}

// ==========================================
// 2. THREE.JS 3D MODEL RENDERER
// ==========================================
if (hero1 && canvas) {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        45,
        hero1.clientWidth / hero1.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(hero1.clientWidth, hero1.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x4e7aeb, 1.5);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    // Model Loader
    let solarPanelModel = null;

    const loader = new GLTFLoader();
    loader.load(
        'solar_panel.glb',
        (gltf) => {
            solarPanelModel = gltf.scene;

            const box = new THREE.Box3().setFromObject(solarPanelModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            solarPanelModel.position.sub(center);

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.8 / maxDim;
            solarPanelModel.scale.setScalar(scale);

            solarPanelModel.rotation.x = 0.3;

            scene.add(solarPanelModel);
        },
        undefined,
        (error) => console.error('Error loading 3D model:', error)
    );

    // Render Loop
    function animate() {
        requestAnimationFrame(animate);

        if (solarPanelModel) {
            solarPanelModel.rotation.y += (targetRotationY - solarPanelModel.rotation.y) * 0.08;
            solarPanelModel.rotation.x += (targetRotationX - solarPanelModel.rotation.x) * 0.08;
        }

        renderer.render(scene, camera);
    }

    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        const width = hero1.clientWidth;
        const height = hero1.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    });
}

// ==========================================
// 3. HERO 2: IMAGE CAROUSEL
// ==========================================
const imgContainer = document.getElementById('imgContainer');
const leftBtn = document.querySelector('.buttonContainer .left');
const rightBtn = document.querySelector('.buttonContainer .right');

if (imgContainer && leftBtn && rightBtn) {
    const slides = imgContainer.querySelectorAll('div');
    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoPlayTimer = null;

    function goToSlide(index) {
        currentIndex = index;
        const slideWidth = imgContainer.clientWidth;
        
        imgContainer.scrollTo({
            left: slideWidth * currentIndex,
            behavior: 'smooth'
        });
    }

    function nextSlide() {
        const nextIndex = (currentIndex + 1) % totalSlides;
        goToSlide(nextIndex);
    }

    function prevSlide() {
        const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        goToSlide(prevIndex);
    }

    function startAutoPlay() {
        autoPlayTimer = setInterval(nextSlide, 2000);
    }

    function resetAutoPlay() {
        clearInterval(autoPlayTimer);
        startAutoPlay();
    }

    rightBtn.addEventListener('click', () => {
        triggerBubbleVibration();
        nextSlide();
        resetAutoPlay();
    });

    leftBtn.addEventListener('click', () => {
        triggerBubbleVibration();
        prevSlide();
        resetAutoPlay();
    });

    imgContainer.addEventListener('mouseenter', () => clearInterval(autoPlayTimer));
    imgContainer.addEventListener('mouseleave', startAutoPlay);

    startAutoPlay();
}

// ==========================================
// 4. BOTTOM BAR & TOGGLE SWITCH
// ==========================================
const optionSolar = document.querySelector('.toggleoption.solar');
const optionTech = document.querySelector('.toggleoption.tech');
const indicator = document.getElementById('toggleIndicator');

if (optionSolar && optionTech && indicator) {
    function setIndicatorPosition(targetElement, animate = true) {
        const targetOffset = targetElement.offsetLeft - optionSolar.offsetLeft;
        
        if (!animate) {
            indicator.style.transition = 'none';
        } else {
            indicator.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        indicator.style.transform = `translateX(${targetOffset}px)`;
    }

    const currentPath = window.location.pathname;

    if (currentPath.includes('others.html') || currentPath.includes('tech.html')) {
        setIndicatorPosition(optionTech, false);
    } else {
        setIndicatorPosition(optionSolar, false);
    }

    // Click event for Solar Page
    optionSolar.addEventListener('click', () => {
        triggerBubbleVibration();
        setIndicatorPosition(optionSolar);
        
        setTimeout(() => {
            window.location.href = 'index2.html';
        }, 250);
    });

    // Click event for Others Page
    optionTech.addEventListener('click', () => {
        triggerBubbleVibration();
        setIndicatorPosition(optionTech);
        
        setTimeout(() => {
            window.location.href = 'https://www.instagram.com/humans_are_stillll_aliveee';
        }, 250);
    });
}

// Attach vibration to all bottombar links
document.querySelectorAll('#bottombar a').forEach(link => {
    link.addEventListener('click', () => {
        triggerBubbleVibration();
    });
});

// HERO 3 STARTS HERE

const maskButton = document.getElementById('mask-button');
const objectElement = document.querySelector('.object');

maskButton.addEventListener('click', () => {
  maskButton.classList.add('hidden');       /* Hides the button */
  objectElement.classList.remove('hidden'); /* Shows .object */
  triggerBubbleVibration();
  setIndicatorPosition(optionTech);
});