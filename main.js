/**
 * Main application script
 * Connects UI elements with enhancer and background remover functionality
 */

// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const originalPreview = document.getElementById('originalPreview');
const enhancedPreview = document.getElementById('enhancedPreview');
const downloadBtn = document.getElementById('downloadBtn');
const removeBgBtn = document.getElementById('removeBg');
const resetEnhancerBtn = document.getElementById('resetEnhancer');

// Slider controls
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');
const sharpnessSlider = document.getElementById('sharpness');

// Initialize enhancer and background remover
const enhancer = new ImageEnhancer();
const bgRemover = new BackgroundRemover();

// Track current state
let currentImage = null;
let isBackgroundRemoved = false;
let loadingIndicator = null;

// Create and show loading indicator
function showLoading(parent, message = 'Processing...') {
    const loader = document.createElement('div');
    loader.className = 'loading-indicator';
    loader.innerHTML = `
        <div class="spinner"></div>
        <p>${message}</p>
    `;
    parent.appendChild(loader);
    return loader;
}

// Update slider value displays
function updateSliderDisplays() {
    document.querySelectorAll('.control-group').forEach(group => {
        const slider = group.querySelector('.slider');
        const valueDisplay = group.querySelector('.value');
        valueDisplay.textContent = slider.value;
        
        slider.addEventListener('input', () => {
            valueDisplay.textContent = slider.value;
        });
    });
}

// Apply all current filter settings and update preview
function applyFilters() {
    if (!currentImage) return;
    
    // Set filter values from sliders
    enhancer.setFilter('brightness', parseInt(brightnessSlider.value));
    enhancer.setFilter('contrast', parseInt(contrastSlider.value));
    enhancer.setFilter('saturation', parseInt(saturationSlider.value));
    enhancer.setFilter('sharpness', parseInt(sharpnessSlider.value));
    
    // Apply filters and update preview
    enhancer.applyFilters();
    updateEnhancedPreview();
}

// Update the enhanced preview image
function updateEnhancedPreview() {
    const dataUrl = enhancer.getEnhancedImageDataURL();
    if (dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        enhancedPreview.innerHTML = '';
        enhancedPreview.appendChild(img);
        downloadBtn.disabled = false;
    }
}

// Handle image upload
imageUpload.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    currentImage = file;
    isBackgroundRemoved = false;
    
    try {
        // Show loading indicator
        loadingIndicator = showLoading(originalPreview, 'Loading image...');
        
        // Display original image
        const img = await enhancer.loadImage(file);
        originalPreview.innerHTML = '';
        const originalImg = new Image();
        originalImg.src = URL.createObjectURL(file);
        originalImg.onload = () => URL.revokeObjectURL(originalImg.src);
        originalPreview.appendChild(originalImg);
        
        // Enable controls
        removeBgBtn.disabled = false;
        resetFilters();
        applyFilters();
        
        // Initialize background remover with the image
        bgRemover.setImage(img);
        
        // Load the background removal model
        if (!bgRemover.isModelLoaded) {
            removeBgBtn.textContent = 'Loading model...';
            removeBgBtn.disabled = true;
            
            const modelLoaded = await bgRemover.loadModel();
            if (modelLoaded) {
                removeBgBtn.textContent = 'Remove Background';
                removeBgBtn.disabled = false;
            } else {
                removeBgBtn.textContent = 'Model failed to load';
            }
        }
    } catch (error) {
        alert(`Error loading image: ${error.message}`);
        originalPreview.innerHTML = '';
    }
});

// Handle filter changes
brightnessSlider.addEventListener('input', applyFilters);
contrastSlider.addEventListener('input', applyFilters);
saturationSlider.addEventListener('input', applyFilters);
sharpnessSlider.addEventListener('input', applyFilters);

// Reset filters
function resetFilters() {
    brightnessSlider.value = 0;
    contrastSlider.value = 0;
    saturationSlider.value = 0;
    sharpnessSlider.value = 0;
    
    // Update displays
    document.querySelectorAll('.control-group .value').forEach((display, index) => {
        display.textContent = '0';
    });
    
    enhancer.resetFilters();
    applyFilters();
}

resetEnhancerBtn.addEventListener('click', resetFilters);

// Handle background removal
removeBgBtn.addEventListener('click', async () => {
    if (!currentImage || !bgRemover.originalImage) return;
    
    try {
        // Show loading indicator
        loadingIndicator = showLoading(enhancedPreview, 'Removing background...');
        removeBgBtn.disabled = true;
        
        // Remove background
        const dataUrl = await bgRemover.removeBackground();
        
        // Update preview
        enhancedPreview.innerHTML = '';
        const img = new Image();
        img.src = dataUrl;
        enhancedPreview.appendChild(img);
        
        // Update state
        isBackgroundRemoved = true;
        downloadBtn.disabled = false;
        removeBgBtn.disabled = false;
    } catch (error) {
        alert(`Error removing background: ${error.message}`);
        removeBgBtn.disabled = false;
        enhancedPreview.innerHTML = '';
    }
});

// Download enhanced image
downloadBtn.addEventListener('click', () => {
    let dataUrl;
    
    if (isBackgroundRemoved) {
        dataUrl = bgRemover.getProcessedImageDataURL();
    } else {
        dataUrl = enhancer.getEnhancedImageDataURL();
    }
    
    if (!dataUrl) return;
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = isBackgroundRemoved ? 'bg-removed-image.png' : 'enhanced-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Initialize the application
function init() {
    updateSliderDisplays();
    
    // Add CSS for loading indicator
    const style = document.createElement('style');
    style.textContent = `
        .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
            background-color: rgba(255, 255, 255, 0.8);
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Start the application
init();
