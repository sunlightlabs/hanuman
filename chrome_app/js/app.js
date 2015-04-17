(function($) {
    SITES = [
        "http://www.pattonboggs.com/"
    ]
    TRUNC_LENGTH = 200;

    var currentSite = null;
    var currentUrl = null;
    var currentState = null;
    var visitedNonbio = [];
    var visitedBio = [];

    // data-tracking objects
    page = null;

    // panels
    var findPanel, bioPanels, anyMorePanel;

    // general page functions
    var panelGroup = $('.panel-group');
    var newFirm = function() {
        currentSite = SITES[0];
        currentUrl = null;
        visitedNonbio = [];
        visitedBio = [];

        // make all the panels
        findPanel = new FindPanel();
        bioPanels = [new BioPanel()];
        anyMorePanel = new AnyMorePanel();

        panelGroup.html('');
        _.each([findPanel, bioPanels[0], anyMorePanel], function(panel) {
            panelGroup.append(panel.render().el);
            panel.setFirst(true);
        });

        setState('find');

        $('webview').attr('src', currentSite);
        if (page) page.site = currentSite;
    }

    var setWellText = function(well, text) {
        well.find('.content').html(text.replace("\n", "<br />"));
        if (text == "") {
            well.find('.placeholder').show();
        } else {
            well.find('.placeholder').hide();
        }
    }

    var addBioPanel = function(replaceCurrent) {
        var newPanel = new BioPanel();
        if (replaceCurrent) {
            $('.bio-panel').remove();
            findPanel.$el.after(newPanel.render().el);
            bioPanels = [newPanel];
        } else {
            bioPanels[bioPanels.length - 1].$el.after(newPanel.render().el);
            bioPanels.push(newPanel);
        }

        newPanel.setFirst(replaceCurrent);
        newPanel.$('.bio-title-name').text("Person #" + bioPanels.length);
        return newPanel;
    }

    var setState = function(state) {
        // check if the currently expanded thing has the class of the state, and if not, find the first exemplar of that state and expand it
        var currentExpanded = panelGroup.find('.panel-collapse[aria-expanded=true],.panel-collapse.in').parents('.panel');
        if (!(currentExpanded.length && currentExpanded.hasClass(state + '-panel'))) {
            currentExpanded = $('.' + state + '-panel').eq(0);
            currentExpanded.find('.panel-heading a').click();
        }

        currentState = state;

        if (state == 'find') {
            // get a new page object ready
            page = {
                'url': null,
                'site': currentSite
            }
        }

        if (state == 'bio') {
            var bioPanel = _.filter(bioPanels, function(bioPanel) { return bioPanel.el == currentExpanded[0]; })[0];
            bioPanel.switchSection(currentExpanded.find('.name-section'), true);
        }
    }

    // utilities
    var uuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    // views

    var Panel = Backbone.View.extend({
        events: {
            'click .panel-title a': 'makeActive'
        },

        className: 'panel',

        initialize: function(options) {
            this.options = options || {};
            this.$el.addClass('panel-default').addClass(this.label + '-panel').attr('data-state', this.label);
        },
        
        render: function() {
            this.$el.html(tim($('.' + this.label + '-panel-tpl').html(), this.options));
            return this;
        },

        makeActive: function() {
            currentState = this.$el.attr('data-state');
        },

        setFirst: function(isFirst) {
            this.$el.removeClass(isFirst ? 'not-first': 'first').addClass(isFirst ? 'first' : 'not-first');
        }
    });

    var FindPanel = Panel.extend({
        label: 'find',

        events: _.extend({
            'click .quit': 'quit',
            'click .new-firm': newFirm,
            'click .found-one': 'foundOne'
        }, Panel.prototype.events),

        quit: function() {
            window.close();
        },

        foundOne: function() {
            // remove the current URL from the non-bio list if it's in there
            visitedNonbio = _.reject(visitedNonbio, function(el) { return el == currentUrl });
            // and add it to the bio list
            visitedBio.push(currentUrl);

            // go to the next panel for the first time
            setState('bio');
            page.url = currentUrl;
        }     
    });

    var BioPanel = Panel.extend({
        label: 'bio',

        events: _.extend({
            'click .name-section .done': 'nameDone',
            
            'click .bio-section .done': 'bioDone',
            'click .add': 'addChunk',

            'click .lobbyist-section .btn': 'decideIfLobbyist',

            'click .panel-section-inactive': 'pickSection'
        }, Panel.prototype.events),

        initialize: function(options) {
            Panel.prototype.initialize.call(this, options);
            this.options.id = uuid();
            this.bioChunks = [];
        },

        nameDone: function() {
            var name = this.$('.name-section .well .content').html();
            if (name) {
                this.$('.bio-title-name').text(name);
            }

            this.switchSection(this.$('.bio-section'));
        },

        bioDone: function() {
            this.switchSection(this.$('.lobbyist-section'));
        },

        addChunk: function() {
            var well = this.$('.bio-section .well');
            var selectedType = this.$('option:selected');

            var chunk = new BioChunk({'parent': this, 'typeLabel': selectedType.html(), 'typeValue': selectedType.attr('value'), selection: well.data('selection'), 'body': well.find('.content').html()});
            this.bioChunks.push(chunk);

            this.$('.saved-chunks').append(chunk.render().el);
        },

        decideIfLobbyist: function(evt) {
            // are they a lobbyist?
            var $target = $(evt.target);
            var is_lobbyist = $target.hasClass('yes') ? 'yes' : ($target.hasClass('no') ? 'no' : 'dunno');

            // save their answer into the object
            this.options.isLobbyist = is_lobbyist;
            setState('any-more');
        },

        switchSection: function($section, noAnimation) {
            // delay this to keep button clicks in active sections from triggering the inactive-section click handler
            var _this = this;
            setTimeout(function() {
                var $inactives = $section.parent().find('.panel-section').not($section);
                
                // class toggling
                $inactives.removeClass('panel-section-active').addClass('panel-section-inactive');
                $section.removeClass('panel-section-inactive').addClass('panel-section-active');

                // offset stuff
                var absOffset = $section.offset();
                var barOffset = $('.sidebar-top').offset();
                var chevronOffset = _this.$('.chevron-rel').offset();

                // animate the chevron
                _this.$('.chevron').animate({'top': absOffset.top - chevronOffset.top + parseInt($section.css('padding-top'))});

                if (!(noAnimation != undefined)) {
                    // scroll the sidebar
                    $('.sidebar').animate({scrollTop: absOffset.top - barOffset.top - 15});
                }

                // toggle form control states
                $section.find('button,select').removeAttr('disabled');
                $inactives.find('button,select').attr('disabled', 'disabled');
            }, 0);
        },

        pickSection: function(evt) {
            var $target = $(evt.target);
            var $clicked = $target.hasClass('panel-section-inactive') ? $target : $target.parents('.panel-section-inactive').eq(0);

            this.switchSection($clicked);
        }
    });
    
    var BioChunk = Backbone.View.extend({
        events: {
            'click .remove': 'remove'
        },

        initialize: function(options) {
            this.options = options || {};
        },

        render: function() {
            this.$el.html(tim($('.chunk-tpl').html(), this.options));
            return this;
        },

        remove: function() {
            this.$el.remove();
            
            var _this = this;
            this.options.parent.bioChunks = _.reject(this.options.parent.bioChunks, function(chunk) { return chunk == _this; });
        }
    })

    var AnyMorePanel = Panel.extend({
        label: 'any-more',

        events: _.extend({
            'click .yes': 'pickYes',
            'click .no': 'pickNo'
        }, Panel.prototype.events),

        pickYes: function() {
            // we need a new person box
            var newPanel = addBioPanel(false);
            
            newPanel.$('.panel-heading a').click();
            setState('bio');
        },

        pickNo: function() {
            // FIXME: save some shit
            var toSave = {
                'url': page.url,
                'site': page.site,
                'people': []
            }
            // grab all the bio panels
            _.each(bioPanels, function(bioPanel) {
                var person = {
                    'name': bioPanel.$('.name-section .well').data('selection'),
                    'bio': [],
                    'is_lobbyist': bioPanel.options.isLobbyist
                }
                _.each(bioPanel.bioChunks, function(chunk) {
                    var selection = chunk.options.selection;
                    selection.type = chunk.options.typeValue;

                    person.bio.push(selection);
                })

                toSave.people.push(person);
            })
            console.log('would save', toSave);

            // go back to the find panel, for the second time
            findPanel.setFirst(false);
            
            setState('find');
            
            // replace the bio panel with a new one
            addBioPanel(true);
        }
    });

    // set up event handlers for the iframe
    var webview = $('webview');
    webview[0].addEventListener('consolemessage', function(e) {
        console.log('webview:', e.message);
    });

    webview.on('contentload', function() {
        console.log('iframe loaded a new page');
        webview[0].executeScript({'file': 'js/jquery-2.1.3.min.js'});
        webview[0].executeScript({'file': 'js/injected.js'}, function() {
            webview[0].contentWindow.postMessage('hanuman_hello', '*')
        })
    });

    var messageHandlers = {
        'setUrl': function(url) {
            currentUrl = url;
            visitedNonbio.push(url);
        },
        'updateSelection': function(selection) {
            console.log(selection);
            
            if (currentState == 'bio') {
                // only grab the currently-expanded bio panel
                var $section = $('.bio-panel .panel-collapse.in .panel-section-active');

                var well = $section.find('.well');
                well.data('selection', selection);

                var displayText = selection.selection_text.trim();
                if (displayText.length > TRUNC_LENGTH) {
                    var ss_length = (TRUNC_LENGTH / 2) - 5;
                    displayText = displayText.substring(0, ss_length) + " <strong>...</strong> " + displayText.substring(displayText.length - ss_length, displayText.length);
                }
                setWellText(well, displayText);
            }
        }
    }

    window.addEventListener('message', function(event) {
        if (event.source == webview[0].contentWindow) {
            // this is a message from the child frame
            payload = JSON.parse(event.data);
            if (messageHandlers[payload.action]) {
                messageHandlers[payload.action](payload.data);
            } else {
                console.log('no handler for', payload.action);
            }
        }
    }, false);

    // start!
    newFirm();

})(jQuery);