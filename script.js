class LLMPlayground {
    constructor() {
        this.conversations = [];
        this.currentConversationId = null;
        this.conversationHistory = [];
        this.currentModel = 'gpt-4.5-preview';
        this.isGenerating = false;
        this.config = {
            temperature: 0.7,
            maxTokens: 2000,
            topP: 1.0,
            showTimestamps: true,
            autoScroll: true,
            saveHistory: true,
            systemPrompt: ''
        };
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.loadConversations();
        this.createNewConversation();
    }

    initializeElements() {
        this.promptInput = document.getElementById('prompt-input');
        this.sendButton = document.getElementById('send-button');
        this.clearButton = document.getElementById('clear-button');
        this.modelSelect = document.getElementById('model-select');
        this.modelProvider = document.getElementById('model-provider');
        this.conversationContainer = document.getElementById('conversation-history');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.characterCount = document.querySelector('.character-count');
        
        // Sidebar elements
        this.newChatButton = document.getElementById('new-chat-button');
        this.conversationsList = document.getElementById('conversations-list');
        
        // Configuration panel elements
        this.configButton = document.getElementById('config-button');
        this.configPanel = document.getElementById('config-panel');
        this.configCloseButton = document.getElementById('config-close');
        this.temperatureSlider = document.getElementById('temperature-slider');
        this.temperatureValue = document.getElementById('temperature-value');
        this.maxTokensSlider = document.getElementById('max-tokens-slider');
        this.maxTokensValue = document.getElementById('max-tokens-value');
        this.topPSlider = document.getElementById('top-p-slider');
        this.topPValue = document.getElementById('top-p-value');
        this.showTimestampsCheck = document.getElementById('show-timestamps');
        this.autoScrollCheck = document.getElementById('auto-scroll');
        this.saveHistoryCheck = document.getElementById('save-history');
        this.systemPromptTextarea = document.getElementById('system-prompt');
        this.resetConfigButton = document.getElementById('reset-config');
        this.saveConfigButton = document.getElementById('save-config');
    }

    bindEvents() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.handleSubmit());
        
        // Enter key submission (Shift+Enter for new line)
        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSubmit();
            }
        });

        // Input changes
        this.promptInput.addEventListener('input', () => {
            this.handleInputChange();
            this.autoResize();
        });

        // Model selection
        this.modelSelect.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
            this.saveSettings();
        });

        // Clear conversation
        this.clearButton.addEventListener('click', () => this.clearConversation());
        
        // Sample prompt cards
        const promptCards = document.querySelectorAll('.prompt-card');
        promptCards.forEach(card => {
            card.addEventListener('click', () => {
                const promptText = card.getAttribute('data-prompt');
                if (promptText) {
                    this.promptInput.value = promptText;
                    this.handleInputChange();
                    this.autoResize();
                    // Optional: automatically submit the prompt
                    // this.handleSubmit();
                }
            });
        });
        
        // Model selection event listeners
        this.modelProvider.addEventListener('change', () => this.updateModelOptions());
        this.modelSelect.addEventListener('change', () => this.saveSettings());

        // Auto-resize textarea
        this.promptInput.addEventListener('input', () => this.autoResize());
        
        // Configuration panel event listeners
        this.configButton.addEventListener('click', () => this.toggleConfigPanel());
        this.configCloseButton.addEventListener('click', () => this.closeConfigPanel());
        
        // Slider event listeners
        this.temperatureSlider.addEventListener('input', (e) => {
            this.updateSliderValue('temperature', e.target.value);
        });
        
        this.maxTokensSlider.addEventListener('input', (e) => {
            this.updateSliderValue('maxTokens', e.target.value);
        });
        
        this.topPSlider.addEventListener('input', (e) => {
            this.updateSliderValue('topP', e.target.value);
        });
        
        // Checkbox event listeners
        this.showTimestampsCheck.addEventListener('change', (e) => {
            this.updateConfig('showTimestamps', e.target.checked);
        });
        
        this.autoScrollCheck.addEventListener('change', (e) => {
            this.updateConfig('autoScroll', e.target.checked);
        });
        
        this.saveHistoryCheck.addEventListener('change', (e) => {
            this.updateConfig('saveHistory', e.target.checked);
        });
        
        // System prompt event listener
        this.systemPromptTextarea.addEventListener('input', (e) => {
            this.updateConfig('systemPrompt', e.target.value);
        });
        
        // Action button event listeners
        this.resetConfigButton.addEventListener('click', () => this.resetConfig());
        this.saveConfigButton.addEventListener('click', () => this.saveConfig());
        
        // Sidebar event listeners
        this.newChatButton.addEventListener('click', () => this.createNewConversation());
        
        // Close config panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.configPanel.contains(e.target) && !this.configButton.contains(e.target)) {
                this.closeConfigPanel();
            }
        });
    }

    handleInputChange() {
        const text = this.promptInput.value;
        const length = text.length;
        
        // Update character count
        this.characterCount.textContent = `${length} / 4000`;
        
        // Enable/disable send button
        this.sendButton.disabled = length === 0 || this.isGenerating;
        
        // Change character count color if approaching limit
        if (length > 3500) {
            this.characterCount.style.color = '#ef4444';
        } else if (length > 3000) {
            this.characterCount.style.color = '#f59e0b';
        } else {
            this.characterCount.style.color = '#9ca3af';
        }
    }

    autoResize() {
        this.promptInput.style.height = 'auto';
        this.promptInput.style.height = Math.min(this.promptInput.scrollHeight, 128) + 'px';
    }

    async handleSubmit() {
        const prompt = this.promptInput.value.trim();
        if (!prompt || this.isGenerating) return;

        // Add user message
        this.addMessage('user', prompt);
        
        // Clear input
        this.promptInput.value = '';
        this.handleInputChange();
        this.autoResize();

        // Show loading and generate response
        this.setGenerating(true);
        await this.generateResponse(prompt);
        this.setGenerating(false);
    }

    addMessage(role, content) {
        const message = { role, content, timestamp: Date.now() };
        this.conversationHistory.push(message);
        
        this.renderMessage(message);
        this.saveConversationHistory();
        this.saveCurrentConversation();
        this.saveConversations();
        this.renderConversationsList();
        this.scrollToBottom();
        
        // Hide welcome message if it exists
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
    }

    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}-message`;
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-role ${message.role}-role">${message.role}</span>
                <span class="message-time">${this.formatTime(message.timestamp)}</span>
            </div>
            <div class="message-content">${this.formatContent(message.content)}</div>
        `;
        
        this.conversationContainer.appendChild(messageDiv);
    }

    formatContent(content) {
        // Basic formatting - escape HTML and preserve line breaks
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '\n');
    }

    formatTime(timestamp) {
        if (!this.config.showTimestamps) return '';
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    async generateResponse(prompt) {
        try {
            // Make actual API call to the backend
            const response = await this.makeAPICall(prompt);
            this.addMessage('assistant', response);
        } catch (error) {
            console.error('Error generating response:', error);
            this.addMessage('assistant', 'Sorry, I encountered an error while generating a response. Please try again.');
        }
    }

    async makeAPICall(prompt) {
        const requestBody = {
            prompt: prompt,
            options: {}
        };

        // Add model configuration if specific provider/model is selected
        if (this.modelProvider.value && this.modelSelect.value) {
            requestBody.options.forceProvider = this.modelProvider.value;
            requestBody.options.forceModel = this.modelSelect.value;
        }

        // Add generation parameters
        if (this.config.temperature !== 0.7) {
            requestBody.options.temperature = this.config.temperature;
        }
        if (this.config.maxTokens !== 2000) {
            requestBody.options.maxTokens = this.config.maxTokens;
        }
        if (this.config.topP !== 1.0) {
            requestBody.options.topP = this.config.topP;
        }

        console.log('Sending API request:', requestBody);

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Log routing information for debugging
        if (data.data?.routing) {
            console.log('Request routed to:', data.data.routing);
        }
        
        return data.data?.response || 'No response received from the API.';
    }

    getModelResponses(prompt) {
        const modelResponses = {
            'gpt-4': [
                `I understand you're asking about "${prompt}". As GPT-4, I can provide detailed analysis and comprehensive responses. Let me break this down for you with thorough explanations and examples.`,
                `That's an interesting question about "${prompt}". Based on my training, I can offer several perspectives on this topic. Here's what I think would be most helpful...`,
                `Thank you for your question regarding "${prompt}". I'll provide a structured response that covers the key aspects you should consider.`
            ],
            'gpt-3.5-turbo': [
                `Regarding "${prompt}" - I can help you with that! Here's a quick and efficient response to address your question.`,
                `I see you're asking about "${prompt}". Let me provide a clear and concise answer that should help you understand this better.`,
                `Great question about "${prompt}"! I'll give you a straightforward response that covers the main points.`
            ],
            'claude-3': [
                `I'd be happy to help with your question about "${prompt}". Let me provide a thoughtful and nuanced response that considers multiple angles.`,
                `Thank you for asking about "${prompt}". I'll approach this carefully and provide you with a well-reasoned response.`,
                `That's a thoughtful question about "${prompt}". I'll give you a comprehensive answer while being mindful of important considerations.`
            ],
            'llama-2': [
                `I can assist you with "${prompt}". As an open-source model, I'll provide you with helpful information based on my training.`,
                `Regarding your question about "${prompt}" - I'll do my best to give you a useful and informative response.`,
                `I understand you're interested in "${prompt}". Let me share what I know about this topic.`
            ],
            'gemini-pro': [
                `I can help you explore "${prompt}" from multiple perspectives. Let me provide you with a comprehensive and creative response.`,
                `That's an intriguing question about "${prompt}". I'll give you a detailed answer that considers various aspects and possibilities.`,
                `Thank you for asking about "${prompt}". I'll provide you with an insightful response that draws from diverse knowledge sources.`
            ]
        };

        return modelResponses[this.currentModel] || modelResponses['gpt-4'];
    }

    setGenerating(isGenerating) {
        this.isGenerating = isGenerating;
        this.sendButton.disabled = isGenerating || this.promptInput.value.trim() === '';
        
        if (isGenerating) {
            this.loadingIndicator.classList.remove('hidden');
        } else {
            this.loadingIndicator.classList.add('hidden');
        }
    }

    clearConversation() {
        if (this.conversationHistory.length === 0) return;
        
        if (confirm('Are you sure you want to clear the current conversation?')) {
            this.conversationHistory = [];
            this.conversationContainer.innerHTML = `
                <div class="welcome-message">
                    <h2>What can I help with?</h2>
                    <p>Start a conversation with your chosen AI model</p>
                </div>
            `;
            this.saveConversationHistory();
            this.saveCurrentConversation();
            this.saveConversations();
            this.renderConversationsList();
        }
    }

    scrollToBottom() {
        if (!this.config.autoScroll) return;
        const container = document.querySelector('.conversation-container');
        container.scrollTop = container.scrollHeight;
    }

    saveConversationHistory() {
        if (!this.config.saveHistory) return;
        try {
            localStorage.setItem('llm-playground-history', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.warn('Could not save conversation history:', error);
        }
    }

    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('llm-playground-history');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
                this.renderConversationHistory();
            }
        } catch (error) {
            console.warn('Could not load conversation history:', error);
        }
    }

    renderConversationHistory() {
        if (this.conversationHistory.length === 0) return;
        
        // Hide welcome message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        // Render all messages
        this.conversationHistory.forEach(message => {
            this.renderMessage(message);
        });
        
        this.scrollToBottom();
    }

    updateModelOptions() {
        const provider = this.modelProvider.value;
        const modelSelect = this.modelSelect;
        
        // Clear existing options
        modelSelect.innerHTML = '';
        
        const modelOptions = {
            'openai': [
                { value: 'gpt-4o', label: 'GPT-4o' },
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
            ],
            'anthropic': [
                { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
                { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
                { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
            ],
            'google': [
                { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
                { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' }
            ],
            'groq': [
                { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
                { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
                { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' }
            ]
        };
        
        const models = modelOptions[provider] || [];
        
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.label;
            modelSelect.appendChild(option);
        });
        
        // Set default selection
        if (models.length > 0) {
            modelSelect.value = models[0].value;
            this.saveSettings();
        }
    }

    saveSettings() {
        try {
            const settings = {
                model: this.currentModel,
                provider: this.modelProvider.value,
                config: this.config
            };
            localStorage.setItem('llm-playground-settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Could not save settings:', error);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('llm-playground-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Load provider first
                if (settings.provider) {
                    this.modelProvider.value = settings.provider;
                    this.updateModelOptions();
                }
                
                // Then load model
                if (settings.model) {
                    this.currentModel = settings.model;
                    this.modelSelect.value = settings.model;
                }
                
                if (settings.config) {
                    this.config = { ...this.config, ...settings.config };
                }
            } else {
                // Initialize with default provider if no settings exist
                this.updateModelOptions();
            }
        } catch (error) {
            console.warn('Could not load settings:', error);
            // Initialize with default provider on error
            this.updateModelOptions();
        }
        
        // Update UI elements with loaded config
        this.updateConfigUI();
    }

    updateConfigUI() {
        this.temperatureSlider.value = this.config.temperature;
        this.temperatureValue.textContent = this.config.temperature;
        this.maxTokensSlider.value = this.config.maxTokens;
        this.maxTokensValue.textContent = this.config.maxTokens;
        this.topPSlider.value = this.config.topP;
        this.topPValue.textContent = this.config.topP.toFixed(2);
        this.showTimestampsCheck.checked = this.config.showTimestamps;
        this.autoScrollCheck.checked = this.config.autoScroll;
        this.saveHistoryCheck.checked = this.config.saveHistory;
        this.systemPromptTextarea.value = this.config.systemPrompt;
    }

    toggleConfigPanel() {
        this.configPanel.classList.toggle('hidden');
    }

    closeConfigPanel() {
        this.configPanel.classList.add('hidden');
    }

    updateSliderValue(configKey, value) {
        const numValue = parseFloat(value);
        this.config[configKey] = numValue;
        
        // Update display value
        const displayValue = configKey === 'topP' ? numValue.toFixed(2) : numValue;
        document.getElementById(`${configKey.replace(/([A-Z])/g, '-$1').toLowerCase()}-value`).textContent = displayValue;
    }

    updateConfig(key, value) {
        this.config[key] = value;
    }

    resetConfig() {
        this.config = {
            temperature: 0.7,
            maxTokens: 2000,
            topP: 1.0,
            showTimestamps: true,
            autoScroll: true,
            saveHistory: true,
            systemPrompt: ''
        };
        this.updateConfigUI();
    }

    saveConfig() {
        this.saveSettings();
        // Show a brief confirmation
        const button = this.saveConfigButton;
        const originalText = button.textContent;
        button.textContent = 'Saved!';
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '#3b82f6';
        }, 1000);
    }

    // Conversation Management Methods
    createNewConversation() {
        const conversationId = 'conv_' + Date.now();
        const newConversation = {
            id: conversationId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date(),
            lastUpdated: new Date()
        };
        
        this.conversations.unshift(newConversation);
        this.switchToConversation(conversationId);
        this.saveConversations();
        this.renderConversationsList();
    }

    switchToConversation(conversationId) {
        // Save current conversation if it exists
        if (this.currentConversationId) {
            this.saveCurrentConversation();
        }
        
        // Switch to new conversation
        this.currentConversationId = conversationId;
        const conversation = this.conversations.find(c => c.id === conversationId);
        
        if (conversation) {
            this.conversationHistory = conversation.messages;
            this.renderConversationHistory();
            this.updateConversationTitle(conversation);
        }
        
        this.renderConversationsList();
    }

    saveCurrentConversation() {
        if (!this.currentConversationId) return;
        
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (conversation) {
            conversation.messages = [...this.conversationHistory];
            conversation.lastUpdated = new Date();
            
            // Update title based on first user message
            if (conversation.messages.length > 0 && conversation.title === 'New Chat') {
                const firstUserMessage = conversation.messages.find(m => m.role === 'user');
                if (firstUserMessage) {
                    conversation.title = firstUserMessage.content.substring(0, 50) + 
                                      (firstUserMessage.content.length > 50 ? '...' : '');
                }
            }
        }
    }

    updateConversationTitle(conversation) {
        // This method can be used to update the UI with the current conversation title
        // For now, we'll just ensure the conversation list is updated
    }

    renderConversationsList() {
        if (!this.conversationsList) return;
        
        this.conversationsList.innerHTML = '';
        
        this.conversations.forEach(conversation => {
            const conversationItem = document.createElement('div');
            conversationItem.className = 'conversation-item';
            if (conversation.id === this.currentConversationId) {
                conversationItem.classList.add('active');
            }
            
            conversationItem.innerHTML = `
                <div class="conversation-title">${conversation.title}</div>
                <div class="conversation-date">${this.formatDate(conversation.lastUpdated)}</div>
            `;
            
            conversationItem.addEventListener('click', () => {
                this.switchToConversation(conversation.id);
            });
            
            this.conversationsList.appendChild(conversationItem);
        });
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    saveConversations() {
        if (this.config.saveHistory) {
            try {
                localStorage.setItem('llm-playground-conversations', JSON.stringify(this.conversations));
            } catch (error) {
                console.warn('Failed to save conversations to localStorage:', error);
            }
        }
    }

    loadConversations() {
        try {
            const saved = localStorage.getItem('llm-playground-conversations');
            if (saved) {
                this.conversations = JSON.parse(saved).map(conv => ({
                    ...conv,
                    createdAt: new Date(conv.createdAt),
                    lastUpdated: new Date(conv.lastUpdated)
                }));
            }
        } catch (error) {
            console.warn('Failed to load conversations from localStorage:', error);
            this.conversations = [];
        }
    }
}

// Initialize the playground when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LLMPlayground();
});

// Add some utility functions for enhanced functionality
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Could add a toast notification here
        console.log('Copied to clipboard');
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLMPlayground;
}

// Add sidebar toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle functionality
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Save sidebar state to localStorage
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
    }
    
    // Restore sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState === 'true') {
        sidebar.classList.add('collapsed');
    }
    
    // User settings functionality
    const settingsCheckboxes = document.querySelectorAll('.setting-checkbox');
    
    settingsCheckboxes.forEach(checkbox => {
        // Load saved settings
        const settingName = checkbox.id;
        const savedValue = localStorage.getItem(settingName);
        if (savedValue === 'true') {
            checkbox.checked = true;
        }
        
        // Save settings on change
        checkbox.addEventListener('change', function() {
            localStorage.setItem(settingName, this.checked);
            
            // Apply settings
            applyUserSettings(settingName, this.checked);
        });
        
        // Apply initial settings
        applyUserSettings(settingName, checkbox.checked);
    });
});

// Function to apply user settings
function applyUserSettings(settingName, isEnabled) {
    switch (settingName) {
        case 'dark-mode':
            if (isEnabled) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            break;
        case 'auto-save':
            // Auto-save functionality can be implemented here
            console.log('Auto-save:', isEnabled ? 'enabled' : 'disabled');
            break;
        case 'sound-effects':
            // Sound effects functionality can be implemented here
            console.log('Sound effects:', isEnabled ? 'enabled' : 'disabled');
            break;
    }
}

// Enhanced animation for new messages
function addMessage(role, content) {
    const conversationContainer = document.getElementById('conversation');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    // Add entrance animation
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(20px)';
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-role ${role}">
                ${role === 'user' ? '👤' : '🤖'} ${role.toUpperCase()}
            </div>
        </div>
        <div class="message-content">${formatMessage(content)}</div>
    `;
    
    conversationContainer.appendChild(messageDiv);
    
    // Trigger animation
    requestAnimationFrame(() => {
        messageDiv.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    });
    
    // Scroll to bottom with smooth animation
    conversationContainer.scrollTo({
        top: conversationContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// Enhanced loading indicator
function showLoading() {
    const conversationContainer = document.getElementById('conversation');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.id = 'loading-indicator';
    
    loadingDiv.innerHTML = `
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <span>AI is thinking...</span>
    `;
    
    conversationContainer.appendChild(loadingDiv);
    conversationContainer.scrollTo({
        top: conversationContainer.scrollHeight,
        behavior: 'smooth'
    });
}

function hideLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.opacity = '0';
        loadingIndicator.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            loadingIndicator.remove();
        }, 300);
    }
}