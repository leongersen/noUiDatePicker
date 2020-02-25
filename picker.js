(function(factory) {
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof exports === "object") {
    // Node/CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    window.Picker = factory();
  }
})(function() {
  "use strict";

  var Classes = {
    header: "calendar-header",
    button: "calendar-button",
    buttonDecrease: "calendar-button-decrease",
    buttonIncrease: "calendar-button-increase",
    headerMonth: "calendar-header-month",
    monthName: "calendar-month-name",
    dayName: "calendar-day-name",
    row: "calendar-row",
    table: "calendar-table",
    calendar: "calendar",
    cell: "calendar-cell",
    date: "calendar-date",
    week: "calendar-week",
    isOtherMonth: "calendar-is-other-month",
    isCurrentMonth: "calendar-is-current-month",
    isEdge: "calendar-is-edge",
    isStart: "calendar-is-start",
    isOutside: "calendar-is-outside",
    isBeforeStart: "calendar-is-before-start",
    isEnd: "calendar-is-end",
    isAfterEnd: "calendar-is-after-end",
    isOk: "calendar-is-ok"
  };

  // Returns MODIFIED \Date
  Date.prototype.null = function() {
    this.setHours(0, 0, 0, 0);
    return this;
  };

  // Returns MODIFIED \Date
  Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + days);
    return this;
  };

  // Returns MODIFIED \Date
  Date.prototype.addMonths = function(months) {
    this.setMonth(this.getMonth() + months);
    return this;
  };

  // Return \String
  Date.prototype.Ymd = function() {
    return this.getFullYear() + "-" + pad(this.getMonth() + 1) + "-" + pad(this.getDate());
  };

  // if y = DateTime, copy it. Otherwise, create a new one from year, month, date.
  function copy(y, m, d) {
    if (y instanceof Date) {
      d = y.getDate();
      m = y.getMonth();
      y = y.getFullYear();
    }

    return new Date(y, m, d, 0, 0, 0, 0);
  }

  // http://stackoverflow.com/questions/4156434/javascript-get-the-first-day-of-the-week-from-current-date
  function getMonday(d) {
    d = new Date(d);

    var day = d.getDay();
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);

    return new Date(d.setDate(diff));
  }

  // Convert NodeList (or similar) to Array.
  function toArray(n) {
    return Array.prototype.slice.call(n);
  }

  // Left pad number with 0, returns string of length 2.
  function pad(a) {
    var str = String(a);
    var pad = "00";
    return pad.substring(0, pad.length - str.length) + str;
  }

  // Check is date is not NaN.
  function isValidDate(dt) {
    return Object.prototype.toString.call(dt) === "[object Date]" && !isNaN(dt.getTime());
  }

  // Checks if month and year are the same.
  function isSameMonth(dt, dt2) {
    return dt.getMonth() === dt2.getMonth() && dt.getFullYear() === dt2.getFullYear();
  }

  // Generate month name and buttons.
  function renderMonthHeader(dt, index, opt, paintPreviousMonth, paintNextMonth) {
    var html = "";

    paintPreviousMonth = paintPreviousMonth && (!index || !opt.twoCalendars);
    paintNextMonth = paintNextMonth && (index || !opt.twoCalendars);

    html += '<div class="' + Classes.header + '">';

    if (paintPreviousMonth) {
      html += '<div class="' + Classes.button + " " + Classes.buttonDecrease + '">' + opt.icon + "</div>";
    }

    html +=
      '<div class="' +
      Classes.headerMonth +
      '">' +
      '<strong class="' +
      Classes.monthName +
      '">' +
      opt.monthNames[dt.getMonth()] +
      "</strong>" +
      " " +
      dt.getFullYear() +
      "</div>";

    if (paintNextMonth) {
      html += '<div class="' + Classes.button + " " + Classes.buttonIncrease + '">' + opt.icon + "</div>";
    }

    html += "</div>";

    return html;
  }

  // Unique ID for a date cell.
  function getCalcForDate(dt) {
    return dt.getFullYear() + "" + pad(dt.getMonth()) + "" + pad(dt.getDate()); // Month is 0 indexed!
  }

  // Creates a new Date from the data-* properties on a cell.
  function getDateFromCell(cell) {
    if (cell) {
      return copy(cell.getAttribute("data-year"), cell.getAttribute("data-month"), cell.getAttribute("data-date"));
    }

    return false;
  }

  // Generate data-attributes for date cells.
  function renderDateAttributes(dt) {
    return (
      'data-calc="' +
      getCalcForDate(dt) +
      '" ' +
      'data-day="' +
      dt.getDay() +
      '" ' +
      'data-date="' +
      dt.getDate() +
      '" ' +
      'data-month="' +
      dt.getMonth() +
      '" ' + // Note! This is 0 indexed!
      'data-year="' +
      dt.getFullYear() +
      '"'
    );
  }

  // Add cells for all dates. 'classifier' is an options aware function that assigns classes.
  function renderDatesInMonth(firstDayOfMonth, classifier) {
    var currentDate = getMonday(firstDayOfMonth);
    var html = "";

    for (var i = 0; i < 6; i++) {
      html += '<tr class="' + Classes.row + " " + Classes.week + '">';

      for (var j = 0; j < 7; j++) {
        html += "<td " + classifier(currentDate, firstDayOfMonth) + ">" + currentDate.getDate() + "</td>";
        currentDate.addDays(1);
      }

      html += "</tr>";
    }

    return html + "";
  }

  // Create a calendar element for a given date. index = 0 for first, 1 for second calendar.
  function build(dt, index, opt, paintPreviousMonth, paintNextMonth, classifier) {
    var element = document.createElement("div");
    var html = "";

    html += renderMonthHeader(dt, index, opt, paintPreviousMonth, paintNextMonth);

    html += '<table class="' + Classes.table + '">';

    html +=
      '<tr class="' +
      Classes.row +
      '">' +
      opt.dayNamesShort
        .map(function(a) {
          return '<th class="' + Classes.cell + " " + Classes.dayName + '">' + a + "</th>";
        })
        .join("") +
      "</tr>";

    html += renderDatesInMonth(dt, classifier);

    html += "</table>";

    element.className = Classes.calendar;
    element.innerHTML = html;

    return element;
  }

  // Test input[type="date"] support.
  function supportsInputTypeDate() {
    var input = document.createElement("input");
    input.setAttribute("type", "date");

    var notADateValue = "not-a-date";
    input.setAttribute("value", notADateValue);

    return input.value !== notADateValue;
  }

  // Variables global to Picker are UPPERCASED.
  function Picker(ROOT, options) {
    if (!ROOT) {
      throw new Error("noUiDatePicker requires a single element.");
    }

    if (!isValidDate(options.min) || !isValidDate(options.max)) {
      throw new Error("noUiDatePicker requires valid dates.");
    }

    // Copies of input with all time properties set to 0.
    var MIN = copy(options.min).null();
    var MAX = copy(options.max).null();

    // Current calendar date.
    var CURRENT = copy(MIN);

    // Set in 'handleClickOnValidCell'.
    // Set in 'handleEventWithActiveCell'.
    var ACTIVE_CELL = false;
    var START_CELL = false;
    var END_CELL = false;

    // Array of table cells
    // Set in 'markCellsBetweenClickedCells'.
    var BETWEEN_CELLS = false;

    // Whether the prev and next buttons do anything. Set in 'generateCalendarForCurrent'.
    var CAN_NEXT = true;
    var CAN_PREV = true;

    // Furthest visible calendar.
    var END_LIMIT = getEndLimit(copy(MAX));

    // Get the last \Date that can be set.
    function getEndLimit(dt) {
      dt.addMonths(-1);

      if (options.twoCalendars) {
        dt.addMonths(-1);
      }

      return dt;
    }

    // Generate list of classes for date cells.
    function classify(currentDate, firstDayOfMonth) {
      var classes = [Classes.cell, Classes.date];
      var valid = "true";
      var currentMonth = false;

      if (currentDate.getMonth() !== firstDayOfMonth.getMonth()) {
        classes.push(Classes.isOtherMonth);
        valid = "false";
      } else {
        classes.push(Classes.isCurrentMonth);
        currentMonth = true;
      }

      if (currentDate.getTime() === MIN.getTime()) {
        classes.push(Classes.isEdge);
        classes.push(Classes.isStart);
      } else if (currentDate < MIN) {
        valid = "false";
        classes.push(Classes.isOutside);
        classes.push(Classes.isBeforeStart);
      } else if (currentDate.getTime() === MAX.getTime()) {
        classes.push(Classes.isEdge);
        classes.push(Classes.isEnd);
      } else if (currentDate > MAX) {
        valid = "false";
        classes.push(Classes.isOutside);
        classes.push(Classes.isAfterEnd);
      } else if (currentMonth) {
        classes.push(Classes.isOk);
      }

      return renderDateAttributes(currentDate) + ' data-valid="' + valid + '" class="' + classes.join(" ") + '"';
    }

    // Read CURRENT, create a calendar. Binds click events to buttons.
    function generateCalendarForCurrent() {
      CURRENT.setDate(1);

      var currentCopy = copy(CURRENT);

      CAN_PREV = currentCopy >= MIN;
      CAN_NEXT = currentCopy <= END_LIMIT;

      clearClickedCells();

      ROOT.innerHTML = "";
      ROOT.appendChild(build(currentCopy, 0, options, CAN_PREV, CAN_NEXT, classify));

      if (options.twoCalendars) {
        ROOT.appendChild(build(currentCopy.addMonths(1), 1, options, CAN_PREV, CAN_NEXT, classify));
      }

      // Ignore CAN_PREV and CAN_NEXT, just check if there are buttons.
      var decrease = ROOT.querySelector("." + Classes.buttonDecrease);
      var increase = ROOT.querySelector("." + Classes.buttonIncrease);

      if (decrease) decrease.addEventListener("click", interfacePrev);
      if (increase) increase.addEventListener("click", interfaceNext);
    }

    // Clear ACTIVE_CELL, START_CELL, END_CELL and BETWEEN_CELLS.
    function clearClickedCells() {
      if (ACTIVE_CELL) {
        ACTIVE_CELL.removeAttribute("data-state");
      }

      if (START_CELL) {
        START_CELL.removeAttribute("data-state");
      }

      if (END_CELL) {
        END_CELL.removeAttribute("data-state");
      }

      if (BETWEEN_CELLS) {
        BETWEEN_CELLS.forEach(function(a) {
          a.removeAttribute("data-state");
        });
      }

      ACTIVE_CELL = false;
      START_CELL = false;
      END_CELL = false;
      BETWEEN_CELLS = false;
    }

    // Mark cells between START_CELL and END_CELL.
    function markCellsBetweenClickedCells(minCalcValue, maxCalcValue) {
      BETWEEN_CELLS = toArray(ROOT.querySelectorAll("." + Classes.date + "." + Classes.isCurrentMonth));

      BETWEEN_CELLS.forEach(function(tableCell) {
        var calcValue = Number(tableCell.getAttribute("data-calc"));

        if (calcValue > minCalcValue && calcValue < maxCalcValue) {
          tableCell.setAttribute("data-state", "between");
        }
      });
    }

    // Get date cell for a \Date.
    function getCellForDate(dt) {
      return ROOT.querySelector('[data-calc="' + getCalcForDate(dt) + '"][data-valid="true"]');
    }

    // Call function from options, if set. Does not emit browser events.
    function emitEvent(name) {
      if (options["on" + name]) {
        options["on" + name].call(API);
      }
    }

    // Handle click for a two calendar picker when a cell was already selected.
    function handleEventWithActiveCell(cell) {
      var activeCalcValue = Number(ACTIVE_CELL.getAttribute("data-calc"));
      var cellCalcValue = Number(cell.getAttribute("data-calc"));
      var order = activeCalcValue > cellCalcValue;

      markCellsBetweenClickedCells(Math.min(activeCalcValue, cellCalcValue), Math.max(activeCalcValue, cellCalcValue));

      START_CELL = order ? cell : ACTIVE_CELL;
      END_CELL = order ? ACTIVE_CELL : cell;
      ACTIVE_CELL = false;

      START_CELL.setAttribute("data-state", "start");
      END_CELL.setAttribute("data-state", "end");
    }

    // Depending on the state of the calendar (one or two, currently selected one or not), handle a cell click.
    function handleClickOnValidCell(cell, silent) {
      if (ACTIVE_CELL && options.twoCalendars) {
        handleEventWithActiveCell(cell);
      } else {
        clearClickedCells();
        cell.setAttribute("data-state", "pending");
        ACTIVE_CELL = cell;
      }

      if (!silent) {
        emitEvent("Select");
      }
    }

    // Determine whether a click target needs to trigger an action.
    function isValidCellTarget(target) {
      if (!target) return false;
      if (!target.hasAttribute("data-date")) return false;
      if (target.getAttribute("data-valid") === "false") return false;
      return true;
    }

    // Listen to click events without binding to every cell.
    function delegatedCellClick(event) {
      if (ACTIVE_CELL && event.target === ACTIVE_CELL) {
        event.stopPropagation();
        event.preventDefault();
        interfaceClear();
      } else if (isValidCellTarget(event.target)) {
        event.stopPropagation();
        event.preventDefault();
        handleClickOnValidCell(event.target);
      }
    }

    // Bind 'delegatedCellClick' to ROOT.
    function attachNodeEvents() {
      ROOT.addEventListener("click", delegatedCellClick);
    }

    // Should there be a 'previous' button to go to the previous month? *\Boolean
    function interfacePrev() {
      if (!CAN_PREV) return;
      CURRENT.addMonths(-1);
      generateCalendarForCurrent();
      emitEvent("Clear");
    }

    // Should there be a 'next' button to go to the next month? *\Boolean
    function interfaceNext() {
      if (!CAN_NEXT) return;
      CURRENT.addMonths(1);
      generateCalendarForCurrent();
      emitEvent("Clear");
    }

    // Get current state. *{ start: \Date|false, end: \Date|false, nights: \Number|false, days: \Number|false }
    function interfaceGet() {
      var s = getDateFromCell(START_CELL);
      var e = getDateFromCell(END_CELL);
      var nights = false;

      if (s && e) {
        nights = Math.round((e - s) / 86400000);
      }

      return {
        start: s || getDateFromCell(ACTIVE_CELL),
        end: e,
        nights: nights,
        days: nights ? nights + 1 : false
      };
    }

    // Limits \Date to MIN and MAX. Returns copy of input.
    function wrapOrCopy(dt) {
      if (dt < MIN) return copy(MIN);
      if (dt > MAX) return copy(MAX);
      return copy(dt);
    }

    // Set a date. *\Date
    function interfaceSet(dt) {
      // Entry of invalid date points to a bug elsewhere
      if (!isValidDate(dt)) {
        throw new Error("date not valid (" + dt + ")");
      }

      // Silently wrap to MIN and MAX
      dt = wrapOrCopy(dt);

      interfaceClear(true);

      if (options.twoCalendars && isSameMonth(dt, MAX)) {
        dt.addMonths(-1); // Modifies 'dt'
      }

      CURRENT = dt.null();

      generateCalendarForCurrent();
    }

    // Set a date cell to active. *\Date, [\Date], [\Boolean]
    function interfaceSelect(dtStart, dtEnd, silent) {
      dtStart = wrapOrCopy(dtStart);

      interfaceSet(dtStart);

      handleClickOnValidCell(getCellForDate(dtStart), true);

      if (dtEnd && options.twoCalendars) {
        handleClickOnValidCell(getCellForDate(wrapOrCopy(dtEnd)), true);
      }

      if (!silent) {
        emitEvent("Select");
      }
    }

    // Clear selected dates. *\Boolean
    function interfaceClear(silent) {
      clearClickedCells();

      if (!silent) {
        emitEvent("Clear");
      }
    }

    // Clears ROOT, unbinds events.
    function interfaceDestroy() {
      ROOT.removeEventListener("click", delegatedCellClick);
      ROOT.innerHTML = "";
    }

    // CURRENT is MIN by default.
    generateCalendarForCurrent();
    attachNodeEvents();

    var API = {
      prev: interfacePrev, // No Arguments. No operation if impossible. No return value. Emits 'Clear'.
      next: interfaceNext, // No Arguments. No operation if impossible. No return value. Emits 'Clear'.
      get: interfaceGet, // No Arguments. Returns { start: \Date|false, end: \Date|false, nights: \Number|false, days: \Number|false }. Does not emit.
      set: interfaceSet, // Argument \Date. Sets left-most calendar to month in which \Date lies. No return value. Does not emit.
      select: interfaceSelect, // Arguments \Date, [\Date, [\Boolean]]. Calls 'set' using first date. Selects first date.
      // If second date is passed, selects it and marks in between cells. Emits 'Select' unless \Boolean silent is true.
      clear: interfaceClear, // Argument \Boolean. Clears all selections. Emits 'Clear' unless \Boolean silent is true.
      destroy: interfaceDestroy // No Arguments. Empties ROOT. No return value. Does not emit.
    };

    return API;
  }

  // Expose tools
  Picker.prototype.pad = pad;
  Picker.prototype.copy = copy;
  Picker.prototype.isValidDate = isValidDate;

  // Set a class on the document for external use
  if (!supportsInputTypeDate()) {
    document.documentElement.classList.add("js-no-type-date-support");
  }

  // Expose Constructor
  return Picker;
});
