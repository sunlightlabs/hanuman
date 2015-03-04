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

    var newFirm = function() {
        resetPageFinder();
        currentSite = SITES[0];
        currentUrl = null;
        visitedNonbio = [];
        visitedBio = [];

        $('webview').attr('src', currentSite);
        if (page) page.site = currentSite;
    }

    var resetPageFinder = function() {
        resetNameFinder();
        $('.panel').addClass('first').removeClass('not-first');
        setState('find');
    }

    var resetNameFinder = function() {
        _.each(['.name-panel', '.bio-panel'], function(panel) {
            setWellText($(panel + ' .well'), '');
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

    var panelGroup = $('.panel-group');

    var setState = function(state) {
        // check if the currently expanded thing has the class of the state, and if not, find the first exemplar of that state and expand it
        var currentExpanded = panelGroup.find('.panel-collapse.in').parents('.panel');
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
            switchSection(currentExpanded.find('.name-section'), true);
        }
    }

    // if they manually jump around, set the state variable right, but don't reset anything
    panelGroup.on('click', '.panel-title a', function() {
        currentState = $(this).parents('.panel').eq(0).attr('data-state');
    })

    // deal with all the button event handlers -- so many, geez

    // find a bio panel
    panelGroup.on('click', '.find-panel .quit', function() {
        window.close();
    })
    panelGroup.on('click', '.find-panel .new-firm', function() {
        newFirm();
    })
    panelGroup.on('click', '.find-panel .found-one', function() {
        // remove the current URL from the non-bio list if it's in there
        visitedNonbio = _.reject(visitedNonbio, function(el) { return el == currentUrl });
        // and add it to the bio list
        visitedBio.push(currentUrl);

        // go to the next panel for the first time
        setState('bio');
        page.url = currentUrl;
    })

    // bio panel

    // sections within the bio panel
    // -- name section
    panelGroup.on('click', '.bio-panel .name-section .done', function() {
        switchSection($('.bio-section'));
    });
    // -- bio section
    panelGroup.on('click', '.bio-panel .bio-section .done', function() {
        switchSection($('.lobbyist-section'));
    })
    panelGroup.on('click', '.bio-panel .bio-section .add', function(evt) {
        var tpl = $('#chunk-tpl').html();
        var panel = $(evt.target).parents('.bio-panel');
        var well = panel.find('.bio-section .well');
        var selectedType = panel.find('option:selected');

        var rendered = $(tim(tpl, {'type': selectedType.html(), 'body': well.find('.content').html()}));

        var selection = well.data('selection');
        selection.type = selectedType.attr('value');
        rendered.data('selection', selection);

        panel.find('.saved-chunks').append(rendered);
    });
    panelGroup.on('click', '.bio-panel .bio-section .chunk .remove', function(evt) {
        $(evt.target).parents('.chunk').remove();
    })
    panelGroup.on('click', '.bio-panel .lobbyist-section .btn', function(evt) {
        // are they a lobbyist?
        var $this = $(evt.target);
        var is_lobbyist = $this.hasClass('yes') ? 'yes' : ($this.hasClass('no') ? 'no' : 'dunno');

        // save their answer into the object
        $this.parents('.bio-panel').data('is_lobbyist', is_lobbyist);
        setState('any-more');
    })
    var switchSection = function($section, noAnimation) {
        // delay this to keep button clicks in active sections from triggering the inactive-section click handler
        setTimeout(function() {
            var $inactives = $section.parent().find('.panel-section').not($section);
            
            // class toggling
            $inactives.removeClass('panel-section-active').addClass('panel-section-inactive');
            $section.removeClass('panel-section-inactive').addClass('panel-section-active');

            // offset stuff
            var absOffset = $section.offset();
            var barOffset = $('.sidebar-top').offset();
            var chevronOffset = $('.chevron-rel').offset();

            // animate the chevron
            $('.chevron').animate({'top': absOffset.top - chevronOffset.top + parseInt($section.css('padding-top'))});

            if (!(noAnimation != undefined)) {
                // scroll the sidebar
                $('.sidebar').animate({scrollTop: absOffset.top - barOffset.top - 15});
            }

            // toggle form control states
            $section.find('button,select').removeAttr('disabled');
            $inactives.find('button,select').attr('disabled', 'disabled');
        }, 0);
    }
    panelGroup.on('click', '.bio-panel .panel-section-inactive', function(evt) {
        console.log('clicked');
        var $target = $(evt.target);
        var $clicked = $target.hasClass('panel-section-inactive') ? $target : $target.parents('.panel-section-inactive').eq(0);

        switchSection($clicked);
    })

    // any more panel
    panelGroup.on('click', '.any-more-panel .yes', function() {
        // go back to the name panel, for the second time
        $('.bio-panel').removeClass('first').addClass('not-first');
        setState('bio');
    })
    panelGroup.on('click', '.any-more-panel .no', function() {
        // FIXME: save some shit
        var toSave = {
            'url': page.url,
            'site': page.site,
            'people': []
        }
        // grab all the bio panels
        $('.bio-panel').each(function() {
            var $this = $(this);
            var person = {
                'name': $this.find('.name-section .well').data('selection'),
                'bio': [],
                'is_lobbyist': $this.data('is_lobbyist')
            }
            $this.find('.chunk').each(function() {
                person.bio.push($(this).data('selection'));
            })

            toSave.people.push(person);
        })
        console.log('would save', toSave);

        // go back to the find panel, for the second time
        $('.find-panel').removeClass('first').addClass('not-first');
        resetNameFinder();
        setState('find');
        // but when we get to the name panel, it'll be the first time there for this page
        $('.name-panel').removeClass('not-first').addClass('first');
    })

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