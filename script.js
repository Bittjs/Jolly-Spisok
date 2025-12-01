$(document).ready(function(){
    window.generateId = function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };
    
    window.updateProgress = function() {
        const totalTasks = $('.task-thingy').length;
        const completedTasks = $('.task-thingy.completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        $('.progress-bar').css('width', progress + '%');
        $('.progress-text').text(`${completedTasks}/${totalTasks} tasks completed (${progress}%)`);
        
        if (window.currentTab) {
            window.updateTabCounter(window.currentTab);
        }
    };
    
    $(document).on("click", ".task-thingy button", function(e){
        e.stopPropagation();
        $(this).closest(".task-thingy").slideDown(50, function(){
            $(this).remove();
            if (window.saveCurrentTab) window.saveCurrentTab();
            window.updateProgress();
        });
    });
    
    $(document).on("click", ".task-thingy", function(e){
        if (!$(e.target).is('button') && !$(e.target).closest('button').length) {
            $(this).toggleClass('completed');
            if (window.saveCurrentTab) window.saveCurrentTab();
            window.updateProgress();
        }
    });
    
    $(document).on("click", ".add-button", function(){
        const taskText = $('#task-input').val().trim();
        const descText = $('#description-input').val().trim();
        if (taskText === '') {
            alert('whats the task?');
            return;
        }
        
        const taskId = window.generateId();
        const taskElement = $(`
            <div class="task-thingy" data-id="${taskId}">
                <div class="text-container">
                    <h2>${taskText}</h2>
                    <p>${descText}</p>
                </div>
                <button>X</button>
            </div>
        `);
        
        $('.check-list-container').append(taskElement);
        $('#task-input').val('');
        $('#description-input').val('');
        $('#task-input').focus();
        
        if (window.saveCurrentTab) window.saveCurrentTab();
        window.updateProgress();
    });
    
    $('#task-input').on('keypress', function(e){
        if (e.which === 13) $('.add-button').click();
    });

    $('#description-input').on('keypress', function(e){
        if (e.which === 13) $('.add-button').click();
    });
    
    let currentTab = null;
    window.currentTab = currentTab;
    
    function createTabs() {
        if ($('.tabs-container').length === 0) {
            $('.main-container h4').after(`
                <div class="tabs-container">
                    <div class="tabs">
                        <button class="add-tab-btn">+</button>
                    </div>
                    <div class="new-tab-input" style="display: none;">
                        <input type="text" id="new-tab-name" placeholder="Tab name" maxlength="20">
                        <button class="save-tab-btn">Add</button>
                        <button class="cancel-tab-btn">nvm</button>
                    </div>
                </div>
            `);
        }
    }
    
    function loadTab(tabId) {
        if (!tabId) return;
        
        $('.task-thingy').remove();
        
        const saved = localStorage.getItem(`tab_${tabId}`);
        if (saved) {
            try {
                const tasks = JSON.parse(saved);
                tasks.forEach(task => {
                    const taskElement = $(`
                        <div class="task-thingy" data-id="${task.id}">
                            <div class="text-container">
                                <h2>${task.text}</h2>
                                <p>${task.desc}</p>
                            </div>
                            <button>X</button>
                        </div>
                    `);
                    
                    if (task.completed) {
                        taskElement.addClass('completed');
                    }
                    
                    $('.check-list-container').append(taskElement);
                });
            } catch (e) {}
        }
        
        window.currentTab = tabId;
        if (window.updateProgress) {
            window.updateProgress();
        }
    }
    
    window.saveCurrentTab = function() {
        if (!currentTab) return;
        
        const tasks = [];
        $('.task-thingy').each(function() {
            const $task = $(this);
            tasks.push({
                id: $task.data('id'),
                text: $task.find('h2').text(),
                desc: $task.find('p').text(),
                completed: $task.hasClass('completed')
            });
        });
        
        localStorage.setItem(`tab_${currentTab}`, JSON.stringify(tasks));
        window.updateTabCounter(currentTab);
    };
    
    window.updateTabCounter = function(tabId) {
        const $tab = $(`.tab[data-tab="${tabId}"]`);
        if ($tab.length === 0) return;
        
        const $counter = $tab.find('.tab-count');
        const saved = localStorage.getItem(`tab_${tabId}`);
        
        let count = 0;
        let completedCount = 0;
        
        if (saved) {
            try {
                const tasks = JSON.parse(saved);
                count = tasks.length;
                completedCount = tasks.filter(t => t.completed).length;
            } catch (e) {}
        }
        
        const allCompleted = count > 0 && completedCount === count;
        
        if (allCompleted) {
            $counter.text('🎉');
            $counter.css({
                'background-color': 'var(--success)',
                'color': 'var(--bg-lighter)'
            });
        } else {
            $counter.text(count);
            $counter.css({
                'background-color': 'var(--primary)',
                'color': 'var(--bg-lighter)'
            });
        }
    };
    
    function switchTab(tabId) {
        if (currentTab) {
            window.saveCurrentTab();
        }
        
        currentTab = tabId;
        window.currentTab = tabId;
        localStorage.setItem('currentTab', tabId);
        
        $('.tab').removeClass('active');
        $(`.tab[data-tab="${tabId}"]`).addClass('active');
        
        loadTab(tabId);
    }
    
    function createNewTab(name, isFirstTab = false) {
        const tabId = 'tab_' + Date.now();
        const tabElement = $(`
            <button class="tab ${isFirstTab ? 'active' : ''}" data-tab="${tabId}">
                ${name} <span class="tab-count">0</span>
                <span class="delete-tab" data-tab="${tabId}">X</span>
            </button>
        `);
        
        if (isFirstTab) {
            $('.add-tab-btn').before(tabElement);
            localStorage.setItem(`tab_${tabId}`, JSON.stringify([]));
        } else {
            $('.add-tab-btn').before(tabElement);
            localStorage.setItem(`tab_${tabId}`, JSON.stringify([]));
        }
        
        saveTabsList();
        window.updateTabCounter(tabId);
        
        if (isFirstTab) {
            switchTab(tabId);
        }
        
        return tabId;
    }
    
    function init() {
        createTabs();
        
        const oldTasks = localStorage.getItem('Tasks');
        const savedTabs = localStorage.getItem('tabsList');
        
        if (!savedTabs || JSON.parse(savedTabs).length === 0) {
            if (oldTasks) {
                try {
                    const firstTabId = createNewTab('My Tasks', true);
                    localStorage.setItem(`tab_${firstTabId}`, oldTasks);
                    localStorage.removeItem('Tasks');
                } catch (e) {
                    createNewTab('My Tasks', true);
                }
            } else {
                createNewTab('My Tasks', true);
            }
        } else {
            loadTabsList();
            
            const savedCurrentTab = localStorage.getItem('currentTab');
            if (savedCurrentTab) {
                switchTab(savedCurrentTab);
            } else {
                const firstTab = $('.tab[data-tab]').first();
                if (firstTab.length) {
                    switchTab(firstTab.data('tab'));
                }
            }
        }
        
        setupEventHandlers();
        window.updateProgress();
    }
    
    function setupEventHandlers() {
        $(document).on('click', '.tab', function(e) {
            if ($(e.target).hasClass('delete-tab')) return;
            const tabId = $(this).data('tab');
            switchTab(tabId);
        });
        
        $(document).on('click', '.add-tab-btn', function() {
            $('.new-tab-input').show();
            $('#new-tab-name').focus();
        });
        
        $(document).on('click', '.save-tab-btn', function() {
            const tabName = $('#new-tab-name').val().trim();
            if (tabName) {
                const tabId = createNewTab(tabName);
                $('#new-tab-name').val('');
                $('.new-tab-input').hide();
                switchTab(tabId);
            }
        });
        
        $(document).on('click', '.cancel-tab-btn', function() {
            $('#new-tab-name').val('');
            $('.new-tab-input').hide();
        });
        
        $(document).on('click', '.delete-tab', function(e) {
            e.stopPropagation();
            const tabId = $(this).data('tab');
            const $tab = $(this).closest('.tab');
            
            if ($('.tab[data-tab]').length === 1) {
                alert('I need one tab to exist bro 🙏');
                return;
            }
            
            if (confirm('all tasks will also be deleted, you sure?')) {
                localStorage.removeItem(`tab_${tabId}`);
                $tab.remove();
                
                if (tabId === currentTab) {
                    const nextTab = $('.tab[data-tab]').first();
                    if (nextTab.length) {
                        switchTab(nextTab.data('tab'));
                    }
                }
                
                saveTabsList();
            }
        });
        
        $(document).on('keypress', '#new-tab-name', function(e) {
            if (e.key === 'Enter') {
                $('.save-tab-btn').click();
            }
        });
        
        $(document).on('keydown', '#new-tab-name', function(e) {
            if (e.key === 'Escape') {
                $('.cancel-tab-btn').click();
            }
        });
    }
    
    function saveTabsList() {
        const tabsList = [];
        
        $('.tab[data-tab]').each(function() {
            const tabId = $(this).data('tab');
            const $tab = $(this).clone();
            $tab.find('.tab-count, .delete-tab').remove();
            const tabName = $tab.text().trim();
            tabsList.push({ id: tabId, name: tabName });
        });
        
        localStorage.setItem('tabsList', JSON.stringify(tabsList));
    }
    
    function loadTabsList() {
        const savedTabs = localStorage.getItem('tabsList');
        if (savedTabs) {
            try {
                const tabsList = JSON.parse(savedTabs);
                tabsList.forEach(tab => {
                    const tabElement = $(`
                        <button class="tab" data-tab="${tab.id}">
                            ${tab.name} <span class="tab-count">0</span>
                            <span class="delete-tab" data-tab="${tab.id}">X</span>
                        </button>
                    `);
                    
                    $('.add-tab-btn').before(tabElement);
                    window.updateTabCounter(tab.id);
                });
            } catch (e) {}
        }
    }
    
    setTimeout(init, 100);
});