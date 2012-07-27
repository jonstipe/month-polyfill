(function($){
  $(function(){
    if (!Modernizr.inputtypes.month) {
      var readMonth = function(m_str) {
        if (/^\d{4,}-\d\d$/.test(m_str)) {
          var matchData = /^(\d+)-(\d+)$/.exec(m_str),
            yearPart = parseInt(matchData[1], 10),
            monthPart = parseInt(matchData[2], 10);
          return { year: yearPart, month: monthPart };
        } else throw "Invalid month string: " + m_str;
      };
      var makeMonthString = function(month_obj) {
        var m_arr = [month_obj['year'].toString()];
        m_arr.push('-');
        if (month_obj['month'] < 10) m_arr.push('0');
        m_arr.push(month_obj['month'].toString());
        return m_arr.join('');
      };
      var makeMonthDisplayString = function(month_obj, elem) {
        var $elem = $(elem);
        var month_names = $elem.datepicker( "option", "monthNames" );
        var month_arr = [month_names[month_obj['month'] - 1]];
        month_arr.push(' ');
        month_arr.push(month_obj['year'].toString());
        return month_arr.join('');
      };
      // -1 : month1 is later
      // 0 : same
      // 1: month2 is later
      var compareMonths = function(month1, month2) {
        if (month1['year'] > month2['year']) return -1;
        else if (month1['year'] == month2['year']) {
          if (month1['month'] > month2['month']) return -1;
          else if (month1['month'] == month2['month']) return 0;
          else return 1;
        } else return 1;
      };
      var advanceMonth = function(inMonth, amt) {
        var outMonth = { year: inMonth['year'], month: inMonth['month'] };
        outMonth['month'] += amt;
        if (outMonth['month'] > 12) {
          outMonth['year'] += Math.floor(outMonth['month'] / 12);
          outMonth['month'] = outMonth['month'] % 12;
        }
        return outMonth;
      };
      var regressMonth = function(inMonth, amt) {
        var outMonth = { year: inMonth['year'], month: inMonth['month'] };
        outMonth['month'] -= amt;
        if (outMonth['month'] < 1) {
          while (outMonth['month'] < 1) {
            outMonth['year'] -= 1;
            outMonth['month'] += 12;
          }
        }
        return outMonth;
      };
      var increment = function(hiddenField, monthBtn, calendarDiv) {
        var $hiddenField = $(hiddenField);
        var value = readMonth($hiddenField.val());
        var step = $hiddenField.data("step");
        var max = $hiddenField.data("max");
        if (step === undefined || step == 'any') value = advanceMonth(value, 1);
        else value = advanceMonth(value, step);
        if (max !== undefined && compareMonths(value, max) == -1) {
          value['year'] = max['year'];
          value['month'] = max['month'];
        }
        value = stepNormalize(value, hiddenField);
        $hiddenField.val(makeMonthString(value)).change();
        $(monthBtn).text(makeMonthDisplayString(value, calendarDiv));
        $(calendarDiv).datepicker("setDate", new Date(value['year'], value['month'] - 1));
      };
      var decrement = function(hiddenField, monthBtn, calendarDiv) {
        var $hiddenField = $(hiddenField);
        var value = readMonth($hiddenField.val());
        var step = $hiddenField.data("step");
        var min = $hiddenField.data("min");
        if (step === undefined || step == 'any') value = regressMonth(value, 1);
        else value = regressMonth(value, step);
        if (min !== undefined && compareMonths(value, min) == 1) {
          value['year'] = min['year'];
          value['month'] = min['month'];
        }
        value = stepNormalize(value, hiddenField);
        $hiddenField.val(makeMonthString(value)).change();
        $(monthBtn).text(makeMonthDisplayString(value, calendarDiv));
        $(calendarDiv).datepicker("setDate", new Date(value['year'], value['month'] - 1));
      };
      var stepNormalize = function(inMonth, hiddenField) {
        var $hiddenField = $(hiddenField);
        var step = $hiddenField.data("step");
        var min = $hiddenField.data("min");
        var max = $hiddenField.data("max");
        if (step !== undefined && step != 'any') {
          var kNum = (inMonth['year'] * 12) + inMonth['month'];
          if (min === undefined) {
            min = { year: 1970, month: 1 };
          }
          var minNum = (min['year'] * 12) + min['month'];
          var stepDiff = (kNum - minNum) % step;
          var stepDiff2 = step - stepDiff;
          if (stepDiff == 0) return inMonth;
          else {
            if (stepDiff > stepDiff2) {
              var outMonth = { year: inMonth['year'], month: inMonth['month'] };
              outMonth = advanceMonth(outMonth, stepDiff2);
              return outMonth;
            } else {
              var outMonth = { year: inMonth['year'], month: inMonth['month'] };
              outMonth = regressMonth(outMonth, stepDiff);
              return outMonth;
            }
          }
        } else return inMonth;
      }
      
      $('input[type="month"]').each(function(index) {
        var $this = $(this), value, min, max, step;
        if ($this.attr('value') !== undefined && /^\d{4,}-\d\d$/.test($this.attr('value'))) value = readMonth($this.attr('value'));
        else {
          value = new Date();
          value = { year: value.getFullYear(), month: value.getMonth() + 1 };
        }
        if ($this.attr('min') !== undefined) {
          min = readMonth($this.attr('min'));
          if (compareMonths(value, min) == 1) {
            value['year'] = min['year'];
            value['month'] = min['month'];
          }
        }
        if ($this.attr('max') !== undefined) {
          max = readMonth($this.attr('max'));
          if (compareMonths(value, max) == -1) {
            value['year'] = max['year'];
            value['month'] = max['month'];
          }
        }
        if ($this.attr('step') == 'any') step = 1;
        else if ($this.attr('step') !== undefined) step = parseInt($this.attr('step'), 10);
        else step = 1;
        var hiddenField = document.createElement('input');
        var $hiddenField = $(hiddenField);
        $hiddenField.attr({
          type: "hidden",
          name: $(this).attr('name'),
          value: makeMonthString(value)
        });
        $hiddenField.data('min', min);
        $hiddenField.data('max', max);
        $hiddenField.data('step', step);

        value = stepNormalize(value, hiddenField);
        $hiddenField.attr('value', makeMonthString(value));

        var calendarContainer = document.createElement('span');
        var $calendarContainer = $(calendarContainer);
        if ($this.attr('class') !== undefined) $calendarContainer.attr('class', $this.attr('class'));
        if ($this.attr('style') !== undefined) $calendarContainer.attr('style', $this.attr('style'));
        var calendarDiv = document.createElement('div');
        var $calendarDiv = $(calendarDiv);
        $calendarDiv.css({
          display: 'none',
          position: 'absolute'
        });
        var monthBtn = document.createElement('button');
        var $monthBtn = $(monthBtn);
        $monthBtn.addClass('month-datepicker-button');

        $this.replaceWith(hiddenField);
        $calendarContainer.insertAfter(hiddenField);
        $monthBtn.appendTo(calendarContainer);
        $calendarDiv.appendTo(calendarContainer);

        $calendarDiv.datepicker({
          dateFormat: 'MM dd, yy',
          showButtonPanel: true,
          stepMonths: step
        });

        $monthBtn.text(makeMonthDisplayString(value, calendarDiv));

        if (min !== undefined) $calendarDiv.datepicker("option", "minDate", new Date(min['year'], min['month'] - 1, 1));
        if (max !== undefined) $calendarDiv.datepicker("option", "maxDate", new Date(max['year'], max['month'], 0));
        var closeFunc;
        if (Modernizr.csstransitions) {
          calendarDiv.className = "month-calendar-dialog month-closed";
          $monthBtn.click(function () {
            $calendarDiv.unbind('transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd');
            calendarDiv.style.display = 'block';
            calendarDiv.className = "month-calendar-dialog month-open";
            return false;
          });
          closeFunc = function () {
            if (calendarDiv.className == "month-calendar-dialog month-open") {
              var transitionend_function = function(event, ui) {
                calendarDiv.style.display = 'none';
                $calendarDiv.unbind("transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd", transitionend_function);
              }
              $calendarDiv.bind("transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd", transitionend_function);
              calendarDiv.className = "month-calendar-dialog month-closed";
              return false;
            }
          }
        } else {
          $monthBtn.click(function(event) {
            event.preventDefault();
            $calendarDiv.fadeIn('fast');
          });
          closeFunc = function() {
            $calendarDiv.fadeOut('fast');
          };
        }

        $calendarDiv.mouseleave(closeFunc);
        $calendarDiv.datepicker( "option", "onSelect", function(dateText, inst) {
          var dateObj = $.datepicker.parseDate('MM dd, yy', dateText);
          var monthObj = { year: dateObj.getFullYear(), month: dateObj.getMonth() + 1 };
          $hiddenField.val(makeMonthString(monthObj)).change();
          $monthBtn.text(makeMonthDisplayString(monthObj, calendarDiv));
          closeFunc();
        });
        $calendarDiv.datepicker("setDate", new Date(value['year'], value['month'] - 1, 1));
        $monthBtn.bind({
          DOMMouseScroll: function(event) {
            if (event.detail < 0) increment(hiddenField, monthBtn, calendarDiv);
            else decrement(hiddenField, monthBtn, calendarDiv);
            event.preventDefault();
          },
          mousewheel: function(event) {
            if (event.wheelDelta > 0) increment(hiddenField, monthBtn, calendarDiv);
            else decrement(hiddenField, monthBtn, calendarDiv);
            event.preventDefault();
          },
          keypress: function(event) {
            if (event.keyCode == 38) { // up arrow
              increment(hiddenField, monthBtn, calendarDiv);
              event.preventDefault();
            } else if (event.keyCode == 40) { // down arrow
              decrement(hiddenField, monthBtn, calendarDiv);
              event.preventDefault();
            }
          }
        });
      });
    }
  });
})(jQuery);