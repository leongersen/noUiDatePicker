(function (factory) {

    if ( typeof define === 'function' && define.amd ) {

        // AMD. Register as an anonymous module.
        define([], factory);

    } else if ( typeof exports === 'object' ) {

        // Node/CommonJS
        module.exports = factory();

    } else {

        // Browser globals
        window.Picker = factory();
    }

}(function( ){

	'use strict';

	Date.prototype.null = function ( ) {
		this.setHours(0,0,0,0);
		return this;
	};

	Date.prototype.addDays = function ( days ) {
		this.setDate(this.getDate() + days);
		return this;
	};

	Date.prototype.addMonths = function ( months ) {
		this.setMonth(this.getMonth() + months);
		return this;
	};

	Date.prototype.Ymd = function ( ) {
		return this.getFullYear() + '-' + pad(this.getMonth() + 1) + '-' + pad(this.getDate());
	};

	// if y = DateTime, copy it. Otherwise, create a new one from year, month, date
	function copy ( y, m, d ) {

		if ( y instanceof Date ) {
			d = y.getDate();
			m = y.getMonth();
			y = y.getFullYear();
		}

		return new Date(y,m,d,0,0,0,0);
	}

	// http://stackoverflow.com/questions/4156434/javascript-get-the-first-day-of-the-week-from-current-date
	function getMonday ( d ) {

		d = new Date(d);

		var day = d.getDay();
		var diff = d.getDate() - day + (day == 0 ? -6 : 1);

		return new Date(d.setDate(diff));
	}

	// Convert NodeList (or similar) to Array
	function toArray ( n ) {
		return Array.prototype.slice.call(n);
	}

	// Left pad
	function pad ( a ) {
		var str = String(a);
		var pad = '00';
		return pad.substring(0, pad.length - str.length) + str;
	}

	// Check is date is not NaN
	function isValidDate ( dt ) {
		return Object.prototype.toString.call(dt) === "[object Date]" && !isNaN(dt.getTime());
	}

	// Checks if month and year are the same
	function isSameMonth ( dt, dt2 ) {
		return dt.getMonth() === dt2.getMonth() && dt.getFullYear() === dt2.getFullYear();
	}

	// Generate month name and buttons
	function renderMonthHeader ( dt, index, opt, paintPreviousMonth, paintNextMonth ) {

		var html = '';

		// P
		paintPreviousMonth = paintPreviousMonth && (!index || !opt.twoCalendars);
		paintNextMonth = paintNextMonth && (index || !opt.twoCalendars);

		html += '<div class="month-header">';

		if ( paintPreviousMonth ) {
			html += '<div class="button decrease">' + opt.icon + '</div>';
		}

		html += '<div class="month-name">' + opt.monthNames[dt.getMonth()] + ' ' + dt.getFullYear() + '</div>';

		if ( paintNextMonth ) {
			html += '<div class="button increase">' + opt.icon + '</div>';
		}

		html += '</div>';

		return html;
	}

	// Unique ID for a date cell
	function getCalcForDate ( dt ) {
		return dt.getFullYear() + '' + pad(dt.getMonth()) + '' + pad(dt.getDate());
	}

	// Creates a new Date from the data-* properties on a cell
	function getDateFromCell ( cell ) {

		if ( cell ) {
			return copy(
				cell.getAttribute('data-year'),
				cell.getAttribute('data-month'),
				cell.getAttribute('data-date')
			);
		}

		return false;
	}

	// Generate data-attributes for date cells
	function renderDateAttributes ( dt ) {
		return 'data-calc="' + getCalcForDate(dt) + '" ' +
			'data-day="' + dt.getDay() + '" ' +
			'data-date="' + dt.getDate() + '" ' +
			'data-month="' + dt.getMonth() + '" ' +
			'data-year="' + dt.getFullYear() + '"';
	}

	// Add cells for all dates
	function renderDatesInMonth ( firstDayOfMonth, classifier ) {

		var currentDate = getMonday(firstDayOfMonth);
		var html = '';

		for ( var i = 0; i < 6; i++ ) {

			html += '<tr class="row week">';

			for ( var j = 0; j < 7; j++ ) {
				html += '<td ' + classifier(currentDate, firstDayOfMonth) +'>' + currentDate.getDate() + '</td>';
				currentDate.addDays(1);
			}

			html += '</tr>';
		}

		return html + '';
	}

	// Create a calendar element for a given date. index = 0 for first, 1 for second calendar.
	function build ( dt, index, opt, paintPreviousMonth, paintNextMonth, classifier ) {

		var element = document.createElement('div');
		var html = '';

		html += renderMonthHeader(dt, index, opt, paintPreviousMonth, paintNextMonth);

		html += '<table class="calendar-table">';

		html += '<tr class="calendar-row">' + opt.dayNamesShort.map(function( a ){
			return '<th class="calendar-cell day-name">' + a + '</th>';
		}).join('') + '</tr>';

		html += renderDatesInMonth(dt, classifier);

		html += '</table>';

		element.className = 'calendar';
		element.innerHTML = html;

		return element;
	}

	// Attach event to element, ignore null elements
	function addEventListener ( element, eventName, listener ) {
		if ( element ) {
			element.addEventListener(eventName, listener);
		}
	}

	// Test input[type="date"] support
	function supportsInputTypeDate ( ) {

		var input = document.createElement('input');
		input.setAttribute('type','date');

		var notADateValue = 'not-a-date';
		input.setAttribute('value', notADateValue);

		return input.value !== notADateValue;
	}

	// Variables global to Picker are UPPERCASED.
	function Picker ( ROOT, options ) {

		// Copies of input with all time properties set to 0
		var START = copy(options.start).null();
		var END = copy(options.end).null();

		// Current calendar date
		var CURRENT = copy(START);

		// TableCell
		// Set in 'handleClickOnValidCell';
		// Set in 'handleEventWithActiveCell';
		var ACTIVE_CELL = false;
		var START_CELL = false;
		var END_CELL = false;

		// Array of TableCell
		// Set in 'markCellsBetweenClickedCells';
		var BETWEEN_CELLS = false;

		// Whether the prev and next buttons do anything. Set in 'generateCalendarForCurrent';
		var CAN_NEXT = true;
		var CAN_PREV = true;

		// Furthest visible calendar
		var END_LIMIT = getEndLimit(copy(END));

		// Get the last \Date that can be set
		function getEndLimit ( dt ) {

			dt.addMonths(-1);

			if ( options.twoCalendars ) {
				dt.addMonths(-1);
			}

			return dt;
		}

		// Generate list of classes for date cells
		function classify ( currentDate, firstDayOfMonth ) {

			var classes = ['calendar-cell', 'date'];
			var valid = 'true';
			var currentMonth = false;

			if ( currentDate.getMonth() !== firstDayOfMonth.getMonth() ) {
				classes.push('is-other-month');
				valid = 'false';
			} else {
				classes.push('is-current-month');
				currentMonth = true;
			}

			if ( currentDate.getTime() === START.getTime() ) {
				classes.push('is-edge');
				classes.push('is-start');
			} else if ( currentDate < START ) {
				valid = 'false';
				classes.push('is-outside');
				classes.push('is-before-start');
			} else if ( currentDate.getTime() === END.getTime() ) {
				classes.push('is-edge');
				classes.push('is-end');
			} else if ( currentDate > END ) {
				valid = 'false';
				classes.push('is-outside');
				classes.push('is-after-end');
			} else if ( currentMonth ) {
				classes.push('is-ok');
			}

			return renderDateAttributes(currentDate) + ' data-valid="' + valid + '" class="' + classes.join(' ') + '"';
		}

		// Read CURRENT, create a calendar. Binds click events to buttons
		function generateCalendarForCurrent ( ) {

			CURRENT.setDate(1);

			var currentCopy = copy(CURRENT);

			CAN_PREV = currentCopy >= START;
			CAN_NEXT = currentCopy <= END_LIMIT;

			clearClickedCells();

			ROOT.innerHTML = '';
			ROOT.appendChild(build(currentCopy, 0, options, CAN_PREV, CAN_NEXT, classify));

			if ( options.twoCalendars ) {
				ROOT.appendChild(build(currentCopy.addMonths(1), 1, options, CAN_PREV, CAN_NEXT, classify));
			}

			addEventListener(ROOT.querySelector('.decrease'), 'click', interfacePrev);
			addEventListener(ROOT.querySelector('.increase'), 'click', interfaceNext);
		}

		// Clear ACTIVE_CELL, START_CELL, END_CELL and BETWEEN_CELLS
		function clearClickedCells ( ) {

			if ( ACTIVE_CELL ) {
				ACTIVE_CELL.removeAttribute('data-state');
			}

			if ( START_CELL ) {
				START_CELL.removeAttribute('data-state');
			}

			if ( END_CELL ) {
				END_CELL.removeAttribute('data-state');
			}

			if ( BETWEEN_CELLS ) {
				BETWEEN_CELLS.forEach(function(a){
					a.removeAttribute('data-state');
				});
			}

			ACTIVE_CELL = false;
			START_CELL = false;
			END_CELL = false;
			BETWEEN_CELLS = false;
		}

		// Mark cells between START_CELL and END_CELL
		function markCellsBetweenClickedCells ( minCalcValue, maxCalcValue ) {

			BETWEEN_CELLS = toArray(ROOT.querySelectorAll('.date.is-current-month'));

			BETWEEN_CELLS.forEach(function( tableCell ){

				var calcValue = Number(tableCell.getAttribute('data-calc'));

				if ( calcValue > minCalcValue && calcValue < maxCalcValue ) {
					tableCell.setAttribute('data-state', 'between');
				}
			});
		}

		// Get date cell for a \Date
		function getCellForDate ( dt ) {
			return ROOT.querySelector('[data-calc="' + getCalcForDate(dt) + '"][data-valid="true"]');
		}

		// Call function from options, if set. Does not emit browser events.
		function emitEvent ( name ) {
			if ( options['on' + name] ) {
				options['on' + name].call(API);
			}
		}

		function handleEventWithActiveCell ( cell ) {

			var activeCalcValue = Number(ACTIVE_CELL.getAttribute('data-calc'));
			var cellCalcValue = Number(cell.getAttribute('data-calc'));
			var order = activeCalcValue > cellCalcValue;

			markCellsBetweenClickedCells(
				Math.min(activeCalcValue, cellCalcValue),
				Math.max(activeCalcValue, cellCalcValue)
			);

			START_CELL = order ? cell : ACTIVE_CELL;
			END_CELL = order ? ACTIVE_CELL : cell;
			ACTIVE_CELL = false;

			START_CELL.setAttribute('data-state', 'start');
			END_CELL.setAttribute('data-state', 'end');
		}

		function handleClickOnValidCell ( cell, silent ) {

			if ( ACTIVE_CELL && options.range ) {
				handleEventWithActiveCell(cell);
			} else {
				clearClickedCells();
				cell.setAttribute('data-state', 'pending');
				ACTIVE_CELL = cell;
			}

			if ( !silent ) {
				emitEvent('Select');
			}
		}

		function isValidCellTarget ( target ) {
			if ( !target ) return false;
			if ( !target.hasAttribute('data-date') ) return false;
			if ( target.getAttribute('data-valid') === 'false' ) return false;
			return true;
		}

		function delegatedCellClick ( event ) {

			if ( ACTIVE_CELL && event.target === ACTIVE_CELL ) {
				event.stopPropagation();
				interfaceClear();
			}

			else if ( isValidCellTarget(event.target) ) {
				event.stopPropagation();
				handleClickOnValidCell(event.target);
			}
		}

		function attachNodeEvents ( ) {
			ROOT.addEventListener('click', delegatedCellClick);
		}

		function interfacePrev ( ) {
			if ( !CAN_PREV ) return;
			CURRENT.addMonths(-1);
			generateCalendarForCurrent();
			emitEvent('Select');
		}

		function interfaceNext ( ) {
			if ( !CAN_NEXT ) return;
			CURRENT.addMonths(1);
			generateCalendarForCurrent();
			emitEvent('Select');
		}

		function interfaceGet ( ) {

			var s = getDateFromCell(START_CELL);
			var e = getDateFromCell(END_CELL);
			var nights = false;

			if ( s && e ) {
				nights = Math.round((e - s) / 86400000);
			}

			return {
				start: s || getDateFromCell(ACTIVE_CELL),
				end: e,
				nights: nights,
				days: nights ? nights + 1 : false
			};
		}

		function interfaceSet ( dt ) {

			if ( !isValidDate(dt) || dt < START || dt > END ) {
				throw new Error('date not valid (' + dt + ')');
			}

			interfaceClear(true);

			if ( options.twoCalendars && isSameMonth(dt, END) ) {
				dt.addMonths(-1);
			}

			CURRENT = dt.null();

			generateCalendarForCurrent();
		}

		function interfaceSelect ( dtStart, dtEnd ) {

			interfaceSet(copy(dtStart));

			handleClickOnValidCell(getCellForDate(dtStart), true);

			if ( dtEnd && options.twoCalendars ) {
				handleClickOnValidCell(getCellForDate(dtEnd), true);
			}
		}

		function interfaceClear ( silent ) {
			clearClickedCells();

			if ( !silent ) {
				emitEvent('Clear');
			}
		}

		function interfaceDestroy ( ) {
			ROOT.innerHTML = '';
		}

		function interfaceIsTwoCalendars ( ) {
			return !!options.twoCalendars;
		}

		generateCalendarForCurrent();
		attachNodeEvents();

		var API = {
			prev: interfacePrev,
			next: interfaceNext,
			get: interfaceGet,
			set: interfaceSet,
			select: interfaceSelect,
			clear: interfaceClear,
			destroy: interfaceDestroy,
			isTwoCalendars: interfaceIsTwoCalendars
		};

		return API;
	}

	Picker.prototype.pad = pad;
	Picker.prototype.copy = copy;

	// Set a class on the document for external use
	if ( !supportsInputTypeDate() ) {
		document.documentElement.classList.add('js-no-type-date-support');
	}

	return Picker;

}));