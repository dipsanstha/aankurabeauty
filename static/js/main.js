document.addEventListener('DOMContentLoaded', function () {
    if (window.feather && typeof window.feather.replace === 'function') {
        window.feather.replace();
    }

    const toggle = document.querySelector('.nav__toggle');
    const overlay = document.getElementById('navOverlay');
    const overlayLinks = overlay ? overlay.querySelectorAll('a') : [];
    const metricElements = document.querySelectorAll('.metric__value[data-count]');
    const reviewsList = document.getElementById('reviewsList');
    const reviewForm = document.getElementById('reviewForm');
    const ratingDisplay = document.querySelector('[data-metric="average-rating"]');
    const siteBody = document.querySelector('.site-body');

    const DEFAULT_REVIEWS = [
        {
            name: 'Sophia R.',
            location: 'San Mateo',
            rating: 5,
            message: 'I’ve tried threading everywhere, and Laxmi is the only one who gets my brow shape perfect every time.',
            created: '2025-10-12'
        },
        {
            name: 'Priya K.',
            location: 'Daly City',
            rating: 5,
            message: 'The glow facial is heavenly. My skin feels soft and bright for days afterwards.',
            created: '2024-10-06'
        },
        {
            name: 'Karen L.',
            location: 'San Francisco',
            rating: 5,
            message: 'Waxing has never been this comfortable. Highly recommend the full body package.',
            created: '2024-10-15'
        }
    ];

    let reviewsData = [];

    const closeDrawer = function () {
        if (!overlay || !toggle) return;
        overlay.classList.remove('is-open');
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('nav-open');
        if (siteBody) {
            siteBody.classList.remove('nav-open');
        }
    };

    if (toggle && overlay) {
        toggle.addEventListener('click', function () {
            const isOpen = overlay.classList.toggle('is-open');
            toggle.classList.toggle('is-active', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
            overlay.setAttribute('aria-hidden', String(!isOpen));
            document.body.classList.toggle('nav-open', isOpen);
            if (siteBody) {
                siteBody.classList.toggle('nav-open', isOpen);
            }
        });

        overlayLinks.forEach(function (anchor) {
            anchor.addEventListener('click', closeDrawer);
        });

        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
                closeDrawer();
            }
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && overlay && overlay.classList.contains('is-open')) {
            closeDrawer();
        }
    });

    const startCountUp = function (entry) {
        const el = entry.target;
        const countTo = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1600;
        const start = performance.now();

        const step = function (timestamp) {
            const progress = Math.min((timestamp - start) / duration, 1);
            const value = countTo * progress;
            el.textContent = value.toFixed(decimals) + suffix;
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    if (metricElements.length) {
        const observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    startCountUp(entry);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });

        metricElements.forEach(function (metric) {
            observer.observe(metric);
        });
    }

    const getStoredReviews = function () {
        try {
            const stored = window.localStorage.getItem('aankuraReviews');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Unable to read stored reviews', error);
            return [];
        }
    };

    const saveReviews = function (reviews) {
        try {
            window.localStorage.setItem('aankuraReviews', JSON.stringify(reviews));
        } catch (error) {
            console.warn('Unable to save reviews', error);
        }
    };

    const calculateAverageRating = function (reviews) {
        if (!reviews.length) {
            return 0;
        }

        const total = reviews.reduce(function (sum, review) {
            return sum + Number(review.rating || 0);
        }, 0);

        return total / reviews.length;
    };

    const updateAverageRating = function (reviews, options) {
        if (!ratingDisplay) return;
        const settings = Object.assign({ immediate: false }, options);
        const decimals = parseInt(ratingDisplay.dataset.decimals || '1', 10);
        const suffix = ratingDisplay.dataset.suffix || '';
        const average = Math.min(5, Math.max(0, calculateAverageRating(reviews)));
        const formatted = average.toFixed(decimals);

        ratingDisplay.dataset.count = formatted;

        if (settings.immediate) {
            ratingDisplay.textContent = formatted + suffix;
        }
    };

    const renderReviews = function (reviews) {
        if (!reviewsList) return;
        if (!reviews.length) {
            reviewsList.innerHTML = '<p class="review-empty">Be the first to share your experience.</p>';
            updateAverageRating(reviews, { immediate: true });
            return;
        }

        reviewsList.innerHTML = reviews.map(function (review) {
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const location = review.location ? `<span class="review-location">${review.location}</span>` : '';
            return `
                <article class="review-card">
                    <header>
                        <h3>${review.name}</h3>
                        ${location}
                        <div class="review-stars" aria-label="${review.rating} out of 5 stars">${stars}</div>
                    </header>
                    <p>${review.message}</p>
                    <time datetime="${review.created}">${new Date(review.created).toLocaleDateString()}</time>
                </article>
            `;
        }).join('');

        updateAverageRating(reviews, { immediate: true });
    };

    const defaults = DEFAULT_REVIEWS.map(function (review) {
        return { ...review };
    });

    if (reviewsList) {
        const stored = getStoredReviews();
        reviewsData = stored.length ? stored : defaults.slice();

        if (!stored.length) {
            saveReviews(reviewsData);
        }

        renderReviews(reviewsData);
        if (ratingDisplay && !stored.length) {
            updateAverageRating(reviewsData);
        }
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const formData = new FormData(reviewForm);
            const name = formData.get('name').trim();
            const location = formData.get('location').trim();
            const rating = parseInt(formData.get('rating'), 10);
            const message = formData.get('message').trim();

            if (!name || !message || !rating) {
                reviewForm.classList.add('is-invalid');
                return;
            }

            const newReview = {
                name,
                location,
                rating,
                message,
                created: new Date().toISOString()
            };

            reviewsData.unshift(newReview);
            reviewsData = reviewsData.slice(0, 50);
            saveReviews(reviewsData);
            renderReviews(reviewsData);
        });
    }

    // ===== GALLERY FUNCTIONALITY =====
    const galleryGrid = document.getElementById('galleryGrid');
    const adminOverlay = document.getElementById('adminOverlay');
    const openAdminPanel = document.getElementById('openAdminPanel');
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminControls = document.getElementById('adminControls');
    const uploadArea = document.getElementById('uploadArea');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const saveImagesBtn = document.getElementById('saveImages');
    const cancelUploadBtn = document.getElementById('cancelUpload');
    const deleteConfirmationOverlay = document.getElementById('deleteConfirmationOverlay');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const galleryUploadSection = document.getElementById('galleryUploadSection');

    const toastNotification = document.getElementById('toastNotification');
    const toastText = document.getElementById('toastText');
    const toastClose = document.getElementById('toastClose');

    // Admin credentials - Now supports multiple admin accounts
    const ADMIN_CREDENTIALS = [
        { username: 'admin', password: 'admin123' },
        { username: 'manager', password: 'manager456' },
        // Add more admin accounts here as needed
        // { username: 'editor', password: 'editor789' }
    ];
    let loginError = document.getElementById('loginError');
    let imageToDelete = null;
    let selectedImages = []; // Array to store selected images for upload
    let isAdminLoggedIn = false; // Flag to track admin login status

    // Toast notification functions
    function showToast(message, duration = 4000) {
        if (toastNotification && toastText) {
            toastText.textContent = message;
            toastNotification.classList.add('show');

            // Auto-hide after duration
            setTimeout(() => {
                hideToast();
            }, duration);
        }
    }

    function hideToast() {
        if (toastNotification) {
            toastNotification.classList.remove('show');
        }
    }

    // Admin logout
    function logoutAdmin() {
        console.log('Logout function called');
        isAdminLoggedIn = false;
        localStorage.removeItem('galleryAdminAuth');
        localStorage.removeItem('currentAdmin'); // Clear current admin info
        hideAdminControls();
        hideGalleryUploadSection(); // Hide upload section when logging out
        loadGallery(); // Reload gallery without delete buttons
        toggleAdminPanel(false); // Close the admin panel
        
        // Reset login form fields
        const usernameField = document.getElementById('adminUsername');
        const passwordField = document.getElementById('adminPassword');
        if (usernameField) usernameField.value = '';
        if (passwordField) passwordField.value = '';
        if (loginError) loginError.textContent = '';
        
        console.log('Admin logged out successfully');
    }

    // Show delete confirmation modal
    function showDeleteConfirmation(imageId) {
        imageToDelete = imageId;
        if (deleteConfirmationOverlay) {
            deleteConfirmationOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Hide delete confirmation modal
    function hideDeleteConfirmation() {
        if (deleteConfirmationOverlay) {
            deleteConfirmationOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        imageToDelete = null;
    }

    // Check if user is already logged in
    function checkAuth() {
        const savedAuth = localStorage.getItem('galleryAdminAuth');
        if (savedAuth === 'true') {
            isAdminLoggedIn = true;
            showAdminControls();
            showGalleryUploadSection();
        }
    }

    // Show/hide admin controls
    function showAdminControls() {
        if (adminControls) adminControls.style.display = 'block';
        if (adminLoginForm) adminLoginForm.style.display = 'none';
        
        // Display current admin in dashboard
        const currentAdmin = localStorage.getItem('currentAdmin');
        const adminHeader = document.querySelector('.admin-header h4');
        if (adminHeader && currentAdmin) {
            adminHeader.textContent = `Admin Dashboard (${currentAdmin})`;
        }
    }

    function hideAdminControls() {
        if (adminControls) adminControls.style.display = 'none';
        if (adminLoginForm) adminLoginForm.style.display = 'block';
    }

    // Show/hide gallery upload section
    function showGalleryUploadSection() {
        if (galleryUploadSection) galleryUploadSection.style.display = 'block';
    }

    function hideGalleryUploadSection() {
        if (galleryUploadSection) galleryUploadSection.style.display = 'none';
    }

    // Toggle admin panel
    function toggleAdminPanel(show) {
        if (show) {
            adminOverlay.style.display = 'flex';
            // Removed overflow hidden to allow scrolling when admin panel is active
            if (!isAdminLoggedIn) {
                hideAdminControls();
            } else {
                showAdminControls();
            }
        } else {
            adminOverlay.style.display = 'none';
            document.body.style.overflow = '';
            resetUploadArea();
        }
    }

    // Handle admin login - Now supports multiple accounts with validation
    function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();
        
        // Input validation
        if (!username || !password) {
            loginError.textContent = 'Please enter both username and password';
            return;
        }
        
        if (username.length < 3) {
            loginError.textContent = 'Username must be at least 3 characters';
            return;
        }
        
        if (password.length < 6) {
            loginError.textContent = 'Password must be at least 6 characters';
            return;
        }
        
        // Check credentials against multiple accounts
        const validAdmin = ADMIN_CREDENTIALS.find(cred => 
            cred.username === username && cred.password === password
        );
        
        if (validAdmin) {
            isAdminLoggedIn = true;
            localStorage.setItem('galleryAdminAuth', 'true');
            localStorage.setItem('currentAdmin', username); // Store current admin for reference
            showAdminControls();
            showGalleryUploadSection(); // Show upload section for logged-in admin
            loadGallery();
            loginError.textContent = ''; // Clear any previous errors
        } else {
            loginError.textContent = 'Invalid username or password';
        }
    }

    // Handle image upload
    function handleImageUpload(files) {
        imagePreview.innerHTML = '';

        Array.from(files).forEach((file, index) => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                selectedImages.push({
                    id: Date.now() + index,
                    src: e.target.result,
                    file: file
                });

                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button class="remove-image" data-id="${Date.now() + index}">&times;</button>
                `;
                imagePreview.appendChild(previewItem);

                // Add remove button event
                previewItem.querySelector('.remove-image').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(e.target.dataset.id);
                    selectedImages = selectedImages.filter(img => img.id !== id);
                    previewItem.remove();
                    updateSaveButton();
                });

                updateSaveButton();
                imagePreview.style.display = 'grid';
            };
            reader.readAsDataURL(file);
        });
    }

    // Save images to gallery
    function saveImages() {
       let s=0;
        if (selectedImages.length === 0) return;
        else {
            console.log(selectedImages);
        }

        // In a real app, you would upload to a server here
        const gallery = JSON.parse(localStorage.getItem('galleryImages') || '[]');

        selectedImages.forEach(img => {
            gallery.unshift({
                id: img.id,
                src: img.src,
                timestamp: new Date().toISOString()
            });
            s=s+1;
        });

        // Keep only the latest 50 images
        const updatedGallery = gallery.slice(0, 50);
        localStorage.setItem('galleryImages', JSON.stringify(updatedGallery));

        // Update the gallery display
        loadGallery();

        // Reset the upload area
        resetUploadArea();

        // Show success message
        showToast(`${s} image added to gallery!`);
    }

    // Load gallery images
    function loadGallery() {
        if (!galleryGrid) return;

        const gallery = JSON.parse(localStorage.getItem('galleryImages') || '[]');

        if (gallery.length === 0) {
            galleryGrid.innerHTML = '<p class="empty-gallery">No images in gallery yet.</p>';
            return;
        }

        galleryGrid.innerHTML = gallery.map(img => `
            <div class="gallery-item">
                <img src="${img.src}" alt="Gallery image">
                ${isAdminLoggedIn ? `<button class="remove-gallery-image" data-id="${img.id}">&times;</button>` : ''}
            </div>
        `).join('');

        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-gallery-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.target.dataset.id);
                showDeleteConfirmation(id);
            });
        });
    }

    // Remove image from gallery
    function removeImageFromGallery(id) {
        if (!isAdminLoggedIn) {
            alert('Only admins can delete images.');
            return;
        }
        const gallery = JSON.parse(localStorage.getItem('galleryImages') || '[]');
        const updatedGallery = gallery.filter(img => img.id !== id);
        localStorage.setItem('galleryImages', JSON.stringify(updatedGallery));
        loadGallery();
    }

    // Update save button state
    function updateSaveButton() {
        if (saveImagesBtn) {
            saveImagesBtn.disabled = selectedImages.length === 0;
        }
    }

    // Reset upload area
    function resetUploadArea() {
        if (imageUpload) imageUpload.value = '';
        if (imagePreview) {
            imagePreview.innerHTML = '';
            imagePreview.style.display = 'none';
        }
        selectedImages = [];
        updateSaveButton();
    }

    // Event Listeners
    const logoImage = document.getElementById('logoImage');
    if (logoImage) {
        logoImage.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default navigation
            toggleAdminPanel(true);
        });
    }

    if (closeAdminPanel) {
        closeAdminPanel.addEventListener('click', () => toggleAdminPanel(false));
    }

    if (adminOverlay) {
        adminOverlay.addEventListener('click', (e) => {
            if (e.target === adminOverlay) {
                toggleAdminPanel(false);
            }
        });
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleLogin);
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideDeleteConfirmation);
    }
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (imageToDelete !== null) {
                removeImageFromGallery(imageToDelete);
                hideDeleteConfirmation();
            }
        });
    }
    if (toastClose) {
        toastClose.addEventListener('click', hideToast);
    }

    // Close confirmation modal when clicking overlay
    if (deleteConfirmationOverlay) {
        deleteConfirmationOverlay.addEventListener('click', (e) => {
            if (e.target === deleteConfirmationOverlay) {
                hideDeleteConfirmation();
            }
        });
    }

    if (uploadArea) {
        // Click to select files
        uploadArea.addEventListener('click', () => {
            if (imageUpload) imageUpload.click();
        });

        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            uploadArea.classList.add('drag-over');
        }

        function unhighlight() {
            uploadArea.classList.remove('drag-over');
        }

        // Handle dropped files
        uploadArea.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleImageUpload(files);
        }
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            handleImageUpload(e.target.files);
        });
    }

    if (saveImagesBtn) {
        saveImagesBtn.addEventListener('click', saveImages);
    }

    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', () => {
            resetUploadArea();
            toggleAdminPanel(false);
        });
    }

    // Admin logout button event listener
    const adminLogoutBtn = document.getElementById('adminLogout');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', logoutAdmin);
    }

    // Update gallery upload section visibility based on login status
    function updateGalleryUploadVisibility() {
        if (isAdminLoggedIn) {
            showGalleryUploadSection();
        } else {
            hideGalleryUploadSection();
        }
    }

    // Initialize
    checkAuth();
    updateGalleryUploadVisibility(); // Set initial visibility based on login status
    loadGallery();

    // Initialize Feather Icons
    if (window.feather) {
        window.feather.replace();
    }
});
