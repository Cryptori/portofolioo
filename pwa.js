// ===== PWA FUNCTIONALITY =====
class PWAHandler {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    async init() {
        this.setupInstallPrompt();
        this.setupOfflineDetection();
        this.checkStandaloneMode();
        this.setupOnlineStatus();
    }

    // Handle install prompt
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.deferredPrompt = null;
            this.hideInstallPrompt();
            this.showNotification('App installed successfully! 🎉', 'success');
        });
    }

    // Show install prompt
    showInstallPrompt() {
        // Don't show prompt immediately, wait for user engagement
        setTimeout(() => {
            if (!this.deferredPrompt) return;
            
            // Create install prompt UI
            const installPrompt = document.createElement('div');
            installPrompt.id = 'install-prompt';
            installPrompt.innerHTML = `
                <div class="install-prompt-content">
                    <i class="fas fa-download"></i>
                    <div class="install-text">
                        <h4>Install Portfolio App</h4>
                        <p>Install for faster access and offline functionality</p>
                    </div>
                    <div class="install-actions">
                        <button class="btn-outline" id="install-later">Later</button>
                        <button class="btn-primary" id="install-now">Install</button>
                    </div>
                </div>
            `;

            // Add styles
            installPrompt.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: var(--bg-card);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 1rem;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                z-index: 10000;
                animation: slideUp 0.3s ease;
            `;

            // Add CSS for animation
            if (!document.querySelector('#install-prompt-styles')) {
                const styles = document.createElement('style');
                styles.id = 'install-prompt-styles';
                styles.textContent = `
                    @keyframes slideUp {
                        from { transform: translateY(100%); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes slideDown {
                        from { transform: translateY(0); opacity: 1; }
                        to { transform: translateY(100%); opacity: 0; }
                    }
                `;
                document.head.appendChild(styles);
            }

            document.body.appendChild(installPrompt);

            // Add event listeners
            document.getElementById('install-now').addEventListener('click', () => {
                this.installApp();
            });

            document.getElementById('install-later').addEventListener('click', () => {
                this.hideInstallPrompt();
                // Don't show again for 1 week
                localStorage.setItem('installPromptDismissed', Date.now().toString());
            });

            // Auto hide after 15 seconds
            setTimeout(() => {
                if (document.getElementById('install-prompt')) {
                    this.hideInstallPrompt();
                }
            }, 15000);
        }, 30000); // Show after 30 seconds
    }

    hideInstallPrompt() {
        const prompt = document.getElementById('install-prompt');
        if (prompt) {
            prompt.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => prompt.remove(), 300);
        }
    }

    async installApp() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log(`User ${outcome} the install prompt`);
            
            this.deferredPrompt = null;
            this.hideInstallPrompt();
        }
    }

    // Offline detection
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
            document.body.classList.remove('offline');
            this.updateOnlineStatus(true);
        });

        window.addEventListener('offline', () => {
            this.showNotification('You are currently offline', 'warning');
            document.body.classList.add('offline');
            this.updateOnlineStatus(false);
        });

        // Initial check
        if (!navigator.onLine) {
            document.body.classList.add('offline');
            this.updateOnlineStatus(false);
        }
    }

    setupOnlineStatus() {
        // Add online status indicator to footer
        const onlineStatus = document.createElement('div');
        onlineStatus.id = 'online-status';
        onlineStatus.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #10b981;
            z-index: 999;
            transition: all 0.3s ease;
        `;

        document.body.appendChild(onlineStatus);
        this.updateOnlineStatus(navigator.onLine);
    }

    updateOnlineStatus(isOnline) {
        const statusIndicator = document.getElementById('online-status');
        if (statusIndicator) {
            statusIndicator.style.background = isOnline ? '#10b981' : '#ef4444';
            statusIndicator.title = isOnline ? 'Online' : 'Offline';
        }
    }

    // Check if app is running in standalone mode
    checkStandaloneMode() {
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone ||
            document.referrer.includes('android-app://')) {
            document.body.classList.add('standalone-mode');
            console.log('Running in standalone mode');
        }
    }

    showNotification(message, type = 'info') {
        // Use global notification function if available
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

    // Method to check if PWA is installable
    isInstallable() {
        return !!this.deferredPrompt;
    }

    // Method to manually trigger install prompt
    triggerInstall() {
        if (this.deferredPrompt) {
            this.installApp();
        } else {
            this.showNotification('App installation is not available', 'info');
        }
    }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pwaHandler = new PWAHandler();
});

// Add to home screen functionality
function addToHomeScreen() {
    if (window.pwaHandler) {
        window.pwaHandler.triggerInstall();
    }
}

// Make function globally available
window.addToHomeScreen = addToHomeScreen;

// Export for module support
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAHandler;
}