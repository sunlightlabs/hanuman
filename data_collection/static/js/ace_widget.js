(function($) {
    $(function() {
        $('.ace-area').each(function() {
            var $area = $(this);
            var $editor = $("<div>");
            $editor.attr('id', 'ace_' + $area.attr('id'));
            $editor.css({'width': '100%', 'height': '400px', 'min-width': '300px'});

            $area.after($editor);
            $area.hide();

            var aceEditor = ace.edit($editor[0]);
            aceEditor.getSession().setValue($area.val());
            aceEditor.getSession().on('change', function() {
                $area.val(aceEditor.getSession().getValue());
            });

            aceEditor.setTheme("ace/theme/eclipse");
            aceEditor.getSession().setMode("ace/mode/json");
        })
    })
})(django.jQuery);