###
HTML5 Month polyfill | Jonathan Stipe | https://github.com/jonstipe/month-polyfill
###
(($) ->
  $.fn.inputMonth = ->
    readMonth = (m_str) ->
      if /^\d{4,}-\d\d$/.test m_str
        matchData = /^(\d+)-(\d+)$/.exec m_str
        yearPart = parseInt matchData[1], 10
        monthPart = parseInt matchData[2], 10
        { year: yearPart, month: monthPart }
      else
        throw "Invalid month string: #{m_str}"

    makeMonthString = (month_obj) ->
      m_arr = [month_obj['year'].toString()]
      m_arr.push '-'
      m_arr.push '0' if month_obj['month'] < 10
      m_arr.push month_obj['month'].toString()
      m_arr.join ''

    makeMonthDisplayString = (month_obj, elem) ->
      $elem = $ elem
      month_names = $elem.datepicker "option", "monthNames"
      month_arr = [month_names[month_obj['month'] - 1]]
      month_arr.push ' '
      month_arr.push month_obj['year'].toString()
      month_arr.join ''

    # -1 : month1 is later
    # 0 : same
    # 1: month2 is later
    compareMonths = (month1, month2) ->
      if month1['year'] > month2['year']
        -1
      else if month1['year'] == month2['year']
        if month1['month'] > month2['month']
          -1
        else if month1['month'] == month2['month']
          0
        else
          1
      else
        1

    advanceMonth = (inMonth, amt) ->
      outMonth = { year: inMonth['year'], month: inMonth['month'] }
      outMonth['month'] += amt
      if outMonth['month'] > 12
        outMonth['year'] += Math.floor(outMonth['month'] / 12)
        outMonth['month'] = outMonth['month'] % 12
      outMonth

    regressMonth = (inMonth, amt) ->
      outMonth = { year: inMonth['year'], month: inMonth['month'] }
      outMonth['month'] -= amt
      if outMonth['month'] < 1
        while outMonth['month'] < 1
          outMonth['year'] -= 1
          outMonth['month'] += 12
      outMonth

    increment = (hiddenField, monthBtn, calendarDiv) ->
      $hiddenField = $ hiddenField
      value = readMonth $hiddenField.val()
      step = $hiddenField.data "step"
      max = $hiddenField.data "max"
      if !step? || step == 'any'
        value = advanceMonth value, 1
      else
        value = advanceMonth value, step
      if max? && compareMonths(value, max) == -1
        value['year'] = max['year']
        value['month'] = max['month']
      value = stepNormalize value, hiddenField
      $hiddenField.val(makeMonthString(value)).change()
      $(monthBtn).text makeMonthDisplayString(value, calendarDiv)
      $(calendarDiv).datepicker "setDate", new Date(value['year'], value['month'] - 1)
      null

    decrement = (hiddenField, monthBtn, calendarDiv) ->
      $hiddenField = $ hiddenField
      value = readMonth $hiddenField.val()
      step = $hiddenField.data "step"
      min = $hiddenField.data "min"
      if !step? || step == 'any'
        value = regressMonth value, 1
      else
        value = regressMonth value, step
      if min? && compareMonths(value, min) == 1
        value['year'] = min['year']
        value['month'] = min['month']
      value = stepNormalize value, hiddenField
      $hiddenField.val(makeMonthString(value)).change()
      $(monthBtn).text makeMonthDisplayString(value, calendarDiv)
      $(calendarDiv).datepicker "setDate", new Date(value['year'], value['month'] - 1)
      null

    stepNormalize = (inMonth, hiddenField) ->
      $hiddenField = $ hiddenField
      step = $hiddenField.data "step"
      min = $hiddenField.data "min"
      max = $hiddenField.data "max"
      if step? && step != 'any'
        kNum = (inMonth['year'] * 12) + inMonth['month']
        min ?= { year: 1970, month: 1 }
        minNum = (min['year'] * 12) + min['month']
        stepDiff = (kNum - minNum) % step
        stepDiff2 = step - stepDiff
        if stepDiff == 0
          inMonth
        else
          if stepDiff > stepDiff2
            advanceMonth { year: inMonth['year'], month: inMonth['month'] }, stepDiff2
          else
            regressMonth { year: inMonth['year'], month: inMonth['month'] }, stepDiff
      else 
        inMonth
    
    $(this).filter('input[type="month"]').each ->
      $this = $ this
      value = $this.attr 'value'
      min = $this.attr 'min'
      max = $this.attr 'max'
      step = $this.attr 'step'
      className = $this.attr 'class'
      style = $this.attr 'style'
      if value? && /^\d{4,}-\d\d$/.test value
        value = readMonth value
      else 
        value = new Date()
        value = { year: value.getFullYear(), month: value.getMonth() + 1 }
      if min?
        min = readMonth min
        if compareMonths(value, min) == 1
          value['year'] = min['year']
          value['month'] = min['month']
      if max?
        max = readMonth max
        if compareMonths(value, max) == -1
          value['year'] = max['year']
          value['month'] = max['month']
      if step? && step != 'any'
        step = parseInt step, 10
      else
        step = 1
      hiddenField = document.createElement 'input'
      $hiddenField = $ hiddenField
      $hiddenField.attr
        type: "hidden"
        name: $this.attr 'name'
        value: makeMonthString value
      $hiddenField.data
        min: min
        max: max
        step: step

      value = stepNormalize value, hiddenField
      $hiddenField.attr 'value', makeMonthString(value)

      calendarContainer = document.createElement 'span'
      $calendarContainer = $ calendarContainer
      $calendarContainer.attr 'class', className if className?
      $calendarContainer.attr 'style', style if style?
      calendarDiv = document.createElement 'div'
      $calendarDiv = $ calendarDiv
      $calendarDiv.css
        display: 'none'
        position: 'absolute'
      monthBtn = document.createElement 'button'
      $monthBtn = $ monthBtn
      $monthBtn.addClass 'month-datepicker-button'

      $this.replaceWith hiddenField
      $calendarContainer.insertAfter hiddenField
      $monthBtn.appendTo calendarContainer
      $calendarDiv.appendTo calendarContainer

      $calendarDiv.datepicker
        dateFormat: 'MM dd, yy'
        showButtonPanel: true
        stepMonths: step

      $monthBtn.text makeMonthDisplayString(value, calendarDiv)

      $calendarDiv.datepicker "option", "minDate", new Date(min['year'], min['month'] - 1, 1) if min?
      $calendarDiv.datepicker "option", "maxDate", new Date(max['year'], max['month'], 0) if max?
      if Modernizr.csstransitions
        calendarDiv.className = "month-calendar-dialog month-closed"
        $monthBtn.click (event) ->
          $calendarDiv.off 'transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd'
          calendarDiv.style.display = 'block'
          calendarDiv.className = "month-calendar-dialog month-open"
          event.preventDefault()
          false
        closeFunc = (event) ->
          if calendarDiv.className == "month-calendar-dialog month-open"
            transitionend_function = (event, ui) ->
              calendarDiv.style.display = 'none'
              $calendarDiv.off "transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd", transitionend_function
              null
            $calendarDiv.on "transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd", transitionend_function
            calendarDiv.className = "month-calendar-dialog month-closed"
          event.preventDefault() if event?
          null
      else
        $monthBtn.click (event) ->
          $calendarDiv.fadeIn 'fast'
          event.preventDefault()
          false
        closeFunc = (event) ->
          $calendarDiv.fadeOut 'fast'
          event.preventDefault() if event?
          null
      $calendarDiv.mouseleave closeFunc
      $calendarDiv.datepicker "option", "onSelect", (dateText, inst) ->
        dateObj = $.datepicker.parseDate 'MM dd, yy', dateText
        monthObj = { year: dateObj.getFullYear(), month: dateObj.getMonth() + 1 }
        $hiddenField.val(makeMonthString(monthObj)).change()
        $monthBtn.text makeMonthDisplayString(monthObj, calendarDiv)
        closeFunc()
        null
      $calendarDiv.datepicker "setDate", new Date(value['year'], value['month'] - 1, 1)
      $monthBtn.on
        DOMMouseScroll: (event) ->
          if event.originalEvent.detail < 0
            increment hiddenField, monthBtn, calendarDiv
          else
            decrement hiddenField, monthBtn, calendarDiv
          event.preventDefault()
          null
        mousewheel: (event) ->
          if event.originalEvent.wheelDelta > 0
            increment hiddenField, monthBtn, calendarDiv
          else
            decrement hiddenField, monthBtn, calendarDiv
          event.preventDefault()
          null
        keypress: (event) ->
          if event.keyCode == 38 # up arrow
            increment hiddenField, monthBtn, calendarDiv
            event.preventDefault()
          else if event.keyCode == 40 # down arrow
            decrement hiddenField, monthBtn, calendarDiv
            event.preventDefault()
          null
      null
    this
  $ ->
    $('input[type="month"]').inputMonth() unless Modernizr.inputtypes.month
    null
  null
)(jQuery)