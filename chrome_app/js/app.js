(function($) {
    var DEFAULT_HOMEPAGE = 'http://localhost:8003/';

    var TRUNC_LENGTH = 200;
    var HOMEPAGE;

    var currentSite = null;
    var currentUrl = null;
    var currentState = null;
    var visited = [];
    var visitedBio = [];
    var pageTitles = {};

    // data-tracking objects
    page = null;

    // panels
    var findPanel, bioPanels, anyMorePanel;

    // general page functions
    var panelGroup = $('.panel-group');
    var newFirm = function() {
        var firm = new Firm({id: 'next'});
        firm.fetch().done(function() {
            currentSite = firm;
            currentUrl = null;
            visited = [];
            visitedBio = [];
            pageTitles = {};

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

            $('webview').attr('src', currentSite.siteUrl());
            if (page) page.site = currentSite;
        });
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
    // from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    var uuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    // ** Views **

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
            'click .new-firm': 'newFirm',
            'click .found-one': 'foundOne'
        }, Panel.prototype.events),

        quit: function() {
            if (visitedBio.length) {
                confirmViewLog(function() { window.close(); })
            } else {
                window.close();
            }
        },

        newFirm: function() {
            if (visitedBio.length) {
                confirmViewLog(newFirm)
            } else {
                newFirm();
            }
        },

        foundOne: function() {
            // add the URL to the bio list
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

        render: function() {
            Panel.prototype.render.call(this);
            
            // hack to poach Bootstrap Dialog's spinner
            this._fakeDialog = new BootstrapDialog();
            
            this.$yesButton = this.$('button.yes');
            this._fakeDialog.enhanceButton(this.$yesButton);

            this.$noButton = this.$('button.no');
            this._fakeDialog.enhanceButton(this.$noButton);

            return this;
        },

        pickYes: function() {
            // we need a new person box
            var newPanel = addBioPanel(false);
            
            newPanel.$('.panel-heading a').click();
            setState('bio');
        },

        pickNo: function() {
            var toSave = {
                'url': page.url,
                'firm': page.site.id,
                'data': {'people': []}
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

                toSave.data.people.push(person);
            })

            // now save it all
            var bioPage = new BioPage(toSave);
            this.$yesButton.disable();
            this.$noButton.spin().disable();

            var _this = this;
            bioPage.save().then(function() {
                _this.$yesButton.enable();
                _this.$noButton.stopSpin().enable();

                // go back to the find panel, for the not-first time
                findPanel.setFirst(false);
                
                setState('find');
                
                // replace the bio panel with a new one
                addBioPanel(true);
            })
        }
    });

    // ** Iframe stuff **
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
        'setPageInfo': function(info) {
            currentUrl = info.url;
            visited.push(currentUrl);
            pageTitles[currentUrl] = info.title;
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

    // ** Dialogs **
    // settings dialog
    $('button.options-button').on('click', function() {
        BootstrapDialog.show({
            title: 'Settings',
            message: function(dialog) {
                var $content = $(tim($('.options-dialog-tpl').html()))
                $content.find('#inputHomepage').val(HOMEPAGE);
                return $content;
            },
            buttons: [
                {
                    label: 'Close',
                    cssClass: 'btn-danger',
                    action: function(dialog) {
                        dialog.close();
                    }
                },
                {
                    label: 'Save',
                    cssClass: 'btn-success',
                    action: function(dialog) {
                        HOMEPAGE = dialog.getModalContent().find('#inputHomepage').val();
                        chrome.storage.sync.set({
                            homepage_url: HOMEPAGE
                        });
                        dialog.close();
                    }
                }
            ]
        });
    });

    // login dialog
    var requireLogin = function(callback) {
        BootstrapDialog.show({
            title: 'Sign in',
            closable: false,
            message: function(dialog) {
                var $content = $(tim($('.login-dialog-tpl').html(), {'homepage': HOMEPAGE}));
                // the form is top level, so filter, not find
                var $form = $content.filter('form');

                // emulate return to submit
                $form.find('input').on('keypress', function(evt) {
                    if (evt.keyCode == 13) {
                        evt.preventDefault();
                        var $button = dialog.getModalFooter().find('button');
                        if (!$button.prop('disabled')) {
                            $button.click();
                        }
                    }
                });
                return $content;
            },
            buttons: [
                {
                    label: 'Login',
                    icon: 'glyphicon glyphicon-star',
                    cssClass: 'btn-primary',
                    action: function(dialog) {
                        var $button = this;
                        $button.disable();
                        $button.spin();

                        // do the actual logging in
                        var $content = dialog.getModalContent();
                        
                        var username = $content.find('#id_username').val(),
                            password = $content.find('#id_password').val();

                        login(username, password).done(function() {
                            dialog.close();
                            if (callback) {
                                callback();
                            }
                        }).fail(function(reason) {
                            var errRow = $content.find('.login-error');
                            errRow.find('strong').text(reason == "bad_login" ? "Login failed. Try again...": "There was a problem communicating with the server. Please try again.");
                            errRow.slideDown('fast');

                            $button.enable();
                            $button.stopSpin();
                        });
                    }
                }
            ],
            onshown: function(dialog) {
                dialog.getModalContent().find('#id_username').focus();
            }
        });
    }

    // view log dialog
    var confirmViewLog = function(callback) {
        BootstrapDialog.show({
            size: BootstrapDialog.SIZE_WIDE,
            title: 'Pages viewed',
            message: function(dialog) {
                var bioSet = new Set(visitedBio);
                var groups = {}
                _.each([['bio', visitedBio], ['nonbio', _.reject(visited, function(el) { return bioSet.has(el); })]], function(item) {
                    groups[item[0]] = _.map(_.uniq(item[1]), function(url) {
                        return {'name': pageTitles[url], 'url': url};
                    })
                })

                var $content = $("<div>").text("As you've been exploring this firm's site, we've kept track of which pages you marked as bio pages and which you didn't. " + 
                        "Please review how you've classified these pages below to make sure we got it right. You can drag pages from one column to the other if they're in " + 
                        "the wrong one. When you're ready, hit 'Save,' below, or, if you want to visit either some more bio or non-bio pages to help us better learn to " + 
                        "tell the difference, hit 'go back' and browse around some more.");
                var $lists = $("<div>").addClass('row').appendTo($content);
                _.each(['bio', 'nonbio'], function(type) {
                    var $listC = $("<div>").addClass('col-sm-6').html("<h4>" + {bio: "Bio", nonbio: 'Non-bio'}[type] + " pages</h4>");
                    var $list = $("<ul>").addClass('list-group').addClass('view-list').addClass(type + '-list').appendTo($listC);
                    _.each(groups[type], function(item) {
                        var $item = $("<li>").addClass('list-group-item').html("<div class='page-name'>" + item.name + "</div><div class='page-url'>" + item.url + "</div>");
                        $item.attr('data-url', item.url);
                        $list.append($item);
                    })
                    $lists.append($listC);
                    $list.sortable({
                        sort: false,
                        group: {put: true, pull: true, name: 'pages'},
                        animation: 150
                    });
                })

                return $content;
            },
            buttons: [
                {label: "Go back", cssClass: 'btn-warning', action: function(dialog) {
                    dialog.close();
                }},
                {label: 'Save and continue', cssClass: 'btn-success', action: function(dialog) {
                    var $content = dialog.getModalContent();

                    // now save it all
                    var viewLog = new ViewLog({
                        'firm': currentSite.id,
                        'bio_pages': _.map($content.find('.bio-list li'), function(el) { return $(el).attr('data-url'); }),
                        'non_bio_pages': _.map($content.find('.nonbio-list li'), function(el) { return $(el).attr('data-url'); }),
                    });
                    dialog.enableButtons(false);
                    this.spin();

                    var _this = this;
                    viewLog.save().then(function() {
                        dialog.enableButtons(true);
                        _this.stopSpin();

                        dialog.close();
                        if (callback) {
                            callback();
                        }  
                    })
                }}
            ]
        })
    }

    // ** Auth stuff **
    var JWT_TOKEN;
    var refreshInterval;
    var login = function(username, password) {
        var out = $.Deferred();
        $.post(HOMEPAGE + 'api/1.0/token-auth-ns/', {'username': username, 'password': password}).done(function(data) {
            JWT_TOKEN = data.token;

            // refresh the token once per minute
            clearInterval(refreshInterval);
            refreshInterval = setInterval(refreshToken, 60000);
            out.resolve();
        }).fail(function(xhr) {
            if (xhr.status == 400) {
                // bad username or password
                out.reject('bad_login');
            } else {
                out.reject('other');
            }
        });
        return out;
    }
    var refreshToken = function() {
        $.post(HOMEPAGE + 'api/1.0/token-refresh/', {'token': JWT_TOKEN}).done(function(data) {
            JWT_TOKEN = data.token;
        }).fail(function() {
            // couldn't get a new token, so force a login again
            clearInterval(refreshInterval);
            requireLogin();
        })
    }

    var _sync = Backbone.sync;
    Backbone.sync = function(method, model, options) {
        var _this = this, _model = model;
        var dfd = $.Deferred();
        options.beforeSend = function(xhr) {
            xhr.setRequestHeader('Authorization' , "JWT " + JWT_TOKEN);
        }

        options.error = function(xhr, statusText, thrown) {
            if (xhr.status == 403) {
                // we're not logged in?
                clearInterval(refreshInterval);
                requireLogin(function() {
                    _sync.call(_this, method, _model, _.clone(options)).done(function() { dfd.done.apply(dfd, arguments); });
                });
            } else {
                // something else is going on
                BootstrapDialog.show({
                    title: 'Save error',
                    message: "There was a problem communicating with the server.",
                    buttons: [
                        {label: 'Give up', cssClass: 'btn-danger', action: function(dialog) {
                            dialog.close();
                            xhr.fail(function() { dfd.reject.apply(dfd, arguments); });
                        }},
                        {label: 'Try again', cssClass: 'btn-success', action: function(dialog) {
                            _sync.call(_this, method, _model, _.clone(options)).done(function() { dfd.resolve.apply(dfd, arguments); }); dialog.close();
                        }}
                    ]
                });

            }
        }

        // call original sync
        _sync.call(this, method, model, _.clone(options)).done(function() { dfd.resolve.apply(dfd, arguments); });
        return dfd.promise();
    }

    // ** Models **
    var Firm = Backbone.Model.extend({
        url: function() {
            return HOMEPAGE + 'api/1.0/firms/' + (this.isNew() ? '' : this.id + '/');
        },
        siteUrl: function() {
            return 'http://' + this.get('domain') + '/';
        }
    })
    var BioPage = Backbone.Model.extend({
        url: function() {
            return HOMEPAGE + 'api/1.0/bio-pages/' + (this.isNew() ? '' : this.id + '/');
        }
    })
    var ViewLog = Backbone.Model.extend({
        url: function() {
            return HOMEPAGE + 'api/1.0/view-logs/' + (this.isNew() ? '' : this.id + '/');
        }
    })

    

    // READY, SET, GO!
    // retrieve the settings, force a login, and start
    chrome.storage.sync.get({
        homepage_url: DEFAULT_HOMEPAGE
    }, function(items) {
        HOMEPAGE = items.homepage_url;
        requireLogin(newFirm);
        // confirmViewLog(function() { requireLogin(newFirm); });
    });
})(jQuery);