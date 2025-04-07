/**
 * Image Enhancer Module
 * Provides functionality to enhance images with various filters
 */

class ImageEnhancer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.originalImage = null;
        this.enhancedImage = null;
        this.filters = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            sharpness: 0
        };
    }

    /**
     * Load an image into the enhancer
     * @param {File} imageFile - The image file to load
     * @returns {Promise} - Promise that resolves when image is loaded
     */
    loadImage(imageFile) {
        return new Promise((resolve, reject) => {
            if (!imageFile.type.match('image.*')) {
                reject(new Error('File is not an image'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.originalImage = img;
                    this.canvas.width = img.width;
                    this.canvas.height = img.height;
                    this.ctx.drawImage(img, 0, 0);
                    this.enhancedImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    resolve(img);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(imageFile);
        });
    }

    /**
     * Apply all current filters to the image
     * @returns {ImageData} - The enhanced image data
     */
    applyFilters() {
        if (!this.originalImage) return null;

        // Reset canvas with original image
        this.ctx.drawImage(this.originalImage, 0, 0);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        // Apply brightness
        const brightnessAdjust = this.filters.brightness * 2.55; // Convert -100 to 100 to -255 to 255
        
        // Apply contrast
        const contrastFactor = (259 * (this.filters.contrast + 255)) / (255 * (259 - this.filters.contrast));
        
        // Apply all pixel-based filters
        for (let i = 0; i < data.length; i += 4) {
            // Brightness
            data[i] += brightnessAdjust;     // R
            data[i + 1] += brightnessAdjust; // G
            data[i + 2] += brightnessAdjust; // B
            
            // Contrast
            data[i] = this.clamp(contrastFactor * (data[i] - 128) + 128);
            data[i + 1] = this.clamp(contrastFactor * (data[i + 1] - 128) + 128);
            data[i + 2] = this.clamp(contrastFactor * (data[i + 2] - 128) + 128);
            
            // Saturation
            if (this.filters.saturation !== 0) {
                const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
                const satFactor = 1 + (this.filters.saturation / 100);
                
                data[i] = this.clamp(gray + satFactor * (data[i] - gray));
                data[i + 1] = this.clamp(gray + satFactor * (data[i + 1] - gray));
                data[i + 2] = this.clamp(gray + satFactor * (data[i + 2] - gray));
            }
        }
        
        // Apply sharpness (unsharp masking)
        if (this.filters.sharpness > 0) {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            
            // Create a blurred version
            tempCtx.putImageData(imageData, 0, 0);
            tempCtx.filter = `blur(1px)`;
            tempCtx.drawImage(tempCanvas, 0, 0);
            const blurredData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
            
            // Apply unsharp mask
            const amount = this.filters.sharpness / 100 * 2;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = this.clamp(data[i] + (data[i] - blurredData[i]) * amount);
                data[i + 1] = this.clamp(data[i + 1] + (data[i + 1] - blurredData[i + 1]) * amount);
                data[i + 2] = this.clamp(data[i + 2] + (data[i + 2] - blurredData[i + 2]) * amount);
            }
        }
        
        this.enhancedImage = imageData;
        return imageData;
    }
    
    /**
     * Clamp a value between 0 and 255
     * @param {number} value - The value to clamp
     * @returns {number} - The clamped value
     */
    clamp(value) {
        return Math.max(0, Math.min(255, value));
    }
    
    /**
     * Set a filter value
     * @param {string} filter - The filter name
     * @param {number} value - The filter value
     */
    setFilter(filter, value) {
        if (filter in this.filters) {
            this.filters[filter] = value;
        }
    }
    
    /**
     * Reset all filters to default values
     */
    resetFilters() {
        this.filters = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            sharpness: 0
        };
    }
    
    /**
     * Get the enhanced image as a data URL
     * @returns {string} - The data URL of the enhanced image
     */
    getEnhancedImageDataURL() {
        if (!this.enhancedImage) return null;
        
        this.ctx.putImageData(this.enhancedImage, 0, 0);
        return this.canvas.toDataURL('image/png');
    }
}
