from jsonfield.widgets import JSONWidget

class AceJSONWidget(JSONWidget):
    def __init__(self, attrs=None):
        if not attrs:
            attrs = {}
        attrs['class'] = 'ace-area'
        super(AceJSONWidget, self).__init__(attrs=attrs)

    class Media:
        js = ('https://cdnjs.cloudflare.com/ajax/libs/ace/1.1.9/ace.js', 'js/ace_widget.js')