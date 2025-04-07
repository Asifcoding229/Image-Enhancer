// Add touch support for mobile devices
document.addEventListener('DOMContentLoaded', function() {
    // Add touch support for sliders
    const sliders = document.querySelectorAll('.slider');
    sliders.forEach(slider => {
        slider.addEventListener('touchstart', function(e) {
            e.preventDefault();
            updateSliderFromTouch(e, this);
            
            // Add move and end listeners
            document.addEventListener('touchmove', touchMoveHandler);
            document.addEventListener('touchend', touchEndHandler);
        });
        
        function touchMoveHandler(e) {
            e.preventDefault();
            updateSliderFromTouch(e, slider);
        }
        
        function touchEndHandler() {
            document.removeEventListener('touchmove', touchMoveHandler);
            document.removeEventListener('touchend', touchEndHandler);
        }
    });
    
    function updateSliderFromTouch(e, slider) {
        const touch = e.touches[0];
        const rect = slider.getBoundingClientRect();
        const position = (touch.clientX - rect.left) / rect.width;
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const value = Math.round(min + position * (max - min));
        
        // Update slider value
        slider.value = Math.max(min, Math.min(max, value));
        
        // Trigger input event to update display and apply filters
        const event = new Event('input', { bubbles: true });
        slider.dispatchEvent(event);
    }
});
