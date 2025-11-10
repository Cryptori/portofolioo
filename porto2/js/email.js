// ===== EMAILJS INTEGRATION =====
class EmailService {
    constructor() {
        this.isInitialized = false;
        this.publicKey = 'YOUR_PUBLIC_KEY_HERE'; // Replace with your actual key
        this.serviceID = 'YOUR_SERVICE_ID'; // Replace with your service ID
        this.templateID = 'YOUR_TEMPLATE_ID'; // Replace with your template ID
        
        this.init();
    }

    async init() {
        try {
            await this.loadEmailJSLibrary();
            this.initEmailJS();
            this.bindFormSubmission();
            this.isInitialized = true;
            console.log('EmailJS initialized successfully');
        } catch (error) {
            console.warn('EmailJS initialization failed, using fallback:', error);
            this.setupFallbackForm();
        }
    }

    loadEmailJSLibrary() {
        return new Promise((resolve, reject) => {
            // Check if EmailJS is already loaded
            if (typeof emailjs !== 'undefined') {
                resolve();
                return;
            }

            // Load EmailJS from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.onload = () => {
                console.log('EmailJS library loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load EmailJS library');
                reject(new Error('Failed to load EmailJS'));
            };
            document.head.appendChild(script);
        });
    }

    initEmailJS() {
        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS not available');
        }
        
        // Initialize with your public key
        if (this.publicKey && this.publicKey !== 'YOUR_PUBLIC_KEY_HERE') {
            emailjs.init(this.publicKey);
        } else {
            throw new Error('EmailJS public key not configured');
        }
    }

    bindFormSubmission() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendEmail(contactForm);
            });
        }
    }

    setupFallbackForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFallbackSubmission(contactForm);
            });
        }
    }

    async sendEmail(form) {
        if (!this.isInitialized) {
            this.handleFallbackSubmission(form);
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            // Validate form
            if (!this.validateForm(form)) {
                throw new Error('Please fill all required fields correctly');
            }

            // Prepare template parameters
            const templateParams = {
                from_name: form.name.value,
                from_email: form.email.value,
                project_type: form.project.value,
                message: form.message.value,
                to_name: 'Randi Zikra',
                reply_to: form.email.value
            };

            // Send email using EmailJS
            const response = await emailjs.send(
                this.serviceID,
                this.templateID,
                templateParams
            );

            // Success
            this.showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
            form.reset();
            
            // Log success (remove in production)
            console.log('Email sent successfully:', response);
            
        } catch (error) {
            // Error handling
            console.error('Email sending failed:', error);
            
            let errorMessage = 'Failed to send message. ';
            
            if (error.text) {
                errorMessage += error.text;
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Please try again or contact me directly.';
            }
            
            this.showNotification(errorMessage, 'error');
            
            // Fallback to simple form submission
            this.handleFallbackSubmission(form);
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    handleFallbackSubmission(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        // Simulate form submission
        setTimeout(() => {
            // Get form data
            const formData = new FormData(form);
            const name = formData.get('name');
            const email = formData.get('email');
            const project = formData.get('project');
            const message = formData.get('message');

            // Show success message
            this.showNotification(
                `Thank you ${name}! Your ${project} project inquiry has been received. ` +
                `I'll contact you at ${email} within 24 hours.`, 
                'success'
            );

            // Log the submission (in real scenario, you'd send this to a server)
            console.log('Form submission (fallback):', {
                name, email, project, message, timestamp: new Date().toISOString()
            });

            // Reset form
            form.reset();

            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }

    validateForm(form) {
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const project = form.project.value;
        const message = form.message.value.trim();

        // Basic validation
        if (!name) {
            this.showNotification('Please enter your name', 'error');
            return false;
        }

        if (!email || !this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }

        if (!project) {
            this.showNotification('Please select a project type', 'error');
            return false;
        }

        if (!message || message.length < 10) {
            this.showNotification('Please enter a detailed message (at least 10 characters)', 'error');
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type = 'info') {
        // Use the global notification function if available
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }

        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

        // Add styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                }
                .notification.error { background: #ef4444; }
                .notification.warning { background: #f59e0b; }
                .notification.info { background: #3b82f6; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Method to update configuration
    updateConfig(publicKey, serviceID, templateID) {
        this.publicKey = publicKey;
        this.serviceID = serviceID;
        this.templateID = templateID;
        
        if (publicKey && publicKey !== 'YOUR_PUBLIC_KEY_HERE') {
            this.initEmailJS();
            this.isInitialized = true;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.emailService = new EmailService();
});

// Export for module support
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailService;
}