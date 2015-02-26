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
    person = null;

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

    var setState = function(state) {
        if (!$('.' + state + '-panel .panel-collapse').hasClass('in')) {
            $('.' + state + '-panel .panel-heading a').click();
        }
        currentState = state;

        if (state == 'find') {
            // get a new page object ready
            page = {
                'people': [],
                'url': null,
                'site': currentSite
            }
        }

        if (state == 'name') {
            // get a new person object ready
            person = {'name': null, 'bio': [], 'lobbyist': null};
            page.people.push(person);
        }
    }

    // deal with all the button event handlers -- so many, geez

    // find a bio panel
    $('.find-panel .quit').on('click', function() {
        window.close();
    })
    $('.find-panel .new-firm').on('click', function() {
        newFirm();
    })
    $('.find-panel .found-one').on('click', function() {
        // remove the current URL from the non-bio list if it's in there
        visitedNonbio = _.reject(visitedNonbio, function(el) { return el == currentUrl });
        // and add it to the bio list
        visitedBio.push(currentUrl);

        // go to the next panel for the first time
        var next = $('.name-panel');
        next.addClass('first').removeClass('not-first');
        setState('name');
        page.url = currentUrl;
    })

    // name panel
    $('.name-panel .done').on('click', function() {
        setState('bio');
    })

    // bio panel
    $('.bio-panel .done').on('click', function() {
        setState('lobbyist');
    })
    $('.bio-panel .add').on('click', function() {
        var tpl = $('#chunk-tpl').html();
        var rendered = tim(tpl, {'type': $('.bio-panel option:selected').html(), 'body': $('.bio-panel .well .content').html()});

        $('.bio-panel .saved-chunks').append(rendered);
    });

    // sections within the bio panel
    var switchSection = function($section) {
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

        // scroll the sidebar
        $('.sidebar').animate({scrollTop: absOffset.top - barOffset.top - 15});

        // toggle form control states
        $section.find('button,select').removeAttr('disabled');
        $inactives.find('button,select').attr('disabled', 'disabled');

    }
    $('.bio-panel').on('click', '.panel-section-inactive', function(evt) {
        console.log('clicked');
        var $target = $(evt.target);
        var $clicked = $target.hasClass('panel-section-inactive') ? $target : $target.parents('.panel-section-inactive').eq(0);

        switchSection($clicked);
    })

    // name panel
    $('.lobbyist-panel .btn').on('click', function() {
        // are they a lobbyist?
        var $this = $(this);
        var is_lobbyist = $this.hasClass('yes') ? 'yes' : ($this.hasClass('no') ? 'no' : 'dunno');

        // save their answer into the object
        person.lobbyist = is_lobbyist
        setState('any-more');
    })

    // any more panel
    $('.any-more-panel .yes').on('click', function() {
        // go back to the name panel, for the second time
        $('.name-panel').removeClass('first').addClass('not-first');
        setState('name');
    })
    $('.any-more-panel .no').on('click', function() {
        // FIXME: save some shit
        console.log('would save', page)

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
            
            if (currentState == 'name') {
                person.name = selection;
                setWellText($('.name-panel .well'), selection.selection_text.trim());
            } else if (currentState == 'bio') {
                person.bio = [selection];

                var wellText = selection.selection_text.trim();
                if (wellText.length > TRUNC_LENGTH) {
                    console.log('truncating');
                    var ss_length = (TRUNC_LENGTH / 2) - 5;
                    wellText = wellText.substring(0, ss_length) + " <strong>...</strong> " + wellText.substring(wellText.length - ss_length, wellText.length);
                }
                console.log(wellText);
                setWellText($('.bio-panel .well'), wellText);
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