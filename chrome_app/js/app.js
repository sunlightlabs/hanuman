(function($) {
    SITES = [
        "http://www.pattonboggs.com/"
    ]
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

        $('iframe').attr('src', currentSite);
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
        well.find('.content').text(text);
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
            person = {'name': null, 'bio': null, 'lobbyist': null};
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
        // save their name into the object
        person.name = $('.name-panel .well .content').text();
        setState('bio');
    })

    // bio panel
    $('.bio-panel .done').on('click', function() {
        // save their bio into the object
        person.bio = $('.bio-panel .well .content').text();
        setState('lobbyist');
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
        setState('find');
        // but when we get to the name panel, it'll be the first time there for this page
        $('.name-panel').removeClass('not-first').addClass('first');
    })

    // set up the event handler for the iframe
    $('webview').on('loadstop', function() {
        console.log('iframe loaded a new page');
        $(this)[0].executeScript({'file': 'injected.js'})
    });

    // start!
    newFirm();

})(jQuery);