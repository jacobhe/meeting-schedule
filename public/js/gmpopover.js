!function ($) {

    "use strict"; // jshint ;_;


    /* POPOVER PUBLIC CLASS DEFINITION
     * =============================== */

    var GMPopover = function (element, options) {
        this.init('gmpopover', element, options)
    }


    /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
       ========================================== */

    GMPopover.prototype = $.extend({}, $.fn.popover.Constructor.prototype, {

        constructor: GMPopover

        , show: function () {
            var $tip
              , inside
              , pos
              , actualWidth
              , actualHeight
              , placement
              , tp
              , click
              , self

            if (this.hasContent() && this.enabled) {
                $tip = this.tip()
                this.setContent()

                if (this.options.animation) {
                    $tip.addClass('fade')
                }

                placement = typeof this.options.placement == 'function' ?
                  this.options.placement.call(this, $tip[0], this.$element[0]) :
                  this.options.placement

                inside = /in/.test(placement)

                $tip
                  .remove()
                  .css({ top: 0, left: 0, display: 'block' })
                  .appendTo(inside ? this.$element : document.body)

                pos = this.getPosition(false)

                actualWidth = $tip[0].offsetWidth
                actualHeight = $tip[0].offsetHeight

                switch (inside ? placement.split(' ')[1] : placement) {
                    case 'bottom':
                        tp = { top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2 }
                        break
                    case 'top':
                        tp = { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 }
                        break
                    case 'left':
                        tp = { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth }
                        break
                    case 'right':
                        tp = { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }
                        break
                }

                $tip
                  .css(tp)
                  .addClass(placement)
                  .addClass('in')

                self = this
                click = this.options.click

                if (typeof click == 'function') {
                    $tip.click(function (e) {
                        click.call(self, e)
                    })
                }
            }
        }

    })


    /* POPOVER PLUGIN DEFINITION
     * ======================= */

    $.fn.gmpopover = function (option) {
        return this.each(function () {
            var $this = $(this)
              , data = $this.data('gmpopover')
              , options = typeof option == 'object' && option
            if (!data) $this.data('gmpopover', (data = new GMPopover(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.gmpopover.Constructor = GMPopover

    $.fn.gmpopover.defaults = $.extend({}, $.fn.popover.defaults, {
        click: false
        , uuid: null
    })

}(window.jQuery);
