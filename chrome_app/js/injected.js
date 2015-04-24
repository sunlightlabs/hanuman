(function() {
    // things related to injection and communication
    if (window.hanumanInjected) {
        return;
    }
    window.hanumanInjected = true;

    console.log('injected ' + document.location.href);

    var parent = window;
    window.addEventListener('message', function(event) {
        if (event.data == "hanuman_hello" && event.origin.match(/^chrome-extension:/)) {
            // this is the hello message from the parent window; grab its source to be able to communicate backwards
            parent = event.source;
            parentPostMessage('setPageInfo', {'url': document.location.href, 'title': document.title});
        }
    }, false);

    var parentPostMessage = function(action, data) {
        parent.postMessage(JSON.stringify({'action': action, 'data': data}), '*');
    }

    // utility function
    // poached from http://stackoverflow.com/questions/2661818/javascript-get-xpath-of-a-node
    var createXPathFromElement = function(elm) { 
        var allNodes = document.getElementsByTagName('*'); 
        for (var segs = []; elm && elm.nodeType == 1; elm = elm.parentNode) 
        { 
            if (elm.hasAttribute('id')) { 
                    var uniqueIdCount = 0; 
                    for (var n=0;n < allNodes.length;n++) { 
                        if (allNodes[n].hasAttribute('id') && allNodes[n].id == elm.id) uniqueIdCount++; 
                        if (uniqueIdCount > 1) break; 
                    }; 
                    if ( uniqueIdCount == 1) { 
                        segs.unshift('id("' + elm.getAttribute('id') + '")'); 
                        return segs.join('/'); 
                    } else { 
                        segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]'); 
                    } 
            } else if (elm.hasAttribute('class')) { 
                segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]'); 
            } else { 
                for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) { 
                    if (sib.localName == elm.localName)  i++; }; 
                    segs.unshift(elm.localName.toLowerCase() + '[' + i + ']'); 
            }; 
        }; 
        return segs.length ? '/' + segs.join('/') : null; 
    };

    // things related to selection handling
    var getSelectionInfo = function(selection) {
        var range = selection.getRangeAt(0);
        
        var container = range.commonAncestorContainer;
        if (container.nodeType == 3) {
            // this is a text node, and we want a dom node
            container = container.parentNode;
        }
        var $container = $(container);

        var $span = $('<span>');
        $span.append(range.cloneContents());

        var info = {
            'selection_text': selection.toString(),
            'selection_html': $span.html(),
            'container_text': $container.text(),
            'container_html': $container.html(),
            'container_xpath': createXPathFromElement(container)
        }
        return info;
    }

    currentSelectionString = null;
    var handleSelect = function() {
        var selection = window.getSelection();
        var selectionString = selection.toString();

        if (selectionString.length > 0) {
            if (selectionString != currentSelectionString) {
                currentSelectionString = selectionString;
                var info = getSelectionInfo(selection);
                parentPostMessage('updateSelection', info);
            }
        }
    }
    $(document)
        .on('keyup', handleSelect)
        .on('mouseup', handleSelect)
})();