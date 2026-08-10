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
            window.location.href = 'index.html';
        }, 250);
    });

    // Click event for Others Page
    optionTech.addEventListener('click', () => {
        triggerBubbleVibration();
        setIndicatorPosition(optionTech);
        
        setTimeout(() => {
            window.location.href = 'others.html';
        }, 250);
    });
}

// Attach vibration to all bottombar links
document.querySelectorAll('#bottombar a').forEach(link => {
    link.addEventListener('click', () => {
        triggerBubbleVibration();
    });
});

// ----------------
// Steps carrossel starts here
// ----------------

const slides = Array.from(document.querySelectorAll('.slide'));
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const carousel = document.querySelector('.carousel');

let currentIndex = 0;
const totalSlides = slides.length;

/* Optional: Fallback definition in case triggerBubbleVibration is not defined in your script yet */
if (typeof window.triggerBubbleVibration !== 'function') {
  window.triggerBubbleVibration = function () {
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 30, 15]); // Soft bubble/haptic vibration pulse
    }
  };
}

function updateCarousel() {
  slides.forEach((slide, i) => {
    slide.className = 'slide'; // Reset base state

    // Calculate circular distance from current index
    const distance = (i - currentIndex + totalSlides) % totalSlides;

    if (distance === 0) {
      slide.classList.add('active');
    } else if (distance === 1) {
      slide.classList.add('next');
    } else if (distance === totalSlides - 1) {
      slide.classList.add('prev');
    } else if (distance === 2) {
      slide.classList.add('far-next');
    } else {
      slide.classList.add('far-prev');
    }
  });
}

function showNext() {
  currentIndex = (currentIndex + 1) % totalSlides;
  updateCarousel();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
  updateCarousel();
}

// Button Events with Vibration Trigger
nextBtn.addEventListener('click', () => {
  triggerBubbleVibration();
  showNext();
});

prevBtn.addEventListener('click', () => {
  triggerBubbleVibration();
  showPrev();
});

// Click directly on side cards to focus
slides.forEach((slide, i) => {
  slide.addEventListener('click', () => {
    if (currentIndex !== i) {
      triggerBubbleVibration();
      currentIndex = i;
      updateCarousel();
    }
  });
});

// Swipe / Drag Gestures
let startX = 0;
let isDragging = false;

carousel.addEventListener('pointerdown', (e) => {
  isDragging = true;
  startX = e.clientX;
});

carousel.addEventListener('pointerup', (e) => {
  if (!isDragging) return;
  isDragging = false;
  const diffX = e.clientX - startX;

  // Swipe threshold detection
  if (diffX < -40) {
    triggerBubbleVibration();
    showNext();
  } else if (diffX > 40) {
    triggerBubbleVibration();
    showPrev();
  }
});

carousel.addEventListener('pointerleave', () => {
  isDragging = false;
});

// Initialize position
updateCarousel();

// ==========================================
// HERO 5 ENDS HERE
// ==========================================

/* Haptic Bubble Vibration Function */
if (typeof window.triggerBubbleVibration !== 'function') {
  window.triggerBubbleVibration = function () {
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 30, 15]);
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const wbsedclBtn = document.getElementById('wbsedclBtn');
  const solarForm = document.getElementById('solarForm');
  const outputValue = document.getElementById('outputValue');
  
  const compassDial = document.getElementById('compassDial');
  const southPointer = document.getElementById('southPointer');
  const compassPermBtn = document.getElementById('compassPermBtn');
  const headingReadout = document.getElementById('headingReadout');
  const sensorStatus = document.getElementById('sensorStatus');

  let currentHeading = 0;
  let wasInSouthZone = false;

  // 1. WBSEDCL Download Button
  wbsedclBtn.addEventListener('click', () => {
    triggerBubbleVibration();
  });

  // 2. Solar Formula Calculation
  solarForm.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerBubbleVibration();

    const b1 = parseFloat(document.getElementById('bill1').value) || 0;
    const b2 = parseFloat(document.getElementById('bill2').value) || 0;
    const b3 = parseFloat(document.getElementById('bill3').value) || 0;
    const b4 = parseFloat(document.getElementById('bill4').value) || 0;

    const totalUnits = b1 + b2 + b3 + b4;

    // Formula: Required System = {(Bill1 + Bill2 + Bill3 + Bill4) / 365} / 3.75
    const requiredSystem = (totalUnits / 365) / 3.75;

    outputValue.textContent = `${requiredSystem.toFixed(2)} kW`;
  });

  // 3. Compass Orientation & South Pointer Logic
  function updateHeading(heading) {
    currentHeading = Math.round((heading + 360) % 360);
    headingReadout.textContent = `Heading: ${currentHeading}°`;

    /* 
       True South is at 180° compass heading.
       Arrow Angle = (180 - heading)
       When facing South (heading = 180°), Arrow Angle = 0° (Points straight UP).
    */
    const arrowAngle = 180 - currentHeading;
    compassDial.style.transform = `rotate(${arrowAngle}deg)`;

    // Detect South Alignment (180° ± 10° Tolerance)
    const isFacingSouth = Math.abs(currentHeading - 180) <= 10;

    if (isFacingSouth) {
      southPointer.classList.add('aligned');
      if (!wasInSouthZone) {
        triggerBubbleVibration();
        wasInSouthZone = true;
      }
    } else {
      southPointer.classList.remove('aligned');
      wasInSouthZone = false;
    }
  }

  // Handle Hardware Sensor Events
  function handleDeviceOrientation(e) {
    let heading = null;

    if (e.webkitCompassHeading !== undefined) {
      // iOS Compass Heading (True North)
      heading = e.webkitCompassHeading;
    } else if (e.alpha !== null) {
      // Android Gyroscope Heading
      heading = e.absolute ? (360 - e.alpha) : (360 - e.alpha);
    }

    if (heading !== null && !isNaN(heading)) {
      sensorStatus.textContent = '✅ Live Compass Active';
      sensorStatus.style.color = '#34d399';
      updateHeading(heading);
    }
  }

  // Initialize Sensors with Permission Verification
  function startCompass() {
    triggerBubbleVibration();

    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      sensorStatus.textContent = '⚠️ Compass blocked: Web browsers require HTTPS to read hardware orientation sensors.';
      sensorStatus.style.color = '#fbbf24';
      return;
    }

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS Permission Workflow
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation, true);
          } else {
            sensorStatus.textContent = '❌ Sensor permission denied by iOS.';
          }
        })
        .catch(console.error);
    } else if ('ondeviceorientationabsolute' in window) {
      // Android Absolute Heading
      window.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
    } else if ('DeviceOrientationEvent' in window) {
      // Standard Fallback
      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    } else {
      sensorStatus.textContent = '⚠️ Magnetometer sensor not available on this device.';
    }
  }

  compassPermBtn.addEventListener('click', startCompass);

  // Initial State Setup
  updateHeading(0);
});

// -------------------------------------------------------

// -------------------------------------------------------
// const maskButton = document.getElementById('mask-button');
// const objectElement = document.querySelector('.object');

// maskButton.addEventListener('click', () => {
//   maskButton.classList.add('hidden');       /* Hides the button */
//   objectElement.classList.remove('hidden'); /* Shows .object */
//   triggerBubbleVibration();
//   setIndicatorPosition(optionTech);
// });